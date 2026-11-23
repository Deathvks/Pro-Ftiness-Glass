import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getInactiveTabColor, getThemeSurfaceMode } from '@/constants/theme';
import { FloatingLiquidGlassTabBar } from '@/components/FloatingLiquidGlassTabBar';

const renderFloatingTabBar = (props: BottomTabBarProps) => <FloatingLiquidGlassTabBar {...props} />;

export default function AppTabs() {
  if (Platform.OS === 'android') {
    return (
      <Tabs
        tabBar={renderFloatingTabBar}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          lazy: false,
          animation: 'none',
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            elevation: 0,
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
      shadowColor={isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)'}
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
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
