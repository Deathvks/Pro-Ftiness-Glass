import React from 'react';
import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/native-tabs';
import { Tabs } from 'expo-router';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { getThemeBaseBackground } from '@/constants/theme';
import { FloatingLiquidGlassTabBar } from '@/components/FloatingLiquidGlassTabBar';

export default function AppTabs() {
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  // En Android: usamos el navbar flotante Liquid Glass idéntico al frontend
  if (Platform.OS === 'android') {
    return (
      <Tabs
        key={`android_${theme}_${colors.tint}`}
        tabBar={(props) => <FloatingLiquidGlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none',
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

  // Blur effect y color de interfaz adaptados a cada tema en iOS
  const blurEffect = theme === 'oled'
    ? 'none'
    : (isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight');

  const userInterfaceStyle = isDark ? 'dark' : 'light';

  return (
    <NativeTabs
      key={`${theme}_${colors.tint}_${userInterfaceStyle}`}
      tintColor={colors.tint}
      indicatorColor="transparent"
      disableIndicator={true}
      rippleColor="transparent"
      backgroundColor={colors.tabBar}
      blurEffect={blurEffect}
      disableTransparentOnScrollEdge={true}
      shadowColor={isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.08)'}
      iconColor={{
        default: colors.tabBarInactive || colors.textSecondary,
        selected: colors.tint,
      }}
      labelStyle={{
        default: { color: colors.tabBarInactive || colors.textSecondary },
        selected: { color: colors.tint },
      }}
    >
      <NativeTabs.Trigger name="index" unstable_nativeProps={{ ios: { experimental_userInterfaceStyle: userInterfaceStyle } }}>
        <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house" }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="social" unstable_nativeProps={{ ios: { experimental_userInterfaceStyle: userInterfaceStyle } }}>
        <NativeTabs.Trigger.Label>Comunidad</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.2", selected: "person.2" }} md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="nutrition" unstable_nativeProps={{ ios: { experimental_userInterfaceStyle: userInterfaceStyle } }}>
        <NativeTabs.Trigger.Label>Nutrición</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "flame", selected: "flame" }} md="local_fire_department" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="routines" unstable_nativeProps={{ ios: { experimental_userInterfaceStyle: userInterfaceStyle } }}>
        <NativeTabs.Trigger.Label>Rutinas</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "bolt", selected: "bolt" }} md="flash_on" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="hub" unstable_nativeProps={{ ios: { experimental_userInterfaceStyle: userInterfaceStyle } }}>
        <NativeTabs.Trigger.Label>Menú</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "square.grid.2x2", selected: "square.grid.2x2" }} md="grid_view" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
