/* frontend/src/components/Admin/AdminNewsTracker.jsx */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Activity,
  Radio,
  RefreshCw,
  Search,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Compass,
  Clock,
  Calendar,
  Users,
  Eye,
  Trash2,
  Check,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Info,
  ShieldCheck,
  Zap,
  Terminal,
  Sparkles,
  X
} from 'lucide-react';
import {
  FaGoogle,
  FaInstagram,
  FaWhatsapp,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaTelegram,
  FaReddit
} from 'react-icons/fa6';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import Spinner from '../Spinner';
import * as newsService from '../../services/newsService';
import { useToast } from '../../hooks/useToast';

// Icono correspondiente según la procedencia
const getReferrerIcon = (type, host = '') => {
  const h = (host || '').toLowerCase();
  if (h.includes('google')) return <FaGoogle className="text-red-500 shrink-0" size={13} />;
  if (h.includes('instagram')) return <FaInstagram className="text-pink-500 shrink-0" size={13} />;
  if (h.includes('whatsapp')) return <FaWhatsapp className="text-emerald-500 shrink-0" size={13} />;
  if (h.includes('twitter') || h.includes('x.com') || h.includes('t.co')) return <FaXTwitter className="text-text-primary shrink-0" size={13} />;
  if (h.includes('facebook') || h.includes('fb.com')) return <FaFacebook className="text-blue-500 shrink-0" size={13} />;
  if (h.includes('tiktok')) return <FaTiktok className="text-purple-500 shrink-0" size={13} />;
  if (h.includes('telegram') || h.includes('t.me')) return <FaTelegram className="text-sky-500 shrink-0" size={13} />;
  if (h.includes('reddit')) return <FaReddit className="text-orange-500 shrink-0" size={13} />;
  if (type === 'search') return <Compass className="text-amber-500 shrink-0" size={13} />;
  if (type === 'social') return <Globe className="text-purple-500 shrink-0" size={13} />;
  if (type === 'internal') return <Activity className="text-accent shrink-0" size={13} />;
  return <Compass className="text-text-secondary shrink-0" size={13} />;
};

// Icono correspondiente según el tipo de dispositivo
const getDeviceIcon = (deviceType) => {
  switch (deviceType) {
    case 'mobile':
      return <Smartphone size={13} className="text-accent shrink-0" />;
    case 'tablet':
      return <Tablet size={13} className="text-amber-500 shrink-0" />;
    default:
      return <Monitor size={13} className="text-sky-500 shrink-0" />;
  }
};

// Conversión de código de país a emoji de bandera
const getCountryFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode === 'XX' || countryCode === 'DEV') return '🌐';
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
};

export default function AdminNewsTracker() {
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isTestPinging, setIsTestPinging] = useState(false);
  const [isClearingTests, setIsClearingTests] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    realVisits: 0,
    testVisits: 0,
    devices: { mobile: 0, desktop: 0, tablet: 0 },
    topReferrers: [],
    topArticles: []
  });

  const [visits, setVisits] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('all'); // 'today' | '7d' | '30d' | 'all'
  const [modeFilter, setModeFilter] = useState('all'); // 'all' | 'real' | 'articles' | 'catalog' | 'test'

  // Modal de inspección técnica profunda
  const [inspectedVisit, setInspectedVisit] = useState(null);
  const [expandedMobileIds, setExpandedMobileIds] = useState(new Set());

  const autoRefreshTimerRef = useRef(null);

  const loadAnalytics = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await newsService.fetchNewsAnalytics({
        period: periodFilter,
        mode: modeFilter
      });
      if (data?.stats) {
        setStats(data.stats);
      }
      if (Array.isArray(data?.visits)) {
        setVisits(data.visits);
      }
    } catch (err) {
      console.warn('Error al cargar analítica de noticias:', err);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [periodFilter, modeFilter]);

  // Carga inicial y ante cambio de filtros
  useEffect(() => {
    loadAnalytics(true);
  }, [loadAnalytics]);

  // Temporizador de refresco en vivo (Radar)
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        loadAnalytics(false);
      }, 5000);
    } else {
      clearInterval(autoRefreshTimerRef.current);
    }
    return () => clearInterval(autoRefreshTimerRef.current);
  }, [autoRefresh, loadAnalytics]);

  // Acción: Enviar ping de prueba para comprobar que el tracker responde
  const handleTestPing = async () => {
    setIsTestPinging(true);
    try {
      const res = await newsService.sendTestVisitPing();
      if (res?.success) {
        addToast('¡Ping de prueba registrado! Tu visita aparece arriba en la lista.', 'success');
        await loadAnalytics(false);
      } else {
        addToast('No se pudo registrar el ping de prueba.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Error en ping de prueba', 'error');
    } finally {
      setIsTestPinging(false);
    }
  };

  // Acción: Limpiar visitas de prueba
  const handleClearTests = async () => {
    if (!window.confirm('¿Deseas eliminar todas las visitas de prueba de diagnóstico?')) return;
    setIsClearingTests(true);
    try {
      const res = await newsService.clearTestVisits();
      addToast(res.message || 'Visitas de prueba eliminadas.', 'info');
      await loadAnalytics(false);
    } catch (err) {
      addToast(err.message || 'Error al limpiar visitas de prueba', 'error');
    } finally {
      setIsClearingTests(false);
    }
  };

  const toggleMobileExpand = (id) => {
    setExpandedMobileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtrado reactivo en memoria por texto de búsqueda
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return visits;
    const q = searchQuery.toLowerCase().trim();
    return visits.filter(v => {
      const title = (v.article_title || '').toLowerCase();
      const slug = (v.article_slug || '').toLowerCase();
      const ip = (v.ip_address || '').toLowerCase();
      const city = (v.city || '').toLowerCase();
      const country = (v.country || '').toLowerCase();
      const host = (v.referrer_host || '').toLowerCase();
      const browser = (v.browser || '').toLowerCase();
      const os = (v.os || '').toLowerCase();
      const user = (v.user?.name || v.user?.username || v.user?.email || '').toLowerCase();
      return (
        title.includes(q) ||
        slug.includes(q) ||
        ip.includes(q) ||
        city.includes(q) ||
        country.includes(q) ||
        host.includes(q) ||
        browser.includes(q) ||
        os.includes(q) ||
        user.includes(q)
      );
    });
  }, [visits, searchQuery]);

  // Cálculos de porcentajes para métricas
  const deviceTotal = (stats.devices.mobile || 0) + (stats.devices.desktop || 0) + (stats.devices.tablet || 0);
  const mobilePercent = deviceTotal > 0 ? Math.round(((stats.devices.mobile || 0) / deviceTotal) * 100) : 0;
  const desktopPercent = deviceTotal > 0 ? Math.round(((stats.devices.desktop || 0) / deviceTotal) * 100) : 0;

  const topReferrerItem = stats.topReferrers && stats.topReferrers.length > 0 ? stats.topReferrers[0] : null;

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* CABECERA CON ESTADO EN TIEMPO REAL Y ACCIONES */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-[24px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight flex items-center gap-2">
              <Activity className="text-accent shrink-0" size={22} />
              <span>Tracker & Analítica en Vivo</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Sniffer en Línea</span>
            </span>
          </div>
          <p className="text-xs text-text-tertiary">
            Rastreo avanzado en tiempo real: procedencia, buscador, red social, dispositivo, IP y lector.
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Probar Tracker Ahora */}
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTestPinging}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-accent to-emerald-500 text-white shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            title="Envía una visita de diagnóstico para comprobar que el rastreo funciona inmediatamente"
          >
            {isTestPinging ? <Spinner size="small" /> : <Zap size={14} className="shrink-0" />}
            <span>Probar Tracker Ahora</span>
          </button>

          {/* Toggle Radar Automático */}
          <button
            type="button"
            onClick={() => setAutoRefresh(prev => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold transition-all border active:scale-95 cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-text-secondary'
            }`}
            title="Activa el radar de actualización cada 5 segundos"
          >
            <Radio size={13} className={autoRefresh ? 'animate-pulse text-emerald-500' : ''} />
            <span className="hidden xs:inline">Radar en vivo</span>
            <span className="text-[10px] opacity-75">({autoRefresh ? '5s' : 'Off'})</span>
          </button>

          {/* Botón Refrescar Manual */}
          <button
            type="button"
            onClick={() => loadAnalytics(true)}
            disabled={isLoading}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title="Recargar datos ahora"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-accent' : ''} />
          </button>

          {/* Limpiar visitas de prueba si existen */}
          {stats.testVisits > 0 && (
            <button
              type="button"
              onClick={handleClearTests}
              disabled={isClearingTests}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
              title={`Limpiar ${stats.testVisits} visitas de prueba`}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* TARJETAS KPI (RESPONSIVE GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Visitas */}
        <div className="p-4 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold mb-2">
            <span>Visitas Totales</span>
            <Eye size={15} className="text-accent" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {stats.totalVisits.toLocaleString()}
            </span>
            {stats.todayVisits > 0 && (
              <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                +{stats.todayVisits} hoy
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-tertiary mt-1">
            {stats.realVisits} reales • {stats.testVisits} pruebas
          </p>
        </div>

        {/* Visitantes Únicos */}
        <div className="p-4 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold mb-2">
            <span>Visitantes Únicos</span>
            <Users size={15} className="text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              {stats.uniqueVisitors.toLocaleString()}
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-1">
            Dispositivos y personas distintas
          </p>
        </div>

        {/* Dispositivos (Móvil vs PC) */}
        <div className="p-4 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold mb-2">
            <span>Dispositivos</span>
            <Smartphone size={15} className="text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1 text-sm font-black text-text-primary">
            <span>{mobilePercent}% Móvil</span>
            <span className="text-text-tertiary font-normal">/</span>
            <span className="text-xs text-text-secondary font-bold">{desktopPercent}% PC</span>
          </div>
          {/* Barra de progreso visual */}
          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2 flex">
            <div style={{ width: `${mobilePercent}%` }} className="bg-accent h-full transition-all"></div>
            <div style={{ width: `${desktopPercent}%` }} className="bg-sky-500 h-full transition-all"></div>
          </div>
        </div>

        {/* Canal Principal */}
        <div className="p-4 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] border border-black/10 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-text-secondary text-xs font-semibold mb-2">
            <span>Canal Principal</span>
            <Compass size={15} className="text-amber-500" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {topReferrerItem ? (
              <>
                {getReferrerIcon(topReferrerItem.type, topReferrerItem.host)}
                <span className="text-base sm:text-lg font-black text-text-primary truncate">
                  {topReferrerItem.host}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold text-text-tertiary">Sin datos aún</span>
            )}
          </div>
          <p className="text-[11px] text-text-tertiary mt-1 truncate">
            {topReferrerItem ? `${topReferrerItem.count} accesos registrados` : 'Esperando primeras visitas'}
          </p>
        </div>
      </div>

      {/* TOP FUENTES Y TOP ARTÍCULOS (GRID DOS COLUMNAS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Fuentes / Procedencia */}
        <div className="p-4 sm:p-5 rounded-[22px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Globe size={14} className="text-accent" />
            <span>Principales Fuentes de Tráfico (Referrers)</span>
          </h3>
          {stats.topReferrers.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-tertiary">
              No hay suficientes datos de procedencia aún.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topReferrers.slice(0, 5).map((r, idx) => {
                const percent = stats.totalVisits > 0 ? Math.round((r.count / stats.totalVisits) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-bold text-text-primary truncate">
                        {getReferrerIcon(r.type, r.host)}
                        <span className="truncate">{r.host}</span>
                      </span>
                      <span className="text-[11px] font-semibold text-text-secondary shrink-0">
                        {r.count} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                      <div style={{ width: `${percent}%` }} className="bg-accent h-full rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Artículos Más Leídos */}
        <div className="p-4 sm:p-5 rounded-[22px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-text-secondary flex items-center gap-2">
            <Eye size={14} className="text-sky-500" />
            <span>Artículos Más Visitados en el Tracker</span>
          </h3>
          {stats.topArticles.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-tertiary">
              No hay lecturas de artículos registradas todavía.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topArticles.slice(0, 5).map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors group cursor-pointer"
                  onClick={() => window.open(`/noticias/${a.slug}`, '_blank')}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-text-secondary shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-text-primary truncate group-hover:text-accent transition-colors">
                      {a.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent shrink-0">
                    {a.count} lecturas
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BARRA DE FILTROS & BÚSQUEDA */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por noticia, IP, ciudad, usuario, navegador..."
              className="w-full pl-9 pr-8 py-2.5 rounded-full text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 text-text-primary placeholder:text-text-tertiary"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Selector de periodo temporal */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 shrink-0">
            {[
              { id: 'today', label: 'Hoy' },
              { id: '7d', label: '7 días' },
              { id: '30d', label: '30 días' },
              { id: 'all', label: 'Histórico' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  periodFilter === p.id
                    ? 'bg-accent text-accent-contrast shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros de modo (Tipo de tráfico) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'Todas las visitas' },
            { id: 'real', label: 'Solo Tráfico Real' },
            { id: 'articles', label: 'Solo Artículos' },
            { id: 'catalog', label: 'Solo Catálogo (/noticias)' },
            { id: 'test', label: 'Solo Pruebas' }
          ].map(m => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModeFilter(m.id)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap active:scale-95 ${
                modeFilter === m.id
                  ? 'bg-black/80 dark:bg-white/80 text-white dark:text-black shadow-sm'
                  : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10'
              }`}
            >
              {m.label}
            </button>
          ))}
          <span className="text-[11px] text-text-tertiary ml-auto whitespace-nowrap pl-2">
            {filteredVisits.length} resultados
          </span>
        </div>
      </div>

      {/* FEED EN VIVO DE VISITAS (RESPONSIVE: CARDS EN MÓVIL, TABLA EN DESKTOP) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-xs text-text-tertiary">Recuperando registros del sniffer...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="py-12 px-4 rounded-[24px] bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto">
              <Zap size={22} />
            </div>
            <h4 className="text-base font-bold text-text-primary">El rastreador está activo y esperando visitas</h4>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Actualmente no hay visitas que coincidan con los filtros. Puedes pulsar en el botón de abajo para lanzar un <strong>ping de prueba</strong> y comprobar que la telemetría, detección de dispositivo y geolocalización funcionan de inmediato.
            </p>
            <button
              type="button"
              onClick={handleTestPing}
              disabled={isTestPinging}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-accent text-accent-contrast shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isTestPinging ? <Spinner size="small" /> : <Zap size={14} />}
              <span>Lanzar Ping de Diagnóstico Ahora</span>
            </button>
          </div>
        ) : (
          <>
            {/* VISTA MÓVIL (< 768px): TARJETAS TÁCTILES RICAS */}
            <div className="block md:hidden space-y-3">
              {filteredVisits.map((v) => {
                const isExpanded = expandedMobileIds.has(v.id);
                const isRecent = v.created_at && (Date.now() - new Date(v.created_at).getTime() < 5 * 60 * 1000);

                return (
                  <div
                    key={v.id}
                    className={`p-4 rounded-[20px] bg-black/[0.03] dark:bg-white/[0.03] border transition-all ${
                      v.is_test
                        ? 'border-purple-500/30 bg-purple-500/[0.02]'
                        : isRecent
                          ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                          : 'border-black/10 dark:border-white/10'
                    }`}
                  >
                    {/* Fila superior: Momento & Badges */}
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-2">
                      <div className="flex items-center gap-1.5 text-text-tertiary">
                        <Clock size={12} />
                        <span>
                          {v.created_at
                            ? formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: es })
                            : 'Reciente'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isRecent && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-500 uppercase tracking-wider animate-pulse">
                            En vivo
                          </span>
                        )}
                        {v.is_test && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-400 uppercase tracking-wider">
                            🧪 Prueba
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Noticia / Página */}
                    <div className="mb-2">
                      {v.article_slug ? (
                        <a
                          href={`/noticias/${v.article_slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sm text-text-primary hover:text-accent flex items-center gap-1.5 transition-colors group"
                        >
                          <span className="line-clamp-2">{v.article_title || v.article_slug}</span>
                          <ExternalLink size={12} className="shrink-0 text-text-tertiary group-hover:text-accent" />
                        </a>
                      ) : (
                        <span className="font-bold text-sm text-text-primary flex items-center gap-1.5">
                          <span>Catálogo General (/noticias)</span>
                        </span>
                      )}
                    </div>

                    {/* Fila de usuario / visitante */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-black/5 dark:border-white/5">
                      <span className="text-text-tertiary">Visitante:</span>
                      {v.user ? (
                        <span className="font-bold text-accent flex items-center gap-1.5">
                          {v.user.profile_image ? (
                            <img src={v.user.profile_image} alt="" className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <Users size={12} />
                          )}
                          <span className="truncate max-w-[150px]">{v.user.name || v.user.username}</span>
                        </span>
                      ) : (
                        <span className="text-text-secondary font-mono text-[11px] truncate max-w-[160px]">
                          👤 {v.visitor_id ? v.visitor_id.substring(0, 14) : 'Anónimo'}
                        </span>
                      )}
                    </div>

                    {/* Fila de Procedencia (Referrer) */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-black/5 dark:border-white/5">
                      <span className="text-text-tertiary">Procedencia:</span>
                      <span className="font-bold text-text-primary flex items-center gap-1.5 truncate max-w-[180px]">
                        {getReferrerIcon(v.referrer_type, v.referrer_host)}
                        <span className="truncate">{v.referrer_host || 'Directo'}</span>
                      </span>
                    </div>

                    {/* Fila de Dispositivo & Ubicación */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-black/5 dark:border-white/5">
                      <span className="text-text-tertiary">Dispositivo:</span>
                      <span className="flex items-center gap-1 font-semibold text-text-secondary text-[11px]">
                        {getDeviceIcon(v.device_type)}
                        <span>{v.os || 'SO'}</span>
                        <span>•</span>
                        <span>{v.browser || 'Navegador'}</span>
                      </span>
                    </div>

                    {/* Ubicación & IP */}
                    <div className="flex items-center justify-between text-xs py-1.5 border-t border-black/5 dark:border-white/5">
                      <span className="text-text-tertiary">Ubicación:</span>
                      <span className="flex items-center gap-1 font-semibold text-text-secondary text-[11px]">
                        <span>{getCountryFlagEmoji(v.country)}</span>
                        <span>{v.city ? `${v.city}, ` : ''}{v.country || 'ES'}</span>
                        <span className="font-mono text-[10px] text-text-tertiary">({v.ip_address || 'IP'})</span>
                      </span>
                    </div>

                    {/* Botón expandir detalles técnicos de sniffing */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleMobileExpand(v.id)}
                        className="w-full py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[11px] font-bold text-text-secondary flex items-center justify-center gap-1 transition-colors"
                      >
                        <Terminal size={12} />
                        <span>{isExpanded ? 'Ocultar telemetría' : 'Ver datos de sniffing'}</span>
                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 rounded-xl bg-black/10 dark:bg-black/30 font-mono text-[10px] space-y-1.5 text-text-secondary break-all">
                          <div><strong>IP:</strong> {v.ip_address || 'N/A'}</div>
                          <div><strong>Pantalla:</strong> {v.screen_resolution || 'N/A'}</div>
                          <div><strong>Idioma:</strong> {v.language || 'N/A'}</div>
                          <div><strong>Referrer URL:</strong> {v.referrer || 'Acceso directo (sin referrer)'}</div>
                          {v.utm_source && (
                            <div><strong>Campaña UTM:</strong> {v.utm_source} / {v.utm_medium}</div>
                          )}
                          <div><strong>Visitor ID:</strong> {v.visitor_id}</div>
                          <div><strong>User Agent:</strong> {v.user_agent || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* VISTA DESKTOP / TABLET (>= 768px): TABLA GLASS COMPACTA Y MODERNA */}
            <div className="hidden md:block overflow-x-auto rounded-[24px] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-text-tertiary uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3.5 px-4">Momento</th>
                    <th className="py-3.5 px-4">Lector / IP</th>
                    <th className="py-3.5 px-4">Noticia / Página</th>
                    <th className="py-3.5 px-4">Procedencia</th>
                    <th className="py-3.5 px-4">Dispositivo</th>
                    <th className="py-3.5 px-4">Ubicación</th>
                    <th className="py-3.5 px-4 text-right">Sniffing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {filteredVisits.map((v) => {
                    const isRecent = v.created_at && (Date.now() - new Date(v.created_at).getTime() < 5 * 60 * 1000);

                    return (
                      <tr
                        key={v.id}
                        className={`hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors ${
                          v.is_test ? 'bg-purple-500/[0.02]' : ''
                        }`}
                      >
                        {/* Momento */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {isRecent && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            )}
                            {v.is_test && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-500/20 text-purple-400">
                                TEST
                              </span>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-text-primary text-[11px]">
                                {v.created_at
                                  ? formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: es })
                                  : 'Reciente'}
                              </span>
                              <span className="text-[10px] text-text-tertiary">
                                {v.created_at ? format(new Date(v.created_at), 'HH:mm:ss • dd/MM') : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Lector / Usuario / IP */}
                        <td className="py-3 px-4">
                          {v.user ? (
                            <div className="flex items-center gap-2">
                              {v.user.profile_image ? (
                                <img src={v.user.profile_image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {v.user.name ? v.user.name[0] : 'U'}
                                </div>
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-accent truncate text-xs">
                                  {v.user.name || v.user.username}
                                </span>
                                <span className="font-mono text-[10px] text-text-tertiary">
                                  {v.ip_address || 'IP'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-semibold text-text-secondary text-xs">
                                Visitante Invitado
                              </span>
                              <span className="font-mono text-[10px] text-text-tertiary truncate max-w-[120px]">
                                {v.ip_address || (v.visitor_id ? v.visitor_id.substring(0, 10) : 'Anónimo')}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Noticia / Página */}
                        <td className="py-3 px-4 max-w-[240px]">
                          {v.article_slug ? (
                            <a
                              href={`/noticias/${v.article_slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-text-primary hover:text-accent transition-colors block truncate"
                              title={v.article_title || v.article_slug}
                            >
                              {v.article_title || v.article_slug}
                            </a>
                          ) : (
                            <span className="font-bold text-text-secondary text-[11px]">
                              Catálogo /noticias
                            </span>
                          )}
                        </td>

                        {/* Procedencia (Referrer) */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-bold text-text-primary text-xs">
                            {getReferrerIcon(v.referrer_type, v.referrer_host)}
                            <span className="truncate max-w-[120px]">{v.referrer_host || 'Directo'}</span>
                          </div>
                        </td>

                        {/* Dispositivo & Navegador */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-text-secondary text-xs">
                            {getDeviceIcon(v.device_type)}
                            <span>{v.os || 'SO'}</span>
                            <span className="text-text-tertiary">•</span>
                            <span className="text-[11px]">{v.browser || 'Navegador'}</span>
                          </div>
                        </td>

                        {/* Ubicación */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-text-secondary text-xs">
                            <span className="text-sm">{getCountryFlagEmoji(v.country)}</span>
                            <span>{v.city ? `${v.city}, ` : ''}{v.country || 'ES'}</span>
                          </div>
                        </td>

                        {/* Acción / Ver Sniffing */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectedVisit(v)}
                            className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-accent active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Ver reporte completo de telemetría"
                          >
                            <Terminal size={13} />
                            <span>Inspeccionar</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE INSPECCIÓN TÉCNICA PROFUNDA (SNIFFING DETAILS) */}
      {inspectedVisit && (
        <div
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setInspectedVisit(null)}
        >
          <div
            className="w-full max-w-xl bg-card rounded-[28px] border border-black/10 dark:border-white/10 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-[scale-in_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Terminal className="text-accent" size={20} />
                <h3 className="text-base font-black text-text-primary tracking-tight">
                  Telemetría & Sniffing de Visita #{inspectedVisit.id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedVisit(null)}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Grid de campos técnicos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Dirección IP</span>
                <span className="text-text-primary font-bold">{inspectedVisit.ip_address || 'Desconocida'}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Ubicación GeoIP</span>
                <span className="text-text-primary font-bold">
                  {getCountryFlagEmoji(inspectedVisit.country)} {inspectedVisit.city ? `${inspectedVisit.city}, ` : ''}{inspectedVisit.country || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Dispositivo & SO</span>
                <span className="text-text-primary font-bold capitalize">
                  {inspectedVisit.device_type} • {inspectedVisit.os || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Navegador</span>
                <span className="text-text-primary font-bold">{inspectedVisit.browser || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Resolución de Pantalla</span>
                <span className="text-text-primary font-bold">{inspectedVisit.screen_resolution || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Idioma del Navegador</span>
                <span className="text-text-primary font-bold">{inspectedVisit.language || 'N/A'}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 sm:col-span-2">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Procedencia / Referrer</span>
                <span className="text-text-primary font-bold break-all">
                  {inspectedVisit.referrer || 'Acceso Directo (sin página anterior / marcador)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 sm:col-span-2">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Página Solicitada</span>
                <span className="text-text-primary font-bold break-all">
                  {inspectedVisit.page_path}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 sm:col-span-2">
                <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">User-Agent Completo</span>
                <span className="text-[11px] text-text-secondary break-all">
                  {inspectedVisit.user_agent || 'N/A'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold">Fingerprint Visitor ID</span>
                  <span className="text-text-secondary text-[11px]">{inspectedVisit.visitor_id}</span>
                </div>
                {inspectedVisit.is_test && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-400">
                    VISITA DE PRUEBA
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectedVisit(null)}
                className="px-5 py-2.5 rounded-full text-xs font-bold bg-accent text-accent-contrast active:scale-95 transition-all"
              >
                Cerrar Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
