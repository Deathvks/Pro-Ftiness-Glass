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
  lastProgrammaticOffset?: number;
  lastProgrammaticAt?: number;
}

const targetRegistry = new Map<string, React.RefObject<any>>();
const scrollRegistry = new Map<string, ScrollEntry>();

export function normalizeRouteKey(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  const withoutQuery = pathname.split('?')[0];
  const cleaned = withoutQuery.replace(/\/+$/, '') || '/';
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

async function waitForTargetSettle(id: string, maxWaitMs = 680): Promise<TargetRect | null> {
  const start = Date.now();
  await new Promise(r => setTimeout(r, 110));
  let prev = await measureTourTarget(id);
  let stableCount = 0;

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 65));
    const cur = await measureTourTarget(id);
    if (!cur) return prev;
    if (
      prev &&
      Math.abs(cur.x - prev.x) <= 1.5 &&
      Math.abs(cur.y - prev.y) <= 1.5
    ) {
      stableCount += 1;
      if (stableCount >= 2) {
        return cur;
      }
    } else {
      stableCount = 0;
    }
    prev = cur;
  }

  return prev;
}

function readCurrentScrollOffset(entry: ScrollEntry): number {
  const tracked = entry.getOffset();
  if (
    entry.lastProgrammaticOffset != null &&
    entry.lastProgrammaticAt != null &&
    Date.now() - entry.lastProgrammaticAt < 900 &&
    Math.abs(tracked - entry.lastProgrammaticOffset) > 40
  ) {
    return entry.lastProgrammaticOffset;
  }
  return tracked;
}

export async function scrollTourTargetIntoView(
  id: string,
  routeKey: string,
  topMargin = 100,
  bottomReserved = 240,
): Promise<TargetRect | null> {
  const initialRect = await measureTourTarget(id);
  if (!initialRect) return null;

  const winHeight = Dimensions.get('window').height;
  const visibleBottom = winHeight - bottomReserved;
  const isComfortablyVisible =
    initialRect.y >= topMargin &&
    initialRect.y + Math.min(initialRect.height, 140) <= visibleBottom;

  if (isComfortablyVisible) {
    return initialRect;
  }

  const scrollEntry = scrollRegistry.get(normalizeRouteKey(routeKey));
  if (!scrollEntry) {
    return initialRect;
  }

  const scroller = scrollEntry.getRef();
  const currentOffset = readCurrentScrollOffset(scrollEntry);
  const desiredY = Math.max(topMargin, winHeight * 0.22);
  const delta = initialRect.y - desiredY;
  const nextOffset = Math.max(0, currentOffset + delta);

  const scrolled = invokeScrollToOffset(scroller, nextOffset);
  if (!scrolled) return initialRect;

  scrollEntry.lastProgrammaticOffset = nextOffset;
  scrollEntry.lastProgrammaticAt = Date.now();

  const settled = await waitForTargetSettle(id, 680);
  if (!settled) return initialRect;

  // Fine-tune once if target is still outside comfortable band after deceleration
  const needsCorrection =
    settled.y < topMargin - 12 ||
    settled.y + Math.min(settled.height, 120) > visibleBottom + 12;

  if (needsCorrection) {
    const correctedOffset = Math.max(0, nextOffset + (settled.y - desiredY));
    if (Math.abs(correctedOffset - nextOffset) > 16) {
      invokeScrollToOffset(scroller, correctedOffset);
      scrollEntry.lastProgrammaticOffset = correctedOffset;
      scrollEntry.lastProgrammaticAt = Date.now();
      return (await waitForTargetSettle(id, 380)) || settled;
    }
  }

  return settled;
}
