import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Globe, Lock, Check, X, Settings } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

interface PrivacyBannerProps {
  privacy: 'public' | 'private';
  onNavigate: () => void;
}

export function PrivacyBanner({ privacy, onNavigate }: PrivacyBannerProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isPublic = privacy === 'public';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isPublic ? colors.tint + '50' : colors.border,
          borderWidth: 1,
        },
      ]}
    >
      <GlassView
        glassEffectStyle="regular"
        colorScheme={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Left Icon Badge */}
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: isPublic ? colors.tint : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'),
            },
          ]}
        >
          {isPublic ? <Globe size={24} color="#ffffff" /> : <Lock size={24} color={colors.textSecondary} />}
        </View>

        {/* Text and Description */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.title,
              { color: isPublic ? colors.tint : colors.text },
            ]}
          >
            {isPublic ? 'Tu perfil es Público' : 'Tu perfil es Privado'}
          </Text>

          <View style={styles.description}>
            {isPublic ? (
              <>
                <Text style={[styles.descText, { color: colors.textSecondary }]}>
                  Actualmente <Text style={{ fontWeight: '700', color: colors.text }}>todo el mundo puede ver tu perfil</Text> y estadísticas.
                </Text>
                <View style={styles.bulletRow}>
                  <Check size={14} color={colors.tint} style={{ marginRight: 6 }} />
                  <Text style={[styles.descText, { color: colors.textSecondary }]}>
                    Apareces en el <Text style={{ fontWeight: '700', color: colors.text }}>Ranking Global</Text> y búsquedas.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.descText, { color: colors.textSecondary }]}>
                  Actualmente <Text style={{ fontWeight: '700', color: colors.text }}>solo tus amigos</Text> pueden ver tu actividad.
                </Text>
                <View style={styles.bulletRow}>
                  <X size={14} color="#ef4444" style={{ marginRight: 6 }} />
                  <Text style={[styles.descText, { color: colors.textSecondary }]}>
                    <Text style={{ fontWeight: '700', color: colors.text }}>No apareces</Text> en el Ranking Global ni en búsquedas.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={onNavigate}
            activeOpacity={0.8}
            style={[
              styles.button,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                borderColor: colors.border,
              },
            ]}
          >
            <Settings size={15} color={colors.text} style={{ marginRight: 6 }} />
            <Text style={[styles.buttonText, { color: colors.text }]}>
              Cambiar configuración
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  content: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  description: {
    gap: 4,
    marginBottom: 12,
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
