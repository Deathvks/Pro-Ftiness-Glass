import { useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ScrollEntry {
  getRef: () => any;
  getOffset: () => number;
}

const targetRegistry = new Map<string, React.RefObject<any>>();
const scrollRegistry = new Map<string, ScrollEntry>();

export function normalizeRouteKey(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  const cleaned = pathname.replace(/\/+$/, '') || '/';
  if (cleaned === '/(tabs)' || cleaned === '/(tabs)/index' || cleaned === '/index') {
    return '/';
  }
  return cleaned.replace(/^\/\(tabs\)/, '') || '/';
}

export function registerTourTarget(id: string, ref: React.RefObject<any>) {
  targetRegistry.set(id, ref);
}

export function unregisterTourTarget(id: string, ref: React.RefObject<any>) {
  if (targetRegistry.get(id) === ref) {
    targetRegistry.delete(id);
  }
}

export function hasTourTarget(id: string): boolean {
  const ref = targetRegistry.get(id);
  return Boolean(ref?.current);
}

export function registerTourScroll(routeKey: string, entry: ScrollEntry) {
  scrollRegistry.set(normalizeRouteKey(routeKey), entry);
}

export function unregisterTourScroll(routeKey: string, entry: ScrollEntry) {
  const key = normalizeRouteKey(routeKey);
  if (scrollRegistry.get(key) === entry) {
    scrollRegistry.delete(key);
  }
}

export function useRegisterTourScroll(
  routeKey: string,
  scrollRef: React.RefObject<any>,
  getOffset: () => number,
) {
  useEffect(() => {
    const entry: ScrollEntry = {
      getRef: () => scrollRef.current,
      getOffset,
    };
    registerTourScroll(routeKey, entry);
    return () => unregisterTourScroll(routeKey, entry);
  }, [routeKey, scrollRef, getOffset]);
}

export function measureTourTarget(id: string): Promise<TargetRect | null> {
  return new Promise(resolve => {
    const ref = targetRegistry.get(id);
    const node = ref?.current as any;
    if (!node || typeof node.measureInWindow !== 'function') {
      resolve(null);
      return;
    }
    try {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (!width || !height || Number.isNaN(x) || Number.isNaN(y)) {
          resolve(null);
        } else {
          resolve({ x, y, width, height });
        }
      });
    } catch {
      resolve(null);
    }
  });
}

function invokeScrollToOffset(scroller: any, offset: number) {
  if (!scroller) return false;
  const targetOffset = Math.max(0, offset);
  const node = typeof scroller.getNode === 'function' ? scroller.getNode() : scroller;
  if (typeof node?.scrollTo === 'function') {
    node.scrollTo({ y: targetOffset, animated: true });
    return true;
  }
  if (typeof node?.scrollToOffset === 'function') {
    node.scrollToOffset({ offset: targetOffset, animated: true });
    return true;
  }
  if (typeof scroller.scrollTo === 'function') {
    scroller.scrollTo({ y: targetOffset, animated: true });
    return true;
  }
  if (typeof scroller.scrollToOffset === 'function') {
    scroller.scrollToOffset({ offset: targetOffset, animated: true });
    return true;
  }
  return false;
}

export async function scrollTourTargetIntoView(
  id: string,
  routeKey: string,
  topMargin = 104,
  bottomReserved = 230,
): Promise<TargetRect | null> {
  const initialRect = await measureTourTarget(id);
  if (!initialRect) return null;

  const winHeight = Dimensions.get('window').height;
  const visibleBottom = winHeight - bottomReserved;
  const isComfortablyVisible =
    initialRect.y >= topMargin && initialRect.y + Math.min(initialRect.height, 140) <= visibleBottom;

  if (isComfortablyVisible) {
    return initialRect;
  }

  const scrollEntry = scrollRegistry.get(normalizeRouteKey(routeKey));
  if (!scrollEntry) {
    return initialRect;
  }

  const scroller = scrollEntry.getRef();
  const currentOffset = scrollEntry.getOffset();
  const desiredY = Math.max(topMargin, winHeight * 0.24);
  const delta = initialRect.y - desiredY;
  const nextOffset = Math.max(0, currentOffset + delta);

  const scrolled = invokeScrollToOffset(scroller, nextOffset);
  if (!scrolled) return initialRect;

  await new Promise(r => setTimeout(r, 340));
  return (await measureTourTarget(id)) || initialRect;
}
