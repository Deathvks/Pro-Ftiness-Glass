import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Play, Pause, Square } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import ConfirmationModal from '../components/ConfirmationModal';

const Workout = ({ routine, setView, logWorkout }) => {
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
    const countRef = useRef(null);

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

    const confirmFinishWorkout = () => {
        const workoutData = {
            routineName: routine.name,
            duration_seconds: timer,
            calories_burned: 0,
            details: session.map(ex => ({
                exerciseName: ex.name,
                setsDone: ex.setsDone.filter(set => set.reps !== '' && set.weight_kg !== '')
            }))
        };
        logWorkout(workoutData);
        setShowFinishModal(false);
        setView('dashboard');
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
                        <div className="grid grid-cols-[50px_1fr_1fr] gap-4 text-center text-xs font-bold text-text-secondary mb-2">
                            <span>SERIE</span>
                            <span>PESO (kg)</span>
                            <span>REPS</span>
                        </div>
                        <div className="flex flex-col gap-3">
                            {ex.setsDone.map((set, setIndex) => (
                                <div key={setIndex} className="grid grid-cols-[50px_1fr_1fr] gap-4 items-center">
                                    <span className="flex items-center justify-center font-bold bg-bg-secondary p-3 rounded-md border border-glass-border">
                                        {set.set_number}
                                    </span>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={set.weight_kg}
                                        onChange={(e) => handleSetChange(exIndex, setIndex, 'weight_kg', e.target.value)}
                                        className={baseInputClasses}
                                    />
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={set.reps}
                                        onChange={(e) => handleSetChange(exIndex, setIndex, 'reps', e.target.value)}
                                        className={baseInputClasses}
                                    />
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                ))}
            </div>

            {showFinishModal &&
                <ConfirmationModal
                    message="¿Finalizar y guardar el entrenamiento?"
                    onConfirm={confirmFinishWorkout}
                    onCancel={() => setShowFinishModal(false)}
                    confirmText="Finalizar"
                />
            }
        </div>
    );
};

export default Workout;