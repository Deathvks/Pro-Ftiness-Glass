import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ImageBackground, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import { GlassButton } from '@/components/ui/GlassButton';
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

const HubButton = ({
  icon: Icon,
  title,
  description,
  onPress,
  badge = false,
  isComingSoon = false,
  colors,
  rightContent,
}: any) => {
  const theme = useAppStore(state => state.theme) || 'oled';
  return (
    <GlassButton
      theme={theme}
      noShadow={true}
      onPress={isComingSoon ? undefined : onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 78,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14,
        opacity: isComingSoon ? 0.6 : 1,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.tint + '18',
            borderWidth: 1,
            borderColor: colors.tint + '28',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={colors.tint} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, letterSpacing: -0.2 }}>
              {title}
            </Text>
            {Boolean(isComingSoon) && (
              <View
                style={{
                  backgroundColor: colors.tint + '20',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: colors.tint,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Pronto
                </Text>
              </View>
            )}
            {Boolean(badge) && !isComingSoon && (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.tint,
                }}
              />
            )}
          </View>
          {Boolean(description) && (
            <Text
              style={{
                fontSize: 13,
                color: colors.textSecondary,
                marginTop: 3,
                lineHeight: 18,
              }}
              numberOfLines={1}
            >
              {description}
            </Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {rightContent}
        <ChevronRight size={18} color={colors.textSecondary} style={{ opacity: 0.5 }} />
      </View>
    </GlassButton>
  );
};

export default function Hub() {
  const theme = useAppStore(state => state.theme);
  const themePreference = useAppStore(state => state.themePreference);
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const router = useRouter();

  const getThemeLabel = (t: string) => {
    switch (t) {
      case 'galaxy': return 'Galaxia';
      case 'desert': return 'Desierto';
      case 'desert-dark': return 'Desierto';
      case 'ocean': return 'Océano';
      case 'ocean-dark': return 'Océano';
      case 'oled': return 'OLED';
      case 'dark': return 'Oscuro';
      case 'light': return 'Claro';
      case 'system': return 'Sistema';
      default: return 'Tema';
    }
  };
  
  const isAdmin = userProfile?.role === 'admin';
  const isTrainer = userProfile?.role === 'trainer' || isAdmin;
  const isClient = !isTrainer;

  const unreadChats = useAppStore(state => state.unreadChats);
  const fetchUnreadChats = useAppStore(state => state.fetchUnreadChats);
  const [visitedAsesoria, setVisitedAsesoria] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      AsyncStorage.getItem(`visited_asesoria_${userProfile.id}`).then(val => {
        setVisitedAsesoria(val === 'true');
      });
      fetchUnreadChats?.();
    }
  }, [userProfile?.id, fetchUnreadChats]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background }}>
      <ThemeBackground />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Menú" scrollY={scrollY} />
      </View>

      <Animated.ScrollView 
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: insets.top + 62,
          paddingBottom: 160,
        }} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        
        {/* Banner Hero */}
        <View style={styles.heroBanner}>
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

        {/* ================= SECCIÓN 1: ACTIVIDAD Y ENTRENAMIENTO ================= */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Actividad y Entrenamiento
          </Text>

          <HubButton
            icon={BarChart2}
            title="Tu Progreso"
            description="Estadísticas, RM y volumen"
            colors={colors}
            onPress={() => router.push('/progress' as any)}
          />
          
          {isClient && (
            <HubButton
              icon={MessageCircle}
              title="Asesoría"
              description="Habla con tu entrenador"
              colors={colors}
              badge={Boolean(!visitedAsesoria || (Number(unreadChats) > 0))}
              onPress={() => {
                if (userProfile?.id) {
                  AsyncStorage.setItem(`visited_asesoria_${userProfile.id}`, 'true');
                  setVisitedAsesoria(true);
                }
                router.push('/asesoria' as any);
              }}
            />
          )}

          <HubButton
            icon={Trophy}
            title="Retos y Misiones"
            description="Gana XP y sube de nivel"
            colors={colors}
            onPress={() => router.push('/challenges' as any)}
          />
        </View>

        {/* ================= SECCIÓN 2: PERSONALIZACIÓN Y COMUNIDAD ================= */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Personalización y Comunidad
          </Text>

          <HubButton
            icon={Paintbrush}
            title="Apariencia"
            description="Temas, acentos y colores"
            colors={colors}
            onPress={() => router.push('/appearance')}
            rightContent={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 4 }}>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                  backgroundColor: colors.tint + '1A',
                  borderWidth: 1,
                  borderColor: colors.tint + '33',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.tint }}>
                    {getThemeLabel(themePreference || theme)}
                  </Text>
                </View>
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.tint,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }} />
              </View>
            }
          />

          <HubButton
            icon={Share2}
            title="Nuestras Redes"
            description="Instagram, TikTok y YouTube"
            colors={colors}
            onPress={() => router.push('/social-networks' as any)}
          />
        </View>

        {/* ================= SECCIÓN 3: PREFERENCIAS Y SOPORTE ================= */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Preferencias y Soporte
          </Text>

          <HubButton
            icon={Settings}
            title="Ajustes"
            description="Cuenta, privacidad y notificaciones"
            colors={colors}
            onPress={() => router.push('/settings' as any)}
          />

          <HubButton
            icon={Info}
            title="Soporte"
            description="Ayuda, descargas y app info"
            colors={colors}
            onPress={() => router.push('/support' as any)}
          />
        </View>

        {/* ================= SECCIÓN 4: ADMINISTRACIÓN ================= */}
        {(isTrainer || isAdmin) && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              Administración
            </Text>

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
        )}

      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    width: '100%',
    height: 195,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
    paddingHorizontal: 4,
  },
});
