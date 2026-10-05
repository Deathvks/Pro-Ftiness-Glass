import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator, Alert, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Sparkles, X, Zap, Loader2, AlertCircle } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getContrastColor } from '@/utils/colorUtils';
import { GlassView } from 'expo-glass-effect';
import { GlassButton } from '@/components/ui/GlassButton';
import { askTrainerAI } from '@/services/aiService';

interface RoutineAIGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (routine: any) => void;
}

export function RoutineAIGeneratorModal({ visible, onClose, onGenerate }: RoutineAIGeneratorModalProps) {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gamification = useAppStore(state => state.gamification) || {};
  const [remainingUses, setRemainingUses] = useState<number | null>(gamification.ai_queries_remaining ?? null);
  const dailyLimit = gamification.ai_queries_limit || 5;

  const isLimitReached = remainingUses !== null && remainingUses <= 0;

  const handleGenerate = async () => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const allExercises = await useAppStore.getState().getOrFetchAllExercises();
      const dbNames = allExercises.map(e => e.name).join(', ');

      const aiPrompt = `
      PASO 1: Evalúa si el mensaje tiene sentido para crear una rutina deportiva (ej. menciona músculos, objetivos, días, etc.).
      - Si el mensaje es un saludo ("hola"), es ambiguo, o NO está relacionado con fitness, DEBES RECHAZARLO.
      - Si el usuario pide MÁS DE UNA rutina o una rutina de varios días que no se pueda unificar en una sola sesión, DEBES RECHAZARLO explicando que solo puedes crear una rutina por consulta.
      
      El usuario dice: "${userPrompt}"

      PASO 2: Si es VÁLIDO, crea UNA rutina de UN DÍA usando SOLO los ejercicios de esta lista:
      ${dbNames}

      PASO 3: Devuelve SOLO un objeto JSON válido (sin texto extra ni markdown).
      FORMATO SI ES RECHAZADO:
      {
        "isValid": false,
        "error": "El mensaje no es válido o has pedido más de una rutina. Solo puedo generar una rutina de un día por petición. Por favor, sé más específico sobre tu objetivo para esta rutina."
      }

      FORMATO SI ES VÁLIDO:
      {
        "isValid": true,
        "name": "Nombre motivador de la rutina",
        "description": "Descripción corta",
        "folder": "IA",
        "exercises": [{ "name": "ID_EXACTO_EJERCICIO", "sets": 3, "reps": "8-12", "rest_seconds": 90, "ai_reason": "Por qué se eligió" }]
      }
      `;

      const systemContext = "Eres un entrenador personal estricto. Tu única salida debe ser un JSON válido siguiendo el formato exacto requerido. Nunca añadas explicaciones fuera del JSON.";

      const res = await askTrainerAI(aiPrompt, systemContext);

      if (res.remaining !== undefined) setRemainingUses(res.remaining);

      const responseText = typeof res === 'string' ? res : res.response || JSON.stringify(res);
      const jsonString = responseText.replace(/`json/gi, '').replace(/`/g, '').trim();
      const generatedRoutine = JSON.parse(jsonString);

      if (generatedRoutine.isValid === false || generatedRoutine.error) {
        throw new Error(generatedRoutine.error || "El mensaje no es válido para generar una rutina.");
      }

      const formattedRoutine = {
        name: generatedRoutine.name || "Rutina IA",
        description: generatedRoutine.description || "Generada por IA",
        folder: generatedRoutine.folder || "IA",
        exercises: (generatedRoutine.exercises || []).map((ex: any, idx: number) => {
          const dbExercise = allExercises.find((e: any) => e.name === ex.name) || { name: ex.name };
          return {
            ...dbExercise,
            tempId: 'temp_ai_' + Date.now() + '_' + idx,
            sets: Number(ex.sets) || 3,
            reps: String(ex.reps || "10"),
            rest_seconds: Number(ex.rest_seconds) || 60,
            ai_reason: ex.ai_reason || "",
            exercise_order: idx
          };
        })
      };

      onGenerate(formattedRoutine);
      onClose();
      setUserPrompt('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || "Error al generar.";
      setError(errorMsg);
      if (errorMsg.includes('agotado') || errorMsg.includes('Límite')) {
        setRemainingUses(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={isLoading ? undefined : onClose}>
      <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <Pressable style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', padding: 20 }]} onPress={isLoading ? undefined : onClose}>
            <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400 }}>
              <GlassView 
                glassEffectStyle="regular"
                colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'}
                style={{ width: '100%', backgroundColor: 'transparent', borderColor: colors.border, borderWidth: 1, borderRadius: 32, overflow: 'hidden' }}
              >
                {/* Header Centered */}
                <View style={{ padding: 24, paddingBottom: 16, alignItems: 'center' }}>
                  <TouchableOpacity onPress={onClose} disabled={isLoading} style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', opacity: isLoading ? 0.5 : 1 }}>
                    <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                    <X size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: colors.tint + '15', borderWidth: 2, borderColor: colors.tint + '30', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Sparkles size={32} color={getContrastColor(colors.tint, theme)} />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 8 }}>Generar con IA</Text>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16 }}>Crea tu sesión ideal</Text>
                </View>

                {/* Content */}
                <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, padding: 24, paddingTop: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
                    Describe tu objetivo, equipo disponible o nivel de experiencia.
                  </Text>

                  <TextInput
                    value={userPrompt}
                    onChangeText={setUserPrompt}
                    editable={!isLoading && !isLimitReached}
                    placeholder="Ej: Rutina de hipertrofia para espalda y bíceps con mancuernas."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    style={{
                      backgroundColor: colors.card,
                      borderColor: isLimitReached ? colors.border : colors.tint + '50',
                      borderWidth: 1,
                      borderRadius: 16,
                      padding: 16,
                      color: colors.text,
                      minHeight: 120,
                      textAlignVertical: 'top',
                      opacity: isLimitReached ? 0.5 : 1,
                    }}
                  />

                  {error && (
                    <View style={{ flexDirection: 'row', padding: 12, backgroundColor: '#ef444420', borderRadius: 12, borderColor: '#ef444450', borderWidth: 1, alignItems: 'center', gap: 8 }}>
                      <AlertCircle size={20} color="#ef4444" />
                      <Text style={{ flex: 1, color: '#ef4444', fontSize: 13 }}>{error}</Text>
                    </View>
                  )}

                  {remainingUses !== null && !error && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: remainingUses === 0 ? '#ef444410' : colors.tint + '10', borderRadius: 16, borderWidth: 1, borderColor: remainingUses === 0 ? '#ef444430' : colors.tint + '30' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Zap size={24} color={remainingUses === 0 ? '#ef4444' : colors.tint} />
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: remainingUses === 0 ? '#ef4444' : colors.text }}>Créditos IA</Text>
                          <Text style={{ fontSize: 11, color: colors.textSecondary }}>Recarga a medianoche</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: remainingUses === 0 ? '#ef4444' : colors.tint }}>{remainingUses}</Text>
                        <Text style={{ fontSize: 14, color: colors.textSecondary }}>/{dailyLimit}</Text>
                      </View>
                    </View>
                  )}

                  <GlassButton
                    noShadow theme={theme} color={colors.tint} style={{ width: '100%', height: 56, borderRadius: 16, opacity: (isLoading || !userPrompt.trim() || isLimitReached) ? 0.5 : 1 }}
                    disabled={isLoading || !userPrompt.trim() || isLimitReached}
                    onPress={handleGenerate}
                  >
                    {isLoading ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator color={getContrastColor(colors.tint, theme)} size="small" />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>Diseñando...</Text>
                      </View>
                    ) : isLimitReached ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <AlertCircle size={20} color={colors.text} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Límite Alcanzado</Text>
                      </View>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={20} color={getContrastColor(colors.tint, theme)} />
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>Generar Rutina</Text>
                      </View>
                    )}
                  </GlassButton>
                </ScrollView>
              </GlassView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </GlassView>
    </Modal>
  );
}
