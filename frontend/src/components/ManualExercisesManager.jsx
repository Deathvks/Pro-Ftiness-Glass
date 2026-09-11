import React, { useState, useEffect } from "react";
import api from "../services/apiClient";
import GlassCard from "./GlassCard";
import { Dumbbell, ArrowRight, Check, X, AlertTriangle, Info } from "lucide-react";
import ExerciseSearchInput from "./ExerciseSearchInput";
import ExerciseMedia from "./ExerciseMedia";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "react-i18next";
import ModalPortal from "./ModalPortal";
import CustomSelect from "./CustomSelect";

const ManualExerciseInfoModal = ({ exerciseName, onClose }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const data = await api(`/exercise-list/manual-exercises/info?name=${encodeURIComponent(exerciseName)}`);
        setInfo(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, [exerciseName]);

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]" onClick={onClose}>
        <div 
          className="relative w-full max-w-md p-6 sm:p-8 mt-auto sm:mt-0 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-8 sm:m-4 bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-2xl border border-glass-border shadow-2xl flex flex-col animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-text-primary pr-4 truncate">{exerciseName}</h3>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : info ? (
            <div className="space-y-6">
              {info.pr && (
                <div className="p-4 bg-yellow-500/10 rounded-[16px] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <span className="font-bold text-sm">Récord Personal (RM)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-text-primary block">{info.pr.weight} kg</span>
                    <span className="text-[10px] text-text-secondary font-bold uppercase">{new Date(info.pr.date).toLocaleDateString()}</span>
                  </div>
                </div>
              )}

              {info.routines.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Rutinas en las que aparece</h4>
                  <div className="flex flex-wrap gap-2">
                    {info.routines.map(r => (
                      <span key={r} className="px-3 py-1.5 bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-lg text-xs font-bold text-text-primary">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Últimos registros</h4>
                {info.history.length > 0 ? (
                  <div className="space-y-2">
                    {info.history.map((h, i) => (
                      <div key={i} className="p-3 bg-black/5 dark:bg-white/5 rounded-[12px] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-accent" />
                          <span className="text-sm font-bold text-text-primary">{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm font-extrabold text-text-primary">
                          {h.sets} series {h.weight > 0 ? `(Mejor: ${h.weight}kg)` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted italic">No hay historial de series y repeticiones.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-muted">Error al cargar información.</p>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};

const TransferModal = ({ sourceName, existingManuals = [], onClose, onTransferSuccess }) => {
  const { t } = useTranslation();
  const { addToast } = useToast();
  
  const [targetExercise, setTargetExercise] = useState(null);
  const [targetManualName, setTargetManualName] = useState("");
  
  const [deleteSource, setDeleteSource] = useState(true);
  const [replaceInRoutines, setReplaceInRoutines] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    let finalTargetName = "";
    let finalTargetId = null;

    if (targetExercise) {
      finalTargetName = targetExercise.name;
      finalTargetId = targetExercise.id;
    } else if (targetManualName.trim()) {
      finalTargetName = targetManualName.trim();
    } else {
      addToast("Selecciona o escribe un ejercicio de destino.", "error");
      return;
    }

    if (finalTargetName === sourceName) {
      addToast("El ejercicio de destino no puede ser igual al de origen.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await api("/exercise-list/manual-exercises/transfer", { body: {
        sourceName,
        targetName: finalTargetName,
        targetExerciseListId: finalTargetId,
        deleteSource,
        replaceInRoutines
      } });
      addToast("Datos transferidos correctamente.", "success");
      onTransferSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      addToast(err.message || "Error al transferir datos.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div 
        className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]" 
        onClick={onClose}
      >
        <div 
          className="relative w-full max-w-lg p-6 sm:p-8 mt-auto sm:mt-0 pb-[calc(1.5rem+var(--safe-bottom))] sm:pb-8 sm:m-4 bg-bg-primary rounded-t-[32px] rounded-b-none sm:rounded-2xl border border-glass-border shadow-2xl flex flex-col animate-[slide-up_0.3s_ease-out] sm:animate-[scale-in_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle for mobile */}
          <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4 sm:hidden shrink-0" />
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-text-primary">Transferir Datos</h3>
            <button onClick={onClose} className="p-2 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-text-secondary transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-accent/10 rounded-[20px] border border-accent/20 flex flex-col gap-1 items-center justify-center text-center">
              <span className="text-xs font-bold text-accent uppercase tracking-wider">Origen (Manual)</span>
              <span className="text-lg font-extrabold text-text-primary">{sourceName}</span>
            </div>

            <div className="flex justify-center">
              <ArrowRight size={24} className="text-text-muted" />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Destino (Biblioteca)</label>
              <div className="relative z-[60]">
                <ExerciseSearchInput 
                  disableManualAdd={true}
                  initialQuery={targetExercise ? targetExercise.name : (existingManuals.includes(targetManualName) ? "" : targetManualName)}
                  onExerciseSelect={(ex) => {
                    if (ex) {
                      if (ex.is_manual || !ex.id) {
                        addToast("No puedes transferir a un ejercicio nuevo. Selecciona uno oficial de la lista o un manual existente abajo.", "warning");
                        return;
                      }
                      setTargetExercise(ex);
                      setTargetManualName(ex.name);
                    }
                  }}
                />
                <p className="text-xs text-text-muted mt-2">Usa el buscador para seleccionar un ejercicio oficial.</p>
              </div>
              
              {!targetExercise && existingManuals.length > 0 && (
                <div className="mt-4">
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">
                    O selecciona otro manual existente:
                  </label>
                  <CustomSelect
                    value={targetManualName}
                    onChange={(val) => {
                      setTargetManualName(val);
                      setTargetExercise(null);
                    }}
                    options={[
                      { value: "", label: "-- Seleccionar --" },
                      ...existingManuals.map(name => ({ value: name, label: name }))
                    ]}
                    className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px]"
                    triggerClassName="w-full py-3 bg-transparent px-4 flex items-center justify-between gap-1 focus:ring-2 focus:ring-accent/50 outline-none transition-all appearance-none rounded-[16px]"
                    textClassName="text-sm text-text-primary text-left truncate flex-1"
                    searchable={true}
                  />
                </div>
              )}
              {targetExercise && (
                <div className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-[16px] flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[12px] overflow-hidden shrink-0 ring-1 ring-black/5 dark:ring-white/10 bg-black/5 dark:bg-white/5 p-1">
                    <ExerciseMedia 
                      details={targetExercise} 
                      fitMode="cover"
                      disableAnimation={true}
                      className="w-full h-full object-cover rounded-[8px]" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-text-primary block truncate">{targetExercise.name}</span>
                  </div>
                  <button onClick={() => { setTargetExercise(null); setTargetManualName(""); }} className="text-xs text-[#ef4444] font-bold uppercase hover:bg-[#ef4444]/10 px-3 py-2 rounded-lg transition-colors">Quitar</button>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (deleteSource ? "bg-accent border-accent text-white" : "border-text-muted bg-transparent text-transparent group-hover:border-accent")}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-text-primary">Mover datos y eliminar "{sourceName}"</span>
                <input type="checkbox" className="hidden" checked={deleteSource} onChange={() => setDeleteSource(!deleteSource)} />
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={"w-5 h-5 rounded border flex items-center justify-center transition-colors " + (replaceInRoutines ? "bg-accent border-accent text-white" : "border-text-muted bg-transparent text-transparent group-hover:border-accent")}>
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium text-text-primary">Reemplazar en mis rutinas guardadas</span>
                <input type="checkbox" className="hidden" checked={replaceInRoutines} onChange={() => setReplaceInRoutines(!replaceInRoutines)} />
              </label>
            </div>
            
            {!deleteSource && (
              <div className="p-3 bg-yellow-500/10 rounded-[16px] flex gap-3 items-start">
                <AlertTriangle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Si no eliminas el origen, se copiará todo el historial al ejercicio de destino, manteniendo tus datos también en el original.</p>
              </div>
            )}

          </div>
          
          <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/10">
            <button onClick={onClose} className="px-5 py-3 rounded-xl text-sm font-bold bg-bg-secondary border border-glass-border text-text-primary hover:bg-bg-tertiary transition-colors">Cancelar</button>
            <button 
              onClick={handleConfirm} 
              disabled={isSubmitting}
              className="px-5 py-3 rounded-xl text-sm font-bold bg-accent text-white hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Transfiriendo..." : "Transferir"}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

const ManualExercisesManager = () => {
  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [infoExercise, setInfoExercise] = useState(null);
  
  
  const loadManualExercises = async () => {
    setIsLoading(true);
    try {
      const data = await api('/exercise-list/manual-exercises');
      setExercises(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadManualExercises();
      }, []);

  return (
    <div className="animate-fade-in pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-text-primary flex items-center gap-3">
          <Dumbbell className="text-accent" size={28} />
          Ejercicios Manuales
        </h2>
        <p className="text-sm text-text-secondary mt-2">
          Aquí puedes ver los ejercicios que has creado manualmente (fuera del catálogo oficial). Puedes seleccionarlos para fusionar su historial con ejercicios oficiales de la app si lo deseas.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10">
          <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="text-center p-10 bg-black/5 dark:bg-white/5 rounded-[24px]">
          <p className="text-text-secondary font-medium">No tienes ejercicios manuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex) => (
            <GlassCard key={ex.name} className="glass p-5 rounded-[24px] flex flex-col gap-4 group">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-text-primary text-lg truncate">{ex.name}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setInfoExercise(ex.name)}
                    className="shrink-0 p-2 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full text-text-secondary transition-colors"
                  >
                    <Info size={16} />
                  </button>
                  <button 
                    onClick={() => setSelectedExercise(ex.name)}
                    className="shrink-0 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-accent hover:text-white rounded-[12px] text-xs font-bold text-text-secondary transition-colors"
                  >
                    Transferir
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {ex.totalSets > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary">
                    <Dumbbell size={12} className="text-text-muted" />
                    <span>{ex.totalSets} series reg.</span>
                  </div>
                )}
                {ex.inRoutines > 0 && (
                  <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-2.5 py-1 rounded-lg text-xs font-medium text-text-secondary">
                    <span className="w-3 h-3 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[8px]">R</span>
                    <span>En {ex.inRoutines} rutinas</span>
                  </div>
                )}
                {ex.maxWeight > 0 && (
                  <div className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                    <span>RM: {ex.maxWeight} kg</span>
                  </div>
                )}
                {ex.totalSets === 0 && ex.inRoutines === 0 && (
                  <span className="text-xs text-text-muted italic">Sin datos registrados</span>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {selectedExercise && (
        <TransferModal 
          sourceName={selectedExercise} 
          existingManuals={exercises.map(e => e.name).filter(name => name !== selectedExercise)}
          onClose={() => setSelectedExercise(null)} 
          onTransferSuccess={loadManualExercises}
        />
      )}

      {infoExercise && (
        <ManualExerciseInfoModal 
          exerciseName={infoExercise} 
          onClose={() => setInfoExercise(null)} 
        />
      )}
    </div>
  );
};








export default ManualExercisesManager;


