import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Hand, 
  List, 
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle,
  Globe,
  Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import apiClient from '../services/apiClient';

const SecurityDashboard = ({ onBack }) => {
  const [stats, setStats] = useState({ 
    totalLogs: 0, 
    blockedIps: 0, 
    failedLogins: 0, 
    successfulLogins: 0, 
    autoBans: 0, 
    chartData: [] 
  });
  const [logs, setLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'success', 'blacklist'
  const [timeRange, setTimeRange] = useState(30); // 1, 3, 7, 14, 30
  
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [timeRange, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let logType = 'ALL';
      if (activeTab === 'alerts') logType = 'ALERTS';
      else if (activeTab === 'success') logType = 'SUCCESS';

      const [statsRes, logsRes, blacklistRes] = await Promise.all([
        apiClient("/admin/security/stats?range=" + timeRange),
        activeTab !== 'blacklist' ? apiClient("/admin/security/logs?limit=50&range=" + timeRange + "&type=" + logType) : Promise.resolve([]),
        activeTab === 'blacklist' ? apiClient('/admin/security/blacklist') : Promise.resolve([])
      ]);
      
      setStats(statsRes);
      if (activeTab !== 'blacklist') setLogs(logsRes);
      if (activeTab === 'blacklist') setBlacklist(blacklistRes);
    } catch (error) {
      console.error('Error fetching security data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!newIpToBlock) return;
    
    try {
      await apiClient('/admin/security/blacklist', {
        method: 'POST',
        body: { ipAddress: newIpToBlock, reason: blockReason }
      });
      setNewIpToBlock('');
      setBlockReason('');
      fetchData();
    } catch (error) {
      console.error('Error blocking IP', error);
      alert('Error bloqueando IP');
    }
  };

  const handleUnblockIp = async (ip) => {
    if (!window.confirm("¿Estás seguro de desbloquear la IP " + ip + "?")) return;
    
    try {
      await apiClient("/admin/security/blacklist/" + ip, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error unblocking IP', error);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md p-3 rounded-2xl ring-1 ring-black/10 dark:ring-white/10 shadow-xl">
          <p className="text-xs font-bold text-text-secondary mb-2">{label ? (new Date(label).getDate() + "/" + (new Date(label).getMonth() + 1)) : ""}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs font-medium text-text-primary">{entry.name}:</span>
              <span className="text-xs font-black" style={{ color: entry.color }}>{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatDateAxis = (tickItem) => {
    const date = new Date(tickItem);
    return date.getDate() + '/' + (date.getMonth() + 1);
  };

  return (
    <div className="w-full animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col gap-4 mb-6 w-full min-w-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-bold flex whitespace-nowrap tracking-tight items-center gap-2 text-text-primary">
            <ShieldCheck size={28} className="text-accent" />
            Ciberseguridad Avanzada
          </h2>
          <p className="text-sm text-text-secondary">Inteligencia de amenazas, auditoría y bloqueos.</p>
        </div>
        
        <div className="flex gap-2 w-full min-w-0 overflow-x-auto hide-scrollbar py-2 px-2">
          {[1, 3, 7, 14, 30].map(days => (
            <div
              key={days}
              role="button"
              tabIndex={0}
              onClick={() => setTimeRange(days)}
              className={"px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ring-1 flex items-center justify-center cursor-pointer " + (timeRange === days ? 'bg-accent text-white ring-accent' : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10')}
            >
              {days === 1 ? '24h' : days + ' Días'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <ShieldAlert size={20} className="text-red mb-1" />
          <span className="text-2xl font-black text-text-primary">{stats.failedLogins}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Ataques</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <CheckCircle size={20} className="text-green-500 mb-1" />
          <span className="text-2xl font-black text-text-primary">{stats.successfulLogins}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Éxitos</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <AlertCircle size={20} className="text-orange-500 mb-1" />
          <span className="text-2xl font-black text-text-primary">{stats.autoBans}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Auto-Bans</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <Hand size={20} className="text-red mb-1" />
          <span className="text-2xl font-black text-text-primary">{stats.blockedIps}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">IPs Bloqueadas</span>
        </div>
      </div>

      <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 mb-6 h-[250px] w-full">
        {loading && stats.chartData.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">Cargando gráfico...</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.2)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDateAxis} tick={{fontSize: 10, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <YAxis tick={{fontSize: 10, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'var(--text-secondary)', opacity: 0.1 }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="success" name="Éxitos" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="failure" name="Ataques" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full mb-2 ring-1 ring-black/5 dark:ring-white/10">
        <button
          onClick={() => setActiveTab('alerts')}
          className={"flex-1 py-2 rounded-full text-sm font-bold transition-all " + (activeTab === 'alerts' ? 'bg-red text-white shadow-lg shadow-red/20' : 'text-text-secondary hover:text-text-primary')}
        >
          Alertas
        </button>
        <button
          onClick={() => setActiveTab('success')}
          className={"flex-1 py-2 rounded-full text-sm font-bold transition-all " + (activeTab === 'success' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary')}
        >
          Auditoría
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={"flex-1 py-2 rounded-full text-sm font-bold transition-all " + (activeTab === 'blacklist' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary')}
        >
          Lista Negra
        </button>
      </div>

      <div className="text-xs text-text-secondary mb-6 px-2 text-center md:text-left font-medium">
        {activeTab === 'alerts' && "Monitorea intentos fallidos de inicio de sesión y bloqueos automáticos (fuerza bruta)."}
        {activeTab === 'success' && "Historial de accesos autorizados. Verifica quién y desde dónde ha entrado correctamente."}
        {activeTab === 'blacklist' && "Direcciones IP bloqueadas manual o automáticamente. No pueden acceder a la app."}
      </div>

      {loading && <div className="text-center text-text-secondary py-8 font-medium">Actualizando datos...</div>}
      
      {!loading && (activeTab === 'alerts' || activeTab === 'success') && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-center text-text-secondary py-8 font-medium">No hay registros para este período.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className={"text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider " + (
                      log.eventType === 'LOGIN_SUCCESS' ? 'bg-green-500/20 text-green-500' :
                      log.eventType === 'AUTO_BAN' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-red/20 text-red'
                    )}>
                      {log.eventType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-text-secondary font-bold uppercase">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-text-primary font-medium">{log.details}</div>
                </div>
                
                <div className="flex flex-wrap md:flex-col gap-2 md:gap-1 md:items-end shrink-0 md:min-w-[150px]">
                  <div className="text-xs text-text-secondary font-mono bg-black/10 dark:bg-white/10 px-2 py-1 rounded-lg">
                    {log.ipAddress}
                  </div>
                  {(log.country || log.city) && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
                      <Globe size={10} />
                      {log.city ? log.city + ', ' : ''}{log.country || 'Desconocido'}
                    </div>
                  )}
                  {log.userId && (
                    <div className="text-[10px] font-bold text-accent">USER ID: {log.userId}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && activeTab === 'blacklist' && (
        <div className="space-y-4">
          <form onSubmit={handleBlockIp} className="bg-red/5 p-5 rounded-2xl ring-1 ring-red/20 mb-6">
            <h3 className="text-sm font-bold text-red mb-4 flex items-center gap-2">
              <Lock size={16} /> Bloquear Nueva IP Manualmente
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Dirección IP (ej. 192.168.1.1)" 
                value={newIpToBlock}
                onChange={e => setNewIpToBlock(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-text-primary font-mono outline-none"
                required
              />
              <input 
                type="text" 
                placeholder="Motivo (opcional)" 
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-text-primary outline-none"
              />
              <button 
                type="submit"
                className="w-full bg-red hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95"
              >
                Añadir a Lista Negra
              </button>
            </div>
          </form>

          <h3 className="font-bold mb-3 flex items-center gap-2 text-text-primary">
            <AlertCircle size={18} className="text-orange-500" /> IPs Bloqueadas (Manual y Auto)
          </h3>
          
          <div className="space-y-2">
            {blacklist.length === 0 ? (
              <p className="text-center text-text-secondary py-4 font-medium text-sm">No hay IPs bloqueadas actualmente.</p>
            ) : (
              blacklist.map(item => (
                <div key={item.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center ring-1 ring-black/5 dark:ring-white/10">
                  <div>
                    <div className="font-mono text-sm text-text-primary font-bold">{item.ipAddress}</div>
                    {item.reason && <div className="text-xs text-text-secondary mt-1">{item.reason}</div>}
                    <div className="text-[10px] text-text-secondary mt-1 font-bold uppercase tracking-wider">
                      Bloqueado: {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleUnblockIp(item.ipAddress)}
                    className="p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl text-text-secondary transition-colors"
                    title="Desbloquear IP"
                  >
                    <Unlock size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;









