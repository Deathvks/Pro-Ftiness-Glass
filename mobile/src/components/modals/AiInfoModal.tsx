import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Sparkles, X, Zap, Clock, Info, ShieldCheck } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AiInfoModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AiInfoModal({ visible, onClose }: AiInfoModalProps) {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme as keyof typeof Colors] || Colors.oled;
  
  const gamification = useAppStore(state => state.gamification) || {};
  const aiLimit = gamification.ai_queries_limit || 5;
  const aiRemaining = gamification.ai_queries_remaining ?? aiLimit;

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!visible) return;
    
    const calculateTimeLeft = () => {
      const now = new Date();
      // Forma aproximada nativa de calcular la hora de Madrid si el dispositivo no está en España:
      // Usamos el UTC y sumamos offset. Madrid es UTC+1 en invierno, UTC+2 en verano.
      // Para simplificar, usaremos la lógica local o intentaremos Intl.DateTimeFormat
      let madridTime;
      try {
        const options = { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false } as const;
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const parts = formatter.formatToParts(now);
        const h = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
        const m = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
        const s = parseInt(parts.find(p => p.type === 'second')?.value || '0');
        
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);
        
        // Calcular tiempo restante basado en la hora actual de Madrid
        const diffMs = (24 * 3600 * 1000) - ((h * 3600 + m * 60 + s) * 1000);
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      } catch (e) {
        // Fallback genérico
        setTimeLeft('Próximamente');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [visible]);

  const isAILimitReached = aiRemaining === 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <GlassView 
        glassEffectStyle="regular"
        colorScheme={theme === 'oled' ? 'dark' : (['light', 'ocean', 'desert'].includes(theme)) ? 'light' : 'dark'}
        style={StyleSheet.absoluteFill}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable 
            style={[styles.modalContainer, { backgroundColor: colors.card, borderColor: colors.border }]} 
            onPress={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                  <Sparkles size={24} color="#fff" />
                </View>
                <View>
                  <Text style={[styles.title, { color: colors.text }]}>Entrenador IA</Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sistema de Créditos</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: ['light', 'ocean', 'desert'].includes(theme) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)' }]}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Contenido */}
            <View style={styles.statsContainer}>
              <View style={[styles.statBox, { backgroundColor: isAILimitReached ? '#ef444420' : colors.tint + '15', borderColor: colors.border }]}>
                <Zap size={20} color={isAILimitReached ? '#ef4444' : colors.tint} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>USOS RESTANTES</Text>
                <Text style={[styles.statValue, { color: isAILimitReached ? '#ef4444' : colors.text }]}>
                  {aiRemaining} <Text style={{ fontSize: 14, opacity: 0.5 }}>/ {aiLimit}</Text>
                </Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: ['light', 'ocean', 'desert'].includes(theme) ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.05)', borderColor: colors.border }]}>
                <Clock size={20} color={colors.textSecondary} style={{ marginBottom: 4 }} />
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>SE RECARGA EN</Text>
                <Text style={[styles.statValue2, { color: colors.text }]}>{timeLeft}</Text>
              </View>
            </View>

            {/* Explicación */}
            <View style={styles.infoSection}>
              <View style={styles.infoHeader}>
                <Info size={16} color={colors.tint} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>¿Cómo funciona?</Text>
              </View>
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• La IA genera rutinas personalizadas y analiza tus entrenamientos al instante.</Text>
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Debido a los altos costes de procesamiento, cada usuario tiene un límite de <Text style={{ fontWeight: 'bold' }}>{aiLimit} usos diarios</Text>.</Text>
              <Text style={[styles.bulletText, { color: colors.textSecondary }]}>• Tus créditos se restauran automáticamente todos los días a la <Text style={{ fontWeight: 'bold' }}>medianoche</Text> (Hora de España).</Text>
            </View>

            {/* Badge Informativo */}
            <View style={[styles.badge, { backgroundColor: colors.tint + '15', borderColor: colors.border }]}>
              <ShieldCheck size={20} color={colors.tint} style={{ marginTop: 2 }} />
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                El servicio es 100% gratuito. Los límites nos ayudan a mantener los servidores funcionando para toda la comunidad.
              </Text>
            </View>

            {/* Botón Cerrar */}
            <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.tint }]} onPress={onClose}>
              <Text style={styles.submitButtonText}>Entendido</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  statValue2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoSection: {
    marginBottom: 24,
    gap: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
  },
  badge: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  badgeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  submitButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
