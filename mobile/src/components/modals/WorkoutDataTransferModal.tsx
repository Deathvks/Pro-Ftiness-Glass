/* mobile/src/components/modals/WorkoutDataTransferModal.tsx */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  Dumbbell,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import {
  parseWorkoutCSV,
  exportWorkoutsToCSV,
  ParsedWorkoutResult,
} from '@/utils/csvWorkoutParser';
import api from '@/services/apiClient';
import { SwipeableBottomSheet, getAppleSheetCardStyle } from '@/components/ui/SwipeableBottomSheet';

interface WorkoutDataTransferModalProps {
  visible: boolean;
  isOpen?: boolean;
  onClose: () => void;
  initialTab?: 'import' | 'export';
}

export function WorkoutDataTransferModal({
  visible,
  isOpen,
  onClose,
  initialTab = 'import',
}: WorkoutDataTransferModalProps) {
  const isModalVisible = visible ?? isOpen ?? false;
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';

  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  const [activeTab, setActiveTab] = useState<'import' | 'export'>(initialTab);
  const [csvText, setCsvText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedWorkoutResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showPasteInput, setShowPasteInput] = useState(false);

  const resetImport = () => {
    setCsvText('');
    setFileName(null);
    setParseResult(null);
    setParseError(null);
    setIsImporting(false);
  };

  const handlePickDocument = async () => {
    try {
      setParseError(null);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setIsParsing(true);

      const targetFile = new ExpoFile(file.uri);
      const fileContent = await targetFile.text();

      try {
        const parsed = parseWorkoutCSV(fileContent);
        setParseResult(parsed);
        setCsvText(fileContent);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}
      } catch (err: any) {
        setParseError(err?.message || 'No se pudo parsear el archivo CSV.');
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}
      } finally {
        setIsParsing(false);
      }
    } catch (e: any) {
      setIsParsing(false);
      setParseError(e?.message || 'Error al seleccionar archivo.');
    }
  };

  const handleParseText = () => {
    if (!csvText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    try {
      const parsed = parseWorkoutCSV(csvText);
      setParseResult(parsed);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err: any) {
      setParseError(err?.message || 'Formato CSV no reconocido.');
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setIsParsing(false);
    }
  };

  const handleImportToHistory = async () => {
    if (!parseResult || parseResult.workouts.length === 0) return;
    setIsImporting(true);

    try {
      const payload = {
        workouts: parseResult.workouts,
        skipDuplicates,
        platform: parseResult.platform,
      };

      await api('/workouts/bulk-import', {
        method: 'POST',
        data: payload,
      });

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}

      if (fetchInitialData) {
        await fetchInitialData();
      }

      Alert.alert(
        '¡Importación completada! 🎉',
        `Se han importado ${parseResult.workouts.length} entrenamientos a tu historial con éxito.`,
        [{ text: 'Aceptar', onPress: onClose }]
      );
    } catch (error: any) {
      console.warn('Error en bulk-import:', error);
      Alert.alert(
        'Error de importación',
        error?.response?.data?.message || error?.message || 'No se pudieron guardar los entrenamientos.'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (workoutLog.length === 0) {
      Alert.alert('Sin entrenamientos', 'No tienes entrenamientos registrados en tu historial para exportar.');
      return;
    }

    setIsExporting(true);
    try {
      const csvData = exportWorkoutsToCSV(workoutLog);
      const filename = `profitnessglass_historial_${new Date().toISOString().slice(0, 10)}.csv`;
      const exportFile = new ExpoFile(Paths.cache, filename);

      await exportFile.write(csvData);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(exportFile.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar historial de entrenamientos',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Éxito', `Archivo generado en: ${exportFile.uri}`);
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    } catch (err: any) {
      console.warn('Error al exportar CSV:', err);
      Alert.alert('Error', 'No se pudo exportar el historial a CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <SwipeableBottomSheet
      visible={isModalVisible}
      onClose={onClose}
      isDark={isDark}
      backgroundColor={isDark ? '#141418' : '#FAFAFC'}
      avoidKeyboard
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
        ]}
      >
        <View style={styles.headerInfoGroup}>
          <View style={[styles.iconWrap, { backgroundColor: colors.tint + '20' }]}>
            <FileSpreadsheet size={22} color={colors.tint} />
          </View>
          <View style={styles.headerTitles}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              Importar / Exportar Datos
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              Soporta Hevy, Strong y Pro Fitness Glass en CSV
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={[
            styles.closeBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
          ]}
          activeOpacity={0.7}
        >
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector Segmentado */}
      <View
        style={[
          styles.segmentContainer,
          {
            backgroundColor: isIOS
              ? isDark
                ? 'rgba(118, 118, 128, 0.24)'
                : 'rgba(118, 118, 128, 0.12)'
              : 'rgba(255, 255, 255, 0.06)',
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('import')}
          activeOpacity={0.8}
          style={[
            styles.segmentBtn,
            activeTab === 'import' && {
              backgroundColor: isIOS ? (isDark ? '#636366' : '#FFFFFF') : colors.tint,
            },
          ]}
        >
          <UploadCloud
            size={16}
            color={activeTab === 'import' ? (isIOS ? colors.text : '#000') : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  activeTab === 'import' ? (isIOS ? colors.text : '#000') : colors.textSecondary,
              },
              activeTab === 'import' && { fontWeight: isIOS ? '700' : '900' },
            ]}
          >
            Importar CSV
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('export')}
          activeOpacity={0.8}
          style={[
            styles.segmentBtn,
            activeTab === 'export' && {
              backgroundColor: isIOS ? (isDark ? '#636366' : '#FFFFFF') : colors.tint,
            },
          ]}
        >
          <Download
            size={16}
            color={activeTab === 'export' ? (isIOS ? colors.text : '#000') : colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              {
                color:
                  activeTab === 'export' ? (isIOS ? colors.text : '#000') : colors.textSecondary,
              },
              activeTab === 'export' && { fontWeight: isIOS ? '700' : '900' },
            ]}
          >
            Exportar CSV
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* TAB IMPORTAR */}
        {activeTab === 'import' && (
          <View style={{ gap: 14 }}>
            {/* Banner informativo */}
            <View
              style={[
                styles.infoBanner,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: colors.border,
                },
                getAppleSheetCardStyle(isDark, 16),
              ]}
            >
              <Sparkles size={16} color={colors.tint} style={{ marginTop: 2 }} />
              <Text style={[styles.infoBannerText, { color: colors.textSecondary }]}>
                Transfiere tu historial completo desde Hevy o Strong sin perder series, pesos ni fechas.
              </Text>
            </View>

            {/* Botón Selección de Archivo */}
            <TouchableOpacity
              onPress={handlePickDocument}
              disabled={isParsing}
              activeOpacity={0.8}
              style={[
                styles.pickFileCard,
                {
                  borderColor: colors.tint + '50',
                  backgroundColor: colors.tint + '08',
                },
              ]}
            >
              {isParsing ? (
                <ActivityIndicator size="small" color={colors.tint} />
              ) : (
                <UploadCloud size={28} color={colors.tint} />
              )}
              <Text style={[styles.pickFileTitle, { color: colors.text }]}>
                {fileName ? fileName : 'Seleccionar archivo .csv'}
              </Text>
              <Text style={[styles.pickFileSubtitle, { color: colors.textMuted }]}>
                Toca aquí para buscar el archivo exportado en tu dispositivo
              </Text>
            </TouchableOpacity>

            {/* Error de parseo */}
            {parseError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#ef4444" />
                <Text style={styles.errorText}>{parseError}</Text>
              </View>
            ) : null}

            {/* Alternativa de pegar texto */}
            {!parseResult && (
              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowPasteInput(v => !v)}
                  style={{ alignSelf: 'center', paddingVertical: 4 }}
                >
                  <Text style={[styles.togglePasteText, { color: colors.tint }]}>
                    {showPasteInput ? 'Ocultar pegado manual' : 'O pegar texto CSV directamente'}
                  </Text>
                </TouchableOpacity>

                {showPasteInput && (
                  <View style={{ gap: 8 }}>
                    <TextInput
                      multiline
                      numberOfLines={4}
                      value={csvText}
                      onChangeText={setCsvText}
                      placeholder="Pega aquí el contenido de tu CSV..."
                      placeholderTextColor={colors.textSecondary}
                      style={[
                        styles.pasteInput,
                        {
                          color: colors.text,
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: colors.border,
                        },
                        getAppleSheetCardStyle(isDark, 16),
                      ]}
                    />
                    <TouchableOpacity
                      onPress={handleParseText}
                      style={[styles.parseBtn, { backgroundColor: colors.tint }]}
                    >
                      <Text style={styles.parseBtnText}>Procesar texto</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Resumen del parseo listo */}
            {parseResult && (
              <View style={{ gap: 12 }}>
                <View style={styles.previewHeaderRow}>
                  <View style={[styles.platformPill, { backgroundColor: colors.tint + '18' }]}>
                    <CheckCircle2 size={12} color={colors.tint} />
                    <Text style={[styles.platformText, { color: colors.tint }]}>
                      Plataforma: {parseResult.platform.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={resetImport}>
                    <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                      Cambiar archivo
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Bento Grid de estadísticas */}
                <View style={styles.statsGrid}>
                  <View
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                      getAppleSheetCardStyle(isDark, 16),
                    ]}
                  >
                    <Calendar size={18} color="#3b82f6" style={{ marginBottom: 4 }} />
                    <Text style={[styles.statVal, { color: colors.text }]}>
                      {parseResult.summary.totalWorkouts}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                      Entrenamientos
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                      getAppleSheetCardStyle(isDark, 16),
                    ]}
                  >
                    <Dumbbell size={18} color="#10b981" style={{ marginBottom: 4 }} />
                    <Text style={[styles.statVal, { color: colors.text }]}>
                      {parseResult.summary.totalExercises}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                      Ejercicios
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statBox,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        borderColor: colors.border,
                      },
                      getAppleSheetCardStyle(isDark, 16),
                    ]}
                  >
                    <Layers size={18} color="#f59e0b" style={{ marginBottom: 4 }} />
                    <Text style={[styles.statVal, { color: colors.text }]}>
                      {parseResult.summary.totalSets}
                    </Text>
                    <Text style={[styles.statLbl, { color: colors.textSecondary }]}>
                      Series totales
                    </Text>
                  </View>
                </View>

                {/* Toggle Omitir Duplicados */}
                <TouchableOpacity
                  onPress={() => setSkipDuplicates(v => !v)}
                  activeOpacity={0.8}
                  style={[
                    styles.checkboxRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : 'rgba(0, 0, 0, 0.03)',
                      borderColor: colors.border,
                    },
                    getAppleSheetCardStyle(isDark, 16),
                  ]}
                >
                  <View
                    style={[
                      styles.checkbox,
                      skipDuplicates && { backgroundColor: colors.tint, borderColor: colors.tint },
                    ]}
                  >
                    {skipDuplicates && <CheckCircle2 size={14} color="#000" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.checkboxLabel, { color: colors.text }]}>
                      Omitir duplicados ya existentes
                    </Text>
                    <Text style={[styles.checkboxDesc, { color: colors.textSecondary }]}>
                      Evita volver a importar sesiones que ya tengas registradas en esa misma fecha.
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Botón Confirmar Importación */}
                <TouchableOpacity
                  onPress={handleImportToHistory}
                  disabled={isImporting}
                  activeOpacity={0.85}
                  style={[styles.importBtn, { backgroundColor: colors.tint }]}
                >
                  {isImporting ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <>
                      <ShieldCheck size={18} color="#000" />
                      <Text style={styles.importBtnText}>
                        Importar {parseResult.summary.totalWorkouts} entrenamientos
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* TAB EXPORTAR */}
        {activeTab === 'export' && (
          <View style={{ gap: 16 }}>
            <View
              style={[
                styles.exportCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: colors.border,
                },
                getAppleSheetCardStyle(isDark, 20),
              ]}
            >
              <Download size={32} color={colors.tint} style={{ marginBottom: 8 }} />
              <Text style={[styles.exportTitle, { color: colors.text }]}>
                Exporta tu Historial de Entrenamientos
              </Text>
              <Text style={[styles.exportDesc, { color: colors.textSecondary }]}>
                Genera un archivo CSV con formato universal compatible con Excel, Google Sheets, Hevy y Strong para que siempre tengas tus datos a salvo.
              </Text>

              <View style={[styles.countPill, { backgroundColor: colors.tint + '18' }]}>
                <Text style={[styles.countPillText, { color: colors.tint }]}>
                  {workoutLog.length} entrenamientos disponibles para exportar
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleExportCSV}
              disabled={isExporting}
              activeOpacity={0.85}
              style={[styles.exportBtn, { backgroundColor: colors.tint }]}
            >
              {isExporting ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <Download size={18} color="#000" />
                  <Text style={styles.exportBtnText}>Exportar Historial en CSV</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: Platform.OS === 'ios' ? '700' : '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 6,
    padding: 3,
    borderRadius: 12,
    borderCurve: 'continuous',
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 24,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
    fontWeight: '500',
  },
  pickFileCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 20,
    borderCurve: 'continuous',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  pickFileTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  pickFileSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    flex: 1,
  },
  togglePasteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pasteInput: {
    height: 90,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  parseBtn: {
    paddingVertical: 11,
    borderRadius: 14,
    alignItems: 'center',
  },
  parseBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  platformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetText: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkboxDesc: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 15,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  exportCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  exportDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 17,
  },
  countPill: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  countPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
});
