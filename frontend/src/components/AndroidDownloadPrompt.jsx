/* frontend/src/components/AndroidDownloadPrompt.jsx */
import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download, Info } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const AndroidDownloadPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);

    // Configuración: Días de espera antes de volver a mostrar
    const DAYS_TO_WAIT = 5;
    const STORAGE_KEY = 'android_prompt_last_seen';

    useEffect(() => {
        const checkEligibility = () => {
            // 1. Si ya estamos en modo nativo (la app instalada), no mostrar nada.
            if (Capacitor.isNativePlatform()) return;

            // 2. Detectar si es Android (User Agent básico)
            const ua = navigator.userAgent.toLowerCase();
            const isAndroid = ua.includes('android');

            if (!isAndroid) return;

            // 3. Comprobar frecuencia (localStorage)
            const lastSeenStr = localStorage.getItem(STORAGE_KEY);
            if (lastSeenStr) {
                const lastSeenDate = new Date(lastSeenStr);
                const now = new Date();
                const diffTime = Math.abs(now - lastSeenDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays < DAYS_TO_WAIT) {
                    return; // Aún no ha pasado el tiempo suficiente
                }
            }

            // Si pasa todas las pruebas, mostrar
            // Pequeño delay para no salir de golpe al cargar la página
            setTimeout(() => setIsVisible(true), 2000);
        };

        checkEligibility();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        // Guardamos la fecha actual para no volver a molestar hasta dentro de X días
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    };

    const handleDownload = () => {
        // Al descargar, asumimos que lo va a instalar, así que guardamos también para que no salga
        // inmediatamente si vuelve a entrar a la web
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-[100] animate-[slide-in-up_0.5s_ease-out]">
            <div className="bg-bg-primary/95 backdrop-blur-md border border-accent/30 shadow-2xl rounded-2xl p-4 max-w-md mx-auto relative overflow-hidden">
                {/* Efecto de brillo de fondo */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-bg-secondary transition-colors"
                >
                    <X size={18} />
                </button>

                <div className="flex gap-4 items-start pr-6">
                    <div className="p-3 bg-accent/10 rounded-xl flex-shrink-0 text-accent">
                        <Smartphone size={28} />
                    </div>

                    <div className="flex-1">
                        <h4 className="font-bold text-text-primary text-base mb-1">
                            ¿Usas Android?
                        </h4>
                        <p className="text-sm text-text-secondary leading-relaxed mb-3">
                            Descarga nuestra App nativa para una mejor experiencia.
                            <span className="block mt-1 text-xs opacity-70 italic">
                                (Siempre puedes descargarla más tarde desde Ajustes)
                            </span>
                        </p>

                        <div className="flex gap-3 mt-2">
                            <a
                                href="/app-release.apk"
                                download="ProFitnessGlass.apk"
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent text-white dark:text-bg-secondary rounded-lg font-bold text-sm hover:scale-[1.02] transition-transform shadow-lg shadow-accent/20"
                            >
                                <Download size={16} /> Descargar
                            </a>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 text-text-secondary font-medium text-sm hover:text-text-primary transition-colors"
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AndroidDownloadPrompt;