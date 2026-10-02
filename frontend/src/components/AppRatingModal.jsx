import React, { useState, useEffect } from 'react';
import { StarIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';
import { submitAppRating } from '../services/ratingService';
import { useToast } from '../contexts/ToastContext';

const AppRatingModal = ({ visible, onClose, onFinish }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    // Prevent background scroll
    useEffect(() => {
        if (visible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [visible]);

    if (!visible) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            addToast('Por favor, selecciona una puntuación', 'error');
            return;
        }
        setIsSubmitting(true);
        try {
            await submitAppRating(rating, comment);
            addToast('¡Gracias por tu valoración!', 'success');
            localStorage.setItem('has_rated_app', 'true');
            if (onFinish) onFinish();
            onClose();
        } catch (error) {
            addToast(error.message || 'Error al enviar valoración', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRemindLater = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleRemindLater}></div>
            <div className="relative bg-bg-secondary w-full max-w-md rounded-[32px] shadow-2xl p-6 sm:p-8 animate-[scale-in_0.3s_ease-out] ring-1 ring-white/10 flex flex-col items-center text-center">
                
                <button 
                    onClick={handleRemindLater}
                    className="absolute top-4 right-4 p-2 bg-black/10 dark:bg-white/10 rounded-full text-text-secondary hover:text-text-primary transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-accent/10">
                    <StarIcon className="w-8 h-8 text-accent" />
                </div>

                <h2 className="text-2xl font-black text-text-primary mb-2">¿Te gusta la app?</h2>
                <p className="text-text-secondary text-sm mb-8 font-medium">Tu opinión nos ayuda muchísimo a seguir mejorando cada día. ¿Cómo nos valorarías?</p>

                <div className="flex gap-2 mb-8">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className="transition-transform active:scale-75 hover:scale-110"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHover(star)}
                            onMouseLeave={() => setHover(rating)}
                        >
                            {star <= (hover || rating) ? (
                                <StarIcon className="w-10 h-10 text-accent filter drop-shadow-md" />
                            ) : (
                                <StarOutline className="w-10 h-10 text-text-muted" />
                            )}
                        </button>
                    ))}
                </div>

                <div className={w-full overflow-hidden transition-all duration-300 \}>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="¿Qué es lo que más te gusta? ¿Qué mejorarías? (Opcional)"
                        className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent resize-none h-24 font-medium"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="w-full bg-accent text-accent-contrast py-4 rounded-2xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-accent/20"
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar valoración'}
                </button>
                <button
                    onClick={handleRemindLater}
                    className="mt-4 text-sm font-bold text-text-secondary hover:text-text-primary transition-colors"
                >
                    Recordármelo más tarde
                </button>
            </div>
        </div>
    );
};

export default AppRatingModal;
