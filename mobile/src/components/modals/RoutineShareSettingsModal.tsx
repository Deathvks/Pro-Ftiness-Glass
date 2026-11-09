/* mobile/src/components/modals/RoutineShareSettingsModal.tsx */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share as NativeShare,
  Platform,
} from 'react-native';
import { Share2, Lock, Users, Globe, CheckCircle, Copy, Link2, X } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassButton } from '@/components/ui/GlassButton';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

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
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
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
    <SwipeableBottomSheet
      visible={visible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={colors.card}
    >
      <View style={styles.container}>
        {/* BOTÓN CERRAR */}
        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
          ]}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* CABECERA */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: colors.tint + '18',
                borderColor: colors.tint + '35',
                borderWidth: isIOS ? 0 : 1.5,
              },
            ]}
          >
            <Share2 size={26} color={colors.tint} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Compartir Rutina</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Configura la privacidad para{' '}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{routine.name}</Text>
          </Text>
        </View>

        {/* OPCIONES DE VISIBILIDAD */}
        <View style={styles.optionsList}>
          {options.map(opt => {
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
                    backgroundColor: isSelected
                      ? colors.tint + '15'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                    borderColor: isSelected
                      ? colors.tint + '60'
                      : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                    borderWidth: isIOS && !isSelected ? 0 : 1,
                  },
                  !isSelected && getAppleSheetCardStyle(isDark, 18),
                ]}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    { backgroundColor: isSelected ? colors.tint + '20' : iconBadgeBg },
                  ]}
                >
                  <Icon size={18} color={isSelected ? colors.tint : colors.textSecondary} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.optionTitle,
                      { color: isSelected ? colors.tint : colors.text },
                    ]}
                  >
                    {opt.title}
                  </Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    {opt.desc}
                  </Text>
                </View>

                {isSelected && <CheckCircle size={20} color={colors.tint} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CAJA DE ENLACE SI NO ES PRIVADA */}
        {visibility !== 'private' && (
          <View
            style={[
              styles.linkBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                borderWidth: isIOS ? 0 : 1,
              },
              getAppleSheetCardStyle(isDark, 18),
            ]}
          >
            <View style={styles.linkLabelRow}>
              <Link2 size={12} color={colors.tint} />
              <Text style={[styles.linkLabel, { color: colors.tint }]}>
                ENLACE PARA COMPARTIR
              </Text>
            </View>

            <View style={styles.linkRow}>
              <Text
                style={[styles.linkUrl, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {shareUrl}
              </Text>

              <GlassButton
                theme={theme}
                color={colors.tint}
                onPress={copyLink}
                style={styles.copyBtn}
              >
                <Copy
                  size={16}
                  color={isIOS ? colors.tint : getContrastColor(colors.tint, theme)}
                />
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
    </SwipeableBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 12,
  },
  closeBtn: {
    position: 'absolute',
    top: 6,
    right: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
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
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 21,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
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
    borderRadius: 18,
    borderCurve: 'continuous',
    gap: 12,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  linkBox: {
    padding: 14,
    borderRadius: 18,
    borderCurve: 'continuous',
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
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomBtn: {
    width: '100%',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBottomText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
