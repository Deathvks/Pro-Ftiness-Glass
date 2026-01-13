/* frontend/src/components/WorkoutShareCard.jsx */
import React, { forwardRef, useMemo } from 'react';
import { Clock, Flame, Trophy, Zap, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const WorkoutShareCard = forwardRef(({ workoutData, userName, accentColor }, ref) => {
    const { t } = useTranslation(['exercise_names']);

    if (!workoutData) return null;

    const accent = accentColor || '#22c55e';
    const { routineName, duration_seconds, calories_burned, details } = workoutData;
    const safeName = routineName || "Entrenamiento Libre";

    // FECHA CORTA: "LUN, 12 ENE 2026"
    const dateStr = new Date().toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    }).toUpperCase().replace('.', '');

    const stats = useMemo(() => {
        let totalVolume = 0;
        details?.forEach(ex => {
            ex.setsDone?.forEach(set => {
                const w = parseFloat(set.weight_kg) || 0;
                const r = parseFloat(set.reps) || 0;
                totalVolume += w * r;
            });
        });
        return { totalVolume };
    }, [details]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // --- FIX: Filtramos series válidas para no contar vacías ---
    const getSetsSummary = (sets) => {
        if (!sets || sets.length === 0) return "Sin peso";

        // FILTRO CRÍTICO: Solo contamos series que tengan al menos 1 repetición
        const validSets = sets.filter(s => parseFloat(s.reps) > 0);

        if (validSets.length === 0) return "Sin series";

        const weights = validSets.map(s => parseFloat(s.weight_kg) || 0).filter(w => w > 0);
        const maxW = weights.length > 0 ? Math.max(...weights) : 0;

        if (weights.length === 0) return `${validSets.length} series (Cardio/BW)`;
        return `${validSets.length} series (Máx: ${maxW}kg)`;
    };

    const getMaxWeight = (sets) => {
        if (!sets || sets.length === 0) return 0;
        // También usamos solo series válidas para el peso máximo
        const validSets = sets.filter(s => parseFloat(s.reps) > 0);
        if (validSets.length === 0) return 0;

        const weights = validSets.map(s => parseFloat(s.weight_kg) || 0);
        return Math.max(...weights, 0);
    };
    // -----------------------------------------------------------

    return (
        <div
            ref={ref}
            // Altura dinámica: crece según el contenido
            className="relative w-[1080px] min-h-[1920px] h-auto bg-black text-white flex flex-col font-sans"
        >
            {/* --- FONDOS --- */}
            <div className="absolute top-[-250px] left-1/2 -translate-x-1/2 w-[1200px] h-[800px] rounded-full blur-[150px]" style={{ background: accent, opacity: 0.6 }} />
            <div className="absolute bottom-[-200px] right-[-200px] w-[900px] h-[900px] rounded-full blur-[180px]" style={{ background: accent, opacity: 0.4 }} />
            <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

            {/* ================= CONTENIDO ================= */}
            <div className="relative z-10 flex-1 flex flex-col p-12 pt-20">

                {/* HEADER */}
                <div className="flex justify-between items-start mb-10">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic whitespace-nowrap pb-1">
                            Pro Fitness Glass
                        </h1>
                        <div className="h-2 w-32 rounded-full mt-1" style={{ background: accent }} />
                    </div>

                    {/* FECHA: pb-[10px] (Correcto) */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 h-16 rounded-2xl flex items-center justify-center">
                        <span className="text-gray-300 font-bold tracking-widest text-xl uppercase leading-none pb-[10px]">
                            {dateStr}
                        </span>
                    </div>
                </div>

                {/* TÍTULO RUTINA */}
                <div className="mb-10">
                    <span className="font-bold tracking-[0.2em] uppercase text-2xl mb-3 block" style={{ color: accent }}>
                        Sesión Completada
                    </span>
                    <h2 className="text-7xl font-black text-white leading-normal uppercase w-full truncate pb-4 -mb-4">
                        {safeName}
                    </h2>
                </div>

                {/* GRID MÉTRICAS */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                    {[
                        { icon: Clock, val: formatTime(duration_seconds || 0), label: 'Tiempo', color: 'text-white' },
                        { icon: Flame, val: Math.round(calories_burned || 0), label: 'Kcal', color: accent, isStyle: true },
                        { icon: Trophy, val: stats.totalVolume > 1000 ? (stats.totalVolume / 1000).toFixed(1) + 't' : stats.totalVolume, label: 'Volumen', color: 'text-yellow-500' }
                    ].map((item, idx) => (
                        <div key={idx} className="bg-[#111] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center aspect-square shadow-2xl relative overflow-hidden">
                            <item.icon size={64} strokeWidth={1.5} className={`mb-4 ${!item.isStyle ? item.color : ''} ${item.label === 'Tiempo' ? 'opacity-80' : ''}`} style={item.isStyle ? { color: item.color } : {}} />
                            <span className="text-6xl font-black text-white tracking-tighter">{item.val}</span>
                            <span className="text-xl text-gray-500 font-bold uppercase mt-2">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* LISTA DE EJERCICIOS */}
                <div className="flex-1 bg-[#0a0a0a] rounded-[3rem] border border-white/10 p-6 relative flex flex-col">

                    {/* TÍTULO SECCIÓN */}
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10 shrink-0">
                        <TrendingUp size={32} strokeWidth={3} style={{ color: accent }} className="translate-y-[5px]" />
                        <h3 className="text-3xl font-bold text-white leading-none">
                            Resumen de Ejercicios
                        </h3>
                    </div>

                    <div className="flex flex-col gap-3">
                        {details && details.map((ex, i) => {
                            const maxWeight = getMaxWeight(ex.setsDone);
                            // Opcional: Si no hay series válidas, no mostramos el ejercicio (descomentar si se desea)
                            // if (maxWeight === 0 && (!ex.setsDone || ex.setsDone.filter(s=>s.reps>0).length === 0)) return null;

                            return (
                                <div key={i} className="flex justify-between items-center w-full">
                                    <div className="flex flex-col min-w-0 pr-4 flex-1 gap-1">
                                        <span
                                            className="text-3xl font-bold text-gray-200 leading-normal block pb-2"
                                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {t(ex.exerciseName, { ns: 'exercise_names', defaultValue: ex.exerciseName })}
                                        </span>

                                        {/* SUBTÍTULO */}
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Zap size={20} strokeWidth={3} fill="currentColor" className="translate-y-[3px]" />
                                            <span className="text-xl font-medium leading-none">
                                                {getSetsSummary(ex.setsDone)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CHIP PESO: Aumento a pb-4 (16px) para subirlo más */}
                                    <div className="shrink-0 min-w-[140px] h-16 px-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                        <span className="text-2xl font-bold text-white whitespace-nowrap leading-none pb-4">
                                            {maxWeight > 0 ? `${maxWeight} kg` : '-'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-8 flex justify-between items-center opacity-60 shrink-0">
                    <span className="text-2xl font-bold text-white">Entreno de {userName || 'Atleta'}</span>
                    <span className="text-xl font-medium text-gray-400">pro-fitness-glass.zeabur.app</span>
                </div>
            </div>
        </div>
    );
});

export default WorkoutShareCard;