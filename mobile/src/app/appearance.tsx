import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import { 
  Palette, 
  Sun, 
  Moon, 
  Smartphone, 
  Check,
  Vibrate,
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

export default function AppearanceScreen() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const accent = useAppStore(state => state.accent || '#3b82f6');
  const setAccent = useAppStore(state => state.setAccent);
  // Add haptics if available in store, otherwise mock it
  const hapticsEnabled = useAppStore(state => (state as any).hapticsEnabled !== false);
  const setHapticsEnabled = useAppStore(state => (state as any).setHapticsEnabled || (() => {}));
  
  const baseColors = Colors[theme as keyof typeof Colors] || Colors.oled;
  // Overwrite tint with our accent for this screen
  const colors = { ...baseColors, tint: accent };
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader 
          title="Apariencia" 
          scrollY={scrollY} 
          showBackButton 
          onBack={() => router.back()} 
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
                { id: 'oled', icon: Smartphone, label: 'OLED' } // Simplified for mobile
              ].map((mode) => {
                const isActive = theme === mode.id;
                const ModeIcon = mode.icon;
                return (
                  <View key={mode.id} style={{ width: '33.33%', paddingHorizontal: 6 }}>
                    <TouchableOpacity
                      onPress={() => setTheme(mode.id)}
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
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, marginLeft: 4 }}>Color de Acento</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start' }}>
              {ACCENT_OPTIONS.map((opt) => {
                const isActive = accent.toLowerCase() === opt.hex.toLowerCase();
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setAccent(opt.hex)}
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
        <View style={{ backgroundColor: colors.card, borderRadius: 32, padding: 16, borderWidth: 1, borderColor: colors.border }}>
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
              onPress={() => setHapticsEnabled(!hapticsEnabled)}
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

      </Animated.ScrollView>
    </View>
  );
}
