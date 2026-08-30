import ModalPortal from '../ModalPortal';
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeftIcon, CalendarDaysIcon, CheckCircleIcon, FireIcon, BeakerIcon, ChartPieIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Dumbbell } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import CalendarView from '../progress/CalendarView';
import DailyDetailView from '../progress/DailyDetailView';
import UserAvatar from '../UserAvatar';

const WEEKDAYS = [
  { id: '1', label: 'Lunes', short: 'L' },
  { id: '2', label: 'Martes', short: 'M' },
  { id: '3', label: 'Miércoles', short: 'X' },
  { id: '4', label: 'Jueves', short: 'J' },
  { id: '5', label: 'Viernes', short: 'V' },
  { id: '6', label: 'Sábado', short: 'S' },
  { id: '0', label: 'Domingo', short: 'D' }
];

export default function ClientDetailPanel({ client, onBack }) {
  const [workouts, setWorkouts] = useState([]);
  const [assignedRoutines, setAssignedRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  const [trainingDays, setTrainingDays] = useState(
    client?.anamnesisData?.trainingDays || []
  );
  const [savingDays, setSavingDays] = useState(false);
  const [detailedLog, setDetailedLog] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchData();
  }, [client.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch workouts
      const workoutsData = await apiClient(`/trainer/clients/${client.id}/workouts`);
      setWorkouts(workoutsData);

      // Fetch routines to filter assigned ones
      const routinesData = await apiClient('/trainer/routines');
      const assigned = routinesData.filter(r => r.AssignedClients?.some(c => c.id === client.id));
      setAssignedRoutines(assigned);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar datos del cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = async (dayId) => {
    const newDays = trainingDays.includes(dayId) ?
      trainingDays.filter((d) => d !== dayId) :
      [...trainingDays, dayId];

    setTrainingDays(newDays);
    setSavingDays(true);
    try {
      const updatedAnamnesis = { ...client.anamnesisData, trainingDays: newDays };
      await apiClient(`/trainer/clients/${client.id}/anamnesis`, {
        method: 'POST',
        body: { anamnesisData: updatedAnamnesis }
      });
      client.anamnesisData = updatedAnamnesis;
    } catch (err) {
      console.error(err);
      addToast('Error al guardar días de entrenamiento', 'error');
    } finally {
      setSavingDays(false);
    }
  };

  // Calcular Nutrición
  const targets = useMemo(() => {
    const { weight, height, age, gender, goal, activity_level } = client;
    if (!weight || !height || !age || !gender || !goal) {
      return null;
    }
    
    let bmr = (10 * weight) + (6.25 * height) - (5 * age) + (gender === 'male' ? 5 : -161);
    
    let cal = bmr * (activity_level || 1.2);
    if (goal === 'lose') cal -= 500;
    if (goal === 'gain') cal += 500;
    cal = Math.round(cal);
    
    let protMult = 1.6;
    if (goal === 'lose') protMult = 2.0;
    else if (goal === 'gain') protMult = 1.8;

    return {
      calories: cal,
      protein: Math.round(weight * protMult),
      water: Math.round(weight * 35),
      sugar: Math.round((cal * 0.10) / 4)
    };
  }, [client]);

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+20px)] pt-[var(--safe-top)] overflow-y-auto">
      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-3xl mx-auto space-y-6 relative">
        
        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 shrink-0 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          
          <UserAvatar user={client} size={14} className="shrink-0 ring-2 ring-black/5 dark:ring-white/10 shadow-sm" />
          
          <div>
            <h1 className="text-2xl font-black text-text-primary">Detalles de {client.name}</h1>
            <p className="text-sm text-text-secondary">@{client.username}</p>
          </div>
        </div>

        {/* Nutrición y Macros */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2">
            <ChartPieIcon className="w-5 h-5 text-purple-500" />
            Recomendaciones de Nutrición
          </h2>
          <div className="bg-bg-secondary border border-glass-border rounded-3xl p-6 shadow-sm">
            {targets ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-4 bg-orange-500/10 rounded-2xl ring-1 ring-orange-500/20">
                  <FireIcon className="w-6 h-6 text-orange-500 mb-2" />
                  <span className="text-2xl font-black text-text-primary">{targets.calories}</span>
                  <span className="text-xs text-text-secondary font-bold">Kcal</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-blue-500/10 rounded-2xl ring-1 ring-blue-500/20">
                  <BeakerIcon className="w-6 h-6 text-blue-500 mb-2" />
                  <span className="text-2xl font-black text-text-primary">{targets.water}</span>
                  <span className="text-xs text-text-secondary font-bold">ml Agua</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-green-500/10 rounded-2xl ring-1 ring-green-500/20">
                  <ChartPieIcon className="w-6 h-6 text-green-500 mb-2" />
                  <span className="text-2xl font-black text-text-primary">{targets.protein}</span>
                  <span className="text-xs text-text-secondary font-bold">g Proteína</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-pink-500/10 rounded-2xl ring-1 ring-pink-500/20">
                  <ChartPieIcon className="w-6 h-6 text-pink-500 mb-2" />
                  <span className="text-2xl font-black text-text-primary">{targets.sugar}</span>
                  <span className="text-xs text-text-secondary font-bold">g Azúcar</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-text-secondary p-4 bg-black/5 dark:bg-white/5 rounded-2xl">
                <InformationCircleIcon className="w-6 h-6 shrink-0" />
                <p className="text-sm">El usuario no tiene suficientes datos físicos registrados (peso, altura, edad, etc.) para calcular sus metas nutricionales.</p>
              </div>
            )}
          </div>
        </section>

        {/* Rutinas Asignadas */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2">
            <Dumbbell size={20} className="text-accent" />
            Rutinas Asignadas
          </h2>
          <div className="bg-bg-secondary border border-glass-border rounded-3xl p-6 shadow-sm">
            {loading ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : assignedRoutines.length > 0 ? (
              <div className="space-y-3">
                {assignedRoutines.map(routine => (
                  <div key={routine.id} className="flex items-center gap-3 p-4 bg-bg-primary border border-glass-border rounded-2xl">
                    {routine.image_url ? (
                      <img src={routine.image_url} alt={routine.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">
                        <Dumbbell size={20} className="text-text-muted" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-text-primary truncate">{routine.name}</p>
                      <p className="text-xs text-text-secondary truncate">{routine.RoutineExercises?.length || 0} ejercicios</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 bg-black/5 dark:bg-white/5 rounded-2xl">
                <p className="text-sm text-text-secondary font-medium">Este cliente no tiene rutinas asignadas.</p>
              </div>
            )}
          </div>
        </section>

        {/* Días planificados */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2">
            <CalendarDaysIcon className="w-5 h-5 text-accent" />
            Días de Entrenamiento (Plan)
          </h2>
          <div className="bg-bg-secondary border border-glass-border rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center gap-2 sm:gap-3">
              {WEEKDAYS.map((day) => {
                const isSelected = trainingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 relative flex items-center justify-center h-14 sm:h-16 rounded-2xl border-2 transition-all duration-300 active:scale-90 touch-manipulation ${
                      isSelected ?
                      'border-accent bg-accent/10 text-accent font-black shadow-md shadow-accent/10' :
                      'border-glass-border bg-bg-primary text-text-secondary font-medium hover:border-accent/40'
                    }`}>
                    <span className="text-sm sm:text-base leading-none">{day.short}</span>
                    <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-accent' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Historial real */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Historial Realizado
          </h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-glass-border rounded-3xl p-4 shadow-sm">
              <CalendarView
                setDetailedLog={setDetailedLog}
                workouts={workouts} />
            </div>
          )}
        </section>

      </div>

      {/* Modal / Vista de Detalle Diario */}
      {detailedLog && detailedLog.length > 0 && <ModalPortal>
        <div className="fixed inset-0 z-[100] bg-bg-primary overflow-y-auto animate-fade-in-up">
          <div className="sticky top-0 z-10 bg-bg-primary/80 backdrop-blur-xl border-b border-glass-border px-4 py-4 flex items-center gap-3">
            <button
              onClick={() => setDetailedLog(null)}
              className="p-2 -ml-2 text-text-primary hover:bg-white/10 rounded-full transition-colors active:scale-95">
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">Detalle del {new Date(detailedLog[0].workout_date).toLocaleDateString()}</h2>
          </div>
          <div className="p-4 max-w-3xl mx-auto pb-safe">
            <DailyDetailView
              logs={detailedLog}
              onClose={() => setDetailedLog(null)}
              isTrainerMode={true} />
          </div>
        </div></ModalPortal>
      }
    </div>
  );
}
