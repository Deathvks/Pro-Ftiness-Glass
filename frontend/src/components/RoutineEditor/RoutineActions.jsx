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
  // --- FIN DE la MODIFICACIÓN (FIX BUG "CARRITO") ---
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
        {/* --- FIN DE la MODIFICACIÓN --- */}
        <button
          onClick={onAddManual}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition border border-accent/20"
        >
          <Plus size={20} />
          <span>Añadir Ejercicio Manual</span>
        </button>
      </div>

      {/* --- INICIO DE LA MODIFICACIÓN --- */}
      {/* Contenedor de acciones:
        - flex-row: Siempre en fila
        - flex-nowrap: Evita que los botones salten de línea
        - gap-2: Espacio reducido entre botones (antes gap-4)
      */}
      <div className="flex flex-row flex-nowrap justify-between items-center gap-2 mt-8">
      {/* --- FIN DE LA MODIFICACIÓN --- */}
        {id ? (
          <button
            onClick={onDeleteClick}
            disabled={isDeleting}
            /* Clases modificadas para móvil:
              - sm:px-6: Padding horizontal normal en pantallas sm y mayores
              - px-4 py-3: Padding reducido en pantallas pequeñas (móvil)
            */
            className="sm:px-6 px-4 py-3 rounded-xl bg-red/10 text-red hover:bg-red/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Spinner size={20} /> : <Trash2 size={20} />}
            {/* - whitespace-nowrap: Evita que el texto se parta en dos líneas
              - sm:text-base: Texto normal en sm y mayores
              - text-sm: Texto pequeño en móvil
            */}
            <span className="whitespace-nowrap sm:text-base text-sm">Eliminar Rutina</span>
          </button>
        ) : (
          <div></div> // Placeholder para alinear
        )}
        
        <button
          onClick={onSave}
          disabled={isSaving}
          /* Clases modificadas para móvil:
            - sm:px-8 sm:py-4: Padding grande en sm y mayores
            - px-5 py-3: Padding reducido en móvil
            - sm:text-lg: Texto grande en sm y mayores
            - text-base: Texto base en móvil
          */
          className="sm:px-8 sm:py-4 px-5 py-3 rounded-xl bg-accent text-white font-bold sm:text-lg text-base transition hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accent/30"
        >
          {isSaving ? <Spinner size={24} /> : <Save size={24} />}
          {/* whitespace-nowrap: Evita que el texto se parta en dos líneas */}
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
          // --- INICIO DE LA MODIFICACIÓN (FIX BUG "CARRITO") ---
          initialSelectedExercises={initialSelectedExercises} // 2. La pasamos al modal
          // --- FIN DE la MODIFICACIÓN (FIX BUG "CARRITO") ---
        />
      )}
    </>
  );
};

export default RoutineActions;