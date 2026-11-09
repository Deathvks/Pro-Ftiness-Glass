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
const DROP_WIDTH = 44;
const DROP_HEIGHT = 42;

interface TabItemProps {
  route: any;
  index: number;
  isActive: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: (index: number) => void;
}

const TabItem = React.memo(function TabItem({
  route,
  index,
  isActive,
  activeColor,
  inactiveColor,
  onPress,
}: TabItemProps) {
  const tabInfo = TAB_CONFIG[route.name];
  if (!tabInfo) return null;
  const Icon = tabInfo.icon;

  return (
    <Pressable
      onPress={() => onPress(index)}
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

  // Ancho estimado inicial
  const screenWidth = Dimensions.get('window').width;
  const initialCapsuleWidth = Math.min(screenWidth - 32, 380);
  const [capsuleWidth, setCapsuleWidth] = useState(initialCapsuleWidth);

  // Pestaña visual activa (soporta arrastre táctil)
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);

  // Cálculo matemático del centro exacto de cada pestaña
  const innerWidth = Math.max(0, capsuleWidth - PADDING_H * 2);
  const tabWidth = innerWidth / TAB_KEYS.length;

  const getDropLeft = useCallback(
    (idx: number) => {
      const center = PADDING_H + (idx + 0.5) * tabWidth;
      return Math.round(center - DROP_WIDTH / 2);
    },
    [tabWidth]
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

  // Sincronizar posición SOLO si cambia externamente (sin arrastrar y sin doble trigger)
  useEffect(() => {
    if (!isDraggingRef.current && currentTargetIdxRef.current !== activeIndex) {
      snapToTab(activeIndex);
    }
  }, [activeIndex, capsuleWidth, snapToTab]);

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
        const maxX = getDropLeft(TAB_KEYS.length - 1);
        const newX = Math.max(minX, Math.min(startDragXRef.current + gestureState.dx, maxX));
        translateX.setValue(newX);

        // Feedback háptico al sobrevolar un icono distinto
        const hoverIdx = Math.max(0, Math.min(TAB_KEYS.length - 1, Math.round((newX - minX) / tabWidth)));
        if (hoverIdx !== hoverIndexRef.current) {
          hoverIndexRef.current = hoverIdx;
          try {
            Haptics.selectionAsync();
          } catch {}
          setActiveHoverIndex(hoverIdx);
        }
      },
      onPanResponderRelease: () => {
        const minX = getDropLeft(0);
        const nearestIdx = Math.max(0, Math.min(TAB_KEYS.length - 1, Math.round((currentXRef.current - minX) / tabWidth)));
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

  // Tinte translúcido idéntico al frontend (.liquid-glass-navbar)
  const getGlassTintBg = () => {
    switch (theme) {
      case 'oled':
        return 'rgba(0, 0, 0, 0.55)';
      case 'dark':
        return 'rgba(15, 23, 42, 0.46)';
      case 'galaxy':
        return 'rgba(10, 10, 26, 0.46)';
      case 'ocean-dark':
        return 'rgba(8, 47, 73, 0.46)';
      case 'desert-dark':
        return 'rgba(44, 30, 22, 0.46)';
      case 'ocean':
        return 'rgba(240, 249, 255, 0.68)';
      case 'desert':
        return 'rgba(253, 248, 245, 0.68)';
      case 'light':
      default:
        return 'rgba(255, 255, 255, 0.68)';
    }
  };

  // Sombra nativa idéntica al CSS box-shadow del frontend
  // 0 12px 32px -4px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.15)
  const getBoxShadow = () => {
    if (theme === 'oled') {
      return [
        {
          offsetX: 0,
          offsetY: 14,
          blurRadius: 36,
          spreadDistance: -4,
          color: 'rgba(0, 0, 0, 0.90)',
        },
      ];
    }
    if (!isDark) {
      return [
        {
          offsetX: 0,
          offsetY: 10,
          blurRadius: 28,
          spreadDistance: -4,
          color: 'rgba(15, 23, 42, 0.08)',
        },
        {
          offsetX: 0,
          offsetY: 4,
          blurRadius: 10,
          spreadDistance: 0,
          color: 'rgba(15, 23, 42, 0.04)',
        },
      ];
    }
    return [
      {
        offsetX: 0,
        offsetY: 12,
        blurRadius: 32,
        spreadDistance: -4,
        color: 'rgba(0, 0, 0, 0.35)',
      },
      {
        offsetX: 0,
        offsetY: 4,
        blurRadius: 12,
        spreadDistance: -2,
        color: 'rgba(0, 0, 0, 0.15)',
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
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.22 : 0.06,
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
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                borderTopColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.80)',
              },
            ]}
          >
            {/* Desenfoque de cristal líquido nativo */}
            <BlurView
              pointerEvents="none"
              intensity={45}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />

            {/* Tinte translúcido suave */}
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: getGlassTintBg() },
              ]}
            />

            {/* Brillo especular superior estilo Liquid Glass de Apple */}
            <LinearGradient
              pointerEvents="none"
              colors={
                isDark
                  ? ['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.02)', 'transparent']
                  : ['rgba(255, 255, 255, 0.85)', 'rgba(255, 255, 255, 0.35)', 'transparent']
              }
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
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.20)' : 'rgba(0, 0, 0, 0.08)',
                  borderTopColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#ffffff',
                },
              ]}
            >
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(255, 255, 255, 0.20)', 'rgba(255, 255, 255, 0.03)']
                    : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.50)']
                }
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
    top: 9, // (60 - 42) / 2 = 9
    left: 0,
    borderRadius: 21,
    borderWidth: 0.5,
    borderTopWidth: 1,
    overflow: 'hidden',
    elevation: 0,
    zIndex: 1,
  },
  liquidDropGradient: {
    ...StyleSheet.absoluteFill,
    borderRadius: 21,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconContainer: {
    transform: [{ scale: 1.15 }],
  },
});
