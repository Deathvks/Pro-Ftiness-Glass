/* frontend/src/components/News/NewsConversionBanner.jsx */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Dumbbell,
  UtensilsCrossed,
  Pill,
  HeartPulse,
  ArrowRight,
  Flame,
  CheckCircle2
} from 'lucide-react';
import GlassCard from '../GlassCard';
import useAppStore from '../../store/useAppStore';

/**
 * Banner contextual dinámico de conversión:
 * Detecta la temática del artículo (creatina, hipertrofia, nutrición, salud)
 * y muestra una propuesta de valor hiperrelevante para transformar lectores
 * en usuarios activos de la aplicación.
 */
export default function NewsConversionBanner({
  article,
  customNavigate,
  className = ''
}) {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);

  const bannerData = useMemo(() => {
    const title = (article?.title || '').toLowerCase();
    const tags = (article?.tags || '').toLowerCase();
    const content = (article?.content || '').slice(0, 1500).toLowerCase();
    const category = (article?.category || '').toLowerCase();
    const fullText = `${title} ${tags} ${category} ${content}`;

    // 1. Creatina específica
    if (fullText.includes('creatina')) {
      return {
        badge: 'Herramienta de Suplementación',
        badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
        title: 'Registra tu consumo diario y saturación de creatina gratis',
        description: 'Calcula tus dosis exactas por peso corporal, programa recordatorios y mantén tus niveles óptimos de saturación muscular sin coste en Pro Fitness Glass.',
        icon: Pill,
        iconBg: 'bg-amber-400/20 text-amber-400',
        gradient: 'from-amber-500/10 via-accent/5 to-transparent',
        border: 'ring-amber-500/30',
        ctaGuest: 'Controlar mi creatina gratis',
        ctaAuth: 'Abrir mi control de suplementos',
        targetRoute: 'dashboard',
        registerParam: 'creatina'
      };
    }

    // 2. Nutrición / Dieta / Macros
    if (
      category.includes('nutric') ||
      fullText.includes('macro') ||
      fullText.includes('calor') ||
      fullText.includes('déficit') ||
      fullText.includes('deficit') ||
      fullText.includes('superávit') ||
      fullText.includes('superavit') ||
      fullText.includes('proteína') ||
      fullText.includes('proteina')
    ) {
      return {
        badge: 'Nutrición & Macros con IA',
        badgeColor: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
        title: 'Calcula tus macros y registra tus comidas con IA gratis',
        description: 'Define tus objetivos de calorías, proteínas, grasas y carbohidratos. Escanea códigos de barras y lleva el control exacto de tus platos en segundos.',
        icon: UtensilsCrossed,
        iconBg: 'bg-emerald-400/20 text-emerald-400',
        gradient: 'from-emerald-500/10 via-accent/5 to-transparent',
        border: 'ring-emerald-500/30',
        ctaGuest: 'Calcular mis macros gratis',
        ctaAuth: 'Ir a mi panel de nutrición',
        targetRoute: 'nutrition',
        registerParam: 'nutricion'
      };
    }

    // 3. Hipertrofia / Fuerza / Entrenamiento
    if (
      category.includes('entren') ||
      fullText.includes('hipertrofia') ||
      fullText.includes('fuerza') ||
      fullText.includes('rutina') ||
      fullText.includes('press') ||
      fullText.includes('sentadilla') ||
      fullText.includes('serie') ||
      fullText.includes('rpe') ||
      fullText.includes('rir')
    ) {
      return {
        badge: 'Registro de Fuerza & Sobrecarga',
        badgeColor: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
        title: 'Aplica esta rutina y calcula tus récords con Pro Fitness Glass',
        description: 'Registra tus series efectivas, RIR, RPE y calcula tu 1RM estimado en tiempo real. Gráficas visuales automáticas de sobrecarga progresiva sin publicidad.',
        icon: Dumbbell,
        iconBg: 'bg-cyan-400/20 text-cyan-400',
        gradient: 'from-cyan-500/10 via-accent/5 to-transparent',
        border: 'ring-cyan-500/30',
        ctaGuest: 'Crear mi rutina gratis',
        ctaAuth: 'Ir a mis rutinas',
        targetRoute: 'routines',
        registerParam: 'rutina'
      };
    }

    // 4. Salud / Descanso / Recuperación
    if (
      category.includes('salud') ||
      fullText.includes('sueño') ||
      fullText.includes('sueno') ||
      fullText.includes('descanso') ||
      fullText.includes('recuperaci') ||
      fullText.includes('lesi') ||
      fullText.includes('cardio')
    ) {
      return {
        badge: 'Salud Integral & Métricas',
        badgeColor: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
        title: 'Optimiza tu recuperación y monitorea tus métricas de salud',
        description: 'Registra tus marcas biométricas, peso corporal, volumen semanal de entreno y evolución física en una interfaz fluida diseñada para atletas.',
        icon: HeartPulse,
        iconBg: 'bg-rose-400/20 text-rose-400',
        gradient: 'from-rose-500/10 via-accent/5 to-transparent',
        border: 'ring-rose-500/30',
        ctaGuest: 'Comenzar ahora gratis',
        ctaAuth: 'Ver mis métricas corporales',
        targetRoute: 'progress',
        registerParam: 'salud'
      };
    }

    // 5. Fallback General / Pro Fitness Glass
    return {
      badge: 'Plataforma Fitness Gratuita',
      badgeColor: 'text-accent bg-accent/10 border-accent/20',
      title: 'Lleva tus entrenamientos y nutrición al siguiente nivel',
      description: 'Crea rutinas personalizadas, sigue tus macros diarios, compite en retos con la comunidad y supera tus marcas con Pro Fitness Glass.',
      icon: Award,
      iconBg: 'bg-accent/20 text-accent',
      gradient: 'from-accent/15 via-accent/5 to-transparent',
      border: 'ring-accent/30',
      ctaGuest: 'Crear mi cuenta gratis',
      ctaAuth: 'Ir a mi panel principal',
      targetRoute: 'dashboard',
      registerParam: 'noticias'
    };
  }, [article]);

  const IconComponent = bannerData.icon;

  const handleClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      if (customNavigate) {
        customNavigate(bannerData.targetRoute);
      } else {
        navigate(`/${bannerData.targetRoute}`);
      }
    } else {
      navigate(`/register?from=${bannerData.registerParam}`);
    }
  };

  return (
    <div className={`w-full my-8 ${className}`}>
      <GlassCard
        className={`glass w-full p-5 sm:p-6 rounded-[28px] border-none ring-1 ${bannerData.border} bg-gradient-to-r ${bannerData.gradient} shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${bannerData.iconBg} shadow-sm mt-0.5 sm:mt-0`}
            >
              <IconComponent size={24} />
            </div>

            <div className="flex flex-col gap-1.5 max-w-xl">
              <span
                className={`self-start text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${bannerData.badgeColor}`}
              >
                {bannerData.badge}
              </span>

              <h4 className="text-base sm:text-lg font-black text-text-primary tracking-tight leading-snug">
                {bannerData.title}
              </h4>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                {bannerData.description}
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleClick}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-contrast font-black text-xs sm:text-sm shadow-md shadow-accent/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <span>{isAuthenticated ? bannerData.ctaAuth : bannerData.ctaGuest}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
