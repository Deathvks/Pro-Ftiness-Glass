/* frontend/src/components/PRShareCard.jsx */
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Crown, Sparkles, CheckCircle2 } from 'lucide-react';
import { FaTrophy, FaCalendarAlt, FaDumbbell, FaUserCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const PRShareCard = forwardRef(({ prData, userName, userImage, customBgPhoto }, ref) => {
    const { t, i18n } = useTranslation(['translation', 'exercise_names']);

    const profileImgSrc = useMemo(() => {
        if (!userImage) return null;
        let url = userImage;

        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
             const separator = url.startsWith('/') ? '' : '/';
             url = `${BACKEND_HOST}${separator}${url}`;
        }

        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
        if (!isLocalhost && url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }

        return url;
    }, [userImage]);

    if (!prData) return null;

    const { exerciseName, oldWeight, newWeight, date, muscle_group } = prData;
    
    const formatWeight = (weight) => {
        if (!weight) return 0;
        return Number(parseFloat(weight).toFixed(2));
    };

    const displayNewWeight = formatWeight(newWeight);
    const displayOldWeight = formatWeight(oldWeight);
    
    const improvementVal = formatWeight(displayNewWeight - displayOldWeight);
    const hasImprovement = improvementVal > 0;

    const translatedName = t(exerciseName, { ns: 'exercise_names', defaultValue: exerciseName || t('Ejercicio') });
    const safeUserName = userName ? (userName.length > 20 ? userName.substring(0, 20) + '...' : userName) : t('Atleta');
    
    const dateStr = new Date(date || Date.now()).toLocaleDateString(i18n.language, {
        day: '2-digit', month: 'short', year: 'numeric'
    }).toUpperCase().replace('.', '');

    // Inferencia de grupo muscular
    const detectedMuscle = useMemo(() => {
        if (muscle_group) return String(muscle_group).split(',')[0].trim();
        const n = (exerciseName || '').toLowerCase();
        if (n.includes('banca') || n.includes('bench') || n.includes('pecho') || n.includes('chest')) return 'Pecho';
        if (n.includes('dominada') || n.includes('remo') || n.includes('jalon') || n.includes('espalda')) return 'Espalda';
        if (n.includes('sentadilla') || n.includes('prensa') || n.includes('squat') || n.includes('pierna')) return 'Piernas';
        if (n.includes('militar') || n.includes('hombro') || n.includes('shoulder')) return 'Hombros';
        if (n.includes('biceps') || n.includes('curl')) return 'Bíceps';
        if (n.includes('triceps') || n.includes('fondos') || n.includes('pushdown')) return 'Tríceps';
        if (n.includes('peso muerto') || n.includes('deadlift')) return 'Fuerza Total';
        return 'Fuerza';
    }, [muscle_group, exerciseName]);

    const getTitleClass = (text) => {
        const len = (text || '').length;
        if (len > 35) return 'text-4xl';
        if (len > 20) return 'text-5xl';
        return 'text-6xl';
    };

    return (
        <div
            ref={ref}
            className="relative w-[1080px] h-[1920px] bg-black text-white flex flex-col font-sans overflow-hidden select-none"
        >
            {/* FONDO: FOTO DEL USUARIO O MESH RADIAL AMBER / GOLD */}
            {customBgPhoto ? (
                <div className="absolute inset-0 z-0">
                    <img
                        src={customBgPhoto}
                        alt="PR Background"
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/95" />
                    <div className="absolute inset-0 backdrop-blur-[1px]" />
                </div>
            ) : (
                <div className="absolute inset-0 z-0 bg-[#08080a]">
                    <div className="absolute top-[-10%] left-[-20%] w-[1400px] h-[1400px] bg-yellow-500/25 rounded-full blur-[220px]" />
                    <div className="absolute bottom-[-10%] right-[-20%] w-[1400px] h-[1400px] bg-amber-500/20 rounded-full blur-[220px]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
                    <div
                        className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(250,204,21,0.6) 1px, transparent 0)',
                            backgroundSize: '48px 48px'
                        }}
                    />
                </div>
            )}

            <div className="relative z-10 flex flex-col justify-between h-full p-14 pt-20 pb-16 w-full">
                
                {/* 1. HEADER: BRANDING + ATLETA + FECHA */}
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-xl border border-yellow-400/30">
                                <Sparkles size={28} className="text-white drop-shadow" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black tracking-wider text-white uppercase italic drop-shadow-md">
                                    Pro Fitness Glass
                                </span>
                                <span className="text-xs font-bold uppercase tracking-[0.25em] text-yellow-400/80">
                                    Personal Record Story • 9:16
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center bg-white/10 backdrop-blur-xl border border-white/15 px-6 py-3.5 rounded-2xl shadow-xl whitespace-nowrap">
                            <FaCalendarAlt className="text-yellow-400 mr-3" size={22} />
                            <span className="text-lg font-bold text-gray-100 uppercase tracking-widest font-mono">
                                {dateStr}
                            </span>
                        </div>
                    </div>

                    {/* Fila del Atleta */}
                    <div className="flex items-center justify-between bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400/50 bg-black/40 flex items-center justify-center shrink-0 shadow-lg">
                                {profileImgSrc ? (
                                    <img 
                                        src={profileImgSrc} 
                                        alt={safeUserName} 
                                        className="w-full h-full object-cover" 
                                        crossOrigin="anonymous" 
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <FaUserCircle className="w-full h-full text-gray-500" />
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                    {safeUserName}
                                    <CheckCircle2 size={20} className="text-yellow-400 fill-yellow-400/20" />
                                </span>
                                <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
                                    Nuevo Récord Personal
                                </span>
                            </div>
                        </div>

                        <div className="px-5 py-2 rounded-full text-xs font-black tracking-widest uppercase bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 shadow-md">
                            {detectedMuscle}
                        </div>
                    </div>
                </div>

                {/* 2. ZONA CENTRAL: TROFEO + EJERCICIO + NUEVO PESO GIGANTE */}
                <div className="flex-1 w-full flex flex-col items-center justify-center text-center my-8">
                    <div className="relative mb-10 flex items-center justify-center shrink-0">
                        <div className="absolute w-[360px] h-[360px] bg-yellow-500 blur-[100px] opacity-25 rounded-full" />
                        <FaTrophy size={190} className="text-yellow-400 relative z-10 drop-shadow-[0_25px_30px_rgba(0,0,0,0.9)] animate-pulse" />
                    </div>

                    <h3 className={`${getTitleClass(translatedName)} font-black text-white uppercase tracking-tight mb-8 px-6 w-full text-center leading-[1.1] drop-shadow-xl break-words`}>
                        {translatedName}
                    </h3>
                    
                    <div className="flex items-baseline justify-center w-full mb-8 whitespace-nowrap gap-4">
                        <span className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-yellow-100 to-yellow-300 leading-none drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                            {displayNewWeight}
                        </span>
                        <span className="text-[65px] font-black text-yellow-400 uppercase leading-none">
                            KG
                        </span>
                    </div>

                    {hasImprovement && (
                        <div className="inline-flex items-center justify-center bg-emerald-950/80 border border-emerald-500/50 px-10 py-5 rounded-full shadow-[0_0_35px_rgba(16,185,129,0.3)] backdrop-blur-xl">
                            <TrendingUp size={38} className="text-emerald-400 mr-4 shrink-0" strokeWidth={3} />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400 font-black text-4xl">
                                +{improvementVal} KG DE PROGRESO
                            </span>
                        </div>
                    )}
                </div>

                {/* 3. COMPARATIVA ANTERIOR VS NUEVO (BENTO TILES) */}
                <div className="grid grid-cols-2 gap-8 w-full mb-6">
                    <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-2xl">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 shrink-0">
                            <FaDumbbell size={38} className="text-white/60" />
                        </div>
                        <div className="flex items-baseline justify-center w-full mb-3 gap-2">
                            <span className="text-7xl font-black text-white leading-none">
                                {displayOldWeight}
                            </span>
                            <span className="text-3xl text-white/50 font-bold leading-none">kg</span>
                        </div>
                        <span className="text-xl text-white/50 uppercase font-black tracking-widest block">Marca Anterior</span>
                    </div>

                    <div className="bg-yellow-500/[0.12] backdrop-blur-xl border-2 border-yellow-400/40 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-[0_0_35px_rgba(250,204,21,0.2)]">
                        <div className="w-20 h-20 rounded-2xl bg-yellow-400/20 flex items-center justify-center mb-6 border border-yellow-400/40 shrink-0">
                            <Crown size={38} className="text-yellow-400" />
                        </div>
                        <div className="flex items-baseline justify-center w-full mb-3 gap-2">
                            <span className="text-7xl font-black text-white drop-shadow-[0_8px_16px_rgba(250,204,21,0.4)] leading-none">
                                {displayNewWeight}
                            </span>
                            <span className="text-3xl text-yellow-200/60 font-bold leading-none">kg</span>
                        </div>
                        <span className="text-xl text-yellow-400 uppercase font-black tracking-widest block">Nuevo Récord</span>
                    </div>
                </div>

                {/* 4. FOOTER */}
                <div className="w-full flex justify-between items-center border-t border-white/15 pt-6 pb-2 shrink-0">
                    <span className="text-xl font-bold text-white/80">pro-fitness-glass.zeabur.app</span>
                    <span className="text-lg font-black tracking-widest text-yellow-400/80 font-mono">#PRRECORD #STRAVASTYLE</span>
                </div>

            </div>
        </div>
    );
});

export default PRShareCard;
