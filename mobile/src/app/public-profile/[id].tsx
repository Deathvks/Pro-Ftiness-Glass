import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AnimatedScreen from '@/components/AnimatedScreen';
import GlobalHeader from '@/components/GlobalHeader';
import { SocialUserAvatar, type AvatarUser } from '@/components/social/SocialUserAvatar';
import { useAppColors } from '@/hooks/useAppColors';
import socialService from '@/services/socialService';
import useAppStore from '@/store/useAppStore';

type PublicProfile = AvatarUser & {
  bio?: string;
  is_me?: boolean;
  show_level_xp?: boolean;
  level?: number;
  workoutsCount?: number;
};

export default function PublicProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viewerId = useAppStore(state => state.token ? state.userProfile?.id : null);
  return <PublicProfileScreen key={`${id}:${viewerId ?? 'anonymous'}`} id={id} />;
}

function PublicProfileScreen({ id }: { id: string }) {
  const colors = useAppColors();
  const router = useRouter();
  const token = useAppStore(state => state.token);
  const [result, setResult] = useState<{ profile?: PublicProfile; error?: string }>();

  useEffect(() => {
    let active = true;
    socialService.getPublicProfile(encodeURIComponent(id)).then(
      (profile: PublicProfile) => { if (active && useAppStore.getState().token === token) setResult({ profile }); },
      (error: Error & { status?: number }) => {
        if (!active || useAppStore.getState().token !== token) return;
        setResult({ error: error.status === 403 ? 'Este perfil es privado.' : 'No se pudo cargar el perfil.' });
      },
    );
    return () => { active = false; };
  }, [id, token]);

  const profile = result?.profile;
  return (
    <AnimatedScreen header={<GlobalHeader title="Perfil público" showBackButton hideRightButtons />}>
      {!result ? <ActivityIndicator accessibilityLabel="Cargando perfil" color={colors.tint} style={styles.status} />
        : !profile ? <Text accessibilityRole="alert" style={[styles.status, { color: colors.text }]}>{result.error}</Text>
          : (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SocialUserAvatar user={profile} size={100} gapColor={colors.card} />
              <Text accessibilityRole="header" style={[styles.name, { color: colors.text }]}>{profile.username || 'Usuario'}</Text>
              {!!profile.bio && <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>}
              {profile.show_level_xp && (
                <Text style={{ color: colors.textSecondary }}>Nivel {profile.level ?? 1} · {profile.workoutsCount ?? 0} entrenamientos</Text>
              )}
              {profile.is_me && (
                <Pressable accessibilityRole="button" onPress={() => router.push('/profile')}>
                  <Text style={{ color: colors.tint, fontWeight: '700' }}>Editar mi perfil</Text>
                </Pressable>
              )}
            </View>
          )}
    </AnimatedScreen>
  );
}

const styles = StyleSheet.create({
  status: { marginTop: 32, textAlign: 'center' },
  card: { alignItems: 'center', gap: 12, padding: 24, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth },
  name: { fontSize: 24, fontWeight: '800' },
  bio: { textAlign: 'center', lineHeight: 21 },
});
