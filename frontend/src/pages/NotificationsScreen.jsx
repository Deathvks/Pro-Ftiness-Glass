/* frontend/src/pages/NotificationsScreen.jsx */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../store/useAppStore';
import Spinner from '../components/Spinner';
import { isToday, isYesterday, parseISO } from 'date-fns';
import {
  Bell, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle, AlertCircle,
  Filter, ChevronDown, Loader2, Smartphone, Globe, Clock, Shield, ChevronLeft,
  UserPlus, Users, Zap, Award, Settings
} from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <div className="mr-4">
      <p className="text-sm font-bold text-text-primary">{label}</p>
      {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
        ${checked ? 'bg-accent' : 'bg-gray-600'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  </div>
);

// --- Sub-componente: Modal de Configuración ---
const NotificationSettingsModal = ({ onClose, scheduleEngagement, scheduleDaily }) => {
  // Estado local sincronizado con localStorage
  const [engagement, setEngagement] = useState(() => localStorage.getItem('notif_engagement') !== 'false');
  const [daily, setDaily] = useState(() => localStorage.getItem('notif_daily') !== 'false');

  const handleEngagementChange = async (val) => {
    setEngagement(val);
    localStorage.setItem('notif_engagement', val);
    if (Capacitor.isNativePlatform()) {
      if (val) {
        await scheduleEngagement();
      } else {
        // IDs 2000-2100 usados para engagement
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
        // IDs 1001 (Login) y 1002 (Meal)
        await LocalNotifications.cancel({ notifications: [{ id: 1001 }, { id: 1002 }] });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-sm bg-bg-primary border border-glass-border rounded-2xl p-6 shadow-2xl animate-[scale-in_0.2s_ease-out]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-text-primary">Configuración</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-bg-secondary text-text-secondary">
            <X size={20} />
          </button>
        </div>

        <div className="bg-bg-secondary/50 rounded-xl p-4 border border-glass-border space-y-2">
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
          className="mt-6 w-full py-3 bg-bg-secondary text-text-primary font-bold rounded-xl hover:bg-bg-secondary/80 transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};

// --- Sub-componente: Modal de Detalles de Login ---
const LoginDetailsModal = ({ notification, onClose, timeZone }) => {
  if (!notification || !notification.data) return null;

  const { ip, userAgent, date } = notification.data;
  const loginDate = date ? parseDateSafe(date) : parseDateSafe(notification.created_at);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]">
      <div className="relative w-full max-w-md bg-bg-secondary border border-glass-border rounded-2xl p-6 shadow-2xl animate-[scale-in_0.2s_ease-out]">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition p-1 hover:bg-gray-500/10 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-4">
            <Shield size={32} />
          </div>
          <h3 className="text-xl font-bold text-text-primary">Detalles de Inicio de Sesión</h3>
          <p className="text-text-secondary text-sm mt-1">
            Información del dispositivo registrado
          </p>
        </div>

        <div className="space-y-4 bg-bg-primary/50 rounded-xl p-4 border border-glass-border">
          {/* Dispositivo */}
          <div className="flex gap-3 items-start">
            <div className="mt-1 p-1.5 bg-blue-500/10 rounded text-blue-500 shrink-0">
              <Smartphone size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Dispositivo / Navegador</p>
              <p className="text-sm text-text-primary break-words leading-tight mt-0.5">
                {userAgent || 'Desconocido'}
              </p>
            </div>
          </div>

          {/* IP */}
          <div className="flex gap-3 items-start">
            <div className="mt-1 p-1.5 bg-purple-500/10 rounded text-purple-500 shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Dirección IP</p>
              <p className="text-sm text-text-primary font-mono mt-0.5">
                {ip || 'Desconocida'}
              </p>
            </div>
          </div>

          {/* Fecha */}
          <div className="flex gap-3 items-start">
            <div className="mt-1 p-1.5 bg-green-500/10 rounded text-green-500 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Fecha y Hora</p>
              <p className="text-sm text-text-primary mt-0.5">
                {formatDateFullWithZone(loginDate, timeZone)}
              </p>
              <p className="text-xs text-text-muted mt-1">
                Zona: {timeZone}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-accent text-bg-secondary font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-accent/20"
        >
          Entendido
        </button>
      </div>
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
    if (subType === 'friend_request') return <UserPlus className="text-accent" size={24} />;
    if (subType === 'friend_accept') return <Users className="text-green-500" size={24} />;
    if (subType === 'xp' || subType === 'level_up') return <Zap className="text-amber-400" size={24} fill="currentColor" fillOpacity={0.2} />;
    if (subType === 'badge') return <Award className="text-amber-500" size={24} />;

    switch (n.type) {
      case 'success': return <CheckCircle className="text-green-500" size={24} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'alert': return <AlertCircle className="text-red-500" size={24} />;
      default: return <Info className="text-accent" size={24} />;
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
    <div className="pb-6 pt-6 px-4 max-w-2xl mx-auto min-h-full relative">

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
        className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      {/* Header */}
      <div className="flex justify-between items-end md:items-center mb-6">

        {/* MODIFICACIÓN: Encabezado con degradado en PC */}
        <h2 className="hidden md:flex text-2xl font-bold items-center gap-3">
          <Bell className="text-accent" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
            Notificaciones
          </span>
        </h2>

        <div className="md:hidden flex flex-col gap-0.5">
          <span className="text-lg font-bold text-text-primary">
            {unreadCount > 0 ? 'Tienes novedades' : 'Todo al día'}
          </span>
          <span className="text-xs text-text-muted">
            {unreadCount > 0
              ? `${unreadCount} notificaciones sin leer`
              : 'No hay alertas pendientes'}
          </span>
        </div>

        {(isNative || hasNotifications) && (
          <div className="flex items-center p-1 bg-bg-secondary border border-glass-border rounded-full shadow-sm mb-1 md:mb-0">
            {isNative && (
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-full transition-colors"
                title="Configuración"
              >
                <Settings size={18} />
              </button>
            )}
            
            {hasNotifications && (
              <>
                {isNative && <div className="w-px h-5 bg-glass-border mx-1"></div>}
                <button
                  onClick={markAllNotificationsAsRead}
                  className="p-2 text-accent hover:bg-accent/10 rounded-full transition-colors"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck size={18} />
                </button>
                <div className="w-px h-5 bg-glass-border mx-1"></div>
                <button
                  onClick={requestDeleteAll}
                  className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                  title="Borrar todas"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filtros */}
      {hasNotifications && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`
                px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 border
                ${activeFilter === f.id
                  ? 'bg-accent text-bg-secondary border-accent shadow-md shadow-accent/20'
                  : 'bg-bg-secondary text-text-secondary border-glass-border hover:border-accent hover:text-accent'
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lista */}
      {!hasNotifications ? (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-70">
          <Bell className="w-12 h-12 text-text-muted mb-4 opacity-50" />
          <p className="text-text-secondary text-lg font-medium">No tienes notificaciones</p>
          <p className="text-text-muted text-sm mt-1">Te avisaremos cuando ocurra algo importante.</p>
        </div>
      ) : isListEmpty ? (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-70 animate-[fade-in_0.3s_ease-out]">
          <Filter className="w-10 h-10 text-text-muted mb-3 opacity-50" />
          <p className="text-text-secondary font-medium">No hay notificaciones en este filtro</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([key, list]) => (
            list.length > 0 && (
              <div key={key} className="animate-[fade-in_0.3s_ease-out]">
                <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 pl-1">
                  {key === 'hoy' ? 'Hoy' : key === 'ayer' ? 'Ayer' : 'Anterior'}
                </h3>
                <div className="space-y-3">
                  {list.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`
                        relative group flex items-start gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer
                        ${n.is_read
                          ? 'bg-bg-secondary border border-glass-border hover:border-text-muted/30'
                          : 'bg-bg-secondary border-2 border-accent shadow-lg shadow-accent/5'
                        }
                      `}
                    >
                      <div className="flex-shrink-0 mt-0.5">{getIcon(n)}</div>

                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold mb-1 ${n.is_read ? 'text-text-secondary' : 'text-text-primary'}`}>
                          {n.title}
                        </p>
                        <p className={`text-sm leading-relaxed ${n.is_read ? 'text-text-muted' : 'text-text-secondary'}`}>
                          {n.message}
                        </p>

                        {/* Indicadores de acción */}
                        {n.data && (n.data.ip || n.data.userAgent) && (
                          <p className="text-xs text-accent mt-2 font-medium flex items-center gap-1">
                            Ver detalles <ChevronDown size={12} className="-rotate-90" />
                          </p>
                        )}
                        {n.data?.url && (
                          <p className="text-xs text-accent mt-2 font-medium flex items-center gap-1">
                            Ver ahora <ChevronDown size={12} className="-rotate-90" />
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 self-stretch justify-between pl-2">
                        <span className="text-xs text-text-muted whitespace-nowrap">
                          {getTimeDisplay(n.created_at)}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); requestDeleteOne(n.id); }}
                          className="text-text-muted hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          {canLoadMore && (
            <div className="flex justify-center pt-4 pb-2 animate-[fade-in_0.3s_ease-out]">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-bg-secondary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Cargando...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={18} />
                    <span>Cargar más antiguas</span>
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