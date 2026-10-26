/* frontend/src/components/News/TrainerAdvisoryCard.jsx */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  ClipboardList,
  Utensils,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '../GlassCard';
import useAppStore from '../../store/useAppStore';

/**
 * Tarjeta de conversión al Panel de Asesoría y Entrenadores Personales:
 * Conecta a los lectores de noticias y guías científicas con los entrenadores
 * personales certificados de la plataforma para adaptar planes a medida.
 */
export default function TrainerAdvisoryCard({
  customNavigate,
  className = ''
}) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const handleActionClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (customNavigate) {
        customNavigate('asesoria');
      } else {
        navigate('/asesoria');
      }
    } else {
      navigate('/register?redirect=asesoria');
    }
  };

  return (
    <div className={`w-full my-8 ${className}`}>
      <GlassCard className="glass w-full p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-purple-500/30 bg-gradient-to-br from-purple-500/10 via-black/20 to-accent/10 shadow-2xl relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Cabecera */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-accent flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
                <UserCheck size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-purple-400">
                  Preparación y Asesoría Personalizada
                </span>
                <span className="text-xs text-text-tertiary font-medium">
                  Atención 1 a 1 con preparadores certificados
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 dark:bg-white/10 border border-white/10 text-[11px] font-bold text-text-secondary">
              <ShieldCheck size={13} className="text-accent" />
              <span>100% Basado en Evidencia</span>
            </div>
          </div>

          {/* Titular y propuesta */}
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-text-primary tracking-tight leading-tight">
              ¿Quieres que un entrenador certificado adapte este plan a tus objetivos?
            </h3>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-2xl font-medium">
              No entrenes a ciegas ni copies rutinas genéricas. Un preparador personal analiza tu anatomía, material disponible y horarios para estructurar tu entrenamiento y nutrición con feedback continuo.
            </p>
          </div>

          {/* Puntos de valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 pb-1">
            <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                <ClipboardList size={15} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text-primary">Rutina Individualizada</p>
                <p className="text-[11px] text-text-tertiary leading-snug">Adaptada a tu nivel, frecuencia y sobrecarga progresiva.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <Utensils size={15} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text-primary">Estrategia Nutricional</p>
                <p className="text-[11px] text-text-tertiary leading-snug">Calorías y macros ajustados a tu composición corporal.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare size={15} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-text-primary">Chat Directo con tu Coach</p>
                <p className="text-[11px] text-text-tertiary leading-snug">Resolución de dudas y corrección técnica de levantamientos.</p>
              </div>
            </div>
          </div>

          {/* Barra de acción */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-2 text-xs text-text-tertiary text-center sm:text-left">
              <CheckCircle2 size={15} className="text-accent shrink-0" />
              <span>Sin compromisos permanentes ni dietas restrictivas</span>
            </div>

            <button
              type="button"
              onClick={handleActionClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-accent to-purple-600 text-accent-contrast font-black text-xs sm:text-sm shadow-lg shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{isAuthenticated ? 'Hablar con un preparador' : 'Contactar con un entrenador'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
