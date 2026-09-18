import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { Colors } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import { 
  Palette, 
  Sun, 
  Moon, 
  Smartphone, 
  Check,
  Vibrate,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Droplet
} from 'lucide-react-native';

const ACCENT_OPTIONS = [
  { id: 'green', label: 'Verde', hex: '#22c55e' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'violet', label: 'Violeta', hex: '#8b5cf6' },
  { id: 'amber', label: 'Ámbar', hex: '#f59e0b' },
  { id: 'rose', label: 'Rosa', hex: '#f43f5e' },
  { id: 'teal', label: 'Turquesa', hex: '#14b8a6' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
  { id: 'orange', label: 'Naranja', hex: '#f97316' },
  { id: 'lime', label: 'Lima', hex: '#84cc16' },
  { id: 'fuchsia', label: 'Fucsia', hex: '#d946ef' },
  { id: 'emerald', label: 'Esmeralda', hex: '#10b981' },
  { id: 'indigo', label: 'Índigo', hex: '#6366f1' },
  { id: 'purple', label: 'Púrpura', hex: '#a855f7' },
  { id: 'pink', label: 'Rosa Claro', hex: '#ec4899' },
  { id: 'red', label: 'Rojo', hex: '#ef4444' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'sky', label: 'Cielo', hex: '#0ea5e9' },
  { id: 'slate', label: 'Pizarra', hex: '#64748b' },
  { id: 'zinc', label: 'Zinc', hex: '#71717a' },
  { id: 'stone', label: 'Piedra', hex: '#78716c' },
  { id: 'neutral', label: 'Neutral', hex: '#737373' }
];

const COLORS_PER_PAGE = 12;

export default function AppearanceScreen() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const accent = useAppStore(state => state.accent || '#3b82f6');
  const setAccent = useAppStore(state => state.setAccent);
  
  const hapticsEnabled = useAppStore(state => (state as any).hapticsEnabled !== false);
  const setHapticsEnabled = useAppStore(state => (state as any).setHapticsEnabled || (() => {}));
  
  const [currentColorPage, setCurrentColorPage] = useState(0);

  const colors = useAppColors();
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const totalPages = Math.ceil(ACCENT_OPTIONS.length / COLORS_PER_PAGE);
  const currentColors = ACCENT_OPTIONS.slice(
    currentColorPage * COLORS_PER_PAGE,
    (currentColorPage * COLORS_PER_PAGE) + COLORS_PER_PAGE
  );

  const handleHapticToggle = () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    if (newValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleThemeChange = (id: string) => {
    setTheme(id);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleAccentChange = (hex: string) => {
    setAccent(hex);
    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const isSpecialTheme = ['galaxy', 'ocean', 'ocean-dark', 'desert', 'desert-dark'].includes(theme);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader 
          title="Apariencia" 
          scrollY={scrollY} 
          showBackButton 
        />
      </View>

      <Animated.ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 70, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <View style={{ padding: 10, borderRadius: 16, backgroundColor: colors.tint + '15' }}>
              <Palette size={24} color={colors.tint} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>Apariencia de la App</Text>
          </View>

          {/* Temas Base */}
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 }}>Tema Principal</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
              {[
                { id: 'light', icon: Sun, label: 'Claro' },
                { id: 'dark', icon: Moon, label: 'Oscuro' },
                { id: 'oled', icon: Smartphone, label: 'OLED' }
              ].map((mode) => {
                const isActive = theme === mode.id;
                const ModeIcon = mode.icon;
                return (
                  <View key={mode.id} style={{ width: '33.33%', paddingHorizontal: 6, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => handleThemeChange(mode.id)}
                      style={{
                        backgroundColor: isActive ? colors.tint + '15' : colors.background,
                        borderWidth: 2,
                        borderColor: isActive ? colors.tint : colors.border,
                        borderRadius: 20,
                        padding: 16,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ModeIcon size={24} color={isActive ? colors.tint : colors.textSecondary} style={{ marginBottom: 8 }} />
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: isActive ? colors.tint : colors.textSecondary }}>{mode.label}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Color de Acento */}
          <View style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 }}>Color de Acento</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentColorPage(p => Math.max(0, p - 1));
                    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={currentColorPage === 0 || isSpecialTheme}
                  style={{ opacity: (currentColorPage === 0 || isSpecialTheme) ? 0.3 : 1 }}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setCurrentColorPage(p => Math.min(totalPages - 1, p + 1));
                    if (hapticsEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  disabled={currentColorPage === totalPages - 1 || isSpecialTheme}
                  style={{ opacity: (currentColorPage === totalPages - 1 || isSpecialTheme) ? 0.3 : 1 }}
                >
                  <ChevronRight size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start', opacity: isSpecialTheme ? 0.4 : 1 }} pointerEvents={isSpecialTheme ? 'none' : 'auto'}>
              {currentColors.map((opt) => {
                const isActive = accent.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => handleAccentChange(opt.hex)}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: opt.hex,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 3,
                      borderColor: isActive ? colors.background : 'transparent',
                      shadowColor: opt.hex,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isActive ? 0.4 : 0,
                      shadowRadius: 8,
                      elevation: isActive ? 4 : 0,
                    }}
                  >
                    {isActive && <Check size={20} color="#FFFFFF" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 }} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Switch Items (Haptics, etc) */}
        <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}>
              <View style={{ padding: 10, borderRadius: 14, backgroundColor: colors.tint + '15' }}>
                <Vibrate size={20} color={colors.tint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: colors.text }}>Vibración y Hápticos</Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Respuesta táctil en la app</Text>
              </View>
            </View>
            <TouchableOpacity 
              onPress={handleHapticToggle}
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                backgroundColor: hapticsEnabled ? colors.tint : colors.border,
                justifyContent: 'center',
                paddingHorizontal: 2,
              }}
            >
              <View style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#fff',
                transform: [{ translateX: hapticsEnabled ? 22 : 0 }],
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2
              }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mis Temas */}
        <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 24, borderWidth: 1, borderColor: colors.border, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <View style={{ padding: 10, borderRadius: 16, backgroundColor: colors.tint + '15' }}>
              <Sparkles size={24} color={colors.tint} />
            </View>
            <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text }}>Mis Temas</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 24, marginLeft: 4 }}>
            Temas exclusivos desbloqueables.
          </Text>

            <View style={{ gap: 16 }}>
              {[
                { 
                  baseId: 'galaxy', 
                  icon: (props: any) => <FontAwesome5 name="meteor" size={props.size} color={props.color} />, 
                    label: 'Tema Galaxia', 
                  themeTint: '#a855f7', 
                  btnText: '#fff',
                  desc: 'Desbloqueado',
                  buttons: [{ id: 'galaxy', label: theme === 'galaxy' ? 'Activo' : 'Aplicar' }]
                },
                { 
                  baseId: 'ocean', 
                  icon: Droplet, 
                  label: 'Tema Océano', 
                  themeTint: '#0ea5e9', 
                  btnText: '#fff',
                  desc: 'Desbloqueado',
                  buttons: [{ id: 'ocean', label: 'Claro' }, { id: 'ocean-dark', label: 'Oscuro' }]
                },
                { 
                  baseId: 'desert', 
                  icon: Sun, 
                  label: 'Tema Desierto', 
                  themeTint: '#d2b48c', 
                  btnText: '#451a03',
                  desc: 'Desbloqueado',
                  buttons: [{ id: 'desert', label: 'Claro' }, { id: 'desert-dark', label: 'Oscuro' }]
                }
              ].map((st) => {
                const isGroupActive = theme === st.baseId || theme === `${st.baseId}-dark` || (st.baseId === 'galaxy' && theme === 'galaxy');
                const STIcon = st.icon;
                return (
                  <View key={st.baseId}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 16,
                        backgroundColor: isGroupActive ? st.themeTint + '15' : colors.card,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: isGroupActive ? st.themeTint + '50' : colors.border,
                        shadowColor: isGroupActive ? st.themeTint : 'transparent',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isGroupActive ? 0.2 : 0,
                        shadowRadius: 10,
                        elevation: isGroupActive ? 3 : 0,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ padding: 10, borderRadius: 14, backgroundColor: isGroupActive ? st.themeTint + '20' : colors.background }}>
                          <STIcon size={22} color={isGroupActive ? st.themeTint : colors.textSecondary} />
                        </View>
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: isGroupActive ? st.themeTint : colors.text }}>{st.label}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                             <Check size={12} color={colors.success} />
                             <Text style={{ fontSize: 11, color: colors.textSecondary }}>{st.desc}</Text>
                          </View>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {st.buttons.map(btn => {
                          const isBtnActive = theme === btn.id;
                          return (
                            <TouchableOpacity
                              key={btn.id}
                              onPress={() => handleThemeChange(btn.id)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 20,
                                backgroundColor: isBtnActive ? st.themeTint : colors.background,
                                borderWidth: isBtnActive ? 0 : 1,
                                borderColor: colors.border
                              }}
                            >
                              <Text style={{ fontSize: 11, fontWeight: 'bold', color: isBtnActive ? st.btnText : st.themeTint }}>
                                {btn.label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                    {isGroupActive && (
                      <Text style={{ fontSize: 11, color: st.themeTint, fontWeight: 'bold', marginTop: 12, marginLeft: 8 }}>
                         El {st.label} usa su propio acento (desactiva el acento manual).
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
        </View>

      </Animated.ScrollView>
    </View>
  );
}
