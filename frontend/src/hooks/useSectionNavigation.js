import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const desktopQuery = '(min-width: 768px)';
const settingsHighlights = { workout: 'workout', notifications: 'notifications', social_privacy: 'privacy' };

export function useSectionRoute() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const highlight = location.pathname === '/settings' ? params.get('highlight') : null;
  const section = params.get('section') || (Object.hasOwn(settingsHighlights, highlight) ? settingsHighlights[highlight] : null);

  const selectSection = (id, fromMenu = false) => {
    const next = new URLSearchParams(params);
    next.delete('highlight');
    next.set('section', id);
    setParams(next, {
      replace: !fromMenu,
      state: { ...location.state, sectionFromMenu: fromMenu || location.state?.sectionFromMenu === true },
    });
  };

  const closeSection = () => {
    if (location.state?.sectionFromMenu) {
      navigate(-1);
      return;
    }
    const next = new URLSearchParams(params);
    next.delete('section');
    next.delete('highlight');
    setParams(next, { replace: true, state: location.state });
  };

  return { section, highlight, selectSection, closeSection };
}

export function useSectionNavigation(sections, defaultSection, scrollRef, storageKey) {
  const { section, highlight, selectSection, closeSection } = useSectionRoute();
  const [isMobile, setIsMobile] = useState(() => !window.matchMedia(desktopQuery).matches);
  const isValid = id => sections.some(item => item.id === id);
  const [desktopSection, setDesktopSection] = useState(() => {
    try {
      const stored = storageKey ? localStorage.getItem(storageKey) : null;
      return isValid(stored) ? stored : defaultSection;
    } catch {
      return defaultSection;
    }
  });
  const linkedSection = isValid(section) ? section : null;
  const activeTab = linkedSection ?? (isMobile ? null : desktopSection);
  const previousMobileTab = useRef(activeTab);
  const menuScroll = useRef(0);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const sync = () => setIsMobile(!media.matches);
    media.addEventListener('change', sync);
    sync();
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!storageKey || !activeTab) return;
    try {
      localStorage.setItem(storageKey, activeTab);
    } catch { /* La selección sigue disponible durante esta visita. */ }
  }, [activeTab, storageKey]);

  useEffect(() => {
    const previous = previousMobileTab.current;
    previousMobileTab.current = activeTab;
    if (!isMobile || previous === activeTab) return;
    if (scrollRef?.current) scrollRef.current.scrollTop = activeTab ? 0 : menuScroll.current;
  }, [activeTab, isMobile, scrollRef]);

  const setActiveTab = id => {
    if (!isValid(id)) return;
    if (isMobile && !linkedSection) menuScroll.current = scrollRef?.current?.scrollTop ?? 0;
    setDesktopSection(id);
    if (isMobile || linkedSection) selectSection(id, isMobile && !linkedSection);
  };

  return { activeTab, isMobile, highlight, setActiveTab, closeSection };
}
