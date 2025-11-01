/* frontend/src/components/RoutineEditor/RoutineActions.jsx */
import React from 'react';
import { Plus, Save, Trash2, Library } from 'lucide-react';
import Spinner from '../Spinner';
import ConfirmationModal from '../ConfirmationModal';
import ExerciseSearch from '../RoutineEditor/ExerciseSearch';

const RoutineActions = ({
  // Props para botones de añadir
  onShowSearch,
  onAddManual,

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

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/*
        Contenedor de acciones:
        - Móvil (default):
          - flex-col-reverse: Apilados verticalmente (Guardar arriba, Eliminar abajo)
          - items-center: Centrados
          - gap-4: Espacio vertical
        - Escritorio (sm:):
          - sm:flex-row: En fila
          - sm:justify-between: Extremos opuestos
          - sm:gap-2: Espacio horizontal
      */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-4 sm:gap-2 mt-8">
      {/* --- FIN DE LA MODIFICACIÓN --- */}
        {id ? (
          <button
            onClick={onDeleteClick}
            disabled={isDeleting}
            /*
              Clases modificadas:
              - w-full sm:w-auto: Ocupa todo el ancho en móvil, ancho automático en escritorio
            */
            className="w-full sm:w-auto sm:px-6 px-4 py-3 rounded-xl bg-red/10 text-red hover:bg-red/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Spinner size={20} /> : <Trash2 size={20} />}
            <span className="whitespace-nowrap sm:text-base text-sm">Eliminar Rutina</span>
          </button>
        ) : (
          // --- INICIO DE LA MODIFICACIÓN ---
          // Placeholder:
          // - Oculto en móvil (para que no ocupe espacio)
          // - Visible en escritorio (para que 'justify-between' funcione)
          <div className="hidden sm:block"></div>
          // --- FIN DE LA MODIFICACIÓN ---
        )}
        
        <button
          onClick={onSave}
          disabled={isSaving}
          /*
            Clases modificadas:
            - w-full sm:w-auto: Ocupa todo el ancho en móvil, ancho automático en escritorio
          */
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