import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const colors = useAppColors();
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(isAuthenticated ? '/(tabs)' : '/login');
        }
      } catch {}
    }, 150);
    return () => clearTimeout(timer);
  }, [isAuthenticated, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color={colors.tint} />
    </View>
  );
}
