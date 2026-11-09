import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Sparkles, X, Zap, Clock, ShieldCheck } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassButton } from '@/components/ui/GlassButton';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

interface AiInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AiInfoModal({ visible, onClose }: AiInfoModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const gamification = useAppStore(state => state.gamification) || {};
  const aiLimit = gamification.ai_queries_limit || 5;
  const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!visible) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      try {
        const options = {
          timeZone: 'Europe/Madrid',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const s = parseInt(parts.find(p => p.type === 'second')?.value || '0');

        const diffMs = 24 * 3600 * 1000 - (h * 3600 + m * 60 + s) * 1000;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      } catch (e) {
        setTimeLeft('0h 0m');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [visible]);

  const isAILimitReached = aiRemaining === 0;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
    >
      {/* Header Centered */}
      <View style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16, alignItems: 'center' }}>
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 20,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
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
          <Sparkles size={30} color={colors.tint} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: isIOS ? '700' : '800',
            letterSpacing: -0.4,
            color: colors.text,
            marginBottom: 6,
          }}
        >
          Entrenador IA
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            paddingHorizontal: 16,
          }}
        >
          Sistema de Créditos de Pro-Fitness Glass
        </Text>
      </View>

      {/* Contenido */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View
            style={[
              {
                flex: 1,
                alignItems: 'center',
                padding: 16,
                borderRadius: 18,
                borderCurve: 'continuous',
                borderWidth: isIOS ? 0 : 1,
                backgroundColor: isAILimitReached ? '#ef444415' : colors.tint + '15',
                borderColor: isAILimitReached ? '#ef444450' : colors.border,
              },
              !isAILimitReached && getAppleSheetCardStyle(isDark, 18),
            ]}
          >
            <Zap
              size={20}
              color={isAILimitReached ? '#ef4444' : colors.tint}
              style={{ marginBottom: 6 }}
            />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.4,
                marginBottom: 4,
                color: colors.textSecondary,
              }}
            >
              USOS RESTANTES
            </Text>
            <Text
              style={{
                fontSize: 24,
                fontWeight: '800',
                color: isAILimitReached ? '#ef4444' : colors.text,
              }}
            >
              {aiRemaining} <Text style={{ fontSize: 14, opacity: 0.5 }}>/ {aiLimit}</Text>
            </Text>
          </View>

          <View
            style={[
              {
                flex: 1,
                alignItems: 'center',
                padding: 16,
                borderRadius: 18,
                borderCurve: 'continuous',
                borderWidth: isIOS ? 0 : 1,
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderColor: colors.border,
              },
              getAppleSheetCardStyle(isDark, 18),
            ]}
          >
            <Clock size={20} color={colors.textSecondary} style={{ marginBottom: 6 }} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.4,
                marginBottom: 4,
                color: colors.textSecondary,
              }}
            >
              SE RECARGA EN
            </Text>
            <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 4, color: colors.text }}>
              {timeLeft}
            </Text>
          </View>
        </View>

        {/* Badge Informativo */}
        <View
          style={[
            {
              flexDirection: 'row',
              padding: 16,
              borderRadius: 18,
              borderCurve: 'continuous',
              borderWidth: isIOS ? 0 : 1,
              marginBottom: 20,
              gap: 12,
              backgroundColor: colors.tint + '15',
              borderColor: colors.border,
            },
            getAppleSheetCardStyle(isDark, 18),
          ]}
        >
          <ShieldCheck size={20} color={colors.tint} style={{ marginTop: 2 }} />
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.textSecondary }}>
            El servicio es 100% gratuito. Los límites nos ayudan a mantener los servidores
            funcionando para toda la comunidad.
          </Text>
        </View>

        {/* Botón Cerrar */}
        <GlassButton
          theme={theme}
          color={colors.tint}
          noShadow
          onPress={onClose}
          style={{ width: '100%', height: 50, borderRadius: 16 }}
        >
          <Text
            style={{
              color: isIOS ? colors.tint : getContrastColor(colors.tint, theme),
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            Entendido
          </Text>
        </GlassButton>
      </View>
    </SwipeableBottomSheet>
  );
}
