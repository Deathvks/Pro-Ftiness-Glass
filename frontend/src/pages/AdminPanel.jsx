/* frontend/src/pages/AdminPanel.jsx */
import React, { useState, useEffect, useCallback } from 'react'; // Añadimos useCallback
import { ChevronLeft, Edit, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserEditModal from './UserEditModal';
import UserCreateModal from './UserCreateModal';
import { getAllUsers, updateUser, deleteUser, createUser } from '../services/adminService';
import { useToast } from '../hooks/useToast';

// --- INICIO DE LA MODIFICACIÓN (Usuario) ---
// Definimos el umbral para considerar a un usuario "online" (5 minutos)
const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

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
    // Actualizamos el estado cada 30 segundos
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
// --- FIN DE LA MODIFICACIÓN (Usuario) ---

const AdminPanel = ({ onCancel }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { addToast } = useToast();

  // --- INICIO DE LA MODIFICACIÓN (Polling) ---
  // Usamos useCallback para memoizar la función de carga de usuarios
  const fetchUsers = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      if (isInitialLoad) {
        addToast(error.message || 'No se pudo cargar la lista de usuarios.', 'error');
      } else {
        // Para el polling, quizás solo logueamos en consola
        console.error("Error al refrescar usuarios:", error);
      }
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [addToast]); // addToast es una dependencia

  useEffect(() => {
    // Carga inicial
    fetchUsers(true);

    // Polling: Actualizamos la lista de usuarios cada 30 segundos
    const interval = setInterval(() => fetchUsers(false), 30000);

    return () => clearInterval(interval);
  }, [fetchUsers]); // Ahora fetchUsers es la dependencia
  // --- FIN DE LA MODIFICACIÓN (Polling) ---

  const handleSaveUser = async (userData) => {
    setIsUpdating(true);
    try {
      // Pasamos el ID correcto al servicio
      const updatedUser = await updateUser(userToEdit.id, userData);
      setUsers(users.map(u => u.id === userToEdit.id ? updatedUser : u));
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
      setUsers([newUser, ...users]); // Añadimos el nuevo usuario al principio
      addToast('Usuario creado con éxito.', 'success');
      setIsCreatingUser(false);
    } catch (error) {
      addToast(error.message || 'Error al crear el usuario.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // --- INICIO DE LA MODIFICACIÓN (Sorting) ---
  // Memoizamos la lista ordenada para evitar recalcularla en cada render
  // Ordenamos por 'lastSeen' descendente (más recientes primero)
  const sortedUsers = React.useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const dateA = a.lastSeen ? new Date(a.lastSeen) : new Date(0);
        const dateB = b.lastSeen ? new Date(b.lastSeen) : new Date(0);
        return dateB - dateA;
      });
  }, [users]);
  // --- FIN DE LA MODIFICACIÓN (Sorting) ---

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
      <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
        <ChevronLeft size={20} />
        Volver a Ajustes
      </button>
      <h1 className="text-4xl font-extrabold mb-8">Panel de Administración</h1>

      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
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
            {/* Vista de tabla para pantallas medianas y grandes */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b border-glass-border">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Email</th>
                    {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
                    <th className="p-3 text-center">Estado</th>
                    {/* --- FIN DE LA MODIFICACIÓN (Usuario) --- */}
                    <th className="p-3 text-center">Rol</th>
                    <th className="p-3 text-center">Verificado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
                  {/* Usamos la lista ordenada */}
                  {sortedUsers.map(user => (
                  // --- FIN DE LA MODIFICACIÓN (Usuario) ---
                    <tr key={user.id} className="border-b border-glass-border last:border-b-0">
                      <td className="p-3 font-semibold align-middle">{user.username || user.name}</td>
                      <td className="p-3 text-text-secondary align-middle">{user.email}</td>
                      {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
                      <td className="p-3 align-middle text-center">
                        <StatusIndicator lastSeen={user.lastSeen} />
                      </td>
                      {/* --- FIN DE LA MODIFICACIÓN (Usuario) --- */}
                      <td className="p-3 align-middle text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full capitalize ${user.role === 'admin' ? 'bg-accent-transparent text-accent' : 'bg-bg-secondary text-text-secondary'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3 align-middle text-center">
                        <div className="flex justify-center items-center">
                          {user.is_verified ? (
                            <div className="flex items-center gap-1 text-green-500">
                              <CheckCircle size={16} />
                              <span className="text-xs font-medium">Sí</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-500">
                              <XCircle size={16} />
                              <span className="text-xs font-medium">No</span>
                            </div>
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

            {/* Vista de tarjetas para pantallas pequeñas */}
            <div className="md:hidden space-y-4">
              {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
              {/* Usamos la lista ordenada */}
              {sortedUsers.map(user => (
              // --- FIN DE LA MODIFICACIÓN (Usuario) ---
                <div key={user.id} className="bg-glass-light border border-glass-border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{user.username || user.name}</h3>
                      <p className="text-text-secondary text-sm truncate">{user.email}</p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button onClick={() => setUserToEdit(user)} className="p-2 text-text-secondary hover:text-accent transition">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setUserToDelete(user)} className="p-2 text-text-secondary hover:text-red transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
                  <div className="flex flex-wrap justify-between items-center gap-y-2">
                  {/* --- FIN DE LA MODIFICACIÓN (Usuario) --- */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">Rol:</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full capitalize ${user.role === 'admin' ? 'bg-accent-transparent text-accent' : 'bg-bg-secondary text-text-secondary'}`}>
                          {user.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-secondary">Verificado:</span>
                        {user.is_verified ? (
                          <div className="flex items-center gap-1 text-green-500">
                            <CheckCircle size={14} />
                            <span className="text-xs font-medium">Sí</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-500">
                            <XCircle size={14} />
                            <span className="text-xs font-medium">No</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* --- INICIO DE LA MODIFICACIÓN (Usuario) --- */}
                    {/* Añadimos el estado a la vista móvil */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-secondary">Estado:</span>
                      <StatusIndicator lastSeen={user.lastSeen} />
                    </div>
                    {/* --- FIN DE LA MODIFICACIÓN (Usuario) --- */}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </GlassCard>
      
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
          message={`¿Seguro que quieres eliminar a ${userToDelete.name}? Esta acción no se puede deshacer.`}
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
          isLoading={isUpdating}
          confirmText="Eliminar"
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