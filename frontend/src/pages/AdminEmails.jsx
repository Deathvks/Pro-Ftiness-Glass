import React, { useState, useEffect } from 'react';
import { 
  Mail, History, Clock, CheckCircle2, XCircle, 
  Search, Users, ChevronLeft, ChevronRight, Activity, Calendar
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
  const [filterRange, setFilterRange] = useState('30');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Mail className="w-6 h-6 text-accent" />
          Historial de Correos Electrónicos
        </h2>
      </div>

      <div className="bg-bg-secondary p-4 rounded-xl border border-glass-border">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1 font-bold uppercase">Estado</label>
            <CustomSelect
              options={[
                { value: 'all', label: 'Todos los estados' },
                { value: 'sent', label: 'Enviados' },
                { value: 'failed', label: 'Fallidos' }
              ]}
              value={filterStatus}
              onChange={(val) => { setFilterStatus(val); setPage(1); }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1 font-bold uppercase">Periodo</label>
            <CustomSelect
              options={[
                { value: '1', label: 'Últimas 24 horas' },
                { value: '3', label: 'Últimos 3 días' },
                { value: '7', label: 'Últimos 7 días' },
                { value: '30', label: 'Últimos 30 días' },
                { value: '90', label: 'Últimos 90 días' }
              ]}
              value={filterRange}
              onChange={(val) => { setFilterRange(val); setPage(1); }}
            />
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/20 p-4 rounded-xl border border-glass-border flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-text-primary">{stats.total}</span>
              <span className="text-xs text-text-muted uppercase font-bold mt-1">Total Enviados</span>
            </div>
            <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-green-500">{stats.success}</span>
              <span className="text-xs text-green-500/70 uppercase font-bold mt-1">Exitosos</span>
            </div>
            <div className="bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-red-500">{stats.failed}</span>
              <span className="text-xs text-red-500/70 uppercase font-bold mt-1">Fallidos</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Activity className="w-8 h-8 animate-spin text-accent" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-black/10 rounded-xl border border-glass-border">
            <History className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-bold text-text-primary">No hay registros</h3>
            <p className="text-sm text-text-muted">No se encontraron correos para este filtro.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="bg-bg-primary/50 p-4 rounded-xl border border-glass-border flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(log.status)}
                    <span className="font-bold text-sm truncate">{log.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Users className="w-3 h-3" />
                    <span className="truncate">{log.recipient_email}</span>
                  </div>
                  {log.error_message && (
                    <div className="mt-2 text-xs text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
                      Error: {log.error_message}
                    </div>
                  )}
                </div>
                <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-center sm:items-end gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-glass-border pt-3 sm:pt-0 sm:pl-4">
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    <Calendar className="w-3 h-3" />
                    {formatDate(log.sent_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-bg-primary border border-glass-border disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-bg-primary border border-glass-border disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEmails;
