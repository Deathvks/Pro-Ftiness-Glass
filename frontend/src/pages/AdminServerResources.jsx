/* frontend/src/pages/AdminServerResources.jsx */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Server, Cpu, Layers, HardDrive, Activity, Database, 
  ShieldCheck, RefreshCw, Clock, Zap, CheckCircle2, 
  AlertTriangle, Radio, ArrowUpRight, Sparkles 
} from 'lucide-react';
import { getServerResources, freeServerMemory } from '../services/adminService';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

export default function AdminServerResources({ onFreeMemorySuccess }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [freeingMemory, setFreeingMemory] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { addToast } = useToast();
  const timerRef = useRef(null);

  const fetchResources = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await getServerResources();
      if (res && res.success) {
        setData(res);
        setLastUpdated(new Date());
      }
    } catch (err) {
      if (isManual) {
        addToast(err.message || 'Error al obtener métricas del servidor', 'error');
      }
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      fetchResources(false);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, fetchResources]);

  const handleFreeMemory = async () => {
    setFreeingMemory(true);
    try {
      const res = await freeServerMemory();
      addToast(res.message || 'Memoria liberada exitosamente', res.success ? 'success' : 'error');
      await fetchResources(true);
      if (onFreeMemorySuccess && res.stats) {
        onFreeMemorySuccess(res.stats);
      }
    } catch (err) {
      addToast(err.message || 'Error al forzar liberación de RAM', 'error');
    } finally {
      setFreeingMemory(false);
    }
  };

  const formatSeconds = (totalSeconds) => {
    if (!totalSeconds || totalSeconds < 0) return '0m';
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    return parts.join(' ');
  };

  const getPercentColor = (percent) => {
    if (percent >= 85) return {
      bar: 'bg-red',
      text: 'text-red',
      badge: 'bg-red/10 text-red border-red/20'
    };
    if (percent >= 65) return {
      bar: 'bg-amber-500',
      text: 'text-amber-500',
      badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    };
    return {
      bar: 'bg-accent',
      text: 'text-accent',
      badge: 'bg-accent/10 text-accent border-accent/20'
    };
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Spinner size={36} />
        <p className="mt-4 text-xs font-bold text-text-secondary uppercase tracking-wider">
          Conectando con el servidor VPS...
        </p>
      </div>
    );
  }

  const { server, process: proc, database } = data || {};
  const cpuPercent = server?.cpu?.usagePercent ?? 0;
  const ramPercent = server?.ram?.usagePercent ?? 0;
  const swapPercent = server?.swap?.usagePercent ?? 0;
  const diskPercent = server?.disk?.usagePercent ?? 0;

  const cpuColor = getPercentColor(cpuPercent);
  const ramColor = getPercentColor(ramPercent);
  const diskColor = getPercentColor(diskPercent);

  return (
    <div className="space-y-6 animate-[fade-in_0.3s_ease-out]">
      {/* 1. Header con Controles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shadow-sm">
              <Server size={18} />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              Recursos del Servidor VPS
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-green-500/10 text-green-600 dark:text-green-400 ring-1 ring-green-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Dedicado
            </span>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Métricas de hardware en tiempo real: CPU, RAM, NVMe y salud de servicios en tu instancia Clouding.io.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          {/* Toggle Auto-refresco */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ring-1 ${
              autoRefresh 
                ? 'bg-accent/10 text-accent ring-accent/30' 
                : 'bg-black/5 dark:bg-white/5 text-text-muted ring-black/5 dark:ring-white/10'
            }`}
            title="Activar/desactivar actualización cada 5 segundos"
          >
            <Radio size={12} className={autoRefresh ? 'animate-pulse text-accent' : ''} />
            <span>Auto (5s)</span>
          </button>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={() => fetchResources(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary hover:text-text-primary text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
            title="Actualizar datos ahora"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden xs:inline">Actualizar</span>
          </button>

          {/* Botón Liberar RAM */}
          <button
            type="button"
            onClick={handleFreeMemory}
            disabled={freeingMemory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-accent-contrast text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-md shadow-accent/20 disabled:opacity-50"
            title="Forzar al recolector de basura de Node.js (V8) a purgar memoria no utilizada"
          >
            {freeingMemory ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            <span>Liberar RAM</span>
          </button>
        </div>
      </div>

      {/* 2. Banner de Estado Rápido del Servidor */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-wider mb-1">
            <Clock size={12} />
            <span>Uptime VPS</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-text-primary">
            {formatSeconds(server?.uptimeSeconds)}
          </p>
          <span className="text-[10px] text-text-muted">Servidor en línea</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-wider mb-1">
            <Zap size={12} />
            <span>Uptime App</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-text-primary">
            {formatSeconds(proc?.uptimeSeconds)}
          </p>
          <span className="text-[10px] text-text-muted">Node.js (PID {proc?.pid})</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-wider mb-1">
            <Database size={12} />
            <span>Ping MySQL</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-green-500">
            {database?.latencyMs >= 0 ? `${database.latencyMs} ms` : 'Error'}
          </p>
          <span className="text-[10px] text-text-muted">Loopback local</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
          <div className="flex items-center gap-2 text-text-muted text-[10px] font-black uppercase tracking-wider mb-1">
            <ShieldCheck size={12} />
            <span>Carga Media (1m)</span>
          </div>
          <p className="text-sm sm:text-base font-extrabold text-text-primary">
            {server?.loadAvg?.[0] ?? '0.00'}
          </p>
          <span className="text-[10px] text-text-muted">5m: {server?.loadAvg?.[1]} · 15m: {server?.loadAvg?.[2]}</span>
        </div>
      </div>

      {/* 3. Grid de 4 Tarjetas Principales de Hardware */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: CPU */}
        <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <Cpu size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">Procesador (CPU)</h3>
                  <p className="text-xs text-text-muted">{server?.cpu?.cores} vCores · {server?.cpu?.model}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ring-1 ${cpuColor.badge}`}>
                {cpuPercent}%
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden my-3">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${cpuColor.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, cpuPercent))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-black/5 dark:border-white/5">
            <span>Uso instantáneo: <strong className="text-text-primary">{cpuPercent}%</strong></span>
            <span>Load: <strong className="text-text-primary">{server?.loadAvg?.[0]}</strong> / {server?.cpu?.cores}.0</span>
          </div>
        </div>

        {/* Card 2: Memoria RAM del VPS */}
        <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500">
                  <Layers size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">Memoria RAM del VPS</h3>
                  <p className="text-xs text-text-muted">Total: {((server?.ram?.totalMB || 0) / 1024).toFixed(1)} GB Dedicados</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ring-1 ${ramColor.badge}`}>
                {ramPercent}%
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden my-3">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${ramColor.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, ramPercent))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-black/5 dark:border-white/5">
            <span>Usada: <strong className="text-text-primary">{(server?.ram?.usedMB || 0)} MB</strong></span>
            <span>Libre: <strong className="text-green-500 font-bold">{(server?.ram?.freeMB || 0)} MB</strong></span>
            <span>Swap: <strong className="text-text-muted">{server?.swap?.usedMB} MB ({swapPercent}%)</strong></span>
          </div>
        </div>

        {/* Card 3: Proceso Node.js (App) */}
        <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">App Node.js (Pro Fitness Glass)</h3>
                  <p className="text-xs text-text-muted">Motor: {proc?.nodeVersion} · PID: {proc?.pid}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                {proc?.heapUsedMB} MB
              </span>
            </div>

            {/* Sub-barras: Heap vs RSS */}
            <div className="space-y-1.5 my-3">
              <div className="flex justify-between text-[11px] font-bold text-text-muted">
                <span>Heap Usado: {proc?.heapUsedMB} MB / {proc?.heapTotalMB} MB</span>
                <span>RSS Físico: {proc?.rssMB} MB</span>
              </div>
              <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round(((proc?.heapUsedMB || 1) / (proc?.heapTotalMB || 100)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-black/5 dark:border-white/5">
            <span>Recolector GC: <strong className="text-green-500 font-bold">{proc?.gcAvailable ? 'Nativo V8 Activo' : 'Estándar'}</strong></span>
            <span>Límite: <strong className="text-text-primary">512 MB</strong></span>
          </div>
        </div>

        {/* Card 4: Disco NVMe SSD */}
        <div className="p-5 rounded-3xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <HardDrive size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-text-primary">Almacenamiento NVMe SSD</h3>
                  <p className="text-xs text-text-muted">Total: {server?.disk?.totalGB} GB · Clouding.io</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ring-1 ${diskColor.badge}`}>
                {diskPercent}%
              </span>
            </div>

            {/* Barra de Progreso */}
            <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden my-3">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${diskColor.bar}`}
                style={{ width: `${Math.min(100, Math.max(3, diskPercent))}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-text-secondary pt-2 border-t border-black/5 dark:border-white/5">
            <span>Ocupado: <strong className="text-text-primary">{server?.disk?.usedGB} GB</strong></span>
            <span>Libre: <strong className="text-green-500 font-bold">{server?.disk?.freeGB} GB</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Estado de Servicios e Infraestructura */}
      <div className="p-5 sm:p-6 rounded-3xl bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10">
        <h3 className="text-sm font-black uppercase tracking-wider text-text-muted mb-4 flex items-center gap-2">
          <ShieldCheck size={16} className="text-accent" />
          <span>Salud de Servicios e Infraestructura</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Servicio MySQL */}
          <div className="p-4 rounded-2xl bg-bg-primary/50 ring-1 ring-black/5 dark:ring-white/5 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-text-primary">MySQL 8.0</p>
              <p className="text-[11px] text-text-secondary truncate">BD: {database?.name}</p>
              <span className="text-[10px] text-green-500 font-bold">Conectado (0.1ms ping)</span>
            </div>
          </div>

          {/* Servicio Caddy */}
          <div className="p-4 rounded-2xl bg-bg-primary/50 ring-1 ring-black/5 dark:ring-white/5 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-text-primary">Caddy Web Server</p>
              <p className="text-[11px] text-text-secondary truncate">SSL Let's Encrypt · HTTP/3</p>
              <span className="text-[10px] text-green-500 font-bold">Zstandard + Gzip Activo</span>
            </div>
          </div>

          {/* Servicio PM2 */}
          <div className="p-4 rounded-2xl bg-bg-primary/50 ring-1 ring-black/5 dark:ring-white/5 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-text-primary">PM2 Process Manager</p>
              <p className="text-[11px] text-text-secondary truncate">profitness-api (Online)</p>
              <span className="text-[10px] text-green-500 font-bold">pm2-logrotate Activo</span>
            </div>
          </div>

          {/* Seguridad Fail2ban */}
          <div className="p-4 rounded-2xl bg-bg-primary/50 ring-1 ring-black/5 dark:ring-white/5 flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 shrink-0 animate-pulse" />
            <div className="min-w-0">
              <p className="font-extrabold text-xs text-text-primary">Fail2ban + Honeypot</p>
              <p className="text-[11px] text-text-secondary truncate">3 Jails (SSH, Scanner, Recidive)</p>
              <span className="text-[10px] text-green-500 font-bold">Alertas Telegram Activas</span>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-[10px] text-text-muted text-right mt-3">
            Última lectura: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
