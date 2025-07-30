import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Square, FileText, Clock } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';
import RestTimerModal from '../components/RestTimerModal';
import useAppStore from '../store/useAppStore'; // 1. Importar el hook del store
import { useToast } from '../hooks/useToast';   // 2. Importar el hook para notificaciones

const Workout = ({ routine, setView }) => {
    // 3. Obtener la acción `logWorkout` del store
    const logWorkout = useAppStore(state => state.logWorkout);
    const { addToast } = useToast();

    const [session, setSession] = useState(() => {
        const exercises = routine.RoutineExercises || [];
        return exercises.map(ex => ({
            ...ex,
            setsDone: Array.from({ length: ex.sets }, (_, i) => ({
                set_number: i + 1,
                reps: '',
                weight_kg: ''
            }))
        }));
    });

    const [timer, setTimer] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [notes, setNotes] = useState('');
    const countRef = useRef(null);
    const [isResting, setIsResting] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Estado para el spinner del modal

    useEffect(() => {
        if (isActive) {
            countRef.current = setInterval(() => {
                setTimer((prevTimer) => prevTimer + 1);
            }, 1000);
        } else {
            clearInterval(countRef.current);
        }
        return () => clearInterval(countRef.current);
    }, [isActive]);

    const formatTime = (timeInSeconds) => {
        const hours = String(Math.floor(timeInSeconds / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((timeInSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(timeInSeconds % 60).padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    };

    const handleSetChange = (exIndex, setIndex, field, value) => {
        const newSession = [...session];
        const parsedValue = value === '' ? '' : parseFloat(value);
        newSession[exIndex].setsDone[setIndex][field] = isNaN(parsedValue) ? '' : parsedValue;
        setSession(newSession);
    };

    const handleFinishClick = () => {
        setIsActive(false);
        setShowFinishModal(true);
    };

    const confirmFinishWorkout = async () => {
        setIsSaving(true);
        const workoutData = {
            routineName: routine.name,
            duration_seconds: timer,
            calories_burned: 0, // Se calcula en el backend
            notes: notes,
            details: session.map(ex => ({
                exerciseName: ex.name,
                setsDone: ex.setsDone.filter(set => set.reps !== '' && set.weight_kg !== '')
            }))
        };
        
        // 4. Llamar a la acción del store y gestionar la respuesta
        const result = await logWorkout(workoutData);
        
        if (result.success) {
            addToast(result.message, 'success');
            setShowFinishModal(false);
            setView('dashboard');
        } else {
            addToast(result.message, 'error');
        }
        setIsSaving(false);
    };
    
    const baseInputClasses = "w-full text-center bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            <button onClick={() => setView('routines')} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
                <ChevronLeft size={20} />
                Volver a Rutinas
            </button>

            <GlassCard className="p-6 mb-6">
                <h1 className="text-3xl font-bold">{routine.name}</h1>
                <div className="flex justify-between items-center mt-4">
                    <div className="font-mono text-5xl font-bold">{formatTime(timer)}</div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsActive(!isActive)} className={`p-4 rounded-full transition text-white ${isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green hover:bg-green/80'}`}>
                            {isActive ? <Pause size={24} /> : <Play size={24} />}
                        </button>
                        <button onClick={handleFinishClick} className="p-4 rounded-full bg-red text-white transition hover:bg-red/80">
                            <Square size={24} />
                        </button>
                    </div>
                </div>
            </GlassCard>

            <div className="flex flex-col gap-6">
                {session.map((ex, exIndex) => (
                    <GlassCard key={ex.id || exIndex} className="p-6">
                        <div className="pb-4 border-b border-glass-border mb-4">
                            <h2 className="text-xl font-bold">{ex.name}</h2>
                            <p className="text-sm text-text-muted">Objetivo: {ex.sets} x {ex.reps} reps</p>
                        </div>
                        <div className="grid grid-cols-[50px_1fr_1fr_auto] gap-4 text-center text-xs font-bold text-text-secondary mb-2">
                            <span>SERIE</span>
                            <span>PESO (kg)</span>
                            <span>REPS</span>
                            <span></span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {ex.setsDone.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-[50px_1fr_1fr_auto] gap-4 items-center">
                                    <span className="flex items-center justify-center font-bold bg-bg-secondary p-3 rounded-md border border-glass-border">
                                        {set.set_number}
                                    </span>
                                    <input type="number" placeholder="0" value={set.weight_kg} onChange={(e) => handleSetChange(exIndex, setIndex, 'weight_kg', e.target.value)} className={baseInputClasses} />
                                    <input type="number" placeholder="0" value={set.reps} onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)} className={baseInputClasses} />
                                    <button 
                                      onClick={() => setIsResting(true)}
                                      className="p-3 rounded-md bg-bg-secondary border border-glass-border text-text-secondary hover:text-accent hover:border-accent/50 transition"
                                      title="Iniciar descanso"
                                    >
                                        <Clock size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                ))}
            </div>
            
            <GlassCard className="p-6 mt-6">
                <h2 className="flex items-center gap-2 text-xl font-bold mb-4">
                    <FileText size={20} />
                    Notas de la Sesión
                </h2>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="¿Cómo te sentiste? ¿Alguna observación?..."
                    className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition resize-none"
                    rows="3"
                ></textarea>
            </GlassCard>

            {isResting && <RestTimerModal onClose={() => setIsResting(false)} />}

            {showFinishModal &&
                <ConfirmationModal
                    message="¿Finalizar y guardar el entrenamiento?"
                    onConfirm={confirmFinishWorkout}
                    onCancel={() => setShowFinishModal(false)}
                    confirmText="Finalizar"
                    isLoading={isSaving} // Pasar el estado de carga al modal
                />
            }
        </div>
    );
};

export default Workout;