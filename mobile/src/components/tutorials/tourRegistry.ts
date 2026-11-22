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
const horizontalScrollRegistry = new Map<string, ScrollEntry>();

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

export async function waitForTourTarget(id: string, maxWaitMs = 450): Promise<boolean> {
  if (hasTourTarget(id)) return true;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 60));
    if (hasTourTarget(id)) return true;
  }
  return false;
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
  const normalizedKey = normalizeRouteKey(routeKey);
  useEffect(() => {
    const entry: ScrollEntry = {
      getRef: () => scrollRef.current,
      getOffset,
    };
    registerTourScroll(normalizedKey, entry);
    return () => unregisterTourScroll(normalizedKey, entry);
  }, [normalizedKey, scrollRef, getOffset]);
}

export function useRegisterTourHorizontalScroll(
  targetId: string,
  scrollRef: React.RefObject<any>,
  getOffset: () => number,
) {
  useEffect(() => {
    const entry: ScrollEntry = {
      getRef: () => scrollRef.current,
      getOffset,
    };
    horizontalScrollRegistry.set(targetId, entry);
    return () => {
      if (horizontalScrollRegistry.get(targetId) === entry) {
        horizontalScrollRegistry.delete(targetId);
      }
    };
  }, [targetId, scrollRef, getOffset]);
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

function invokeScrollToOffset(scroller: any, offset: number, horizontal = false) {
  if (!scroller) return false;
  const targetOffset = Math.max(0, offset);
  const node = typeof scroller.getNode === 'function' ? scroller.getNode() : scroller;
  const scrollArgs = horizontal ? { x: targetOffset, y: 0, animated: true } : { y: targetOffset, animated: true };

  if (typeof node?.scrollTo === 'function') {
    node.scrollTo(scrollArgs);
    return true;
  }
  if (!horizontal && typeof node?.scrollToOffset === 'function') {
    node.scrollToOffset({ offset: targetOffset, animated: true });
    return true;
  }
  if (typeof scroller.scrollTo === 'function') {
    scroller.scrollTo(scrollArgs);
    return true;
  }
  if (!horizontal && typeof scroller.scrollToOffset === 'function') {
    scroller.scrollToOffset({ offset: targetOffset, animated: true });
    return true;
  }
  return false;
}

async function waitForTargetSettle(id: string, maxWaitMs = 850): Promise<TargetRect | null> {
  const start = Date.now();
  await new Promise(r => setTimeout(r, 150));
  let prev = await measureTourTarget(id);
  let stableCount = 0;

  while (Date.now() - start < maxWaitMs) {
    await new Promise(r => setTimeout(r, 70));
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
    tracked === 0 &&
    entry.lastProgrammaticOffset > 10
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
  viewport?: { originY?: number; winWidth?: number; winHeight?: number },
): Promise<TargetRect | null> {
  await waitForTourTarget(id, 420);
  let initialRect = await measureTourTarget(id);
  if (!initialRect) return null;

  const { width: dimW, height: dimH } = Dimensions.get('window');
  const winWidth = viewport?.winWidth || dimW;
  const winHeight = viewport?.winHeight || dimH;
  const originY = viewport?.originY || 0;

  // Ensure horizontally scrollable targets (e.g. tab strips) are brought into frame first
  const hEntry = horizontalScrollRegistry.get(id);
  if (hEntry && (initialRect.x < 12 || initialRect.x + initialRect.width > winWidth - 12)) {
    const hScroller = hEntry.getRef();
    const curX = readCurrentScrollOffset(hEntry);
    const desiredX = Math.max(16, (winWidth - initialRect.width) / 2);
    const nextX = Math.max(0, curX + (initialRect.x - desiredX));
    if (invokeScrollToOffset(hScroller, nextX, true)) {
      hEntry.lastProgrammaticOffset = nextX;
      hEntry.lastProgrammaticAt = Date.now();
      const hSettled = await waitForTargetSettle(id, 500);
      if (hSettled) initialRect = hSettled;
    }
  }

  const effectiveTop = originY + topMargin;
  const visibleBottom = originY + winHeight - bottomReserved;
  const availableHeight = Math.max(120, visibleBottom - effectiveTop);
  const fitsInViewport = initialRect.height <= availableHeight;

  const isComfortablyVisible = fitsInViewport
    ? initialRect.y >= effectiveTop && initialRect.y + initialRect.height <= visibleBottom
    : initialRect.y >= effectiveTop - 6 && initialRect.y <= effectiveTop + 56;

  if (isComfortablyVisible) {
    return initialRect;
  }

  const scrollEntry = scrollRegistry.get(normalizeRouteKey(routeKey));
  if (!scrollEntry) {
    return initialRect;
  }

  const scroller = scrollEntry.getRef();
  const currentOffset = readCurrentScrollOffset(scrollEntry);
  const desiredY = fitsInViewport
    ? Math.max(
        effectiveTop,
        Math.min(Math.max(effectiveTop + 8, originY + winHeight * 0.2), visibleBottom - initialRect.height - 10),
      )
    : effectiveTop + 8;

  const delta = initialRect.y - desiredY;
  const nextOffset = Math.max(0, currentOffset + delta);

  const scrolled = invokeScrollToOffset(scroller, nextOffset);
  if (!scrolled) return initialRect;

  scrollEntry.lastProgrammaticOffset = nextOffset;
  scrollEntry.lastProgrammaticAt = Date.now();

  const settled = await waitForTargetSettle(id, 850);
  if (!settled) return initialRect;

  // Fine-tune once only if the target actually moved and still falls outside the safe frame
  const movedSignificantly = Math.abs(settled.y - initialRect.y) > 4;
  const needsCorrection = fitsInViewport
    ? settled.y < effectiveTop - 10 || settled.y + settled.height > visibleBottom + 10
    : settled.y < effectiveTop - 12 || settled.y > effectiveTop + 68;

  if (movedSignificantly && needsCorrection) {
    const curAfter = readCurrentScrollOffset(scrollEntry);
    const correctedOffset = Math.max(0, curAfter + (settled.y - desiredY));
    if (Math.abs(correctedOffset - curAfter) > 16) {
      invokeScrollToOffset(scroller, correctedOffset);
      scrollEntry.lastProgrammaticOffset = correctedOffset;
      scrollEntry.lastProgrammaticAt = Date.now();
      return (await waitForTargetSettle(id, 480)) || settled;
    }
  }

  return settled;
}
