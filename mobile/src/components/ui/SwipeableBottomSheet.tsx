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

export function useSwipeToDismiss(onClose: () => void, visible?: boolean) {
  const translateY = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (visible) {
      translateY.setValue(0);
    }
  }, [visible, translateY]);

  const handleRelease = (dy: number, vy: number) => {
    if (dy > 85 || (dy > 30 && vy > 0.6)) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT * 0.75,
        duration: 190,
        useNativeDriver: true,
      }).start(() => {
        onCloseRef.current?.();
        setTimeout(() => translateY.setValue(0), 60);
      });
    } else {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 240,
        mass: 0.8,
      }).start();
    }
  };

  // PanResponder for header / top area (doesn't steal taps from close buttons)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx) * 1.15,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        } else {
          translateY.setValue(g.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminate: (_, g) => handleRelease(g.dy, g.vy),
    })
  ).current;

  // PanResponder specifically for the top grabber pill (responds immediately on touch)
  const grabberPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 2,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
        } else {
          translateY.setValue(g.dy * 0.15);
        }
      },
      onPanResponderRelease: (_, g) => handleRelease(g.dy, g.vy),
      onPanResponderTerminate: (_, g) => handleRelease(g.dy, g.vy),
    })
  ).current;

  return {
    translateY,
    panHandlers: panResponder.panHandlers,
    grabberPanHandlers: grabberPanResponder.panHandlers,
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
    shadowOpacity: isDark ? 0.45 : 0.12,
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
  sheetStyle,
  contentContainerStyle,
  children,
}: SwipeableBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const { translateY, panHandlers, grabberPanHandlers } = useSwipeToDismiss(onClose, visible);

  const resolvedBg = isIOS
    ? isDark
      ? '#1C1C1E'
      : '#F2F2F7'
    : backgroundColor || (isDark ? '#141418' : '#FFFFFF');

  const innerContent = (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View
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
          <View {...grabberPanHandlers} style={styles.grabberTouchArea}>
            <View
              style={[
                styles.grabberPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(235, 235, 245, 0.30)'
                    : 'rgba(60, 60, 67, 0.25)',
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
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
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
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
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
    paddingTop: 10,
    paddingBottom: 6,
  },
  grabberPill: {
    width: 38,
    height: 5,
    borderRadius: 2.5,
  },
});
