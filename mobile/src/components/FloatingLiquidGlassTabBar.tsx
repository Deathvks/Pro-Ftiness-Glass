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

const PADDING_H = 10;
const CAPSULE_HEIGHT = 60;
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
  capsuleBorder: string;
  dropBg: string;
  dropBorder: string;
  shadowColor: string;
  shadowOpacity: number;
}

const getTabBarThemeConfig = (theme: string): TabBarThemeConfig => {
  switch (theme) {
    case 'galaxy':
      return {
        capsuleBg: 'rgba(12, 10, 28, 0.92)',
        capsuleBorder: 'rgba(168, 85, 247, 0.32)',
        dropBg: 'rgba(168, 85, 247, 0.22)',
        dropBorder: 'rgba(168, 85, 247, 0.45)',
        shadowColor: 'rgba(0, 0, 0, 0.14)',
        shadowOpacity: 0.08,
      };
    case 'ocean-dark':
      return {
        capsuleBg: 'rgba(8, 47, 73, 0.92)',
        capsuleBorder: 'rgba(56, 189, 248, 0.32)',
        dropBg: 'rgba(14, 165, 233, 0.24)',
        dropBorder: 'rgba(56, 189, 248, 0.45)',
        shadowColor: 'rgba(0, 0, 0, 0.14)',
        shadowOpacity: 0.08,
      };
    case 'desert-dark':
      return {
        capsuleBg: 'rgba(44, 30, 22, 0.92)',
        capsuleBorder: 'rgba(210, 180, 140, 0.32)',
        dropBg: 'rgba(210, 180, 140, 0.20)',
        dropBorder: 'rgba(210, 180, 140, 0.45)',
        shadowColor: 'rgba(0, 0, 0, 0.14)',
        shadowOpacity: 0.08,
      };
    case 'ocean':
      return {
        capsuleBg: 'rgba(224, 242, 254, 0.92)',
        capsuleBorder: 'rgba(14, 165, 233, 0.28)',
        dropBg: 'rgba(14, 165, 233, 0.15)',
        dropBorder: 'rgba(14, 165, 233, 0.35)',
        shadowColor: 'rgba(12, 74, 110, 0.08)',
        shadowOpacity: 0.06,
      };
    case 'desert':
      return {
        capsuleBg: 'rgba(250, 240, 230, 0.92)',
        capsuleBorder: 'rgba(210, 180, 140, 0.35)',
        dropBg: 'rgba(210, 180, 140, 0.22)',
        dropBorder: 'rgba(210, 180, 140, 0.45)',
        shadowColor: 'rgba(92, 64, 51, 0.08)',
        shadowOpacity: 0.06,
      };
    case 'oled':
      return {
        capsuleBg: 'rgba(18, 18, 20, 0.94)',
        capsuleBorder: 'rgba(255, 255, 255, 0.14)',
        dropBg: 'rgba(255, 255, 255, 0.12)',
        dropBorder: 'rgba(255, 255, 255, 0.22)',
        shadowColor: 'rgba(0, 0, 0, 0.16)',
        shadowOpacity: 0.08,
      };
    case 'dark':
      return {
        capsuleBg: 'rgba(15, 23, 42, 0.92)',
        capsuleBorder: 'rgba(255, 255, 255, 0.14)',
        dropBg: 'rgba(255, 255, 255, 0.12)',
        dropBorder: 'rgba(255, 255, 255, 0.22)',
        shadowColor: 'rgba(0, 0, 0, 0.14)',
        shadowOpacity: 0.08,
      };
    case 'light':
    default:
      return {
        capsuleBg: 'rgba(255, 255, 255, 0.90)',
        capsuleBorder: 'rgba(0, 0, 0, 0.08)',
        dropBg: 'rgba(15, 23, 42, 0.06)',
        dropBorder: 'rgba(0, 0, 0, 0.10)',
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
  const themeConfig = useMemo(() => getTabBarThemeConfig(theme), [theme]);

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

  // Sombra nativa suave sin artefactos
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
        color: isDark ? 'rgba(0, 0, 0, 0.08)' : 'rgba(15, 23, 42, 0.03)',
      },
    ];
  };

  const bottomOffset = Math.max(insets.bottom, 12);
  const activeColor = colors.tint;
  const inactiveColor = colors.tabBarInactive || colors.textSecondary;

  return (
    <View style={[styles.outerWrapper, { bottom: bottomOffset }]} pointerEvents="box-none">
      {/* Contenedor de sombra Liquid Glass */}
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
        {/* Cápsula de cristal con fondo y borde nativo directo (sin hijos superpuestos al borde) */}
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
              backgroundColor: themeConfig.capsuleBg,
              borderColor: themeConfig.capsuleBorder,
            },
          ]}
        >
          {/* Desenfoque nativo solo en iOS */}
          {Platform.OS === 'ios' && (
            <BlurView
              pointerEvents="none"
              intensity={45}
              tint={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 30, overflow: 'hidden' }]}
            />
          )}

          {/* GOTA LÍQUIDA: vista única con fondo y borde nativos (sin hijos ni clipPath que deformen el borde) */}
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
              },
            ]}
          />

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
    height: CAPSULE_HEIGHT,
    borderRadius: CAPSULE_HEIGHT / 2,
    position: 'relative',
  },
  capsuleInner: {
    width: '100%',
    height: '100%',
    borderRadius: CAPSULE_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_H,
    borderWidth: 1,
  },
  liquidDrop: {
    position: 'absolute',
    top: (CAPSULE_HEIGHT - 2 - DROP_HEIGHT) / 2,
    left: 0,
    borderRadius: DROP_HEIGHT / 2,
    borderWidth: 1,
    zIndex: 1,
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
