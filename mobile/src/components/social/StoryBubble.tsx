import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { SocialUserAvatar } from './SocialUserAvatar';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastTextColor } from '@/utils/routineHelpers';

interface StoryBubbleProps {
  user: {
    username?: string;
    profile_image_url?: string | null;
    avatar?: string | null;
  };
  isMe?: boolean;
  hasStories?: boolean;
  hasUnseen?: boolean;
  onClick: () => void;
  onAdd?: () => void;
}

export function StoryBubble({
  user,
  isMe = false,
  hasStories = false,
  hasUnseen = false,
  onClick,
  onAdd,
}: StoryBubbleProps) {
  const colors = useAppColors();

  const displayName = isMe
    ? 'Tu historia'
    : (user.username || 'Usuario').split('@')[0].split(' ')[0];

  const ringColor = hasStories
    ? (hasUnseen ? colors.tint : colors.border)
    : 'transparent';

  const plusTextColor = getContrastTextColor(colors.tint);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onClick}
      style={styles.container}
    >
      <View
        style={[
          styles.avatarWrapper,
          {
            borderColor: ringColor,
            borderWidth: hasStories ? 2.5 : 0,
            padding: hasStories ? 2 : 0,
          },
        ]}
      >
        <SocialUserAvatar user={user} size={58} />

        {isMe && onAdd && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            style={[
              styles.plusButton,
              {
                backgroundColor: colors.tint,
                borderColor: colors.background,
              },
            ]}
          >
            <Plus size={13} color={plusTextColor} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <Text
        numberOfLines={1}
        style={[
          styles.name,
          {
            color: hasUnseen ? colors.text : colors.textSecondary,
            fontWeight: hasUnseen ? '700' : '500',
          },
        ]}
      >
        {displayName}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: 72,
    marginRight: 10,
  },
  avatarWrapper: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  plusButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 70,
  },
});
