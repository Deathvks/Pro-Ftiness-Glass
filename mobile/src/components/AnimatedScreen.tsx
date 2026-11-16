import React, { useCallback, useRef, useState } from 'react';
import { View, Animated, Platform, KeyboardAvoidingView, StyleSheet, type NativeSyntheticEvent, type NativeScrollEvent, type ScrollViewInstance, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePathname } from 'expo-router';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { getThemeBaseBackground } from '@/constants/theme';
import ThemeBackground from '@/components/ThemeBackground';
import { AndroidHeaderBlurTarget, type HeaderBlurRef } from '@/components/AndroidHeaderBlur';
import { useRegisterTourScroll } from '@/components/tutorials/tourRegistry';

interface AnimatedScreenProps extends Pick<ScrollViewProps, 'onScroll' | 'onLayout' | 'onContentSizeChange'> {
    header: React.ReactNode;
    afterHeader?: React.ReactNode;
    fixedHeader?: boolean;
    children: React.ReactNode;
    paddingBottom?: number;
    paddingHorizontal?: number;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    scrollRef?: React.Ref<ScrollViewInstance>;
}

export default function AnimatedScreen({ 
    header, 
    afterHeader,
    fixedHeader = false,
    children, 
    paddingBottom = 120, 
    paddingHorizontal = 16,
    keyboardShouldPersistTaps,
    scrollRef,
    onScroll,
    onLayout,
    onContentSizeChange,
}: AnimatedScreenProps) {
    const [scrollY] = useState(() => new Animated.Value(0));
    const pathname = usePathname();
    const internalScrollRef = useRef<ScrollViewInstance>(null);
    const scrollOffsetRef = useRef(0);
    const androidBlurTarget = useRef<React.ComponentRef<typeof View>>(null);
    const insets = useSafeAreaInsets();
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = useAppColors();
    const backgroundColor = colors.background === 'transparent' ? getThemeBaseBackground(theme) : colors.background;

    const mergedScrollRef = useCallback((instance: ScrollViewInstance | null) => {
        (internalScrollRef as React.MutableRefObject<ScrollViewInstance | null>).current = instance;
        if (typeof scrollRef === 'function') {
            scrollRef(instance);
        } else if (scrollRef && typeof scrollRef === 'object') {
            (scrollRef as React.MutableRefObject<ScrollViewInstance | null>).current = instance;
        }
    }, [scrollRef]);

    useRegisterTourScroll(pathname || '/', internalScrollRef, useCallback(() => scrollOffsetRef.current, []));

    const handleScrollListener = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffsetRef.current = event.nativeEvent.contentOffset.y || 0;
        onScroll?.(event);
    }, [onScroll]);

    const screenHeader = !fixedHeader && React.isValidElement<{ scrollY?: Animated.Value; androidBlurTarget?: HeaderBlurRef }>(header)
        ? React.cloneElement(header, { scrollY, androidBlurTarget })
        : header;
    const scrollArea = (
        <>
            <ThemeBackground />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
                <Animated.ScrollView
                    ref={mergedScrollRef}
                    automaticallyAdjustContentInsets={fixedHeader ? false : undefined}
                    onLayout={onLayout}
                    onContentSizeChange={onContentSizeChange}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps={keyboardShouldPersistTaps}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: Platform.OS !== 'web', listener: handleScrollListener }
                    )}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                        paddingHorizontal,
                        paddingTop: fixedHeader ? 16 : insets.top + 72,
                        paddingBottom
                    }}
                >
                    {children}
                </Animated.ScrollView>
            </KeyboardAvoidingView>
        </>
    );

    if (fixedHeader) {
        return (
            <View style={[styles.fill, { backgroundColor }]}>
                <View style={[styles.fixedHeaderBar, { backgroundColor }]}>
                    {screenHeader}
                    {afterHeader}
                </View>
                <View style={styles.fixedScrollArea}>{scrollArea}</View>
            </View>
        );
    }

    return (
        <View style={[styles.fill, { backgroundColor }]}>
            <AndroidHeaderBlurTarget target={androidBlurTarget}>
                {scrollArea}
            </AndroidHeaderBlurTarget>

            <View pointerEvents="box-none" style={styles.floatingHeader}>
                {screenHeader}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    fill: { flex: 1 },
    fixedHeaderBar: { flexShrink: 0, zIndex: 1 },
    fixedScrollArea: { flex: 1, overflow: 'hidden' },
    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
});
