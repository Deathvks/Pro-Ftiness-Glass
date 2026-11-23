import React, { useState, type ReactNode } from 'react';
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { Colors, getThemeBaseBackground, type ThemeColor } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import { selectHasUnseenStory } from '@/store/storySlice';
import { useAppColors } from '@/hooks/useAppColors';
import { getUserRoleRingConfig, type RoleUser } from '@/utils/userRoleUtils';

export type AvatarUser = RoleUser & {
  username?: string;
  name?: string;
  profile_image_url?: string | null;
  profile_image?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
};

type AvatarRingProps = {
  user?: AvatarUser | null;
  size?: number;
  gapColor?: string;
  style?: StyleProp<ViewStyle>;
  showStoryIndicator?: boolean;
};

const START = { x: 0, y: 1 };
const END = { x: 1, y: 0 };

export function UserRoleAvatarRing({ user, size = 44, gapColor, style, children, showStoryIndicator = true }: AvatarRingProps & { children: React.ReactNode }) {
  const role = useAppStore(state => getUserRoleRingConfig(user, state.userProfile));
  const themeBackground = useAppStore(state => getThemeBaseBackground(state.theme));
  const unseen = useAppStore(state => showStoryIndicator && selectHasUnseenStory(state, user?.id));
  const { tint } = useAppColors();
  const ring = size >= 80 ? 3.5 : size >= 36 ? 2 : 1.5;
  const gap = size >= 80 ? 2.5 : size >= 36 ? 1.5 : 1;
  const storyBorder = unseen ? (size >= 80 ? 3 : 2) : 0;
  const inset = unseen ? storyBorder + gap : 0;
  const radius = size / 2 - inset;

  return (
    <View style={[{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      borderWidth: storyBorder, borderColor: tint, padding: unseen ? gap : 0,
    }, style]}>
      <LinearGradient colors={role.colors} start={START} end={END}
        style={[styles.fill, { borderRadius: radius, padding: ring, overflow: 'hidden' }]}>
        <View style={[styles.fill, { borderRadius: radius - ring, backgroundColor: gapColor ?? themeBackground, padding: gap }]}>
          <View style={[styles.fill, styles.photo, { borderRadius: radius - ring - gap }]}>{children}</View>
        </View>
      </LinearGradient>
    </View>
  );
}

export const SocialUserAvatar = React.memo(function SocialUserAvatar({
  user, size = 44, gapColor, style, fallbackSource, showStoryIndicator = true, openStoryOnPress = true,
}: AvatarRingProps & { fallbackSource?: number; openStoryOnPress?: boolean }) {
  const colors = useAppStore(state => Colors[state.theme as ThemeColor] ?? Colors.dark);
  const canOpenStory = useAppStore(state => openStoryOnPress && showStoryIndicator && selectHasUnseenStory(state, user?.id));
  const raw = [user?.profile_image_url, user?.avatar, user?.profile_image, user?.avatar_url]
    .find(value => value && value !== 'null');
  const uri = raw && (/^(?:https?:|blob:|data:|file:|content:)/i.test(raw)
    ? raw : BACKEND_BASE_URL + (raw.startsWith('/') ? raw : '/' + raw));

  const avatar = (
    <UserRoleAvatarRing user={user} size={size} gapColor={gapColor} style={style} showStoryIndicator={showStoryIndicator}>
      <AvatarPicture key={uri ?? ''} uri={uri || undefined} fallbackSource={fallbackSource}>
        <View style={[StyleSheet.absoluteFill, styles.placeholder, { backgroundColor: colors.card }]}>
          <User size={Math.round(size * 0.48)} color={colors.textSecondary} />
        </View>
      </AvatarPicture>
    </UserRoleAvatarRing>
  );
  if (!canOpenStory) return avatar;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver historia de ${user?.username || user?.name || 'este usuario'}`}
      onPress={event => {
        event.stopPropagation();
        useAppStore.getState().openStory(user?.id);
      }}>
      {avatar}
    </Pressable>
  );
});

function AvatarPicture({ uri, fallbackSource, children }: { uri?: string; fallbackSource?: number; children: ReactNode }) {
  const [failed, setFailed] = useState(false);
  const source = uri && !failed ? { uri } : fallbackSource;
  if (!source) return <>{children}</>;
  return <Image source={source} contentFit="cover" style={StyleSheet.absoluteFill} onError={() => setFailed(true)} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  photo: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
