import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { User } from 'lucide-react-native';
import { BACKEND_BASE_URL } from '@/services/apiClient';
import { useAppColors } from '@/hooks/useAppColors';

interface SocialUserAvatarProps {
  user?: {
    username?: string;
    name?: string;
    profile_image_url?: string | null;
    avatar?: string | null;
  } | null;
  size?: number;
  style?: any;
}

export function SocialUserAvatar({ user, size = 44, style }: SocialUserAvatarProps) {
  const colors = useAppColors();
  const [hasError, setHasError] = useState(false);

  const rawPath = user?.profile_image_url || user?.avatar;
  let imageUrl: string | null = null;

  if (rawPath) {
    if (rawPath.startsWith('http') || rawPath.startsWith('blob:')) {
      imageUrl = rawPath;
    } else {
      const cleanPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
      imageUrl = `${BACKEND_BASE_URL}${cleanPath}`;
    }
  }

  const displayName = user?.username || user?.name || 'U';
  const initial = displayName.replace('@', '').charAt(0).toUpperCase() || 'U';

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { backgroundColor: colors.tint + '20', borderColor: colors.border },
        style,
      ]}
    >
      {!hasError && imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={containerStyle}
          resizeMode="cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          {size < 28 ? (
            <User size={size * 0.55} color={colors.textSecondary} />
          ) : (
            <Text
              style={{
                fontSize: Math.round(size * 0.42),
                fontWeight: '800',
                color: colors.tint,
              }}
            >
              {initial}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
