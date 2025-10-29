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
  // --- INICIO DE LA MODIFICACIÓN (FIX BUG "CARRITO") ---
  initialSelectedExercises, // 1. Recibimos la prop desde RoutineEditor
  // --- FIN DE LA MODIFICACIÓN (FIX BUG "CARRITO") ---
}) => {
  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* --- INICIO DE LA MODIFICACIÓN --- */}
        <button
          onClick={onShowSearch}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white font-semibold hover:scale-105 transition animate-pulse-accent shadow-lg shadow-accent/30"
        >
          <Library size={20} />
          <span>Añadir desde Biblioteca</span>
        </button>
        {/* --- FIN DE LA MODIFICACIÓN --- */}
        <button
          onClick={onAddManual}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition border border-accent/20"
        >
          <Plus size={20} />
          <span>Añadir Ejercicio Manual</span>
        </button>
      </div>

      <div className="flex justify-between items-center mt-8">
        {id ? (
          <button
            onClick={onDeleteClick}
            disabled={isDeleting}
            className="px-6 py-3 rounded-xl bg-red/10 text-red hover:bg-red/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Spinner size={20} /> : <Trash2 size={20} />}
            <span>Eliminar Rutina</span>
          </button>
        ) : (
          <div></div> // Placeholder para alinear
        )}
        
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-8 py-4 rounded-xl bg-accent text-white font-bold text-lg transition hover:scale-105 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-accent/30"
        >
          {isSaving ? <Spinner size={24} /> : <Save size={24} />}
          <span>{id ? 'Guardar Cambios' : 'Crear Rutina'}</span>
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
          // --- INICIO DE LA MODIFICACIÓN (FIX BUG "CARRITO") ---
          initialSelectedExercises={initialSelectedExercises} // 2. La pasamos al modal
          // --- FIN DE LA MODIFICACIÓN (FIX BUG "CARRITO") ---
        />
      )}
    </>
  );
};

export default RoutineActions;