import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import { PlusIcon, UserGroupIcon, TrashIcon, EllipsisVerticalIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import RoutineEditor from '../../pages/RoutineEditor';
import UserAvatar from '../UserAvatar'; // Reutilizamos el editor existente

const getFullImageUrl = (path, API_URL) => {
  if (!path || path === 'null') return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('blob:')) return path;
  const SERVER_URL = API_URL.replace('/api', '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return SERVER_URL + cleanPath;
};

export default function TrainerRoutines({ activeClients }) {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const { addToast } = useToast();
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Modal para asignar clientes
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRoutineForAssign, setSelectedRoutineForAssign] = useState(null);
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [assignSearchQuery, setAssignSearchQuery] = useState('');

  useEffect(() => {
    fetchRoutines();
  }, []);

  const fetchRoutines = async () => {
    try {
      setLoading(true);
      const res = await apiClient('/trainer/routines');
      setRoutines(res);
    } catch (err) {
      addToast('Error al cargar rutinas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingRoutineId(null);
    setIsEditing(true);
  };

  const handleEdit = (id) => {
    setEditingRoutineId(id);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que quieres borrar esta rutina para siempre? Los clientes asignados la perderán.')) return;
    try {
      await apiClient(`/routines/${id}`, { method: 'DELETE' });
      addToast('Rutina eliminada', 'success');
      fetchRoutines();
    } catch (err) {
      addToast('Error al eliminar', 'error');
    }
  };

  const openAssignModal = (routine) => {
    setSelectedRoutineForAssign(routine);
    const assignedIds = (routine.AssignedClients || []).map(c => c.id);
    setSelectedClientIds(assignedIds);
    setAssignSearchQuery('');
    setAssignModalOpen(true);
  };

  const saveAssignments = async () => {
    try {
      await apiClient(`/trainer/routines/${selectedRoutineForAssign.id}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ clientIds: selectedClientIds })
      });
      addToast('Asignaciones guardadas', 'success');
      setAssignModalOpen(false);
      fetchRoutines();
    } catch (err) {
      addToast('Error al guardar asignaciones', 'error');
    }
  };

  const toggleClientSelection = (clientId) => {
    if (selectedClientIds.includes(clientId)) {
      setSelectedClientIds(selectedClientIds.filter(id => id !== clientId));
    } else {
      setSelectedClientIds([...selectedClientIds, clientId]);
    }
  };

  if (isEditing) {
    return (
      <div className="animate-fade-in relative">
        <button 
          onClick={() => { setIsEditing(false); fetchRoutines(); }}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-xl font-bold hover:bg-black/10 transition-colors"
        >
          Volver a Mis Rutinas
        </button>
        <div className="pt-16">
          <RoutineEditor 
            routine={{ id: editingRoutineId }}
            isTrainerTemplate={true} 
            onSave={() => { setIsEditing(false); fetchRoutines(); }}
            onCancel={() => { setIsEditing(false); fetchRoutines(); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-text-primary">Mis Rutinas para Clientes</h2>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-bg-primary rounded-xl font-bold shadow-lg hover:bg-accent/90 transition-all hover:scale-105"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Crear Rutina</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : routines.length === 0 ? (
        <div className="text-center p-12 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-3xl">
          <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-4 ring-1 ring-accent/30">
            <UserGroupIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-text-primary mb-2">No tienes rutinas para clientes</h3>
          <p className="text-text-secondary max-w-sm mx-auto">
            Crea rutinas maestras y asígnalas a tus clientes. Ellos las verán en su carpeta "Entrenador Personal".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routines.map(routine => (
            <div key={routine.id} className="bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden ring-1 ring-black/5 dark:ring-white/10 bg-black/5">
                    {routine.image_url ? (
                      <img src={getFullImageUrl(routine.image_url, API_URL)} alt={routine.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-accent/50">
                        <UserGroupIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleEdit(routine.id)}
                      className="text-xs font-bold text-text-secondary hover:text-accent bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-lg ring-1 ring-black/5 dark:ring-white/10 transition-colors"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(routine.id)}
                      className="p-1.5 text-text-secondary hover:text-red-500 bg-black/5 dark:bg-white/5 rounded-lg ring-1 ring-black/5 dark:ring-white/10 transition-colors"
                      title="Eliminar rutina"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-black text-text-primary mb-1">{routine.name}</h3>
                <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                  {routine.description || 'Sin descripción'}
                </p>

                <div className="flex items-center gap-2 text-xs font-bold text-text-muted mb-4">
                  <span className="bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md ring-1 ring-black/5 dark:ring-white/10">
                    {routine.RoutineExercises?.length || 0} ejercicios
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5" /> Asignada a {(routine.AssignedClients || []).length} clientes
                  </span>
                </div>
                
                {routine.AssignedClients && routine.AssignedClients.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {routine.AssignedClients.map(c => (
                      <span key={c.id} className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-md ring-1 ring-accent/30">
                        {c.name.split(' ')[0]}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => openAssignModal(routine)}
                  className="w-full py-2 bg-black/5 dark:bg-white/5 text-text-primary text-sm font-bold rounded-xl ring-1 ring-black/5 dark:ring-white/10 hover:ring-accent/50 hover:text-accent transition-all"
                >
                  Gestionar Asignaciones
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {assignModalOpen && selectedRoutineForAssign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary max-w-md w-full rounded-3xl ring-1 ring-black/5 dark:ring-white/10 p-6 shadow-2xl relative">
            <h3 className="text-xl font-black text-text-primary mb-2">Asignar a Clientes</h3>
            <p className="text-sm text-text-secondary mb-6">
              Selecciona los clientes a los que quieres asignar la rutina <strong>{selectedRoutineForAssign.name}</strong>.
            </p>

              <div className="relative mb-4">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={assignSearchQuery}
                  onChange={(e) => setAssignSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all text-sm"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 p-1 pr-2">
                {activeClients.length === 0 ? (
                  <p className="text-sm text-text-secondary text-center py-4">No tienes clientes activos actualmente.</p>
                ) : (
                  activeClients.filter(c => {
                    const normalize = str => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                    const term = normalize(assignSearchQuery);
                    return normalize(c.name).includes(term) || normalize(c.username).includes(term);
                  }).map(client => {
                  const isSelected = selectedClientIds.includes(client.id);
                  return (
                      <div 
                        key={client.id}
                        onClick={() => toggleClientSelection(client.id)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border-l-4 ${
                          isSelected 
                            ? 'bg-accent/10 border-accent ring-1 ring-accent/30' 
                            : 'bg-black/5 dark:bg-white/5 border-transparent hover:bg-black/10 hover:border-black/20 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-black/10 dark:ring-white/10">
                            <UserAvatar user={client} size="full" />
                          </div>
                        <div>
                          <p className={`font-bold text-sm ${isSelected ? 'text-accent' : 'text-text-primary'}`}>{client.name}</p>
                          <p className="text-xs text-text-secondary">@{client.username}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-accent border-accent' : 'border-glass-border bg-transparent'
                      }`}>
                        {isSelected && <span className="text-bg-primary text-xs">✓</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => setAssignModalOpen(false)}
                className="flex-1 py-3 bg-black/5 dark:bg-white/5 text-text-primary font-bold rounded-xl ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={saveAssignments}
                className="flex-1 py-3 bg-accent text-bg-primary font-bold rounded-xl shadow-lg hover:bg-accent/90 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
