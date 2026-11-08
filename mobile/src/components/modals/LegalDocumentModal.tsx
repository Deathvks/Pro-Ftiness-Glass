import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { GlassView } from 'expo-glass-effect';
import { ShieldCheck, Scale, FileText, Lock, Mail, HeartPulse, X, Check, Globe } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LegalDocType = 'privacy' | 'terms' | 'legalNotice';

interface LegalDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export function LegalDocumentModal({ visible, onClose, initialDoc = 'privacy' }: LegalDocumentModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDocType>(initialDoc);
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

  useEffect(() => {
    if (visible && initialDoc) {
      setActiveTab(initialDoc);
    }
  }, [visible, initialDoc]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={[
          styles.backdrop,
          {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.45)',
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 16,
          },
        ]}
      >
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: isDark ? 'rgba(20, 20, 26, 0.92)' : 'rgba(255, 255, 255, 0.96)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <GlassView
            glassEffectStyle="regular"
            colorScheme={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Información Legal</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Pro Fitness Glass • Cumplimiento RGPD y LOPDGDD
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                },
              ]}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Segmented Tabs */}
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('privacy')}
              style={[
                styles.tabItem,
                activeTab === 'privacy' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.tint + '20', borderColor: colors.tint + '50' },
                ],
              ]}
            >
              <ShieldCheck size={14} color={activeTab === 'privacy' ? colors.tint : colors.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'privacy' ? colors.tint : colors.textSecondary },
                  activeTab === 'privacy' && { fontWeight: 'bold' },
                ]}
              >
                Privacidad
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('terms')}
              style={[
                styles.tabItem,
                activeTab === 'terms' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.tint + '20', borderColor: colors.tint + '50' },
                ],
              ]}
            >
              <Scale size={14} color={activeTab === 'terms' ? colors.tint : colors.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'terms' ? colors.tint : colors.textSecondary },
                  activeTab === 'terms' && { fontWeight: 'bold' },
                ]}
              >
                Términos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('legalNotice')}
              style={[
                styles.tabItem,
                activeTab === 'legalNotice' && [
                  styles.tabItemActive,
                  { backgroundColor: colors.tint + '20', borderColor: colors.tint + '50' },
                ],
              ]}
            >
              <FileText size={14} color={activeTab === 'legalNotice' ? colors.tint : colors.textSecondary} />
              <Text
                style={[
                  styles.tabText,
                  { color: activeTab === 'legalNotice' ? colors.tint : colors.textSecondary },
                  activeTab === 'legalNotice' && { fontWeight: 'bold' },
                ]}
              >
                Aviso Legal
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={true}
          >
            {activeTab === 'privacy' && (
              <View style={styles.sectionContainer}>
                <View style={[styles.badgePill, { backgroundColor: colors.tint + '15', borderColor: colors.tint + '40' }]}>
                  <ShieldCheck size={13} color={colors.tint} />
                  <Text style={[styles.badgePillText, { color: colors.tint }]}>RGPD & LOPDGDD</Text>
                </View>

                <Text style={[styles.docHeading, { color: colors.text }]}>Política de Privacidad y Protección de Datos</Text>

                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                  En <Text style={{ color: colors.text, fontWeight: '700' }}>Pro Fitness Glass</Text>, la confidencialidad, integridad y seguridad de tus datos personales y de salud deportiva son nuestra máxima prioridad. Cumplimos rigurosamente con el Reglamento General de Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD).
                </Text>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>1. Responsable del Tratamiento</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    • Identidad: Pro Fitness Glass{'\n'}
                    • Correo de Privacidad / DPO: privacidad@profitnessglass.com{'\n'}
                    • Correo de Soporte: soporte@profitnessglass.com
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>2. Datos que Recopilamos y Finalidad</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    • <Text style={{ fontWeight: '600', color: colors.text }}>Datos de Cuenta:</Text> Nombre de usuario, email y contraseña cifrada (bcrypt con sal única).{'\n'}
                    • <Text style={{ fontWeight: '600', color: colors.text }}>Datos Físicos y de Rendimiento:</Text> Peso corporal, altura, marcas de 1RM, rutinas creadas, registros de series, repeticiones, cardio, ingesta de calorías, macros, agua y creatina.{'\n'}
                    • <Text style={{ fontWeight: '600', color: colors.text }}>Finalidad:</Text> Gestionar tu cuenta, calcular tu evolución física, niveles y rachas de gamificación, y ofrecerte recomendaciones personalizadas. No vendemos tus datos a terceros.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>3. Edad Mínima Legal (14 años)</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Conforme al Art. 8 del RGPD y el Art. 7 de la LOPDGDD en España, la edad mínima para prestar consentimiento en servicios de la sociedad de la información es de 14 años. Si eres menor de 14 años, requieres autorización previa de tus padres o tutores legales.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>4. Derechos del Usuario (ARCO / OLP)</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Puedes ejercer en todo momento tus derechos de Acceso, Rectificación, Supresión ("derecho al olvido"), Limitación del tratamiento, Portabilidad y Oposición enviando un correo a <Text style={{ color: colors.tint }}>privacidad@profitnessglass.com</Text> o directamente eliminando tu cuenta en Ajustes &gt; Seguridad y Privacidad.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>5. Cookies y Almacenamiento Local</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    En la aplicación móvil y web solo empleamos almacenamiento local técnico indispensable para mantener tu sesión activa, recordar tu tema visual y sincronizar tus entrenamientos en segundo plano (Art. 22.2 LSSI-CE). No empleamos cookies de rastreo publicitario de terceros.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'terms' && (
              <View style={styles.sectionContainer}>
                <View style={[styles.badgePill, { backgroundColor: '#3b82f618', borderColor: '#3b82f640' }]}>
                  <Scale size={13} color="#3b82f6" />
                  <Text style={[styles.badgePillText, { color: '#3b82f6' }]}>Términos de Servicio</Text>
                </View>

                <Text style={[styles.docHeading, { color: colors.text }]}>Condiciones Generales de Uso</Text>

                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                  Al registrarte o utilizar <Text style={{ color: colors.text, fontWeight: '700' }}>Pro Fitness Glass</Text>, aceptas vincularte a las presentes Condiciones Generales de Uso.
                </Text>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>1. Naturaleza Gratuita del Servicio</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Pro Fitness Glass es una plataforma 100% gratuita y sin publicidad invasiva. No requerimos tarjetas de crédito ni suscripciones de pago para acceder a la suite completa de entrenamientos, nutrición, progreso e inteligencia asistida.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <HeartPulse size={16} color="#ef4444" />
                    <Text style={[styles.blockTitle, { color: colors.text, marginBottom: 0 }]}>2. Exención de Responsabilidad Médica</Text>
                  </View>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    La información, rutinas, fórmulas de 1RM, cálculos nutricionales y asistentes IA proporcionados tienen carácter exclusivamente informativo y deportivo. No constituyen asesoramiento médico, diagnóstico ni tratamiento facultativo. Consulta siempre a un médico colegiado o profesional sanitario antes de comenzar planes de entrenamiento exigentes o dietas restrictivas.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>3. Normas de la Comunidad</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Queda terminantemente prohibido publicar contenido ofensivo, denigrante, spam, suplantación de identidad o vulneración de derechos de autor en descripciones de rutinas, nombres de usuario o fotos de perfil. Nos reservamos el derecho de suspender cuentas que violen estas normas.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>4. Modificaciones y Disponibilidad</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Nos esforzamos por mantener la máxima disponibilidad 24/7. Ocasionalmente pueden realizarse paradas breves de mantenimiento programado debidamente notificadas.
                  </Text>
                </View>
              </View>
            )}

            {activeTab === 'legalNotice' && (
              <View style={styles.sectionContainer}>
                <View style={[styles.badgePill, { backgroundColor: '#a855f718', borderColor: '#a855f740' }]}>
                  <FileText size={13} color="#a855f7" />
                  <Text style={[styles.badgePillText, { color: '#a855f7' }]}>LSSI-CE Art. 10</Text>
                </View>

                <Text style={[styles.docHeading, { color: colors.text }]}>Aviso Legal</Text>

                <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
                  En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se facilita la siguiente información identificativa:
                </Text>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>1. Datos Identificativos del Prestador</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    • Denominación de la Plataforma: Pro Fitness Glass{'\n'}
                    • Correo electrónico de contacto: soporte@profitnessglass.com{'\n'}
                    • Finalidad de la plataforma: Aplicación y portal deportivo para gestión de rutinas, nutrición y progreso atlético.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>2. Propiedad Intelectual e Industrial</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Todos los derechos de propiedad intelectual sobre el código fuente, diseño gráfico Liquid Glass, logotipos, base de datos de ejercicios, textos y animaciones pertenecen a Pro Fitness Glass o a sus respectivos licenciantes, quedando expresamente prohibida su reproducción o distribución sin consentimiento previo.
                  </Text>
                </View>

                <View style={[styles.cardBlock, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
                  <Text style={[styles.blockTitle, { color: colors.text }]}>3. Legislación y Jurisdicción Aplicable</Text>
                  <Text style={[styles.blockText, { color: colors.textSecondary }]}>
                    Para la resolución de cualquier litigio o cuestión relativa al presente portal o aplicación, regirá la legislación española, siendo competentes los juzgados y tribunales del domicilio del usuario consumidor o los legalmente aplicables.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footerBar, { borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.confirmBtn, { backgroundColor: colors.tint }]}
              activeOpacity={0.85}
            >
              <Check size={18} color="#000" strokeWidth={2.5} />
              <Text style={styles.confirmBtnText}>He Leído y Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '92%',
    borderRadius: 32,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 20,
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 13,
  },
  tabItemActive: {
    borderWidth: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  sectionContainer: {
    gap: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    marginBottom: 4,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  docHeading: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400',
  },
  cardBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    marginTop: 4,
  },
  blockTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  blockText: {
    fontSize: 12,
    lineHeight: 18,
  },
  footerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  confirmBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  confirmBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
