import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Pressable,
} from 'react-native';
import { GlassView } from 'expo-glass-effect';
import {
  X,
  Bug,
  AlertCircle,
  ImagePlus,
  Send,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAppColors } from '@/hooks/useAppColors';
import useAppStore from '@/store/useAppStore';
import { createBugReport } from '@/services/reportService';
import { SwipeableBottomSheet } from '@/components/ui/SwipeableBottomSheet';

const REPORT_CATEGORIES = [
  { value: 'bug', label: 'Error técnico / Bug' },
  { value: 'ui', label: 'Interfaz / Diseño' },
  { value: 'account', label: 'Problema de cuenta / Acceso' },
  { value: 'content', label: 'Error en datos (Alimentos/Ejercicios)' },
  { value: 'feature', label: 'Sugerencia / Mejora' },
  { value: 'other', label: 'Otros' },
];

const MAX_FILES = 3;
const STORAGE_KEY = 'bug_report_draft';

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BugReportModal({ visible, onClose }: BugReportModalProps) {
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  const [category, setCategory] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [selectedLightboxImage, setSelectedLightboxImage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  // Cargar borrador persistido
  useEffect(() => {
    if (!visible) return;
    const loadDraft = async () => {
      try {
        const draftStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (draftStr) {
          const draft = JSON.parse(draftStr);
          if (draft.category) setCategory(draft.category);
          if (draft.subject) setSubject(draft.subject);
          if (draft.description) setDescription(draft.description);
          if (Array.isArray(draft.attachments)) setAttachments(draft.attachments);
        }
      } catch (err) {
        console.warn('Error loading bug draft:', err);
      } finally {
        setIsLoadingDraft(false);
      }
    };
    loadDraft();
  }, [visible]);

  // Guardar borrador automáticamente al cambiar los datos
  useEffect(() => {
    if (isLoadingDraft || !visible) return;
    const saveDraft = async () => {
      try {
        const hasContent = category || subject.trim() || description.trim() || attachments.length > 0;
        if (hasContent) {
          await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              category,
              subject,
              description,
              attachments,
              timestamp: Date.now(),
            })
          );
        } else {
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('Error saving bug draft:', err);
      }
    };
    saveDraft();
  }, [category, subject, description, attachments, isLoadingDraft, visible]);

  const handleClose = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    onClose();
  };

  const handleSelectImages = async () => {
    if (attachments.length >= MAX_FILES) {
      Alert.alert('Límite alcanzado', `Máximo ${MAX_FILES} imágenes permitidas.`);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso necesario',
          'Necesitamos acceso a tus fotos para que puedas adjuntar capturas del error.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.85,
        selectionLimit: MAX_FILES - attachments.length,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUris = result.assets.map(a => a.uri).slice(0, MAX_FILES - attachments.length);
        setAttachments(prev => [...prev, ...newUris]);
        setFormError('');
      }
    } catch (err) {
      console.warn('Error picking image for report:', err);
    }
  };

  const removeAttachment = (index: number) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setFormError('');
  };

  const handleSubmit = async () => {
    setFormError('');

    if (!category) {
      setFormError('Por favor selecciona una categoría.');
      return;
    }
    if (!subject.trim()) {
      setFormError('Por favor indica un asunto breve.');
      return;
    }
    if (!description.trim()) {
      setFormError('Por favor detalla qué estabas haciendo cuando ocurrió el error.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    setIsSubmitting(true);
    try {
      await createBugReport(category, subject.trim(), description.trim(), attachments);

      // Limpieza de borrador tras envío exitoso
      await AsyncStorage.removeItem(STORAGE_KEY);
      setCategory('');
      setSubject('');
      setDescription('');
      setAttachments([]);

      Alert.alert(
        '¡Reporte enviado!',
        'Muchas gracias por ayudarnos a mejorar Pro Fitness Glass. Hemos recibido tu reporte y revisaremos la información técnica.',
        [{ text: 'Aceptar', onPress: onClose }]
      );
    } catch (error: any) {
      console.error('Error al enviar bug report:', error);
      const msg = error?.response?.data?.error || error?.message || 'Error al enviar el reporte. Inténtalo de nuevo.';
      setFormError(msg);
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = category && subject.trim().length > 0 && description.trim().length > 0;
  const selectedCategoryLabel = REPORT_CATEGORIES.find(c => c.value === category)?.label;

  return (
    <SwipeableBottomSheet
      visible={visible}
      onClose={handleClose}
      isDark={isDark}
      backgroundColor={colors.card}
      height="88%"
      maxHeight="90%"
      avoidKeyboard
    >
      <View style={{ flex: 1 }}>
            {/* Header */}
            <View
              style={[
                styles.headerRow,
                { borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
              ]}
            >
              <View style={styles.headerLeft}>
                <View style={styles.bugIconBox}>
                  <Bug size={20} color="#ef4444" strokeWidth={2.5} />
                </View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Reportar problema</Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
                ]}
              >
                <X size={18} color={colors.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Info banner */}
              <View
                style={[
                  styles.infoBanner,
                  {
                    backgroundColor: colors.tint + '14',
                    borderColor: colors.tint + '30',
                  },
                ]}
              >
                <AlertCircle size={18} color={colors.tint} style={{ marginTop: 2 }} />
                <Text style={[styles.infoBannerText, { color: colors.text }]}>
                  Describe el error con detalle. Se enviará información técnica de tu dispositivo automáticamente para ayudarnos a resolverlo.
                </Text>
              </View>

              {/* Error banner */}
              {formError ? (
                <View style={styles.errorBanner}>
                  <AlertCircle size={18} color="#ef4444" />
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              ) : null}

              {/* Categoría */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Categoría <Text style={{ color: colors.tint }}>*</Text>
                </Text>

                <TouchableOpacity
                  onPress={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                  activeOpacity={0.8}
                  style={[
                    styles.pickerTrigger,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: category ? colors.tint + '50' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pickerTriggerText,
                      { color: category ? colors.text : colors.textSecondary },
                    ]}
                  >
                    {selectedCategoryLabel || 'Selecciona una categoría'}
                  </Text>
                  <ChevronDown
                    size={16}
                    color={colors.textSecondary}
                    style={{ transform: [{ rotate: isCategoryPickerOpen ? '180deg' : '0deg' }] }}
                  />
                </TouchableOpacity>

                {/* Desplegable de Categorías */}
                {isCategoryPickerOpen && (
                  <View
                    style={[
                      styles.dropdownMenu,
                      {
                        backgroundColor: isDark ? '#1a1a20' : '#ffffff',
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                  >
                    {REPORT_CATEGORIES.map(cat => {
                      const isSelected = category === cat.value;
                      return (
                        <TouchableOpacity
                          key={cat.value}
                          onPress={() => {
                            setCategory(cat.value);
                            setIsCategoryPickerOpen(false);
                            setFormError('');
                          }}
                          activeOpacity={0.7}
                          style={[
                            styles.dropdownItem,
                            isSelected && { backgroundColor: colors.tint + '18' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: isSelected ? colors.tint : colors.text, fontWeight: isSelected ? '700' : '500' },
                            ]}
                          >
                            {cat.label}
                          </Text>
                          {isSelected && <CheckCircle2 size={15} color={colors.tint} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Asunto */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Asunto <Text style={{ color: colors.tint }}>*</Text>
                </Text>
                <TextInput
                  value={subject}
                  onChangeText={txt => {
                    setSubject(txt);
                    setFormError('');
                  }}
                  placeholder="Ej: Error al guardar rutina..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  maxLength={100}
                  editable={!isSubmitting}
                  style={[
                    styles.inputSingle,
                    {
                      color: colors.text,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              </View>

              {/* Descripción detallada */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  Descripción detallada <Text style={{ color: colors.tint }}>*</Text>
                </Text>
                <TextInput
                  value={description}
                  onChangeText={txt => {
                    setDescription(txt);
                    setFormError('');
                  }}
                  placeholder="Explica qué estabas haciendo cuando ocurrió el error paso a paso..."
                  placeholderTextColor={colors.textSecondary + '80'}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                  style={[
                    styles.inputMulti,
                    {
                      color: colors.text,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                    },
                  ]}
                />
              </View>

              {/* Capturas de pantalla (Opcional - Máx 3) */}
              <View style={styles.fieldGroup}>
                <View style={styles.attachmentsHeaderRow}>
                  <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 0 }]}>
                    Capturas (Opcional - Máx 5MB)
                  </Text>
                  <View
                    style={[
                      styles.attachmentsCountBadge,
                      {
                        backgroundColor: attachments.length >= MAX_FILES
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.attachmentsCountText,
                        { color: attachments.length >= MAX_FILES ? '#ef4444' : colors.textSecondary },
                      ]}
                    >
                      {attachments.length}/{MAX_FILES}
                    </Text>
                  </View>
                </View>

                {/* Botón Añadir Imágenes */}
                <TouchableOpacity
                  onPress={handleSelectImages}
                  disabled={isSubmitting || attachments.length >= MAX_FILES}
                  activeOpacity={0.7}
                  style={[
                    styles.addImagesBtn,
                    {
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)',
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                      opacity: attachments.length >= MAX_FILES ? 0.4 : 1,
                    },
                  ]}
                >
                  <ImagePlus size={20} color={colors.tint} strokeWidth={2.3} />
                  <Text style={[styles.addImagesBtnText, { color: colors.text }]}>Añadir imágenes</Text>
                </TouchableOpacity>

                {/* Lista de vistas previas */}
                {attachments.length > 0 && (
                  <View style={styles.thumbnailsRow}>
                    {attachments.map((uri, idx) => (
                      <View key={`thumb_${idx}`} style={styles.thumbnailWrap}>
                        <Pressable
                          onPress={() => setSelectedLightboxImage(uri)}
                          style={styles.thumbnailPressable}
                        >
                          <Image source={{ uri }} style={styles.thumbnailImg} resizeMode="cover" />
                        </Pressable>

                        <TouchableOpacity
                          onPress={() => removeAttachment(idx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={styles.thumbnailDeleteBtn}
                        >
                          <X size={11} color="#ffffff" strokeWidth={3} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View
              style={[
                styles.bottomActionsRow,
                { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
              ]}
            >
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting || !isValid}
                activeOpacity={0.8}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: colors.tint,
                    opacity: isSubmitting || !isValid ? 0.45 : 1,
                  },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={18} color="#ffffff" strokeWidth={2.4} />
                    <Text style={styles.submitBtnText}>Enviar Reporte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
      </View>

      {/* Modal de Lightbox para ver la captura a pantalla completa */}
      <Modal
        visible={!!selectedLightboxImage}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedLightboxImage(null)}
      >
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity
            onPress={() => setSelectedLightboxImage(null)}
            style={styles.lightboxCloseBtn}
          >
            <X size={24} color="#ffffff" strokeWidth={2.5} />
          </TouchableOpacity>

          {selectedLightboxImage && (
            <Image
              source={{ uri: selectedLightboxImage }}
              style={styles.lightboxImg}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </SwipeableBottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  keyboardWrap: {
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.88,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bugIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
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
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerTriggerText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  dropdownMenu: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownItemText: {
    fontSize: 13,
  },
  inputSingle: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13.5,
    fontWeight: '600',
  },
  inputMulti: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 13,
    minHeight: 100,
  },
  attachmentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  attachmentsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  attachmentsCountText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  addImagesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addImagesBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  thumbnailWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  thumbnailPressable: {
    width: '100%',
    height: '100%',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  thumbnailDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomActionsRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
    width: '100%',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  lightboxImg: {
    width: '100%',
    height: '80%',
  },
});
