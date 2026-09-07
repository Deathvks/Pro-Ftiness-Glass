import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame, Play, Activity } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useRouter } from 'expo-router';

export default function Dashboard() {
  const user = useAppStore(state => state.user);
  const streak = useAppStore(state => state.streak) || 0;
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola,</Text>
          <Text style={styles.name}>{user?.name || 'Atleta'}</Text>
        </View>
        <View style={styles.streakBadge}>
          <Flame color='#f97316' size={20} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startWorkoutBtn}>
        <Play color='#fff' size={24} fill='#fff' />
        <Text style={styles.startWorkoutText}>Empezar Entrenamiento</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity color='#3b82f6' size={20} />
          <Text style={styles.cardTitle}>Resumen Semanal</Text>
        </View>
        <Text style={styles.cardText}>Pronto añadiremos aquí tus gráficos nativos.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 30 },
  greeting: { color: '#888', fontSize: 16 },
  name: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#222', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  streakText: { color: '#f97316', fontWeight: 'bold', fontSize: 16, marginLeft: 4 },
  startWorkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3b82f6', padding: 18, borderRadius: 16, marginBottom: 20 },
  startWorkoutText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
  card: { backgroundColor: '#111', padding: 20, borderRadius: 16, marginTop: 10, borderWidth: 1, borderColor: '#222' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  cardText: { color: '#888', fontSize: 14 }
});
