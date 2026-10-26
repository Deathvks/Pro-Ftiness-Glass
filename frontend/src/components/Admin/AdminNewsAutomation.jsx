/* frontend/src/components/Admin/AdminNewsAutomation.jsx */
import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Clock,
  Timer,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Terminal,
  ExternalLink,
  Layers,
  ChevronRight,
  Calendar,
  X,
  Settings2,
  RefreshCw,
  Zap,
  Info,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import GlassCard from '../GlassCard';
import Spinner from '../Spinner';
import CustomSelect from '../CustomSelect';
import ModalPortal from '../ModalPortal';
import useModalLock from '../../hooks/useModalLock';
import * as newsService from '../../services/newsService';
import { useToast } from '../../hooks/useToast';
import { initSocket } from '../../services/socket';

export default function AdminNewsAutomation({ onNavigateToArticle, onAutomationComplete }) {
  const { addToast } = useToast();
  const prevStatusRef = useRef('idle');

  const [statusData, setStatusData] = useState({
    status: 'idle',
    currentStep: 'En espera de la próxima ejecución programada',
    isGenerating: false,
    scheduledHour: 9,
    scheduledMinute: 0,
    nextRunAt: null,
    lastRunAt: null,
    remainingMs: 0,
    logs: [],
    lastResult: null,
    history: []
  });

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newScheduleHour, setNewScheduleHour] = useState(9);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [showTopicPrompt, setShowTopicPrompt] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Bloquear el scroll de fondo cuando cualquiera de los modales esté activo
  useModalLock(showConsoleModal || showScheduleModal || showTopicPrompt);

  // Reloj regresivo local en segundos
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
  
  // Referencias para scroll inteligente de consola
  const logsContainerRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);
  const isTouchingRef = useRef(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const prevLogsLengthRef = useRef(0);

  // 1. Cargar estado inicial desde la API
  const fetchStatus = async () => {
    try {
      const data = await newsService.getNewsAutomationStatus();
      if (data) {
        setStatusData(data);
        if (data.scheduledHour !== undefined) {
          setNewScheduleHour(data.scheduledHour);
        }
        if (data.status === 'completed' && prevStatusRef.current === 'generating' && onAutomationComplete) {
          onAutomationComplete();
        }
        prevStatusRef.current = data.status;
      }
    } catch (err) {
      console.warn('Error al obtener estado de automatización:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Polling de respaldo cada 5 segundos
    const pollInterval = setInterval(fetchStatus, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  // 2. Suscripción a WebSockets en tiempo real
  useEffect(() => {
    const socket = initSocket();
    if (!socket) return;

    const handleStatusUpdate = (updated) => {
      if (updated) {
        setStatusData((prev) => ({
          ...prev,
          ...updated,
          logs: updated.logs || prev.logs
        }));
        if (updated.status === 'completed' && onAutomationComplete) {
          onAutomationComplete();
        }
      }
    };

    const handleNewLog = (logItem) => {
      setStatusData((prev) => {
        const nextLogs = [...(prev.logs || []), logItem];
        if (nextLogs.length > 50) nextLogs.shift();
        return {
          ...prev,
          logs: nextLogs,
          currentStep: logItem.message
        };
      });
    };

    socket.on('news_automation_status', handleStatusUpdate);
    socket.on('news_automation_log', handleNewLog);

    return () => {
      socket.off('news_automation_status', handleStatusUpdate);
      socket.off('news_automation_log', handleNewLog);
    };
  }, []);

  // 3. Temporizador regresivo en vivo cada segundo
  useEffect(() => {
    const updateCountdown = () => {
      if (!statusData.nextRunAt) return;
      const targetTime = new Date(statusData.nextRunAt).getTime();
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMs: diff });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [statusData.nextRunAt]);

  // Manejo de scroll en el contenedor de logs: detecta si el usuario está leyendo hacia arriba
  const handleLogsScroll = () => {
    const el = logsContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // Si está a más de 35px del fondo, consideramos que está inspeccionando logs anteriores
    const scrolledUp = distanceFromBottom > 35;
    isUserScrolledUpRef.current = scrolledUp;
    setIsScrolledUp(scrolledUp);
  };

  const handleLogsTouchStart = () => {
    isTouchingRef.current = true;
  };

  const handleLogsTouchEnd = () => {
    // Permitir que termine la inercia del scroll táctil antes de reactivar auto-scroll
    setTimeout(() => {
      isTouchingRef.current = false;
      const el = logsContainerRef.current;
      if (el) {
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const scrolledUp = distanceFromBottom > 35;
        isUserScrolledUpRef.current = scrolledUp;
        setIsScrolledUp(scrolledUp);
      }
    }, 400);
  };

  const scrollToBottom = (behavior = 'smooth') => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior
      });
    }
  };

  // Al abrir el modal de consola, scrollear abajo de inicio
  useEffect(() => {
    if (showConsoleModal) {
      isUserScrolledUpRef.current = false;
      setIsScrolledUp(false);
      setTimeout(() => scrollToBottom('auto'), 50);
    }
  }, [showConsoleModal]);

  // Auto-scroll SOLO si hay nuevos logs Y el usuario NO está scrolleando hacia arriba ni tocando la pantalla
  useEffect(() => {
    const currentLength = statusData.logs?.length || 0;
    if (showConsoleModal && currentLength > prevLogsLengthRef.current) {
      if (!isUserScrolledUpRef.current && !isTouchingRef.current) {
        scrollToBottom('smooth');
      }
    }
    prevLogsLengthRef.current = currentLength;
  }, [statusData.logs, showConsoleModal]);

  const handleCopyLogs = () => {
    if (!statusData.logs || statusData.logs.length === 0) return;
    const text = statusData.logs
      .map((l) => `[${l.time}] [${(l.level || 'info').toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Adaptar todas las noticias existentes al nuevo formato de retención y SEO
  const handleOptimizeExisting = async () => {
    if (statusData.isGenerating || isTriggering) return;
    setIsTriggering(true);
    try {
      await newsService.optimizeExistingArticlesWithAI({ forceAll: false });
      addToast('Adaptando noticias existentes con Gemini en vivo...', 'success');
      setStatusData((prev) => ({
        ...prev,
        status: 'generating',
        isGenerating: true,
        currentStep: 'Adaptando noticias existentes al formato de alta retención y SEO...'
      }));
      setShowConsoleModal(true);
    } catch (err) {
      addToast(err.message || 'Error al iniciar la adaptación', 'error');
    } finally {
      setIsTriggering(false);
    }
  };

  // Disparador manual inmediato
  const handleTriggerNow = async (topic = null) => {
    if (statusData.isGenerating || isTriggering) return;
    setIsTriggering(true);
    setShowTopicPrompt(false);
    try {
      await newsService.triggerNewsAutomation(topic);
      addToast('Automatización Gemini iniciada con éxito', 'success');
      setStatusData((prev) => ({
        ...prev,
        status: 'generating',
        isGenerating: true,
        currentStep: 'Iniciando generación con Gemini...'
      }));
      setShowConsoleModal(true);
    } catch (err) {
      addToast(err.message || 'Error al iniciar la generación', 'error');
    } finally {
      setIsTriggering(false);
      setCustomTopicInput('');
    }
  };

  // Guardar nuevo horario programado
  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      const res = await newsService.updateNewsAutomationSchedule({
        hour: parseInt(newScheduleHour, 10),
        minute: 0
      });
      addToast(`Hora programada a las ${String(newScheduleHour).padStart(2, '0')}:00`, 'success');
      setShowScheduleModal(false);
      fetchStatus();
    } catch (err) {
      addToast(err.message || 'Error al guardar horario', 'error');
    }
  };

  const isGenerating = statusData.isGenerating || statusData.status === 'generating';
  const lastResult = statusData.lastResult;
  const isLastError = statusData.status === 'error' || (lastResult && !lastResult.success);

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-[fade-in_0.3s_ease-out] w-full overflow-hidden">
      {/* TARJETA PRINCIPAL: RELOJ REGRESIVO Y ESTADO EN VIVO */}
      <GlassCard className="relative overflow-hidden p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] border border-black/10 dark:border-white/10 shadow-xl bg-gradient-to-br from-black/[0.02] via-accent/[0.03] to-black/[0.04]">
        {/* Glow de fondo */}
        <div
          className={`absolute -top-24 -right-24 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-[80px] sm:blur-[90px] pointer-events-none transition-all duration-700 ${
            isGenerating
              ? 'bg-accent/30 animate-pulse'
              : isLastError
              ? 'bg-red-500/20'
              : 'bg-accent/15'
          }`}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 sm:gap-6">
          {/* Lado izquierdo: Título y descripción */}
          <div className="flex flex-col gap-1.5 sm:gap-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 w-fit">
              <Sparkles size={13} className={isGenerating ? 'animate-spin' : ''} />
              <span>Automatización Editorial Diaria</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-text-primary tracking-tight">
              Gemini Creador de Noticias
            </h2>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
              Cada día a la hora programada, Gemini analiza tendencias científicas de fitness, nutrición y biohacking para redactar un artículo con gancho viral, retención máxima y SEO orgánico de élite.
            </p>
          </div>

          {/* Lado derecho: Botones de control rápido con layout grid en móvil */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary text-xs font-bold transition-all border border-black/5 dark:border-white/10 truncate active:scale-95"
              title="Cambiar hora diaria"
            >
              <Settings2 size={15} className="shrink-0" />
              <span className="truncate">Hora: {String(statusData.scheduledHour || 9).padStart(2, '0')}:00</span>
            </button>

            <button
              type="button"
              onClick={() => setShowConsoleModal(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-xs font-bold transition-all border border-black/5 dark:border-white/10 truncate active:scale-95"
            >
              <Terminal size={15} className="shrink-0" />
              <span>Consola</span>
              {statusData.logs?.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-accent animate-ping shrink-0" />
              )}
            </button>

            <button
              type="button"
              disabled={isGenerating || isTriggering}
              onClick={() => setShowTopicPrompt(true)}
              className={`col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer ${
                isGenerating
                  ? 'bg-accent/40 text-accent-contrast cursor-wait'
                  : 'bg-accent text-accent-contrast shadow-accent/25 hover:scale-105'
              }`}
            >
              {isGenerating ? (
                <>
                  <Spinner size={15} />
                  <span>Creando...</span>
                </>
              ) : (
                <>
                  <Zap size={15} />
                  <span>Generar Ahora</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CONTADOR EN TIEMPO REAL O ESTADO DE GENERACIÓN */}
        <div className="mt-5 sm:mt-8 pt-5 sm:pt-6 border-t border-black/5 dark:border-white/10">
          {isGenerating ? (
            <div
              onClick={() => setShowConsoleModal(true)}
              className="cursor-pointer p-4 sm:p-5 rounded-2xl bg-accent/10 border border-accent/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 hover:bg-accent/15 transition-all group shadow-inner"
            >
              <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-accent flex items-center justify-center text-accent-contrast shadow-md shadow-accent/30 shrink-0">
                  <Spinner size={20} color="#ffffff" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-accent">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    Creando en tiempo real
                  </div>
                  <p className="text-xs sm:text-base font-bold text-text-primary mt-0.5 line-clamp-2">
                    {statusData.currentStep}
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-accent text-accent-contrast text-xs font-bold group-hover:scale-105 transition-transform shadow-md shrink-0 w-full sm:w-auto">
                Ver lo que hace Gemini <ChevronRight size={15} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Tarjeta de tiempo restante */}
              <div className="md:col-span-2 p-3.5 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-accent/10 text-accent flex items-center justify-center border border-accent/20 shrink-0">
                    <Timer size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-text-tertiary block">
                      Próxima creación automática
                    </span>
                    <span className="text-xs text-text-secondary font-medium">
                      A las {String(statusData.scheduledHour || 9).padStart(2, '0')}:00 (Hora Peninsular)
                    </span>
                  </div>
                </div>

                {/* Display del reloj en vivo */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 font-mono shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                  <div className="flex-1 sm:flex-initial flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/10 min-w-[50px]">
                    <span className="text-lg sm:text-2xl font-black text-text-primary">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-text-tertiary font-sans font-bold">Horas</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-text-tertiary">:</span>
                  <div className="flex-1 sm:flex-initial flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/10 min-w-[50px]">
                    <span className="text-lg sm:text-2xl font-black text-text-primary">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-text-tertiary font-sans font-bold">Min</span>
                  </div>
                  <span className="text-base sm:text-lg font-black text-text-tertiary">:</span>
                  <div className="flex-1 sm:flex-initial flex flex-col items-center px-2.5 sm:px-3 py-1.5 rounded-xl bg-black/10 dark:bg-white/10 border border-black/5 dark:border-white/10 min-w-[50px]">
                    <span className="text-lg sm:text-2xl font-black text-accent">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-text-tertiary font-sans font-bold">Seg</span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de estado de última ejecución */}
              <div className="p-3.5 sm:p-5 rounded-2xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-text-tertiary">
                    Última ejecución
                  </span>
                  {lastResult?.success ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                      <CheckCircle2 size={11} /> Éxito
                    </span>
                  ) : lastResult?.success === false ? (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
                      <AlertTriangle size={11} /> Fallo
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-text-muted">Sin datos</span>
                  )}
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-text-primary line-clamp-1">
                    {lastResult?.articleTitle || (lastResult?.error ? 'Error en generación' : 'En espera')}
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {statusData.lastRunAt
                      ? format(new Date(statusData.lastRunAt), "d 'de' MMMM, HH:mm", { locale: es })
                      : 'Aún no iniciada'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* RESULTADO DE LA ÚLTIMA OPERACIÓN (ÉXITO O ERROR) */}
      {lastResult && (
        <div className="animate-[fade-in_0.4s_ease-out]">
          {lastResult.success ? (
            <GlassCard className="p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border border-emerald-500/30 bg-emerald-500/[0.04] shadow-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  {lastResult.image_url && (
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-black/10 shrink-0 border border-emerald-500/20">
                      <img
                        src={lastResult.image_url}
                        alt="Portada"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/entrenamiento.png';
                        }}
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                        <CheckCircle2 size={11} /> Publicado con Éxito
                      </span>
                      {lastResult.category && (
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-text-primary shrink-0">
                          {lastResult.category}
                        </span>
                      )}
                      {lastResult.durationSeconds && (
                        <span className="text-[10px] sm:text-[11px] font-mono text-text-tertiary shrink-0">
                          ({lastResult.durationSeconds}s)
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-text-primary leading-snug line-clamp-2 break-words">
                      {lastResult.articleTitle}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-1 break-all">
                      Slug: <code className="text-accent font-mono text-[10px] sm:text-xs">/noticias/{lastResult.articleSlug}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-500/20">
                  <a
                    href={`/noticias/${lastResult.articleSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="cursor-pointer flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <ExternalLink size={14} />
                    <span>Ver Noticia</span>
                  </a>
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-4 sm:p-6 rounded-2xl sm:rounded-[28px] border border-red-500/30 bg-red-500/[0.04] shadow-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-red-500/15 text-red-500 flex items-center justify-center border border-red-500/25 shrink-0 mt-0.5">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 mb-1">
                      Fallo en la Creación
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-text-primary">
                      No se pudo completar la generación del artículo
                    </h3>
                    <p className="text-xs text-text-secondary mt-1 leading-relaxed break-words">
                      {lastResult.error || 'Ocurrió un error inesperado al procesar la solicitud con Gemini.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerNow()}
                  disabled={isGenerating || isTriggering}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl sm:rounded-2xl bg-accent text-accent-contrast font-bold text-xs hover:opacity-90 active:scale-95 transition-all shadow-md shadow-accent/20 shrink-0 w-full sm:w-auto"
                >
                  <RotateCcw size={15} />
                  <span>Reintentar Ahora</span>
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* HISTORIAL RECIENTE DE NOTICIAS GENERADAS */}
      <div className="flex flex-col gap-3 sm:gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={17} className="text-accent" />
            <h3 className="text-base sm:text-lg font-bold text-text-primary">
              Historial de Creaciones Automatizadas
            </h3>
          </div>
          <span className="text-xs font-bold text-text-tertiary">
            {statusData.history?.length || 0}
          </span>
        </div>

        {statusData.history?.length === 0 ? (
          <div className="py-8 sm:py-12 text-center flex flex-col items-center justify-center gap-2 border border-dashed border-black/10 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4">
            <Sparkles size={28} className="text-text-muted opacity-40" />
            <p className="text-xs font-medium text-text-secondary">
              Aún no se han ejecutado ciclos automáticos. Pulsa "Generar Ahora" para probar el sistema.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {statusData.history.map((item, idx) => (
              <GlassCard
                key={item.id || idx}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-black/5 dark:border-white/10 hover:border-accent/40 transition-all flex items-center justify-between gap-3 overflow-hidden"
              >
                <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl overflow-hidden bg-black/10 shrink-0">
                    <img
                      src={item.image_url || '/entrenamiento.png'}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/entrenamiento.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent shrink-0">
                        {item.category}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-text-tertiary truncate">
                        {item.createdAt ? format(new Date(item.createdAt), 'dd/MM HH:mm') : ''}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-text-primary truncate">
                      {item.title}
                    </h4>
                  </div>
                </div>

                <a
                  href={`/noticias/${item.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-accent-contrast transition-colors shrink-0 text-text-secondary"
                  title="Ver en nueva pestaña"
                >
                  <ExternalLink size={15} />
                </a>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONSOLA / TERMINAL EN VIVO ("VER LO QUE HACE GEMINI") */}
      {showConsoleModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onClick={() => setShowConsoleModal(false)}
          >
            <div
              className="relative bg-[#090d16] border border-white/15 rounded-t-[32px] rounded-b-none sm:rounded-3xl w-full max-w-2xl max-h-[88vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-[slide-up_0.25s_ease-out] sm:animate-[scale-in_0.2s_ease-out] pb-[calc(0.75rem+var(--safe-bottom,0px))] sm:pb-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle para móvil */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />

              {/* Header de consola */}
              <div className="px-3.5 py-3 sm:px-6 sm:py-3.5 bg-black/60 border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="hidden sm:block h-3.5 w-px bg-white/10 mx-0.5" />
                  <span className="font-mono text-xs font-bold text-white/90 flex items-center gap-1.5 truncate">
                    <Terminal size={14} className="text-accent shrink-0" />
                    <span className="truncate">Consola Gemini Live</span>
                  </span>
                  {isGenerating && (
                    <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/20 text-accent shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      En vivo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyLogs}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-[10px] sm:text-[11px] font-mono flex items-center gap-1"
                    title="Copiar registros"
                  >
                    {copiedLogs ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span className="hidden sm:inline">Copiar</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConsoleModal(false)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Cuerpo de consola con logs y scroll desacoplado */}
              <div
                ref={logsContainerRef}
                onScroll={handleLogsScroll}
                onTouchStart={handleLogsTouchStart}
                onTouchEnd={handleLogsTouchEnd}
                className="p-3 sm:p-5 overflow-y-auto font-mono text-[11px] sm:text-xs text-white/80 space-y-1.5 flex-1 custom-scrollbar overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {statusData.logs?.length === 0 ? (
                  <div className="py-16 text-center text-white/40 text-xs">
                    Esperando el próximo ciclo de ejecución para transmitir registros en tiempo real...
                  </div>
                ) : (
                  statusData.logs.map((log) => {
                    const isSuccess = log.level === 'success';
                    const isError = log.level === 'error';
                    const isWarning = log.level === 'warning';

                    return (
                      <div
                        key={log.id}
                        className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-white/[0.04] transition-colors leading-relaxed font-mono"
                      >
                        <span className="text-white/35 text-[10px] select-none font-medium shrink-0 pt-0.5">
                          [{log.time}]
                        </span>
                        {isSuccess ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            OK
                          </span>
                        ) : isError ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                            ERR
                          </span>
                        ) : isWarning ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                            WARN
                          </span>
                        ) : (
                          <span className="text-accent font-bold text-xs select-none shrink-0">
                            ›
                          </span>
                        )}
                        <span className={`break-words flex-1 ${
                          isSuccess
                            ? 'text-emerald-300 font-semibold'
                            : isError
                            ? 'text-red-300 font-semibold'
                            : isWarning
                            ? 'text-amber-300'
                            : 'text-white/90'
                        }`}>
                          {log.message}
                        </span>
                      </div>
                    );
                  })
                )}
                {isGenerating && (
                  <div className="flex items-center gap-2 text-accent px-2 py-1 text-xs font-mono animate-pulse">
                    <Spinner size={12} color="currentColor" />
                    <span className="truncate">{statusData.currentStep}</span>
                  </div>
                )}
              </div>

              {/* Botón flotante para volver abajo si el usuario scrolleó hacia arriba */}
              {isScrolledUp && (
                <button
                  type="button"
                  onClick={() => {
                    isUserScrolledUpRef.current = false;
                    setIsScrolledUp(false);
                    scrollToBottom('smooth');
                  }}
                  className="absolute bottom-14 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-accent-contrast text-[11px] font-bold shadow-xl shadow-black/60 hover:opacity-95 transition-all animate-bounce"
                >
                  <ChevronDown size={14} />
                  <span>Bajar al último evento</span>
                </button>
              )}

              {/* Footer de consola */}
              <div className="px-4 py-2.5 sm:px-6 sm:py-3 bg-black/60 border-t border-white/10 flex items-center justify-between text-[10px] sm:text-[11px] text-white/50 shrink-0">
                <span>{statusData.logs?.length || 0} eventos registrados</span>
                <button
                  type="button"
                  onClick={() => handleTriggerNow()}
                  disabled={isGenerating || isTriggering}
                  className="hover:text-accent font-bold transition-colors cursor-pointer text-xs disabled:opacity-50"
                >
                  {isGenerating ? 'Generando...' : 'Reejecutar ahora'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL PARA CAMBIAR HORA DIARIA PROGRAMADA */}
      {showScheduleModal && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onClick={() => setShowScheduleModal(false)}
          >
            <div
              className="relative w-full max-w-md bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-3xl border border-glass-border shadow-2xl p-5 sm:p-6 pb-[calc(1.5rem+var(--safe-bottom,16px))] sm:pb-6 animate-[slide-up_0.25s_ease-out] sm:animate-[scale-in_0.2s_ease-out] flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle para móvil */}
              <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Clock size={19} className="text-accent" />
                  Configurar Hora Diaria
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Elige a qué hora del día (hora peninsular española) deseas que Gemini redacte y publique automáticamente la noticia:
              </p>

              <form onSubmit={handleSaveSchedule} className="flex flex-col gap-4">
                <div className="w-full">
                  <CustomSelect
                    value={newScheduleHour}
                    onChange={(val) => setNewScheduleHour(Number(val))}
                    options={Array.from({ length: 24 }).map((_, i) => ({
                      value: i,
                      label: `${String(i).padStart(2, '0')}:00 ${i < 12 ? 'AM' : 'PM'}`
                    }))}
                    className="w-full"
                    triggerClassName="w-full h-11 bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 text-xs sm:text-sm font-bold text-text-primary flex items-center justify-between gap-2"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-text-secondary font-bold text-xs sm:text-sm hover:bg-black/10 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-accent text-accent-contrast font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-md shadow-accent/20"
                  >
                    Guardar Horario
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL PARA DISPARO MANUAL (CON OPCIÓN DE TEMA FORZADO) */}
      {showTopicPrompt && (
        <ModalPortal>
          <div
            className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md animate-[fade-in_0.2s_ease-out]"
            onClick={() => setShowTopicPrompt(false)}
          >
            <div
              className="relative w-full max-w-md bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-3xl border border-glass-border shadow-2xl p-5 sm:p-6 pb-[calc(1.5rem+var(--safe-bottom,16px))] sm:pb-6 animate-[slide-up_0.25s_ease-out] sm:animate-[scale-in_0.2s_ease-out] flex flex-col gap-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle para móvil */}
              <div className="w-12 h-1.5 bg-black/15 dark:bg-white/20 rounded-full mx-auto mb-2 sm:hidden shrink-0" />

              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-bold text-text-primary flex items-center gap-2">
                  <Sparkles size={19} className="text-accent" />
                  Generar Noticia con Gemini
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTopicPrompt(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-secondary transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                Puedes dejar el campo en blanco para que Gemini investigue y elija automáticamente el tema más viral de actualidad, o escribir un tema específico si deseas guiar el artículo:
              </p>

              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                placeholder="Opcional: ej. 'Creatina en definición' o déjalo vacío"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl sm:rounded-2xl px-3.5 py-3 text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent outline-none"
              />

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTopicPrompt(false)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-black/5 dark:bg-white/5 text-text-secondary font-bold text-xs sm:text-sm hover:bg-black/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerNow(customTopicInput.trim() || null)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-accent text-accent-contrast font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity shadow-md shadow-accent/20"
                >
                  {customTopicInput.trim() ? 'Generar con este tema' : 'Generar Automático'}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
