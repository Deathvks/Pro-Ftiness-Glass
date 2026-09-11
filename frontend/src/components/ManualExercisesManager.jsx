import React, { useState, useEffect } from "react";
import api from "../services/apiClient";
import GlassCard from "./GlassCard";
import { Dumbbell, ArrowRight, Check, X, AlertTriangle } from "lucide-react";
import ExerciseSearchInput from "./ExerciseSearchInput";
import { useToast } from "../hooks/useToast";
import { useTranslation } from "react-i18next";
import ModalPortal from "./ModalPortal";

const TransferModal = ({ sourceName, onClose, onTransferSuccess }) => {
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
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Destino (Biblioteca o Nuevo Manual)</label>
              <div className="relative z-[60]">
                <ExerciseSearchInput 
                  initialQuery={targetExercise ? targetExercise.name : targetManualName}
                  onExerciseSelect={(ex) => {
                    if (ex) {
                      setTargetExercise(ex);
                      setTargetManualName(ex.name);
                    }
                  }}
                />
                <p className="text-xs text-text-muted mt-2">Usa el buscador para seleccionar un ejercicio oficial. Si solo escribes un nombre y no seleccionas ninguno de la lista, se creará un nuevo manual.</p>
              </div>
              
              {!targetExercise && (
                <div className="mt-3">
                  <input 
                    type="text" 
                    placeholder="O escribe un nombre manual aquí..." 
                    value={targetManualName}
                    onChange={(e) => {
                      setTargetManualName(e.target.value);
                      setTargetExercise(null);
                    }}
                    className="w-full bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[16px] px-4 py-3 text-sm text-text-primary outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              )}
              {targetExercise && (
                <div className="mt-3 flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-[16px]">
                  <span className="text-sm font-bold text-text-primary">{targetExercise.name}</span>
                  <button onClick={() => { setTargetExercise(null); setTargetManualName(""); }} className="text-xs text-red-500 font-bold uppercase hover:underline">Quitar</button>
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
                <p className="text-xs text-yellow-600 dark:text-yellow-400">Si no eliminas el origen, se creará un duplicado exacto del historial bajo el nuevo nombre, manteniendo ambos.</p>
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
          {exercises.map((name) => (
            <GlassCard key={name} className="glass p-4 rounded-[20px] flex items-center justify-between group">
              <span className="font-bold text-text-primary truncate pr-4">{name}</span>
              <button 
                onClick={() => setSelectedExercise(name)}
                className="shrink-0 px-4 py-2 bg-black/5 dark:bg-white/5 hover:bg-accent/10 hover:text-accent rounded-[12px] text-xs font-bold text-text-secondary transition-colors"
              >
                Transferir
              </button>
            </GlassCard>
          ))}
        </div>
      )}

      {selectedExercise && (
        <TransferModal 
          sourceName={selectedExercise} 
          onClose={() => setSelectedExercise(null)} 
          onTransferSuccess={loadManualExercises}
        />
      )}
    </div>
  );
};

export default ManualExercisesManager;








