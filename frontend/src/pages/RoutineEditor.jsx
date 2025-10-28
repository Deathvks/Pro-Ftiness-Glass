/* frontend/src/pages/RoutineEditor.jsx */
import React from 'react';

// Importamos el hook y los nuevos componentes
import { useRoutineEditor } from '../hooks/useRoutineEditor';
import RoutineHeader from '../components/RoutineEditor/RoutineHeader';
import ExerciseList from '../components/RoutineEditor/ExerciseList';
import RoutineActions from '../components/RoutineEditor/RoutineActions';

// Importaciones que aún necesitamos
import Spinner from '../components/Spinner';

// Aceptamos las mismas props que antes
const RoutineEditor = ({ routine: initialRoutine, onSave: handleSaveProp, onCancel }) => {
  
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
    // showExerciseSearch (ya no lo necesitamos aquí)
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

    // Obtenemos las funciones del hook
    handleReplaceClick,
    handleSearchModalClose,

    // --- INICIO DE LA MODIFICACIÓN (FIX BUG) ---
    // 1. Obtenemos la nueva función para "Añadir"
    handleOpenSearchForAdd,
    // --- FIN DE LA MODIFICACIÓN (FIX BUG) ---
    
    // 2. Obtenemos el estado de visibilidad del modal (sigue siendo necesario)
    showExerciseSearch, 

  } = useRoutineEditor({ initialRoutine, onSave: handleSaveProp, onCancel });


  if (isLoading && id) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  // Renderizamos los nuevos componentes y les pasamos las props desde el hook
  
  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 pb-40 animate-[fade-in_0.5s_ease-out]">
      
      <RoutineHeader
        id={id}
        onCancel={onCancel}
        validationError={validationError}
        routineName={routineName}
        setRoutineName={setRoutineName}
        description={description}
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
        onReplaceClick={handleReplaceClick}
      />

      <RoutineActions
        // --- INICIO DE LA MODIFICACIÓN (FIX BUG) ---
        // 3. Conectamos el botón a la función correcta
        onShowSearch={handleOpenSearchForAdd}
        // --- FIN DE LA MODIFICACIÓN (FIX BUG) ---
        onAddManual={addExercise}
        
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
        onDeleteCancel={() => setShowDeleteConfirm(false)}
        
        // Modal Búsqueda
        showExerciseSearch={showExerciseSearch}
        onSearchClose={handleSearchModalClose}
        onAddFromSearch={handleAddExercisesFromSearch}
      />
      
    </div>
  );
};

export default RoutineEditor;