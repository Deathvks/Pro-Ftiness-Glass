import React, { useState, useEffect } from 'react';
import { Cloud } from 'lucide-react';
import apiClient from '../services/apiClient';
import { useToast } from '../hooks/useToast';

export default function AdminUploads() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient('/admin/upload-logs');
      setLogs(res);
    } catch (e) {
      console.error(e);
      addToast('Error al cargar historial', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-extrabold text-text-primary mb-2">Historial de Subidas</h2>
      <p className="text-text-secondary font-medium text-sm mb-6">Registro de archivos y vídeos enviados al chat.</p>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="space-y-4">
          {logs.map(log => (
            <div key={log.id} className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-text-primary">{log.file_name}</p>
                  <p className="text-xs text-text-secondary">ID Usuario: {log.uploader_id} | Fecha: {new Date(log.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  {log.status === 'success' ? (
                    <span className="text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded-full">Subido correctamente</span>
                  ) : (
                    <span className="text-red font-bold text-xs bg-red/10 px-2 py-1 rounded-full">Error de subida</span>
                  )}
                </div>
              </div>
              {log.status === 'error' && log.error_message && (
                <div className="mt-3 p-3 bg-red/10 rounded-lg">
                  <p className="text-xs font-mono text-red/80 break-words">{log.error_message}</p>
                </div>
              )}
              {log.status === 'success' && log.cloudinary_url && (
                <div className="mt-3">
                  <a href={log.cloudinary_url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent underline">Ver archivo en la nube</a>
                </div>
              )}
            </div>
          ))}
          {logs.length === 0 && <p className="text-text-secondary text-sm">No hay registros de subidas.</p>}
        </div>
      )}
    </div>
  );
}
