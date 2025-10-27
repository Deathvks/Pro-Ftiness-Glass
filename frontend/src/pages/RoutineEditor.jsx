/* frontend/src/pages/RoutineEditor.jsx */
import React from 'react';

// --- INICIO MODIFICACIÓN ---
// Importamos el hook y los nuevos componentes
import { useRoutineEditor } from '../hooks/useRoutineEditor';
import RoutineHeader from '../components/RoutineEditor/RoutineHeader';
import ExerciseList from '../components/RoutineEditor/ExerciseList';
import RoutineActions from '../components/RoutineEditor/RoutineActions';
// --- FIN MODIFICACIÓN ---

// Importaciones que aún necesitamos
import Spinner from '../components/Spinner';

// Eliminamos un montón de importaciones antiguas (useState, useEffect, services, etc.)

// Aceptamos las mismas props que antes
const RoutineEditor = ({ routine: initialRoutine, onSave: handleSaveProp, onCancel }) => {
  
  // --- INICIO MODIFICACIÓN ---
  // Usamos el hook para toda la lógica
  const {
    id,
    routineName, setRoutineName,
    description, setDescription,
    exercises,
    isLoading,
    isSaving,
    isDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    validationError,
    showExerciseSearch, setShowExerciseSearch,
    activeDropdownIndex, setActiveDropdownIndex,
    
    handleSave,
    handleDelete,
    addExercise,
    updateExerciseField,
    linkExerciseFromList,
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,
    
    groupedExercises,
  } = useRoutineEditor({ initialRoutine, onSave: handleSaveProp, onCancel });
  // --- FIN MODIFICACIÓN ---


  if (isLoading && id) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  // --- INICIO MODIFICACIÓN ---
  // Renderizamos los nuevos componentes y les pasamos las props desde el hook
  
  // --- INICIO DE LA MODIFICACIÓN (VISIBILIDAD) ---
  // Añadimos 'pb-40' (padding-bottom: 10rem) al div principal
  // para dejar espacio al final para la barra de acciones sticky.
  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 pb-40 animate-[fade-in_0.5s_ease-out]">
  {/* --- FIN DE LA MODIFICACIÓN (VISIBILIDAD) --- */}
      
      <RoutineHeader
        id={id}
        onCancel={onCancel}
        validationError={validationError}
        routineName={routineName}
        setRoutineName={setRoutineName}
        // --- INICIO DE LA CORRECCIÓN ---
        // Corregido el error [object Object]
        description={description}
        // --- FIN DE LA CORRECCIÓN ---
        setDescription={setDescription}
      />

      <ExerciseList
        groupedExercises={groupedExercises}
        exercises={exercises}
        onDragEnd={onDragEnd}
        activeDropdownIndex={activeDropdownIndex}
        setActiveDropdownIndex={setActiveDropdownIndex}
        onFieldChange={updateExerciseField}
        onExerciseSelect={linkExerciseFromList}
        removeExercise={removeExercise}
        unlinkGroup={unlinkGroup}
        createSuperset={createSuperset}
      />

      <RoutineActions
        // Añadir
        onShowSearch={() => setShowExerciseSearch(true)}
        // --- INICIO DE LA CORRECCIÓN ---
        // Eliminado el carácter 'Â'
        onAddManual={addExercise}
        // --- FIN DE LA CORRECCIÓN ---
        
        // Guardar/Eliminar
        id={id}
        isSaving={isSaving}
        isDeleting={isDeleting}
        onSave={handleSave}
        onDeleteClick={() => setShowDeleteConfirm(true)}

        // Modal Eliminación
        routineName={routineName}
        showDeleteConfirm={showDeleteConfirm}
        onDeleteConfirm={handleDelete}
    s     onDeleteCancel={() => setShowDeleteConfirm(false)}
        // --- INICIO DE LA CORRECCIÓN ---
        // Eliminado el carácter 's'
        // --- FIN DE LA CORRECCIÓN ---
        
        // Modal Búsqueda
        showExerciseSearch={showExerciseSearch}
        onSearchClose={() => setShowExerciseSearch(false)}
        onAddFromSearch={handleAddExercisesFromSearch}
      />
      
    </div>
  );
  // --- FIN MODIFICACIÓN ---
};

export default RoutineEditor;