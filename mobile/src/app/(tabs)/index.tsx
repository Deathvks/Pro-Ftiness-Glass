import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Flame, Play, Activity, Target, ChevronRight, CheckCircle, Clock } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

const { width } = Dimensions.get('window');

export default function Dashboard() {
  const user = useAppStore(state => state.userProfile) || useAppStore(state => state.user);
  const streak = useAppStore(state => state.gamification?.streak) || 0;
  const level = useAppStore(state => state.gamification?.level) || 1;
  const routines = useAppStore(state => state.routines) || [];
  const activeWorkout = useAppStore(state => state.activeWorkout);
  const router = useRouter();

  const renderRoutine = (routine) => {
    const isActive = activeWorkout && activeWorkout.id === routine.id;
    return (
      <TouchableOpacity key={routine.id} style={[styles.routineCard, isActive && styles.routineCardActive]}>
        <View style={styles.routineIconWrapper}>
          {isActive ? <Clock size={20} color='#3b82f6' /> : <Play size={20} color='#888' />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.routineName, isActive && styles.routineNameActive]} numberOfLines={1}>{routine.name}</Text>
          <Text style={styles.routineSub}>{isActive ? 'En curso' : 'Iniciar'}</Text>
        </View>
        <ChevronRight size={20} color='#555' />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name || 'Atleta'} 👋</Text>
            <Text style={styles.name}>¿Qué entrenamos hoy?</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame color='#f97316' size={20} fill='#f97316' />
            <Text style={styles.streakText}>{streak}</Text>
          </View>
        </View>

        {/* NIVEL CARD */}
        <View style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <Target color='#22c55e' size={24} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.levelTitle}>Nivel {level}</Text>
              <Text style={styles.levelSub}>Sigue entrenando para subir de nivel</Text>
            </View>
          </View>
        </View>

        {/* RUTINAS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tus Rutinas</Text>
            <TouchableOpacity onPress={() => router.push('/routines')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {routines.length > 0 ? (
            routines.slice(0, 3).map(renderRoutine)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes rutinas todavía.</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000' },
  container: { flex: 1, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 30 },
  greeting: { color: '#888', fontSize: 16, marginBottom: 4 },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  streakText: { color: '#f97316', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  levelCard: { backgroundColor: '#111', padding: 20, borderRadius: 24, marginBottom: 30, borderWidth: 1, borderColor: '#222' },
  levelHeader: { flexDirection: 'row', alignItems: 'center' },
  levelTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  levelSub: { color: '#888', fontSize: 14, marginTop: 2 },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  seeAll: { color: '#3b82f6', fontSize: 14, fontWeight: 'bold' },
  routineCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, marginBottom: 10 },
  routineCardActive: { borderColor: '#3b82f6', borderWidth: 1, backgroundColor: '#1e3a8a33' },
  routineIconWrapper: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  routineName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  routineNameActive: { color: '#3b82f6' },
  routineSub: { color: '#888', fontSize: 13 },
  emptyCard: { backgroundColor: '#111', padding: 30, borderRadius: 20, alignItems: 'center' },
  emptyText: { color: '#888', fontSize: 14 }
});
