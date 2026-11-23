import { Cpu, RefreshCw } from 'lucide-react-native';
import { View } from 'react-native';
import { useAppColors } from '@/hooks/useAppColors';
import apiClient from '@/services/apiClient';
import { adminWrite } from '@/services/adminService';
import { AdminButton, AdminCard, AdminLoad, AdminText, confirmAdmin, styles, useAdminAction } from './AdminUI';

type Memory = { stats: { ram: { heapUsed: number } } };
const loadMemory = () => apiClient('/admin/system-stats');

export function AdminSystemBar() {
  const colors = useAppColors();
  const { busy, run } = useAdminAction();
  return <AdminLoad<Memory> load={loadMemory}>{({ stats }, reload) => (
    <AdminCard>
      <View style={styles.toggle}>
        <View style={[styles.actions, { alignItems: 'center', flexShrink: 1 }]}>
          <View style={{ padding: 9, borderRadius: 11, backgroundColor: colors.tint + '20' }}><Cpu color={colors.text} size={17} /></View>
          <View>
            <AdminText secondary>RAM usada</AdminText>
            <AdminText strong>{stats.ram.heapUsed} MB</AdminText>
          </View>
        </View>
        <AdminButton icon={RefreshCw} label={busy ? 'Liberando…' : 'Liberar RAM'} variant="primary" disabled={busy} onPress={() =>
          confirmAdmin('Liberar RAM', 'Se ejecutará el recolector de memoria del servidor.', () => void run(() =>
            adminWrite('/admin/free-memory', 'POST'), result => result.message, reload), 'Liberar')} />
      </View>
    </AdminCard>
  )}</AdminLoad>;
}
