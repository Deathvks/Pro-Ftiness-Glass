import React, { useEffect } from 'react';
import { Easing, Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getInactiveTabColor, getThemeSurfaceMode } from '@/constants/theme';
import { FloatingLiquidGlassTabBar } from '@/components/FloatingLiquidGlassTabBar';
import { hasUnseenChristmasMission } from '@/utils/christmasTheme';

const renderFloatingTabBar = (props: BottomTabBarProps) => <FloatingLiquidGlassTabBar {...props} />;

export default function AppTabs() {
  const userId = useAppStore(state => state.userProfile?.id);
  const syncChristmasMissionSeen = useAppStore(state => (state as any).syncChristmasMissionSeen);

  useEffect(() => {
    if (userId) {
      syncChristmasMissionSeen?.(userId);
    }
  }, [userId, syncChristmasMissionSeen]);
  if (Platform.OS === 'android') {
    return (
      <Tabs
        tabBar={renderFloatingTabBar}
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          lazy: true,
          freezeOnBlur: true,
          animation: 'shift',
          transitionSpec: {
            animation: 'timing',
            config: {
              duration: 210,
              easing: Easing.out(Easing.cubic),
            },
          },
          sceneStyle: {
            backgroundColor: 'transparent',
          },
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            elevation: 0,
            shadowColor: 'transparent',
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            borderTopWidth: 0,
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="social" options={{ title: 'Comunidad' }} />
        <Tabs.Screen name="nutrition" options={{ title: 'Nutrición' }} />
        <Tabs.Screen name="routines" options={{ title: 'Rutinas' }} />
        <Tabs.Screen name="hub" options={{ title: 'Menú' }} />
      </Tabs>
    );
  }

  return <NativeAppTabs />;
}

function NativeAppTabs() {
  const colors = useAppColors();
  const activeTheme = useAppStore(state => state.theme);
  const userProfile = useAppStore(state => state.userProfile);
  const unlockedBadges = useAppStore(state => state.gamification?.unlockedBadges || []);
  const christmasMissionSeen = useAppStore(state => Boolean((state as any).christmasMissionSeen));
  const unreadChats = useAppStore(state => state.unreadChats);
  const showHubBadge =
    Number(unreadChats) > 0 ||
    hasUnseenChristmasMission(userProfile, unlockedBadges, christmasMissionSeen);
  const surfaceMode = getThemeSurfaceMode(activeTheme);
  const isDark = surfaceMode !== 'light';
  const inactiveInk = getInactiveTabColor(activeTheme, colors.text);

  // Blur effect y color de interfaz adaptados a cada tema en iOS
  const blurEffect = surfaceMode === 'oled'
    ? 'none'
    : (isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight');

  return (
    <NativeTabs
      tintColor={colors.tint}
      indicatorColor="transparent"
      disableIndicator={true}
      rippleColor="transparent"
      backgroundColor={colors.tabBar}
      blurEffect={blurEffect}
      disableTransparentOnScrollEdge={true}
      shadowColor="transparent"
      iconColor={{
        default: inactiveInk,
        selected: colors.tint,
      }}
      labelStyle={{
        default: { color: inactiveInk },
        selected: { color: colors.tint },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house" }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="social">
        <NativeTabs.Trigger.Label>Comunidad</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2" }} md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="nutrition">
        <NativeTabs.Trigger.Label>Nutrición</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "flame", selected: "flame" }} md="local_fire_department" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="routines">
        <NativeTabs.Trigger.Label>Rutinas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bolt", selected: "bolt" }} md="flash_on" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hub">
        <NativeTabs.Trigger.Label>Menú</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2" }} md="grid_view" />
        <NativeTabs.Trigger.Badge hidden={!showHubBadge} selectedBackgroundColor={colors.tint}>•</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
