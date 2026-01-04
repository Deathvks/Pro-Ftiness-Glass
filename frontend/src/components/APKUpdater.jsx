/* frontend/src/components/APKUpdater.jsx */
import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../config/version'; // Asegúrate que esto apunta a tu const '5.0.0'

const APKUpdater = () => {
    const [updateAvailable, setUpdateAvailable] = useState(null);

    useEffect(() => {
        // Solo ejecutar en la app nativa de Android
        if (Capacitor.getPlatform() !== 'android') return;

        const checkVersion = async () => {
            try {
                // Añadimos timestamp para evitar caché del navegador
                const response = await fetch(`/version.json?t=${new Date().getTime()}`);
                const data = await response.json();

                if (isNewerVersion(APP_VERSION, data.version)) {
                    setUpdateAvailable(data);
                }
            } catch (error) {
                console.error("Error comprobando actualizaciones:", error);
            }
        };

        checkVersion();
    }, []);

    // Comparador simple de versiones semánticas (ej: 5.0.0 vs 5.0.1)
    const isNewerVersion = (current, remote) => {
        const cParts = current.split('.').map(Number);
        const rParts = remote.split('.').map(Number);

        for (let i = 0; i < 3; i++) {
            if (rParts[i] > cParts[i]) return true;
            if (rParts[i] < cParts[i]) return false;
        }
        return false;
    };

    const handleUpdate = () => {
        if (updateAvailable?.downloadUrl) {
            // Abrir en el navegador del sistema para que gestione la descarga e instalación
            window.open(updateAvailable.downloadUrl, '_system');
        }
    };

    if (!updateAvailable) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fade-in_0.3s]">
            <div className="bg-bg-primary border border-glass-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-[slide-in-up_0.3s]">
                <div className="bg-gradient-to-r from-accent to-accent-secondary p-4 text-white flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Sparkles size={18} /> Nueva Versión {updateAvailable.version}
                        </h3>
                        <p className="text-white/80 text-xs mt-1">¡Actualización disponible!</p>
                    </div>
                    <button onClick={() => setUpdateAvailable(null)} className="p-1 bg-white/20 rounded-full hover:bg-white/30 transition">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5">
                    <p className="text-text-secondary text-sm mb-4">
                        {updateAvailable.notes || "Hay una nueva versión disponible con mejoras y correcciones. Descárgala para disfrutar de lo último."}
                    </p>

                    <button
                        onClick={handleUpdate}
                        className="w-full py-3 px-4 bg-accent text-white dark:text-bg-secondary font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-accent/20"
                    >
                        <Download size={20} /> Actualizar Ahora
                    </button>
                    <p className="text-center text-[10px] text-text-muted mt-3">
                        Se descargará el APK. Pulsa "Abrir" al finalizar para instalar sobre la actual.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default APKUpdater;