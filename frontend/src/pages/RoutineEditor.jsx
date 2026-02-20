/* frontend/src/pages/RoutineEditor.jsx */
import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

// Importamos el hook y los componentes
import { useRoutineEditor } from '../hooks/useRoutineEditor';
import RoutineHeader from '../components/RoutineEditor/RoutineHeader';
import ExerciseList from '../components/RoutineEditor/ExerciseList';
import RoutineActions from '../components/RoutineEditor/RoutineActions';
import Spinner from '../components/Spinner';
import RoutineAnalysisModal from '../components/RoutineEditor/RoutineAnalysisModal';

const RoutineEditor = ({ routine: initialRoutine, onSave: handleSaveProp, onCancel, initialFolder }) => {

  // Estado local para el modal de análisis IA
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Usamos el hook para toda la lógica
  const {
    id,
    routineName, setRoutineName,
    description, setDescription,
    imageUrl, setImageUrl,
    folder, setFolder,
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
        folder={folder}
        setFolder={setFolder}
      />

      {/* --- NUEVO: Mostrar la explicación general de la IA --- */}
      {initialRoutine?.ai_explanation && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Sparkles className="w-6 h-6 text-accent shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-accent mb-1">Nota del Entrenador IA</h4>
            <p className="text-sm text-text-primary/90">{initialRoutine.ai_explanation}</p>
          </div>
        </div>
      )}

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
        
        // Acción para analizar
        onAnalyze={() => setShowAnalysis(true)}

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

      <RoutineAnalysisModal 
        isOpen={showAnalysis}
        onClose={() => setShowAnalysis(false)}
        exercises={exercises}
      />

    </div>
  );
};

export default RoutineEditor;