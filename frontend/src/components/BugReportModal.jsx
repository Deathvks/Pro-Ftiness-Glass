/* frontend/src/components/BugReportModal.jsx */
import React, { useState, useRef } from 'react';
import { X, Send, Bug, AlertCircle, ImagePlus, Trash2, ZoomIn } from 'lucide-react';
import { createBugReport } from '../services/reportService';
import { useToast } from '../hooks/useToast';
import CustomSelect from './CustomSelect';

const REPORT_CATEGORIES = [
    { value: 'bug', label: 'Error técnico / Bug' },
    { value: 'ui', label: 'Interfaz / Diseño' },
    { value: 'account', label: 'Problema de cuenta / Acceso' },
    { value: 'content', label: 'Error en datos (Alimentos/Ejercicios)' },
    { value: 'feature', label: 'Sugerencia / Mejora' },
    { value: 'other', label: 'Otros' }
];

const MAX_FILES = 3;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const BugReportModal = ({ onClose }) => {
    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [selectedImageForLightbox, setSelectedImageForLightbox] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const { addToast } = useToast();
    const fileInputRef = useRef(null);

    const handleFileSelect = async (e) => {
        setFormError('');
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length + selectedFiles.length > MAX_FILES) {
            addToast(`Máximo ${MAX_FILES} imágenes permitidas.`, 'warning');
            imageFiles.splice(MAX_FILES - selectedFiles.length);
        }

        const validFiles = [];
        const newPreviews = [];

        for (const file of imageFiles) {
            if (file.size > MAX_FILE_SIZE) {
                setFormError(`"${file.name}" supera los 5MB permitidos.`);
                continue;
            }
            validFiles.push(file);
            const preview = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
            newPreviews.push(preview);
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (indexToRemove) => {
        setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!category || !subject.trim() || !description.trim()) {
            setFormError('Por favor completa todos los campos obligatorios');
            return;
        }

        setIsSubmitting(true);
        try {
            await createBugReport(category, subject, description, selectedFiles);
            addToast('¡Gracias! Tu reporte ha sido enviado con éxito.', 'success');
            onClose();
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.error || error.message || 'Error al enviar el reporte';
            setFormError(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid = category && subject.trim().length > 0 && description.trim().length > 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">

            {/* --- Lightbox --- */}
            {selectedImageForLightbox && (
                <div
                    className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]"
                    onClick={() => setSelectedImageForLightbox(null)}
                >
                    <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full">
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImageForLightbox}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-[scale-in_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            <div className="bg-bg-primary rounded-2xl border border-glass-border max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh]">

                <div className="flex items-center justify-between p-5 border-b border-glass-border text-text-primary">
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

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="relative mb-6 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-accent opacity-10 pointer-events-none" />
                        <div className="relative p-4 flex gap-3 text-left">
                            <AlertCircle className="text-accent shrink-0" size={20} />
                            <p className="text-sm text-text-secondary leading-relaxed">
                                Describe el error con detalle. Se enviará información técnica de tu dispositivo automáticamente.
                            </p>
                        </div>
                    </div>

                    {formError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex items-center gap-2 animate-[fade-in_0.3s_ease-out]">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <form id="bug-form" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-secondary text-left">
                                Categoría <span className="text-accent">*</span>
                            </label>
                            <CustomSelect
                                value={category}
                                onChange={(val) => { setCategory(val); setFormError(''); }}
                                options={REPORT_CATEGORIES}
                                placeholder="Selecciona una categoría"
                                className="w-full"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-secondary text-left">
                                Asunto <span className="text-accent">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => { setSubject(e.target.value); setFormError(''); }}
                                placeholder="Ej: Error al guardar rutina"
                                className="w-full px-4 py-3 bg-bg-secondary border border-glass-border rounded-xl focus:ring-2 focus:ring-accent outline-none text-text-primary transition-all"
                                disabled={isSubmitting}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-text-secondary text-left">
                                Descripción detallada <span className="text-accent">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setFormError(''); }}
                                placeholder="Explica qué estabas haciendo cuando ocurrió el error..."
                                className="w-full px-4 py-3 bg-bg-secondary border border-glass-border rounded-xl focus:ring-2 focus:ring-accent outline-none h-32 resize-none text-text-primary custom-scrollbar transition-all"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div>
                            <label className="flex justify-between items-center text-sm font-medium mb-2 text-text-secondary">
                                <span>Capturas (Opcional - Máx 5MB)</span>
                                <span className={`text-xs ${selectedFiles.length >= MAX_FILES ? 'text-accent' : 'text-text-muted'}`}>
                                    {selectedFiles.length}/{MAX_FILES}
                                </span>
                            </label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={isSubmitting || selectedFiles.length >= MAX_FILES}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting || selectedFiles.length >= MAX_FILES}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg-secondary border border-glass-border border-dashed rounded-xl text-text-secondary hover:text-accent hover:border-accent transition-all disabled:opacity-50"
                            >
                                <ImagePlus size={20} />
                                <span className="font-medium">Añadir imágenes</span>
                            </button>

                            {imagePreviews.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {imagePreviews.map((src, index) => (
                                        <div key={index} className="relative group w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-glass-border cursor-zoom-in">
                                            <img
                                                src={src}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                onClick={() => setSelectedImageForLightbox(src)}
                                            />
                                            {/* Corregido: pointer-events-none para que el clic pase a la imagen, pointer-events-auto en el botón */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1 pointer-events-none">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                    className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors pointer-events-auto"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-glass-border bg-bg-secondary/30 rounded-b-2xl flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-text-secondary hover:bg-white/5 rounded-xl transition-colors" disabled={isSubmitting}>
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="bug-form"
                        disabled={isSubmitting || !isValid}
                        className="flex items-center gap-2 px-6 py-2.5 bg-accent text-bg-primary font-bold rounded-xl shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-bg-primary rounded-full animate-spin" />
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