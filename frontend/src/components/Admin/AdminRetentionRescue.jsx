/* frontend/src/components/Admin/AdminRetentionRescue.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Clock,
  Send,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  X,
  Dumbbell,
  Flame,
  Bell,
  Mail,
  Sparkles,
  UserCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import UserAvatar from '../UserAvatar';
import Spinner from '../Spinner';
import {
  getRetentionRescueDashboard,
  triggerRetentionRescue,
} from '../../services/adminService';
import { useToast } from '../../hooks/useToast';

const ITEMS_PER_PAGE = 15;

const SEGMENT_META = {
  has_workout_pr: {
    label: 'Con 1+ entreno (Marca base)',
    badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: Dumbbell,
  },
  routine_ready: {
    label: 'Rutina lista sin entrenar',
    badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    icon: Flame,
  },
  nutrition_only: {
    label: 'Solo nutrición registrada',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: Sparkles,
  },
  no_setup: {
    label: 'Sin rutina ni entreno',
    badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: Clock,
  },
};

const formatInactiveDuration = (hours) => {
  const h = Math.max(0, Math.round(Number(hours) || 0));
  if (h < 24) return `${h}h sin actividad`;
  const days = Math.floor(h / 24);
  const remHours = h % 24;
  if (days < 30) {
    return remHours > 0 ? `${days}d ${remHours}h (${h}h)` : `${days} días (${h}h)`;
  }
  const months = Math.floor(days / 30);
  const remDays = days % 30;
  return remDays > 0 ? `${months}m ${remDays}d (${days} días)` : `${months} meses (${days} días)`;
};

const formatExactDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return format(d, "dd/MM/yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return '—';
  }
};

const formatDateTimeInTimezone = (iso, timezone) => {
  if (!iso) return 'pendiente de la siguiente ventana diurna';
  try {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: timezone || 'Europe/Madrid',
    }).format(new Date(iso));
  } catch {
    return formatExactDateTime(iso);
  }
};

const formatRelative = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch {
    return '';
  }
};

const ChannelStatusBadge = ({ label, status, errorText, Icon }) => {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
        <Icon size={12} />
        <span>{label}: Correcto</span>
      </span>
    );
  }
  if (status === 'no_subscription' || status === 'skipped') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-black/5 dark:bg-white/5 text-text-muted border border-black/5 dark:border-white/10">
        <Icon size={12} />
        <span>{label}: {status === 'no_subscription' ? 'Sin Push activo' : 'Omitido'}</span>
      </span>
    );
  }
  return (
    <span
      title={errorText || 'Error en el envío'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-red-500/15 text-red-500 border border-red-500/30"
    >
      <XCircle size={12} />
      <span>{label}: Error</span>
    </span>
  );
};

export default function AdminRetentionRescue() {
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingBatch, setIsSendingBatch] = useState(false);
  const [sendingUserId, setSendingUserId] = useState(null);

  const [subTab, setSubTab] = useState('inactive'); // 'inactive' | 'history' | 'upcoming'
  const [cohortFilter, setCohortFilter] = useState('pending'); // 'all' | 'pending' | 'sent' | 'early_14d' | 'veteran'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'success' | 'error' | 'recovered'
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const fetchDashboard = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await getRetentionRescueDashboard();
      setData(res);
    } catch (err) {
      showToast('Error al cargar el panel de retención 72h', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    setPage(1);
  }, [subTab, cohortFilter, historyFilter, searchQuery]);

  const handleSendSingleUser = async (userId, username) => {
    if (sendingUserId || isSendingBatch) return;
    setSendingUserId(userId);
    try {
      const res = await triggerRetentionRescue({ userId, limit: 1 });
      if (res?.overview) setData(res.overview);
      showToast(`Rescate personalizado enviado a ${username}`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al enviar rescate al usuario', 'error');
    } finally {
      setSendingUserId(null);
    }
  };

  const handleSendBatch = async (onlyEarlyCohort = false) => {
    if (isSendingBatch || sendingUserId) return;
    setIsSendingBatch(true);
    try {
      const res = await triggerRetentionRescue({
        limit: 15,
        onlyEarlyCohort,
      });
      if (res?.overview) setData(res.overview);
      const count = res?.processedCount || 0;
      if (count > 0) {
        showToast(`Se enviaron ${count} rescates personalizados con éxito`, 'success');
      } else {
        showToast('No había usuarios pendientes para enviar en este lote', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Error al procesar lote de rescate', 'error');
    } finally {
      setIsSendingBatch(false);
    }
  };

  const summary = data?.summary || {
    totalInactive72h: 0,
    pendingToRescueCount: 0,
    earlyCohortPendingCount: 0,
    upcomingCount: 0,
    totalSentCount: 0,
    successSentCount: 0,
    errorSentCount: 0,
    recoveredCount: 0,
  };

  const filteredInactive = useMemo(() => {
    const list = Array.isArray(data?.eligibleInactiveUsers) ? data.eligibleInactiveUsers : [];
    const q = searchQuery.trim().toLowerCase();

    return list.filter((u) => {
      if (cohortFilter === 'pending' && u.alreadyRescuedInCurrentCycle) return false;
      if (cohortFilter === 'sent' && !u.alreadyRescuedInCurrentCycle) return false;
      if (cohortFilter === 'early_14d' && !u.isEarlyCohort) return false;
      if (cohortFilter === 'veteran' && u.isEarlyCohort) return false;

      if (q) {
        const matchName = (u.username || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchContext = (u.contextLabel || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchContext) return false;
      }
      return true;
    });
  }, [data?.eligibleInactiveUsers, cohortFilter, searchQuery]);

  const filteredHistory = useMemo(() => {
    const list = Array.isArray(data?.historyLogs) ? data.historyLogs : [];
    const q = searchQuery.trim().toLowerCase();

    return list.filter((log) => {
      if (historyFilter === 'success' && log.overall_status !== 'success') return false;
      if (
        historyFilter === 'error' &&
        log.overall_status !== 'error' &&
        log.email_status !== 'error' &&
        log.push_status !== 'error'
      ) {
        return false;
      }
      if (historyFilter === 'recovered' && !log.recovered) return false;

      if (q) {
        const uName = (log.user?.username || log.user?.name || '').toLowerCase();
        const uEmail = (log.user?.email || '').toLowerCase();
        const msg = (log.message || '').toLowerCase();
        const title = (log.title || '').toLowerCase();
        if (!uName.includes(q) && !uEmail.includes(q) && !msg.includes(q) && !title.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [data?.historyLogs, historyFilter, searchQuery]);

  const filteredUpcoming = useMemo(() => {
    const list = Array.isArray(data?.upcomingUsers) ? data.upcomingUsers : [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const matchName = (u.username || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchContext = (u.contextLabel || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchContext;
    });
  }, [data?.upcomingUsers, searchQuery]);

  const activeList =
    subTab === 'inactive'
      ? filteredInactive
      : subTab === 'history'
      ? filteredHistory
      : filteredUpcoming;

  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE));
  const paginatedItems = activeList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-6 rounded-[28px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="hidden p-2.5 rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0 md:block">
              <Bell size={20} />
            </div>
            <h2 className="hidden text-lg sm:text-2xl font-black text-text-primary tracking-tight md:block">
              Rescate de Inactividad (Día 3 · +72h)
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              Cron Activo (Cada hora · min 25)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-3xl">
            Detecta automáticamente a usuarios que llevan <strong>72 horas o más</strong> sin actividad (tanto recién registrados &lt;14 días como cuentas veteranas que llevan días o meses sin entrar) y les envía un Push, aviso In-App y Correo personalizado con su rutina lista o su mejor marca en kilos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchDashboard(false)}
            disabled={isLoading || isSendingBatch}
            className="p-3 rounded-2xl bg-bg-primary text-text-secondary hover:text-accent ring-1 ring-black/5 dark:ring-white/10 transition-all active:scale-95 cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-accent' : ''} />
          </button>

          {summary.earlyCohortPendingCount > 0 && (
            <button
              type="button"
              onClick={() => handleSendBatch(true)}
              disabled={isSendingBatch || isLoading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 font-extrabold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSendingBatch ? <Spinner size={15} /> : <Flame size={16} />}
              <span>Rescatar Nuevos &lt;14d ({summary.earlyCohortPendingCount})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSendBatch(false)}
            disabled={isSendingBatch || isLoading || summary.pendingToRescueCount === 0}
            className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl bg-accent text-accent-contrast font-extrabold text-xs sm:text-sm shadow-lg shadow-accent/20 hover:brightness-110 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isSendingBatch ? <Spinner size={15} /> : <Send size={15} />}
            <span>Enviar Lote Pendiente ({Math.min(15, summary.pendingToRescueCount)})</span>
          </button>
        </div>
      </div>

      {/* Tarjetas Bento de Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => {
            setSubTab('inactive');
            setCohortFilter('pending');
          }}
          className="cursor-pointer bg-amber-500/5 hover:bg-amber-500/10 transition-colors rounded-3xl p-4 sm:p-5 ring-1 ring-amber-500/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-amber-500 uppercase tracking-wider">
              Inactivos +72h Pendientes
            </span>
            <Clock size={18} className="text-amber-500 shrink-0" />
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-text-primary">
              {summary.pendingToRescueCount}
            </span>
            <p className="text-[11px] font-semibold text-text-secondary mt-1">
              {summary.totalInactive72h} totales (+72h) · {summary.earlyCohortPendingCount} nuevos (&lt;14d)
            </p>
          </div>
        </div>

        <div
          onClick={() => setSubTab('upcoming')}
          className="cursor-pointer bg-blue-500/5 hover:bg-blue-500/10 transition-colors rounded-3xl p-4 sm:p-5 ring-1 ring-blue-500/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-blue-400 uppercase tracking-wider">
              Próximos (&lt;72h)
            </span>
            <Calendar size={18} className="text-blue-400 shrink-0" />
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-text-primary">
              {summary.upcomingCount}
            </span>
            <p className="text-[11px] font-semibold text-text-secondary mt-1">
              Entre 12h y 71h sin actividad (en cuenta atrás)
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('history');
            setHistoryFilter('all');
          }}
          className="cursor-pointer bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors rounded-3xl p-4 sm:p-5 ring-1 ring-emerald-500/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-emerald-500 uppercase tracking-wider">
              Rescates Enviados
            </span>
            <CheckCircle size={18} className="text-emerald-500 shrink-0" />
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-text-primary">
              {summary.totalSentCount}
            </span>
            <p className="text-[11px] font-semibold text-emerald-500 mt-1">
              {summary.successSentCount} correctos · {summary.recoveredCount} usuarios recuperados
            </p>
          </div>
        </div>

        <div
          onClick={() => {
            setSubTab('history');
            setHistoryFilter('error');
          }}
          className="cursor-pointer bg-red-500/5 hover:bg-red-500/10 transition-colors rounded-3xl p-4 sm:p-5 ring-1 ring-red-500/25 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-extrabold text-red-500 uppercase tracking-wider">
              Envíos con Error
            </span>
            <AlertTriangle size={18} className="text-red-500 shrink-0" />
          </div>
          <div>
            <span className="text-3xl sm:text-4xl font-black text-text-primary">
              {summary.errorSentCount}
            </span>
            <p className="text-[11px] font-semibold text-text-secondary mt-1">
              Fallos de SMTP o suscripción Push caducada
            </p>
          </div>
        </div>
      </div>

      {/* Banner Informativo sobre la programación de envíos */}
      <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3 text-xs text-text-secondary leading-relaxed">
        <Clock size={16} className="text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-text-primary block mb-0.5">¿Cuándo se envían los avisos y los correos?</span>
          Al cumplir 72 horas, el sistema intenta el siguiente pase automático del cron: <strong>cada hora en el minuto :25</strong>, solo en los pases de <strong>11:25 a 20:25 según la zona horaria de cada usuario</strong>, con un máximo de 15 usuarios por pase. La fecha de cada persona aparece en su ficha como estimación de la siguiente ventana; si hay más de 15 pendientes, puede retrasarse a pases posteriores. El correo de retención solo se manda si esa persona activó <strong>Recordatorios y novedades por correo</strong>. Si no, se omite el correo y pueden seguir enviándose el aviso dentro de la app y el Push. Los botones de envío manual adelantan el rescate inmediatamente.
        </div>
      </div>

      {/* Selector de Sub-pestañas Deslizable + Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/5 dark:bg-white/5 p-3 sm:p-4 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex overflow-x-auto no-scrollbar items-center gap-2 py-0.5 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setSubTab('inactive')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
              subTab === 'inactive'
                ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
                : 'bg-bg-primary/70 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Clock size={15} />
            <span>Inactivos +72h ({summary.totalInactive72h})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
              subTab === 'history'
                ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
                : 'bg-bg-primary/70 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Send size={15} />
            <span>Historial de Envíos ({summary.totalSentCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('upcoming')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
              subTab === 'upcoming'
                ? 'bg-accent text-accent-contrast shadow-md shadow-accent/20'
                : 'bg-bg-primary/70 text-text-secondary hover:text-text-primary'
            }`}
          >
            <Calendar size={15} />
            <span>Próximos en Cumplir Margen ({summary.upcomingCount})</span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-72">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar usuario, email, rutina..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 text-xs sm:text-sm font-bold text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Sub-filtros contextuales según la pestaña */}
      {subTab === 'inactive' && (
        <div className="flex overflow-x-auto no-scrollbar items-center gap-2 py-1 -mx-1 px-1">
          {[
            { id: 'pending', label: `Pendientes de envío (${summary.pendingToRescueCount})` },
            { id: 'all', label: `Todos +72h (${summary.totalInactive72h})` },
            { id: 'early_14d', label: 'Recién registrados (<14 días)' },
            { id: 'veteran', label: 'Veteranos (>14 días / meses)' },
            { id: 'sent', label: 'Ya avisados en este ciclo' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setCohortFilter(f.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer border ${
                cohortFilter === f.id
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-black/5 dark:bg-white/5 text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {subTab === 'history' && (
        <div className="flex overflow-x-auto no-scrollbar items-center gap-2 py-1 -mx-1 px-1">
          {[
            { id: 'all', label: `Todos los envíos (${summary.totalSentCount})` },
            { id: 'success', label: `Correctos (${summary.successSentCount})` },
            { id: 'error', label: `Con errores (${summary.errorSentCount})` },
            { id: 'recovered', label: `Usuarios recuperados (${summary.recoveredCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setHistoryFilter(f.id)}
              className={`px-3.5 py-2 rounded-full text-xs font-extrabold whitespace-nowrap flex-shrink-0 transition-all cursor-pointer border ${
                historyFilter === f.id
                  ? 'bg-accent/15 text-accent border-accent/40'
                  : 'bg-black/5 dark:bg-white/5 text-text-secondary border-transparent hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenido Principal */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size={32} />
        </div>
      ) : paginatedItems.length === 0 ? (
        <div className="text-center py-14 px-4 rounded-[28px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <Clock size={36} className="mx-auto text-text-muted mb-3 opacity-60" />
          <p className="text-base sm:text-lg font-extrabold text-text-primary">
            {subTab === 'inactive'
              ? 'No hay usuarios inactivos (+72h) con este filtro'
              : subTab === 'history'
              ? 'Aún no hay envíos registrados con este filtro'
              : 'No hay usuarios próximos a cumplir las 72h en este momento'}
          </p>
          <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md mx-auto">
            {subTab === 'history'
              ? 'Puedes pulsar "Enviar Lote Pendiente" arriba o enviar un rescate individual desde la pestaña Inactivos +72h.'
              : 'Prueba a cambiar el filtro superior para consultar otros usuarios.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* VISTA 1: INACTIVOS +72H */}
          {subTab === 'inactive' &&
            paginatedItems.map((u) => {
              const seg = SEGMENT_META[u.segment] || SEGMENT_META.no_setup;
              const SegIcon = seg.icon;
              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-black/[0.07] dark:hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Fila Superior: Usuario + Tiempo Inactivo */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={u} size={10} className="w-10 h-10 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                              {u.username}
                            </p>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                u.isEarlyCohort
                                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                  : 'bg-black/10 dark:bg-white/10 text-text-secondary border-transparent'
                              }`}
                            >
                              {u.isEarlyCohort
                                ? `Nuevo (${u.accountAgeDays}d en app)`
                                : `Veterano (${u.accountAgeDays}d en app)`}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30">
                          <Clock size={12} />
                          <span>{formatInactiveDuration(u.inactiveHours)}</span>
                        </span>

                        {u.alreadyRescuedInCurrentCycle ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                            <CheckCircle size={12} />
                            <span>Avisado {formatRelative(u.lastRescueSentAt)}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-accent/15 text-accent border border-accent/30">
                            <span>Pendiente de envío</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Fila Media: Segmento + Contexto + Canales disponibles */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-extrabold border ${seg.badgeClass}`}
                      >
                        <SegIcon size={12} />
                        <span>{seg.label}</span>
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-bg-primary text-text-primary font-bold ring-1 ring-black/5 dark:ring-white/10">
                        <span>{u.contextLabel}</span>
                      </span>

                      <span className="text-[11px] text-text-muted font-medium">
                        Última actividad: {formatExactDateTime(u.lastActivityAt)}
                      </span>

                      {!u.alreadyRescuedInCurrentCycle && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-bg-primary text-text-secondary ring-1 ring-black/5 dark:ring-white/10">
                          <Mail size={12} />
                          {u.emailMarketingConsent
                            ? `Correo sujeto a validación: ${formatDateTimeInTimezone(u.estimatedAutoSendAt, u.timezone)} (${u.timezone || 'Europe/Madrid'})`
                            : 'Correo omitido: no aceptó recordatorios por email'}
                        </span>
                      )}

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                          u.hasPushSubscription
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-black/5 dark:bg-white/5 text-text-muted'
                        }`}
                      >
                        {u.hasPushSubscription ? `Push activo (${u.pushSubCount})` : 'Sin suscripción push'}
                      </span>
                    </div>

                    {/* Vista previa de la notificación In-App y Push */}
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-bg-primary/90 ring-1 ring-black/5 dark:ring-white/10 space-y-1">
                      <p className="text-[11px] font-semibold text-text-muted">Vista previa In-App / Push</p>
                      <p className="text-xs font-extrabold text-accent">{u.previewTitle}</p>
                      <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed">
                        “{u.previewMessage}”
                      </p>
                    </div>
                  </div>

                  {/* Acción Individual */}
                  <div className="flex sm:flex-row lg:flex-col items-stretch sm:items-center justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendSingleUser(u.id, u.username)}
                      disabled={sendingUserId === u.id || isSendingBatch}
                      className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-accent text-accent-contrast font-extrabold text-xs sm:text-sm shadow-md shadow-accent/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sendingUserId === u.id ? <Spinner size={14} /> : <Send size={14} />}
                      <span>{u.alreadyRescuedInCurrentCycle ? 'Reenviar rescate' : 'Enviar rescate ahora'}</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {/* VISTA 2: HISTORIAL DE ENVÍOS */}
          {subTab === 'history' &&
            paginatedItems.map((log) => {
              const seg = SEGMENT_META[log.segment] || SEGMENT_META.no_setup;
              const SegIcon = seg.icon;
              const userObj = log.user || { username: `Usuario #${log.user_id}`, email: '—' };

              return (
                <div
                  key={log.id}
                  className="p-4 sm:p-5 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar user={userObj} size={10} className="w-10 h-10 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                            {userObj.username || userObj.name || `Usuario #${log.user_id}`}
                          </p>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-text-secondary">
                            {log.trigger_type === 'manual_admin' ? 'Envío Manual' : 'Cron Automático'}
                          </span>
                          {log.recovered && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                              <UserCheck size={12} />
                              <span>¡Recuperado! Volvió {formatRelative(log.latestUserActivityAt)}</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary truncate">{userObj.email}</p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-extrabold text-text-primary">
                        Enviado el {formatExactDateTime(log.sent_at)}
                      </p>
                      <p className="text-[11px] font-semibold text-text-muted">
                        {formatRelative(log.sent_at)} · Llevaba {formatInactiveDuration(log.inactive_hours)}
                      </p>
                    </div>
                  </div>

                  {/* Contenido registrado para In-App y Push */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-bg-primary/90 ring-1 ring-black/5 dark:ring-white/10 space-y-1">
                    <p className="text-[11px] font-semibold text-text-muted">Mensaje In-App / Push</p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-extrabold text-accent">{log.title}</p>
                      {log.context_label && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${seg.badgeClass}`}
                        >
                          <SegIcon size={11} />
                          <span>{log.context_label}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed">
                      “{log.message}”
                    </p>
                  </div>

                  {/* Estado por Canal y Errores si los hubo */}
                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    <ChannelStatusBadge
                      label="Correo"
                      status={log.email_status}
                      errorText={log.email_error}
                      Icon={Mail}
                    />
                    <ChannelStatusBadge
                      label="Push"
                      status={log.push_status}
                      errorText={log.push_error}
                      Icon={Bell}
                    />
                    <ChannelStatusBadge
                      label="In-App"
                      status={log.in_app_status}
                      errorText={null}
                      Icon={CheckCircle}
                    />
                  </div>

                  {(log.email_error || log.push_error) && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400 space-y-1">
                      {log.email_error && (
                        <p>
                          <strong>Detalle error Email:</strong> {log.email_error}
                        </p>
                      )}
                      {log.push_error && (
                        <p>
                          <strong>Detalle error Push:</strong> {log.push_error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* VISTA 3: PRÓXIMOS EN CUMPLIR EL MARGEN (<72H) */}
          {subTab === 'upcoming' &&
            paginatedItems.map((u) => {
              const seg = SEGMENT_META[u.segment] || SEGMENT_META.no_setup;
              const SegIcon = seg.icon;
              return (
                <div
                  key={u.id}
                  className="p-4 sm:p-5 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar user={u} size={10} className="w-10 h-10 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm sm:text-base font-extrabold text-text-primary truncate">
                              {u.username}
                            </p>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                u.isEarlyCohort
                                  ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                  : 'bg-black/10 dark:bg-white/10 text-text-secondary border-transparent'
                              }`}
                            >
                              {u.isEarlyCohort ? `Nuevo (${u.accountAgeDays}d)` : `Veterano (${u.accountAgeDays}d)`}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary truncate">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:items-end">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-400 border border-blue-500/30">
                          <Clock size={12} />
                          <span>Cumple 72h en {u.hoursRemaining}h (lleva {u.inactiveHours}h)</span>
                        </span>
                        <span className="text-[11px] font-semibold text-text-muted mt-1">
                          Siguiente aviso automático: {' '}
                          {formatDateTimeInTimezone(u.estimatedAutoSendAt, u.timezone)} ({u.timezone || 'Europe/Madrid'})
                        </span>
                        {!u.emailMarketingConsent && (
                          <span className="text-[11px] font-semibold text-amber-500 mt-1 block">
                            Correo omitido sin consentimiento; el aviso In-App/Push sí puede enviarse.
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso hacia las 72h */}
                    <div className="w-full space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary">
                        <span>Progreso hacia el umbral de rescate (72h)</span>
                        <span>{u.inactiveHours}h / 72h ({u.progressPercent}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-accent transition-all duration-500"
                          style={{ width: `${u.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Vista Previa de lo que se le enviará al cumplir las 72h */}
                    <div className="p-3 rounded-2xl bg-bg-primary/90 ring-1 ring-black/5 dark:ring-white/10 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-extrabold text-accent">
                          Vista previa In-App / Push: {u.previewTitle}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${seg.badgeClass}`}
                        >
                          <SegIcon size={11} />
                          <span>{u.contextLabel}</span>
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-text-primary leading-relaxed">
                        “{u.previewMessage}”
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSendSingleUser(u.id, u.username)}
                      disabled={sendingUserId === u.id || isSendingBatch}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-accent-contrast text-text-primary font-extrabold text-xs transition-all active:scale-95 cursor-pointer ring-1 ring-black/5 dark:ring-white/10 disabled:opacity-50"
                    >
                      {sendingUserId === u.id ? <Spinner size={14} /> : <Send size={14} />}
                      <span>Adelantar envío</span>
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary disabled:opacity-30 hover:bg-accent hover:text-accent-contrast transition-all cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs sm:text-sm font-extrabold text-text-secondary">
            Página <span className="text-accent">{page}</span> de {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary disabled:opacity-30 hover:bg-accent hover:text-accent-contrast transition-all cursor-pointer"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
