/* frontend/src/components/InitialLoadingSkeleton.jsx */
import React, { useState, useEffect } from 'react';
import Skeleton from './Skeleton';
import { RefreshCw } from 'lucide-react';

const InitialLoadingSkeleton = () => {
    const [showRescue, setShowRescue] = useState(false);
    const [isRepairing, setIsRepairing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowRescue(true);
        }, 18000);
        return () => clearTimeout(timer);
    }, []);

    const handleRepair = async () => {
        setIsRepairing(true);
        try {
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                    await reg.unregister();
                }
            }
            if ('caches' in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
            sessionStorage.clear();
            localStorage.removeItem('pfg_cached_initial_state_v1');
            localStorage.removeItem('pfg_crash_loop_count');
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && (k.startsWith('pfg_chunk_retry_') || k.startsWith('pfg_reload_'))) {
                    localStorage.removeItem(k);
                }
            }
        } catch (e) {
            console.warn('Error en reparación:', e);
        }
        const freshUrl = new URL(window.location.href);
        freshUrl.searchParams.set('pfg_fresh', String(Date.now()));
        window.location.replace(freshUrl.toString());
    };

    const handleResetAll = () => {
        try {
            localStorage.clear();
            sessionStorage.clear();
            if ('caches' in window) {
                caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {});
            }
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                    for (const reg of regs) reg.unregister();
                }).catch(() => {});
            }
        } catch {}
        window.location.replace('/login');
    };

    return (
        <div className="min-h-screen w-full bg-transparent flex flex-col relative">
            <div 
                className="w-full flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 animate-[fade-in_0.5s_ease-out]"
                style={{ 
                    paddingTop: 'calc(1.5rem + var(--safe-top))',
                    paddingBottom: 'calc(6rem + var(--safe-bottom))' 
                }}
            >
            {/* Header Title (Desktop) */}
            <div className="hidden md:block mb-8 mt-10 md:mt-0">
                <Skeleton className="h-10 w-48" />
            </div>

            {/* Stat Cards Grid */}
            <div className="mt-6 sm:mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white/5 border border-glass-border p-6 rounded-2xl flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" /> {/* Icon bg placeholder */}
                        <div className="flex flex-col gap-2 flex-1">
                            <Skeleton className="h-4 w-24" /> {/* Title placeholder */}
                            <Skeleton className="h-6 w-16" /> {/* Value placeholder */}
                        </div>
                    </div>
                ))}
            </div>

            {/* Resumen de Hoy (Nutrition Circles) */}
            <div className="bg-white/5 border border-glass-border p-6 rounded-2xl mb-6">
                <Skeleton className="h-7 w-40 mb-6" /> {/* Section Title */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <Skeleton className="w-24 h-24 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Left Column */}
                <div className="flex flex-col gap-6">
                    {/* Routines */}
                    <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                        <Skeleton className="h-7 w-48" />
                        <div className="flex flex-col gap-3">
                            <Skeleton className="h-16 w-full rounded-md" />
                            <Skeleton className="h-16 w-full rounded-md" />
                        </div>
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>

                    {/* Cardio */}
                    <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                        <Skeleton className="h-7 w-32" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-md" />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Weight) */}
                <div className="bg-white/5 border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
                    <Skeleton className="h-7 w-40" />
                    <div className="flex flex-col items-center gap-2 py-4">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-16 w-48" />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-5 w-32 mb-2" />
                        {[...Array(4)].map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-md" />
                        ))}
                    </div>
                    <Skeleton className="h-12 w-full rounded-md mt-2" />
                </div>
            </div>
            </div>

            {showRescue && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] pointer-events-auto">
                    <div className="w-full max-w-sm p-5 rounded-3xl glass border border-amber-500/30 bg-bg-secondary/95 backdrop-blur-2xl shadow-2xl shadow-black/40 flex flex-col gap-3.5 text-center animate-[scale-in_0.2s_ease-out]">
                        <div className="w-11 h-11 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-500">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-text-primary">
                                ¿Está tardando demasiado en cargar?
                            </p>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                Parece que el navegador tiene datos o caché local en conflicto. Puedes forzar una recarga limpia.
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 pt-1">
                            <button
                                type="button"
                                onClick={handleRepair}
                                disabled={isRepairing}
                                className="w-full py-2.5 px-4 rounded-xl bg-accent text-accent-contrast font-bold text-xs shadow-md shadow-accent/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                                <span>{isRepairing ? 'Reparando...' : 'Reparar y Cargar'}</span>
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRescue(false)}
                                    disabled={isRepairing}
                                    className="flex-1 py-2 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-text-secondary hover:text-text-primary font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                                >
                                    Esperar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    disabled={isRepairing}
                                    className="flex-1 py-2 px-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 font-semibold text-xs active:scale-95 transition-all cursor-pointer"
                                >
                                    Restablecer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InitialLoadingSkeleton;
