import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

export default function TrainerLayout() {
  const authenticated = useAppStore(state => state.isAuthenticated);
  const token = useAppStore(state => state.token);
  const role = useAppStore(state => state.userProfile?.role);
  const loading = useAppStore(state => state.isLoading);
  const colors = useAppColors();

  if (!authenticated || !token) return <Redirect href="/login" />;
  if (!role && loading) return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <ActivityIndicator accessibilityLabel="Cargando perfil" color={colors.tint} />
    </View>
  );
  if (role !== 'trainer' && role !== 'admin') return <Redirect href="/(tabs)/hub" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
