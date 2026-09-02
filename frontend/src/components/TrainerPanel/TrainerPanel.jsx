import ModalPortal from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeftIcon,
  UserPlusIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  LinkIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon } from
'@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import AddClientFlow from './AddClientFlow';
import AnamnesisForm from './AnamnesisForm';
import ClientDetailPanel from './ClientDetailPanel';
import TrainerChats from '../TrainerChats';
import TrainerRoutines from './TrainerRoutines';
import AdminExercises from '../../pages/AdminExercises';
import CustomSelect from '../CustomSelect';
import UserAvatar from '../UserAvatar';
import { useToast } from '../../hooks/useToast';

export default function TrainerPanel({ setView }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddFlow, setShowAddFlow] = useState(() => sessionStorage.getItem('trainer_showAddFlow') === 'true');
  const [editingClient, setEditingClient] = useState(() => {
    const saved = sessionStorage.getItem('trainer_editingClient');
    return saved ? JSON.parse(saved) : null;
  });

  const [clientToDetail, setClientToDetail] = useState(() => {
    const saved = sessionStorage.getItem('trainer_clientToDetail');
    return saved ? JSON.parse(saved) : null;
  });

  const [clientToDelete, setClientToDelete] = useState(null);
  const [clientToUnlink, setClientToUnlink] = useState(null);
  const [clientToRelink, setClientToRelink] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('trainer_activeTab') || 'activos');
  const { addToast } = useToast();

  useEffect(() => {
    sessionStorage.setItem('trainer_showAddFlow', showAddFlow);
  }, [showAddFlow]);

  useEffect(() => {
    sessionStorage.setItem('trainer_activeTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (editingClient) {
      sessionStorage.setItem('trainer_editingClient', JSON.stringify(editingClient));
    } else {
      sessionStorage.removeItem('trainer_editingClient');
    }
  }, [editingClient]);

  useEffect(() => {
    if (clientToDetail) {
      sessionStorage.setItem('trainer_clientToDetail', JSON.stringify(clientToDetail));
    } else {
      sessionStorage.removeItem('trainer_clientToDetail');
    }
  }, [clientToDetail]);

  const fetchClients = async () => {
    try {
      const res = await apiClient('/trainer/clients', { method: 'GET' });
      setClients(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      await apiClient(`/trainer/clients/${clientToDelete.id}`, { method: 'DELETE' });
      addToast('Cliente eliminado correctamente', 'success');
      setClientToDelete(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      addToast('Error al eliminar cliente', 'error');
    }
  };

  const confirmUnlink = async () => {
    if (!clientToUnlink) return;
    try {
      await apiClient(`/trainer/clients/${clientToUnlink.id}/unlink`, { method: 'PUT' });
      addToast('Cliente dado de baja correctamente', 'success');
      setClientToUnlink(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      addToast('Error al dar de baja', 'error');
    }
  };

  const confirmRelink = async () => {
    if (!clientToRelink) return;
    try {
      await apiClient(`/trainer/clients/${clientToRelink.id}/link`, { method: 'PUT' });
      addToast('Cliente revinculado correctamente', 'success');
      setClientToRelink(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      addToast('Error al revincular', 'error');
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Filter logic
  const normalizeStr = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
  };

  const filteredClients = clients.filter((client) => {
    if (activeTab === 'activos' && !client.isActive) return false;
    if (activeTab === 'antiguos' && client.isActive) return false;

    const searchMatch = !searchTerm ||
    normalizeStr(client.name).includes(normalizeStr(searchTerm)) ||
    normalizeStr(client.username).includes(normalizeStr(searchTerm));

    let dateMatch = true;
    if (dateFilter !== 'all' && client.createdAt) {
      const clientDate = new Date(client.createdAt);
      const now = new Date();
      // Reset hours to compare pure dates properly
      clientDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      const diffTime = Math.abs(now - clientDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === 'today') dateMatch = diffDays <= 1;
      if (dateFilter === 'week') dateMatch = diffDays <= 7;
      if (dateFilter === 'month') dateMatch = diffDays <= 30;
    }

    return searchMatch && dateMatch;
  });

  const formatDate = (isoString) => {
    if (!isoString) return 'Desconocida';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (showAddFlow) {
    return (
      <AddClientFlow
        onBack={() => {
          setShowAddFlow(false);
          sessionStorage.removeItem('trainer_showAddFlow');
          fetchClients();
        }} />);


  }

  if (editingClient) {
    return (
      <AnamnesisForm
        client={editingClient}
        isEditing={true}
        onFinish={() => {
          setEditingClient(null);
          sessionStorage.removeItem('trainer_editingClient');
          fetchClients();
        }}
        onBack={() => {
          setEditingClient(null);
          sessionStorage.removeItem('trainer_editingClient');
        }} />);


  }

  if (clientToDetail) {
    return (
      <ModalPortal>
        <div className="fixed inset-0 z-[45] bg-bg-primary animate-fade-in-up">
          <ClientDetailPanel
            client={clientToDetail}
            onBack={() => {
              setClientToDetail(null);
              sessionStorage.removeItem('trainer_clientToDetail');
              fetchClients();
            }} />
        </div>
      </ModalPortal>
    );
  }

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] md:pb-0 animate-fade-in overflow-y-auto flex flex-col">
      <Helmet>
        <title>Panel de Entrenador - Pro Fitness Glass</title>
      </Helmet>

      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-5xl w-full mx-auto flex flex-col flex-1 space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-2">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('hub')} 
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-fit shrink-0"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              Volver al Hub
            </button>
            <h1 className="hidden md:block text-4xl font-extrabold tracking-tight text-text-primary">Personal Trainer</h1>
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 md:gap-4">
          <button
            onClick={() => setShowAddFlow(true)}
            className="flex-1 md:flex-none md:w-auto px-4 md:px-8 py-3.5 flex items-center justify-center gap-2 bg-accent text-bg-primary font-bold rounded-2xl active:scale-95 transition-transform shadow-lg shadow-accent/20">
            <UserPlusIcon className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
            <span className="text-sm md:text-base whitespace-nowrap">Añadir Nuevo Cliente</span>
          </button>
          
          <div className="flex justify-end shrink-0">
            <button
              onClick={fetchClients}
              disabled={loading}
              className={`p-3 bg-bg-secondary text-text-primary rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-none hover:bg-glass-border/30 transition-colors ${loading ? 'opacity-50 animate-pulse' : 'active:scale-95'}`}
              title="Actualizar datos">
              <ArrowPathIcon className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {activeTab !== 'ejercicios' && activeTab !== 'rutinas' &&
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg-secondary ring-1 ring-black/5 dark:ring-white/10 border-none rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all" />
            
            </div>
            <div className="w-full sm:w-48 shrink-0">
              <CustomSelect
              value={dateFilter}
              onChange={setDateFilter}
              options={[
              { value: 'all', label: 'Cualquier fecha' },
              { value: 'today', label: 'Hoy' },
              { value: 'week', label: 'Última semana' },
              { value: 'month', label: 'Último mes' }]
              }
              placeholder="Fecha" />
            
            </div>
          </div>
        }

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar bg-bg-secondary p-2 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-none w-fit max-w-full mx-auto md:mx-0">
          <button
            onClick={() => setActiveTab('activos')}
            className={`shrink-0 whitespace-nowrap py-3 px-5 font-bold rounded-xl transition-all ${activeTab === 'activos' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}>
            
            Activos
          </button>
          <button
            onClick={() => setActiveTab('chats')}
            className={`shrink-0 whitespace-nowrap py-3 px-5 font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'chats' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}>
            
            <ChatBubbleLeftRightIcon className="w-5 h-5 shrink-0" />
            Asesorías
          </button>
          <button
            onClick={() => setActiveTab('antiguos')}
            className={`shrink-0 whitespace-nowrap py-3 px-5 font-bold rounded-xl transition-all ${activeTab === 'antiguos' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}>
            
            Antiguos Clientes
          </button>
          <button
            onClick={() => setActiveTab('ejercicios')}
            className={`shrink-0 whitespace-nowrap py-3 px-5 font-bold rounded-xl transition-all ${activeTab === 'ejercicios' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}>
            
            Librería Ejercicios
          </button>
          <button
            onClick={() => setActiveTab('rutinas')}
            className={`shrink-0 whitespace-nowrap py-3 px-5 font-bold rounded-xl transition-all ${activeTab === 'rutinas' ? 'bg-accent text-bg-primary shadow-sm' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}>
            Mis Rutinas
          </button>
        </div>

        {activeTab === 'ejercicios' ?
        <div className="mt-4">
            <AdminExercises isTrainerMode={true} />
        </div> :
        activeTab === 'rutinas' ?
        <div className="mt-4">
            <TrainerRoutines activeClients={clients.filter(c => c.isActive)} />
        </div> :
        activeTab === 'chats' ?
        <div className="h-[600px] md:h-[600px] mt-4 w-full">
            <TrainerChats onClose={() => setActiveTab('activos')} />
          </div> :

        <div>
          <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
            {activeTab === 'activos' ? 'Mis Clientes' : 'Antiguos Clientes'}
            <span className="text-sm font-medium bg-bg-secondary px-2 py-0.5 rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-none">
              {filteredClients.length}
            </span>
          </h2>
          {loading ?
          <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div> :
          filteredClients.length === 0 ?
          <div className="text-center p-8 glass rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-none">
              <p className="text-text-secondary">No se han encontrado clientes con esos filtros.</p>
            </div> :

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredClients.map((client) =>
            <div
              key={client.id}
              onClick={() => {
                if (client.isActive) setClientToDetail(client);
              }}
              className={`bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 rounded-3xl flex flex-col justify-between transition-colors shadow-sm ${client.isActive ? 'cursor-pointer hover:shadow-md hover:ring-black/10 dark:hover:ring-white/20' : ''} overflow-hidden`}>
              
                  <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <UserAvatar user={client} size={12} className="shrink-0" />
                      <div>
                        <p className="font-bold text-text-primary text-lg">{client.name}</p>
                        <p className="text-sm text-text-secondary mt-0.5 mb-2">@{client.username}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {client.trainedToday ?
                      <div className="flex items-center justify-center gap-1 text-green-500 text-[10px] sm:text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded-md ring-1 ring-green-500/20 border-none">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              <span>Entrenó Hoy</span>
                            </div> :

                      <div className="flex items-center justify-center gap-1 text-text-secondary text-[10px] sm:text-xs font-bold bg-bg-secondary px-2 py-0.5 rounded-md ring-1 ring-black/5 dark:ring-white/10 border-none">
                              <span>Sin entreno hoy</span>
                            </div>
                      }
                          
                          {client.isAnamnesisComplete ?
                      <div className="flex items-center justify-center gap-1 text-green-500 text-[10px] sm:text-xs font-bold bg-green-500/10 px-2 py-0.5 rounded-md ring-1 ring-green-500/20 border-none">
                              <CheckCircleIcon className="w-3.5 h-3.5" />
                              <span>Anamnesis OK</span>
                            </div> :

                      <div className="flex items-center justify-center gap-1 text-orange-400 text-[10px] sm:text-xs font-bold bg-orange-400/10 px-2 py-0.5 rounded-md ring-1 ring-orange-400/20 border-none">
                              <ExclamationCircleIcon className="w-3.5 h-3.5" />
                              <span>Falta Anamnesis</span>
                            </div>
                      }
                        </div>

                        {/* Resumen Días Entreno */}
                        {(() => {
                      const todayId = new Date().getDay().toString();
                      const trainingDays = client.anamnesisData?.trainingDays || [];
                      const trainedTodayUnplanned = client.trainedToday && !trainingDays.includes(todayId);

                      const daysToDisplay = [...new Set([...trainingDays, ...(trainedTodayUnplanned ? [todayId] : [])])];

                      if (daysToDisplay.length === 0) return null;

                      return (
                        <div className="flex gap-1 mb-2">
                              {daysToDisplay.
                          sort((a, b) => ['1', '2', '3', '4', '5', '6', '0'].indexOf(a) - ['1', '2', '3', '4', '5', '6', '0'].indexOf(b)).
                          map((d) => {
                            const isUnplanned = trainedTodayUnplanned && d === todayId;
                            return (
                              <span
                                key={d}
                                title={isUnplanned ? "Entrenamiento extra hoy (no planificado)" : "Día planificado"}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
                                isUnplanned ?
                                'bg-green-500/20 text-green-500 border border-green-500/50 shadow-[0_0_5px_rgba(34,197,94,0.3)] animate-pulse' :
                                'bg-accent/20 text-accent'}`
                                }>
                                
                                      {{ '1': 'L', '2': 'M', '3': 'X', '4': 'J', '5': 'V', '6': 'S', '0': 'D' }[d]}
                                      {isUnplanned && <span>🔥</span>}
                                    </span>);

                          })}
                            </div>);

                    })()}
                        
                        <p className="text-[10px] sm:text-xs text-text-muted">Alta: {formatDate(client.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer con botones de acción */}
                  <div className="border-t border-glass-border/30 bg-black/5 px-4 py-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {client.isActive ?
                <>
                        <button
                    title="Editar Anamnesis"
                    onClick={() => setEditingClient(client)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-accent bg-bg-secondary rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-none hover:border-accent/30 transition-all">
                    
                          <PencilIcon className="w-4 h-4" />
                          <span>Anamnesis</span>
                        </button>
                        <button
                    title="Dar de baja"
                    onClick={() => setClientToUnlink(client)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-text-secondary hover:text-orange-500 bg-bg-secondary rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-none hover:border-orange-500/30 transition-all">
                    
                          <XMarkIcon className="w-4 h-4" />
                          <span>Baja</span>
                        </button>
                        {!client.isLinked &&
                  <button
                    title="Eliminar permanentemente"
                    onClick={() => setClientToDelete(client)}
                    className="p-1.5 text-text-secondary hover:text-red-500 bg-bg-secondary rounded-lg ring-1 ring-black/5 dark:ring-white/10 border-none hover:border-red-500/30 transition-all">
                    
                            <TrashIcon className="w-4 h-4" />
                          </button>
                  }
                      </> :

                <div className="flex items-center justify-between w-full">
                        <span className="text-xs text-text-secondary font-medium mr-2">Dado de baja</span>
                        <button
                    onClick={() => setClientToRelink(client)}
                    className="px-4 py-1.5 text-xs bg-accent/10 text-accent border border-accent/30 font-bold rounded-lg hover:bg-accent/20 transition-colors">
                    
                          Revincular
                        </button>
                      </div>
                }
                  </div>
                </div>
            )}
            </div>
          }
        </div>
        }
      </div>

      {clientToDelete && <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary max-w-sm w-full rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-none p-6 shadow-2xl relative">
            <button
              onClick={() => setClientToDelete(null)}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-red-500 bg-bg-secondary rounded-full transition-colors">
              
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-2 border border-red-500/20">
                <ExclamationCircleIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary">¿Eliminar cliente?</h3>
              <p className="text-text-secondary text-sm">
                Estás a punto de eliminar a <strong className="text-text-primary">{clientToDelete.name}</strong> por completo. Esto destruirá sus datos. ¿Estás completamente seguro?
              </p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setClientToDelete(null)}
                  className="flex-1 py-3 bg-bg-secondary text-text-primary font-bold rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-none hover:bg-glass-border/50 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-500/10 text-red-500 font-bold rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div></ModalPortal>
      }

      {clientToUnlink && <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary max-w-sm w-full rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-none p-6 shadow-2xl relative">
            <button
              onClick={() => setClientToUnlink(null)}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-red-500 bg-bg-secondary rounded-full transition-colors">
              
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-2 border border-orange-500/20">
                <XMarkIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary">¿Dar de baja?</h3>
              <p className="text-text-secondary text-sm">
                Estás a punto de dar de baja a <strong className="text-text-primary">{clientToUnlink.name}</strong>. Pasará a ser un usuario normal y aparecerá en tus Antiguos Clientes.
              </p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setClientToUnlink(null)}
                  className="flex-1 py-3 bg-bg-secondary text-text-primary font-bold rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-none hover:bg-glass-border/50 transition-colors">
                  
                  Cancelar
                </button>
                <button
                  onClick={confirmUnlink}
                  className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors">
                  
                  Sí, dar de baja
                </button>
              </div>
            </div>
          </div>
        </div></ModalPortal>
      }

      {clientToRelink && <ModalPortal>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-bg-primary max-w-sm w-full rounded-3xl ring-1 ring-black/5 dark:ring-white/10 border-none p-6 shadow-2xl relative">
            <button
              onClick={() => setClientToRelink(null)}
              className="absolute top-4 right-4 p-2 text-text-secondary hover:text-red-500 bg-bg-secondary rounded-full transition-colors">
              
              <XMarkIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-2 border border-accent/20">
                <LinkIcon className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-text-primary">¿Revincular cliente?</h3>
              <p className="text-text-secondary text-sm">
                Estás a punto de volver a añadir a <strong className="text-text-primary">{clientToRelink.name}</strong> a tu lista de clientes activos. ¿Continuar?
              </p>
              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={() => setClientToRelink(null)}
                  className="flex-1 py-3 bg-bg-secondary text-text-primary font-bold rounded-xl ring-1 ring-black/5 dark:ring-white/10 border-none hover:bg-glass-border/50 transition-colors">
                  
                  Cancelar
                </button>
                <button
                  onClick={confirmRelink}
                  className="flex-1 py-3 bg-accent text-bg-primary font-bold rounded-xl shadow-lg hover:bg-accent/80 transition-colors">
                  
                  Sí, revincular
                </button>
              </div>
            </div>
          </div>
        </div></ModalPortal>
      }

    </div>);

}