/* frontend/src/components/SeasonPassUnlockModal.jsx */
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Crown, Share2 } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const SeasonPassUnlockModal = ({ isOpen, onClose, unlockData }) => {
    const userProfile = useAppStore(state => state.userProfile);

    // --- LÓGICA DE SONIDO Y VIBRACIÓN ---
    useEffect(() => {
        if (isOpen && unlockData) {
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }

            try {
                // Recompensa "Sonido Level Up" (Nv. 90+): Sonido épico exclusivo
                const audioFile = unlockData.level >= 90 ? '/sounds/epic-level-up.mp3' : '/sounds/level-up.mp3';
                const audio = new Audio(audioFile);
                audio.volume = 0.7;
                audio.play().catch(() => console.log('El navegador bloqueó el autoplay del sonido.'));
            } catch (e) {
                console.error("Error al reproducir audio:", e);
            }
        }
    }, [isOpen, unlockData]);

    const handleShare = async () => {
        const shareData = {
            title: '¡Dios del Olimpo!',
            text: `¡He completado la Temporada 1 de Pro Fitness Glass y alcanzado el Nivel 100! 👑⚡️`,
            url: 'https://pro-fitness-glass.zeabur.app'
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (e) {
                console.log("Error al compartir o cancelado por el usuario.");
            }
        } else {
            alert("Tu navegador no soporta compartir directamente. ¡Haz una captura de pantalla de tu certificado!");
        }
    };

    if (!unlockData) return null;

    // --- RECOMPENSA: CERTIFICADO ÉPICO (NIVEL 100) ---
    if (unlockData.level >= 100) {
        return (
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50, rotateX: 15 }}
                            animate={{ scale: 1, y: 0, rotateX: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ type: "spring", bounce: 0.4 }}
                            className="relative w-full max-w-lg bg-zinc-900 border-[4px] border-amber-500 p-6 sm:p-8 rounded-sm text-center shadow-[0_0_80px_rgba(245,158,11,0.4)]"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                backgroundImage: `radial-gradient(circle at center, rgba(245,158,11,0.15) 0%, transparent 70%), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                            }}
                        >
                            {/* Esquinas del Diploma */}
                            <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-amber-500"></div>
                            <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-amber-500"></div>
                            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-amber-500"></div>
                            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-amber-500"></div>

                            <Crown size={60} className="mx-auto text-amber-500 mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />

                            <h1 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600 mb-2 uppercase tracking-widest">
                                Certificado Épico
                            </h1>
                            <h2 className="text-sm sm:text-base text-amber-500/80 mb-6 font-bold tracking-widest uppercase">
                                Temporada 1: El Despertar
                            </h2>

                            <div className="py-6 border-y border-amber-500/20 mb-6">
                                <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Otorgado a</p>
                                <p className="text-3xl sm:text-4xl font-black text-white italic drop-shadow-md">
                                    {userProfile?.username || 'Atleta Élite'}
                                </p>
                            </div>

                            <p className="text-sm sm:text-base text-gray-300 mb-8 leading-relaxed">
                                Por alcanzar el <strong className="text-amber-400">Nivel 100</strong> y demostrar una constancia y disciplina inquebrantables, obteniendo el título definitivo de <strong className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]">Dios del Olimpo</strong>.
                            </p>

                            {/* Resumen de las recompensas finales ganadas */}
                            <div className="grid grid-cols-2 gap-3 mb-8">
                                {unlockData.rewards.map((reward, i) => {
                                    const Icon = reward.icon;
                                    return (
                                        <div key={i} className="flex items-center gap-2 bg-black/40 p-2 rounded-lg border border-amber-500/20 text-left">
                                            <div className={`w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br ${reward.bgGradient}`}>
                                                <Icon size={16} className="text-white" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-white truncate">{reward.title}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex flex-col sm:flex-row justify-center gap-3">
                                <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black rounded-xl hover:opacity-90 transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95">
                                    <Share2 size={20} /> Compartir Logro
                                </button>
                                <button onClick={onClose} className="flex items-center justify-center px-6 py-3.5 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all active:scale-95">
                                    Cerrar
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }

    // --- RENDERIZADO DEL MODAL NORMAL (Niveles < 100) ---
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 50 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                        className="relative w-full max-w-md bg-bg-secondary border border-accent/50 rounded-3xl shadow-[0_0_50px_rgba(var(--accent-rgb),0.3)] p-6 overflow-hidden text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(var(--accent-rgb),0.15)_360deg)] pointer-events-none"
                        />

                        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2 bg-black/50 rounded-full text-white/70 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", damping: 12 }}
                                className="mx-auto w-28 h-28 relative mb-6"
                            >
                                <div className="absolute inset-0 bg-yellow-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>

                                <div className="absolute inset-0 bg-gradient-to-b from-yellow-300 via-amber-500 to-orange-600 rounded-full border-[3px] border-yellow-100 shadow-[inset_0_-4px_8px_rgba(0,0,0,0.3),0_10px_20px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-[40%] bg-white/30 rounded-t-full"></div>
                                    <Trophy size={52} className="text-white relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" strokeWidth={1.5} />
                                </div>
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-1 uppercase tracking-widest drop-shadow-sm"
                            >
                                ¡Nivel {unlockData.level} Alcanzado!
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-text-primary/80 font-bold mb-6 text-sm sm:text-base uppercase tracking-wider"
                            >
                                {unlockData.title}
                            </motion.p>

                            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                                {unlockData.rewards.map((reward, i) => {
                                    const Icon = reward.icon;
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -50 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + (i * 0.15), type: "spring" }}
                                            className="flex items-center gap-4 bg-bg-primary p-3 rounded-2xl border border-glass-border shadow-lg relative overflow-hidden"
                                        >
                                            <motion.div
                                                initial={{ x: '-100%' }}
                                                animate={{ x: '200%' }}
                                                transition={{ delay: 0.7 + (i * 0.15), duration: 0.8 }}
                                                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                                            />

                                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${reward.bgGradient || 'from-gray-700 to-black'} shadow-inner shrink-0 relative z-10`}>
                                                <Icon size={24} className={reward.iconClassName || "text-white"} />
                                            </div>
                                            <div className="text-left flex-1 min-w-0 relative z-10">
                                                <p className="text-sm font-black text-text-primary truncate">{reward.title}</p>
                                                <p className="text-[10px] sm:text-xs text-text-secondary leading-tight line-clamp-2">{reward.desc}</p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + (unlockData.rewards.length * 0.15) }}
                                onClick={onClose}
                                className="mt-6 w-full py-3.5 px-4 bg-accent text-white font-black text-lg rounded-xl hover:bg-accent/90 transition-all shadow-[0_0_20px_rgba(var(--accent-rgb),0.4)] hover:shadow-[0_0_30px_rgba(var(--accent-rgb),0.6)] active:scale-95"
                            >
                                Reclamar
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SeasonPassUnlockModal;