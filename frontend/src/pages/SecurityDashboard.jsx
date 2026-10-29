import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import apiClient from '../services/apiClient';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../hooks/useToast';

let cachedSecurityStats = null;
let cachedSecurityLogs = null;
let cachedBlacklist = null;

const isValidIpAddress = (value) => {
  const ip = value.trim();
  const octets = ip.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) {
    return true;
  }
  if (!ip.includes(':')) return false;
  try {
    return new URL(`http://[${ip}]/`).hostname.startsWith('[');
  } catch {
    return false;
  }
};

const SecurityDashboard = ({ onBack }) => {
  const { addToast } = useToast();
  const [stats, setStats] = useState(() => cachedSecurityStats || { 
    totalLogs: 0, 
    blockedIps: 0, 
    totalBlockedIps: 0,
    blockedAttempts: 0,
    failedLogins: 0, 
    successfulLogins: 0, 
    autoBans: 0, 
    chartData: [] 
  });
  const [logs, setLogs] = useState(() => cachedSecurityLogs || []);
  const [blacklist, setBlacklist] = useState(() => cachedBlacklist || []);
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts', 'success', 'blacklist'
  const [timeRange, setTimeRange] = useState(30); // 1, 3, 7, 14, 30
  
  const [newIpToBlock, setNewIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(() => !cachedSecurityStats);
  const [ipToUnblock, setIpToUnblock] = useState(null);
  const [isUnblocking, setIsUnblocking] = useState(false);

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
        activeTab !== 'blacklist' ? apiClient("/admin/security/logs?limit=100&range=" + timeRange + "&type=" + logType) : Promise.resolve([]),
        apiClient('/admin/security/blacklist')
      ]);
      
      cachedSecurityStats = statsRes || { 
        totalLogs: 0, 
        failedLogins: 0, 
        successfulLogins: 0, 
        autoBans: 0, 
        blockedIps: 0, 
        totalBlockedIps: 0, 
        blockedAttempts: 0, 
        chartData: [] 
      };
      setStats(cachedSecurityStats);
      if (activeTab !== 'blacklist') {
        const fetchedLogs = Array.isArray(logsRes) ? logsRes : (Array.isArray(logsRes?.logs) ? logsRes.logs : []);
        cachedSecurityLogs = fetchedLogs;
        setLogs(fetchedLogs);
      }
      const fetchedBlacklist = Array.isArray(blacklistRes) ? blacklistRes : [];
      cachedBlacklist = fetchedBlacklist;
      setBlacklist(fetchedBlacklist);
    } catch (error) {
      console.error('Error fetching security data', error);
      if (activeTab !== 'blacklist') setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async (e) => {
    e.preventDefault();
    const ipAddress = newIpToBlock.trim();
    if (!isValidIpAddress(ipAddress)) {
      addToast('Introduce una dirección IPv4 o IPv6 válida.', 'error');
      return;
    }
    
    try {
      await apiClient('/admin/security/blacklist', {
        method: 'POST',
        body: { ipAddress, reason: blockReason.trim() }
      });
      setNewIpToBlock('');
      setBlockReason('');
      addToast(`IP ${ipAddress} bloqueada correctamente.`, 'success');
      await fetchData();
    } catch (error) {
      console.error('Error blocking IP', error);
      addToast(error?.message || 'No se pudo bloquear la IP.', 'error');
    }
  };

  const handleUnblockIp = (ip) => setIpToUnblock(ip);

  const confirmUnblockIp = async () => {
    if (!ipToUnblock || isUnblocking) return;
    setIsUnblocking(true);
    try {
      await apiClient("/admin/security/blacklist/" + ipToUnblock, { method: 'DELETE' });
      const unblockedIp = ipToUnblock;
      setIpToUnblock(null);
      addToast(`IP ${unblockedIp} desbloqueada correctamente.`, 'success');
      await fetchData();
    } catch (error) {
      console.error('Error unblocking IP', error);
      addToast(error?.message || 'No se pudo desbloquear la IP.', 'error');
    } finally {
      setIsUnblocking(false);
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
          <h2 className="text-xl md:text-2xl font-bold flex whitespace-nowrap tracking-tight items-center gap-2.5 text-text-primary">
            <i className="fa-solid fa-shield-halved text-accent text-2xl"></i>
            Ciberseguridad Avanzada
          </h2>
          <p className="text-sm text-text-secondary">Inteligencia de amenazas, auditoría y bloqueos.</p>
        </div>
        
        <div className="flex gap-2 w-full min-w-0 overflow-x-auto hide-scrollbar py-2 px-1">
          {[1, 3, 7, 14, 30].map(days => (
            <div
              key={days}
              role="button"
              tabIndex={0}
              onClick={() => setTimeRange(days)}
              className={"px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ring-1 flex items-center justify-center cursor-pointer " + (timeRange === days ? 'bg-accent text-accent-contrast ring-accent' : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10')}
            >
              {days === 1 ? '24h' : days + ' Días'}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <i className="fa-solid fa-triangle-exclamation text-red text-xl mb-1.5"></i>
          <span className="text-2xl font-black text-text-primary">{stats.failedLogins ?? 0}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Ataques</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <i className="fa-solid fa-circle-check text-green-500 text-xl mb-1.5"></i>
          <span className="text-2xl font-black text-text-primary">{stats.successfulLogins ?? 0}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Éxitos</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <i className="fa-solid fa-robot text-orange-500 text-xl mb-1.5"></i>
          <span className="text-2xl font-black text-text-primary">{stats.autoBans ?? 0}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">Auto-Bans</span>
        </div>
        <div className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
          <i className="fa-solid fa-ban text-red text-xl mb-1.5"></i>
          <span className="text-2xl font-black text-text-primary">{stats.blockedIps ?? 0}</span>
          <span className="text-[10px] text-text-secondary text-center uppercase tracking-wider font-bold">IPs únicas bloqueadas</span>
          {(stats.blockedAttempts > 0 || stats.totalBlockedIps > 0) && (
            <span className="text-[9px] text-text-secondary text-center font-medium mt-1">
              {stats.blockedAttempts > 0 ? `${stats.blockedAttempts} intentos bloqueados` : ''}
              {stats.blockedAttempts > 0 && stats.totalBlockedIps > 0 ? ' · ' : ''}
              {stats.totalBlockedIps > 0 ? `${stats.totalBlockedIps} en lista` : ''}
            </span>
          )}
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
          className={"flex-1 py-2 rounded-full text-sm font-bold transition-all " + (activeTab === 'success' ? 'bg-accent text-accent-contrast shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary')}
        >
          Auditoría
        </button>
        <button
          onClick={() => setActiveTab('blacklist')}
          className={"flex-1 py-2 rounded-full text-sm font-bold transition-all " + (activeTab === 'blacklist' ? 'bg-accent text-accent-contrast shadow-lg shadow-accent/20' : 'text-text-secondary hover:text-text-primary')}
        >
          Lista Negra {stats.totalBlockedIps ? `(${stats.totalBlockedIps})` : (blacklist.length ? `(${blacklist.length})` : '')}
        </button>
      </div>

      <div className="text-xs text-text-secondary mb-6 px-2 text-center md:text-left font-medium">
        {activeTab === 'alerts' && "Monitorea intentos fallidos de inicio de sesión, honeypot y bloqueos ejecutados."}
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
                      log.eventType === 'AUTO_BAN' || log.eventType === 'AUTO_BAN_SNIFFING' ? 'bg-orange-500/20 text-orange-500' :
                      'bg-red/20 text-red'
                    )}>
                      {log.eventType ? log.eventType.replace(/_/g, ' ') : 'EVENTO'}
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
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-secondary bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
                      <i className="fa-solid fa-globe text-[10px]"></i>
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
              <i className="fa-solid fa-shield-halved text-sm"></i> Bloquear Nueva IP Manualmente
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
                className="w-full bg-red hover:brightness-110 text-white font-bold py-3 rounded-xl transition-all text-sm active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus text-xs"></i> Añadir a Lista Negra
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2 text-text-primary">
              <i className="fa-solid fa-ban text-orange-500 text-sm"></i> IPs en Lista Negra Activa
            </h3>
            <span className="text-xs bg-red/20 text-red px-2.5 py-0.5 rounded-full font-bold">
              {blacklist.length} en total
            </span>
          </div>
          
          <div className="space-y-2">
            {blacklist.length === 0 ? (
              <p className="text-center text-text-secondary py-4 font-medium text-sm">No hay IPs bloqueadas actualmente.</p>
            ) : (
              blacklist.map(item => {
                const isExpired = item.expiresAt && new Date(item.expiresAt) < new Date();
                return (
                  <div key={item.id} className="bg-black/5 dark:bg-white/5 p-4 rounded-2xl flex justify-between items-center ring-1 ring-black/5 dark:ring-white/10">
                    <div>
                      <div className="font-mono text-sm text-text-primary font-bold flex items-center gap-2">
                        {item.ipAddress}
                        {isExpired ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-500/20 text-text-secondary">Expirado</span>
                        ) : item.expiresAt ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">Temporal</span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red/20 text-red">Permanente</span>
                        )}
                      </div>
                      {item.reason && <div className="text-xs text-text-secondary mt-1">{item.reason}</div>}
                      <div className="text-[10px] text-text-secondary mt-1 font-bold uppercase tracking-wider flex items-center gap-3">
                        <span>Bloqueado: {new Date(item.createdAt).toLocaleString()}</span>
                        {item.expiresAt && (
                          <span>Expira: {new Date(item.expiresAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => handleUnblockIp(item.ipAddress)}
                      className="p-2.5 bg-black/5 dark:bg-white/5 hover:bg-red/10 hover:text-red rounded-xl text-text-secondary transition-colors"
                      title="Desbloquear IP"
                    >
                      <i className="fa-solid fa-lock-open text-base"></i>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {ipToUnblock && (
        <ConfirmationModal
          message={`¿Quieres desbloquear la IP ${ipToUnblock}? Podrá volver a acceder a la aplicación.`}
          confirmText="Desbloquear IP"
          cancelText="Cancelar"
          onConfirm={confirmUnblockIp}
          onCancel={() => setIpToUnblock(null)}
          isLoading={isUnblocking}
        />
      )}
    </div>
  );
};

export default SecurityDashboard;
