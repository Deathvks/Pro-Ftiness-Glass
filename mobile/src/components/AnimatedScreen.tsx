import React, { useRef } from 'react';
import { View, Animated, Platform, KeyboardAvoidingView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useAppStore from '@/store/useAppStore';
import { Colors } from '@/constants/theme';

interface AnimatedScreenProps {
    header: React.ReactNode;
    children: React.ReactNode;
    paddingBottom?: number;
    paddingHorizontal?: number;
}

export default function AnimatedScreen({ 
    header, 
    children, 
    paddingBottom = 120, 
    paddingHorizontal = 16 
}: AnimatedScreenProps) {
    const scrollY = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();
    const theme = useAppStore(state => state.theme) || 'oled';
    const colors = Colors[theme] || Colors.oled;

    const headerOpacity = 1;
    const headerTranslateY = 0;

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <Animated.ScrollView
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: true }
                    )}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ 
                        paddingHorizontal, 
                        // El padding top se calcula para dejar espacio al header sin pisarse
                        paddingTop: insets.top + 70, 
                        paddingBottom 
                    }}
                >
                    {children}
                </Animated.ScrollView>
            </KeyboardAvoidingView>

            {/* Header Flotante y Animado */}
            <Animated.View style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                opacity: headerOpacity,
                transform: [{ translateY: headerTranslateY }],
                pointerEvents: 'box-none'
            }}>
                {React.isValidElement(header) ? React.cloneElement(header as any, { scrollY }) : header}
            </Animated.View>
        </View>
    );
}
