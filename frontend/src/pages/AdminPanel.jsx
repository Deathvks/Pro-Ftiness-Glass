/* frontend/src/pages/AdminPanel.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, Edit, Trash2, Plus, CheckCircle, XCircle, Check,
  Bug, Users, CheckSquare, Smartphone, Monitor, Globe, ZoomIn, X, ChevronRight, Calendar, Search, Sparkles, Sun, Droplets, RefreshCw
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserEditModal from './UserEditModal';
import UserCreateModal from './UserCreateModal';
import AdminExercises from './AdminExercises';
import CustomSelect from '../components/CustomSelect';
import { getAllUsers, updateUser, deleteUser, createUser } from '../services/adminService';
import { getBugReports, deleteBugReport } from '../services/reportService';
import { useToast } from '../hooks/useToast';
import useAppStore from '../store/useAppStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Umbral para considerar a un usuario "online" (5 minutos)
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
const REPORTS_PER_PAGE = 5;

const REPORT_CATEGORY_LABELS = {
  bug: 'Bug',
  ui: 'Interfaz',
  account: 'Cuenta',
  content: 'Datos',
  feature: 'Mejora',
  other: 'Otro'
};

// Función auxiliar segura para formatear fechas
const formatDateSafe = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  } catch (e) {
    return 'Fecha inválida';
  }
};

// --- BUSCADOR INTELIGENTE: Función para limpiar acentos, espacios y símbolos ---
const normalizeForSearch = (text) => {
  if (!text) return '';
  return text
    .normalize("NFD")                   // Descompone los acentos (ej: 'é' pasa a 'e' + '´')
    .replace(/[\u0300-\u036f]/g, "")    // Elimina los acentos descompuestos
    .replace(/[^a-zA-Z0-9]/g, "")       // Elimina todo lo que no sea letra o número (espacios, @, ., -, _)
    .toLowerCase();                     // Todo a minúsculas
};

// Componente para indicar el método de inicio de sesión como un pequeño Badge
const LoginMethodBadge = ({ user }) => {
  const getMethod = () => {
    if (user.google_id) return { type: 'Google', bg: 'bg-white', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg' };
    if (user.discord_id) return { type: 'Discord', bg: 'bg-[#5865F2]', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/discord/discord-original.svg' };
    if (user.github_id) return { type: 'GitHub', bg: 'bg-white', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg' };
    if (user.spotify_id) return { type: 'Spotify', bg: 'bg-[#1DB954]', icon: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' };
    if (user.x_id) return { type: 'X', bg: 'bg-white', icon: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg' };
    if (user.facebook_id) return { type: 'Facebook', bg: 'bg-white', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/facebook/facebook-original.svg' };
    // Por defecto: App Nativa
    return { type: 'App', bg: 'bg-accent', isApp: true };
  };

  const method = getMethod();

  return (
    <div title={`Registrado vía ${method.type}`} className={`w-5 h-5 flex items-center justify-center rounded-full overflow-hidden shrink-0 ${method.bg} ring-2 ring-bg-primary relative group`}>
      {method.isApp ? (
        <Smartphone size={10} className="text-white" />
      ) : (
        <img src={method.icon} alt={method.type} className="w-3 h-3 object-contain" />
      )}
    </div>
  );
};

// Componente para el indicador de estado
const StatusIndicator = ({ lastSeen }) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      if (!lastSeen) {
        setIsOnline(false);
        return;
      }
      const lastSeenDate = new Date(lastSeen);
      const now = new Date();
      setIsOnline(now - lastSeenDate < ONLINE_THRESHOLD_MS);
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, [lastSeen]);

  if (isOnline) {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-bold text-green-500">Online</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        <div className="w-2 h-2 rounded-full bg-text-muted" />
        <span className="text-xs font-bold text-text-muted">Offline</span>
      </div>
      {lastSeen && (
        <span className="text-[10px] text-text-secondary mt-0.5">
          {formatDistanceToNow(new Date(lastSeen), { addSuffix: true, locale: es })}
        </span>
      )}
    </div>
  );
};

const AdminPanel = ({ onCancel }) => {
  const { showToast: addToast } = useToast();
  const { userProfile, setUserProfile, setGamificationData } = useAppStore(state => ({
    userProfile: state.userProfile,
    setUserProfile: state.setUserProfile,
    setGamificationData: state.setGamificationData
  }));

  // Recuperar la pestaña activa de localStorage o usar default 'users'
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('admin_active_tab') || 'users');

  // Por defecto ordenamos por fecha (Recientes arriba)
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('admin_users_sort') || 'date');
  
  // Estado para el buscador
  const [searchQuery, setSearchQuery] = useState('');

  const [reports, setReports] = useState([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [selectedImageForLightbox, setSelectedImageForLightbox] = useState(null);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  
  // FIX: Extraemos la URL base del servidor quitando el sufijo /api
  const SERVER_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL.replace('/api', '');

  // Guardar la pestaña activa cada vez que cambie
  useEffect(() => {
    localStorage.setItem('admin_active_tab', activeTab);
  }, [activeTab]);

  // Guardar el filtro cada vez que cambie
  useEffect(() => {
    localStorage.setItem('admin_users_sort', sortBy);
  }, [sortBy]);

  // Cargar Usuarios
  const fetchUsers = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      if (isInitialLoad) {
        addToast(error.message || 'No se pudo cargar la lista de usuarios.', 'error');
      } else {
        console.error("Error al refrescar usuarios:", error);
      }
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [addToast]);

  // Cargar Reportes
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getBugReports();
      // Ordenamos reportes por fecha descendente (Nuevos primero)
      const sortedData = (data || []).sort((a, b) => {
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setReports(sortedData);
    } catch (error) {
      addToast('Error al cargar reportes de bugs', 'error');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  // Efecto para cargar datos según la pestaña activa
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers(true);
    } else {
      fetchReports();
    }
  }, [activeTab, fetchUsers, fetchReports]);

  // Polling solo si estamos en la pestaña de usuarios
  useEffect(() => {
    if (activeTab !== 'users') return;
    const interval = setInterval(() => fetchUsers(false), 15000);
    return () => clearInterval(interval);
  }, [activeTab, fetchUsers]);

  const handleSaveUser = async (userId, userData) => {
    console.log("[DEBUG ADMIN] handleSaveUser CALLED with:", { userId, userData, userToEditId: userToEdit?.id });
    setIsUpdating(true);
    try {
      const targetId = userId || userToEdit.id;
      const updatedUser = await updateUser(targetId, userData);

      setUsers(users.map(u => u.id === targetId ? { ...u, ...updatedUser } : u));
      
      console.log("[DEBUG ADMIN] Saving user...", {
        targetId,
        userProfileId: userProfile?.id,
        updatedUser
      });

      // Si el usuario editado es el mismo que está logueado, actualizar el store global
      if (userProfile && String(targetId) === String(userProfile.id)) {
        console.log("[DEBUG ADMIN] Updating global store for current user!");
        setUserProfile({
          ...userProfile,
          level: updatedUser.level,
          xp: updatedUser.xp,
          role: updatedUser.role,
          name: updatedUser.name,
          username: updatedUser.username,
        });
        
        // También actualizar la gamificación si es necesario
        setGamificationData({
          level: updatedUser.level,
          xp: updatedUser.xp
        });
      } else {
        console.log("[DEBUG ADMIN] Not updating global store because targetId != userProfile.id");
      }

      addToast('Usuario actualizado con éxito.', 'success');
      setUserToEdit(null);
    } catch (error) {
      addToast(error.message || 'Error al actualizar el usuario.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsUpdating(true);
    try {
      await deleteUser(userToDelete.id);
      setUsers(users.filter(u => u.id !== userToDelete.id));
      addToast('Usuario eliminado con éxito.', 'success');
      setUserToDelete(null);
    } catch (error) {
      addToast(error.message || 'Error al eliminar el usuario.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateUser = async (userData) => {
    setIsUpdating(true);
    try {
      const newUser = await createUser(userData);
      setUsers([newUser, ...users]); // Añadimos al principio
      addToast('Usuario creado con éxito.', 'success');
      setIsCreatingUser(false);
    } catch (error) {
      addToast(error.message || 'Error al crear el usuario.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResolveReport = async () => {
    if (!reportToDelete) return;
    setIsUpdating(true);
    try {
      await deleteBugReport(reportToDelete.id);
      setReports(reports.filter(r => r.id !== reportToDelete.id));
      addToast('Reporte marcado como resuelto', 'success');
      setReportToDelete(null);
    } catch (error) {
      addToast('Error al resolver reporte', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper para obtener la fecha de registro soportando varios nombres de campo
  const getUserDate = (user) => {
    return user.created_at || user.createdAt || user.register_date || user.date || null;
  };

  // FIX: Lógica calcada de Social.jsx para arreglar las rutas locales de los avatares
  const getAvatarUrl = (user) => {
    const path = user.profile_image_url;
    if (!path) return null;
    if (path.startsWith('http')) return path;
    if (path.startsWith('blob:')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${SERVER_URL}${cleanPath}`;
  };

  // --- LÓGICA DE BÚSQUEDA Y ORDENACIÓN ---
  const processedUsers = useMemo(() => {
    // 1. Filtrado por búsqueda inteligente
    const cleanQuery = normalizeForSearch(searchQuery);
    
    let filtered = users;
    if (cleanQuery) {
      filtered = users.filter(user => {
        const cleanName = normalizeForSearch(user.username || user.name);
        const cleanEmail = normalizeForSearch(user.email);
        return cleanName.includes(cleanQuery) || cleanEmail.includes(cleanQuery);
      });
    }

    // 2. Ordenación
    const getTime = (dateStr) => {
      if (!dateStr) return 0;
      return new Date(dateStr).getTime();
    };

    switch (sortBy) {
      case 'date':
        // Recientes ARRIBA
        return filtered.sort((a, b) => getTime(getUserDate(b)) - getTime(getUserDate(a)));
      case 'alpha': // Alfabético (A-Z)
        return filtered.sort((a, b) => (a.username || a.name || '').localeCompare(b.username || b.name || ''));
      case 'default':
      default: // Por última actividad
        return filtered.sort((a, b) => getTime(b.lastSeen) - getTime(a.lastSeen));
    }
  }, [users, sortBy, searchQuery]);

  // Lógica de Paginación para Reportes
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  const currentReports = useMemo(() => {
    const startIndex = (reportPage - 1) * REPORTS_PER_PAGE;
    return reports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
  }, [reports, reportPage]);

  // Contar cuántos usuarios tienen temas desbloqueados
  const galaxyUsersCount = useMemo(() => {
    return users.filter(user => user.role === 'admin' || (user.referralCount || 0) >= 5).length;
  }, [users]);
  const desertUsersCount = useMemo(() => {
    return users.filter(user => user.role === 'admin' || (user.referralCount || 0) >= 8).length;
  }, [users]);
  const oceanUsersCount = useMemo(() => {
    return users.filter(user => user.role === 'admin' || (user.referralCount || 0) >= 11).length;
  }, [users]);

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-24 md:p-6 lg:p-8 animate-[fade-in_0.5s_ease-out]">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-6 sm:mb-8">
        <button 
          onClick={onCancel} 
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-fit shrink-0"
        >
          <ChevronLeft size={20} />
          Volver a Ajustes
        </button>

        {/* Título oculto en móvil */}
        <h1 className="hidden md:block text-4xl font-extrabold tracking-tight text-text-primary">Panel de Administración</h1>
      </div>

      {/* Navegación de Pestañas (Scroll horizontal en móvil) */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 sm:gap-3 mb-6 sm:mb-8 pt-2 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-bold transition-all whitespace-nowrap active:scale-95 text-sm sm:text-base ${activeTab === 'users'
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-bold transition-all whitespace-nowrap active:scale-95 text-sm sm:text-base ${activeTab === 'reports'
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
          <Bug className="w-4 h-4 sm:w-5 sm:h-5" />
          Reportes
          {reports.length > 0 && activeTab !== 'reports' && (
            <span className="bg-red text-white text-[10px] font-black px-1.5 sm:px-2 py-0.5 rounded-full ml-1 sm:ml-0">{reports.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-full font-bold transition-all whitespace-nowrap active:scale-95 text-sm sm:text-base ${activeTab === 'exercises'
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
          <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
          Ejercicios
        </button>
      </div>

      <GlassCard className="glass p-6 sm:p-8 shadow-xl border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px]">
        {activeTab === 'users' ? (
          /* --- CONTENIDO PESTAÑA USUARIOS --- */
          <>
            {/* Bento Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-black/5 dark:bg-white/5 rounded-3xl p-5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
                   <Users size={100} />
                </div>
                <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1 relative z-10">Total Usuarios</span>
                <span className="text-4xl font-black text-text-primary relative z-10">{users.length}</span>
              </div>
              <div className="bg-[#a855f7]/5 rounded-3xl p-5 ring-1 ring-[#a855f7]/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
                   <Sparkles size={100} className="text-[#a855f7]" />
                </div>
                <span className="text-xs font-bold text-[#a855f7] uppercase tracking-wider mb-1 relative z-10">Galaxia</span>
                <span className="text-4xl font-black text-[#a855f7] relative z-10">{galaxyUsersCount}</span>
              </div>
              <div className="bg-[#f59e0b]/5 rounded-3xl p-5 ring-1 ring-[#f59e0b]/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
                   <Sun size={100} className="text-[#f59e0b]" />
                </div>
                <span className="text-xs font-bold text-[#f59e0b] uppercase tracking-wider mb-1 relative z-10">Desierto</span>
                <span className="text-4xl font-black text-[#f59e0b] relative z-10">{desertUsersCount}</span>
              </div>
              <div className="bg-[#0ea5e9]/5 rounded-3xl p-5 ring-1 ring-[#0ea5e9]/20 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
                   <Droplets size={100} className="text-[#0ea5e9]" />
                </div>
                <span className="text-xs font-bold text-[#0ea5e9] uppercase tracking-wider mb-1 relative z-10">Océano</span>
                <span className="text-4xl font-black text-[#0ea5e9] relative z-10">{oceanUsersCount}</span>
              </div>
            </div>

            {/* Toolbar (Directorio y Filtros) */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 mb-6 bg-black/5 dark:bg-white/5 p-3 rounded-[28px] ring-1 ring-black/5 dark:ring-white/10">
              <h2 className="text-xl font-black text-text-primary pl-4 py-2">
                Directorio
              </h2>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {/* Buscador Inteligente */}
                <div className="relative flex-1 sm:w-64 min-w-[200px]">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar usuario..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3 rounded-[20px] bg-bg-primary border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm font-bold text-text-primary placeholder:text-text-muted shadow-sm"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors p-1"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Botón Refrescar */}
                <button
                  onClick={() => fetchUsers(true)}
                  className="p-3 bg-bg-primary text-text-secondary hover:text-accent rounded-[20px] ring-1 ring-black/5 dark:ring-white/10 shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center shrink-0"
                  title="Refrescar Lista"
                >
                  <RefreshCw size={18} strokeWidth={2.5} className={isLoading ? 'animate-spin text-accent' : ''} />
                </button>

                {/* Select: Ordenación */}
                <div className="flex-1 sm:flex-none sm:w-40 z-20">
                  <CustomSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { value: 'date', label: 'Recientes' },
                      { value: 'default', label: 'Última Actividad' },
                      { value: 'alpha', label: 'Alfabético' }
                    ]}
                    className="w-full text-sm font-bold"
                  />
                </div>

                {/* Botón Crear */}
                <button
                  onClick={() => setIsCreatingUser(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-[20px] bg-accent text-white font-bold transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap shadow-lg shadow-accent/20"
                >
                  <Plus size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12"><Spinner size={32} /></div>
            ) : processedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-[fade-in_0.3s_ease-out] bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 mt-4">
                <div className="w-20 h-20 bg-bg-primary rounded-[24px] flex items-center justify-center mb-5 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                  <Search size={36} className="text-text-muted opacity-50" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-extrabold text-text-primary mb-2">Sin coincidencias</h3>
                <p className="text-text-secondary font-medium text-sm">No se ha encontrado ningún usuario con esos datos.</p>
              </div>
            ) : (
              <>
                {/* Tabla Desktop (md en adelante) */}
                <div className="hidden md:block overflow-x-auto custom-scrollbar bg-black/5 dark:bg-white/5 rounded-[28px] ring-1 ring-black/5 dark:ring-white/10 p-2">
                  <table className="w-full text-left border-collapse">
                    <thead className="text-text-muted text-[10px] uppercase tracking-[0.2em] font-black border-b border-black/5 dark:border-white/5">
                      <tr>
                        <th className="p-4 pl-6">Usuario</th>
                        <th className="p-4">Detalles</th>
                        <th className="p-4">Actividad</th>
                        <th className="p-4 text-center">Invitaciones</th>
                        <th className="p-4 text-right pr-6">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedUsers.map(user => (
                        <tr key={user.id} className="border-b border-black/5 dark:border-white/5 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
                          
                          {/* 1. Usuario (Avatar + Nombre + Email) */}
                          <td className="p-4 pl-6 align-middle">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                {getAvatarUrl(user) ? (
                                  <img src={getAvatarUrl(user)} alt={user.username || user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10 shadow-sm" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-extrabold text-lg uppercase ring-2 ring-black/5 dark:ring-white/10 shadow-sm">
                                    {(user.username || user.name || '?').charAt(0)}
                                  </div>
                                )}
                                <div className="absolute -bottom-1 -right-1">
                                  <LoginMethodBadge user={user} />
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-[15px] text-text-primary truncate max-w-[150px] lg:max-w-[250px]" title={user.username || user.name}>
                                  {user.username || user.name}
                                </span>
                                <span className="font-medium text-xs text-text-muted truncate max-w-[150px] lg:max-w-[250px]" title={user.email}>
                                  {user.email}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Detalles (Rol + Verificado + Nivel) */}
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${user.role === 'admin' ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : user.role === 'trainer' ? 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/30' : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10'}`}>
                                {user.role}
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10">
                                Lvl {user.level || 1}
                              </span>
                              {user.is_verified ? (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-500 ring-1 ring-green-500/30" title="Verificado">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red/10 text-red ring-1 ring-red/30" title="No Verificado">
                                  <X size={12} strokeWidth={3} />
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Actividad (Estado + Registro) */}
                          <td className="p-4 align-middle">
                            <div className="flex flex-col items-start gap-1">
                              <StatusIndicator lastSeen={user.lastSeen} />
                              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                Reg: {formatDateSafe(getUserDate(user))}
                              </span>
                            </div>
                          </td>

                          {/* 4. Invitaciones */}
                          <td className="p-4 align-middle text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <span className="text-sm font-black text-text-primary bg-black/5 dark:bg-white/5 w-8 h-8 rounded-full flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">{user.referralCount || 0}</span>
                              <div className="flex -space-x-1 ml-1">
                                {(user.referralCount >= 5 || user.role === 'admin') && (
                                  <div className="w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center ring-2 ring-bg-primary z-30" title="Galaxia">
                                    <Sparkles size={10} className="text-white" />
                                  </div>
                                )}
                                {(user.referralCount >= 8 || user.role === 'admin') && (
                                  <div className="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center ring-2 ring-bg-primary z-20" title="Desierto">
                                    <Sun size={10} className="text-white" />
                                  </div>
                                )}
                                {(user.referralCount >= 11 || user.role === 'admin') && (
                                  <div className="w-5 h-5 rounded-full bg-[#0ea5e9] flex items-center justify-center ring-2 ring-bg-primary z-10" title="Océano">
                                    <Droplets size={10} className="text-white" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 5. Acciones */}
                          <td className="p-4 pr-6 align-middle text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setUserToEdit(user)} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-text-secondary hover:text-accent hover:bg-accent/10 transition-all active:scale-95">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => setUserToDelete(user)} className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-text-secondary hover:text-red hover:bg-red/10 transition-all active:scale-95">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Vista Tarjetas Móvil (Menos de md) */}
                <div className="md:hidden space-y-4">
                  {processedUsers.map(user => (
                    <div key={user.id} className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[28px] p-5 text-left shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-2 flex items-center gap-4">
                          <div className="relative shrink-0">
                            {getAvatarUrl(user) ? (
                              <img src={getAvatarUrl(user)} alt={user.username || user.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-black/5 dark:ring-white/10 bg-bg-primary shadow-sm" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent font-extrabold text-lg uppercase ring-2 ring-black/5 dark:ring-white/10 shadow-sm">
                                {(user.username || user.name || '?').charAt(0)}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1">
                              <LoginMethodBadge user={user} />
                            </div>
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <h3 className="font-extrabold text-lg truncate text-text-primary">{user.username || user.name}</h3>
                            <p className="text-text-secondary font-medium text-xs truncate mt-0.5">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => setUserToEdit(user)} className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-text-secondary hover:text-accent hover:bg-accent/10 transition-all active:scale-95"><Edit size={16} /></button>
                          <button onClick={() => setUserToDelete(user)} className="p-2.5 bg-black/5 dark:bg-white/5 rounded-xl text-text-secondary hover:text-red hover:bg-red/10 transition-all active:scale-95"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {/* Información en Grid compacto */}
                      <div className="flex flex-col gap-3 text-xs mt-2 border-t border-black/5 dark:border-white/5 pt-4">
                        
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${user.role === 'admin' ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : user.role === 'trainer' ? 'bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/30' : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10'}`}>
                               {user.role}
                             </span>
                             <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10">
                               Lvl {user.level || 1}
                             </span>
                           </div>
                           <div className="flex items-center gap-1.5">
                             {user.is_verified ? (
                               <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-500 ring-1 ring-green-500/30" title="Verificado">
                                 <Check size={12} strokeWidth={3} />
                               </span>
                             ) : (
                               <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red/10 text-red ring-1 ring-red/30" title="No Verificado">
                                 <X size={12} strokeWidth={3} />
                               </span>
                             )}
                           </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-3">
                          <div className="flex flex-col gap-1">
                             <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Reg: {formatDateSafe(getUserDate(user))}</span>
                             <StatusIndicator lastSeen={user.lastSeen} />
                          </div>
                          
                          <div className="flex justify-center items-center gap-1.5 mt-1 sm:mt-0">
                            <span className="text-sm font-black text-text-primary bg-black/5 dark:bg-white/5 w-8 h-8 rounded-full flex items-center justify-center ring-1 ring-black/5 dark:ring-white/10">{user.referralCount || 0}</span>
                            <div className="flex -space-x-1 ml-1">
                              {(user.referralCount >= 5 || user.role === 'admin') && (
                                <div className="w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center ring-2 ring-bg-primary z-30" title="Galaxia">
                                  <Sparkles size={10} className="text-white" />
                                </div>
                              )}
                              {(user.referralCount >= 8 || user.role === 'admin') && (
                                <div className="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center ring-2 ring-bg-primary z-20" title="Desierto">
                                  <Sun size={10} className="text-white" />
                                </div>
                              )}
                              {(user.referralCount >= 11 || user.role === 'admin') && (
                                <div className="w-5 h-5 rounded-full bg-[#0ea5e9] flex items-center justify-center ring-2 ring-bg-primary z-10" title="Océano">
                                  <Droplets size={10} className="text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : activeTab === 'reports' ? (
          /* --- CONTENIDO PESTAÑA REPORTES --- */
          <>
            <div className="mb-8 text-left">
              <h2 className="text-2xl font-extrabold text-text-primary mb-2">Reportes de Problemas</h2>
              <p className="text-text-secondary font-medium text-sm">Feedback técnico enviado por los usuarios.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-12"><Spinner size={32} /></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 text-text-muted bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
                <CheckSquare size={48} className="mx-auto mb-4 opacity-50" strokeWidth={1.5} />
                <p className="font-bold text-lg">¡Todo limpio!</p>
                <p className="text-sm font-medium mt-1">No hay reportes pendientes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                <div className="space-y-5 text-left">
                  {currentReports.map((report) => (
                    <div key={report.id} className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 md:p-6 hover:shadow-md transition-all animate-[fade-in_0.3s_ease-out]">
                      <div className="flex flex-col md:flex-row gap-5 justify-between items-start">
                        <div className="flex-1 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-3 py-1 bg-accent/10 text-accent ring-1 ring-accent/30 text-[10px] font-black rounded-md uppercase tracking-widest">
                              {REPORT_CATEGORY_LABELS[report.category] || report.category}
                            </span>
                            <span className="text-xs font-mono font-medium text-text-muted">{formatDateSafe(report.created_at)}</span>
                            <span className="text-xs text-text-primary font-bold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">@{report.username || 'Anónimo'}</span>
                          </div>
                          <h3 className="text-xl font-extrabold text-text-primary leading-tight">{report.subject}</h3>

                          <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed font-medium bg-bg-primary/50 p-4 rounded-[16px] ring-1 ring-black/5 dark:ring-white/10">
                            {report.description}
                          </p>

                          {report.images && report.images.length > 0 && (
                            <>
                              <div className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-5 mb-3">
                                Imágenes adjuntadas
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {report.images.map((img, idx) => (
                                  <div
                                    key={idx}
                                    className="relative group w-20 h-20 rounded-[16px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 cursor-zoom-in bg-bg-primary shadow-sm"
                                    onClick={() => setSelectedImageForLightbox(`${API_URL}${img}`)}
                                  >
                                    <img src={`${API_URL}${img}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="bug-snap" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ZoomIn size={20} className="text-white" strokeWidth={2.5} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {report.deviceInfo && (
                            <div className="mt-5 flex flex-wrap gap-3 text-[11px] font-bold text-text-muted">
                              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-2.5 py-1.5 rounded-md">
                                {report.deviceInfo.userAgent?.includes('Mobile') ? <Smartphone size={14} /> : <Monitor size={14} />}
                                <span>{report.deviceInfo.platform}</span>
                              </div>
                              <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 px-2.5 py-1.5 rounded-md">
                                <Globe size={14} />
                                <span className="truncate max-w-[150px]" title={report.deviceInfo.userAgent}>{report.deviceInfo.userAgent}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setReportToDelete(report)}
                          className="flex items-center gap-2 px-5 py-3.5 bg-green-500/10 text-green-600 dark:text-green-500 hover:bg-green-500 hover:text-white ring-1 ring-green-500/30 hover:ring-green-500 rounded-[20px] font-bold transition-all active:scale-95 shrink-0 mt-2 md:mt-0 w-full md:w-auto justify-center shadow-sm"
                        >
                          <CheckSquare size={20} strokeWidth={2.5} />
                          Resolver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 pt-6 border-t border-black/5 dark:border-white/10">
                    <button
                      onClick={() => setReportPage(p => Math.max(1, p - 1))}
                      disabled={reportPage === 1}
                      className="p-3 rounded-[16px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary disabled:opacity-30 hover:bg-accent hover:text-white hover:ring-accent transition-all active:scale-95 shadow-sm"
                    >
                      <ChevronLeft size={20} strokeWidth={2.5} />
                    </button>
                    <span className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                      Página <span className="text-accent">{reportPage}</span> de {totalPages}
                    </span>
                    <button
                      onClick={() => setReportPage(p => Math.min(totalPages, p + 1))}
                      disabled={reportPage === totalPages}
                      className="p-3 rounded-[16px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary disabled:opacity-30 hover:bg-accent hover:text-white hover:ring-accent transition-all active:scale-95 shadow-sm"
                    >
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : activeTab === 'exercises' ? (
          <AdminExercises />
        ) : null}
      </GlassCard>

      {/* Lightbox y Modales */}
      {selectedImageForLightbox && (
        <div
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setSelectedImageForLightbox(null)}
        >
          <button className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95">
            <X size={24} strokeWidth={2.5} />
          </button>
          <img
            src={selectedImageForLightbox}
            alt="Reporte ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-[24px] shadow-2xl animate-[scale-in_0.3s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {userToEdit && (
        <UserEditModal
          user={userToEdit}
          onSave={handleSaveUser}
          onCancel={() => setUserToEdit(null)}
          isLoading={isUpdating}
        />
      )}

      {userToDelete && (
        <ConfirmationModal
          message={`¿Seguro que quieres eliminar a ${userToDelete.username || userToDelete.name}? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
          isLoading={isUpdating}
          confirmText="Eliminar"
        />
      )}

      {reportToDelete && (
        <ConfirmationModal
          message="¿Marcar este reporte como resuelto? Se eliminará de la lista."
          onConfirm={handleResolveReport}
          onCancel={() => setReportToDelete(null)}
          isLoading={isUpdating}
          confirmText="Resolver"
          confirmColor="bg-green-600 hover:bg-green-700"
        />
      )}

      {isCreatingUser && (
        <UserCreateModal
          onSave={handleCreateUser}
          onCancel={() => setIsCreatingUser(false)}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default AdminPanel;