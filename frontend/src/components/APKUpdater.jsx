/* frontend/src/components/APKUpdater.jsx */
import React, { useEffect, useState } from 'react';
import { Download, X, Sparkles } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION } from '../config/version';

// URL de producción donde se aloja el version.json
const REMOTE_BASE_URL = 'https://pro-fitness-glass.zeabur.app';

const APKUpdater = () => {
    const [updateAvailable, setUpdateAvailable] = useState(null);

    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;

        const checkVersion = async () => {
            try {
                // CORRECCIÓN: Usamos URL absoluta, si no fetch busca en localhost (el móvil)
                const response = await fetch(`${REMOTE_BASE_URL}/version.json?t=${new Date().getTime()}`);

                if (!response.ok) return;

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
                        {updateAvailable.notes || "Mejoras y correcciones disponibles."}
                    </p>

                    <button
                        onClick={handleUpdate}
                        className="w-full py-3 px-4 bg-accent text-white dark:text-bg-secondary font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-accent/20"
                    >
                        <Download size={20} /> Actualizar Ahora
                    </button>
                    <p className="text-center text-[10px] text-text-muted mt-3">
                        Se descargará el APK. Pulsa "Abrir" al finalizar.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default APKUpdater;