import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Globe, Users, Lock, CheckCircle, X } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { updateUserProfile } from '@/services/userService';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const [visibility, setVisibility] = useState('friends');
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  useEffect(() => {
    if (visible) {
      if (userProfile?.is_public_profile === true) {
        setVisibility('public');
      } else if (userProfile?.is_public_profile === false) {
        setVisibility('private');
      } else {
        const saved =
          typeof localStorage !== 'undefined'
            ? localStorage.getItem('globalWorkoutVisibility')
            : null;
        if (saved) setVisibility(saved);
      }
    }
  }, [visible, userProfile?.is_public_profile]);

  const handleSave = async (val: string) => {
    setVisibility(val);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('globalWorkoutVisibility', val);
    }
    const isPublic = val === 'public';
    try {
      await updateUserProfile({ is_public_profile: isPublic });
      useAppStore.setState((state: any) => ({
        userProfile: state.userProfile
          ? { ...state.userProfile, is_public_profile: isPublic }
          : state.userProfile,
      }));
    } catch (e) {
      console.error('Error updating privacy profile:', e);
    }
    setTimeout(() => onClose(), 200);
  };

  const options = [
    {
      id: 'private',
      title: 'Perfil Privado',
      desc: 'Solo tus amigos ven tu actividad. Oculto en el ranking global.',
      icon: Lock,
    },
    {
      id: 'friends',
      title: 'Solo Amigos',
      desc: 'Tus entrenamientos solo son visibles para amigos agregados.',
      icon: Users,
    },
    {
      id: 'public',
      title: 'Perfil Público',
      desc: 'Apareces en el ranking global y cualquier atleta puede ver tu perfil.',
      icon: Globe,
    },
  ];

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            position: 'absolute',
            top: 8,
            right: 20,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 20,
            borderCurve: 'continuous',
            backgroundColor: colors.tint + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Globe size={30} color={colors.tint} />
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: isIOS ? '700' : '800',
            color: colors.text,
            marginBottom: 6,
            letterSpacing: -0.4,
          }}
        >
          Privacidad del Muro
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 16,
            lineHeight: 20,
          }}
        >
          ¿Quién puede ver tus entrenamientos al finalizarlos?
        </Text>
      </View>

      {/* Options */}
      <View style={{ paddingHorizontal: 22, paddingBottom: 16, gap: 10 }}>
        {options.map(opt => {
          const isSelected = visibility === opt.id;
          const Icon = opt.icon;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSave(opt.id)}
              activeOpacity={0.75}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 15,
                  borderRadius: 18,
                  borderCurve: 'continuous',
                  borderWidth: isIOS && !isSelected ? 0 : isSelected ? 1.5 : 1,
                  borderColor: isSelected
                    ? colors.tint + '60'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.12)'
                      : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: isSelected
                    ? colors.tint + '18'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(255, 255, 255, 0.60)',
                },
                !isSelected && getAppleSheetCardStyle(isDark, 18),
              ]}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 13,
                  backgroundColor: isSelected
                    ? colors.tint + '20'
                    : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 14,
                }}
              >
                <Icon size={20} color={isSelected ? colors.tint : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: isSelected ? colors.tint : colors.text,
                    marginBottom: 2,
                  }}
                >
                  {opt.title}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                  {opt.desc}
                </Text>
              </View>
              {isSelected && (
                <CheckCircle size={20} color={colors.tint} style={{ marginLeft: 10 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </SwipeableBottomSheet>
  );
}
