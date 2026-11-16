import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
  StyleProp,
  ViewStyle,
  useAnimatedValue,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  type GestureStateChangeEvent,
  type GestureUpdateEvent,
  type PanGestureHandlerEventPayload,
} from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, getThemeBaseBackground } from '@/constants/theme';
import useAppStore from '@/store/useAppStore';
import {
  ModalThemeBackground,
  getThemedModalBorderColor,
  getThemedModalCardColor,
  getThemedModalSurfaceColor,
} from '@/components/ui/ModalThemeBackground';

const HEADER_DRAG_HEIGHT = 120;

interface SwipeableSheetModalProps {
  visible: boolean;
  onClose: () => void;
  backdropColor: string;
  dismissOnBackdrop?: boolean;
  dismissible?: boolean;
  avoidKeyboard?: boolean;
  statusBarTranslucent?: boolean;
  navigationBarTranslucent?: boolean;
  dragAreaHeight?: number;
  sheetStyle: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

export function SwipeableSheetModal({
  visible,
  onClose,
  backdropColor,
  dismissOnBackdrop = true,
  dismissible = true,
  avoidKeyboard = false,
  statusBarTranslucent = true,
  navigationBarTranslucent = true,
  dragAreaHeight,
  sheetStyle,
  children,
}: SwipeableSheetModalProps) {
  const screenHeight = Dimensions.get('screen').height;
  const translateY = useAnimatedValue(screenHeight);
  const backdropOpacity = useAnimatedValue(0);
  const touchStartY = useRef(0);
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;

    closingRef.current = false;
    translateY.setValue(screenHeight * 0.65);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 26,
        stiffness: 260,
        mass: 0.85,
      }),
    ]).start();

    return () => {
      translateY.stopAnimation();
      backdropOpacity.stopAnimation();
    };
  }, [visible, translateY, backdropOpacity, screenHeight]);

  const dismissAnimated = useCallback(() => {
    if (!dismissible || closingRef.current) return;
    closingRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onCloseRef.current();
    });
  }, [dismissible, translateY, backdropOpacity, screenHeight]);

  const onDragBegin = useCallback(({ absoluteY }: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
    // Native translation can reset when the pan activates. Keep the original touch position.
    touchStartY.current = absoluteY;
  }, []);

  const onDragUpdate = useCallback(({ absoluteY }: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
    if (closingRef.current) return;
    const distance = Math.max(0, absoluteY - touchStartY.current);
    translateY.setValue(distance);
    backdropOpacity.setValue(Math.max(0.2, 1 - distance / (screenHeight * 0.55)));
  }, [translateY, backdropOpacity, screenHeight]);

  const onDragEnd = useCallback((
    { absoluteY, velocityY }: GestureStateChangeEvent<PanGestureHandlerEventPayload>,
    success: boolean,
  ) => {
    if (closingRef.current) return;
    const distance = absoluteY - touchStartY.current;
    if (success && (distance > 48 || (distance > 16 && velocityY > 300))) {
      dismissAnimated();
      return;
    }
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 24,
        stiffness: 260,
        mass: 0.8,
      }),
    ]).start();
  }, [translateY, backdropOpacity, dismissAnimated]);

  const dragGesture = useMemo(() => {
    const pan = Gesture.Pan()
      .enabled(dismissible)
      .runOnJS(true)
      .maxPointers(1)
      .activeOffsetY(7)
      .failOffsetY(-7)
      .failOffsetX([-10, 10])
      .shouldCancelWhenOutside(false);

    // eslint-disable-next-line react-hooks/refs -- Gesture Handler invokes these callbacks after touch events.
    pan.onBegin(onDragBegin).onUpdate(onDragUpdate).onEnd(onDragEnd);

    // Restrict where the drag can start so scrollable content can handle its own gestures.
    if (dragAreaHeight !== undefined) pan.hitSlop({ top: 0, height: dragAreaHeight });
    return pan;
  }, [dismissible, dragAreaHeight, onDragBegin, onDragUpdate, onDragEnd]);

  const overlay = (
    <View style={styles.overlay}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: backdropOpacity, backgroundColor: backdropColor }]}
      >
        {dismissible && dismissOnBackdrop && <Pressable style={StyleSheet.absoluteFill} onPress={dismissAnimated} />}
      </Animated.View>
      <GestureDetector gesture={dragGesture} touchAction="pan-x">
        <Animated.View style={[sheetStyle, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
  const content = avoidKeyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      {overlay}
    </KeyboardAvoidingView>
  ) : overlay;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={statusBarTranslucent}
      navigationBarTranslucent={navigationBarTranslucent}
      onRequestClose={dismissAnimated}
    >
      <GestureHandlerRootView style={styles.rootFlex}>
        <SafeAreaProvider>{content}</SafeAreaProvider>
      </GestureHandlerRootView>
    </Modal>
  );
}

export function getAppleSheetSurfaceStyle(isDark: boolean, radius = 28, theme?: string): ViewStyle {
  const activeTheme = theme || useAppStore.getState().theme || (isDark ? 'oled' : 'light');
  return {
    backgroundColor: getThemedModalSurfaceColor(activeTheme),
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: getThemedModalBorderColor(activeTheme),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: isDark ? 0.5 : 0.16,
    shadowRadius: 24,
  };
}

export function getAppleSheetCardStyle(isDark: boolean, radius = 16, theme?: string): ViewStyle {
  const activeTheme = theme || useAppStore.getState().theme || (isDark ? 'oled' : 'light');
  return {
    backgroundColor: getThemedModalCardColor(activeTheme),
    borderRadius: radius,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: getThemedModalBorderColor(activeTheme),
  };
}

interface SwipeableBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark?: boolean;
  backgroundColor?: string;
  maxHeight?: number | `${number}%`;
  height?: number | `${number}%`;
  showGrabber?: boolean;
  avoidKeyboard?: boolean;
  dismissible?: boolean;
  scrollable?: boolean;
  edgeToEdge?: boolean;
  sheetStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

function SheetSafeBody({
  edgeToEdge,
  hasExplicitHeight,
  contentContainerStyle,
  children,
}: {
  edgeToEdge: boolean;
  hasExplicitHeight: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  // Se mide dentro del SafeAreaProvider propio del Modal para no heredar la altura de la TabBar
  const modalInsets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flexShrink: 1,
          minHeight: 0,
          paddingBottom: edgeToEdge ? 0 : Math.max(modalInsets.bottom, 16),
        },
        hasExplicitHeight ? { flex: 1 } : undefined,
        contentContainerStyle,
      ]}
    >
      {children}
    </View>
  );
}

export function SwipeableBottomSheet({
  visible,
  onClose,
  isDark = true,
  backgroundColor,
  maxHeight = '90%',
  height,
  showGrabber = true,
  avoidKeyboard = false,
  dismissible = true,
  scrollable = false,
  edgeToEdge = false,
  sheetStyle,
  contentContainerStyle,
  children,
}: SwipeableBottomSheetProps) {
  const theme = useAppStore(state => state.theme) || (isDark ? 'oled' : 'light');
  const resolvedBg = getThemeBaseBackground(theme);
  const resolvedBorder = getThemedModalBorderColor(theme);

  return (
    <SwipeableSheetModal
      visible={visible}
      onClose={onClose}
      backdropColor="rgba(0, 0, 0, 0.68)"
      statusBarTranslucent
      navigationBarTranslucent
      avoidKeyboard={avoidKeyboard}
      dismissible={dismissible}
      dragAreaHeight={scrollable ? HEADER_DRAG_HEIGHT : undefined}
      sheetStyle={[
        styles.sheet,
        {
          backgroundColor: resolvedBg,
          maxHeight,
          height,
          borderWidth: 1,
          borderBottomWidth: 0,
          borderColor: resolvedBorder,
        },
        sheetStyle,
        { backgroundColor: resolvedBg },
      ]}
    >
      <ModalThemeBackground theme={theme} />
      {showGrabber && (
        <View pointerEvents="none" style={styles.grabberArea}>
          <View
            style={[
              styles.grabberPill,
              {
                backgroundColor: isDark
                  ? 'rgba(235, 235, 245, 0.38)'
                  : 'rgba(60, 60, 67, 0.32)',
              },
            ]}
          />
        </View>
      )}
      <SheetSafeBody
        edgeToEdge={edgeToEdge}
        hasExplicitHeight={Boolean(height)}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </SheetSafeBody>
    </SwipeableSheetModal>
  );
}

const styles = StyleSheet.create({
  rootFlex: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  grabberArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    minHeight: 34,
  },
  grabberPill: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
  },
});
