/* frontend/src/data/cardioLibrary.js */
import {
    Footprints, Activity, Bike, Waves, ArrowUpCircle,
    Timer, Flame, Zap, Mountain, HeartPulse, Music, Box,
    Dumbbell, Wind, Droplets, Trophy, PlayCircle
} from 'lucide-react';

export const CARDIO_ACTIVITIES = [
    {
        id: 'walking',
        name: 'Caminata Rápida',
        intensity: 'Baja',
        mets: 3.5,
        icon: Footprints,
        description: 'Ideal para principiantes y recuperación activa.',
        color: 'text-green-500',
        bg: 'bg-green-500/10',
        hasGPS: true // Compatible con GPS
    },
    {
        id: 'jogging',
        name: 'Trotar (Jogging)',
        intensity: 'Media',
        mets: 7,
        icon: Activity,
        description: 'Ritmo suave para ganar resistencia.',
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        hasGPS: true // Compatible con GPS
    },
    {
        id: 'running',
        name: 'Correr (Running)',
        intensity: 'Alta',
        mets: 9.8,
        icon: Wind,
        description: 'Alta intensidad para quemar calorías.',
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        hasGPS: true // Compatible con GPS
    },
    {
        id: 'cycling',
        name: 'Ciclismo (Exterior)',
        intensity: 'Media',
        mets: 7.5,
        icon: Bike,
        description: 'Cardio clásico de bajo impacto articular.',
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
        hasGPS: true // Compatible con GPS
    },
    {
        id: 'spinning',
        name: 'Ciclismo Estático',
        intensity: 'Alta',
        mets: 8.5,
        icon: Bike,
        description: 'Clases de spinning o bici estática.',
        color: 'text-teal-500',
        bg: 'bg-teal-500/10',
        hasGPS: false
    },
    {
        id: 'elliptical',
        name: 'Elíptica',
        intensity: 'Media',
        mets: 5,
        icon: Activity,
        description: 'Movimiento completo sin impacto.',
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        hasGPS: false
    },
    {
        id: 'rowing',
        name: 'Máquina de Remo',
        intensity: 'Muy Alta',
        mets: 12,
        icon: Waves,
        description: 'Trabaja espalda, brazos y piernas.',
        color: 'text-indigo-500',
        bg: 'bg-indigo-500/10',
        hasGPS: false
    },
    {
        id: 'jump_rope',
        name: 'Saltar la Cuerda',
        intensity: 'Alta',
        mets: 11,
        icon: ArrowUpCircle,
        description: 'Excelente para coordinación y agilidad.',
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        hasGPS: false
    },
    {
        id: 'swimming',
        name: 'Natación',
        intensity: 'Alta',
        mets: 8,
        icon: Droplets,
        description: 'Ejercicio total de bajo impacto.',
        color: 'text-blue-400',
        bg: 'bg-blue-400/10',
        hasGPS: false
    },
    {
        id: 'stairs',
        name: 'Subir Escaleras',
        intensity: 'Alta',
        mets: 9,
        icon: Mountain,
        description: 'Potencia de piernas y glúteos.',
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        hasGPS: false
    },
    {
        id: 'hiking',
        name: 'Senderismo',
        intensity: 'Media',
        mets: 6,
        icon: Mountain,
        description: 'Caminata en naturaleza con desnivel.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        hasGPS: true // Compatible con GPS
    },
    {
        id: 'hiit',
        name: 'HIIT',
        intensity: 'Máxima',
        mets: 11,
        icon: Flame,
        description: 'Intervalos de alta intensidad.',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        hasGPS: false
    },
    {
        id: 'boxing',
        name: 'Boxeo / Kickboxing',
        intensity: 'Alta',
        mets: 10,
        icon: Box,
        description: 'Descarga adrenalina y tonifica.',
        color: 'text-red-600',
        bg: 'bg-red-600/10',
        hasGPS: false
    },
    {
        id: 'dance',
        name: 'Baile / Zumba',
        intensity: 'Media',
        mets: 6.5,
        icon: Music,
        description: 'Quema calorías divirtiéndote.',
        color: 'text-fuchsia-500',
        bg: 'bg-fuchsia-500/10',
        hasGPS: false
    },
    {
        id: 'yoga',
        name: 'Yoga (Vinyasa)',
        intensity: 'Baja',
        mets: 3,
        icon: PlayCircle,
        description: 'Flexibilidad y fuerza isométrica.',
        color: 'text-violet-500',
        bg: 'bg-violet-500/10',
        hasGPS: false
    },
    {
        id: 'burpees',
        name: 'Burpees',
        intensity: 'Máxima',
        mets: 11,
        icon: Zap,
        description: 'El ejercicio metabólico definitivo.',
        color: 'text-yellow-600',
        bg: 'bg-yellow-600/10',
        hasGPS: false
    },
    {
        id: 'jumping_jacks',
        name: 'Jumping Jacks',
        intensity: 'Media',
        mets: 8,
        icon: Trophy,
        description: 'Clásico para elevar pulsaciones.',
        color: 'text-lime-500',
        bg: 'bg-lime-500/10',
        hasGPS: false
    },
    {
        id: 'mountain_climbers',
        name: 'Escaladores',
        intensity: 'Alta',
        mets: 9,
        icon: Mountain,
        description: 'Core y cardio en el suelo.',
        color: 'text-stone-400',
        bg: 'bg-stone-400/10',
        hasGPS: false
    }
];