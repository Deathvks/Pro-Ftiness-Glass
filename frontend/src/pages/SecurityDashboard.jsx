import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Hand, 
  List, 
  Lock,
  Unlock,
  AlertCircle,
  ChevronLeft,
  X,
  Search
} from 'lucide-react';
import apiClient from '../services/apiClient';

const SecurityDashboard = ({ onBack }) => {
  const [stats, setStats] = useState({ totalLogs: 0, blockedIps: 0, failedLoginsToday: 0 });
  const [logs, setLogs] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' o 'blacklist'
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, blacklistRes] = await Promise.all([
        apiClient('/admin/security/stats'),
        apiClient('/admin/security/logs?limit=50'),
        apiClient('/admin/security/blacklist')
      ]);
      
      setStats(statsRes);
      setLogs(logsRes);
      setBlacklist(blacklistRes);
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
    if (!window.confirm(`¿Estás seguro de desbloquear la IP ${ip}?`)) return;
    
    try {
      await apiClient(`/admin/security/blacklist/${ip}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error unblocking IP', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-text-secondary font-medium">Cargando datos de seguridad...</div>;
  }

  return (
    <div className="w-full animate-[fade-in_0.3s_ease-out]">
      {/* HEADER */}
      <div className="flex flex-col gap-1 mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-text-primary">
          <ShieldCheck size={28} className="text-accent" />
          Ciberseguridad
        </h2>
        <p className="text-sm text-text-secondary">Monitorización, accesos bloqueados y eventos del servidor.</p>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <ShieldAlert size={24} className="text-red-500 mb-2" />
          <span className="text-2xl font-black text-text-primary">{stats.failedLoginsToday}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Fallos (24h)</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <Hand size={24} className="text-orange-500 mb-2" />
          <span className="text-2xl font-black text-text-primary">{stats.blockedIps}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">IPs Bloqueadas</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <List size={24} className="text-accent mb-2" />
          <span className="text-2xl font-black text-text-primary">{stats.totalLogs}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Logs Totales</span>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-full mb-6 ring-1 ring-black/5 dark:ring-white/10">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'logs' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Últimos Eventos
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
            activeTab === 'blacklist' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          Lista Negra (IPs)
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          {logs.length === 0 ? (
            <p className="text-center text-text-secondary py-8 font-medium">No hay registros de seguridad recientes.</p>
          ) : (
            logs.map(log => (
              <div key={log.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl ring-1 ring-black/5 dark:ring-white/10">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-md ${
                    log.eventType.includes('FAILED') || log.eventType.includes('BLOCKED') 
                      ? 'bg-red-500/20 text-red-500' 
                      : 'bg-accent/20 text-accent'
                  }`}>
                    {log.eventType}
                  </span>
                  <span className="text-[10px] text-text-secondary font-bold uppercase">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-text-primary font-medium mb-3">{log.details}</div>
                <div className="flex justify-between items-end">
                  <div className="text-xs text-text-secondary font-mono bg-black/10 dark:bg-white/10 px-2 py-1.5 rounded-lg font-medium">
                    IP: {log.ipAddress}
                  </div>
                  {log.userId && (
                    <div className="text-xs text-text-secondary font-bold">Usuario ID: {log.userId}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'blacklist' && (
        <div className="space-y-4">
          {/* Add to blacklist form */}
          <form onSubmit={handleBlockIp} className="bg-red-500/5 p-5 rounded-2xl ring-1 ring-red-500/20 mb-6">
            <h3 className="text-sm font-bold text-red-500 mb-4 flex items-center gap-2">
              <Lock size={16} /> Bloquear Nueva IP
            </h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Dirección IP (ej. 192.168.1.1)" 
                value={newIpToBlock}
                onChange={e => setNewIpToBlock(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-accent focus:outline-none font-mono"
                required
              />
              <input 
                type="text" 
                placeholder="Motivo (opcional)" 
                value={blockReason}
                onChange={e => setBlockReason(e.target.value)}
                className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-text-primary focus:ring-2 focus:ring-accent focus:outline-none"
              />
              <button 
                type="submit"
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors text-sm"
              >
                Añadir a Lista Negra
              </button>
            </div>
          </form>

          {/* Blacklisted IPs */}
          <h3 className="font-bold mb-3 flex items-center gap-2 text-text-primary">
            <AlertCircle size={18} className="text-orange-500" /> IPs Bloqueadas
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
                      Bloqueado: {new Date(item.createdAt).toLocaleDateString()}
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
