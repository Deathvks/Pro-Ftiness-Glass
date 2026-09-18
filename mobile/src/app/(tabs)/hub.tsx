import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Alert, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useAppColors } from '@/hooks/useAppColors';
import { Colors } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import { 
  BarChart2, 
  MessageCircle, 
  Trophy, 
  Paintbrush, 
  Share2, 
  Info, 
  Settings, 
  Users, 
  ShieldCheck,
  ChevronRight 
} from 'lucide-react-native';

const HubButton = ({ icon: Icon, title, description, onPress, badge = false, isComingSoon = false, colors }: any) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={isComingSoon ? undefined : onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
      opacity: isComingSoon ? 0.6 : 1,
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 16 }}>
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
        <Icon size={28} color={colors.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ fontSize: 17, fontWeight: 'bold', color: colors.text }}>{title}</Text>
          {isComingSoon && (
            <View style={{ backgroundColor: colors.tint + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.tint, textTransform: 'uppercase' }}>Pronto</Text>
            </View>
          )}
          {badge && !isComingSoon && (
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.tint }} />
          )}
        </View>
        {description && (
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>{description}</Text>
        )}
      </View>
    </View>
    <ChevronRight size={20} color={colors.textSecondary} style={{ opacity: 0.5 }} />
  </TouchableOpacity>
);

export default function Hub() {
  const theme = useAppStore(state => state.theme);
  const setTheme = useAppStore(state => state.setTheme);
  const accent = useAppStore(state => state.accent);
  const baseColors = Colors[theme as keyof typeof Colors] || Colors.oled;
  const colors = { ...baseColors, tint: accent || baseColors.tint };
  const userProfile = useAppStore(state => state.userProfile);
  const router = useRouter();
  
  const isAdmin = userProfile?.role === 'admin';
  const isTrainer = userProfile?.role === 'trainer' || isAdmin;
  const isClient = !isTrainer;

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader title="Menú" scrollY={scrollY} />
      </View>

      <Animated.ScrollView 
        contentContainerStyle={{ padding: 16, paddingTop: insets.top + 70, paddingBottom: 150 }} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        
        {/* Banner Hero */}
        <View style={{ width: '100%', height: 200, borderRadius: 24, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 5 }}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80' }}
            style={{ flex: 1, justifyContent: 'flex-end' }}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '100%' }}
            />
            <View style={{ padding: 20 }}>
              <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', marginBottom: 6 }}>Explorar</Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: 'rgba(255,255,255,0.8)', lineHeight: 20 }}>
                Tu centro de control. Descubre retos, ajusta tu perfil y analiza todo tu progreso en un solo lugar.
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* Access Grid */}
        <View>
          
          <HubButton
            icon={BarChart2}
            title="Tu Progreso"
            description="Estadísticas, RM y volumen"
            colors={colors}
            onPress={() => Alert.alert('Tu Progreso', 'Próximamente en la app móvil')}
          />
          
          {isClient && (
            <HubButton
              icon={MessageCircle}
              title="Asesoría"
              description="Habla con tu entrenador"
              colors={colors}
              onPress={() => Alert.alert('Asesoría', 'Próximamente en la app móvil')}
            />
          )}

          <HubButton
            icon={Trophy}
            title="Retos y Misiones"
            description="Gana XP y sube de nivel"
            colors={colors}
            onPress={() => Alert.alert('Retos', 'Próximamente en la app móvil')}
          />

          <HubButton
            icon={Paintbrush}
            title="Apariencia"
            description="Temas, acentos y colores"
            colors={colors}
            onPress={() => router.push('/appearance')}
          />

          <HubButton
            icon={Share2}
            title="Nuestras Redes"
            description="Instagram, TikTok y YouTube"
            colors={colors}
            onPress={() => Alert.alert('Redes', 'Próximamente en la app móvil')}
          />

          <HubButton
            icon={Info}
            title="Soporte"
            description="Ayuda, descargas y app info"
            colors={colors}
            onPress={() => Alert.alert('Soporte', 'Próximamente en la app móvil')}
          />

          <HubButton
            icon={Settings}
            title="Ajustes"
            description="Cuenta, privacidad y notificaciones"
            colors={colors}
            onPress={() => Alert.alert('Ajustes', 'Próximamente en la app móvil')}
          />

          {isTrainer && (
            <HubButton
              icon={Users}
              title="Panel de Entrenador"
              description="Gestión de clientes y cuestionarios"
              colors={colors}
              onPress={() => Alert.alert('Panel de Entrenador', 'Próximamente en la app móvil')}
            />
          )}

          {isAdmin && (
            <HubButton
              icon={ShieldCheck}
              title="Panel Admin"
              description="Gestión de usuarios y sistema"
              colors={colors}
              onPress={() => Alert.alert('Panel Admin', 'Próximamente en la app móvil')}
            />
          )}

        </View>

      </Animated.ScrollView>
    </View>
  );
}