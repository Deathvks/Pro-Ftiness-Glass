/* frontend/src/components/WorkoutDataTransferModal.jsx */
import React, { useState, useRef, useMemo } from 'react';
import ModalPortal from './ModalPortal';
import useModalLock from '../hooks/useModalLock';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import {
  UploadCloud, Download, FileSpreadsheet, CheckCircle2, AlertCircle,
  X, ChevronDown, ChevronUp, Dumbbell, Calendar, Layers, ShieldCheck,
  RefreshCw, Sparkles, ArrowRight
} from 'lucide-react';
import { parseWorkoutCSV, exportWorkoutsToCSV, downloadCSVFile } from '../utils/csvWorkoutParser';
import * as workoutService from '../services/workoutService';
import Spinner from './Spinner';

export default function WorkoutDataTransferModal({ isOpen, onClose, initialTab = 'import' }) {
  useModalLock(isOpen);

  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const workoutLog = useAppStore(state => state.workoutLog) || [];
  const fetchInitialData = useAppStore(state => state.fetchInitialData);

  const [activeTab, setActiveTab] = useState(initialTab); // 'import' | 'export'
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parseResult, setParseResult] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [isParsing, setIsParsing] = useState(false);

  // Opciones de importación
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Estados de proceso de importación
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [importSuccessData, setImportSuccessData] = useState(null);

  // Estados de exportación
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setParseError(null);
  };

  const resetImportState = () => {
    setSelectedFile(null);
    setParseResult(null);
    setParseError(null);
    setIsImporting(false);
    setImportProgress({ current: 0, total: 0, percent: 0 });
    setImportSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileProcess = (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Por favor, selecciona un archivo en formato .csv válido.');
      setSelectedFile(null);
      setParseResult(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setIsParsing(true);
    setImportSuccessData(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const result = parseWorkoutCSV(text);

        if (!result.workouts || result.workouts.length === 0) {
          throw new Error('No se detectaron entrenamientos válidos en el archivo CSV.');
        }

        setParseResult(result);
        setIsParsing(false);
      } catch (err) {
        console.error('Error parseando CSV:', err);
        setParseError(err.message || 'Error al procesar el archivo CSV. Comprueba que provenga de Hevy, Strong o Pro Fitness Glass.');
        setParseResult(null);
        setIsParsing(false);
      }
    };

    reader.onerror = () => {
      setParseError('No se pudo leer el archivo. Inténtalo de nuevo.');
      setIsParsing(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Ejecución de la importación
  const executeImport = async () => {
    if (!parseResult || !parseResult.workouts || parseResult.workouts.length === 0) return;

    setIsImporting(true);
    const workouts = parseResult.workouts;
    const totalWorkouts = workouts.length;

    // Si hay muchos entrenamientos, enviamos en lotes de 60 para evitar timeouts
    const BATCH_SIZE = 60;
    const batches = [];
    for (let i = 0; i < totalWorkouts; i += BATCH_SIZE) {
      batches.push(workouts.slice(i, i + BATCH_SIZE));
    }

    let totalImported = 0;
    let totalSkipped = 0;
    let totalSets = 0;

    try {
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const res = await workoutService.importWorkouts({
          workouts: batch,
          skipDuplicates
        });

        totalImported += res.importedCount || 0;
        totalSkipped += res.skippedCount || 0;
        totalSets += res.totalSetsImported || 0;

        const currentProcessed = Math.min((i + 1) * BATCH_SIZE, totalWorkouts);
        const percent = Math.round((currentProcessed / totalWorkouts) * 100);
        setImportProgress({ current: currentProcessed, total: totalWorkouts, percent });
      }

      // Recargar datos globales de la aplicación
      if (fetchInitialData) {
        try {
          await fetchInitialData();
        } catch (err) {
          console.warn('Error refrescando datos tras importación:', err);
        }
      }

      setImportSuccessData({
        importedCount: totalImported,
        skippedCount: totalSkipped,
        totalSets,
        platform: parseResult.platform
      });

      addToast(`¡${totalImported} entrenamientos importados con éxito!`, 'success');

    } catch (err) {
      console.error('Error importando entrenamientos:', err);
      setParseError(err.message || 'Ocurrió un error al guardar los entrenamientos en tu cuenta.');
    } finally {
      setIsImporting(false);
    }
  };

  // Exportar historial a CSV
  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Intentar descargar directamente desde el endpoint optimizado del backend
      const blob = await workoutService.exportWorkoutsCSV();
      downloadCSVFile(blob, `pro_fitness_glass_historial_${new Date().toISOString().split('T')[0]}.csv`);
      addToast('Historial completo descargado en CSV para Excel', 'success');
    } catch (err) {
      console.warn('Fallback a exportación local desde store:', err);
      // Fallback: Si el endpoint fallara, generar con la función del cliente con los entrenamientos en memoria
      try {
        const csvString = exportWorkoutsToCSV(workoutLog);
        downloadCSVFile(csvString, `pro_fitness_glass_historial_${new Date().toISOString().split('T')[0]}.csv`);
        addToast('Historial exportado en CSV para Excel', 'success');
      } catch (clientErr) {
        console.error('Error en exportación fallback:', clientErr);
        addToast('No se pudo exportar el historial. Inténtalo de nuevo.', 'error');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const getPlatformLabel = (platform) => {
    switch (platform) {
      case 'hevy':
        return { label: 'Hevy CSV', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
      case 'strong':
        return { label: 'Strong CSV', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
      case 'pfg':
        return { label: 'Pro Fitness Glass CSV', bg: 'bg-accent/10 text-accent border-accent/20' };
      default:
        return { label: 'CSV Genérico', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
    }
  };

  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return isoStr;
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-[fade-in_0.25s_ease-out]"
        onClick={isImporting ? undefined : onClose}
      >
        <div
          className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[85vh] bg-bg-primary rounded-t-[32px] sm:rounded-[32px] border border-glass-border shadow-2xl flex flex-col overflow-hidden animate-[slide-up_0.25s_ease-out] sm:animate-[scale-in_0.25s_ease-out]"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 pt-6 pb-4 border-b border-glass-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-accent/10 text-accent border border-accent/20">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight">
                  Importar & Exportar Historial
                </h2>
                <p className="text-xs text-text-secondary">
                  Migración desde Hevy o Strong y copias para Excel
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isImporting}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-muted hover:text-text-primary transition-colors disabled:opacity-30"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Segmented control tabs */}
          <div className="px-6 pt-4 shrink-0">
            <div className="p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex gap-1">
              <button
                type="button"
                onClick={() => handleTabChange('import')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'import'
                    ? 'bg-accent text-accent-contrast shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <UploadCloud size={16} />
                Importar (Hevy / Strong)
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('export')}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'export'
                    ? 'bg-accent text-accent-contrast shadow-md'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Download size={16} />
                Exportar a Excel (CSV)
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 hide-scrollbar space-y-5">
            {activeTab === 'import' ? (
              <>
                {/* Pantalla de éxito tras importar */}
                {importSuccessData ? (
                  <div className="py-6 px-4 text-center space-y-4 animate-[scale-in_0.3s_ease-out]">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={36} />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-text-primary">
                        ¡Historial importado con éxito!
                      </h3>
                      <p className="text-sm text-text-secondary mt-1">
                        Se añadieron tus entrenamientos y se recalcularon tus récords personales.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto pt-2">
                      <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                        <div className="text-2xl font-black text-text-primary">
                          {importSuccessData.importedCount}
                        </div>
                        <div className="text-[11px] font-bold text-text-muted uppercase">
                          Entrenamientos
                        </div>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border">
                        <div className="text-2xl font-black text-accent">
                          {importSuccessData.totalSets}
                        </div>
                        <div className="text-[11px] font-bold text-text-muted uppercase">
                          Series Totales
                        </div>
                      </div>
                    </div>

                    {importSuccessData.skippedCount > 0 && (
                      <p className="text-xs text-text-muted">
                        ℹ️ {importSuccessData.skippedCount} entrenamientos omitidos porque ya estaban registrados en las mismas fechas.
                      </p>
                    )}

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={resetImportState}
                        className="flex-1 py-3 px-4 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary text-sm font-bold transition-all"
                      >
                        Importar otro archivo
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl bg-accent text-accent-contrast text-sm font-bold shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Ver mi Progreso
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Banners informativos de cómo exportar desde Hevy / Strong */}
                    <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-text-primary">
                        <Sparkles size={14} className="text-accent" />
                        ¿De dónde vienes? Cómo obtener tu CSV:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-text-secondary leading-relaxed">
                        <div className="p-2.5 rounded-xl bg-surface/50 border border-glass-border">
                          <span className="font-extrabold text-text-primary">📱 Hevy:</span> Ve a Perfil &gt; Ajustes ⚙️ &gt; <strong className="text-emerald-500">Exportar datos (CSV)</strong>.
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface/50 border border-glass-border">
                          <span className="font-extrabold text-text-primary">⚡ Strong:</span> Ve a Configuración ⚙️ &gt; <strong className="text-blue-500">Exportar entrenamientos (CSV)</strong>.
                        </div>
                      </div>
                    </div>

                    {/* Zona de Dropzone */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />

                    {!parseResult ? (
                      <div
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 ${
                          isDragging
                            ? 'border-accent bg-accent/10 scale-[1.01]'
                            : 'border-glass-border hover:border-accent/50 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                          {isParsing ? <Spinner size={24} /> : <UploadCloud size={28} />}
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-text-primary">
                            {isParsing ? 'Analizando archivo CSV...' : 'Arrastra aquí tu CSV o pulsa para seleccionar'}
                          </div>
                          <div className="text-xs text-text-secondary mt-1">
                            Compatible con archivos CSV de Hevy, Strong y Pro Fitness Glass
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-accent/10 text-accent">
                          Formato .CSV
                        </span>
                      </div>
                    ) : (
                      /* Vista del archivo cargado y estadísticas previas */
                      <div className="space-y-4 animate-[fade-in_0.2s_ease-out]">
                        <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
                              <FileSpreadsheet size={20} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-text-primary truncate">
                                {selectedFile?.name || 'archivo_entrenamientos.csv'}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getPlatformLabel(parseResult.platform).bg}`}>
                                  {getPlatformLabel(parseResult.platform).label}
                                </span>
                                <span className="text-[10px] text-text-muted">
                                  {(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0)} KB
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={resetImportState}
                            disabled={isImporting}
                            className="p-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Cambiar archivo"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        {/* Tarjeta de métricas analizadas */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border text-center">
                            <div className="text-lg sm:text-xl font-black text-text-primary">
                              {parseResult.summary.totalWorkouts}
                            </div>
                            <div className="text-[10px] font-bold text-text-muted uppercase">
                              Entrenos
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border text-center">
                            <div className="text-lg sm:text-xl font-black text-accent">
                              {parseResult.summary.totalSets}
                            </div>
                            <div className="text-[10px] font-bold text-text-muted uppercase">
                              Series
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border text-center">
                            <div className="text-lg sm:text-xl font-black text-emerald-500">
                              {parseResult.summary.totalExercises}
                            </div>
                            <div className="text-[10px] font-bold text-text-muted uppercase">
                              Ejercicios
                            </div>
                          </div>
                        </div>

                        {/* Rango de fechas */}
                        {parseResult.summary.minDate && parseResult.summary.maxDate && (
                          <div className="p-3 rounded-xl bg-surface/50 border border-glass-border flex items-center justify-between text-xs">
                            <span className="text-text-secondary flex items-center gap-1.5 font-medium">
                              <Calendar size={14} className="text-accent" />
                              Periodo histórico:
                            </span>
                            <span className="font-bold text-text-primary">
                              {formatDateDisplay(parseResult.summary.minDate)} — {formatDateDisplay(parseResult.summary.maxDate)}
                            </span>
                          </div>
                        )}

                        {/* Opción de deduplicación */}
                        <label className="flex items-start gap-3 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-glass-border cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={skipDuplicates}
                            onChange={(e) => setSkipDuplicates(e.target.checked)}
                            className="mt-0.5 rounded text-accent focus:ring-accent accent-accent w-4 h-4"
                          />
                          <div className="text-xs">
                            <div className="font-bold text-text-primary">
                              Omitir entrenamientos ya existentes
                            </div>
                            <div className="text-[11px] text-text-secondary mt-0.5">
                              Evita duplicar entrenamientos que coincidan en fecha y nombre con los que ya tienes guardados.
                            </div>
                          </div>
                        </label>

                        {/* Desplegable de vista previa */}
                        <div className="border border-glass-border rounded-2xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className="w-full p-3.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-text-secondary hover:text-text-primary flex items-center justify-between transition-colors"
                          >
                            <span>Vista previa ({Math.min(3, parseResult.workouts.length)} entrenamientos de muestra)</span>
                            {showPreview ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          {showPreview && (
                            <div className="p-3 bg-surface/40 divide-y divide-glass-border space-y-3">
                              {parseResult.workouts.slice(0, 3).map((w, idx) => (
                                <div key={idx} className={idx > 0 ? 'pt-3' : ''}>
                                  <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                                    <span>{w.routine_name}</span>
                                    <span className="text-text-muted font-mono">{formatDateDisplay(w.workout_date)}</span>
                                  </div>
                                  <div className="text-[11px] text-text-secondary mt-1">
                                    {w.details.length} ejercicios · {w.details.reduce((acc, ex) => acc + ex.setsDone.length, 0)} series
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {w.details.slice(0, 4).map((ex, exIdx) => (
                                      <span key={exIdx} className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] text-text-muted">
                                        {ex.exercise_name} ({ex.setsDone.length}s)
                                      </span>
                                    ))}
                                    {w.details.length > 4 && (
                                      <span className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[10px] text-text-muted">
                                        +{w.details.length - 4} más
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Barra de progreso si está importando */}
                        {isImporting && (
                          <div className="space-y-2 p-4 rounded-2xl bg-accent/10 border border-accent/20">
                            <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                              <span className="flex items-center gap-2">
                                <RefreshCw size={14} className="animate-spin text-accent" />
                                Importando entrenamientos...
                              </span>
                              <span>{importProgress.percent}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-accent transition-all duration-300"
                                style={{ width: `${importProgress.percent}%` }}
                              />
                            </div>
                            <div className="text-[10px] text-text-muted text-right">
                              {importProgress.current} de {importProgress.total} procesados
                            </div>
                          </div>
                        )}

                        {/* Botón de Confirmación */}
                        <button
                          type="button"
                          onClick={executeImport}
                          disabled={isImporting}
                          className="w-full py-3.5 px-4 rounded-2xl bg-accent text-accent-contrast text-sm font-extrabold shadow-lg shadow-accent/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isImporting ? (
                            <>
                              <Spinner size={18} />
                              Guardando entrenamientos...
                            </>
                          ) : (
                            <>
                              Confirmar e Importar {parseResult.summary.totalWorkouts} Entrenamientos
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Mensaje de error si falla el parseo */}
                    {parseError && (
                      <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <div>{parseError}</div>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              /* TAB 2: EXPORTAR HISTORIAL A CSV / EXCEL */
              <div className="space-y-5">
                <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-glass-border space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
                    <Download size={28} />
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-text-primary">
                      Copia de Seguridad Completa (Excel & CSV)
                    </h3>
                    <p className="text-xs sm:text-sm text-text-secondary mt-1 leading-relaxed">
                      Descarga todo tu historial en un archivo CSV formateado con codificación UTF-8 BOM, compatible al 100% con Microsoft Excel, Google Sheets, Hevy y Pro Fitness Glass.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface/50 border border-glass-border space-y-1.5 text-xs text-text-secondary">
                    <div className="flex items-center gap-2 font-bold text-text-primary">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      Datos incluidos en el archivo:
                    </div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-text-muted pl-1">
                      <li>Fechas y horas exactas de cada sesión</li>
                      <li>Nombres de rutinas y ejercicios</li>
                      <li>Número de serie, tipo (Normal, Calentamiento, Dropset)</li>
                      <li>Pesos en kg, repeticiones y RIR (Repeticiones en Reserva)</li>
                      <li>Notas personales de entrenamiento</li>
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-xs text-text-muted pt-1">
                    <span>Entrenamientos guardados en tu cuenta:</span>
                    <span className="font-extrabold text-text-primary">{workoutLog.length}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3.5 px-4 rounded-2xl bg-accent text-accent-contrast text-sm font-extrabold shadow-lg shadow-accent/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isExporting ? (
                      <>
                        <Spinner size={18} />
                        Generando archivo CSV...
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        Descargar Historial en CSV (.csv)
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
