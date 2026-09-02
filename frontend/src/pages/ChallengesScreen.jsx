import React, { useState, useEffect } from 'react';
import { UserGroupIcon, FireIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { Share2, Copy, CheckCircle, ChevronLeft } from 'lucide-react';
import { FaMeteor } from 'react-icons/fa6';
import apiClient from '../services/apiClient';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import RewardsModal from '../components/RewardsModal';

const ChallengesScreen = ({ setView }) => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('daily');
    const [showRewardsModal, setShowRewardsModal] = useState(false);

    const userProfile = useAppStore(state => state.userProfile);
    const { addToast } = useToast();

    useEffect(() => {
        if (userProfile?.id && localStorage.getItem(`visited_challenges_v2_${userProfile.id}`) !== 'true') {
            localStorage.setItem(`visited_challenges_v2_${userProfile.id}`, 'true');
        }
        const fetchChallenges = async () => {
            try {
                const data = await apiClient('/gamification/challenges');
                setChallenges(data);
            } catch (err) {
                console.error("Error cargando retos", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChallenges();
    }, []);

    const dailyChallenges = challenges
        .filter(c => c.type === 'daily')
        .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
        
    const generalChallenges = challenges
        .filter(c => c.type === 'general' || c.type === 'weekly')
        .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
        
    const completedChallenges = challenges.filter(c => c.completed);

    const renderChallengeCard = (challenge) => {
        const percentage = Math.min((challenge.progress / challenge.target) * 100, 100);
        const isCompleted = challenge.completed;

        return (
            <div key={challenge.id} className="glass border border-glass-border rounded-2xl p-5 relative overflow-hidden">
                {/* Background Progress Bar (Subtle) */}
                <div 
                    className="absolute top-0 left-0 h-full bg-accent/20 transition-all duration-500 ease-out z-0" 
                    style={{ width: `${percentage}%` }}
                />
                
                <div className="relative z-10 flex justify-between items-start mb-3">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary flex items-center">
                            {challenge.title}
                            {isCompleted && <span className="ml-2 text-accent text-sm">✓</span>}
                        </h3>
                        <p className="text-text-secondary text-sm mt-1">{challenge.desc}</p>
                    </div>
                    <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        +{challenge.xp} XP
                    </div>
                </div>

                <div className="relative z-10 mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className={isCompleted ? 'text-accent' : 'text-text-primary'}>
                            {isCompleted ? '¡Completado!' : 'Progreso'}
                        </span>
                        <span className="text-text-secondary">
                            {challenge.progress} / {challenge.target}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden shadow-inner">
                        <div 
                            className="h-full rounded-full transition-all duration-500 bg-accent"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    const handleCopyReferral = () => {
        const isCapacitor = window.location.origin === 'http://localhost';
        const baseUrl = isCapacitor ? (import.meta.env.VITE_WEB_URL || 'https://pro-fitness-glass.vercel.app') : window.location.origin;
        const referralLink = `${baseUrl}/register?ref=${userProfile?.referral_code || ''}`;
        navigator.clipboard.writeText(referralLink);
        addToast('¡Enlace copiado!', 'success');
    };

    return (
        <>
            <div className="min-h-screen bg-background text-text-primary font-sans pb-24">
                <div className="max-w-5xl mx-auto w-full">

                    <div className="hidden md:flex px-6 pt-8 mb-2">
                        <button 
                            onClick={() => setView && setView('hub')} 
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors w-fit shrink-0"
                        >
                            <ChevronLeft size={20} />
                            Volver
                        </button>
                    </div>
                    <header className="px-6 pt-4 md:pt-6 pb-4 glassCardClass">
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight mb-2">
                            Retos y Misiones
                        </h1>
                        <p className="text-text-secondary text-sm">Completa retos para ganar XP y subir de nivel.</p>
                    </header>
                <div className="px-6 mt-6">
                    
                    {/* Referrals Infinite Challenge Card */}
                    <div className="mb-4">
                        <div className="relative group overflow-hidden rounded-[20px] bg-accent shadow-xl shadow-accent/30 border border-white/20 p-6 transform transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={handleCopyReferral}>
                            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 mix-blend-overlay"></div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:opacity-30 transition-opacity"></div>
                            
                            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-4">
                                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/30 shadow-inner backdrop-blur-sm">
                                    <UserGroupIcon className="w-8 h-8 text-white drop-shadow-md" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-bold text-white tracking-tight mb-1">Invitar a un amigo</h3>
                                    <p className="text-white/80 text-sm mb-3">Infinito • Pide a un amigo que se registre con tu enlace y obtén 1.000 XP cada vez que alguien nuevo lo haga.</p>
                                    <div className="inline-flex items-center gap-2 bg-black/30 px-4 py-2 rounded-full border border-white/20 text-white font-mono text-sm shadow-inner group-hover:bg-black/40 transition-colors">
                                        <span>{userProfile?.referral_code || 'Cargando...'}</span>
                                        <span className="text-white/60 text-xs uppercase font-bold ml-2">Click para copiar</span>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowRewardsModal(true); }}
                                        className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-[14px] text-sm font-bold transition-colors inline-flex items-center gap-2 backdrop-blur-md shadow-sm border border-white/20"
                                    >
                                        <span>🎁 Ver Recompensas (Llevas {userProfile?.referralCount || 0})</span>
                                    </button>
                                </div>
                                <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto mt-4 md:mt-0">
                                    <div className="flex flex-col items-center justify-center bg-white/10 rounded-xl p-3 border border-white/20 min-w-[80px]">
                                        <span className="text-2xl font-black text-white">+1k</span>
                                        <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-3 mb-8">
                        <button 
                            className={`flex-1 py-3 px-5 text-sm font-bold rounded-[20px] transition-all duration-300 ${activeTab === 'daily' ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'glass-btn text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-glass-border'}`}
                            onClick={() => setActiveTab('daily')}
                        >
                            Diarios
                        </button>
                        <button 
                            className={`flex-1 py-3 px-5 text-sm font-bold rounded-[20px] transition-all duration-300 ${activeTab === 'general' ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'glass-btn text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-glass-border'}`}
                            onClick={() => setActiveTab('general')}
                        >
                            Generales
                        </button>
                        <button 
                            className={`flex-1 py-3 px-5 text-sm font-bold rounded-[20px] transition-all duration-300 ${activeTab === 'completed' ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-[1.02]' : 'glass-btn text-text-secondary hover:text-text-primary hover:bg-surface/50 border border-glass-border'}`}
                            onClick={() => setActiveTab('completed')}
                        >
                            Completados
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-10">
                            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : activeTab === 'daily' ? (
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left Column */}
                            <div className="flex-1 w-full flex flex-col gap-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <FireIcon className="w-6 h-6 text-orange-500" /> Nutrición
                                    </h2>
                                    <div className="space-y-4">
                                        {dailyChallenges.filter(c => ['daily_5_meals', 'daily_calories', 'daily_protein', 'daily_water'].includes(c.id)).map(renderChallengeCard)}
                                    </div>
                                </div>
                            </div>
                            {/* Right Column */}
                            <div className="flex-1 w-full flex flex-col gap-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <BoltIcon className="w-6 h-6 text-yellow-400" /> Entrenamiento
                                    </h2>
                                    <div className="space-y-4">
                                        {dailyChallenges.filter(c => c.id === 'daily_workout').map(renderChallengeCard)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <UserGroupIcon className="w-6 h-6 text-accent" /> Social
                                    </h2>
                                    <div className="space-y-4">
                                        {dailyChallenges.filter(c => c.id.startsWith('social_')).map(renderChallengeCard)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : activeTab === 'general' ? (
                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Left Column */}
                            <div className="flex-1 w-full flex flex-col gap-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <UserGroupIcon className="w-6 h-6 text-accent" /> Social
                                    </h2>
                                    <div className="space-y-4">
                                        {generalChallenges.filter(c => c.id.startsWith('social_')).map(renderChallengeCard)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <BoltIcon className="w-6 h-6 text-yellow-400" /> Entrenamiento
                                    </h2>
                                    <div className="space-y-4">
                                        {generalChallenges.filter(c => c.id.startsWith('train_')).map(renderChallengeCard)}
                                    </div>
                                </div>
                            </div>
                            {/* Right Column */}
                            <div className="flex-1 w-full flex flex-col gap-8">
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <FireIcon className="w-6 h-6 text-orange-500" /> Nutrición
                                    </h2>
                                    <div className="space-y-4">
                                        {generalChallenges.filter(c => c.id.startsWith('nutri_')).map(renderChallengeCard)}
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
                                        <SparklesIcon className="w-6 h-6 text-purple-400" /> Inteligencia Artificial
                                    </h2>
                                    <div className="space-y-4">
                                        {generalChallenges.filter(c => c.id.startsWith('ai_')).map(renderChallengeCard)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {completedChallenges.length > 0 ? (
                                completedChallenges.map(renderChallengeCard)
                            ) : (
                                <div className="col-span-1 md:col-span-2 py-10 text-center text-text-secondary">
                                    <p>Aún no has completado ningún reto.</p>
                                    <p className="mt-2 text-sm">¡Empieza a ganar XP en las otras pestañas!</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </div>
            </div>
            <RewardsModal isOpen={showRewardsModal} onClose={() => setShowRewardsModal(false)} />
        </>
    );
};

export default ChallengesScreen;
