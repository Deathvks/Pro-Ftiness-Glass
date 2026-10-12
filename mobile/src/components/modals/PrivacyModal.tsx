import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { Globe, Users, Lock, CheckCircle, X } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { updateUserProfile } from '@/services/userService';

export function PrivacyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const userProfile = useAppStore(state => state.userProfile);
  const [visibility, setVisibility] = useState('friends');

  useEffect(() => {
    if (visible) {
      if (userProfile?.is_public_profile === true) {
        setVisibility('public');
      } else if (userProfile?.is_public_profile === false) {
        setVisibility('private');
      } else {
        const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('globalWorkoutVisibility') : null;
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
        userProfile: state.userProfile ? { ...state.userProfile, is_public_profile: isPublic } : state.userProfile,
      }));
    } catch (e) {
      console.error('Error updating privacy profile:', e);
    }
    setTimeout(() => onClose(), 200);
  };

  const options = [
    { id: 'private', title: 'Perfil Privado', desc: 'Solo tus amigos ven tu actividad. Oculto en el ranking global.', icon: Lock },
    { id: 'friends', title: 'Solo Amigos', desc: 'Tus entrenamientos solo son visibles para amigos agregados.', icon: Users },
    { id: 'public', title: 'Perfil Público', desc: 'Apareces en el ranking global y cualquier atleta puede ver tu perfil.', icon: Globe },
  ];

  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          },
        ]}
        onPress={onClose}
      >
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
          <View 
            style={{
              width: '100%',
              backgroundColor: isDark ? 'rgba(24, 24, 28, 0.82)' : 'rgba(255, 255, 255, 0.88)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.90)',
              borderWidth: 1.2,
              borderRadius: 32,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 28,
              elevation: 12,
            }}
          >
            <GlassView 
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={{ padding: 24, paddingBottom: 16, alignItems: 'center' }}>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  backgroundColor: colors.tint + '18',
                  borderWidth: 1.5,
                  borderColor: colors.tint + '35',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Globe size={32} color={colors.tint} />
              </View>

              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 8, letterSpacing: -0.4 }}>
                Privacidad del Muro
              </Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16, lineHeight: 20 }}>
                ¿Quién puede ver tus entrenamientos al finalizarlos?
              </Text>
            </View>

            {/* Options */}
            <View style={{ padding: 24, paddingTop: 8, gap: 12 }}>
              {options.map((opt) => {
                const isSelected = visibility === opt.id;
                const Icon = opt.icon;
                return (
                  <TouchableOpacity 
                    key={opt.id} 
                    onPress={() => handleSave(opt.id)}
                    activeOpacity={0.75}
                    style={{ 
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: 20,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected
                        ? colors.tint + '60'
                        : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)'),
                      backgroundColor: isSelected
                        ? (colors.tint + '18')
                        : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.60)'),
                    }}
                  >
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: isSelected ? colors.tint + '20' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <Icon size={20} color={isSelected ? colors.tint : colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: isSelected ? colors.tint : colors.text, marginBottom: 2 }}>
                        {opt.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 16 }}>
                        {opt.desc}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle size={20} color={colors.tint} style={{ marginLeft: 10 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}


