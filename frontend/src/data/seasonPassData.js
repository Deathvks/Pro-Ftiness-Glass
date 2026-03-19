/* frontend/src/data/seasonPassData.js */
import {
    Palette, Shield, Swords, Square, PartyPopper, Flame, Smartphone,
    Award, Bot, Medal, Zap, Image as ImageIcon, Music, Sparkles,
    Crown, FileCheck
} from 'lucide-react';

export const PASS_LEVELS = [
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
            { title: 'Rutina "Espartano 300"', desc: 'Rutina de alta intensidad.', icon: Swords, bgGradient: 'from-red-400 to-orange-600', glow: 'shadow-[0_0_20px_rgba(239,68,68,0.7)]', cardBorder: 'border-red-500/50', cardShadow: 'shadow-[0_5px_20px_-5px_rgba(239,68,68,0.4)]', iconClassName: 'text-gray-900 dark:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,1)]' },
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
            { title: 'Rutina "Olimpia Split"', desc: '5 días nivel culturista PRO.', icon: Swords, bgGradient: 'from-red-500 to-rose-800', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.8)]', cardBorder: 'border-red-500/60', cardShadow: 'shadow-[0_5px_25px_-5px_rgba(239,68,68,0.4)]', iconClassName: 'text-gray-900 dark:text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,1)]' },
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