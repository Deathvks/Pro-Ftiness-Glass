/* frontend/src/components/Admin/AdminNewsTracker.jsx */
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Users,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Info,
  Zap,
  Terminal,
  FlaskConical,
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
import ModalPortal from '../ModalPortal';
import useModalLock from '../../hooks/useModalLock';
import CustomSelect from '../CustomSelect';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('newest');
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });

  // Modal de inspección técnica profunda
  const [inspectedVisit, setInspectedVisit] = useState(null);

  // Bloquear el scroll de fondo en móvil mientras el modal de inspección esté abierto
  useModalLock(Boolean(inspectedVisit));

  const autoRefreshTimerRef = useRef(null);
  const requestSequenceRef = useRef(0);

  const loadAnalytics = useCallback(async (showLoader = false) => {
    const requestId = ++requestSequenceRef.current;
    if (showLoader) setIsLoading(true);
    try {
      const data = await newsService.fetchNewsAnalytics({
        period: periodFilter,
        mode: modeFilter,
        page,
        pageSize,
        sort,
        search: searchQuery,
      });
      if (requestId !== requestSequenceRef.current) return;
      if (data?.stats) {
        setStats(data.stats);
      }
      if (Array.isArray(data?.visits)) {
        setVisits(data.visits);
      }
      if (data?.pagination) {
        setPagination(data.pagination);
        const lastPage = Math.max(1, data.pagination.totalPages || 1);
        if (page > lastPage) setPage(lastPage);
      }
    } catch (err) {
      console.warn('Error al cargar analítica de noticias:', err);
    } finally {
      if (requestId === requestSequenceRef.current) setIsLoading(false);
    }
  }, [periodFilter, modeFilter, page, pageSize, sort, searchQuery]);

  // Carga inicial y ante cambio de filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => loadAnalytics(true), 250);
    return () => clearTimeout(timeoutId);
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

  const filteredVisits = visits;
  const totalPages = Math.max(1, pagination.totalPages || 1);
  const resultStart = pagination.total > 0 ? (page - 1) * pageSize + 1 : 0;
  const resultEnd = Math.min(page * pageSize, pagination.total);

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
              <span>Visitas y analítica</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Rastreo activo</span>
            </span>
          </div>
          <p className="text-xs text-text-tertiary">
            Consulta las visitas, su procedencia, el dispositivo y la página que se abrió.
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
            <span>Registrar visita de prueba</span>
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
            Navegadores distintos con ID anónimo
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
            <Compass size={15} className="text-amber-500 shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            {topReferrerItem ? (
              <>
                {getReferrerIcon(topReferrerItem.type, topReferrerItem.host)}
                <span className="text-sm sm:text-base font-black text-text-primary break-words leading-tight line-clamp-2">
                  {topReferrerItem.host}
                </span>
              </>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-text-tertiary">Sin datos aún</span>
            )}
          </div>
          <p className="text-[11px] text-text-tertiary mt-1">
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
            <span>Artículos más visitados</span>
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

      {/* FILTROS, ORDEN Y PAGINACIÓN */}
      <div className="space-y-3 pt-2 p-3 sm:p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/10 dark:border-white/10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
          <label className="col-span-2 lg:col-span-1 relative">
            <span className="sr-only">Buscar visitas</span>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Buscar artículo, visitante, IP..."
              className="w-full h-10 pl-9 pr-8 rounded-xl text-xs bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-accent/40 text-text-primary placeholder:text-text-tertiary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                aria-label="Limpiar búsqueda"
              >
                <X size={13} />
              </button>
            )}
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Periodo</span>
            <CustomSelect
              value={periodFilter}
              onChange={(value) => { setPeriodFilter(value); setPage(1); }}
              options={[
                { value: 'today', label: 'Hoy' },
                { value: '7d', label: 'Últimos 7 días' },
                { value: '30d', label: 'Últimos 30 días' },
                { value: 'all', label: 'Todo el histórico' },
              ]}
              className="w-full z-30"
              triggerClassName="w-full h-10 rounded-xl px-3 text-xs text-text-primary border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Tipo de visita</span>
            <CustomSelect
              value={modeFilter}
              onChange={(value) => { setModeFilter(value); setPage(1); }}
              options={[
                { value: 'all', label: 'Todas' },
                { value: 'real', label: 'Reales' },
                { value: 'articles', label: 'Artículos' },
                { value: 'catalog', label: 'Catálogo' },
                { value: 'test', label: 'Pruebas' },
              ]}
              className="w-full z-20"
              triggerClassName="w-full h-10 rounded-xl px-3 text-xs text-text-primary border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Ordenar por</span>
            <CustomSelect
              value={sort}
              onChange={(value) => { setSort(value); setPage(1); }}
              options={[
                { value: 'newest', label: 'Más recientes' },
                { value: 'oldest', label: 'Más antiguas' },
                { value: 'article', label: 'Artículo A–Z' },
                { value: 'source', label: 'Procedencia A–Z' },
                { value: 'visitor', label: 'ID de visitante A–Z' },
              ]}
              className="w-full z-10"
              triggerClassName="w-full h-10 rounded-xl px-3 text-xs text-text-primary border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">Por página</span>
            <CustomSelect
              value={String(pageSize)}
              onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
              options={[
                { value: '10', label: '10 visitas' },
                { value: '20', label: '20 visitas' },
                { value: '50', label: '50 visitas' },
              ]}
              className="w-full z-[5]"
              triggerClassName="w-full h-10 rounded-xl px-3 text-xs text-text-primary border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
            />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-text-tertiary">
          <span>
            {pagination.total === 0
              ? 'No hay visitas para estos filtros'
              : `Mostrando ${resultStart}–${resultEnd} de ${pagination.total} visitas`}
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setPage(1); }}
              className="text-accent hover:underline font-semibold self-start sm:self-auto"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-text-tertiary">
          <Info size={12} className="mt-0.5 shrink-0" />
          <span>El prefijo <code className="font-mono">vis_</code> identifica un navegador de forma aleatoria para contar visitas repetidas; no es el nombre ni la cuenta del visitante.</span>
        </p>
      </div>

      {/* FEED EN VIVO DE VISITAS (RESPONSIVE: CARDS EN MÓVIL, TABLA EN DESKTOP) */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Spinner size={36} />
            <p className="text-xs text-text-tertiary">Cargando visitas...</p>
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
                const isRecent = v.created_at && (Date.now() - new Date(v.created_at).getTime() < 5 * 60 * 1000);

                return (
                  <div
                    key={v.id}
                    className={`p-3.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03] border transition-all ${
                      v.is_test
                        ? 'border-purple-500/30 bg-purple-500/[0.02]'
                        : isRecent
                          ? 'border-emerald-500/30 bg-emerald-500/[0.02]'
                          : 'border-black/10 dark:border-white/10'
                    }`}
                  >
                    {/* Fila superior: Momento & Badges */}
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-2.5">
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
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-purple-500/20 text-purple-400 uppercase tracking-wider inline-flex items-center gap-1">
                            <FlaskConical size={10} />
                            <span>Prueba</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Noticia / Página */}
                    <div className="mb-3">
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

                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-black/5 dark:border-white/5 pt-2.5 text-[11px]">
                      <div className="min-w-0">
                        <span className="block text-[10px] text-text-tertiary">Visitante</span>
                        {v.user ? (
                          <span className="font-semibold text-accent truncate block">{v.user.name || v.user.username || 'Usuario'}</span>
                        ) : (
                          <span className="flex items-center gap-1 min-w-0" title="ID aleatorio guardado en este navegador para contar visitas repetidas; no es una cuenta ni identifica por sí solo a la persona.">
                            <Info size={12} className="text-text-tertiary shrink-0" />
                            <span className="text-text-secondary shrink-0">Anónimo</span>
                            <code className="font-mono text-[10px] text-text-tertiary truncate">{v.visitor_id || 'sin ID'}</code>
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-text-tertiary">Procedencia</span>
                        <span className="font-semibold text-text-primary flex items-center gap-1 truncate">
                          {getReferrerIcon(v.referrer_type, v.referrer_host)}
                          <span className="truncate">{v.referrer_host || 'Directa'}</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-text-tertiary">Dispositivo</span>
                        <span className="font-semibold text-text-secondary flex items-center gap-1 truncate">
                          {getDeviceIcon(v.device_type)}
                          <span className="truncate">{v.os || v.device_type || 'Desconocido'} · {v.browser || 'Navegador'}</span>
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[10px] text-text-tertiary">Ubicación</span>
                        <span className="font-semibold text-text-secondary truncate block">
                          {getCountryFlagEmoji(v.country)} {v.city ? `${v.city}, ` : ''}{v.country || 'Desconocida'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setInspectedVisit(v)}
                      className="mt-3 w-full py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 text-[11px] font-bold text-text-secondary flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye size={13} />
                      <span>Ver detalles</span>
                    </button>
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
                    <th className="py-3.5 px-4">Visitante / ID</th>
                    <th className="py-3.5 px-4">Noticia / Página</th>
                    <th className="py-3.5 px-4">Procedencia</th>
                    <th className="py-3.5 px-4">Dispositivo</th>
                    <th className="py-3.5 px-4">Ubicación</th>
                    <th className="py-3.5 px-4 text-right">Detalle</th>
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
                              {(v.user.profile_image_url || v.user.profile_image) ? (<img src={v.user.profile_image_url || v.user.profile_image} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
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
                                Visitante anónimo
                              </span>
                              <span className="font-mono text-[10px] text-text-tertiary truncate max-w-[120px]">
                                ID: {v.visitor_id ? v.visitor_id.substring(0, 12) : 'no disponible'}
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

                        {/* Acción / Ver detalle */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setInspectedVisit(v)}
                            className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-accent active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px] font-bold"
                            title="Ver detalles de esta visita"
                          >
                            <Eye size={13} />
                            <span>Ver detalle</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPage(current => Math.max(1, current - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <ChevronLeft size={14} />
                <span>Anterior</span>
              </button>
              <span className="text-xs font-semibold text-text-secondary">Página {page} de {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-xs font-bold text-text-secondary disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
              >
                <span>Siguiente</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detalle técnico de la visita */}
      {inspectedVisit && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-[fade-in_0.2s_ease-out]"
            onClick={() => setInspectedVisit(null)}
          >
            <div
              className="relative w-full max-w-xl bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-3xl border border-glass-border shadow-2xl p-5 sm:p-6 pb-[calc(1.5rem+var(--safe-bottom,16px))] sm:pb-6 space-y-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-[slide-up_0.25s_ease-out] sm:animate-[scale-in_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle para móvil */}
              <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

              {/* Header del Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-glass-border">
                <div className="flex items-center gap-2">
                  <Terminal className="text-accent" size={20} />
                  <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                    Detalle de visita #{inspectedVisit.id}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectedVisit(null)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Grid de campos técnicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Dirección IP</span>
                  <span className="text-text-primary font-bold">{inspectedVisit.ip_address || 'Desconocida'}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Ubicación GeoIP</span>
                  <span className="text-text-primary font-bold">
                    {getCountryFlagEmoji(inspectedVisit.country)} {inspectedVisit.city ? `${inspectedVisit.city}, ` : ''}{inspectedVisit.country || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Dispositivo & SO</span>
                  <span className="text-text-primary font-bold capitalize">
                    {inspectedVisit.device_type} • {inspectedVisit.os || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Navegador</span>
                  <span className="text-text-primary font-bold">{inspectedVisit.browser || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Resolución de Pantalla</span>
                  <span className="text-text-primary font-bold">{inspectedVisit.screen_resolution || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Idioma del Navegador</span>
                  <span className="text-text-primary font-bold">{inspectedVisit.language || 'N/A'}</span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 sm:col-span-2">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Procedencia / Referrer</span>
                  <span className="text-text-primary font-bold break-all">
                    {inspectedVisit.referrer || 'Acceso Directo (sin página anterior / marcador)'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 sm:col-span-2">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">Página Solicitada</span>
                  <span className="text-text-primary font-bold break-all">
                    {inspectedVisit.page_path}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 sm:col-span-2">
                  <span className="text-[10px] text-text-tertiary uppercase block font-bold mb-1">User-Agent Completo</span>
                  <span className="text-[11px] text-text-secondary break-all">
                    {inspectedVisit.user_agent || 'N/A'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-tertiary uppercase block font-bold">ID aleatorio del navegador</span>
                    <span className="text-text-secondary text-[11px] break-all">{inspectedVisit.visitor_id || 'No disponible'}</span>
                    <span className="text-[10px] text-text-tertiary block mt-1">Se guarda en este navegador para contar visitas repetidas; no es una cuenta ni un nombre.</span>
                  </div>
                  {inspectedVisit.is_test && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/20 text-purple-400 inline-flex items-center gap-1">
                      <FlaskConical size={10} />
                      VISITA DE PRUEBA
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInspectedVisit(null)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold bg-accent text-accent-contrast active:scale-95 transition-all shadow-md shadow-accent/20"
                >
                  Cerrar Inspector
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
