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
    
    activeDropdownTempId, setActiveDropdownTempId,
    
    // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---
    // 1. Obtenemos el ID del ejercicio a reemplazar
    replacingExerciseTempId,
    // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---

    handleSave,
    handleDelete,
    // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
    handleCancel, // <-- 1. Obtenemos el handleCancel envuelto del hook
    // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
    addExercise,
    updateExerciseField,
    linkExerciseFromList, // <-- Esta es la función de reemplazo
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch, // <-- Esta es la función de añadir (carrito)
    
    // No necesitamos 'addCustomExercise' del hook, crearemos uno manual
    
    groupedExercises,
    handleReplaceClick,
    handleSearchModalClose,
    handleOpenSearchForAdd,
    showExerciseSearch, 

  } = useRoutineEditor({ initialRoutine, onSave: handleSaveProp, onCancel });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }
  
  // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---
  // 2. Creamos la función que reemplaza un ejercicio de la biblioteca
  // Esta función "envuelve" linkExerciseFromList con el tempId
  const handleSelectExerciseForReplace = (selectedExercise) => {
    if (replacingExerciseTempId) {
      linkExerciseFromList(replacingExerciseTempId, selectedExercise);
    }
    handleSearchModalClose(); // Cierra el modal inmediatamente
  };

  // 3. Creamos la función que reemplaza por uno manual
  const handleAddCustomExerciseForReplace = (exerciseName) => {
    if (replacingExerciseTempId && exerciseName.trim() !== "") {
      const manualExercise = {
        id: null, // Sin ID de la BD
        name: exerciseName.trim(),
        muscle_group: 'other',
        category: 'other',
        equipment: 'other',
        is_manual: true,
        image_url_start: null,
        video_url: null,
      };
      // Usamos la *misma* función de 'link' para reemplazar
      linkExerciseFromList(replacingExerciseTempId, manualExercise);
    }
    handleSearchModalClose(); // Cierra el modal inmediatamente
  };
  // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 pb-40 animate-[fade-in_0.5s_ease_out]">
      
      <RoutineHeader
        id={id}
        // --- INICIO DE LA MODIFICACIÓN (Persistencia de Borrador) ---
        onCancel={handleCancel} // <-- 2. Usamos el handleCancel del hook
        // --- FIN DE LA MODIFICACIÓN (Persistencia de Borrador) ---
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
        activeDropdownTempId={activeDropdownTempId}
        setActiveDropdownTempId={setActiveDropdownTempId}
        onFieldChange={updateExerciseField}
        onExerciseSelect={linkExerciseFromList} // Este es el dropdown de la tarjeta, OK
        removeExercise={removeExercise}
        unlinkGroup={unlinkGroup}
        createSuperset={createSuperset}
        onReplaceClick={handleReplaceClick} // Este abre el modal, OK
      />

      <RoutineActions
        onShowSearch={handleOpenSearchForAdd}
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
        initialSelectedExercises={exercises}
        showExerciseSearch={showExerciseSearch}
        onSearchClose={handleSearchModalClose}
        onAddFromSearch={handleAddExercisesFromSearch} // <-- Para el modo "Añadir" (carrito)
        
        // --- INICIO DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---
        // 4. Pasamos las nuevas funciones "envueltas" al modal
        isReplacing={replacingExerciseTempId !== null} // <-- Le decimos al modal que reemplace
        onExerciseSelectForReplace={handleSelectExerciseForReplace} // <-- Nueva función
        onAddCustomExercise={handleAddCustomExerciseForReplace} // <-- Nueva función
        // --- FIN DE LA MODIFICACIÓN (FIX REEMPLAZO - CORREGIDO) ---
      />
      
    </div>
  );
};

export default RoutineEditor;