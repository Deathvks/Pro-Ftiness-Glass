import type { ComponentRef, ReactNode, RefObject } from 'react';
import { Platform, type View } from 'react-native';
import { BlurTargetView } from 'expo-blur';

export type HeaderBlurRef = RefObject<ComponentRef<typeof View> | null>;

export const androidHeaderBlurAvailable = Platform.OS === 'android' && Number(Platform.Version) >= 31;

export function AndroidHeaderBlurTarget({ target, children }: { target: HeaderBlurRef; children: ReactNode }) {
    if (!androidHeaderBlurAvailable) return <>{children}</>;

    return <BlurTargetView ref={target} style={{ flex: 1 }}>{children}</BlurTargetView>;
}
