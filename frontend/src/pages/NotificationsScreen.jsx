/* frontend/src/pages/NotificationsScreen.jsx */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Spinner from '../components/Spinner';
import { isToday, isYesterday, parseISO } from 'date-fns';
import {
  Bell, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle, AlertCircle,
  Filter, ChevronDown, ChevronRight, Loader2, Smartphone, Globe, Clock, Shield, ChevronLeft,
  UserPlus, Users, Zap, Award, Settings
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import GlassCard from '../components/GlassCard';

// --- Imports de Modales Separados ---
import DeleteNotificationModal from '../components/DeleteNotificationModal';
import DeleteAllNotificationsModal from '../components/DeleteAllNotificationsModal';
import { useLocalNotifications } from '../hooks/useLocalNotifications';

// --- Utilidad para fechas Robustecida ---
const parseDateSafe = (dateStr) => {
  if (!dateStr) return new Date();
  if (typeof dateStr !== 'string') return dateStr;
  let normalized = dateStr.replace(' ', 'T');
  const hasTimeZone = /Z$|[+-]\d{2}(:?\d{2})?$/.test(normalized);
  if (!hasTimeZone) {
    normalized += 'Z';
  }
  return parseISO(normalized);
};

// --- Helpers de Formato Dinámico ---
const formatTimeWithZone = (date, timeZone) => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone
    }).format(date);
  } catch (e) {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }
};

const formatDateFullWithZone = (date, timeZone) => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timeZone
    }).format(date);
  } catch (e) {
    return date.toLocaleString('es-ES');
  }
};

const formatDateShortWithZone = (date, timeZone) => {
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      timeZone: timeZone
    }).format(date);
  } catch (e) {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  }
};

// --- Sub-componente: Switch Toggle ---
const ToggleSwitch = ({ checked, onChange, label, description }) => (
  <div className="flex items-center justify-between py-4 border-b border-glass-border/50 last:border-0">
    <div className="mr-4">
      <p className="text-sm font-bold text-text-primary">{label}</p>
      {description && <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-inner
        ${checked ? 'bg-accent shadow-accent/20' : 'bg-gray-400 dark:bg-gray-600'}
      `}
    >
      <span
        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  </div>
);

// --- Sub-componente: Modal de Configuración ---
const NotificationSettingsModal = ({ onClose, scheduleEngagement, scheduleDaily }) => {
  const [engagement, setEngagement] = useState(() => localStorage.getItem('notif_engagement') !== 'false');
  const [daily, setDaily] = useState(() => localStorage.getItem('notif_daily') !== 'false');

  const handleEngagementChange = async (val) => {
    setEngagement(val);
    localStorage.setItem('notif_engagement', val);
    if (Capacitor.isNativePlatform()) {
      if (val) {
        await scheduleEngagement();
      } else {
        const pending = await LocalNotifications.getPending();
        const ids = pending.notifications.filter(n => n.id >= 2000 && n.id < 2100).map(n => ({ id: n.id }));
        if (ids.length) await LocalNotifications.cancel({ notifications: ids });
      }
    }
  };

  const handleDailyChange = async (val) => {
    setDaily(val);
    localStorage.setItem('notif_daily', val);
    if (Capacitor.isNativePlatform()) {
      if (val) {
        await scheduleDaily();
      } else {
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />
      <GlassCard className="glass w-full max-w-sm p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-text-primary">Configuración</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="bg-black/5 dark:bg-white/5 rounded-[24px] p-5 space-y-1">
          <ToggleSwitch 
            checked={engagement} 
            onChange={handleEngagementChange} 
            label="Motivación Diaria" 
            description="Frases, consejos y recordatorios de hidratación."
          />
          <ToggleSwitch 
            checked={daily} 
            onChange={handleDailyChange} 
            label="Recordatorios Rutinarios" 
            description="Avisos para registrar comidas y login diario."
          />
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-4 bg-black/5 dark:bg-white/5 text-text-primary font-bold rounded-[20px] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          Cerrar
        </button>
      </GlassCard>
    </div>
  );
};

// --- Sub-componente: Modal de Detalles de Login ---
const LoginDetailsModal = ({ notification, onClose, timeZone }) => {
  if (!notification || !notification.data) return null;

  const { ip, userAgent, date } = notification.data;
  const loginDate = date ? parseDateSafe(date) : parseDateSafe(notification.created_at);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={onClose} />
      <GlassCard className="glass w-full max-w-md p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl border-none ring-1 ring-black/5 dark:ring-white/10">

        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center text-accent mb-4 ring-2 ring-accent/30">
            <Shield size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-text-primary">Detalles de Inicio</h3>
          <p className="text-text-secondary text-xs sm:text-sm mt-2">
            Información del dispositivo registrado
          </p>
        </div>

        <div className="space-y-4 bg-black/5 dark:bg-white/5 rounded-[24px] p-5">
          {/* Dispositivo */}
          <div className="flex gap-4 items-center">
            <div className="p-2.5 bg-blue-500/10 rounded-[14px] text-blue-500 shrink-0">
              <Smartphone size={20} />
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dispositivo / Navegador</p>
              <p className="text-sm font-semibold text-text-primary truncate mt-0.5">
                {userAgent || 'Desconocido'}
              </p>
            </div>
          </div>

          {/* IP */}
          <div className="flex gap-4 items-center">
            <div className="p-2.5 bg-purple-500/10 rounded-[14px] text-purple-500 shrink-0">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dirección IP</p>
              <p className="text-sm font-semibold text-text-primary font-mono mt-0.5">
                {ip || 'Desconocida'}
              </p>
            </div>
          </div>

          {/* Fecha */}
          <div className="flex gap-4 items-center">
            <div className="p-2.5 bg-green-500/10 rounded-[14px] text-green-500 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Fecha y Hora</p>
              <p className="text-sm font-semibold text-text-primary mt-0.5">
                {formatDateFullWithZone(loginDate, timeZone)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-4 bg-accent text-bg-primary font-bold rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20"
        >
          Entendido
        </button>
      </GlassCard>
    </div>
  );
};

const NotificationsScreen = ({ setView }) => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    notificationsLoading,
    notificationPage,
    notificationTotalPages,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    clearAllNotifications,
    userProfile
  } = useAppStore();

  const { scheduleEngagementNotifications, scheduleDailyReminders } = useLocalNotifications();

  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Estados para modales
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [deleteAction, setDeleteAction] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  // Determinar zona horaria del usuario con fallback seguro
  const userTimezone = useMemo(() => {
    if (userProfile?.timezone) return userProfile.timezone;
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
    } catch {
      return 'Europe/Madrid';
    }
  }, [userProfile]);

  const isNative = Capacitor.isNativePlatform();

  // Carga inicial
  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markNotificationAsRead(notification.id);

    if (notification.data && (notification.data.ip || notification.data.userAgent)) {
      setSelectedNotification(notification);
      return;
    }

    if (notification.data?.url) {
      const targetUrl = notification.data.url;
      navigate(targetUrl);
      if (setView) {
        const path = targetUrl.startsWith('/') ? targetUrl.slice(1) : targetUrl;
        const viewName = path.split('?')[0];
        setView(viewName);
      }
    }
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || notificationPage >= notificationTotalPages) return;
    setIsLoadingMore(true);
    await fetchNotifications(notificationPage + 1);
    setIsLoadingMore(false);
  };

  // --- Manejadores de Borrado ---
  const requestDeleteAll = () => {
    setDeleteAction({ type: 'all' });
  };

  const requestDeleteOne = (id) => {
    setDeleteAction({ type: 'single', id });
  };

  const confirmDelete = async () => {
    if (!deleteAction) return;

    if (deleteAction.type === 'all') {
      await clearAllNotifications();
    } else if (deleteAction.type === 'single' && deleteAction.id) {
      await removeNotification(deleteAction.id);
    }
    setDeleteAction(null);
  };

  // Filtros
  const filters = [
    { id: 'all', label: 'Todas' },
    { id: 'unread', label: 'No leídas' },
    { id: 'xp', label: 'XP' },
    { id: 'info', label: 'Info' },
    { id: 'success', label: 'Éxito' },
    { id: 'alert', label: 'Alertas' },
  ];

  const filteredList = useMemo(() => {
    return notifications.filter(n => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !n.is_read;
      if (activeFilter === 'xp') {
        const title = n.title?.toLowerCase() || '';
        const message = n.message?.toLowerCase() || '';
        return title.includes('xp') || message.includes('xp') || n.data?.type === 'xp';
      }
      if (activeFilter === 'success') return n.type === 'success';
      if (activeFilter === 'alert') return ['warning', 'alert'].includes(n.type);
      if (activeFilter === 'info') return !['success', 'warning', 'alert'].includes(n.type);
      return true;
    });
  }, [notifications, activeFilter]);

  // Agrupación de fechas
  const groupedNotifications = useMemo(() => {
    const groups = { hoy: [], ayer: [], anterior: [] };

    // Obtenemos la fecha actual en la zona horaria del usuario para comparar correctamente 'Hoy' y 'Ayer'
    filteredList.forEach(n => {
      const date = parseDateSafe(n.created_at);
      if (isToday(date)) groups.hoy.push(n);
      else if (isYesterday(date)) groups.ayer.push(n);
      else groups.anterior.push(n);
    });
    return groups;
  }, [filteredList]);

  const getIcon = (n) => {
    const subType = n.data?.type || n.type;
    if (subType === 'friend_request') return <div className="p-2.5 rounded-[14px] bg-accent/10 text-accent"><UserPlus size={20} /></div>;
    if (subType === 'friend_accept') return <div className="p-2.5 rounded-[14px] bg-green-500/10 text-green-500"><Users size={20} /></div>;
    if (subType === 'xp' || subType === 'level_up') return <div className="p-2.5 rounded-[14px] bg-amber-400/10 text-amber-400"><Zap size={20} fill="currentColor" fillOpacity={0.2} /></div>;
    if (subType === 'badge') return <div className="p-2.5 rounded-[14px] bg-amber-500/10 text-amber-500"><Award size={20} /></div>;

    switch (n.type) {
      case 'success': return <div className="p-2.5 rounded-[14px] bg-green-500/10 text-green-500"><CheckCircle size={20} /></div>;
      case 'warning': return <div className="p-2.5 rounded-[14px] bg-yellow-500/10 text-yellow-500"><AlertTriangle size={20} /></div>;
      case 'alert': return <div className="p-2.5 rounded-[14px] bg-red-500/10 text-red-500"><AlertCircle size={20} /></div>;
      default: return <div className="p-2.5 rounded-[14px] bg-accent/10 text-accent"><Info size={20} /></div>;
    }
  };

  const getTimeDisplay = (dateStr) => {
    const date = parseDateSafe(dateStr);
    if (isToday(date) || isYesterday(date)) {
      return formatTimeWithZone(date, userTimezone);
    }
    return formatDateShortWithZone(date, userTimezone);
  };

  if (notificationsLoading && notifications.length === 0) {
    return <div className="flex justify-center items-center h-full min-h-[50vh]"><Spinner size="large" /></div>;
  }

  const hasNotifications = notifications.length > 0;
  const isListEmpty = filteredList.length === 0;
  const canLoadMore = notificationPage < notificationTotalPages && activeFilter === 'all';

  return (
    <div className="pb-28 md:pb-8 pt-6 px-4 max-w-3xl mx-auto min-h-full relative animate-[fade-in_0.5s_ease-out]">

      {/* Modales */}
      {selectedNotification && (
        <LoginDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
          timeZone={userTimezone}
        />
      )}

      {showSettings && (
        <NotificationSettingsModal 
          onClose={() => setShowSettings(false)}
          scheduleEngagement={scheduleEngagementNotifications}
          scheduleDaily={scheduleDailyReminders}
        />
      )}

      <DeleteNotificationModal
        isOpen={deleteAction?.type === 'single'}
        onClose={() => setDeleteAction(null)}
        onConfirm={confirmDelete}
      />

      <DeleteAllNotificationsModal
        isOpen={deleteAction?.type === 'all'}
        onClose={() => setDeleteAction(null)}
        onConfirm={confirmDelete}
      />

      {/* Botón Volver */}
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center gap-2 text-text-secondary font-bold hover:text-text-primary transition-colors mb-6 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 px-4 py-2 rounded-full w-fit"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      {/* Header */}
      <div className="flex justify-between items-end md:items-center mb-8">

        {/* Encabezado con degradado en PC */}
        <h2 className="hidden md:flex text-3xl font-extrabold items-center gap-3">
          <div className="p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
            <Bell size={24} strokeWidth={2.5} />
          </div>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
            Notificaciones
          </span>
        </h2>

        <div className="md:hidden flex flex-col gap-0.5">
          <span className="text-2xl font-extrabold text-text-primary tracking-tight">
            {unreadCount > 0 ? 'Novedades' : 'Al día'}
          </span>
          <span className="text-xs text-text-secondary font-medium">
            {unreadCount > 0
              ? `${unreadCount} pendientes`
              : 'No hay alertas'}
          </span>
        </div>

        {(isNative || hasNotifications) && (
          <div className="flex items-center p-1.5 bg-black/5 dark:bg-white/5 rounded-full mb-1 md:mb-0 shrink-0">
            {isNative && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2.5 text-text-secondary hover:text-accent hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Configuración"
              >
                <Settings size={18} />
              </button>
            )}
            
            {hasNotifications && (
              <>
                {isNative && <div className="w-px h-6 bg-black/10 dark:bg-white/10 mx-1"></div>}
                <button
                  onClick={markAllNotificationsAsRead}
                  className="p-2.5 text-accent hover:bg-accent/10 rounded-full transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={18} />
                </button>
                <button
                  onClick={requestDeleteAll}
                  className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-full transition-colors ml-1"
                  title="Borrar todas"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filtros Píldoras Flotantes sin bordes */}
      {hasNotifications && (
        <div className="flex overflow-x-auto pb-4 pt-1 px-1 -mx-1 gap-2.5 no-scrollbar mask-linear-fade items-center mb-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-5 py-2.5 text-sm font-bold rounded-full transition-all duration-300 whitespace-nowrap outline-none flex items-center gap-2 ${
                  activeFilter === f.id
                      ? 'bg-accent text-white shadow-md shadow-accent/30 scale-105'
                      : 'bg-black/5 dark:bg-white/5 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 hover:text-text-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {!hasNotifications ? (
        <GlassCard className="glass text-center p-10 sm:p-16 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] mt-8">
          <div className="w-20 h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 text-text-muted">
             <Bell size={32} />
          </div>
          <p className="text-text-primary font-bold text-lg">No tienes notificaciones</p>
          <p className="text-text-secondary font-medium mt-2">Te avisaremos cuando ocurra algo importante.</p>
        </GlassCard>
      ) : isListEmpty ? (
        <GlassCard className="glass text-center p-10 sm:p-16 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px] mt-8 animate-[fade-in_0.3s_ease-out]">
          <div className="w-20 h-20 mx-auto bg-black/5 dark:bg-white/5 rounded-[24px] flex items-center justify-center mb-6 text-text-muted">
             <Filter size={32} />
          </div>
          <p className="text-text-primary font-bold text-lg">No hay notificaciones</p>
          <p className="text-text-secondary font-medium mt-2">Prueba a cambiar el filtro superior.</p>
        </GlassCard>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotifications).map(([key, list]) => (
            list.length > 0 && (
              <div key={key} className="animate-[fade-in_0.3s_ease-out]">
                <h3 className="text-[10px] sm:text-xs font-bold text-text-muted uppercase tracking-widest mb-4 pl-2">
                  {key === 'hoy' ? 'Hoy' : key === 'ayer' ? 'Ayer' : 'Anterior'}
                </h3>
                <div className="space-y-3">
                  {list.map((n) => (
                    <GlassCard
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`
                        glass relative group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 rounded-[24px] transition-all duration-300 cursor-pointer
                        ${n.is_read
                          ? 'border-none ring-1 ring-black/5 dark:ring-white/10 hover:-translate-y-1 hover:shadow-md'
                          : 'border-none ring-2 ring-accent shadow-lg shadow-accent/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/20'
                        }
                      `}
                    >
                      <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
                          <div className="shrink-0 mt-0.5">{getIcon(n)}</div>

                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className={`text-sm sm:text-base font-bold mb-1 break-words whitespace-normal ${n.is_read ? 'text-text-secondary' : 'text-text-primary'}`}>
                              {n.title}
                            </p>
                            <p className={`text-xs sm:text-sm font-medium leading-relaxed break-words whitespace-normal ${n.is_read ? 'text-text-muted' : 'text-text-secondary'}`}>
                              {n.message}
                            </p>

                            {/* Indicadores de acción */}
                            {n.data && (n.data.ip || n.data.userAgent) && (
                              <p className="text-[10px] sm:text-xs text-accent mt-3 font-bold uppercase tracking-wider flex items-center gap-1 w-fit bg-accent/10 px-2 py-1 rounded-full">
                                Detalles de sesión <ChevronRight size={12} />
                              </p>
                            )}
                            {n.data?.url && (
                              <p className="text-[10px] sm:text-xs text-accent mt-3 font-bold uppercase tracking-wider flex items-center gap-1 w-fit bg-accent/10 px-2 py-1 rounded-full">
                                Ver contenido <ChevronRight size={12} />
                              </p>
                            )}
                          </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 sm:gap-2 sm:pl-4 sm:border-l sm:border-black/5 dark:sm:border-white/10 pt-3 sm:pt-0 border-t border-black/5 dark:border-white/10 sm:border-t-0 mt-3 sm:mt-0 shrink-0 w-full sm:w-auto">
                        <span className="text-[10px] sm:text-xs font-bold text-text-muted whitespace-nowrap">
                          {getTimeDisplay(n.created_at)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); requestDeleteOne(n.id); }}
                          className="text-text-muted hover:text-red-500 p-2 rounded-[14px] hover:bg-red-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            )
          ))}

          {canLoadMore && (
            <div className="flex justify-center pt-6 pb-4 animate-[fade-in_0.3s_ease-out]">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="glass flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm border-none ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:text-accent transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} />
                    <span>Cargar Anteriores</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsScreen;