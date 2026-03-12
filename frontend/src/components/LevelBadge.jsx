/* frontend/src/components/LevelBadge.jsx */
import React from 'react';
import { Medal, Star, Trophy, Crown, Flame, Zap, Sparkles, Diamond, Shield } from 'lucide-react';

const getTier = (level) => {
    if (level < 10) return { name: 'Bronce', colors: 'from-[#CD7F32] to-[#8B4513]', icon: Shield, glow: 'shadow-[#CD7F32]/40' };
    if (level < 20) return { name: 'Plata', colors: 'from-[#E5E4E2] to-[#9CA3AF]', icon: Medal, glow: 'shadow-gray-400/40' };
    if (level < 30) return { name: 'Oro', colors: 'from-[#FFD700] to-[#B8860B]', icon: Trophy, glow: 'shadow-yellow-500/50' };
    if (level < 40) return { name: 'Platino', colors: 'from-[#E5E4E2] to-[#5F9EA0]', icon: Star, glow: 'shadow-teal-500/50' };
    if (level < 50) return { name: 'Diamante', colors: 'from-[#00FFFF] to-[#00008B]', icon: Diamond, glow: 'shadow-cyan-500/60' };
    if (level < 60) return { name: 'Maestro', colors: 'from-[#9370DB] to-[#4B0082]', icon: Zap, glow: 'shadow-purple-500/60' };
    if (level < 70) return { name: 'Gran Maestro', colors: 'from-[#FF69B4] to-[#C71585]', icon: Flame, glow: 'shadow-pink-500/60' };
    if (level < 80) return { name: 'Épico', colors: 'from-[#FF4500] to-[#8B0000]', icon: Crown, glow: 'shadow-red-500/60' };
    if (level < 90) return { name: 'Leyenda', colors: 'from-[#FFD700] via-[#FF4500] to-[#8B0000]', icon: Sparkles, glow: 'shadow-orange-500/60' };
    if (level < 100) return { name: 'Mítico', colors: 'from-[#00FFFF] via-[#9370DB] to-[#FF1493]', icon: Crown, glow: 'shadow-fuchsia-500/70' };
    
    return { name: 'Inmortal', colors: 'from-yellow-300 via-red-500 to-purple-600', icon: Crown, glow: 'shadow-yellow-500/80 animate-[pulse_2s_infinite]' };
};

const LevelBadge = ({ level = 1, size = 'md', showName = false, className = '' }) => {
    const tier = getTier(level);
    const Icon = tier.icon;

    // Tamaños dinámicos para mantener la proporción perfecta
    const sizes = {
        sm: { wrapper: 'w-12 h-12', inner: 'w-[44px] h-[44px]', text: 'text-xl', iconBox: 'w-5 h-5 -bottom-1.5', icon: 10 },
        md: { wrapper: 'w-[70px] h-[70px]', inner: 'w-[64px] h-[64px]', text: 'text-3xl', iconBox: 'w-7 h-7 -bottom-2', icon: 14 },
        lg: { wrapper: 'w-24 h-24', inner: 'w-[88px] h-[88px]', text: 'text-4xl', iconBox: 'w-9 h-9 -bottom-2.5', icon: 18 },
        xl: { wrapper: 'w-32 h-32', inner: 'w-[120px] h-[120px]', text: 'text-6xl', iconBox: 'w-12 h-12 -bottom-3', icon: 24 }
    };

    const s = sizes[size] || sizes.md;

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            {/* Contenedor del Anillo */}
            <div className={`relative flex items-center justify-center rounded-full bg-gradient-to-br ${tier.colors} ${s.wrapper} shadow-2xl ${tier.glow} transform transition-all duration-300 hover:scale-105 hover:rotate-3 cursor-pointer`}>
                
                {/* Círculo Interior Oscuro */}
                <div className={`bg-bg-primary rounded-full flex flex-col items-center justify-center relative overflow-hidden ${s.inner}`}>
                    {/* Brillo sutil de fondo */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${tier.colors} opacity-20`}></div>
                    
                    {/* Número de Nivel */}
                    <span className={`font-black z-10 bg-gradient-to-br ${tier.colors} text-transparent bg-clip-text ${s.text} drop-shadow-md`}>
                        {level}
                    </span>
                </div>

                {/* Sello/Gema con el Icono flotando abajo */}
                <div className={`absolute ${s.iconBox} rounded-full bg-bg-primary flex items-center justify-center p-[2px] shadow-lg z-20`}>
                    <div className={`w-full h-full rounded-full bg-gradient-to-br ${tier.colors} flex items-center justify-center shadow-inner`}>
                        <Icon size={s.icon} className="text-white drop-shadow-md" strokeWidth={3} />
                    </div>
                </div>
            </div>

            {/* Nombre del Rango Opcional */}
            {showName && (
                <span className={`font-extrabold text-[11px] uppercase tracking-widest bg-gradient-to-r ${tier.colors} text-transparent bg-clip-text drop-shadow-sm`}>
                    {tier.name}
                </span>
            )}
        </div>
    );
};

export default LevelBadge;