/* frontend/src/components/WorkoutShareCard.jsx */
import React, { forwardRef, useMemo } from 'react';
import {
    FaDumbbell,
    FaBolt,
    FaClock,
    FaTrophy,
    FaMedal,
    FaCircleCheck,
    FaCircleUser,
    FaArrowTrendUp,
    FaStar
} from 'react-icons/fa6';
import { useTranslation } from 'react-i18next';
import { APP_LOGO_BASE64 } from '../assets/logoBase64';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const WorkoutShareCard = forwardRef(({
    workoutData,
    userName,
    userAvatar,
    accentColor,
    customBgPhoto,
    musclesTrained = [],
    newPRs = []
}, ref) => {
    const { t } = useTranslation(['exercise_names', 'translation']);

    if (!workoutData) return null;

    const accent = accentColor || '#22c55e';
    const { routineName, duration_seconds, calories_burned, details } = workoutData;
    const safeName = routineName || t('Entrenamiento Libre', { defaultValue: 'Entrenamiento Libre' });

    // Avatar url resolution
    const profileImgSrc = useMemo(() => {
        if (!userAvatar) return null;
        let url = userAvatar;
        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
            const separator = url.startsWith('/') ? '' : '/';
            url = `${BACKEND_HOST}${separator}${url}`;
        }
        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
        if (!isLocalhost && url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }
        return url;
    }, [userAvatar]);

    // Format date in Spanish / local
    const dateStr = new Date().toLocaleDateString('es-ES', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    }).toUpperCase().replace('.', '');

    // Músculos entrenados extraídos automáticamente si no se pasaron explícitamente
    const computedMuscles = useMemo(() => {
        if (Array.isArray(musclesTrained) && musclesTrained.length > 0) {
            return musclesTrained;
        }

        const detected = new Set();
        (details || []).forEach(ex => {
            const mg = ex.muscle_group || ex.muscles || ex.category;
            if (mg) {
                String(mg).split(',').forEach(m => {
                    const clean = m.trim().toLowerCase();
                    if (clean.includes('pecho') || clean.includes('chest') || clean.includes('pectoral')) detected.add('Pecho');
                    else if (clean.includes('espalda') || clean.includes('back') || clean.includes('lats') || clean.includes('dorsal')) detected.add('Espalda');
                    else if (clean.includes('pierna') || clean.includes('leg') || clean.includes('quad') || clean.includes('cuad') || clean.includes('femoral') || clean.includes('isquio')) detected.add('Piernas');
                    else if (clean.includes('hombro') || clean.includes('shoulder') || clean.includes('deltoid')) detected.add('Hombros');
                    else if (clean.includes('biceps') || clean.includes('bíceps')) detected.add('Bíceps');
                    else if (clean.includes('triceps') || clean.includes('tríceps')) detected.add('Tríceps');
                    else if (clean.includes('brazo') || clean.includes('arm')) detected.add('Brazos');
                    else if (clean.includes('glute') || clean.includes('glúteo')) detected.add('Glúteos');
                    else if (clean.includes('abs') || clean.includes('core') || clean.includes('abdomina')) detected.add('Core');
                    else if (clean.includes('gemelo') || clean.includes('calves')) detected.add('Gemelos');
                });
            } else {
                const name = (ex.exerciseName || '').toLowerCase();
                if (name.includes('banca') || name.includes('bench') || name.includes('pecho') || name.includes('aperturas') || name.includes('chest')) detected.add('Pecho');
                else if (name.includes('dominada') || name.includes('pull up') || name.includes('remo') || name.includes('row') || name.includes('jalon') || name.includes('lat') || name.includes('espalda')) detected.add('Espalda');
                else if (name.includes('sentadilla') || name.includes('squat') || name.includes('prensa') || name.includes('zancada') || name.includes('quadriceps') || name.includes('femoral') || name.includes('isquios')) detected.add('Piernas');
                else if (name.includes('militar') || name.includes('shoulder') || name.includes('deltoides') || name.includes('elevacion lateral') || name.includes('hombro')) detected.add('Hombros');
                else if (name.includes('biceps') || name.includes('curl')) detected.add('Bíceps');
                else if (name.includes('triceps') || name.includes('tríceps') || name.includes('fondos') || name.includes('pushdown') || name.includes('press frances')) detected.add('Tríceps');
                else if (name.includes('crunch') || name.includes('plancha') || name.includes('core') || name.includes('abdominal')) detected.add('Core');
                else if (name.includes('peso muerto') || name.includes('deadlift')) { detected.add('Espalda'); detected.add('Piernas'); }
            }
        });

        const list = Array.from(detected);
        return list.length > 0 ? list : ['Fuerza Integral'];
    }, [details, musclesTrained]);

    // Estadísticas totales orientadas al alto valor: Carga Máxima y Series Efectivas (sin volumen total en kg)
    const stats = useMemo(() => {
        let totalSets = 0;
        let effectiveSets = 0;
        let totalReps = 0;
        let maxWeight = 0;

        (details || []).forEach(ex => {
            (ex.setsDone || []).forEach(set => {
                const w = parseFloat(set.weight_kg) || 0;
                const r = parseFloat(set.reps) || 0;
                if (r > 0) {
                    totalSets++;
                    totalReps += r;
                    if (!set.is_warmup) {
                        effectiveSets++;
                    }
                    if (w > maxWeight) {
                        maxWeight = w;
                    }
                }
            });
        });

        return {
            totalSets,
            effectiveSets: effectiveSets > 0 ? effectiveSets : totalSets,
            totalReps,
            maxWeight
        };
    }, [details]);

    // PRs batidos en la sesión
    const sessionPRs = useMemo(() => {
        if (Array.isArray(newPRs) && newPRs.length > 0) return newPRs;
        if (Array.isArray(workoutData?.newPRs) && workoutData.newPRs.length > 0) return workoutData.newPRs;
        return [];
    }, [newPRs, workoutData?.newPRs]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const getSetsSummary = (sets, compact = false) => {
        if (!sets || sets.length === 0) return "Sin peso";
        const validSets = sets.filter(s => parseFloat(s.reps) > 0);
        const effectiveCount = validSets.filter(s => !s.is_warmup && !s.is_dropset).length;
        const dropCount = validSets.filter(s => s.is_dropset).length;
        const warmupCount = validSets.filter(s => s.is_warmup).length;

        const parts = [];
        if (effectiveCount > 0) parts.push(`${effectiveCount} Series`);
        if (dropCount > 0) parts.push(`${dropCount} Drop`);
        if (warmupCount > 0) parts.push(`${warmupCount} Calent.`);

        if (parts.length === 0) return "Sin series";

        const effectiveWeights = validSets
            .filter(s => !s.is_warmup && !s.is_dropset)
            .map(s => parseFloat(s.weight_kg) || 0);

        const maxW = effectiveWeights.length > 0 ? Math.max(...effectiveWeights) : 0;

        return (
            <>
                {parts.join(' + ')}
                {maxW > 0 && !compact && (
                    <>
                        <span className="mx-2.5 text-white/40">•</span>
                        Máx {maxW}kg
                    </>
                )}
            </>
        );
    };

    const getMaxWeight = (sets) => {
        if (!sets || sets.length === 0) return null;
        const workingSets = sets.filter(s =>
            parseFloat(s.reps) > 0 &&
            !s.is_warmup &&
            !s.is_dropset
        );
        if (workingSets.length === 0) return null;
        const weights = workingSets.map(s => {
            const val = parseFloat(s.weight_kg);
            return isNaN(val) ? 0 : val;
        });
        return Math.max(...weights);
    };

    // Ajuste tipográfico dinámico según longitud del título
    const getTitleClass = (text) => {
        const len = (text || '').length;
        if (len > 45) return 'text-4xl';
        if (len > 25) return 'text-5xl';
        if (len > 14) return 'text-6xl';
        return 'text-7xl';
    };

    // Lista de ejercicios sanitizada y métricas de layout
    const exerciseList = useMemo(() => {
        if (!details || !Array.isArray(details)) return [];
        return details;
    }, [details]);

    const exerciseCount = exerciseList.length;
    // Con 7 o más ejercicios usamos distribución de 2 columnas para que quepan todos sin recortes
    const isMultiColumn = exerciseCount >= 7;

    const displayedExercises = useMemo(() => {
        if (isMultiColumn) {
            return exerciseCount > 10 ? exerciseList.slice(0, 9) : exerciseList.slice(0, 10);
        }
        return exerciseList.slice(0, 6);
    }, [exerciseList, isMultiColumn, exerciseCount]);

    // Estilos adaptativos según cantidad de ejercicios en columna única
    const getItemStyle = (count) => {
        if (count <= 3) {
            return {
                card: 'px-6 py-3.5 rounded-2xl',
                title: 'text-2xl font-black',
                subtitle: 'text-base font-semibold',
                iconSize: 14,
                badge: 'px-5 py-2.5 rounded-xl text-xl font-black'
            };
        }
        if (count === 4) {
            return {
                card: 'px-5 py-2.5 rounded-2xl',
                title: 'text-xl font-black',
                subtitle: 'text-sm font-semibold',
                iconSize: 13,
                badge: 'px-4 py-2 rounded-xl text-lg font-black'
            };
        }
        // 5 o 6 ejercicios
        return {
            card: 'px-4 py-2 rounded-xl',
            title: 'text-lg font-black',
            subtitle: 'text-xs font-semibold',
            iconSize: 12,
            badge: 'px-3.5 py-1.5 rounded-lg text-base font-black'
        };
    };

    return (
        <div
            ref={ref}
            className="relative w-[1080px] h-[1920px] bg-black text-white flex flex-col font-sans overflow-hidden select-none"
        >
            {/* FONDO: FOTO DEL USUARIO O MESH GRADIENT ESTILO SPOTIFY WRAPPED */}
            {customBgPhoto ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={customBgPhoto}
                        alt="Workout Background"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                    {/* Liquid Glass dark gradient overlays para contraste supremo */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/95" />
                    <div className="absolute inset-0 backdrop-blur-[1px]" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#06070a]">
                    {/* Orbes de luz atmosférica de neón */}
                    <div
                        className="absolute top-[-150px] left-[-150px] w-[950px] h-[950px] rounded-full blur-[160px] opacity-40"
                        style={{ background: accent }}
                    />
                    <div
                        className="absolute top-[35%] right-[-200px] w-[850px] h-[850px] rounded-full blur-[180px] opacity-30"
                        style={{ background: accent }}
                    />
                    <div
                        className="absolute bottom-[-150px] left-[15%] w-[1000px] h-[1000px] rounded-full blur-[200px] opacity-35 bg-blue-600"
                    />
                    {/* Trama sutil de textura Wrapped */}
                    <div
                        className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.7) 1px, transparent 0)',
                            backgroundSize: '48px 48px'
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                </div>
            )}

            {/* CONTENIDO PRINCIPAL: 1080x1920 PADDING CÓMODO */}
            <div className="relative z-10 flex-1 flex flex-col justify-between p-14 pt-20 pb-16">

                {/* 1. HEADER: BRANDING + ATLETA + FECHA */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center w-full">
                        {/* Marca Pro Fitness Glass con Logo Oficial */}
                        <div className="flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl border border-white/20 bg-black/40 overflow-hidden shrink-0"
                                style={{ background: `linear-gradient(135deg, ${accent}40, #1e3a8a80)` }}
                            >
                                <img
                                    src={APP_LOGO_BASE64}
                                    alt="Pro Fitness Glass"
                                    className="w-10 h-10 object-contain drop-shadow"
                                    loading="eager"
                                    decoding="sync"
                                />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-wider text-white uppercase italic drop-shadow-md">
                                    Pro Fitness Glass
                                </span>
                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-white/60">
                                    Workout Story • Liquid Glass
                                </span>
                            </div>
                        </div>

                        {/* Fecha en Badge de Cristal */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/15 px-6 py-3.5 rounded-2xl shadow-xl flex items-center gap-3">
                            <span className="text-lg font-bold tracking-widest text-white/90 font-mono">
                                {dateStr}
                            </span>
                        </div>
                    </div>

                    {/* Fila del Atleta */}
                    <div className="flex items-center justify-between bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 bg-black/40 flex items-center justify-center shrink-0 shadow-lg">
                                {profileImgSrc ? (
                                    <img
                                        src={profileImgSrc}
                                        alt={userName}
                                        className="w-full h-full object-cover"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <FaCircleUser className="w-full h-full text-white/40" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                    {userName || 'Atleta Pro'}
                                    <FaCircleCheck size={20} className="text-sky-400" />
                                </span>
                                <span className="text-sm font-semibold text-white/60 tracking-wider uppercase">
                                    Sesión Registrada
                                </span>
                            </div>
                        </div>

                        <div
                            className="px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase border border-white/20 shadow-md"
                            style={{ backgroundColor: `${accent}25`, color: accent }}
                        >
                            Verificado ✓
                        </div>
                    </div>
                </div>

                {/* 2. ZONA CENTRAL: TÍTULO RUTINA + MÚSCULOS ENTRENADOS */}
                <div className="flex flex-col gap-4 my-3">
                    <div>
                        <span
                            className="font-extrabold tracking-[0.3em] uppercase text-xl mb-3 block drop-shadow"
                            style={{ color: accent }}
                        >
                            Sesión Completada
                        </span>
                        <h2 className={`${getTitleClass(safeName)} font-black text-white leading-[1.05] uppercase tracking-tight break-words drop-shadow-xl`}>
                            {safeName}
                        </h2>
                    </div>

                    {/* BADGES: MÚSCULOS ENTRENADOS */}
                    {computedMuscles.length > 0 && (
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                            <span className="text-xs font-black uppercase tracking-widest text-white/50 mr-1">
                                Músculos:
                            </span>
                            {computedMuscles.map((muscle, idx) => (
                                <div
                                    key={idx}
                                    className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg flex items-center gap-2.5"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: accent, color: accent }} />
                                    <span className="text-lg font-black tracking-wide text-white uppercase">
                                        {muscle}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* BANNER DESTACADO: RÉCORD PERSONAL BATIDO (SI LO HUBO) */}
                    {sessionPRs.length > 0 && (
                        <div className="mt-1 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/10 border-2 border-yellow-400/50 rounded-[2.2rem] p-5 backdrop-blur-2xl flex items-center gap-5 shadow-[0_0_40px_rgba(245,158,11,0.35)] animate-pulse">
                            <div className="w-16 h-16 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-300 shrink-0 shadow-lg">
                                <FaTrophy size={36} className="drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-yellow-300 font-black tracking-[0.2em] text-sm uppercase flex items-center gap-2">
                                    <FaMedal size={16} /> ¡Nuevo Récord Personal Batido!
                                </span>
                                <p className="text-2xl font-black text-white leading-tight truncate">
                                    {t(sessionPRs[0].exercise, { ns: 'exercise_names', defaultValue: sessionPRs[0].exercise })} • {sessionPRs[0].weight} kg
                                    {sessionPRs.length > 1 && (
                                        <span className="text-yellow-300/80 text-lg font-bold ml-2">
                                            (+{sessionPRs.length - 1} más)
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. BENTO GRID DE MÉTRICAS DE ALTO VALOR (MÉTRICAS QUE REALMENTE IMPORTAN AL ATLETA) */}
                <div className="grid grid-cols-3 gap-5 my-3">
                    {/* MÉTRICA 1: CARGA MÁXIMA (TOP LIFT DEL DÍA) */}
                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.2rem] py-5 px-4 h-[215px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                        <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mb-2.5 shadow-md">
                            <FaDumbbell size={34} />
                        </div>
                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                            {stats.maxWeight > 0
                                ? `${stats.maxWeight}kg`
                                : (stats.totalReps > 0 ? `${stats.totalReps}` : `${stats.effectiveSets}`)}
                        </span>
                        <span className="text-xs text-white/60 font-black uppercase tracking-widest mt-1.5 text-center">
                            {stats.maxWeight > 0
                                ? 'Carga Máxima'
                                : (stats.totalReps > 0 ? 'Repeticiones' : 'Series')}
                        </span>
                    </div>

                    {/* MÉTRICA 2: SERIES EFECTIVAS (ESTÍMULO REAL) */}
                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.2rem] py-5 px-4 h-[215px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                        <div
                            className="p-3 rounded-2xl border mb-2.5 shadow-md"
                            style={{
                                backgroundColor: `${accent}25`,
                                borderColor: `${accent}40`,
                                color: accent
                            }}
                        >
                            <FaBolt size={32} />
                        </div>
                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                            {stats.effectiveSets}
                        </span>
                        <span className="text-xs text-white/60 font-black uppercase tracking-widest mt-1.5 text-center">
                            Series Efectivas
                        </span>
                    </div>

                    {/* MÉTRICA 3: TIEMPO ACTIVO & CALORÍAS */}
                    <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-[2.2rem] py-5 px-4 h-[215px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
                        <div className="p-3 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-sky-400 mb-2.5 shadow-md">
                            <FaClock size={34} />
                        </div>
                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                            {formatTime(duration_seconds || 0)}
                        </span>
                        <span className="text-xs text-white/60 font-black uppercase tracking-widest mt-1.5 text-center">
                            {calories_burned > 0 ? `${Math.round(calories_burned)} kcal` : 'Tiempo Activo'}
                        </span>
                    </div>
                </div>

                {/* 4. LISTA DE EJERCICIOS DESTACADOS (DISTRIBUCIÓN ADAPTATIVA SEGÚN VOLUMEN) */}
                <div className="bg-white/[0.06] backdrop-blur-2xl rounded-[2.8rem] border border-white/15 p-6 shadow-2xl flex flex-col flex-1 min-h-0 my-2 overflow-hidden">
                    <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-3 shrink-0">
                        <div className="flex items-center gap-3">
                            <FaArrowTrendUp size={22} style={{ color: accent }} />
                            <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                                Ejercicios de la Sesión
                            </h3>
                        </div>
                        <span className="text-sm font-bold text-white/60">
                            {exerciseCount > 0 ? `${exerciseCount} ${exerciseCount === 1 ? 'Ejercicio' : 'Ejercicios'} • ` : ''}
                            {stats.effectiveSets} Series
                        </span>
                    </div>

                    {exerciseCount === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-white/40 font-semibold text-xl">
                            Sin ejercicios registrados
                        </div>
                    ) : isMultiColumn ? (
                        /* CUANDO HAY 7 O MÁS EJERCICIOS: 2 COLUMNAS PARA QUE NINGUNO SE QUEDE FUERA */
                        <div className="grid grid-cols-2 gap-2.5 overflow-hidden flex-1 content-start">
                            {displayedExercises.map((ex, i) => {
                                const maxWeight = getMaxWeight(ex.setsDone);
                                return (
                                    <div
                                        key={i}
                                        className="flex justify-between items-center w-full bg-white/[0.04] border border-white/5 rounded-xl px-3.5 py-2 shadow-sm min-w-0"
                                    >
                                        <div className="flex flex-col min-w-0 pr-2 flex-1">
                                            <span className="text-base font-black text-white truncate">
                                                {t(ex.exerciseName, { ns: 'exercise_names', defaultValue: ex.exerciseName })}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-white/50 text-xs font-semibold mt-0.5 truncate">
                                                <FaBolt size={11} style={{ color: accent }} className="shrink-0" />
                                                <span className="truncate">{getSetsSummary(ex.setsDone, true)}</span>
                                            </div>
                                        </div>

                                        <div className="shrink-0 px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-sm font-black text-white shadow-inner">
                                            {maxWeight !== null ? `${maxWeight} kg` : '-'}
                                        </div>
                                    </div>
                                );
                            })}
                            {exerciseCount > 10 && (
                                <div className="flex items-center justify-center w-full bg-white/[0.03] border border-dashed border-white/10 rounded-xl px-3 py-2 text-white/60 text-sm font-black uppercase tracking-wider">
                                    + {exerciseCount - 9} más
                                </div>
                            )}
                        </div>
                    ) : (
                        /* CUANDO HAY DE 1 A 6 EJERCICIOS: 1 COLUMNA CON ESCALADO DE TAMAÑO DINÁMICO */
                        <div className={`flex flex-col ${exerciseCount <= 3 ? 'gap-3.5 justify-center' : exerciseCount === 4 ? 'gap-2.5 justify-start' : 'gap-2 justify-start'} overflow-hidden flex-1`}>
                            {displayedExercises.map((ex, i) => {
                                const maxWeight = getMaxWeight(ex.setsDone);
                                const style = getItemStyle(exerciseCount);
                                return (
                                    <div
                                        key={i}
                                        className={`flex justify-between items-center w-full bg-white/[0.04] border border-white/5 ${style.card} shadow-sm`}
                                    >
                                        <div className="flex flex-col min-w-0 pr-4 flex-1">
                                            <span className={`${style.title} text-white truncate`}>
                                                {t(ex.exerciseName, { ns: 'exercise_names', defaultValue: ex.exerciseName })}
                                            </span>
                                            <div className={`flex items-center gap-2 text-white/50 ${style.subtitle} mt-0.5`}>
                                                <FaBolt size={style.iconSize} style={{ color: accent }} className="shrink-0" />
                                                <span>{getSetsSummary(ex.setsDone, false)}</span>
                                            </div>
                                        </div>

                                        <div className={`shrink-0 ${style.badge} bg-white/10 border border-white/20 text-white shadow-inner`}>
                                            {maxWeight !== null ? `${maxWeight} kg` : '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 5. FOOTER ELEGANTE (PRO FITNESS BRANDING) */}
                <div className="mt-6 flex justify-between items-center pt-6 border-t border-white/15 shrink-0">
                    <div className="flex items-center gap-3">
                        <img
                            src={APP_LOGO_BASE64}
                            alt="Pro Fitness Glass"
                            className="w-8 h-8 object-contain rounded-xl drop-shadow shrink-0"
                            loading="eager"
                            decoding="sync"
                        />
                        <span className="text-xl font-extrabold text-white tracking-wide">
                            pro-fitness-glass.zeabur.app
                        </span>
                    </div>
                    <span className="text-lg font-black tracking-widest uppercase text-white/60 font-mono">
                        #PROFITNESSGLASS
                    </span>
                </div>

            </div>
        </div>
    );
});

export default WorkoutShareCard;