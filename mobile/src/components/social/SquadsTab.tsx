import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Shield,
  PlusCircle,
  Hash,
  ChevronRight,
  ArrowLeft,
  Copy,
  LogOut,
  Trash2,
  Medal,
  X,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Clipboard from 'expo-clipboard';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import socialService from '@/services/socialService';
import { SocialUserAvatar } from './SocialUserAvatar';
import { ConfirmationModal } from './ConfirmationModal';
import { getContrastTextColor } from '@/utils/routineHelpers';

export function SquadsTab({ onNavigateProfile }: { onNavigateProfile?: (userId: any) => void }) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const userProfile = useAppStore(state => state.userProfile);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const accentTextColor = getContrastTextColor(colors.tint);

  const [squads, setSquads] = useState<any[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [squadName, setSquadName] = useState('');
  const [squadDesc, setSquadDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Leave / Delete Modals
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMySquads = async () => {
    setIsLoading(true);
    try {
      const data = await socialService.getMySquads();
      setSquads(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMySquads();
  }, []);

  const loadSquadDetail = async (squadId: string | number) => {
    setIsLoading(true);
    try {
      const data = await socialService.getSquadLeaderboard(squadId);
      setSelectedSquad(data);
    } catch (e) {
      Alert.alert('Error', 'No se pudo cargar el grupo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSquad = async () => {
    if (!squadName.trim()) return;
    setIsSubmitting(true);
    try {
      await socialService.createSquad({ name: squadName.trim(), description: squadDesc.trim() });
      setShowCreateModal(false);
      setSquadName('');
      setSquadDesc('');
      loadMySquads();
      Alert.alert('¡Éxito!', 'Grupo creado correctamente');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Error al crear el grupo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinSquad = async () => {
    if (!inviteCode.trim()) return;
    setIsSubmitting(true);
    try {
      await socialService.joinSquad(inviteCode.trim().toUpperCase());
      setShowJoinModal(false);
      setInviteCode('');
      loadMySquads();
      Alert.alert('¡Bienvenido!', 'Te has unido al grupo');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Código de grupo inválido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyCode = async (code: string) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert('Copiado', 'Código de invitación copiado al portapapeles');
  };

  const confirmLeaveSquad = async () => {
    if (!selectedSquad?.id) return;
    setActionLoading(true);
    try {
      await socialService.leaveSquad(selectedSquad.id);
      setLeaveModalVisible(false);
      setSelectedSquad(null);
      loadMySquads();
      Alert.alert('Grupo', 'Has salido del grupo');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al salir del grupo');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDeleteSquad = async () => {
    if (!selectedSquad?.id) return;
    setActionLoading(true);
    try {
      await socialService.deleteSquad(selectedSquad.id);
      setDeleteModalVisible(false);
      setSelectedSquad(null);
      loadMySquads();
      Alert.alert('Grupo', 'Grupo eliminado permanentemente');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Error al eliminar el grupo');
    } finally {
      setActionLoading(false);
    }
  };

  // --- SUBVIEW: SQUAD DETAIL / LEADERBOARD ---
  if (selectedSquad) {
    const myMembership = selectedSquad.Members?.find(
      (m: any) => String(m.id) === String(userProfile?.id)
    );
    const amIAdmin = myMembership?.SquadMember?.role === 'admin';

    return (
      <View style={styles.container}>
        <ConfirmationModal
          visible={leaveModalVisible}
          title="Abandonar grupo"
          message="¿Seguro que quieres abandonar este grupo?"
          confirmText="Abandonar"
          isLoading={actionLoading}
          onConfirm={confirmLeaveSquad}
          onCancel={() => setLeaveModalVisible(false)}
        />

        <ConfirmationModal
          visible={deleteModalVisible}
          title="Eliminar grupo"
          message="¿Seguro que quieres eliminar este grupo permanentemente? Esta acción no se puede deshacer."
          confirmText="Eliminar grupo"
          isDestructive={true}
          isLoading={actionLoading}
          onConfirm={confirmDeleteSquad}
          onCancel={() => setDeleteModalVisible(false)}
        />

        <View style={[styles.card, { borderColor: colors.border }]}>
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Bar */}
          <View style={styles.detailHeader}>
            <TouchableOpacity
              onPress={() => setSelectedSquad(null)}
              activeOpacity={0.7}
              style={[
                styles.backBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <ArrowLeft size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Shield size={18} color={colors.tint} style={{ marginRight: 6 }} />
                <Text style={[styles.squadDetailTitle, { color: colors.text }]} numberOfLines={1}>
                  {selectedSquad.name}
                </Text>
              </View>
              {selectedSquad.description ? (
                <Text style={[styles.squadDetailDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedSquad.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Action Pills */}
          <View style={styles.squadActionsRow}>
            <TouchableOpacity
              onPress={() => copyCode(selectedSquad.invite_code)}
              activeOpacity={0.75}
              style={[
                styles.actionPill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <Copy size={15} color={colors.text} style={{ marginRight: 6 }} />
              <Text style={[styles.actionPillText, { color: colors.text }]}>Código</Text>
            </TouchableOpacity>

            {!amIAdmin ? (
              <TouchableOpacity
                onPress={() => setLeaveModalVisible(true)}
                activeOpacity={0.75}
                style={[styles.actionPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
              >
                <LogOut size={15} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={[styles.actionPillText, { color: "#ef4444" }]}>Salir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(true)}
                activeOpacity={0.75}
                style={[styles.actionPill, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
              >
                <Trash2 size={15} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={[styles.actionPillText, { color: "#ef4444" }]}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Table Header */}
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.colHeader, { width: 32, textAlign: 'center' }]}>#</Text>
            <Text style={[styles.colHeader, { flex: 1, paddingLeft: 8 }]}>Miembro</Text>
            <Text style={[styles.colHeader, { width: 54, textAlign: 'right' }]}>Racha</Text>
            <Text style={[styles.colHeader, { width: 68, textAlign: 'right' }]}>XP</Text>
          </View>

          {/* Members list */}
          <View style={{ gap: 6, marginTop: 8 }}>
            {(selectedSquad.Members || []).map((member: any, index: number) => {
              const isMe = String(member.id) === String(userProfile?.id);
              const displayName = member.username?.includes('@')
                ? member.username.split('@')[0]
                : member.username || 'Usuario';

              let medal = null;
              if (index === 0) medal = <Medal size={18} color="#f59e0b" />;
              else if (index === 1) medal = <Medal size={18} color="#9ca3af" />;
              else if (index === 2) medal = <Medal size={18} color="#b45309" />;
              else medal = <Text style={[styles.rankNumber, { color: colors.textSecondary }]}>#{index + 1}</Text>;

              return (
                <TouchableOpacity
                  key={member.id}
                  activeOpacity={0.7}
                  onPress={() => onNavigateProfile && onNavigateProfile(member.id)}
                  style={[
                    styles.memberRow,
                    {
                      backgroundColor: isMe
                        ? colors.tint + '18'
                        : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                      borderColor: isMe ? colors.tint + '40' : 'transparent',
                    },
                  ]}
                >
                  <View style={{ width: 32, alignItems: 'center' }}>{medal}</View>

                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingLeft: 8 }}>
                    <SocialUserAvatar user={member} size={36} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text
                        style={[
                          styles.memberName,
                          { color: isMe ? colors.tint : colors.text, fontWeight: isMe ? '800' : '600' },
                        ]}
                        numberOfLines={1}
                      >
                        {displayName} {isMe && '(Tú)'}
                      </Text>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                          },
                        ]}
                      >
                        <Text style={[styles.roleText, { color: colors.textSecondary }]}>
                          {member.SquadMember?.role || 'member'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ width: 54, alignItems: 'flex-end' }}>
                    <Text style={styles.streakText}>🔥 {member.streak || 0}</Text>
                  </View>

                  <View style={{ width: 68, alignItems: 'flex-end' }}>
                    <Text style={[styles.xpText, { color: colors.text }]}>
                      {member.xp?.toLocaleString() || 0}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    );
  }

  // --- MAIN VIEW: SQUADS LIST ---
  return (
    <View style={styles.container}>
      {/* Top 2 Buttons: Crear Grupo & Unirse a Grupo */}
      <View style={styles.topButtonsRow}>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.85}
          style={[styles.primaryActionBtn, { backgroundColor: colors.tint }]}
        >
          <PlusCircle size={18} color={accentTextColor} style={{ marginRight: 6 }} />
          <Text style={[styles.primaryActionText, { color: accentTextColor }]}>Crear Grupo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowJoinModal(true)}
          activeOpacity={0.8}
          style={[
            styles.secondaryActionBtn,
            {
              backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              borderColor: colors.border,
            },
          ]}
        >
          <Hash size={18} color={colors.text} style={{ marginRight: 6 }} />
          <Text style={[styles.secondaryActionText, { color: colors.text }]}>Unirse a Grupo</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { borderColor: colors.border }]}>
        <GlassView
          glassEffectStyle="regular"
          colorScheme={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />

        <Text style={[styles.title, { color: colors.text }]}>Mis Grupos</Text>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : squads.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)' },
            ]}
          >
            <View style={[styles.emptyIconBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)' }]}>
              <Shield size={32} color={colors.textSecondary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No perteneces a ningún grupo
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Crea uno o únete para competir con tus amigos
            </Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginTop: 14 }}>
            {squads.map(squad => (
              <TouchableOpacity
                key={squad.id}
                onPress={() => loadSquadDetail(squad.id)}
                activeOpacity={0.7}
                style={[
                  styles.squadItem,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                    borderColor: colors.border + '40',
                  },
                ]}
              >
                <View style={[styles.squadIconBadge, { backgroundColor: colors.tint + '15' }]}>
                  <Shield size={24} color={colors.tint} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.squadName, { color: colors.text }]} numberOfLines={1}>
                    {squad.name}
                  </Text>
                  <Text style={[styles.squadDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {squad.description || 'Sin descripción'}
                  </Text>
                </View>

                <ChevronRight size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* CREATE SQUAD MODAL */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardWrapper}>
            <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[styles.modalCard, { borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Crear Grupo</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nombre del Grupo</Text>
              <TextInput
                value={squadName}
                onChangeText={setSquadName}
                placeholder="Escribe el nombre..."
                placeholderTextColor={colors.textSecondary + '80'}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary, marginTop: 12 }]}>Descripción (Opcional)</Text>
              <TextInput
                value={squadDesc}
                onChangeText={setSquadDesc}
                placeholder="¿De qué trata este grupo?"
                placeholderTextColor={colors.textSecondary + '80'}
                style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
              />

              <TouchableOpacity
                onPress={handleCreateSquad}
                disabled={!squadName.trim() || isSubmitting}
                activeOpacity={0.85}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.tint, opacity: !squadName.trim() || isSubmitting ? 0.5 : 1 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={accentTextColor} />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: accentTextColor }]}>Crear Grupo</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* JOIN SQUAD MODAL */}
      <Modal visible={showJoinModal} transparent animationType="slide" onRequestClose={() => setShowJoinModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardWrapper}>
            <GlassView glassEffectStyle="regular" colorScheme={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            <View style={[styles.modalCard, { borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Unirse a un Grupo</Text>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Código de Invitación</Text>
              <TextInput
                value={inviteCode}
                onChangeText={t => setInviteCode(t.toUpperCase())}
                placeholder="Ej: A1B2C3D4"
                placeholderTextColor={colors.textSecondary + '80'}
                autoCapitalize="characters"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    textAlign: 'center',
                    letterSpacing: 3,
                    fontWeight: '800',
                  },
                ]}
              />

              <TouchableOpacity
                onPress={handleJoinSquad}
                disabled={!inviteCode.trim() || isSubmitting}
                activeOpacity={0.85}
                style={[styles.modalSubmitBtn, { backgroundColor: colors.tint, opacity: !inviteCode.trim() || isSubmitting ? 0.5 : 1 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={accentTextColor} />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: accentTextColor }]}>Unirse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  topButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyState: {
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  squadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  squadIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  squadDesc: {
    fontSize: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  squadDetailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  squadDetailDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  squadActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginTop: 6,
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#9ca3af',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: '700',
  },
  memberName: {
    fontSize: 14,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginTop: 2,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#f97316',
  },
  xpText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  modalCard: {
    padding: 22,
    borderWidth: 1,
    borderRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
