import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import CustomTabBar from '@/components/CustomTabBar';

export default function AppTabs() {
  const theme = useAppStore(state => state.theme);
  const colors = Colors[theme] || Colors.oled;

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Comunidad',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "people" : "people-outline"} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrición',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "flame" : "flame-outline"} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rutinas',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "flash" : "flash-outline"} color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="hub"
        options={{
          title: 'Menú',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "grid" : "grid-outline"} color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
