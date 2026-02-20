/* frontend/src/components/PRShareCard.jsx */
import React, { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrophy, FaArrowUp, FaCrown, FaUser, FaCalendarAlt } from 'react-icons/fa';

const PRShareCard = forwardRef(({ prData, userName }, ref) => {
    const { t, i18n } = useTranslation(['translation', 'exercise_names']);

    if (!prData) return null;

    const { exerciseName, oldWeight, newWeight, date } = prData;
    
    // Calcular mejora
    const improvement = (parseFloat(newWeight) - parseFloat(oldWeight || 0)).toFixed(1);
    const hasImprovement = parseFloat(improvement) > 0;

    // Traducir nombre del ejercicio
    const translatedExerciseName = t(exerciseName, { ns: 'exercise_names', defaultValue: exerciseName || t('Ejercicio') });

    // Formato de fecha localizado
    const dateStr = new Date(date || Date.now()).toLocaleDateString(i18n.language, {
        day: 'numeric', month: 'long', year: 'numeric'
    }).toUpperCase();

    return (
        <div
            ref={ref}
            // Dimensiones 1080x1920 (9:16 Vertical Story Format)
            className="relative w-[1080px] h-[1920px] bg-black text-white flex flex-col items-center justify-center font-sans overflow-hidden"
        >
            {/* --- FONDOS DEGRADADOS --- */}
            <div className="absolute top-[-10%] left-[-20%] w-[1000px] h-[1000px] bg-yellow-600/30 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[900px] h-[900px] bg-purple-900/40 rounded-full blur-[150px]" />
            <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '50px 50px' }} />

            {/* --- TARJETA CENTRAL --- */}
            <div className="relative z-10 w-[900px] h-[1600px] bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[4rem] shadow-2xl flex flex-col items-center p-16 justify-between">
                
                {/* HEADER: TROFEO Y TÍTULO */}
                <div className="flex flex-col items-center gap-10 mt-8 w-full">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-yellow-500 blur-[60px] opacity-40 rounded-full animate-pulse" />
                        <FaTrophy size={160} className="text-yellow-400 relative z-10 drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" />
                    </div>
                    <div className="flex flex-col items-center gap-4 w-full px-4">
                        <span className="text-3xl font-bold tracking-[0.4em] text-yellow-500 uppercase">
                            {t('Nuevo Récord', { defaultValue: 'Nuevo Récord' })}
                        </span>
                        <h1 className="text-7xl font-black text-white text-center leading-tight uppercase max-w-[850px] drop-shadow-md break-words">
                            {translatedExerciseName}
                        </h1>
                    </div>
                </div>

                {/* DATO PRINCIPAL (PESO) */}
                <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
                    <div className="flex items-baseline justify-center gap-6 flex-wrap">
                        <span className="text-[14rem] leading-none font-black text-white tracking-tighter drop-shadow-2xl">
                            {newWeight}
                        </span>
                        <span className="text-7xl font-bold text-white/60 uppercase">
                            kg
                        </span>
                    </div>
                    
                    {/* MEJORA (Badge) */}
                    {hasImprovement && (
                        <div className="flex items-center gap-4 bg-green-500/20 border border-green-500/30 px-10 py-5 rounded-full mt-10 backdrop-blur-md">
                            <FaArrowUp size={40} className="text-green-400" />
                            <span className="text-5xl font-bold text-green-400">+{improvement} kg</span>
                        </div>
                    )}
                </div>

                {/* COMPARATIVA ANTERIOR */}
                <div className="w-full grid grid-cols-2 gap-10 mb-12">
                    <div className="bg-black/40 rounded-[3rem] p-10 flex flex-col items-center border border-white/5 justify-center">
                        <span className="text-gray-400 text-2xl font-bold uppercase tracking-wider mb-3">
                            {t('Anterior', { defaultValue: 'Anterior' })}
                        </span>
                        <span className="text-6xl font-bold text-gray-200 tracking-tight">{oldWeight || 0} <span className="text-3xl text-gray-500">kg</span></span>
                    </div>
                    <div className="bg-white/10 rounded-[3rem] p-10 flex flex-col items-center border border-white/10 relative overflow-hidden justify-center">
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent" />
                        <div className="flex items-center gap-4 mb-3 z-10">
                            <FaCrown size={28} className="text-yellow-400" />
                            <span className="text-yellow-400 text-2xl font-bold uppercase tracking-wider">
                                {t('Nuevo PR', { defaultValue: 'Nuevo PR' })}
                            </span>
                        </div>
                        <span className="text-6xl font-bold text-white z-10 tracking-tight">{newWeight} <span className="text-3xl text-white/60">kg</span></span>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="w-full border-t border-white/10 pt-10 flex justify-between items-end opacity-90 gap-8">
                    
                    {/* IZQUIERDA: USUARIO (Truncado para evitar overflow) */}
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                        <div className="flex items-center gap-3 text-yellow-500/80 mb-1">
                            <FaUser size={20} className="shrink-0" />
                            <span className="text-xl font-bold uppercase tracking-widest shrink-0">{t('Atleta', { defaultValue: 'Atleta' })}</span>
                        </div>
                        {/* TRUNCATE AQUÍ */}
                        <span className="text-5xl font-black text-white tracking-wide truncate">
                            {userName || t('Yo')}
                        </span>
                    </div>

                    {/* DERECHA: LOGO Y FECHA (Fija, no encoge) */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-3 text-gray-400 mb-2">
                             <FaCalendarAlt size={20} />
                             <span className="text-xl font-bold uppercase tracking-widest">{dateStr}</span>
                        </div>
                        <div className="flex items-center gap-4">
                             <img 
                                src="/logo.webp" 
                                alt="Pro Fitness Glass" 
                                className="w-14 h-14 object-contain drop-shadow-md" 
                                crossOrigin="anonymous"
                            />
                            <span className="text-3xl text-white font-bold tracking-tight">Pro Fitness Glass</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PRShareCard;