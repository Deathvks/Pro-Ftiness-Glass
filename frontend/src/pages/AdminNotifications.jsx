import React, { useState, useEffect } from 'react';
import { 
  Bell, History, Send, Clock, CheckCircle2, XCircle, 
  Search, Users, MessageSquare, Link, ChevronLeft, ChevronRight, Activity, Globe, User, RefreshCw,
  Home, Dumbbell, TrendingUp, Utensils, Trophy, Play
} from 'lucide-react';
import { getAllUsers, getPushLogs, sendCustomPush, getCronJobs } from '../services/adminService';
import { useToast } from '../hooks/useToast';
import CustomSelect from '../components/CustomSelect';
import UserAvatar from '../components/UserAvatar';

const AdminNotifications = () => {
  const [activeTab, setActiveTab] = useState('history');
  const { showToast } = useToast();
  
  // History State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [titleFilter, setTitleFilter] = useState('');
  const [timeRange, setTimeRange] = useState(30);
  
  // Send State
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    url: '',
    target_user_id: 'ALL'
  });
  const [sending, setSending] = useState(false);
  
  // Cron State
  const [cronJobs, setCronJobs] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let interval;
    if (activeTab === 'history') {
      fetchLogs(true);
      interval = setInterval(() => fetchLogs(false), 10000); // 10s silent polling
    }
    if (activeTab === 'cron') fetchCronList();
    
    return () => {
      if (interval) clearInterval(interval);
    }
  }, [activeTab, page, statusFilter, titleFilter, timeRange]);

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast('Error cargando usuarios', 'error');
    }
  };

  const fetchLogs = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoadingLogs(true);
      const data = await getPushLogs(page, statusFilter, titleFilter, timeRange);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error(err);
      if (showSpinner) showToast('Error cargando historial de notificaciones', 'error');
    } finally {
      if (showSpinner) setLoadingLogs(false);
    }
  };

  const fetchCronList = async () => {
    try {
      const data = await getCronJobs();
      setCronJobs(data);
    } catch (err) {
      console.error(err);
      showToast('Error cargando tareas automáticas', 'error');
    }
  };

  const handleSendPush = async (e) => {
    e.preventDefault();
    if (!formData.target_user_id) {
      showToast("Por favor, selecciona un destinatario", "error");
      return;
    }
    if (!formData.title?.trim() || !formData.message?.trim()) {
      showToast("El título y mensaje no pueden estar vacíos", "error");
      return;
    }
    
    setSending(true);
    try {
      const data = await sendCustomPush(formData);
      showToast(data.message || 'Notificación enviada', 'success');
      setFormData({ title: '', message: '', url: '', target_user_id: 'ALL' });
      setActiveTab('history');
      setPage(1);
      fetchLogs();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error enviando la notificación', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleTestCron = async (jobId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/cron-jobs/test/${jobId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Error en el test del cron');
      
      showToast(data.message, 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    }
  };

  const statusOptions = [
    { value: 'all', label: <span className="flex items-center gap-2"><Search size={16} /> Todos</span> },
    { value: 'success', label: <span className="flex items-center gap-2 text-green-500"><CheckCircle2 size={16} /> Exitosas</span> },
    { value: 'error', label: <span className="flex items-center gap-2 text-red-500"><XCircle size={16} /> Errores</span> }
  ];

  const userOptions = [
    { value: 'ALL', label: <span className="flex items-center gap-2 font-bold"><Globe size={16} className="text-accent" /> TODOS LOS USUARIOS</span>, searchText: 'todos los usuarios' },
    ...users.map(u => ({ 
      value: String(u.id), 
      label: (
        <span className="flex items-center gap-2">
          <UserAvatar user={u} size={6} className="shrink-0 ring-1 ring-black/10 dark:ring-white/10" /> 
          @{u.username}
        </span>
      ),
      searchText: `${u.username} ${u.email}`
    }))
  ];

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      
      {/* Contenedor de Pestañas (Scrollable en móviles) */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 snap-x p-1">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap snap-center ${
            activeTab === 'history' 
            ? 'bg-accent shadow-lg shadow-accent/20 text-white' 
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <History size={16} /> Historial
        </button>
        <button
          onClick={() => setActiveTab('send')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap snap-center ${
            activeTab === 'send' 
            ? 'bg-accent shadow-lg shadow-accent/20 text-white' 
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <Send size={16} /> Enviar Nueva
        </button>
        <button
          onClick={() => setActiveTab('cron')}
          className={`flex-1 min-w-[140px] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap snap-center ${
            activeTab === 'cron' 
            ? 'bg-accent shadow-lg shadow-accent/20 text-white' 
            : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10'
          }`}
        >
          <Clock size={16} /> Programadas
        </button>
      </div>

      {/* HISTORIAL TAB */}
      {activeTab === 'history' && (
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                    <History size={24} className="text-accent shrink-0" />
                    Historial Push
                  </h2>
                  <button 
                    onClick={() => fetchLogs(true)} 
                    className="p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-text-secondary hover:text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0"
                    title="Recargar datos"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                {titleFilter && (
                  <div className="flex items-center gap-2 text-sm text-text-secondary bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full w-fit mt-2">
                    <span>Filtrando por tarea: <strong>{titleFilter}</strong></span>
                    <button onClick={() => setTitleFilter('')} className="hover:text-red-500 transition-colors ml-1">
                      <XCircle size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-56 shrink-0">
                <CustomSelect
                  value={statusFilter}
                  onChange={(val) => { setStatusFilter(val); setPage(1); }}
                  options={statusOptions}
                  placeholder="Filtrar por estado"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full min-w-0 overflow-x-auto no-scrollbar py-1">
              {[1, 3, 7, 14, 30].map(days => (
                <div
                  key={days}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setTimeRange(days); setPage(1); }}
                  className={"px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ring-1 flex items-center justify-center cursor-pointer " + (timeRange === days ? 'bg-accent text-white ring-accent shadow-lg shadow-accent/20' : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10')}
                >
                  {days === 1 ? 'Últimas 24h' : `Últimos ${days} Días`}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-black/5 dark:bg-white/5 text-text-secondary uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Fecha</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3 rounded-r-xl">Detalle Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {loadingLogs ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-text-muted">Cargando historial...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-text-muted">No hay registros para este filtro.</td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 text-text-secondary">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                            <CheckCircle2 size={14} /> Éxito
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            <XCircle size={14} /> Error
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded-md text-text-secondary">
                          {log.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-text-primary">
                        {log.User ? `@${log.User.username}` : `ID: ${log.user_id}`}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-text-primary">{log.title}</div>
                        <div className="text-xs text-text-secondary truncate max-w-[200px]">{log.body}</div>
                      </td>
                      <td className="px-4 py-4 text-xs text-red-400 font-mono max-w-[250px] truncate" title={log.error_message}>
                        {log.error_message || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-glass-border">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-black/10 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-text-secondary">Página {page} de {totalPages || 1}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-bg-secondary text-text-secondary disabled:opacity-50 hover:bg-black/10 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ENVIAR NUEVA TAB */}
      {activeTab === 'send' && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
            <Send size={24} className="text-accent" />
            Redactar Notificación Push
          </h2>
          
          <form onSubmit={handleSendPush} className="flex flex-col gap-5 mt-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                <Users size={16} /> Destinatario
              </label>
              <CustomSelect
                value={formData.target_user_id}
                onChange={val => setFormData({...formData, target_user_id: val})}
                options={userOptions}
                placeholder="Seleccionar destinatario..."
                searchable
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                <MessageSquare size={16} /> Título
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ej: ¡Nueva Actualización!"
                className="bg-bg-secondary border border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                <Bell size={16} /> Mensaje
              </label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                placeholder="Escribe el cuerpo de la notificación..."
                rows={3}
                className="bg-bg-secondary border border-transparent dark:border-white/10 rounded-xl px-4 py-3 text-text-primary focus:ring-2 focus:ring-accent outline-none resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col">
                <label className="text-sm font-bold text-text-secondary flex items-center gap-2">
                  <Link size={16} /> Enlace al tocar (Opcional)
                </label>
                <span className="text-[11px] text-text-secondary/80 ml-6 mt-0.5">
                  Escribe la ruta interna donde quieres que la app redirija al usuario cuando abra la notificación.
                </span>
              </div>
              <CustomSelect
                value={formData.url}
                onChange={val => setFormData({...formData, url: val})}
                options={[
                  { value: '', label: <span className="font-bold text-text-secondary">Ninguno (No redirigir)</span> },
                  { value: '/', label: <span className="flex items-center gap-2"><Home size={16} /> Hub Principal (Inicio)</span> },
                  { value: '/routines', label: <span className="flex items-center gap-2"><Dumbbell size={16} /> Panel de Entrenamiento</span> },
                  { value: '/progress', label: <span className="flex items-center gap-2"><TrendingUp size={16} /> Gráficas de Progreso</span> },
                  { value: '/social', label: <span className="flex items-center gap-2"><Globe size={16} /> Comunidad y Amigos</span> },
                  { value: '/nutrition', label: <span className="flex items-center gap-2"><Utensils size={16} /> Nutrición</span> },
                  { value: '/profile', label: <span className="flex items-center gap-2"><User size={16} /> Perfil de Usuario</span> },
                  { value: '/challenges', label: <span className="flex items-center gap-2"><Trophy size={16} /> Retos</span> },
                  { value: '/notifications', label: <span className="flex items-center gap-2"><Bell size={16} /> Centro de Notificaciones</span> }
                ]}
                placeholder="Seleccionar destino..."
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="mt-4 flex items-center justify-center gap-2 bg-accent text-bg-secondary font-extrabold py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
            >
              {sending ? (
                <div className="w-6 h-6 border-2 border-bg-secondary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} strokeWidth={2.5} />
                  Enviar Notificación {formData.target_user_id === 'ALL' ? 'a Todos' : ''}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* CRON JOBS TAB */}
      {activeTab === 'cron' && (
        <div>
          <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
            <Clock size={24} className="text-accent" />
            Notificaciones Programadas
          </h2>
          <p className="text-sm text-text-secondary mb-6 mt-2 ml-1">
            Estas notificaciones se generan automáticamente en el servidor (Cron Jobs) a las horas indicadas para la zona horaria de cada usuario.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cronJobs.map(job => (
              <div 
                key={job.id} 
                onClick={() => {
                  if (job.pushTitle) {
                    setTitleFilter(job.pushTitle);
                    setActiveTab('history');
                  }
                }}
                className="text-left p-5 bg-black/5 dark:bg-white/5 border border-glass-border rounded-2xl flex flex-col gap-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-[0.98] ring-1 ring-transparent hover:ring-accent/50 cursor-pointer"
              >
                <div className="flex justify-between items-start w-full gap-2">
                  <h3 className="font-bold text-lg text-text-primary flex-1">{job.name}</h3>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="bg-green-500/10 text-green-500 border border-green-500/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                      <Activity size={12} /> Activo
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestCron(job.id);
                      }}
                      className="bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 shrink-0 hover:bg-accent/20 active:scale-95 transition-all"
                    >
                      <Play size={12} fill="currentColor" /> Test
                    </button>
                  </div>
                </div>
                
                <div className="text-sm font-bold text-accent flex flex-col gap-1">
                  <span className="flex items-center gap-1.5"><Clock size={16} /> {job.schedule}</span>
                  <span className="flex items-center gap-1.5 opacity-80"><Activity size={16} /> Frecuencia: {job.frequency || 'Automática'}</span>
                </div>
                
                <p className="text-sm text-text-secondary leading-relaxed mt-1">
                  {job.description}
                </p>

                <div className="flex flex-col gap-1.5 mt-2 bg-black/5 dark:bg-white/5 p-3 rounded-xl border border-transparent dark:border-white/5">
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1.5">
                    <History size={12} /> Último Envío
                  </span>
                  {job.lastRunAt ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-primary">
                        {new Date(job.lastRunAt).toLocaleString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${job.lastRunStatus === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {job.lastRunStatus === 'success' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {job.lastRunStatus === 'success' ? 'Éxito' : 'Error'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-text-secondary">Nunca o no registrado</span>
                  )}
                </div>

                <div className="text-xs font-bold text-text-muted mt-2 pt-3 border-t border-glass-border flex items-center gap-1.5 w-full">
                  <Search size={14} /> Toca para ver su historial de envíos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminNotifications;
