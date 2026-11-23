import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { ModalThemeBackground, getThemedModalCardColor } from '@/components/ui/ModalThemeBackground';
import { LiquidCloseButton } from '@/components/ui/GlassButton';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  HelpCircle,
  MessageCircle,
  Palette,
  Search,
  Settings,
  Sparkles,
  Trophy,
  UserRound,
  Users,
  X,
} from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, getThemeBaseBackground, shouldUseContentGlass } from '@/constants/theme';
import { APP_TUTORIALS, AppTutorial } from '@/data/tutorials';

const ICONS: Record<string, any> = {
  activity: Activity,
  bell: Bell,
  chart: BarChart3,
  dumbbell: Dumbbell,
  help: HelpCircle,
  home: Flame,
  message: MessageCircle,
  nutrition: Flame,
  palette: Palette,
  settings: Settings,
  trophy: Trophy,
  user: UserRound,
  users: Users,
};

const CATEGORY_META: Record<string, { description: string; icon: any }> = {
  Todos: {
    description: 'Ver todas las guías y recorridos de la app',
    icon: Sparkles,
  },
  Empezar: {
    description: 'Primeros pasos, resumen y navegación básica',
    icon: Flame,
  },
  Entrenamiento: {
    description: 'Rutinas, ejercicios manuales y sesiones',
    icon: Dumbbell,
  },
  Nutrición: {
    description: 'Registro de comidas, calorías, macros y agua',
    icon: Flame,
  },
  Seguimiento: {
    description: 'Estadísticas, RM, peso, medidas y retos',
    icon: BarChart3,
  },
  Comunidad: {
    description: 'Muro global, ranking, amigos y grupos',
    icon: Users,
  },
  Personalización: {
    description: 'Temas, colores de acento y apariencia',
    icon: Palette,
  },
  'Más herramientas': {
    description: 'Calculadoras, escáner y utilidades',
    icon: Settings,
  },
  'Herramientas profesionales': {
    description: 'Asesorías, clientes y gestión avanzada',
    icon: UserRound,
  },
};

interface TutorialsCenterModalProps {
  visible: boolean;
  userRole?: string;
  onClose: () => void;
  onStart: (tutorial: AppTutorial) => void;
}

export function TutorialsCenterModal({
  visible,
  userRole,
  onClose,
  onStart,
}: TutorialsCenterModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useAppColors();
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const themedCardBg = getThemedModalCardColor(theme);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedCategory(null);
      setSearch('');
    }
  }, [visible]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [selectedCategory, search]);

  const availableTutorials = useMemo(
    () =>
      APP_TUTORIALS.filter(
        tutorial => !tutorial.roles || (userRole && tutorial.roles.includes(userRole)),
      ),
    [userRole],
  );

  const categories = useMemo(
    () => ['Todos', ...new Set(availableTutorials.map(t => t.category))],
    [availableTutorials],
  );

  const hasSearch = search.trim().length > 0;
  const effectiveCategory = hasSearch ? 'Todos' : selectedCategory || 'Todos';

  const visibleTutorials = useMemo(() => {
    const query = search.trim().toLowerCase();
    return availableTutorials.filter(tutorial => {
      const matchesCategory =
        effectiveCategory === 'Todos' || tutorial.category === effectiveCategory;
      const matchesSearch =
        !query ||
        `${tutorial.title} ${tutorial.description} ${tutorial.category}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [availableTutorials, effectiveCategory, search]);

  const sheetBg =
    colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.backdrop, { paddingTop: insets.top + 12 }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: sheetBg,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              overflow: 'hidden',
            },
          ]}
        >
          <ModalThemeBackground theme={theme} />
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                borderBottomColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(0,0,0,0.06)',
              },
            ]}
          >
            <View style={styles.handleRow}>
              <View
                style={[
                  styles.handleBar,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.22)'
                      : 'rgba(0,0,0,0.16)',
                  },
                ]}
              />
            </View>

            <View style={styles.headerTop}>
              <View style={styles.headerTitleGroup}>
                <View style={[styles.headerIconBadge, { backgroundColor: colors.tint + '1A' }]}>
                  <BookOpen size={22} color={colors.tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Tutoriales
                  </Text>
                  <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                    Selecciona una sección para ver el recorrido interactivo con los controles reales.
                  </Text>
                </View>
              </View>

              <LiquidCloseButton
                onPress={onClose}
                hitSlop={10}
                accessibilityLabel="Cerrar tutoriales"
                iconSize={20}
                iconColor={colors.textSecondary}
                style={styles.closeBtn}
              />
            </View>

            {/* Search Input */}
            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.05)',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.07)'
                    : 'rgba(0,0,0,0.06)',
                },
              ]}
            >
              <Search size={16} color={colors.textSecondary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar tutorial..."
                placeholderTextColor={colors.textMuted || colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
                returnKeyType="search"
              />
              {hasSearch && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Scrollable Body */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.body,
              { paddingBottom: Math.max(24, insets.bottom + 18) },
            ]}
          >
            {selectedCategory === null && !hasSearch ? (
              <View style={styles.listGap}>
                <View style={styles.sectionMetaRow}>
                  <Text style={[styles.sectionMetaLabel, { color: colors.textMuted || colors.textSecondary }]}>
                    ELIGE UNA SECCIÓN
                  </Text>
                  <Text style={[styles.sectionMetaCount, { color: colors.textMuted || colors.textSecondary }]}>
                    {availableTutorials.length} guías en total
                  </Text>
                </View>

                {categories.map(category => {
                  const count =
                    category === 'Todos'
                      ? availableTutorials.length
                      : availableTutorials.filter(t => t.category === category).length;
                  const meta = CATEGORY_META[category] || {
                    description: `${count} ${count === 1 ? 'guía disponible' : 'guías disponibles'}`,
                    icon: BookOpen,
                  };
                  const CatIcon = meta.icon;

                  return (
                    <TouchableOpacity
                      key={category}
                      activeOpacity={0.75}
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedCategory(category);
                      }}
                      style={[
                        styles.categoryRow,
                        {
                          backgroundColor: themedCardBg,
                          borderColor: isDark
                            ? 'rgba(255,255,255,0.07)'
                            : 'rgba(0,0,0,0.06)',
                          ...(isIOS ? getAppleCardSurfaceStyle(theme, 22) : null),
                        },
                      ]}
                    >
                      <View style={[styles.catIconBox, { backgroundColor: colors.tint + '1A' }]}>
                        <CatIcon size={21} color={colors.tint} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.catTitle, { color: colors.text }]}>
                          {category}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[styles.catDesc, { color: colors.textSecondary }]}
                        >
                          {meta.description}
                        </Text>
                      </View>
                      <View style={styles.catTrailing}>
                        <View style={[styles.countPill, { backgroundColor: colors.tint + '1A' }]}>
                          <Text style={[styles.countPillText, { color: colors.tint }]}>
                            {count} {count === 1 ? 'guía' : 'guías'}
                          </Text>
                        </View>
                        <ChevronRight size={17} color={colors.textSecondary} style={{ opacity: 0.6 }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.listGap}>
                {!hasSearch && (
                  <View style={styles.backRow}>
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          Haptics.selectionAsync();
                        } catch {}
                        setSelectedCategory(null);
                      }}
                      activeOpacity={0.75}
                      style={[
                        styles.backPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                        },
                      ]}
                    >
                      <ChevronLeft size={16} color={colors.textSecondary} />
                      <Text style={[styles.backPillText, { color: colors.text }]}>
                        Volver a categorías
                      </Text>
                    </TouchableOpacity>

                    <View style={[styles.countPill, { backgroundColor: colors.tint + '1A' }]}>
                      <Text style={[styles.countPillText, { color: colors.tint }]}>
                        {selectedCategory}
                      </Text>
                    </View>
                  </View>
                )}

                {visibleTutorials.length > 0 ? (
                  visibleTutorials.map(tutorial => {
                    const Icon = ICONS[tutorial.icon] || BookOpen;
                    return (
                      <TouchableOpacity
                        key={tutorial.id}
                        activeOpacity={0.82}
                        onPress={() => {
                          try {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          } catch {}
                          onStart(tutorial);
                        }}
                        style={[
                          styles.tutorialCard,
                          {
                            backgroundColor: themedCardBg,
                            borderColor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(0,0,0,0.06)',
                            ...(isIOS ? getAppleCardSurfaceStyle(theme, 24) : null),
                          },
                        ]}
                      >
                        <View style={styles.cardTopRow}>
                          <View style={[styles.catIconBox, { backgroundColor: colors.tint + '1A' }]}>
                            <Icon size={22} color={colors.tint} />
                          </View>
                          <View style={[styles.countPill, { backgroundColor: colors.tint + '1A' }]}>
                            <Text style={[styles.countPillText, { color: colors.tint }]}>
                              {tutorial.category}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.tutorialTitle, { color: colors.text }]}>
                          {tutorial.title}
                        </Text>
                        <Text style={[styles.tutorialDesc, { color: colors.textSecondary }]}>
                          {tutorial.description}
                        </Text>

                        {/* Vista real de la app preview */}
                        <View
                          style={[
                            styles.previewBox,
                            {
                              backgroundColor: isDark
                                ? 'rgba(0,0,0,0.28)'
                                : 'rgba(0,0,0,0.035)',
                            },
                          ]}
                        >
                          <View style={styles.previewHeader}>
                            <View style={[styles.previewDot, { backgroundColor: colors.tint }]} />
                            <Text style={[styles.previewLabel, { color: colors.textMuted || colors.textSecondary }]}>
                              VISTA REAL DE LA APP
                            </Text>
                          </View>

                          <View style={{ gap: 6 }}>
                            {tutorial.steps.slice(0, 3).map((step, idx) => (
                              <View
                                key={step.title}
                                style={[
                                  styles.stepPreviewRow,
                                  {
                                    backgroundColor: isDark
                                      ? 'rgba(255,255,255,0.05)'
                                      : 'rgba(255,255,255,0.75)',
                                  },
                                ]}
                              >
                                <View style={[styles.stepNumBadge, { backgroundColor: colors.tint + '1A' }]}>
                                  <Text style={[styles.stepNumText, { color: colors.tint }]}>
                                    {idx + 1}
                                  </Text>
                                </View>
                                <Text
                                  numberOfLines={1}
                                  style={[styles.stepTitleText, { color: colors.textSecondary }]}
                                >
                                  {step.title}
                                </Text>
                              </View>
                            ))}

                            {tutorial.steps.length > 3 && (
                              <Text style={[styles.moreSteps, { color: colors.textMuted || colors.textSecondary }]}>
                                + {tutorial.steps.length - 3} pasos más
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.startCtaRow}>
                          <Text style={[styles.startCtaText, { color: colors.tint }]}>
                            Ver tutorial en pantalla
                          </Text>
                          <ChevronRight size={15} color={colors.tint} />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View
                    style={[
                      styles.emptyBox,
                      {
                        backgroundColor: colors.card,
                        borderColor: isDark
                          ? 'rgba(255,255,255,0.07)'
                          : 'rgba(0,0,0,0.06)',
                      },
                    ]}
                  >
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No hay tutoriales que coincidan con la búsqueda.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  handleRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
  },
  body: {
    padding: 16,
  },
  listGap: {
    gap: 10,
  },
  sectionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  sectionMetaLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionMetaCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  catIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  catDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  catTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  backPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tutorialCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tutorialDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 4,
  },
  previewBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  previewDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  stepNumBadge: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 10,
    fontWeight: '900',
  },
  stepTitleText: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '600',
  },
  moreSteps: {
    fontSize: 10.5,
    fontWeight: '600',
    paddingLeft: 4,
    paddingTop: 2,
  },
  startCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 14,
  },
  startCtaText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
