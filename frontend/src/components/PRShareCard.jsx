/* frontend/src/components/PRShareCard.jsx */
import React, { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Crown } from 'lucide-react';
import { FaTrophy, FaCalendarAlt, FaDumbbell, FaUserCircle } from 'react-icons/fa';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_HOST = API_BASE_URL?.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const PRShareCard = forwardRef(({ prData, userName, userImage }, ref) => {
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

    const logoUrl = `${window.location.origin}/logo.webp`;

    if (!prData) return null;

    const { exerciseName, oldWeight, newWeight, date } = prData;
    
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

    const getTitleClass = (text) => {
        const len = text.length;
        if (len > 30) return 'text-4xl';
        if (len > 15) return 'text-5xl';
        return 'text-6xl';
    };

    return (
        <div
            ref={ref}
            className="relative w-[1080px] h-[1920px] bg-black text-white flex flex-col font-sans overflow-hidden"
        >
            <div className="absolute top-[-10%] left-[-20%] w-[1400px] h-[1400px] bg-yellow-500/20 rounded-full blur-[200px]" />
            <div className="absolute bottom-[-10%] right-[-20%] w-[1400px] h-[1400px] bg-amber-500/20 rounded-full blur-[200px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/90 z-0" />

            <div className="relative z-10 flex flex-col h-full p-12 pt-24 w-full">
                
                <div className="flex justify-between items-center w-full mb-16 px-4">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#222] shadow-[0_0_20px_rgba(250,204,21,0.2)] shrink-0 bg-[#111] flex items-center justify-center">
                            {profileImgSrc ? (
                                <img 
                                    src={profileImgSrc} 
                                    alt={safeUserName} 
                                    className="w-full h-full object-cover" 
                                    crossOrigin="anonymous" 
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <FaUserCircle className="w-full h-full text-gray-600" />
                            )}
                        </div>
                        <div className="flex flex-col whitespace-nowrap">
                            <h2 className="text-5xl font-black text-white tracking-tight drop-shadow-lg uppercase m-0 p-0">
                                {safeUserName}
                            </h2>
                            <span className="text-xl text-yellow-500 font-bold uppercase tracking-[0.2em] mt-2 block">
                                {t('Nuevo Récord')}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center bg-white/5 border border-white/10 px-8 py-5 rounded-full shadow-2xl whitespace-nowrap shrink-0">
                        <FaCalendarAlt className="text-gray-400 mr-4 shrink-0" size={28} />
                        <span className="text-3xl font-bold text-gray-100 uppercase tracking-widest font-mono m-0 p-0">
                            {dateStr}
                        </span>
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col items-center justify-center text-center">
                    <div className="relative mb-12 flex items-center justify-center shrink-0">
                        <div className="absolute w-[300px] h-[300px] bg-yellow-500 blur-[80px] opacity-20 rounded-full" />
                        <FaTrophy size={200} className="text-yellow-500 relative z-10 drop-shadow-[0_20px_20px_rgba(0,0,0,0.8)]" />
                    </div>

                    <h3 className={`${getTitleClass(translatedName)} font-bold text-gray-100 uppercase tracking-[0.2em] mb-12 px-10 w-full text-center leading-tight m-0`}>
                        {translatedName}
                    </h3>
                    
                    <div className="flex items-baseline justify-center w-full mb-12 whitespace-nowrap gap-4">
                        <span className="text-[140px] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-yellow-200 leading-none m-0 p-0 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] pr-4">
                            {displayNewWeight}
                        </span>
                        <span className="text-[60px] font-bold text-yellow-500 uppercase leading-none m-0 p-0">
                            KG
                        </span>
                    </div>

                    {hasImprovement && (
                        <div className="inline-flex items-center justify-center bg-emerald-950/80 border border-emerald-500/50 px-12 py-6 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.2)] whitespace-nowrap">
                            <TrendingUp size={45} className="text-emerald-400 mr-6 shrink-0" strokeWidth={2.5} />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 font-black text-5xl m-0 p-0 pr-2">
                                +{improvementVal} KG
                            </span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-10 w-full px-4 mb-16">
                    <div className="bg-[#111] border border-white/10 rounded-[3rem] p-12 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-2xl whitespace-nowrap">
                        <div className="w-24 h-24 rounded-full bg-gray-500/10 flex items-center justify-center mb-8 border border-gray-500/20 shrink-0">
                            <FaDumbbell size={45} className="text-gray-400" />
                        </div>
                        <div className="flex items-baseline justify-center w-full mb-4 gap-2">
                            <span className="text-7xl font-black text-white m-0 p-0 leading-none pr-2">
                                {displayOldWeight}
                            </span>
                            <span className="text-3xl text-gray-500 font-bold m-0 p-0 leading-none">kg</span>
                        </div>
                        <span className="text-2xl text-gray-400 uppercase font-bold tracking-widest m-0 p-0 block">{t('Anterior')}</span>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-[3rem] p-12 flex flex-col items-center justify-center relative overflow-hidden text-center shadow-2xl whitespace-nowrap">
                        <div className="w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center mb-8 border border-yellow-500/40 shrink-0">
                            <Crown size={45} className="text-yellow-400" />
                        </div>
                        <div className="flex items-baseline justify-center w-full mb-4 gap-2">
                            <span className="text-7xl font-black text-white drop-shadow-[0_10px_10px_rgba(250,204,21,0.3)] m-0 p-0 leading-none pr-2">
                                {displayNewWeight}
                            </span>
                            <span className="text-3xl text-yellow-200/50 font-bold m-0 p-0 leading-none">kg</span>
                        </div>
                        <span className="text-2xl text-yellow-400 uppercase font-bold tracking-widest m-0 p-0 block">{t('Nuevo PR')}</span>
                    </div>
                </div>

                <div className="w-full flex justify-between items-center border-t border-white/10 pt-10 pb-4 px-4 opacity-90 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-bold uppercase tracking-[0.4em] mb-2 block">Generado por</span>
                        <div className="flex items-center">
                            <img src={logoUrl} alt="Pro Fitness Glass" className="w-14 h-14 object-contain drop-shadow-2xl mr-4 shrink-0" crossOrigin="anonymous" />
                            <span className="text-3xl font-black text-white tracking-wide m-0 p-0 pr-2">Pro Fitness Glass</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end text-right">
                        <span className="text-5xl font-black text-white tracking-widest mb-1 m-0 p-0 block pr-1">PRO</span>
                        <span className="text-xl text-yellow-500 font-bold uppercase tracking-wider m-0 p-0 block pr-1">FITNESS GLASS</span>
                    </div>
                </div>

            </div>
        </div>
    );
});

export default PRShareCard;