import ModalPortal from '../ModalPortal';
import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, CalendarDaysIcon, CheckCircleIcon, ClipboardDocumentListIcon, XMarkIcon } from '@heroicons/react/24/outline';
import apiClient from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import CalendarView from '../progress/CalendarView';
import DailyDetailView from '../progress/DailyDetailView';

const WEEKDAYS = [
{ id: '1', label: 'Lunes', short: 'L' },
{ id: '2', label: 'Martes', short: 'M' },
{ id: '3', label: 'Miércoles', short: 'X' },
{ id: '4', label: 'Jueves', short: 'J' },
{ id: '5', label: 'Viernes', short: 'V' },
{ id: '6', label: 'Sábado', short: 'S' },
{ id: '0', label: 'Domingo', short: 'D' }];


export default function ClientDetailPanel({ client, onBack }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Array de IDs de días (strings) guardados en la anamnesis
  const [trainingDays, setTrainingDays] = useState(
    client?.anamnesisData?.trainingDays || []
  );
  const [savingDays, setSavingDays] = useState(false);
  const [detailedLog, setDetailedLog] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchWorkouts();
  }, [client.id]);

  const fetchWorkouts = async () => {
    try {
      const data = await apiClient(`/trainer/clients/${client.id}/workouts`);
      setWorkouts(data);
    } catch (err) {
      console.error(err);
      addToast('Error al cargar entrenamientos del cliente', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = async (dayId) => {
    const newDays = trainingDays.includes(dayId) ?
    trainingDays.filter((d) => d !== dayId) :
    [...trainingDays, dayId];

    setTrainingDays(newDays);

    // Guardar automáticamente al cambiar
    setSavingDays(true);
    try {
      const updatedAnamnesis = { ...client.anamnesisData, trainingDays: newDays };
      await apiClient(`/trainer/clients/${client.id}/anamnesis`, {
        method: 'POST',
        body: { anamnesisData: updatedAnamnesis }
      });
      // Actualizamos el objeto client localmente por si volvemos atrás
      client.anamnesisData = updatedAnamnesis;
    } catch (err) {
      console.error(err);
      addToast('Error al guardar días de entrenamiento', 'error');
    } finally {
      setSavingDays(false);
    }
  };

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] animate-fade-in overflow-y-auto">
      <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-3xl mx-auto space-y-6 relative">
        
        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 shrink-0 -ml-2 rounded-full flex items-center justify-center text-text-primary hover:bg-bg-secondary/50 transition-colors z-20 active:scale-95">
            
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-text-primary">Detalles de {client.name}</h1>
            <p className="text-sm text-text-secondary">@{client.username}</p>
          </div>
        </div>

        {/* Sección: Días planificados */}
        <section className="bg-bg-secondary border border-glass-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-accent" />
              Días de Entrenamiento (Plan)
            </h2>
          </div>
          
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
                  'border-glass-border bg-bg-primary text-text-secondary font-medium hover:border-accent/40'}`
                  }>
                  
                  <span className="text-sm sm:text-base leading-none">{day.short}</span>
                  <div className={`absolute bottom-2 w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-accent' : 'bg-transparent'}`} />
                </button>);

            })}
          </div>
        </section>

        {/* Sección: Calendario de progreso (Historial real) */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 px-2">
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
            Historial Realizado
          </h2>
          {loading ?
          <div className="flex justify-center p-8">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div> :

          <div className="bg-bg-secondary border border-glass-border rounded-3xl p-4 shadow-sm">
              <CalendarView
              setDetailedLog={setDetailedLog}
              workouts={workouts} />
            
            </div>
          }
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
    </div>);

}