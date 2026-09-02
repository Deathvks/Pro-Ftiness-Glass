import React, { useState } from 'react';
import { ChevronLeftIcon, CheckIcon, MagnifyingGlassIcon, LinkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import AnamnesisForm from './AnamnesisForm';
import UserAvatar from '../UserAvatar';
import { useToast } from '../../hooks/useToast';

export default function AddClientFlow({ onBack }) {
  const [mode, setMode] = useState('create'); // 'create' | 'link'
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    surname1: '',
    surname2: ''
  });

  const [createdClient, setCreatedClient] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.surname1.trim() || !formData.surname2.trim()) {
      addToast('Por favor, rellena todos los campos (nombre y apellidos).', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient('/trainer/clients', { method: 'POST', body: formData });
      setCreatedClient(res.client);
      setStep(2);
      addToast('Cliente creado con éxito', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al crear el cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillRandomData = () => {
    const names = ['Carlos', 'María', 'Alejandro', 'Lucía', 'Javier', 'Carmen', 'Daniel', 'Laura'];
    const surnames = ['García', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Ruiz'];
    
    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomSurname1 = surnames[Math.floor(Math.random() * surnames.length)];
    const randomSurname2 = surnames[Math.floor(Math.random() * surnames.length)];

    setFormData({
      name: randomName,
      surname1: randomSurname1,
      surname2: randomSurname2
    });
  };

  const handleSearch = async (query = '') => {
    setSearchQuery(query);
    if (query.length > 0 && query.length < 3) {
      // Waiting for more characters
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await apiClient(`/trainer/users/search?q=${encodeURIComponent(query)}`, { method: 'GET' });
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  React.useEffect(() => {
    if (mode === 'link' && searchResults.length === 0) {
      handleSearch('');
    }
  }, [mode]);

  const handleLink = async (user) => {
    try {
      await apiClient(`/trainer/clients/${user.id}/link`, { method: 'PUT' });
      addToast('Usuario vinculado con éxito', 'success');
      setCreatedClient(user);
      setStep(2);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al vincular el usuario', 'error');
    }
  };

  if (step === 2 && createdClient) {
    return <AnamnesisForm client={createdClient} onFinish={onBack} />;
  }

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] md:pb-0 animate-fade-in overflow-y-auto flex flex-col">
      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-lg w-full mx-auto flex flex-col flex-1 space-y-6 md:space-y-8">
        
        {/* CABECERA */}
        <div className="flex items-center w-full mb-4 md:mb-8">
          <button 
            onClick={onBack} 
            className="w-10 h-10 shrink-0 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex items-center justify-center text-text-secondary hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <h1 className="flex-1 text-2xl md:text-3xl font-extrabold tracking-tight text-text-primary text-center">
            Nuevo Cliente
          </h1>
          
          <div className="w-10 shrink-0"></div>
        </div>

        {/* CONTENEDOR CENTRAL DEL FORMULARIO */}
        <div className="w-full flex flex-col">
          <div className="bg-bg-primary/50 backdrop-blur-md rounded-3xl p-5 sm:p-8 border border-glass-border shadow-2xl shadow-black/5 dark:shadow-white/5 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-[50px] pointer-events-none"></div>

            {/* Pestañas Crear / Vincular */}
            <div className="flex gap-2 bg-bg-secondary p-1.5 rounded-[20px] border border-glass-border mb-8 relative z-10">
              <button 
                onClick={() => setMode('create')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold rounded-2xl transition-all ${mode === 'create' ? 'bg-accent text-bg-primary shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}
              >
                <UserPlusIcon className="w-5 h-5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Crear Nuevo</span>
                <span className="sm:hidden">Crear</span>
              </button>
              <button 
                onClick={() => setMode('link')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 font-bold rounded-2xl transition-all ${mode === 'link' ? 'bg-accent text-bg-primary shadow-md' : 'text-text-secondary hover:text-text-primary hover:bg-glass-border/30'}`}
              >
                <LinkIcon className="w-5 h-5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Vincular Existente</span>
                <span className="sm:hidden">Vincular</span>
              </button>
            </div>

            <div className="relative z-10">
              {mode === 'create' ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                    <p className="text-text-secondary text-sm flex-1">
                      El usuario se generará automáticamente y la contraseña será <strong>123456</strong>.
                    </p>
                    <button 
                      type="button" 
                      onClick={fillRandomData}
                      className="text-xs px-4 py-2 bg-accent text-bg-primary rounded-xl font-bold hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 shrink-0 w-fit self-start"
                    >
                      Datos de Prueba
                    </button>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-4" noValidate>
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Nombre</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Primer Apellido</label>
                      <input
                        type="text"
                        value={formData.surname1}
                        onChange={e => setFormData({ ...formData, surname1: e.target.value })}
                        className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-inner"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Segundo Apellido</label>
                      <input
                        type="text"
                        value={formData.surname2}
                        onChange={e => setFormData({ ...formData, surname2: e.target.value })}
                        className="w-full p-3.5 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-inner"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-6 flex items-center justify-center gap-2 p-4 bg-accent text-bg-primary font-extrabold rounded-2xl active:scale-95 transition-all disabled:opacity-50 shadow-xl shadow-accent/20 hover:shadow-accent/40"
                    >
                      {loading ? 'Creando...' : 'Crear y Continuar'}
                      {!loading && <CheckIcon className="w-5 h-5 stroke-2" />}
                    </button>
                  </form>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">Busca un usuario existente en la plataforma por su nombre, usuario o email para vincularlo a tu equipo.</p>
            
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Escribe al menos 3 letras..." 
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-bg-secondary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>

            <div className="mt-4">
              {isSearching ? (
                <div className="flex justify-center p-4">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map(user => (
                    <div key={user.id} className="p-3 glass rounded-xl border border-glass-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={user} size={10} className="shrink-0" />
                    <div>
                      <p className="font-bold text-text-primary">{user.name}</p>
                      <p className="text-sm text-text-secondary">@{user.username}</p>
                    </div>
                  </div>
                      <button
                        onClick={() => handleLink(user)}
                        className="w-full sm:w-auto px-4 py-2 bg-accent/10 text-accent border border-accent/30 font-bold rounded-xl hover:bg-accent hover:text-bg-primary transition-all active:scale-95"
                      >
                        Vincular
                      </button>
                    </div>
                  ))}
                </div>
              ) : searchQuery.length > 0 && searchQuery.length < 3 ? (
                <p className="text-text-secondary text-sm text-center p-4 glass rounded-xl">Escribe al menos 3 letras para buscar...</p>
              ) : (
                <p className="text-text-secondary text-sm text-center p-4 glass rounded-xl">No hay usuarios disponibles en este momento.</p>
              )}
            </div>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
