/* frontend/src/components/SeasonPassCard.jsx */
import React, { useState, useEffect } from 'react';
import { 
    Lock, Unlock, Zap, Timer, Sparkles, Palette, Shield, Swords, 
    Square, PartyPopper, Flame, Smartphone, Award, Bot, Medal, 
    Image as ImageIcon, Music, Crown, FileCheck 
} from 'lucide-react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import LevelBadge from './LevelBadge';

const SEASON_END_DATE = new Date('2026-05-01T23:59:59');

// Componente Épico 3D: Ahora todas las recompensas brillan y muestran su color siempre
const EpicRewardIcon = ({ icon: Icon, bgGradient, glowClass, rarity, isUnlocked, isNext }) => {
    return (
        <div className={`relative flex items-center justify-center w-14 h-14 shrink-0 rounded-2xl transition-all duration-500 ${isUnlocked || isNext ? glowClass : 'drop-shadow-md'}`}>
            {/* Fondo base hiper-vibrante SIEMPRE visible para motivar al usuario */}
            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${bgGradient} shadow-inner`}></div>

            {/* Efecto Cristal/LootBox 3D */}
            <div className="absolute inset-0 rounded-2xl border border-white/40 shadow-[inset_0_2px_6px_rgba(255,255,255,0.6),inset_0_-4px_8px_rgba(0,0,0,0.5)] backdrop-blur-sm"></div>

            {/* Animaciones de Rareza SOLO si está desbloqueado */}
            {isUnlocked && rarity === 'legendary' && (
                <div className="absolute inset-0 rounded-2xl border-2 border-fuchsia-300 animate-[pulse_1.5s_infinite]"></div>
            )}
            {isUnlocked && rarity === 'god' && (
                <div className="absolute inset-0 rounded-2xl bg-yellow-300/40 blur-md animate-[ping_2.5s_infinite]"></div>
            )}

            {/* Reflejo de luz superior para dar volumen 3D */}
            <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/60 to-transparent rounded-t-2xl"></div>

            {/* Icono Blanco Brillante Flotante (flota siempre, pero rebota más si está desbloqueado) */}
            <motion.div
                animate={isUnlocked ? { y: [0, -3, 0] } : { y: [0, -1.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
            >
                <Icon size={28} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
            </motion.div>
        </div>
    );
};

// Recompensas con colores extremos y brillos
const PASS_LEVELS = [
  {
    level: 5,
    title: "El Primer Paso",
    bgTint: "bg-cyan-500/5",
    rewards: [
      { title: 'Tema "Neón Cyberpunk"', desc: 'Tonos cyan y magenta para la app.', icon: Palette, bgGradient: 'from-cyan-400 to-blue-600', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.7)]', cardBorder: 'border-cyan-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(34,211,238,0.4)]' },
      { title: 'Insignia "Despierto"', desc: 'Icono exclusivo junto a tu nombre.', icon: Shield, bgGradient: 'from-fuchsia-400 to-purple-600', glow: 'shadow-[0_0_20px_rgba(232,121,249,0.7)]', cardBorder: 'border-fuchsia-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(232,121,249,0.4)]' }
    ]
  },
  {
    level: 15,
    title: "Entrando en Calor",
    bgTint: "bg-red-500/5",
    rewards: [
      { title: 'Rutina "Espartano 300"', desc: 'Rutina de alta intensidad.', icon: Swords, bgGradient: 'from-red-400 to-orange-600', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]', cardBorder: 'border-red-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(239,68,68,0.4)]' },
      { title: 'Marco de Avatar', desc: 'Marco de Acero para tu perfil.', icon: Square, bgGradient: 'from-slate-400 to-gray-700', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.7)]', cardBorder: 'border-slate-400/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(148,163,184,0.4)]' },
      { title: 'Celebración Confeti', desc: 'Efecto al terminar entrenos.', icon: PartyPopper, bgGradient: 'from-pink-400 to-rose-600', glow: 'shadow-[0_0_20px_rgba(244,114,182,0.7)]', cardBorder: 'border-pink-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(244,114,182,0.4)]' }
    ]
  },
  {
    level: 30,
    title: "Constancia Pura",
    bgTint: "bg-blue-500/5",
    rewards: [
      { title: 'Racha "Fuego Azul"', desc: 'Llama animada en el dashboard.', icon: Flame, bgGradient: 'from-blue-400 to-indigo-600', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.7)]', cardBorder: 'border-blue-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(59,130,246,0.4)]' },
      { title: 'Icono "Modo Noche"', desc: 'Icono oscuro y elegante.', icon: Smartphone, bgGradient: 'from-gray-600 to-black', glow: 'shadow-[0_0_20px_rgba(156,163,175,0.7)]', cardBorder: 'border-gray-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(156,163,175,0.4)]' },
      { title: 'Título: El Constante', desc: 'Se muestra en funciones sociales.', icon: Award, bgGradient: 'from-indigo-400 to-blue-700', glow: 'shadow-[0_0_20px_rgba(99,102,241,0.7)]', cardBorder: 'border-indigo-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(99,102,241,0.4)]' }
    ]
  },
  {
    level: 50,
    title: "Punto de Inflexión",
    rarity: 'epic',
    bgTint: "bg-purple-500/5",
    rewards: [
      { title: 'Análisis IA Pro', desc: 'Insights detallados semanales.', icon: Bot, bgGradient: 'from-purple-400 to-fuchsia-600', glow: 'shadow-[0_0_25px_rgba(168,85,247,0.8)]', cardBorder: 'border-purple-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(168,85,247,0.5)]' },
      { title: 'Tema "OLED Midnight"', desc: 'Negro puro con acentos dorados.', icon: Palette, bgGradient: 'from-yellow-400 to-amber-600', glow: 'shadow-[0_0_25px_rgba(234,179,8,0.8)]', cardBorder: 'border-yellow-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(234,179,8,0.5)]' },
      { title: 'Insignia "Titán"', desc: 'Brillo constante en tu nivel.', icon: Medal, bgGradient: 'from-amber-400 to-orange-600', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.8)]', cardBorder: 'border-amber-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(245,158,11,0.5)]' }
    ]
  },
  {
    level: 75,
    title: "Territorio Élite",
    bgTint: "bg-orange-500/5",
    rewards: [
      { title: 'Efecto PR "Relámpago"', desc: 'Destello de rayos en récords.', icon: Zap, bgGradient: 'from-yellow-300 to-yellow-600', glow: 'shadow-[0_0_25px_rgba(253,224,71,0.8)]', cardBorder: 'border-yellow-400/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(253,224,71,0.4)]' },
      { title: 'Rutina "Olimpia Split"', desc: '5 días nivel culturista PRO.', icon: Swords, bgGradient: 'from-red-500 to-rose-800', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.8)]', cardBorder: 'border-red-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(239,68,68,0.4)]' },
      { title: 'Banner Dinámico', desc: 'Fondo animado en tu perfil.', icon: ImageIcon, bgGradient: 'from-indigo-500 to-purple-800', glow: 'shadow-[0_0_25px_rgba(99,102,241,0.8)]', cardBorder: 'border-indigo-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(99,102,241,0.4)]' }
    ]
  },
  {
    level: 90,
    title: "Leyenda Viva",
    rarity: 'legendary',
    bgTint: "bg-fuchsia-500/5",
    rewards: [
      { title: 'Llama Oscura', desc: 'Efecto de racha ultra raro.', icon: Flame, bgGradient: 'from-purple-600 to-black', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.9)]', cardBorder: 'border-purple-500/70', cardShadow: 'shadow-[0_5px_30px_-5px_rgba(168,85,247,0.6)]' },
      { title: 'Sonido "Level Up"', desc: 'Audio épico exclusivo para ti.', icon: Music, bgGradient: 'from-fuchsia-400 to-pink-600', glow: 'shadow-[0_0_30px_rgba(232,121,249,0.9)]', cardBorder: 'border-fuchsia-500/70', cardShadow: 'shadow-[0_5px_30px_-5px_rgba(217,70,239,0.6)]' },
      { title: 'Tema "Oro Puro"', desc: 'Interfaz bañada en oro brillante.', icon: Palette, bgGradient: 'from-yellow-300 to-amber-600', glow: 'shadow-[0_0_30px_rgba(250,204,21,0.9)]', cardBorder: 'border-yellow-500/70', cardShadow: 'shadow-[0_5px_30px_-5px_rgba(234,179,8,0.6)]' }
    ]
  },
  {
    level: 100,
    title: "Dios del Olimpo",
    rarity: 'god',
    bgTint: "bg-yellow-500/10",
    rewards: [
      { title: 'Aura Divina', desc: 'Resplandor dorado en toda la app.', icon: Sparkles, bgGradient: 'from-yellow-200 to-amber-500', glow: 'shadow-[0_0_35px_rgba(253,224,71,1)]', cardBorder: 'border-yellow-400/80', cardShadow: 'shadow-[0_5px_35px_-5px_rgba(250,204,21,0.7)]' },
      { title: 'VIP Vitalicio', desc: 'Corona junto a tu nombre.', icon: Crown, bgGradient: 'from-amber-300 to-orange-600', glow: 'shadow-[0_0_35px_rgba(251,191,36,1)]', cardBorder: 'border-amber-500/80', cardShadow: 'shadow-[0_5px_35px_-5px_rgba(245,158,11,0.7)]' },
      { title: 'Tema "Galaxia"', desc: 'Fondo con partículas animadas.', icon: Sparkles, bgGradient: 'from-indigo-400 to-purple-600', glow: 'shadow-[0_0_35px_rgba(216,180,254,1)]', cardBorder: 'border-purple-400/80', cardShadow: 'shadow-[0_5px_35px_-5px_rgba(168,85,247,0.7)]' },
      { title: 'Certificado Épico', desc: 'Pantalla de victoria compartible.', icon: FileCheck, bgGradient: 'from-slate-200 to-gray-500', glow: 'shadow-[0_0_35px_rgba(255,255,255,0.9)]', cardBorder: 'border-white/80', cardShadow: 'shadow-[0_5px_35px_-5px_rgba(255,255,255,0.5)]' }
    ]
  }
];

const SeasonPassCard = ({ currentLevel = 1 }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const diff = SEASON_END_DATE - new Date();
      if (diff <= 0) return setTimeLeft('Finalizada');
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setTimeLeft(`${days}d ${hours}h`);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const maxLevel = PASS_LEVELS[PASS_LEVELS.length - 1].level;
  const progressPercent = Math.min(100, (currentLevel / maxLevel) * 100);

  return (
    <GlassCard className="p-0 overflow-hidden border-transparent dark:border-white/10 relative group bg-bg-secondary/20 shadow-xl">
      
      {/* --- CABECERA ÉPICA (Fondo Dinámico 100% Tailwind Native) --- */}
      <div className="p-5 sm:p-6 relative overflow-hidden text-white border-b border-glass-border">
        {/* Capas de gradientes que mezclan el color de acento con un tono oscuro para que destaque */}
        <div className="absolute inset-0 bg-black"></div>
        <div className="absolute inset-0 bg-accent opacity-30 mix-blend-screen"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-accent/50 via-black/40 to-black/90"></div>
        
        <div className="flex justify-between items-start relative z-10 gap-2">
          {/* Aquí está el logo de la web a la izquierda de los textos, en grande y manteniendo su color original */}
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            <img 
              src="/logo.webp" 
              alt="Logo" 
              className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] shrink-0" 
            />
            
            <div className="space-y-1.5 min-w-0 flex flex-col items-start justify-center">
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-accent shadow-lg shadow-accent/50 animate-[pulse_3s_ease-in-out_infinite]">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-white drop-shadow-md truncate">Temporada 1</span>
              </div>
              <h3 className="text-xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-tight truncate leading-none">
                El Despertar
              </h3>
            </div>
          </div>

          {/* El timer vuelve a tener su icono original */}
          <div className="flex items-center gap-1.5 text-orange-400 bg-orange-400/20 px-2.5 sm:px-3 py-1.5 rounded-xl border border-orange-400/30 shadow-inner backdrop-blur-sm shrink-0 whitespace-nowrap">
            <Timer size={14} className="animate-pulse shrink-0" />
            <span className="text-xs sm:text-sm font-black tracking-wider">{timeLeft}</span>
          </div>
        </div>

        <div className="mt-6 relative z-10">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] sm:text-xs font-bold text-gray-300 uppercase tracking-widest">Nivel Actual</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-accent drop-shadow-[0_0_10px_currentColor]">{currentLevel}</span>
              <span className="text-xs sm:text-sm font-bold text-gray-400">/ {maxLevel}</span>
            </div>
          </div>
          <div className="h-3 sm:h-4 w-full bg-black/60 rounded-full overflow-hidden border border-white/20 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            <div className="h-full bg-accent rounded-full transition-all duration-1000 relative shadow-[0_0_10px_currentColor]" style={{ width: `${progressPercent}%` }}>
              <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* --- LISTA DE NIVELES --- */}
      <div className="flex flex-col bg-bg-secondary max-h-[550px] overflow-y-auto custom-scrollbar relative">
        {PASS_LEVELS.map((tier, index) => {
          const isUnlocked = currentLevel >= tier.level;
          const isNext = !isUnlocked && (index === 0 || currentLevel >= PASS_LEVELS[index - 1].level);

          return (
            <div key={tier.level} className={`flex flex-col sm:flex-row p-5 sm:p-6 border-b border-glass-border transition-all duration-500 ${isUnlocked ? tier.bgTint : 'bg-bg-secondary/40'}`}>
              
              {/* Bloque Izquierdo: Nivel y Título */}
              <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-start gap-4 sm:w-48 shrink-0 mb-5 sm:mb-0 relative transition-all">
                <div className="flex items-center gap-4">
                  <div className={`transition-transform duration-300 ${isUnlocked ? 'scale-110 drop-shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : ''}`}>
                    <LevelBadge level={tier.level} size="lg" />
                  </div>
                  <div className="sm:hidden flex flex-col">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Nivel {tier.level}</span>
                    <span className={`text-base font-black leading-tight ${tier.rarity === 'god' ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500' : tier.rarity === 'epic' || tier.rarity === 'legendary' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500' : 'text-text-primary'}`}>{tier.title}</span>
                  </div>
                </div>
                
                <div className="hidden sm:flex flex-col mt-3">
                  <span className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Nivel {tier.level}</span>
                  <span className={`text-sm lg:text-base font-black leading-tight ${tier.rarity === 'god' ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500' : tier.rarity === 'epic' || tier.rarity === 'legendary' ? 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500' : 'text-text-primary'}`}>
                    {tier.title}
                  </span>
                </div>

                {/* Status Badge */}
                <div className="sm:mt-auto">
                    {isUnlocked ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shadow-sm">
                        <Unlock size={14} /> Obtenido
                      </span>
                    ) : isNext ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg border border-orange-500/20 shadow-sm animate-pulse">
                        <Timer size={14} /> Siguiente
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted bg-bg-primary px-3 py-1.5 rounded-lg border border-glass-border">
                        <Lock size={14} /> Bloqueado
                      </span>
                    )}
                </div>
              </div>

              {/* Grid de Recompensas (Loot Boxes) */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 sm:pl-6 sm:border-l border-glass-border">
                {tier.rewards.map((reward, i) => (
                    <div 
                      key={i}
                      className={`flex flex-row items-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${isUnlocked ? `bg-bg-primary ${reward.cardBorder} ${reward.cardShadow}` : 'bg-bg-primary/80 border-glass-border shadow-sm'}`}
                    >
                      {/* Icono Premium 3D (SIEMPRE brillante para tentar al usuario) */}
                      <EpicRewardIcon 
                          icon={reward.icon} 
                          bgGradient={reward.bgGradient} 
                          glowClass={reward.glow}
                          rarity={tier.rarity}
                          isUnlocked={isUnlocked}
                          isNext={isNext}
                      />
                      
                      {/* Textos */}
                      <div className="flex flex-col min-w-0 flex-1 ml-4">
                        <span className="text-sm font-black leading-tight truncate text-text-primary">
                          {reward.title}
                        </span>
                        <span className="text-[10px] sm:text-xs mt-1 leading-snug line-clamp-2 text-text-secondary">
                          {reward.desc}
                        </span>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default SeasonPassCard;