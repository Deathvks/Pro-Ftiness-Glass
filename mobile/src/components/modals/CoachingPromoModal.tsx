import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Activity, ClipboardList, MessageCircle, Star } from 'lucide-react-native';

import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getContrastTextColor } from '@/utils/colorUtils';

interface CoachingPromoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CoachingPromoModal({ visible, onClose }: CoachingPromoModalProps) {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const contrastText = getContrastTextColor(colors.tint);

  if (!visible) return null;

  const features = [
    {
      icon: ClipboardList,
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.14)',
      title: 'Rutinas a tu medida',
      desc: 'Tu entrenador personal te asignará planes específicos que aparecerán directamente en tu perfil.',
    },
    {
      icon: Activity,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.14)',
      title: 'Seguimiento en tiempo real',
      desc: 'El entrenador revisará tus registros, pesos levantados y tu progreso al instante.',
    },
    {
      icon: MessageCircle,
      color: '#a855f7',
      bg: 'rgba(168, 85, 247, 0.14)',
      title: 'Chat Directo 24/7',
      desc: 'Habla con tu entrenador por el chat integrado para resolver dudas o ajustar tus planes al instante.',
    },
  ];

  return (
    <SwipeableBottomSheet visible={visible} onClose={onClose} isDark={isDark} scrollable maxHeight="88%">
      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.starBadge, { backgroundColor: colors.tint + '1A' }]}>
            <Star size={30} color={colors.tint} fill={colors.tint} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Asesoría <Text style={{ color: colors.tint }}>Personalizada</Text>
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tu entrenador personal profesional, directamente en la app.
          </Text>
        </View>

        <View style={styles.list}>
          {features.map(f => {
            const Icon = f.icon;
            return (
              <View key={f.title} style={[styles.card, getAppleSheetCardStyle(isDark, 22, theme)]}>
                <View style={[styles.iconBox, { backgroundColor: f.bg }]}>
                  <Icon size={22} color={f.color} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.featTitle, { color: colors.text }]}>{f.title}</Text>
                  <Text style={[styles.featDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onClose}
          style={[styles.ctaBtn, { backgroundColor: colors.tint }]}
        >
          <Text style={[styles.ctaText, { color: contrastText }]}>¡Entendido!</Text>
        </TouchableOpacity>
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, gap: 16 },
  hero: { alignItems: 'center', gap: 10 },
  starBadge: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center' },
  subtitle: { fontSize: 13.5, fontWeight: '500', textAlign: 'center' },
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featTitle: { fontSize: 15, fontWeight: '800' },
  featDesc: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  ctaBtn: { paddingVertical: 15, borderRadius: 18, alignItems: 'center', marginTop: 4 },
  ctaText: { fontSize: 15.5, fontWeight: '800' },
});

export default CoachingPromoModal;
