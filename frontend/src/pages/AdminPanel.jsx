/* frontend/src/pages/AdminPanel.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, Edit, Trash2, Plus, CheckCircle, XCircle,
  Bug, Users, CheckSquare, Smartphone, Monitor, Globe, ZoomIn, X, ChevronRight, Calendar, Search
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserEditModal from './UserEditModal';
import UserCreateModal from './UserCreateModal';
import CustomSelect from '../components/CustomSelect';
import { getAllUsers, updateUser, deleteUser, createUser } from '../services/adminService';
import { getBugReports, deleteBugReport } from '../services/reportService';
import { useToast } from '../hooks/useToast';

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
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-text-muted" />
      <span className="text-xs font-bold text-text-muted">Offline</span>
    </div>
  );
};

const AdminPanel = ({ onCancel }) => {
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
  const { addToast } = useToast();

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
    const interval = setInterval(() => fetchUsers(false), 30000);
    return () => clearInterval(interval);
  }, [activeTab, fetchUsers]);

  const handleSaveUser = async (userId, userData) => {
    setIsUpdating(true);
    try {
      const targetId = userId || userToEdit.id;
      const updatedUser = await updateUser(targetId, userData);

      setUsers(users.map(u => u.id === targetId ? updatedUser : u));
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

  return (
    <div className="w-full max-w-6xl mx-auto p-4 pb-24 md:p-6 lg:p-8 animate-[fade-in_0.5s_ease-out]">
      <button 
        onClick={onCancel} 
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors mb-6 w-fit"
      >
        <ChevronLeft size={20} />
        Volver a Ajustes
      </button>

      {/* Título oculto en móvil */}
      <h1 className="hidden md:block text-4xl font-extrabold mb-8 tracking-tight text-text-primary">Panel de Administración</h1>

      {/* Navegación de Pestañas (Modificado a flex-wrap para evitar recortes) */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold transition-all whitespace-nowrap active:scale-95 ${activeTab === 'users'
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
          <Users size={20} />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-full font-bold transition-all whitespace-nowrap active:scale-95 ${activeTab === 'reports'
            ? 'bg-accent text-white shadow-lg shadow-accent/20'
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
            }`}
        >
          <Bug size={20} />
          Reportes
          {reports.length > 0 && activeTab !== 'reports' && (
            <span className="bg-red text-white text-[10px] font-black px-2 py-0.5 rounded-full">{reports.length}</span>
          )}
        </button>
      </div>

      <GlassCard className="glass p-6 sm:p-8 shadow-xl border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[32px]">
        {activeTab === 'users' ? (
          /* --- CONTENIDO PESTAÑA USUARIOS --- */
          <>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 mb-8">
              
              {/* Título + Contador */}
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-extrabold whitespace-nowrap mr-auto text-text-primary">
                  Lista de Usuarios
                </h2>
                <span className="bg-accent/10 text-accent text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full ring-1 ring-accent/30">
                  {users.length} Totales
                </span>
              </div>

              {/* Filtros y Controles */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto lg:ml-auto">
                
                {/* Buscador Inteligente */}
                <div className="relative flex-1 sm:w-64 min-w-[200px]">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Buscar usuario o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-10 py-3.5 rounded-[20px] bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm font-bold text-text-primary placeholder:text-text-muted"
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
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-[20px] bg-accent text-white font-bold transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap flex-1 sm:flex-none shadow-lg shadow-accent/20"
                >
                  <Plus size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Crear Usuario</span>
                  <span className="sm:hidden">Crear</span>
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
                <div className="hidden md:block overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="border-b border-black/5 dark:border-white/10 text-text-secondary text-xs uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-4 pl-2">Usuario</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Fecha Registro</th>
                        <th className="p-4 text-center">Estado</th>
                        <th className="p-4 text-center">Rol</th>
                        <th className="p-4 text-center">Verificado</th>
                        <th className="p-4 text-center pr-2">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedUsers.map(user => (
                        <tr key={user.id} className="border-b border-black/5 dark:border-white/10 last:border-b-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-4 pl-2 font-bold text-text-primary align-middle">
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                {/* Avatar Foto */}
                                {getAvatarUrl(user) ? (
                                  <img src={getAvatarUrl(user)} alt={user.username || user.name} className="w-12 h-12 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10 shadow-sm bg-bg-primary" />
                                ) : (
                                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent font-extrabold text-lg uppercase ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                                    {(user.username || user.name || '?').charAt(0)}
                                  </div>
                                )}
                                {/* Badge de método de inicio de sesión superpuesto */}
                                <div className="absolute -bottom-1 -right-1">
                                  <LoginMethodBadge user={user} />
                                </div>
                              </div>
                              <span className="truncate max-w-[150px]">{user.username || user.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-text-secondary align-middle text-sm font-medium">{user.email}</td>
                          <td className="p-4 text-text-muted align-middle text-sm font-mono font-medium">
                            {formatDateSafe(getUserDate(user))}
                          </td>
                          <td className="p-4 align-middle text-center">
                            <StatusIndicator lastSeen={user.lastSeen} />
                          </td>
                          <td className="p-4 align-middle text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${user.role === 'admin' ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              {user.is_verified ? (
                                <>
                                  <CheckCircle size={18} className="text-green-500" strokeWidth={2.5} />
                                  <span className="text-xs font-bold text-green-500 uppercase tracking-wider">Sí</span>
                                </>
                              ) : (
                                <>
                                  <XCircle size={18} className="text-red" strokeWidth={2.5} />
                                  <span className="text-xs font-bold text-red uppercase tracking-wider">No</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="p-4 pr-2 align-middle text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setUserToEdit(user)} className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary hover:text-accent hover:bg-accent/10 transition-all active:scale-95"><Edit size={18} /></button>
                              <button onClick={() => setUserToDelete(user)} className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 text-text-secondary hover:text-red hover:bg-red/10 transition-all active:scale-95"><Trash2 size={18} /></button>
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
                    <div key={user.id} className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[24px] p-5 text-left">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0 pr-2 flex items-center gap-4">
                          <div className="relative shrink-0">
                            {/* Avatar Foto */}
                            {getAvatarUrl(user) ? (
                              <img src={getAvatarUrl(user)} alt={user.username || user.name} className="w-14 h-14 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10 bg-bg-primary shadow-sm" />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center text-accent font-extrabold text-lg uppercase ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                                {(user.username || user.name || '?').charAt(0)}
                              </div>
                            )}
                            {/* Badge de método de inicio de sesión superpuesto */}
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
                          <button onClick={() => setUserToEdit(user)} className="p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[12px] text-text-secondary hover:text-accent hover:bg-accent/10 transition-all active:scale-95"><Edit size={16} /></button>
                          <button onClick={() => setUserToDelete(user)} className="p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-[12px] text-text-secondary hover:text-red hover:bg-red/10 transition-all active:scale-95"><Trash2 size={16} /></button>
                        </div>
                      </div>

                      {/* Información en Grid compacto */}
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-xs mt-2 border-t border-black/5 dark:border-white/10 pt-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-text-muted" />
                          <span className="text-text-muted font-mono font-medium">{formatDateSafe(getUserDate(user))}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <StatusIndicator lastSeen={user.lastSeen} />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Rol:</span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${user.role === 'admin' ? 'bg-accent/10 text-accent ring-1 ring-accent/30' : 'bg-black/5 dark:bg-white/5 text-text-secondary ring-1 ring-black/5 dark:ring-white/10'}`}>
                            {user.role}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-text-muted font-bold uppercase tracking-wider text-[10px]">Verif:</span>
                          {user.is_verified ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle size={14} className="text-green-500" strokeWidth={2.5} />
                              <span className="text-green-500 font-bold uppercase tracking-wider">Sí</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <XCircle size={14} className="text-red" strokeWidth={2.5} />
                              <span className="text-red font-bold uppercase tracking-wider">No</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
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
        )}
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