import React, { useEffect, useRef } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { registerTourTarget, unregisterTourTarget } from './tourRegistry';

interface TourTargetProps {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function TourTarget({ id, children, style }: TourTargetProps) {
  const viewRef = useRef<React.ComponentRef<typeof View>>(null);

  useEffect(() => {
    registerTourTarget(id, viewRef);
    return () => unregisterTourTarget(id, viewRef);
  }, [id]);

  return (
    <View ref={viewRef} collapsable={false} style={style}>
      {children}
    </View>
  );
}
