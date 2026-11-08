/* mobile/src/components/routines/TemplateRoutinesView.tsx */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {
  Compass,
  Copy,
  Play,
  Search,
  Dumbbell,
  Clock,
  Sparkles,
  Check,
} from 'lucide-react-native';
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useRouter } from 'expo-router';

const DEFAULT_TEMPLATES = [
  {
    id: 'def_fullbody',
    name: 'Full Body (Mancuernas)',
    description: 'Rutina de cuerpo completo utilizando principalmente mancuernas.',
    folder: 'Básicas',
    exercises: [
      { name: 'Sentadilla Frontal con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Cuádriceps' },
      { name: 'Press de Banca con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Pecho' },
      { name: 'Peso Muerto Rumano con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Isquios' },
      { name: 'Press de Hombros con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Hombros' },
      { name: 'Remo con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Espalda' },
    ],
  },
  {
    id: 'def_torso',
    name: 'Torso (Upper Body)',
    description: 'Entrenamiento enfocado en pecho, espalda, hombros y brazos.',
    folder: 'Básicas',
    exercises: [
      { name: 'Press de Banca con Mancuernas', sets: 4, reps: '8-12', muscle_group: 'Pecho' },
      { name: 'Dominadas Supinas', sets: 3, reps: 'Al fallo', muscle_group: 'Espalda' },
      { name: 'Press de Hombros con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Hombros' },
      { name: 'Elevaciones Laterales con Mancuernas', sets: 3, reps: '12-15', muscle_group: 'Hombros' },
      { name: 'Extensión de Tríceps en Polea', sets: 3, reps: '12-15', muscle_group: 'Tríceps' },
      { name: 'Curl de Bíceps con Mancuernas', sets: 3, reps: '12-15', muscle_group: 'Bíceps' },
    ],
  },
  {
    id: 'def_pierna',
    name: 'Pierna (Lower Body)',
    description: 'Entrenamiento completo y equilibrado de tren inferior.',
    folder: 'Básicas',
    exercises: [
      { name: 'Sentadilla Frontal con Mancuernas', sets: 4, reps: '8-10', muscle_group: 'Cuádriceps' },
      { name: 'Zancada Trasera con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Glúteos' },
      { name: 'Peso Muerto Rumano con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Isquios' },
      { name: 'Hip Thrust con Mancuernas', sets: 3, reps: '12-15', muscle_group: 'Glúteos' },
      { name: 'Elevación de Gemelos Sentado', sets: 4, reps: '15-20', muscle_group: 'Gemelos' },
    ],
  },
  {
    id: 'def_push',
    name: 'Push (Empuje)',
    description: 'Foco en pectoral, deltoides anterior y tríceps con alta intensidad.',
    folder: 'PPL',
    exercises: [
      { name: 'Press de Banca Plano con Barra', sets: 4, reps: '6-8', muscle_group: 'Pecho' },
      { name: 'Press Militar con Barra', sets: 3, reps: '8-10', muscle_group: 'Hombros' },
      { name: 'Press Inclinado con Mancuernas', sets: 3, reps: '10-12', muscle_group: 'Pecho' },
      { name: 'Elevaciones Laterales con Polea', sets: 4, reps: '12-15', muscle_group: 'Hombros' },
      { name: 'Fondos en Paralelas (Dips)', sets: 3, reps: '10-12', muscle_group: 'Tríceps' },
      { name: 'Extensión de Tríceps Katana', sets: 3, reps: '12-15', muscle_group: 'Tríceps' },
    ],
  },
  {
    id: 'def_pull',
    name: 'Pull (Tracción)',
    description: 'Espalda completa, deltoides posterior y bíceps braquial.',
    folder: 'PPL',
    exercises: [
      { name: 'Jalón al Pecho Agarre Neutro', sets: 4, reps: '8-10', muscle_group: 'Espalda' },
      { name: 'Remo con Barra Pendlay', sets: 3, reps: '8-10', muscle_group: 'Espalda' },
      { name: 'Face Pull con Cuerda', sets: 4, reps: '15', muscle_group: 'Hombros' },
      { name: 'Curl Bíceps en Banco Inclinado', sets: 3, reps: '10-12', muscle_group: 'Bíceps' },
      { name: 'Curl Martillo en Polea', sets: 3, reps: '12-15', muscle_group: 'Bíceps' },
    ],
  },
];

export function TemplateRoutinesView() {
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore(state => state.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const createRoutine = useAppStore(state => state.createRoutine);
  const startWorkout = useAppStore(state => state.startWorkout);

  const [query, setQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});

  const folders = useMemo(() => {
    const list = DEFAULT_TEMPLATES.map(t => t.folder);
    return ['all', ...Array.from(new Set(list))];
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DEFAULT_TEMPLATES.filter(item => {
      const matchText = !q || item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      const matchFolder = selectedFolder === 'all' || item.folder === selectedFolder;
      return matchText && matchFolder;
    });
  }, [query, selectedFolder]);

  const handleCopyTemplate = async (template: typeof DEFAULT_TEMPLATES[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const payload = {
      name: template.name,
      description: template.description,
      folder: template.folder,
      exercises: template.exercises.map((ex, idx) => ({
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: 60,
        exercise_order: idx,
      })),
    };

    const res = await createRoutine(payload);
    if (res && res.success !== false) {
      setCopiedIds(prev => ({ ...prev, [template.id]: true }));
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      Alert.alert(
        '¡Plantilla copiada! 🎉',
        `"${template.name}" se ha añadido a tu lista de Mis Rutinas.`
      );
    } else {
      Alert.alert('Error', res?.message || 'No se pudo copiar la rutina.');
    }
  };

  const handleStartTemplateDirect = async (template: typeof DEFAULT_TEMPLATES[0]) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}

    const routineObj = {
      id: `template_${template.id}`,
      name: template.name,
      description: template.description,
      folder: template.folder,
      exercises: template.exercises.map((ex, idx) => ({
        name: ex.name,
        muscle_group: ex.muscle_group,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: 60,
        exercise_order: idx,
      })),
    };

    if (startWorkout) {
      await startWorkout(routineObj);
    }
    router.push('/workout');
  };

  return (
    <View style={{ gap: 14 }}>
      {/* Buscador de plantillas */}
      <View
        style={[
          styles.searchWrap,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            borderColor: colors.border,
          },
        ]}
      >
        <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar plantillas prediseñadas..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Carpetas / Categorías */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {folders.map(f => {
          const isAct = selectedFolder === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setSelectedFolder(f)}
              style={[
                styles.folderPill,
                {
                  backgroundColor: isAct ? colors.tint : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderColor: isAct ? colors.tint : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.folderPillText,
                  { color: isAct ? '#000' : colors.textSecondary },
                  isAct && { fontWeight: '900' },
                ]}
              >
                {f === 'all' ? 'Todas' : f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Listado de tarjetas de plantillas con Liquid Glass */}
      <View style={{ gap: 12 }}>
        {filteredTemplates.map(item => {
          const isCopied = copiedIds[item.id];

          return (
            <View
              key={item.id}
              style={[
                styles.templateCard,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(255, 255, 255, 0.65)',
                  borderColor: colors.border,
                },
              ]}
            >
              <GlassView
                glassEffectStyle="regular"
                colorScheme={isDark ? 'dark' : 'light'}
                style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
              />

              <View style={styles.templateTop}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.templateName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.categoryPill, { backgroundColor: colors.tint + '15' }]}>
                      <Text style={[styles.categoryText, { color: colors.tint }]}>
                        {item.folder}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.templateDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                </View>
              </View>

              {/* Lista compacta de ejercicios */}
              <View style={[styles.exList, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                {item.exercises.map((ex, exIdx) => (
                  <View key={exIdx} style={styles.exRow}>
                    <Text style={[styles.exName, { color: colors.text }]} numberOfLines={1}>
                      {ex.name}
                    </Text>
                    <Text style={[styles.exSets, { color: colors.textSecondary }]}>
                      {ex.sets}×{ex.reps}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Botones de acción (Copiar / Iniciar) */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  onPress={() => handleCopyTemplate(item)}
                  activeOpacity={0.8}
                  style={[
                    styles.copyBtn,
                    {
                      backgroundColor: isCopied ? 'rgba(16, 185, 129, 0.15)' : colors.tint + '15',
                      borderColor: isCopied ? 'rgba(16, 185, 129, 0.35)' : colors.tint + '35',
                    },
                  ]}
                >
                  {isCopied ? (
                    <>
                      <Check size={14} color="#10b981" />
                      <Text style={[styles.copyBtnText, { color: '#10b981' }]}>Copiada</Text>
                    </>
                  ) : (
                    <>
                      <Copy size={14} color={colors.tint} />
                      <Text style={[styles.copyBtnText, { color: colors.tint }]}>Copiar a Mis Rutinas</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleStartTemplateDirect(item)}
                  activeOpacity={0.8}
                  style={[styles.startBtn, { backgroundColor: colors.tint }]}
                >
                  <Play size={14} color="#000" fill="#000" />
                  <Text style={styles.startBtnText}>Iniciar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  folderPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  folderPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  templateCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  templateTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '900',
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  templateDesc: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  exList: {
    borderRadius: 14,
    padding: 10,
    gap: 6,
    marginBottom: 12,
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  exSets: {
    fontSize: 11,
    fontWeight: '700',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  copyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
});
