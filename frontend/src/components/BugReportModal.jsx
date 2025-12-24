/* frontend/src/components/BugReportModal.jsx */
import React, { useState } from 'react';
import { X, Send, Bug, AlertCircle } from 'lucide-react';
import { createBugReport } from '../services/reportService';
import { useToast } from '../hooks/useToast';

const BugReportModal = ({ onClose }) => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!subject.trim() || !description.trim()) {
            addToast('Por favor completa todos los campos', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await createBugReport(subject, description);
            addToast('¡Gracias! Tu reporte ha sido enviado.', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            addToast('Error al enviar el reporte. Inténtalo más tarde.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-bg-primary rounded-2xl border border-glass-border max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-glass-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <Bug className="text-red-400" size={24} />
                        </div>
                        <h2 className="text-xl font-bold">Reportar un problema</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto custom-scrollbar">

                    {/* Contenedor relativo con fondo accent absoluto al 10% de opacidad */}
                    <div className="relative mb-6 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-accent opacity-10 pointer-events-none" />
                        <div className="relative p-4 flex gap-3">
                            <AlertCircle className="text-accent shrink-0" size={20} />
                            {/* MODIFICACIÓN: Texto alineado a la izquierda para mejor lectura */}
                            <p className="text-sm text-text-secondary text-left leading-relaxed">
                                Describe el error con detalle. Se enviará información técnica de tu dispositivo automáticamente para ayudarnos a solucionarlo.
                            </p>
                        </div>
                    </div>

                    <form id="bug-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-secondary">Asunto</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ej: Error al guardar rutina"
                                className="w-full px-4 py-3 bg-bg-secondary border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                disabled={isSubmitting}
                                maxLength={100}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-secondary">Descripción detallada</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Explica qué estabas haciendo cuando ocurrió el error..."
                                className="w-full px-4 py-3 bg-bg-secondary border border-glass-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent transition-all h-32 resize-none"
                                disabled={isSubmitting}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-glass-border bg-bg-secondary/30 rounded-b-2xl flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl hover:bg-white/5 text-text-secondary font-medium transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="bug-form"
                        disabled={isSubmitting || !subject || !description}
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-bg-primary font-bold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-accent/20"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={18} />
                                Enviar Reporte
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;