/* frontend/src/pages/RoutineEditor.jsx */
import React from 'react';

// Importamos el hook y los componentes
import { useRoutineEditor } from '../hooks/useRoutineEditor';
import RoutineHeader from '../components/RoutineEditor/RoutineHeader';
import ExerciseList from '../components/RoutineEditor/ExerciseList';
import RoutineActions from '../components/RoutineEditor/RoutineActions';
import Spinner from '../components/Spinner';

const RoutineEditor = ({ routine: initialRoutine, onSave: handleSaveProp, onCancel, initialFolder }) => {

  // Usamos el hook para toda la lógica
  const {
    id,
    routineName, setRoutineName,
    description, setDescription,
    imageUrl, setImageUrl,
    folder, setFolder, // <-- NUEVO: Estado de carpeta
    exercises,
    isLoading,
    isSaving,
    isDeleting,
    isUploadingImage,
    showDeleteConfirm, setShowDeleteConfirm,
    validationError,

    activeDropdownTempId, setActiveDropdownTempId,
    replacingExerciseTempId,

    handleSave,
    handleDelete,
    handleCancel,
    handleImageUpload,

    addExercise,
    updateExerciseField,
    linkExerciseFromList,
    removeExercise,
    createSuperset,
    unlinkGroup,
    onDragEnd,
    handleAddExercisesFromSearch,

    groupedExercises,
    handleReplaceClick,
    handleSearchModalClose,
    handleOpenSearchForAdd,
    showExerciseSearch,

    // Funciones wrappers importadas del hook
    handleSelectExerciseForReplace,
    handleAddCustomExerciseForReplace

  } = useRoutineEditor({ initialRoutine, onSave: handleSaveProp, onCancel, initialFolder });

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 pb-4 animate-[fade-in_0.5s_ease_out]">

      <RoutineHeader
        id={id}
        onCancel={handleCancel}
        validationError={validationError}
        routineName={routineName}
        setRoutineName={setRoutineName}
        description={description}
        setDescription={setDescription}
        imageUrl={imageUrl}
        setImageUrl={setImageUrl}
        onImageUpload={handleImageUpload}
        isUploadingImage={isUploadingImage}
        folder={folder} // <-- Pasar prop
        setFolder={setFolder} // <-- Pasar prop
      />

      <ExerciseList
        groupedExercises={groupedExercises}
        exercises={exercises}
        onDragEnd={onDragEnd}
        activeDropdownTempId={activeDropdownTempId}
        setActiveDropdownTempId={setActiveDropdownTempId}
        onFieldChange={updateExerciseField}
        onExerciseSelect={linkExerciseFromList}
        removeExercise={removeExercise}
        unlinkGroup={unlinkGroup}
        createSuperset={createSuperset}
        onReplaceClick={handleReplaceClick}
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
        onAddFromSearch={handleAddExercisesFromSearch}

        // Reemplazo
        isReplacing={replacingExerciseTempId !== null}
        onExerciseSelectForReplace={handleSelectExerciseForReplace}
        onAddCustomExercise={handleAddCustomExerciseForReplace}
      />

    </div>
  );
};

export default RoutineEditor;