/* frontend/src/components/AndroidDownloadPrompt.jsx */
import React, { useState, useEffect } from 'react';
import { Smartphone, X, Download } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

const AndroidDownloadPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    
    // Iniciamos en null para depender estrictamente del version.json
    // Si no carga el JSON, no mostramos nada (evitamos enlaces rotos o viejos)
    const [downloadUrl, setDownloadUrl] = useState(null);

    // Configuración: Días de espera antes de volver a mostrar
    const DAYS_TO_WAIT = 5;
    const STORAGE_KEY = 'android_prompt_last_seen';

    useEffect(() => {
        const initPrompt = async () => {
            // 1. Si ya estamos en modo nativo (la app instalada), no mostrar nada.
            if (Capacitor.isNativePlatform()) return;

            // 2. Detectar si es Android (User Agent básico)
            const ua = navigator.userAgent.toLowerCase();
            const isAndroid = ua.includes('android');

            if (!isAndroid) return;

            // 2.5. Comprobar si es PWA (Standalone). Si es PWA, NO mostramos el aviso.
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
            if (isStandalone) return;

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

            // 4. Obtener URL desde version.json (Fuente única de verdad) o usar enlace de Play Store
            try {
                // Usamos ruta relativa porque este componente corre en la web/PWA
                const response = await fetch(`/version.json?t=${Date.now()}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.downloadUrl) {
                        setDownloadUrl(data.downloadUrl);
                    } else {
                        // Enlace directo si el JSON no tiene la propiedad
                        setDownloadUrl("https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es");
                    }
                } else {
                    // Enlace directo si la respuesta del fetch no es ok
                    setDownloadUrl("https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es");
                }
            } catch (error) {
                console.warn("No se pudo cargar la configuración de versión dinámica", error);
                // Enlace directo si falla el fetch
                setDownloadUrl("https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es");
            } finally {
                // Aseguramos que se muestre después de haber establecido alguna URL
                setTimeout(() => setIsVisible(true), 2000);
            }
        };

        initPrompt();
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    };

    const handleDownload = () => {
        localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    };

    if (!isVisible || !downloadUrl) return null;

    return (
        <div className="fixed top-4 left-4 right-4 z-[10000] animate-[slide-in-down_0.5s_ease-out] flex justify-center">
            {/* CORRECCIÓN: Borde actualizado para modo OLED/Dark */}
            <div className="bg-bg-secondary border border-transparent dark:border dark:border-white/10 shadow-xl rounded-2xl p-4 w-full max-w-md relative overflow-hidden">

                <button
                    onClick={handleDismiss}
                    className="absolute top-2 right-2 p-1 rounded-full text-text-secondary hover:bg-white/5 transition-colors"
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
                                href={downloadUrl}
                                onClick={handleDownload}
                                className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-accent text-white dark:text-bg-primary rounded-lg font-bold text-sm hover:scale-[1.02] transition-transform shadow-md no-underline"
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