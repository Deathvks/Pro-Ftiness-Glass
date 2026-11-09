import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Pressable,
  Animated,
  PanResponder,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  StyleProp,
  ViewStyle,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function useSwipeToDismiss(
  onClose: () => void,
  visible?: boolean,
  options?: {
    scrollable?: boolean;
    headerDragHeight?: number;
  }
) {
  const scrollable = options?.scrollable ?? false;
  const headerDragHeight = options?.headerDragHeight ?? 260;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetHeightRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT * 0.65);
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
    } else if (visible === false) {
      translateY.setValue(0);
      backdropOpacity.setValue(1);
    }
  }, [visible, translateY, backdropOpacity]);

  const dismissAnimated = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT * 0.85,
        duration: 190,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCloseRef.current?.();
      setTimeout(() => {
        translateY.setValue(0);
        backdropOpacity.setValue(1);
      }, 60);
    });
  };

  const handleRelease = (dy: number, vy: number) => {
    // Easy natural dismiss threshold: dragged down > 48px OR a light flick downward
    if (dy > 48 || (dy > 16 && vy > 0.3)) {
      dismissAnimated();
    } else {
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
    }
  };

  const updateDrag = (dy: number) => {
    if (dy > 0) {
      translateY.setValue(dy);
      const nextOpacity = Math.max(0.2, 1 - dy / (SCREEN_HEIGHT * 0.55));
      backdropOpacity.setValue(nextOpacity);
    } else {
      translateY.setValue(dy * 0.12);
    }
  };

  // PanResponder for the sheet container (captures downward swipes smoothly)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: evt => {
        touchStartYRef.current = evt.nativeEvent.pageY;
        return false;
      },
      onMoveShouldSetPanResponderCapture: (evt, g) => {
        // Must be a predominantly downward movement
        const isVerticalDown = g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx) * 1.05;
        if (!isVerticalDown) return false;

        // If the modal has no inner scroll view (like options, cards, confirmation dialogs),
        // ANY downward swipe anywhere on the modal immediately captures and starts sliding down!
        if (!scrollable) {
          return true;
        }

        // For scrollable modals, capture downward drags starting in the upper zone
        // (grabber + header + top of content): at least headerDragHeight or 40% of the sheet
        const sheetH = sheetHeightRef.current || SCREEN_HEIGHT * 0.85;
        const sheetTop = Math.max(0, SCREEN_HEIGHT - sheetH);
        const touchRelY = (touchStartYRef.current || evt.nativeEvent.pageY) - sheetTop;
        const dragZone = Math.max(headerDragHeight, sheetH * 0.4);

        if (touchRelY <= dragZone) {
          return true;
        }

        return false;
      },
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx) * 1.05,
      onPanResponderMove: (_, g) => updateDrag(g.dy),
      onPanResponderRelease: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminate: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Dedicated PanResponder for the top grabber pill area (instant capture on any touch)
  const grabberPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 2 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => updateDrag(g.dy),
      onPanResponderRelease: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminate: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  const onSheetLayout = (e: any) => {
    const h = e?.nativeEvent?.layout?.height;
    if (typeof h === 'number' && h > 0) {
      sheetHeightRef.current = h;
    }
  };

  return {
    translateY,
    backdropOpacity,
    panHandlers: panResponder.panHandlers,
    grabberPanHandlers: grabberPanResponder.panHandlers,
    onSheetLayout,
    dismissAnimated,
  };
}

export function getAppleSheetSurfaceStyle(isDark: boolean, radius = 28): ViewStyle {
  if (Platform.OS !== 'ios') return {};
  return {
    backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
    borderTopLeftRadius: radius,
    borderTopRightRadius: radius,
    borderCurve: 'continuous',
    borderWidth: 0,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: isDark ? 0.5 : 0.16,
    shadowRadius: 24,
  };
}

export function getAppleSheetCardStyle(isDark: boolean, radius = 16): ViewStyle {
  if (Platform.OS !== 'ios') return {};
  return {
    backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
    borderRadius: radius,
    borderCurve: 'continuous',
    borderWidth: 0,
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
  scrollable?: boolean;
  headerDragHeight?: number;
  sheetStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  children: React.ReactNode;
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
  scrollable = false,
  headerDragHeight = 260,
  sheetStyle,
  contentContainerStyle,
  children,
}: SwipeableBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const {
    translateY,
    backdropOpacity,
    panHandlers,
    grabberPanHandlers,
    onSheetLayout,
    dismissAnimated,
  } = useSwipeToDismiss(onClose, visible, { scrollable, headerDragHeight });

  const resolvedBg = isIOS
    ? isDark
      ? '#1C1C1E'
      : '#F2F2F7'
    : backgroundColor || (isDark ? '#141418' : '#FFFFFF');

  const innerContent = (
    <View style={styles.overlay}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={styles.backdropPressable} onPress={dismissAnimated} />
      </Animated.View>
      <Animated.View
        onLayout={onSheetLayout}
        {...panHandlers}
        style={[
          styles.sheet,
          {
            backgroundColor: resolvedBg,
            maxHeight,
            ...(height ? { height } : {}),
            paddingBottom: Math.max(insets.bottom, 16),
            borderWidth: isIOS ? 0 : 1,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            transform: [{ translateY }],
          },
          isIOS && getAppleSheetSurfaceStyle(isDark, 28),
          sheetStyle,
        ]}
      >
        {showGrabber && (
          <View
            {...grabberPanHandlers}
            style={styles.grabberTouchArea}
            hitSlop={{ top: 15, bottom: 15, left: 40, right: 40 }}
          >
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
        <View style={[{ flexShrink: 1 }, height ? { flex: 1 } : undefined, contentContainerStyle]}>
          {children}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissAnimated}
    >
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {innerContent}
        </KeyboardAvoidingView>
      ) : (
        innerContent
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  grabberTouchArea: {
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
