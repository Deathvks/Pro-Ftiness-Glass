import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Home, Users, Flame, Zap, LayoutGrid } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';

export interface FloatingTabBarProps {
  state: any;
  descriptors?: any;
  emitter?: any;
  navigateToTab?: (routeKey: string) => void;
  navigation?: any;
  insets?: { top: number; bottom: number; left: number; right: number };
}

const TAB_CONFIG: Record<string, { label: string; icon: any }> = {
  index: { label: 'Dashboard', icon: Home },
  social: { label: 'Comunidad', icon: Users },
  nutrition: { label: 'Nutrición', icon: Flame },
  routines: { label: 'Rutinas', icon: Zap },
  hub: { label: 'Menú', icon: LayoutGrid },
};

const TAB_KEYS = ['index', 'social', 'nutrition', 'routines', 'hub'];
const PADDING_H = 10;
const DROP_WIDTH = 48;
const DROP_HEIGHT = 44;

interface TabItemProps {
  route: any;
  index: number;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: (index: number) => void;
  onLayout: (index: number, x: number, width: number) => void;
}

const TabItem = React.memo(function TabItem({
  route,
  index,
  isActive,
  activeColor,
  inactiveColor,
  onPress,
  onLayout,
}: TabItemProps) {
  const tabInfo = TAB_CONFIG[route.name];
  if (!tabInfo) return null;
  const Icon = tabInfo.icon;

  return (
    <Pressable
      onPress={() => onPress(index)}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        if (width > 0) {
          onLayout(index, x, width);
        }
      }}
      hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
      style={styles.tabButton}
    >
      <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
        <Icon
          size={22}
          color={isActive ? activeColor : inactiveColor}
          strokeWidth={isActive ? 2.5 : 1.9}
        />
      </View>
    </Pressable>
  );
});

interface TabBarThemeConfig {
  capsuleBg: string;
  capsuleGradient: [string, string, string];
  capsuleBorder: string;
  capsuleBorderTop: string;
  dropBg: string;
  dropGradient: [string, string];
  dropBorder: string;
  dropBorderTop: string;
  dropGlow: string;
  shadowColor: string;
  shadowOpacity: number;
}

const getTabBarThemeConfig = (theme: string, tintColor: string): TabBarThemeConfig => {
  switch (theme) {
    case 'galaxy':
      return {
        capsuleBg: 'rgba(10, 10, 26, 0.50)',
        capsuleGradient: ['rgba(168, 85, 247, 0.20)', 'rgba(59, 130, 246, 0.05)', 'transparent'],
        capsuleBorder: 'rgba(168, 85, 247, 0.30)',
        capsuleBorderTop: 'rgba(168, 85, 247, 0.55)',
        dropBg: 'rgba(168, 85, 247, 0.22)',
        dropGradient: ['rgba(168, 85, 247, 0.36)', 'rgba(59, 130, 246, 0.12)'],
        dropBorder: 'rgba(168, 85, 247, 0.40)',
        dropBorderTop: 'rgba(216, 180, 254, 0.75)',
        dropGlow: '#a855f7',
        shadowColor: 'rgba(8, 8, 20, 0.35)',
        shadowOpacity: 0.22,
      };
    case 'ocean-dark':
      return {
        capsuleBg: 'rgba(8, 47, 73, 0.50)',
        capsuleGradient: ['rgba(56, 189, 248, 0.20)', 'rgba(14, 165, 233, 0.05)', 'transparent'],
        capsuleBorder: 'rgba(56, 189, 248, 0.30)',
        capsuleBorderTop: 'rgba(56, 189, 248, 0.55)',
        dropBg: 'rgba(14, 165, 233, 0.22)',
        dropGradient: ['rgba(56, 189, 248, 0.36)', 'rgba(14, 165, 233, 0.12)'],
        dropBorder: 'rgba(56, 189, 248, 0.40)',
        dropBorderTop: 'rgba(186, 230, 253, 0.75)',
        dropGlow: '#0ea5e9',
        shadowColor: 'rgba(8, 47, 73, 0.35)',
        shadowOpacity: 0.22,
      };
    case 'desert-dark':
      return {
        capsuleBg: 'rgba(44, 30, 22, 0.50)',
        capsuleGradient: ['rgba(245, 158, 11, 0.18)', 'rgba(217, 119, 6, 0.04)', 'transparent'],
        capsuleBorder: 'rgba(245, 158, 11, 0.28)',
        capsuleBorderTop: 'rgba(245, 158, 11, 0.55)',
        dropBg: 'rgba(217, 119, 6, 0.22)',
        dropGradient: ['rgba(245, 158, 11, 0.36)', 'rgba(217, 119, 6, 0.10)'],
        dropBorder: 'rgba(245, 158, 11, 0.38)',
        dropBorderTop: 'rgba(254, 240, 138, 0.75)',
        dropGlow: '#f59e0b',
        shadowColor: 'rgba(44, 30, 22, 0.35)',
        shadowOpacity: 0.22,
      };
    case 'ocean':
      return {
        capsuleBg: 'rgba(240, 249, 255, 0.74)',
        capsuleGradient: ['rgba(255, 255, 255, 0.90)', 'rgba(224, 242, 254, 0.40)', 'transparent'],
        capsuleBorder: 'rgba(14, 165, 233, 0.20)',
        capsuleBorderTop: '#ffffff',
        dropBg: 'rgba(255, 255, 255, 0.88)',
        dropGradient: ['#ffffff', 'rgba(224, 242, 254, 0.75)'],
        dropBorder: 'rgba(14, 165, 233, 0.25)',
        dropBorderTop: '#ffffff',
        dropGlow: '#0ea5e9',
        shadowColor: 'rgba(12, 74, 110, 0.08)',
        shadowOpacity: 0.06,
      };
    case 'desert':
      return {
        capsuleBg: 'rgba(253, 248, 245, 0.74)',
        capsuleGradient: ['rgba(255, 255, 255, 0.90)', 'rgba(254, 243, 199, 0.40)', 'transparent'],
        capsuleBorder: 'rgba(210, 180, 140, 0.22)',
        capsuleBorderTop: '#ffffff',
        dropBg: 'rgba(255, 255, 255, 0.88)',
        dropGradient: ['#ffffff', 'rgba(254, 243, 199, 0.75)'],
        dropBorder: 'rgba(210, 180, 140, 0.25)',
        dropBorderTop: '#ffffff',
        dropGlow: '#d2b48c',
        shadowColor: 'rgba(92, 64, 51, 0.08)',
        shadowOpacity: 0.06,
      };
    case 'oled':
      return {
        capsuleBg: 'rgba(0, 0, 0, 0.52)',
        capsuleGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent'],
        capsuleBorder: 'rgba(255, 255, 255, 0.14)',
        capsuleBorderTop: 'rgba(255, 255, 255, 0.30)',
        dropBg: 'rgba(255, 255, 255, 0.16)',
        dropGradient: ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)'],
        dropBorder: 'rgba(255, 255, 255, 0.28)',
        dropBorderTop: 'rgba(255, 255, 255, 0.70)',
        dropGlow: tintColor,
        shadowColor: 'rgba(0, 0, 0, 0.38)',
        shadowOpacity: 0.25,
      };
    case 'dark':
      return {
        capsuleBg: 'rgba(15, 23, 42, 0.50)',
        capsuleGradient: ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent'],
        capsuleBorder: 'rgba(255, 255, 255, 0.15)',
        capsuleBorderTop: 'rgba(255, 255, 255, 0.32)',
        dropBg: 'rgba(255, 255, 255, 0.16)',
        dropGradient: ['rgba(255, 255, 255, 0.28)', 'rgba(255, 255, 255, 0.06)'],
        dropBorder: 'rgba(255, 255, 255, 0.28)',
        dropBorderTop: 'rgba(255, 255, 255, 0.70)',
        dropGlow: tintColor,
        shadowColor: 'rgba(15, 23, 42, 0.30)',
        shadowOpacity: 0.22,
      };
    case 'light':
    default:
      return {
        capsuleBg: 'rgba(255, 255, 255, 0.74)',
        capsuleGradient: ['rgba(255, 255, 255, 0.90)', 'rgba(255, 255, 255, 0.40)', 'transparent'],
        capsuleBorder: 'rgba(0, 0, 0, 0.08)',
        capsuleBorderTop: '#ffffff',
        dropBg: 'rgba(255, 255, 255, 0.88)',
        dropGradient: ['#ffffff', 'rgba(255, 255, 255, 0.65)'],
        dropBorder: 'rgba(0, 0, 0, 0.08)',
        dropBorderTop: '#ffffff',
        dropGlow: 'rgba(15, 23, 42, 0.08)',
        shadowColor: 'rgba(15, 23, 42, 0.08)',
        shadowOpacity: 0.06,
      };
  }
};

export function FloatingLiquidGlassTabBar({
  state,
  emitter,
  navigateToTab,
  navigation,
  insets: propInsets,
}: FloatingTabBarProps) {
  const hookInsets = useSafeAreaInsets();
  const insets = propInsets || hookInsets;
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const themeConfig = useMemo(() => getTabBarThemeConfig(theme, colors.tint), [theme, colors.tint]);

  // Ancho estimado inicial
  const screenWidth = Dimensions.get('window').width;
  const initialCapsuleWidth = Math.min(screenWidth - 32, 380);
  const [capsuleWidth, setCapsuleWidth] = useState(initialCapsuleWidth);

  // Pestaña visual activa (soporta arrastre táctil)
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // Mediciones físicas exactas de cada botón (píxel a píxel del layout del dispositivo)
  const tabCentersRef = useRef<number[]>([]);
  const [measuredCount, setMeasuredCount] = useState(0);

  const handleTabLayout = useCallback((index: number, x: number, width: number) => {
    const center = x + width / 2;
    if (Math.abs((tabCentersRef.current[index] || 0) - center) > 0.5) {
      tabCentersRef.current[index] = center;
      setMeasuredCount(prev => prev + 1);
    }
  }, []);

  // Centro sub-píxel de cada icono: usa la posición física real medida en pantalla
  const getDropLeft = useCallback(
    (idx: number) => {
      const measured = tabCentersRef.current[idx];
      if (typeof measured === 'number' && measured > 0) {
        return measured - DROP_WIDTH / 2;
      }
      const innerWidth = Math.max(0, capsuleWidth - PADDING_H * 2);
      const tabWidth = innerWidth / (state.routes.length || 5);
      const center = PADDING_H + (idx + 0.5) * tabWidth;
      return center - DROP_WIDTH / 2;
    },
    [capsuleWidth, state.routes.length]
  );

  const activeIndex = state.index >= 0 ? state.index : 0;
  const currentTargetIdxRef = useRef(activeIndex);
  const currentAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const currentXRef = useRef(getDropLeft(activeIndex));
  const isDraggingRef = useRef(false);
  const startDragXRef = useRef(0);
  const hoverIndexRef = useRef(activeIndex);

  const translateX = useRef(new Animated.Value(getDropLeft(activeIndex))).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  // Seguimiento en tiempo real de la posición física exacta de la gota (evita saltos bruscos)
  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentXRef.current = value;
    });
    return () => {
      translateX.removeListener(listenerId);
    };
  }, [translateX]);

  // Animación suave con física elástica (spring) sin doble-disparo ni tirones
  const snapToTab = useCallback(
    (idx: number, force = false) => {
      const targetX = getDropLeft(idx);

      // Si ya estamos dirigiéndonos a este índice y no es forzado, no reiniciar para evitar que se trabe
      if (!force && currentTargetIdxRef.current === idx && Math.abs(currentXRef.current - targetX) < 1) {
        return;
      }

      currentTargetIdxRef.current = idx;

      // Frenar limpiamente cualquier animación previa para evitar colisiones
      if (currentAnimRef.current) {
        currentAnimRef.current.stop();
        currentAnimRef.current = null;
      }

      const anim = Animated.parallel([
        Animated.spring(translateX, {
          toValue: targetX,
          stiffness: 180,
          damping: 18,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleX, { toValue: 0.90, duration: 80, useNativeDriver: true }),
            Animated.timing(scaleY, { toValue: 0.90, duration: 80, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(scaleX, { toValue: 1, stiffness: 220, damping: 16, mass: 0.6, useNativeDriver: true }),
            Animated.spring(scaleY, { toValue: 1, stiffness: 220, damping: 16, mass: 0.6, useNativeDriver: true }),
          ]),
        ]),
      ]);

      currentAnimRef.current = anim;
      anim.start(({ finished }) => {
        if (finished) {
          currentAnimRef.current = null;
        }
      });
    },
    [getDropLeft, scaleX, scaleY, translateX]
  );

  // Disparo de navegación desacoplado al siguiente frame (0 lag en el hilo JS)
  const triggerTabChange = useCallback(
    (idx: number) => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}

      const targetRoute = state.routes[idx];
      if (!targetRoute) return;

      if (emitter) {
        emitter.emit({
          type: 'tabPress',
          target: targetRoute.key,
          canPreventDefault: true,
        });
      } else if (navigation) {
        navigation.emit({
          type: 'tabPress',
          target: targetRoute.key,
          canPreventDefault: true,
        });
      }

      if (navigateToTab) {
        navigateToTab(targetRoute.key);
      } else if (navigation) {
        // requestAnimationFrame desacopla la transición de pantalla del hilo de animación física
        requestAnimationFrame(() => {
          navigation.navigate(targetRoute.name);
        });
      }
    },
    [emitter, navigation, navigateToTab, state.routes]
  );

  // Sincronizar posición exacta cuando se miden los layouts físicos o cambia la pestaña activa
  useEffect(() => {
    if (!isDraggingRef.current) {
      snapToTab(activeIndex, true);
    }
  }, [activeIndex, measuredCount, capsuleWidth, snapToTab]);

  // Gestos táctiles de arrastre fluido a 60-120fps (PanResponder optimizado)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        return Math.abs(gestureState.dx) > 7;
      },
      onPanResponderGrant: () => {
        if (currentAnimRef.current) {
          currentAnimRef.current.stop();
          currentAnimRef.current = null;
        }

        isDraggingRef.current = true;
        startDragXRef.current = currentXRef.current;
        hoverIndexRef.current = activeIndex;

        Animated.parallel([
          Animated.timing(scaleX, { toValue: 0.90, duration: 70, useNativeDriver: true }),
          Animated.timing(scaleY, { toValue: 0.90, duration: 70, useNativeDriver: true }),
        ]).start();
      },
      onPanResponderMove: (_evt, gestureState) => {
        const minX = getDropLeft(0);
        const maxX = getDropLeft(state.routes.length - 1);
        const newX = Math.max(minX, Math.min(startDragXRef.current + gestureState.dx, maxX));
        translateX.setValue(newX);

        // Feedback háptico al sobrevolar un icono distinto comparando distancias reales
        let hoverIdx = 0;
        let minDistance = Infinity;
        state.routes.forEach((_: any, idx: number) => {
          const targetX = getDropLeft(idx);
          const dist = Math.abs(newX - targetX);
          if (dist < minDistance) {
            minDistance = dist;
            hoverIdx = idx;
          }
        });

        if (hoverIdx !== hoverIndexRef.current) {
          hoverIndexRef.current = hoverIdx;
          try {
            Haptics.selectionAsync();
          } catch {}
          setActiveHoverIndex(hoverIdx);
        }
      },
      onPanResponderRelease: () => {
        // Encontrar el tab más cercano según las distancias reales medidas
        let nearestIdx = 0;
        let minDistance = Infinity;
        state.routes.forEach((_: any, idx: number) => {
          const targetX = getDropLeft(idx);
          const dist = Math.abs(currentXRef.current - targetX);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = idx;
          }
        });

        setActiveHoverIndex(null);
        snapToTab(nearestIdx, true);

        if (nearestIdx !== state.index) {
          requestAnimationFrame(() => {
            triggerTabChange(nearestIdx);
          });
        }

        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
      },
      onPanResponderTerminate: () => {
        setActiveHoverIndex(null);
        snapToTab(state.index, true);
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 100);
      },
    })
  ).current;

  const handleTabPress = useCallback(
    (index: number) => {
      if (isDraggingRef.current) return;
      if (currentTargetIdxRef.current === index && activeIndex === index) return;
      snapToTab(index);
      if (index !== state.index) {
        requestAnimationFrame(() => {
          triggerTabChange(index);
        });
      }
    },
    [activeIndex, snapToTab, state.index, triggerTabChange]
  );

  // Sombra nativa idéntica al CSS box-shadow del frontend (suave y sin artefactos negros en Android)
  const getBoxShadow = () => {
    return [
      {
        offsetX: 0,
        offsetY: 8,
        blurRadius: 22,
        spreadDistance: -3,
        color: themeConfig.shadowColor,
      },
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        spreadDistance: 0,
        color: isDark ? 'rgba(0, 0, 0, 0.15)' : 'rgba(15, 23, 42, 0.03)',
      },
    ];
  };

  const bottomOffset = Math.max(insets.bottom, 12);
  const activeColor = colors.tint;
  const inactiveColor = colors.tabBarInactive || colors.textSecondary;

  return (
    <View style={[styles.outerWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
        {/* Contenedor de sombra Liquid Glass idéntico al box-shadow del frontend */}
        <View
          style={[
            styles.shadowContainer,
            {
              boxShadow: getBoxShadow() as any,
              shadowColor: themeConfig.shadowColor,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: themeConfig.shadowOpacity,
              shadowRadius: 16,
              elevation: 0,
            },
          ]}
        >
          {/* Cápsula de cristal interior recortada con bordes redondeados perfectos */}
          <View
            {...panResponder.panHandlers}
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && Math.abs(w - capsuleWidth) > 1) {
                setCapsuleWidth(w);
              }
            }}
            style={[
              styles.capsuleInner,
              {
                borderColor: themeConfig.capsuleBorder,
                borderTopColor: themeConfig.capsuleBorderTop,
              },
            ]}
          >
            {/* Desenfoque de cristal líquido nativo */}
            <BlurView
              pointerEvents="none"
              intensity={Platform.OS === 'android' ? (isDark ? 30 : 45) : 45}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            {/* Tinte translúcido suave ajustado por tema */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: themeConfig.capsuleBg },
              ]}
            />

            {/* Brillo especular superior estilo Liquid Glass de Apple */}
            <LinearGradient
              pointerEvents="none"
              colors={themeConfig.capsuleGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.specularShine}
            />

            {/* GOTA LÍQUIDA (.liquid-glass-drop) CENTRADA CON EXACTITUD SUB-PÍXEL */}
            <Animated.View
              pointerEvents="none"
              style={[
                styles.liquidDrop,
                {
                  width: DROP_WIDTH,
                  height: DROP_HEIGHT,
                  transform: [
                    { translateX },
                    { scaleX },
                    { scaleY },
                  ],
                  backgroundColor: themeConfig.dropBg,
                  borderColor: themeConfig.dropBorder,
                  borderTopColor: themeConfig.dropBorderTop,
                  shadowColor: themeConfig.dropGlow,
                  shadowOpacity: isDark ? 0.35 : 0.10,
                },
              ]}
            >
              <LinearGradient
                colors={themeConfig.dropGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.liquidDropGradient}
              />
            </Animated.View>
            {/* Iconos del Navbar centrados y distribuidos uniformemente */}
            {state.routes.map((route: any, index: number) => {
              const isEffectiveActive =
                activeHoverIndex !== null ? activeHoverIndex === index : activeIndex === index;

              return (
                <TabItem
                  key={route.key}
                  route={route}
                  index={index}
                  isActive={isEffectiveActive}
                  activeColor={activeColor}
                  inactiveColor={inactiveColor}
                  onPress={handleTabPress}
                  onLayout={handleTabLayout}
                />
              );
            })}
          </View>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 1000,
  },
  shadowContainer: {
    width: '100%',
    maxWidth: 380,
    height: 60,
    borderRadius: 30,
    position: 'relative',
  },
  capsuleInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_H,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderTopWidth: 1,
  },
  specularShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 22,
  },
  liquidDrop: {
    position: 'absolute',
    top: '50%',
    marginTop: -DROP_HEIGHT / 2,
    left: 0,
    borderRadius: DROP_HEIGHT / 2,
    borderWidth: 1,
    borderTopWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 0,
    zIndex: 1,
  },
  liquidDropGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: DROP_HEIGHT / 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    transform: [{ scale: 1.15 }],
  },
});
