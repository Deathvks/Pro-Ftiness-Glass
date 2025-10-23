import React from 'react';
import { Award, X, Share2 } from 'lucide-react'; // Importar Share2
import GlassCard from './GlassCard';

const PRToast = ({ newPRs, onClose }) => {
    if (!newPRs || newPRs.length === 0) {
        return null;
    }

    // Función para manejar el compartido
    const handleShare = async () => {
        const prText = newPRs.map(pr => `  • ${pr.exercise}: ${pr.weight} kg`).join('\n');
        const shareTitle = '¡Nuevo Récord Personal!';
        const shareText = `¡He conseguido ${newPRs.length > 1 ? 'nuevos récords' : 'un nuevo récord'} en Pro-Fitness-Glass!\n\n${prText}\n\n¡Registra tus progresos tú también!`;
        const shareUrl = window.location.origin || 'https://pro-ftiness-glass.com'; // URL de la app

        if (navigator.share) {
            try {
                await navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error al compartir PR:', error);
            }
        } else {
            // Fallback simple para navegadores no compatibles
            alert('Tu navegador no soporta la función de compartir. ¡Intenta copiar el texto!');
        }
    };

    return (
        <div className="fixed bottom-24 md:bottom-10 right-10 z-50 animate-[fade-in-up_0.5s_ease-out]">
            <GlassCard className="max-w-sm p-4 border-accent-border">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-accent mt-1">
                        <Award size={24} />
                    </div>
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-text-primary">¡Nuevo Récord Personal!</h3>
                        <ul className="mt-1 text-sm text-text-secondary list-disc pl-5">
                            {newPRs.map((pr, index) => (
                                <li key={index}>
                                    <strong>{pr.exercise}:</strong> {pr.weight} kg
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Botón de compartir añadido */}
                    <button onClick={handleShare} className="p-1 -m-1 text-text-muted hover:text-text-primary">
                        <Share2 size={18} />
                    </button>
                    {/* Botón de cerrar original */}
                    <button onClick={onClose} className="p-1 -m-1 text-text-muted hover:text-text-primary">
                        <X size={18} />
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default PRToast;