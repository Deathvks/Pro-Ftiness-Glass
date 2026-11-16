import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, Sparkles, X } from 'lucide-react-native';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getAppleCardSurfaceStyle, shouldUseContentGlass } from '@/constants/theme';
import { getContrastTextColor } from '@/utils/colorUtils';
import { AUTO_TOURS, TutorialStep } from '@/data/tutorials';
import {
  TargetRect,
  hasTourTarget,
  normalizeRouteKey,
  scrollTourTargetIntoView,
} from './tourRegistry';

interface ActiveSession {
  mode: 'tutorial' | 'auto';
  id: string;
  route: string;
  steps: TutorialStep[];
  doneBtnText: string;
  progressFormat: 'slash' | 'de';
  returnToHub: boolean;
  onComplete?: () => void;
}

function buildSpotlightPath(
  winW: number,
  winH: number,
  rect: TargetRect,
  pad: number,
  r: number,
): string {
  const x = Math.max(4, rect.x - pad);
  const y = Math.max(4, rect.y - pad);
  const w = Math.min(winW - x - 4, rect.width + pad * 2);
  const h = Math.min(winH - y - 4, rect.height + pad * 2);
  const cr = Math.min(r, w / 2, h / 2);

  // Outer clockwise rectangle + inner counter-clockwise rounded rectangle (evenodd rule)
  return [
    `M0 0 H${winW} V${winH} H0 Z`,
    `M${x + cr} ${y}`,
    `H${x + w - cr}`,
    `Q${x + w} ${y} ${x + w} ${y + cr}`,
    `V${y + h - cr}`,
    `Q${x + w} ${y + h} ${x + w - cr} ${y + h}`,
    `H${x + cr}`,
    `Q${x} ${y + h} ${x} ${y + h - cr}`,
    `V${y + cr}`,
    `Q${x} ${y} ${x + cr} ${y}`,
    'Z',
  ].join(' ');
}

export function TourOverlay() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  const colors = useAppColors();
  const theme = useAppStore((s: any) => s.theme) || 'oled';
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const isIOS = Platform.OS === 'ios';
  const useGlass = shouldUseContentGlass(theme);
  const tintText = getContrastTextColor(colors.tint);

  const isAuthenticated = useAppStore((s: any) => s.isAuthenticated);
  const userProfile = useAppStore((s: any) => s.userProfile);
  const activeTutorial = useAppStore((s: any) => s.activeTutorial);
  const showWelcomeModal = useAppStore((s: any) => s.showWelcomeModal);
  const showTutorialsCenter = useAppStore((s: any) => s.showTutorialsCenter);
  const isRestTimerModalOpen = useAppStore((s: any) => s.isRestTimerModalOpen);
  const activeStoryGroup = useAppStore((s: any) => s.activeStoryGroup);
  const tourCompleted = useAppStore((s: any) => s.tourCompleted);
  const nutritionTourCompleted = useAppStore((s: any) => s.nutritionTourCompleted);
  const routineTourCompleted = useAppStore((s: any) => s.routineTourCompleted);
  const socialTourCompleted = useAppStore((s: any) => s.socialTourCompleted);
  const hubTourCompleted = useAppStore((s: any) => s.hubTourCompleted);

  const [session, setSession] = useState<ActiveSession | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [cardHeight, setCardHeight] = useState(210);
  const sessionRef = useRef<ActiveSession | null>(null);
  sessionRef.current = session;
  const startedAutoIdsRef = useRef<Set<string>>(new Set());

  const normalizedPath = useMemo(() => normalizeRouteKey(pathname), [pathname]);

  const endSession = useCallback(
    (navigateBackIfRequested = true) => {
      const current = sessionRef.current;
      setSession(null);
      setStepIndex(0);
      setTargetRect(null);
      useAppStore.getState().setTourActive?.(false);

      if (current?.mode === 'tutorial') {
        useAppStore.getState().clearPageTutorial?.();
        if (navigateBackIfRequested && current.returnToHub) {
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/hub' as any);
            }
          } catch {
            router.replace('/(tabs)/hub' as any);
          }
        }
      } else if (current?.onComplete) {
        current.onComplete();
      }
    },
    [router],
  );

  // 1. Handle manual PageTutorial launched from TutorialsCenter
  useEffect(() => {
    if (!activeTutorial?.tutorial) return;

    const tutorial = activeTutorial.tutorial;
    const expectedRoute = normalizeRouteKey(tutorial.route);
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tryStart = () => {
      if (cancelled) return;
      const currentNormalized = normalizeRouteKey(pathname);
      if (currentNormalized !== expectedRoute) {
        if (attempts < 16) {
          attempts += 1;
          timer = setTimeout(tryStart, 350);
        }
        return;
      }

      const resolvedSteps = tutorial.steps.filter(
        (step: TutorialStep) => !step.element || hasTourTarget(step.element),
      );

      if (resolvedSteps.length < 1 && attempts < 14) {
        attempts += 1;
        timer = setTimeout(tryStart, 400);
        return;
      }

      // If targets still aren't ready after waiting, fallback to steps without requiring DOM match
      const finalSteps = resolvedSteps.length > 0 ? resolvedSteps : tutorial.steps;

      useAppStore.getState().setTourActive?.(true);
      setStepIndex(0);
      setTargetRect(null);
      setSession({
        mode: 'tutorial',
        id: tutorial.id,
        route: tutorial.route,
        steps: finalSteps,
        doneBtnText: 'Terminar tutorial',
        progressFormat: 'de',
        returnToHub: Boolean(activeTutorial.returnToHub),
      });
    };

    timer = setTimeout(tryStart, 550);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [activeTutorial, pathname]);

  // 2. Handle automatic first-visit tours on main tabs
  useEffect(() => {
    if (!isAuthenticated || !userProfile?.id) return;
    if (!userProfile.goal && userProfile.role !== 'trainee') return;
    if (activeTutorial?.tutorial || sessionRef.current) return;
    if (showWelcomeModal || showTutorialsCenter || isRestTimerModalOpen || activeStoryGroup) {
      return;
    }

    const matchingAutoTour = AUTO_TOURS.find(tour =>
      tour.routes.some(r => normalizeRouteKey(r) === normalizedPath),
    );
    if (!matchingAutoTour) return;

    const storeState: any = useAppStore.getState();
    if (storeState[matchingAutoTour.flagKey]) return;
    if (startedAutoIdsRef.current.has(matchingAutoTour.id)) return;

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const startAutoWhenReady = () => {
      if (cancelled) return;
      const latest: any = useAppStore.getState();
      if (
        latest[matchingAutoTour.flagKey] ||
        latest.activeTutorial ||
        latest.showWelcomeModal ||
        latest.showTutorialsCenter ||
        latest.isRestTimerModalOpen ||
        latest.activeStoryGroup
      ) {
        return;
      }

      const availableSteps = matchingAutoTour.steps.filter(
        step => !step.element || hasTourTarget(step.element),
      );
      const elementStepsCount = availableSteps.filter(s => Boolean(s.element)).length;

      if (elementStepsCount === 0 && attempts < 8) {
        attempts += 1;
        timer = setTimeout(startAutoWhenReady, 600);
        return;
      }

      if (availableSteps.length === 0) return;

      startedAutoIdsRef.current.add(matchingAutoTour.id);
      const completeFn = latest[matchingAutoTour.completeAction];
      completeFn?.();
      latest.setTourActive?.(true);

      setStepIndex(0);
      setTargetRect(null);
      setSession({
        mode: 'auto',
        id: matchingAutoTour.id,
        route: pathname,
        steps: availableSteps,
        doneBtnText: matchingAutoTour.doneBtnText,
        progressFormat: matchingAutoTour.progressFormat,
        returnToHub: false,
        onComplete: completeFn,
      });
    };

    timer = setTimeout(startAutoWhenReady, 1400);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    isAuthenticated,
    userProfile?.id,
    userProfile?.goal,
    userProfile?.role,
    normalizedPath,
    pathname,
    activeTutorial,
    showWelcomeModal,
    showTutorialsCenter,
    isRestTimerModalOpen,
    activeStoryGroup,
    tourCompleted,
    nutritionTourCompleted,
    routineTourCompleted,
    socialTourCompleted,
    hubTourCompleted,
  ]);

  // Cancel active tour if user navigates away unexpectedly (except when launched)
  useEffect(() => {
    if (!session) return;
    if (normalizeRouteKey(session.route) !== normalizedPath) {
      endSession(false);
    }
  }, [normalizedPath, session, endSession]);

  // 3. Measure & scroll current step's target whenever session/stepIndex changes
  useEffect(() => {
    if (!session) return;
    const step = session.steps[stepIndex];
    if (!step) return;

    let cancelled = false;

    const locateStep = async () => {
      if (!step.element) {
        setTargetRect(null);
        return;
      }

      const rect = await scrollTourTargetIntoView(
        step.element,
        session.route,
        insets.top + 78,
        Math.max(cardHeight + insets.bottom + 36, 250),
      );
      if (!cancelled) {
        setTargetRect(rect);
      }
    };

    void locateStep();
    return () => {
      cancelled = true;
    };
  }, [session, stepIndex, insets.top, insets.bottom, cardHeight, winW, winH]);

  if (!session) return null;

  const step = session.steps[stepIndex];
  if (!step) return null;

  const total = session.steps.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === total - 1;
  const progressLabel =
    session.progressFormat === 'de'
      ? `${stepIndex + 1} de ${total}`
      : `${stepIndex + 1} / ${total}`;

  const handleNext = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (isLast) {
      endSession(true);
    } else {
      setStepIndex(idx => Math.min(total - 1, idx + 1));
    }
  };

  const handlePrev = () => {
    try {
      Haptics.selectionAsync();
    } catch {}
    if (!isFirst) {
      setStepIndex(idx => Math.max(0, idx - 1));
    }
  };

  const handleClose = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    endSession(true);
  };

  // Determine smart popover vertical position
  const pad = 6;
  const horizontalMargin = 16;
  const maxCardWidth = Math.min(winW - horizontalMargin * 2, 430);
  const topSafe = insets.top + 16;
  const bottomSafe = winH - insets.bottom - 18;

  let cardTop: number;
  if (!targetRect) {
    cardTop = Math.max(topSafe, (winH - cardHeight) / 2);
  } else {
    const spotTop = Math.max(4, targetRect.y - pad);
    const spotBottom = Math.min(winH - 4, targetRect.y + targetRect.height + pad);
    const spaceBelow = bottomSafe - spotBottom;
    const spaceAbove = spotTop - topSafe;

    if (spaceBelow >= cardHeight + 14) {
      cardTop = spotBottom + 14;
    } else if (spaceAbove >= cardHeight + 14) {
      cardTop = spotTop - cardHeight - 14;
    } else if (spaceBelow >= spaceAbove) {
      cardTop = Math.max(topSafe, bottomSafe - cardHeight);
    } else {
      cardTop = topSafe;
    }
  }

  const spotlightX = targetRect ? Math.max(4, targetRect.x - pad) : 0;
  const spotlightY = targetRect ? Math.max(4, targetRect.y - pad) : 0;
  const spotlightW = targetRect ? Math.min(winW - spotlightX - 4, targetRect.width + pad * 2) : 0;
  const spotlightH = targetRect ? Math.min(winH - spotlightY - 4, targetRect.height + pad * 2) : 0;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root} pointerEvents="box-none">
        {/* SVG Spotlight Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Svg width={winW} height={winH} style={StyleSheet.absoluteFill}>
            {targetRect ? (
              <>
                <Path
                  d={buildSpotlightPath(winW, winH, targetRect, pad, 18)}
                  fill="rgba(0, 0, 0, 0.72)"
                  fillRule="evenodd"
                />
                <Rect
                  x={spotlightX}
                  y={spotlightY}
                  width={spotlightW}
                  height={spotlightH}
                  rx={18}
                  ry={18}
                  fill="transparent"
                  stroke={colors.tint}
                  strokeWidth={2.5}
                />
              </>
            ) : (
              <Rect x={0} y={0} width={winW} height={winH} fill="rgba(0, 0, 0, 0.72)" />
            )}
          </Svg>
        </Pressable>

        {/* Floating Popover Card */}
        <View
          onLayout={e => {
            const h = Math.round(e.nativeEvent.layout.height);
            if (h > 0 && Math.abs(h - cardHeight) > 4) setCardHeight(h);
          }}
          style={[
            styles.cardContainer,
            {
              top: cardTop,
              width: maxCardWidth,
              alignSelf: 'center',
              backgroundColor: colors.card,
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
              ...(isIOS ? getAppleCardSurfaceStyle(theme, 24) : null),
            },
          ]}
        >
          {useGlass && (
            <GlassView
              pointerEvents="none"
              glassEffectStyle="regular"
              colorScheme={isDark ? 'dark' : 'light'}
              style={[StyleSheet.absoluteFill, { borderRadius: 24 }]}
            />
          )}

          {/* Header row: progress badge + close */}
          <View style={styles.cardHeader}>
            <View style={[styles.progressPill, { backgroundColor: colors.tint + '22' }]}>
              <Sparkles size={13} color={colors.tint} />
              <Text style={[styles.progressText, { color: colors.tint }]}>
                {progressLabel}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              hitSlop={10}
              accessibilityLabel="Cerrar tutorial"
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
              ]}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.text }]}>{step.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {step.description}
          </Text>

          {/* Step dots indicator */}
          {total > 1 && (
            <View style={styles.dotsRow}>
              {session.steps.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    {
                      width: idx === stepIndex ? 18 : 6,
                      backgroundColor:
                        idx === stepIndex
                          ? colors.tint
                          : isDark
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(0,0,0,0.16)',
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Footer Buttons */}
          <View style={styles.footer}>
            {!isFirst ? (
              <TouchableOpacity
                onPress={handlePrev}
                activeOpacity={0.75}
                style={[
                  styles.prevBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  },
                ]}
              >
                <ChevronLeft size={16} color={colors.text} />
                <Text style={[styles.prevText, { color: colors.text }]}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}

            <TouchableOpacity
              onPress={handleNext}
              activeOpacity={0.8}
              style={[styles.nextBtn, { backgroundColor: colors.tint }]}
            >
              <Text style={[styles.nextText, { color: tintText }]}>
                {isLast ? session.doneBtnText : 'Siguiente'}
              </Text>
              {!isLast && <ChevronRight size={16} color={tintText} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  cardContainer: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 14,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 10,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  prevText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  nextText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
