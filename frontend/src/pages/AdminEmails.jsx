import React, { useState, useEffect } from 'react';
import { 
  Mail, History, CheckCircle2, XCircle, Search, Users, ChevronLeft, ChevronRight, Activity, Calendar
} from 'lucide-react';
import { getEmailLogs, getEmailStats } from '../services/adminService';
import { useToast } from '../hooks/useToast';
import CustomSelect from '../components/CustomSelect';

const AdminEmails = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRange, setFilterRange] = useState(30);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [filterStatus, filterRange, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRes = await getEmailLogs({
        status: filterStatus,
        range: filterRange,
        page,
        limit: 20
      });
      setLogs(logsRes.logs);
      setTotalPages(logsRes.totalPages);

      const statsRes = await getEmailStats({ range: filterRange });
      setStats(statsRes);
    } catch (err) {
      addToast('Error al cargar historial de correos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('es-ES', { 
      day: '2-digit', month: '2-digit', year: '2-digit', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex flex-col">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
                  <History size={24} className="text-accent shrink-0" />
                  Historial de Correos
                </h2>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full bg-black/5 dark:bg-white/5 p-3 rounded-2xl border border-glass-border">
            <div className="flex-1">
              <CustomSelect
                options={[
                  { value: 'all', label: <span className="flex items-center gap-2"><Search size={16} /> Todos los estados</span> },
                  { value: 'sent', label: <span className="flex items-center gap-2 text-green-500"><CheckCircle2 size={16} /> Enviados</span> },
                  { value: 'failed', label: <span className="flex items-center gap-2 text-red-500"><XCircle size={16} /> Fallidos</span> }
                ]}
                value={filterStatus}
                onChange={(val) => { setFilterStatus(val); setPage(1); }}
                placeholder="Estado"
              />
            </div>
            
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex gap-2 w-full min-w-0 overflow-x-auto no-scrollbar py-1">
                {[1, 3, 7, 14, 30].map(days => (
                  <div
                    key={days}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setFilterRange(days); setPage(1); }}
                    className={"px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ring-1 flex items-center justify-center cursor-pointer " + (filterRange === days ? 'bg-accent text-white ring-accent shadow-lg shadow-accent/20' : 'bg-black/5 dark:bg-white/5 ring-black/5 dark:ring-white/10 text-text-secondary hover:bg-black/10 dark:hover:bg-white/10')}
                  >
                    {days === 1 ? 'Últimas 24h' : \Últimos \ Días\}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-black/5 dark:bg-white/5 p-5 rounded-2xl flex flex-col items-center justify-center ring-1 ring-black/5 dark:ring-white/10">
              <span className="text-3xl font-black text-text-primary">{stats.total}</span>
              <span className="text-xs text-text-secondary font-bold mt-1 uppercase tracking-wider">Total Enviados</span>
            </div>
            <div className="bg-green-500/5 p-5 rounded-2xl flex flex-col items-center justify-center ring-1 ring-green-500/20">
              <span className="text-3xl font-black text-green-500">{stats.success}</span>
              <span className="text-xs text-green-500/70 font-bold mt-1 uppercase tracking-wider">Exitosos</span>
            </div>
            <div className="bg-red-500/5 p-5 rounded-2xl flex flex-col items-center justify-center ring-1 ring-red-500/20">
              <span className="text-3xl font-black text-red-500">{stats.failed}</span>
              <span className="text-xs text-red-500/70 font-bold mt-1 uppercase tracking-wider">Fallidos</span>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-black/5 dark:bg-white/5 rounded-2xl border border-glass-border">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-text-secondary uppercase bg-black/5 dark:bg-white/5 border-b border-glass-border">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-bold">Estado</th>
                <th scope="col" className="px-4 py-3 font-bold">Destinatario</th>
                <th scope="col" className="px-4 py-3 font-bold">Asunto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center">
                    <Activity className="w-8 h-8 animate-spin text-accent mx-auto" />
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-text-muted">
                    No se encontraron correos para este filtro.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-glass-border last:border-0">
                    <td className="px-4 py-4 text-text-secondary whitespace-nowrap">
                      {formatDate(log.sent_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 size={14} /> Exitoso
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                          <XCircle size={14} /> Fallido
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-text-primary whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-text-muted" />
                        {log.recipient_email}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-text-primary min-w-[200px]">
                      {log.subject}
                      {log.error_message && (
                        <div className="mt-1 text-xs text-red-400 bg-red-400/10 p-1.5 rounded border border-red-400/20 truncate max-w-xs">
                          {log.error_message}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 transition-colors border border-glass-border"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <span className="text-sm font-bold text-text-secondary">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50 transition-colors border border-glass-border"
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmails;
