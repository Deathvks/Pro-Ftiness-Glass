import React from 'react';
import ConfirmationModal from '../ConfirmationModal';
import RestTimerModal from '../RestTimerModal';
import CalorieInputModal from '../CalorieInputModal';
import ExerciseReplaceModal from '../../pages/ExerciseReplaceModal'; // Ajusta la ruta si es necesario
import SetTypeSelectorModal from '../SetTypeSelectorModal';

/**
 * Renderiza condicionalmente todos los modales utilizados en la pantalla de Workout.
 */
const WorkoutModals = ({
    // Props para ConfirmationModal (cancelar)
    showCancelModal,
    onConfirmCancel,
    onCancelCancel,
    // Props para RestTimerModal
    isResting,
    // Props para CalorieInputModal (finalizar)
    showCalorieModal,
    estimatedCalories,
    onCalorieInputComplete,
    onCalorieInputCancel,
    isSaving,
    // Props para ExerciseReplaceModal
    exerciseToReplaceIndex, // Renombrado de exerciseToReplace para claridad
    onCloseReplaceModal,
    // Props para SetTypeSelectorModal
    showSetTypeModal,
    setTypeModalData, // Contiene { exIndex, setIndex, currentType }
    onSetTypeSelect,
    onCloseSetTypeModal,
}) => {
    return (
        <>
            {/* Modal de confirmación para cancelar */}
            {showCancelModal && (
                <ConfirmationModal
                    message="¿Seguro que quieres descartar este entrenamiento? Perderás todo el progreso."
                    onConfirm={onConfirmCancel}
                    onCancel={onCancelCancel}
                    confirmText="Descartar"
                />
            )}

            {/* Modal del temporizador de descanso */}
            {isResting && <RestTimerModal />}

            {/* Modal de entrada de calorías al finalizar */}
            {showCalorieModal && (
                <CalorieInputModal
                    estimatedCalories={estimatedCalories}
                    onComplete={onCalorieInputComplete}
                    onCancel={onCalorieInputCancel}
                    isSaving={isSaving}
                />
            )}

            {/* Modal para reemplazar ejercicio */}
            {exerciseToReplaceIndex !== null && (
                <ExerciseReplaceModal
                    exerciseIndex={exerciseToReplaceIndex}
                    onClose={onCloseReplaceModal}
                />
            )}

            {/* Modal para seleccionar tipo de serie */}
            {showSetTypeModal && setTypeModalData && (
                <SetTypeSelectorModal
                    currentType={setTypeModalData.currentType}
                    onSelect={onSetTypeSelect}
                    onClose={onCloseSetTypeModal}
                />
            )}
        </>
    );
};

export default WorkoutModals;