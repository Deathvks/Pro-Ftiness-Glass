/* mobile/src/components/modals/RoutineShareSettingsModal.tsx */
import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, 
  Alert, Share as NativeShare 
} from 'react-native';
import { Share2, Lock, Users, Globe, CheckCircle, Copy, Link2, X } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassView } from 'expo-glass-effect';
import { GlassButton } from '@/components/ui/GlassButton';

interface RoutineShareSettingsModalProps {
  visible: boolean;
  routine: any;
  onClose: () => void;
  onUpdateVisibility: (routineId: string | number, newVisibility: string) => Promise<void>;
}

export const RoutineShareSettingsModal: React.FC<RoutineShareSettingsModalProps> = ({
  visible,
  routine,
  onClose,
  onUpdateVisibility,
}) => {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const iconBadgeBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

  const [visibility, setVisibility] = useState<string>(routine?.visibility || 'private');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (routine?.visibility) {
      setVisibility(routine.visibility);
    }
  }, [routine?.visibility]);

  if (!visible || !routine) return null;

  const baseUrl = 'https://pro-fitness-glass.zeabur.app';
  const shareUrl = `${baseUrl}/share/routine/${routine.id}`;

  const handleVisibilityChange = async (newVisibility: string) => {
    if (newVisibility === visibility || isUpdating) return;
    setVisibility(newVisibility);
    setIsUpdating(true);
    try {
      await onUpdateVisibility(routine.id, newVisibility);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo actualizar la visibilidad de la rutina.');
      setVisibility(routine.visibility || 'private');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyLink = async () => {
    try {
      await NativeShare.share({
        title: `Rutina: ${routine.name}`,
        message: `¡Echa un vistazo a mi rutina "${routine.name}" en Pro Fitness Glass!\n${shareUrl}`,
        url: shareUrl,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const options = [
    {
      id: 'private',
      title: 'Privada',
      desc: 'Solo tú puedes ver esta rutina.',
      icon: Lock,
    },
    {
      id: 'friends',
      title: 'Solo Amigos',
      desc: 'Accesible para tus amigos agregados.',
      icon: Users,
    },
    {
      id: 'public',
      title: 'Pública',
      desc: 'Cualquiera con el enlace puede verla.',
      icon: Globe,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <Pressable 
          style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', padding: 20 }]} 
          onPress={onClose}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420 }}>
            <View style={[
              styles.dialog, 
              { 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
              }
            ]}>
              <GlassView 
                glassEffectStyle="regular" 
                colorScheme={isDark ? 'dark' : 'light'} 
                style={StyleSheet.absoluteFill} 
              />
              <View 
                style={[
                  StyleSheet.absoluteFill, 
                  { backgroundColor: isDark ? 'rgba(20, 20, 25, 0.65)' : 'rgba(255, 255, 255, 0.75)' }
                ]} 
              />

              {/* BOTÓN CERRAR */}
              <GlassButton 
                theme={theme}
                onPress={onClose}
                noShadow
                style={styles.closeBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </GlassButton>

              {/* CABECERA */}
              <View style={styles.header}>
                <View style={[styles.iconWrapper, { backgroundColor: colors.tint + '18', borderColor: colors.tint + '35' }]}>
                  <Share2 size={26} color={getContrastColor(colors.tint, theme)} />
                </View>
                <Text style={[styles.title, { color: colors.text }]}>Compartir Rutina</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Configura la privacidad para <Text style={{ color: colors.text, fontWeight: 'bold' }}>{routine.name}</Text>
                </Text>
              </View>

              {/* OPCIONES DE VISIBILIDAD */}
              <View style={styles.optionsList}>
                {options.map((opt) => {
                  const isSelected = visibility === opt.id;
                  const Icon = opt.icon;

                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleVisibilityChange(opt.id)}
                      activeOpacity={0.8}
                      style={[
                        styles.optionRow,
                        {
                          backgroundColor: isSelected ? colors.tint + '12' : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'),
                          borderColor: isSelected ? colors.tint + '60' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'),
                        }
                      ]}
                    >
                      <View style={[styles.optionIconBox, { backgroundColor: isSelected ? colors.tint + '20' : iconBadgeBg }]}>
                        <Icon size={18} color={isSelected ? colors.tint : colors.textSecondary} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionTitle, { color: isSelected ? colors.tint : colors.text }]}>
                          {opt.title}
                        </Text>
                        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                          {opt.desc}
                        </Text>
                      </View>

                      {isSelected && (
                        <CheckCircle size={20} color={colors.tint} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* CAJA DE ENLACE SI NO ES PRIVADA */}
              {visibility !== 'private' && (
                <View style={[
                  styles.linkBox, 
                  { 
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)', 
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' 
                  }
                ]}>
                  <View style={styles.linkLabelRow}>
                    <Link2 size={12} color={colors.tint} />
                    <Text style={[styles.linkLabel, { color: colors.tint }]}>ENLACE PARA COMPARTIR</Text>
                  </View>

                  <View style={styles.linkRow}>
                    <Text style={[styles.linkUrl, { color: colors.textSecondary }]} numberOfLines={1}>
                      {shareUrl}
                    </Text>

                    <GlassButton 
                      theme={theme}
                      color={colors.tint}
                      onPress={copyLink} 
                      style={styles.copyBtn}
                    >
                      <Copy size={16} color={getContrastColor(colors.tint, theme)} />
                    </GlassButton>
                  </View>
                </View>
              )}

              {/* BOTÓN CERRAR */}
              <GlassButton 
                theme={theme}
                onPress={onClose}
                noShadow
                style={styles.closeBottomBtn}
              >
                <Text style={[styles.closeBottomText, { color: colors.text }]}>Cerrar</Text>
              </GlassButton>

            </View>
          </Pressable>
        </Pressable>
      </GlassView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 12,
  },
  optionsList: {
    gap: 10,
    marginBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  linkBox: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  linkLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  linkLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkUrl: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  copyBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomBtn: {
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
