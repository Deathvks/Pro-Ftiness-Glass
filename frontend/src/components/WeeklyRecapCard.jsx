/* frontend/src/components/WeeklyRecapCard.jsx */
import React, { forwardRef, useMemo } from 'react';
import { 
    getFunWeightComparison, 
    getFunCalorieComparison, 
    getFunTimeComparison, 
    getRandomQuote 
} from '../utils/funStatsUtils';
import { 
    FaFire, 
    FaStopwatch, 
    FaWeightHanging, 
    FaQuoteLeft, 
    FaUserCircle,
    FaTrophy,
    FaCalendarAlt,
    FaDumbbell
} from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const WeeklyRecapCard = forwardRef(({ weeklyData, userProfile }, ref) => {
    if (!weeklyData) return null;

    const { totalVolume, totalWorkouts, totalDuration, totalCalories } = weeklyData;
    
    const { username } = userProfile || { username: 'Usuario' };
    const rawProfileImage = userProfile?.profile_image || userProfile?.profile_image_url;

    const profileImgSrc = useMemo(() => {
        if (!rawProfileImage) return null;
        let url = rawProfileImage;

        if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('blob:')) {
             const separator = url.startsWith('/') ? '' : '/';
             url = `${BACKEND_HOST}${separator}${url}`;
        }

        const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
        if (!isLocalhost && url.startsWith('http:')) {
            url = url.replace('http:', 'https:');
        }

        return url;
    }, [rawProfileImage]);

    // Generamos las comparaciones solo si hay datos reales
    const weightComp = useMemo(() => totalVolume > 0 ? getFunWeightComparison(totalVolume) : null, [totalVolume]);
    // const calorieComp = useMemo(() => getFunCalorieComparison(totalCalories), [totalCalories]); // (Reservado para futuro uso si se quiere mostrar)
    // const timeComp = useMemo(() => getFunTimeComparison(totalDuration), [totalDuration]); // (Reservado para futuro uso)
    
    const quote = useMemo(() => getRandomQuote(), []);

    const getWeekRange = () => {
        const now = new Date();
        const first = now.getDate() - now.getDay() + 1; 
        const last = first + 6; 
        const firstDay = new Date(now.setDate(first)).getDate();
        const lastDay = new Date(now.setDate(last)).getDate();
        const month = new Date().toLocaleDateString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
        return `SEM ${firstDay} - ${lastDay} ${month}`;
    };

    return (
        <div
            ref={ref}
            className="relative w-[1080px] h-[1920px] bg-black text-white flex flex-col font-sans overflow-hidden"
        >
            <div className="absolute top-[-10%] left-[-20%] w-[1400px] h-[1400px] bg-blue-700/20 rounded-full blur-[200px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[1400px] h-[1400px] bg-purple-700/20 rounded-full blur-[200px] animate-pulse" style={{ animationDelay: '2s' }} />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.1]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 z-0" />

            <div className="relative z-10 flex flex-col h-full p-12 pt-24">
                
                <div className="flex justify-between items-center mb-16 px-4">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
                            <div className="w-32 h-32 rounded-full border-[6px] border-[#111] overflow-hidden relative z-10 bg-[#222] flex items-center justify-center shadow-2xl">
                                {profileImgSrc ? (
                                    <img 
                                        src={profileImgSrc} 
                                        alt={username} 
                                        className="w-full h-full object-cover" 
                                        crossOrigin="anonymous" 
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <FaUserCircle className="w-full h-full text-gray-500" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 z-20 bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-3 rounded-full border-[6px] border-[#111] shadow-lg">
                                <FaTrophy size={20} />
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">
                                {username}
                            </h2>
                            <span className="text-xl text-blue-400 font-bold uppercase tracking-[0.2em]">
                                Resumen Semanal
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-full shadow-2xl">
                        <FaCalendarAlt className="text-gray-400" size={28} />
                        <span className="text-3xl font-bold text-gray-100 uppercase tracking-widest font-mono">
                            {getWeekRange()}
                        </span>
                    </div>
                </div>

                {/* COMPARACIÓN DE VOLUMEN (Solo si hay volumen > 0 y weightComp válido) */}
                {totalVolume > 0 && weightComp && (
                    <div className="flex-1 flex flex-col justify-center items-center mb-12 relative">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 rounded-full" />
                            <FaWeightHanging 
                                size={200} 
                                className="text-white relative z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]" 
                            />
                        </div>

                        <h3 className="text-3xl font-bold text-gray-400 uppercase tracking-[0.3em] mb-4 text-center">
                            Volumen Total
                        </h3>
                        
                        <div className="w-full h-48 relative mb-6">
                            <svg className="w-full h-full" viewBox="0 0 800 150">
                                <defs>
                                    <linearGradient id="mainTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#ffffff" />
                                        <stop offset="100%" stopColor="#cbd5e1" />
                                    </linearGradient>
                                    <filter id="shadow">
                                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.5"/>
                                    </filter>
                                </defs>
                                <text 
                                    x="50%" 
                                    y="55%" 
                                    dominantBaseline="middle" 
                                    textAnchor="middle" 
                                    fill="url(#mainTextGrad)" 
                                    fontSize="110" 
                                    fontWeight="900" 
                                    letterSpacing="-2"
                                    filter="url(#shadow)"
                                >
                                    {Math.round(totalVolume).toLocaleString()} KG
                                </text>
                            </svg>
                        </div>

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 px-12 py-8 rounded-[3rem] mt-2 max-w-[900px] text-center shadow-xl">
                            <p className="text-3xl font-medium leading-relaxed text-gray-300">
                                Equivalente a levantar <br/>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-black text-5xl uppercase block mt-2">
                                    {weightComp.rawCount} {weightComp.item}S
                                </span>
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-8 mb-16 px-4">
                    <div className="bg-[#111] border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-4 -bottom-4 text-white/5 transform rotate-[-15deg]">
                            <FaStopwatch size={180} />
                        </div>
                        
                        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                            <FaStopwatch size={40} className="text-green-400" />
                        </div>
                        
                        <span className="text-7xl font-black text-white mb-2 tracking-tighter">
                            {(totalDuration / 3600).toFixed(1)}<span className="text-4xl text-gray-500 ml-1">h</span>
                        </span>
                        <span className="text-xl text-gray-400 uppercase font-bold tracking-widest">Tiempo Total</span>
                    </div>

                    <div className="bg-[#111] border border-white/10 rounded-[3rem] p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
                        <div className="absolute -right-4 -bottom-4 text-white/5 transform rotate-[-15deg]">
                            <FaFire size={180} />
                        </div>

                        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                            <FaFire size={40} className="text-orange-400" />
                        </div>
                        
                        <span className="text-7xl font-black text-white mb-2 tracking-tighter">
                            {totalCalories}<span className="text-4xl text-gray-500 ml-1">kcal</span>
                        </span>
                        <span className="text-xl text-gray-400 uppercase font-bold tracking-widest">Energía</span>
                    </div>
                </div>

                {/* FRASE MOTIVACIONAL (Solo si hay actividad) */}
                {totalWorkouts > 0 && (
                    <div className="relative mb-10 px-12">
                        <FaQuoteLeft className="text-white/10 absolute -top-6 left-4" size={80} />
                        <p className="text-4xl font-bold text-center text-gray-200 italic leading-snug relative z-10 drop-shadow-md">
                            "{quote}"
                        </p>
                    </div>
                )}

                <div className="mt-auto border-t border-white/10 pt-10 pb-4 px-4 flex justify-between items-end opacity-90">
                    <div className="flex flex-col gap-2">
                        <span className="text-sm text-gray-500 font-bold uppercase tracking-[0.4em]">Generado por</span>
                        <div className="flex items-center gap-3">
                            <img 
                                src="/logo.webp" 
                                alt="Pro Fitness Glass" 
                                className="w-14 h-14 object-contain drop-shadow-2xl" 
                                crossOrigin="anonymous"
                            />
                            <span className="text-3xl font-black text-white tracking-wide">Pro Fitness Glass</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-5xl font-black text-white">{totalWorkouts}</span>
                            <FaDumbbell className="text-blue-500" size={32} />
                        </div>
                        <span className="text-xl text-blue-400 font-bold uppercase tracking-wider">Sesiones</span>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default WeeklyRecapCard;