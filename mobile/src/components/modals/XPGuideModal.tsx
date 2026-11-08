import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
} from 'react-native';
import { X, Star, Shield, Info, Flame, Trophy, Award, CheckCircle } from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import LevelBadge from '@/components/LevelBadge';

interface XPGuideModalProps {
  visible: boolean;
  targetDays?: number;
  onClose: () => void;
}

const rankPreviews = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export function XPGuideModal({
  visible,
  targetDays = 3,
  onClose,
}: XPGuideModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentText = getContrastColor(colors.tint, theme);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          <View
            style={[
              styles.card,
              {
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                maxHeight: '85%',
              },
            ]}
          >
            <GlassView
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 32 }]}
            />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={[styles.iconWrap, { backgroundColor: colors.tint }]}>
                  <Star size={20} color={accentText} fill={accentText} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Sistema XP y Rangos</Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Escudo de Racha Card */}
              <View style={[styles.banner, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '30' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={[styles.shieldBadge, { backgroundColor: colors.tint }]}>
                    <Shield size={18} color={accentText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.bannerTitle, { color: colors.text }]}>🛡️ Escudo de Racha Semanal</Text>
                    <Text style={[styles.bannerDesc, { color: colors.textSecondary }]}>
                      Completa tu meta de <Text style={{ fontWeight: '800', color: colors.text }}>{targetDays} {targetDays === 1 ? 'día' : 'días'} de entrenamiento</Text> esta semana para activar el escudo y blindar tu racha el resto de la semana.
                    </Text>
                    <Text style={[styles.bannerDesc, { color: colors.textSecondary, marginTop: 4 }]}>
                      Además, los fines de semana y descansos biológicos están siempre protegidos.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Jerarquía de Rangos */}
              <View style={[styles.sectionCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <View style={[styles.miniBadge, { backgroundColor: colors.tint }]}>
                    <Trophy size={14} color={accentText} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>JERARQUÍA DE RANGOS</Text>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                  {rankPreviews.map(lvl => (
                    <View
                      key={lvl}
                      style={[
                        styles.rankItem,
                        {
                          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                        },
                      ]}
                    >
                      <LevelBadge level={lvl} bgTheme={isDark ? '#111111' : '#FFFFFF'} />
                      <Text style={[styles.rankLevel, { color: colors.text }]}>Nv. {lvl}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>

              {/* Acciones para ganar XP */}
              <View style={{ gap: 8, marginTop: 12 }}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginBottom: 4 }]}>ACCIONES QUE DAN XP</Text>
                
                {[
                  { title: 'Completar entrenamiento', xp: '+100 XP', desc: 'Por cada sesión guardada en la app' },
                  { title: 'Nuevo récord personal (PR)', xp: '+50 XP', desc: 'Superar tu mejor marca en cualquier ejercicio' },
                  { title: 'Mantener la racha activa', xp: '+30 XP', desc: 'Constancia diaria en tus entrenos' },
                  { title: 'Registrar nutrición y agua', xp: '+15 XP', desc: 'Completar tus macros diarios y consumo de agua' },
                  { title: 'Registrar peso corporal', xp: '+10 XP', desc: 'Mantener tu peso actualizado en la báscula' },
                ].map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.actionRow,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.actionTitle, { color: colors.text }]}>{item.title}</Text>
                      <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                    </View>
                    <View style={[styles.xpCapsule, { backgroundColor: colors.tint + '20' }]}>
                      <Text style={[styles.xpCapsuleText, { color: colors.tint }]}>{item.xp}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </GlassView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  banner: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  shieldBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerDesc: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  miniBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  rankItem: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  rankLevel: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  xpCapsule: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  xpCapsuleText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
