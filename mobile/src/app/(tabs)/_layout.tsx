import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useAppColors } from '@/hooks/useAppColors';

export default function AppTabs() {
  const colors = useAppColors();

  return (
    <NativeTabs
      key={colors.tint}
      activeTintColor={colors.tint}
      activeIndicatorColor={colors.tint}
      inactiveTintColor={colors.textSecondary}
      iconColor={{ default: colors.textSecondary, selected: colors.tint }}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.textSecondary,
        activeIndicatorColor: colors.tint,
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
