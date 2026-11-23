import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

export default function AdminLayout() {
  const isAuthenticated = useAppStore(state => state.isAuthenticated);
  const token = useAppStore(state => state.token);
  const user = useAppStore(state => state.userProfile);
  const loading = useAppStore(state => state.isLoading);
  const colors = useAppColors();

  if (!isAuthenticated || !token) return <Redirect href="/login" />;
  if (!user && loading) return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Cargando perfil" color={colors.tint} />
    </View>
  );
  if (user?.role !== 'admin') return <Redirect href="/(tabs)/hub" />;

  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: 'transparent' } }} />;
}
