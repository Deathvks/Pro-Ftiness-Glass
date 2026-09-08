import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopWidth: 1,
          borderTopColor: '#333',
          paddingBottom: insets.bottom > 0 ? insets.bottom + 5 : 10,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0)
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600'
        }
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
