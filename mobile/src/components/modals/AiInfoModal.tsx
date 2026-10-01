import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Sparkles, X, Zap, Clock, ShieldCheck } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AiInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AiInfoModal({ visible, onClose }: AiInfoModalProps) {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  
  const gamification = useAppStore(state => state.gamification) || {};
  const aiLimit = gamification.ai_queries_limit || 5;
  const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!visible) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      let madridTime;
      try {
        const options = { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const s = parseInt(parts.find(p => p.type === 'second')?.value || '0');
        
        const diffMs = (24 * 3600 * 1000) - ((h * 3600 + m * 60 + s) * 1000);
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', padding: 20 }]} onPress={onClose}>
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
            <GlassView 
              glassEffectStyle="regular"
              colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'}
              style={{ width: '100%', backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, borderRadius: 32, overflow: 'hidden' }}
            >
              {/* Header Centered */}
              <View style={{ padding: 24, paddingBottom: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.tint + '15', borderWidth: 2, borderColor: colors.tint + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Sparkles size={32} color={getContrastColor(colors.tint, theme)} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Entrenador IA</Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>Sistema de Créditos de Pro-Fitness Glass</Text>
              </View>

              {/* Contenido */}
              <View style={{ padding: 24, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                  <View style={{ flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: isAILimitReached ? '#ef444415' : colors.tint + '15', borderColor: isAILimitReached ? '#ef444450' : colors.border }}>
                    <Zap size={20} color={isAILimitReached ? '#ef4444' : getContrastColor(colors.tint, theme)} style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>USOS RESTANTES</Text>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: isAILimitReached ? '#ef4444' : colors.text }}>
                      {aiRemaining} <Text style={{ fontSize: 14, opacity: 0.5 }}>/ {aiLimit}</Text>
                    </Text>
                  </View>

                  <View style={{ flex: 1, alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, backgroundColor: ['light', 'ocean', 'desert'].includes(theme) ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.border }}>
                    <Clock size={20} color={colors.textSecondary} style={{ marginBottom: 4 }} />
                    <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4, color: colors.textSecondary }}>SE RECARGA EN</Text>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginTop: 4, color: colors.text }}>{timeLeft}</Text>
                  </View>
                </View>

                {/* Badge Informativo */}
                <View style={{ flexDirection: 'row', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 24, gap: 12, backgroundColor: colors.tint + '15', borderColor: colors.border }}>
                  <ShieldCheck size={20} color={getContrastColor(colors.tint, theme)} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary }}>
                    El servicio es 100% gratuito. Los límites nos ayudan a mantener los servidores funcionando para toda la comunidad.
                  </Text>
                </View>

                {/* Botón Cerrar */}
                <TouchableOpacity style={{ width: '100%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.border }} onPress={onClose}>
                  <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                  <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint, opacity: 0.25 }]} />
                  <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>Entendido</Text>
                </TouchableOpacity>
              </View>

            </GlassView>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
}




