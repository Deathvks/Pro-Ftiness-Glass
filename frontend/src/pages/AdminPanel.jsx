/* frontend/src/pages/AdminPanel.jsx */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronLeft, Edit, Trash2, Plus, CheckCircle, XCircle,
  Bug, Users, CheckSquare, Smartphone, Monitor, Globe, ZoomIn, X, ChevronRight
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserEditModal from './UserEditModal';
import UserCreateModal from './UserCreateModal';
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
        <span className="text-xs font-medium text-green-500">Online</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      <div className="w-2 h-2 rounded-full bg-text-muted" />
      <span className="text-xs font-medium text-text-muted">Offline</span>
    </div>
  );
};

const AdminPanel = ({ onCancel }) => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'reports'
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

  const API_URL = import.meta.env.VITE_API_URL || '';

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
      setReports(data || []);
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
      setUsers([newUser, ...users]);
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

  const sortedUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const dateA = a.lastSeen ? new Date(a.lastSeen) : new Date(0);
        const dateB = b.lastSeen ? new Date(b.lastSeen) : new Date(0);
        return dateB - dateA;
      });
  }, [users]);

  // Lógica de Paginación para Reportes
  const totalPages = Math.ceil(reports.length / REPORTS_PER_PAGE);
  const currentReports = useMemo(() => {
    const startIndex = (reportPage - 1) * REPORTS_PER_PAGE;
    return reports.slice(startIndex, startIndex + REPORTS_PER_PAGE);
  }, [reports, reportPage]);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
        <ChevronLeft size={20} />
        Volver a Ajustes
      </button>
      <h1 className="text-4xl font-extrabold mb-8">Panel de Administración</h1>

      {/* Navegación de Pestañas */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'users'
            ? 'bg-accent text-bg-primary shadow-lg shadow-accent/20'
            : 'bg-glass-light border border-glass-border text-text-secondary hover:bg-white/5'
            }`}
        >
          <Users size={20} />
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'reports'
            ? 'bg-accent text-bg-primary shadow-lg shadow-accent/20'
            : 'bg-glass-light border border-glass-border text-text-secondary hover:bg-white/5'
            }`}
        >
          <Bug size={20} />
          Reportes
          {reports.length > 0 && activeTab !== 'reports' && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{reports.length}</span>
          )}
        </button>
      </div>

      <GlassCard className="p-6">
        {activeTab === 'users' ? (
          /* --- CONTENIDO PESTAÑA USUARIOS --- */
          <>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 text-left">
              <h2 className="text-xl font-bold">Lista de Usuarios</h2>
              <button
                onClick={() => setIsCreatingUser(true)}
                className="flex items-center justify-center gap-2 mt-4 sm:mt-0 px-4 py-2 rounded-md bg-accent text-bg-secondary font-semibold transition hover:scale-105"
              >
                <Plus size={18} />
                Crear Usuario
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10"><Spinner /></div>
            ) : (
              <>
                {/* Tabla Desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="border-b border-glass-border">
                      <tr>
                        <th className="p-3">Nombre</th>
                        <th className="p-3">Email</th>
                        <th className="p-3 text-center">Estado</th>
                        <th className="p-3 text-center">Rol</th>
                        <th className="p-3 text-center">Verificado</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedUsers.map(user => (
                        <tr key={user.id} className="border-b border-glass-border last:border-b-0">
                          <td className="p-3 font-semibold align-middle">{user.username || user.name}</td>
                          <td className="p-3 text-text-secondary align-middle">{user.email}</td>
                          <td className="p-3 align-middle text-center">
                            <StatusIndicator lastSeen={user.lastSeen} />
                          </td>
                          <td className="p-3 align-middle text-center">
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full capitalize ${user.role === 'admin' ? 'bg-accent-transparent text-accent' : 'bg-bg-secondary text-text-secondary'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="p-3 align-middle text-center">
                            <div className="flex justify-center items-center">
                              {user.is_verified ? (
                                <div className="flex items-center gap-1 text-green-500"><CheckCircle size={16} /><span className="text-xs font-medium">Sí</span></div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-500"><XCircle size={16} /><span className="text-xs font-medium">No</span></div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 align-middle text-center">
                            <div className="flex justify-center gap-2">
                              <button onClick={() => setUserToEdit(user)} className="p-2 text-text-secondary hover:text-accent transition"><Edit size={16} /></button>
                              <button onClick={() => setUserToDelete(user)} className="p-2 text-text-secondary hover:text-red transition"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Tarjetas Móvil */}
                <div className="md:hidden space-y-4">
                  {sortedUsers.map(user => (
                    <div key={user.id} className="bg-glass-light border border-glass-border rounded-lg p-4 text-left">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg truncate">{user.username || user.name}</h3>
                          <p className="text-text-secondary text-sm truncate">{user.email}</p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button onClick={() => setUserToEdit(user)} className="p-2 text-text-secondary hover:text-accent transition"><Edit size={16} /></button>
                          <button onClick={() => setUserToDelete(user)} className="p-2 text-text-secondary hover:text-red transition"><Trash2 size={16} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-between items-center gap-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Rol:</span>
                            <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full capitalize ${user.role === 'admin' ? 'bg-accent-transparent text-accent' : 'bg-bg-secondary text-text-secondary'}`}>{user.role}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-text-secondary">Verificado:</span>
                            {user.is_verified ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-text-secondary">Estado:</span>
                          <StatusIndicator lastSeen={user.lastSeen} />
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
            <div className="mb-6 text-left">
              <h2 className="text-xl font-bold">Reportes de Problemas</h2>
              <p className="text-text-muted text-sm">Feedback técnico enviado por los usuarios.</p>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10"><Spinner /></div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-text-muted">
                <CheckSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>¡Todo limpio! No hay reportes pendientes.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="space-y-4 text-left">
                  {currentReports.map((report) => (
                    <div key={report.id} className="bg-bg-secondary/30 border border-glass-border rounded-xl p-4 md:p-6 hover:bg-bg-secondary/50 transition-colors animate-[fade-in_0.3s_ease-out]">
                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-3">
                            {/* MODIFICACIÓN: Categoría circular, sin borde, color acento */}
                            <span className="px-2.5 py-0.5 bg-accent text-bg-primary text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                              {REPORT_CATEGORY_LABELS[report.category] || report.category}
                            </span>
                            <span className="text-xs text-text-muted">{new Date(report.created_at).toLocaleString()}</span>
                            <span className="text-xs text-accent font-medium">@{report.username || 'Anónimo'}</span>
                          </div>
                          <h3 className="text-lg font-bold text-white">{report.subject}</h3>
                          <p className="text-text-secondary whitespace-pre-wrap text-sm leading-relaxed bg-black/20 p-3 rounded-lg border border-white/5">
                            {report.description}
                          </p>

                          {/* Previsualización de Imágenes si existen */}
                          {report.images && report.images.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {report.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="relative group w-16 h-16 rounded-lg overflow-hidden border border-glass-border cursor-zoom-in"
                                  onClick={() => setSelectedImageForLightbox(API_URL + img)}
                                >
                                  <img src={API_URL + img} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="bug-snap" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ZoomIn size={16} className="text-white drop-shadow-md" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Información del Dispositivo */}
                          {report.deviceInfo && (
                            <div className="mt-4 flex flex-wrap gap-3 text-xs text-text-muted">
                              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                {report.deviceInfo.userAgent?.includes('Mobile') ? <Smartphone size={12} /> : <Monitor size={12} />}
                                <span>{report.deviceInfo.platform}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                                <Globe size={12} />
                                <span className="truncate max-w-[150px]" title={report.deviceInfo.userAgent}>{report.deviceInfo.userAgent}</span>
                              </div>
                              {report.deviceInfo.screenSize && (
                                <div className="bg-white/5 px-2 py-1 rounded">
                                  {report.deviceInfo.screenSize}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setReportToDelete(report)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg font-medium transition-colors shrink-0 mt-4 md:mt-0 w-full md:w-auto justify-center"
                        >
                          <CheckSquare size={18} />
                          Resolver
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* PAGINACIÓN DE REPORTES */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-glass-border">
                    <button
                      onClick={() => setReportPage(p => Math.max(1, p - 1))}
                      disabled={reportPage === 1}
                      className="p-2 rounded-xl bg-bg-secondary text-text-primary disabled:opacity-30 hover:bg-accent hover:text-bg-primary transition-all shadow-lg"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-text-secondary">
                      Página <span className="text-accent">{reportPage}</span> de {totalPages}
                    </span>
                    <button
                      onClick={() => setReportPage(p => Math.min(totalPages, p + 1))}
                      disabled={reportPage === totalPages}
                      className="p-2 rounded-xl bg-bg-secondary text-text-primary disabled:opacity-30 hover:bg-accent hover:text-bg-primary transition-all shadow-lg"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </GlassCard>

      {/* Lightbox Visualizador */}
      {selectedImageForLightbox && (
        <div
          className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
          onClick={() => setSelectedImageForLightbox(null)}
        >
          <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors">
            <X size={32} />
          </button>
          <img
            src={selectedImageForLightbox}
            alt="Reporte ampliado"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-[scale-in_0.2s_ease-out]"
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