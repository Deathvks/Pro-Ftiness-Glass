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

      const aiPrompt = 
      Genera una rutina de entrenamiento de un día según lo que te pide el usuario.
      El usuario dice: ""

      PASO 1: Evalúa si el mensaje es razonable para una rutina de gimnasio. 
      Si no tiene sentido o pide una dieta/fisioterapia, devuelve isValid: false con el mensaje de error.

      PASO 2: Selecciona los ejercicios de esta lista (y SOLO de esta lista, usando EXACTAMENTE los nombres):
      

      PASO 3: Devuelve SOLO un objeto JSON válido (sin texto extra ni markdown).
      FORMATO SI ES VÁLIDO:
      {
        "isValid": true,
        "name": "Nombre motivador de la rutina",
        "description": "Descripción corta",
        "folder": "IA",
        "exercises": [{ "name": "ID_EXACTO_EJERCICIO", "sets": 3, "reps": "8-12", "rest_seconds": 90, "ai_reason": "Por qué se eligió" }]
      }
      ;

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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={isLoading ? undefined : onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <Pressable style={StyleSheet.absoluteFill} onPress={isLoading ? undefined : onClose} />
          
          <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, maxHeight: '90%' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.tint, alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={20} color={getContrastColor(colors.tint, theme)} />
                </View>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Generar con IA</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Crea tu sesión ideal</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} disabled={isLoading} style={{ padding: 8, opacity: isLoading ? 0.5 : 1 }}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>
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
                theme={theme}
                style={{ height: 56, borderRadius: 16, opacity: (isLoading || !userPrompt.trim() || isLimitReached) ? 0.5 : 1 }}
                disabled={isLoading || !userPrompt.trim() || isLimitReached}
                onPress={handleGenerate}
              >
                {isLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color={colors.text} size="small" />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Diseñando...</Text>
                  </View>
                ) : isLimitReached ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={20} color={colors.text} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Límite Alcanzado</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint, opacity: 0.15 }]} />
                    <Sparkles size={20} color={getContrastColor(colors.tint, theme)} />
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: getContrastColor(colors.tint, theme) }}>Generar Rutina</Text>
                  </View>
                )}
              </GlassButton>
            </ScrollView>
          </GlassView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
