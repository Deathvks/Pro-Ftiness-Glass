import React from 'react';
import { Award, X } from 'lucide-react';
import GlassCard from './GlassCard';

const PRToast = ({ newPRs, onClose }) => {
    if (!newPRs || newPRs.length === 0) {
        return null;
    }

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
                    <button onClick={onClose} className="p-1 -m-1 text-text-muted hover:text-text-primary">
                        <X size={18} />
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default PRToast;