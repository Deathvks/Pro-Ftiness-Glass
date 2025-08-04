import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit, Trash2, Plus } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';
import ConfirmationModal from '../components/ConfirmationModal';
import UserEditModal from './UserEditModal';
import UserCreateModal from './UserCreateModal';
import { getAllUsers, updateUser, deleteUser, createUser } from '../services/adminService';
import { useToast } from '../hooks/useToast';

const AdminPanel = ({ onCancel }) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getAllUsers();
        setUsers(data);
      } catch (error) {
        addToast(error.message || 'No se pudo cargar la lista de usuarios.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [addToast]);

  const handleSaveUser = async (userId, userData) => {
    setIsUpdating(true);
    try {
      const updatedUser = await updateUser(userId, userData);
      setUsers(users.map(u => u.id === userId ? updatedUser : u));
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

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
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
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed">
              <thead className="border-b border-glass-border">
                <tr>
                  <th className="p-3 w-3/12">Nombre</th>
                  <th className="p-3 w-4/12 hidden sm:table-cell">Email</th>
                  <th className="p-3 w-2/12 text-center">Rol</th>
                  <th className="p-3 w-3/12 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-glass-border last:border-b-0">
                    <td className="p-3 font-semibold align-middle truncate">{user.name}</td>
                    <td className="p-3 text-text-secondary hidden sm:table-cell align-middle truncate">{user.email}</td>
                    <td className="p-3 align-middle text-center">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full capitalize ${user.role === 'admin' ? 'bg-accent-transparent text-accent' : 'bg-bg-secondary text-text-secondary'}`}>
                        {user.role}
                      </span>
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