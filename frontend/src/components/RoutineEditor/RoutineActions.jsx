/* frontend/src/components/RoutineEditor/RoutineActions.jsx */
import React from 'react';
import { Plus, Save, Trash2, Library, Sparkles } from 'lucide-react';
import Spinner from '../Spinner';
import ConfirmationModal from '../ConfirmationModal';
import ExerciseSearch from '../RoutineEditor/ExerciseSearch';

const RoutineActions = ({
  // Props para botones de añadir
  onShowSearch,
  onAddManual,

  // Nuevo prop para Análisis IA
  onAnalyze,

  // Props para botones de guardar/eliminar
  id,
  isSaving,
  isDeleting,
  onSave,
  onDeleteClick,

  // Props para el modal de eliminación
  routineName,
  showDeleteConfirm,
  onDeleteConfirm,
  onDeleteCancel,

  // Props para el modal de búsqueda
  showExerciseSearch,
  onSearchClose,
  onAddFromSearch,
  initialSelectedExercises,

  // Props de reemplazo
  isReplacing,
  onExerciseSelectForReplace,
  onAddCustomExercise,
}) => {
  return (
    <>
      {/* Botón de Análisis IA - Destacado */}
      <div className="mb-4">
        <button
          onClick={onAnalyze}
          /* CAMBIO: Usamos bg-accent para coincidir con el tema, y shadow-accent */
          className="w-full relative overflow-hidden group flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white font-bold shadow-lg shadow-accent/25 transition-all hover:scale-[1.01] active:scale-[0.98] border border-white/10"
        >
          {/* Efecto de brillo al pasar el mouse (un poco más sutil/blanco para que se note sobre cualquier color) */}
          <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          {/* Icono en blanco para asegurar contraste sobre cualquier color de acento */}
          <Sparkles size={20} className="text-white animate-pulse" />
          <span>Analizar Rutina con IA</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={onShowSearch}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white font-semibold hover:scale-105 transition animate-pulse-accent shadow-lg shadow-accent/30"
        >
          <Library size={20} />
          <span>Añadir desde Biblioteca</span>
        </button>
        <button
          onClick={onAddManual}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition border border-accent/20"
        >
          <Plus size={20} />
          <span>Añadir Ejercicio Manual</span>
        </button>
      </div>

      {/* Contenedor de acciones inferiores (Guardar/Eliminar) */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 sm:gap-2 mt-8">
        {id ? (
          <button
            onClick={onDeleteClick}
            disabled={isDeleting}
            className="w-full sm:w-auto sm:px-6 px-4 py-3 rounded-xl bg-red/10 text-red hover:bg-red/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Spinner size={20} /> : <Trash2 size={20} />}
            <span className="whitespace-nowrap sm:text-base text-sm">Eliminar Rutina</span>
          </button>
        ) : (
          <div className="hidden sm:block"></div>
        )}
        
        <button
          onClick={onSave}
          disabled={isSaving}
          className="w-full sm:w-auto sm:px-8 sm:py-4 px-5 py-3 rounded-xl bg-accent text-white font-bold sm:text-lg text-base transition hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/30"
        >
          {isSaving ? <Spinner size={24} /> : <Save size={24} />}
          <span className="whitespace-nowrap">{id ? 'Guardar Cambios' : 'Crear Rutina'}</span>
        </button>
      </div>

      {/* --- MODALES --- */}

      {showDeleteConfirm && (
        <ConfirmationModal
          message={`¿Estás seguro de que quieres eliminar la rutina "${routineName}"? Esta acción no se puede deshacer y borrará todo el historial de entrenamientos asociado.`}
          onConfirm={onDeleteConfirm}
          onCancel={onDeleteCancel}
          confirmText="Eliminar"
          cancelText="Cancelar"
          isLoading={isDeleting}
        />
      )}

      {showExerciseSearch && (
        <ExerciseSearch
          onClose={onSearchClose}
          onAddExercises={onAddFromSearch}
          initialSelectedExercises={initialSelectedExercises}
          isReplacing={isReplacing}
          onExerciseSelectForReplace={onExerciseSelectForReplace}
          onAddCustomExercise={onAddCustomExercise}
        />
      )}
    </>
  );
};

export default RoutineActions;