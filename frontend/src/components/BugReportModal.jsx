/* frontend/src/components/BugReportModal.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bug, AlertCircle, ImagePlus } from 'lucide-react';
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
const STORAGE_KEY = 'bug_report_draft';

// --- IndexedDB Helpers para manejar ficheros grandes ---
const DB_NAME = 'PFGBugReportDB';
const STORE_NAME = 'drafts';
const DRAFT_KEY = 'current_draft';

const getDB = () => new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const saveDraftDB = async (data) => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, DRAFT_KEY);
    } catch (err) {
        console.error('Error saving draft:', err);
    }
};

const getDraftDB = async () => {
    try {
        const db = await getDB();
        return new Promise((resolve) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
    } catch (err) {
        console.error('Error loading draft:', err);
        return null;
    }
};

const clearDraftDB = async () => {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
    } catch (err) {
        console.error('Error clearing draft:', err);
    }
};

// Exportamos esta función por si el componente padre necesita verificar explícitamente
export const hasBugReportDraft = async () => {
    try {
        const draft = await getDraftDB();
        if (!draft) return false;
        return !!(
            draft.category ||
            (draft.subject && draft.subject.trim()) ||
            (draft.description && draft.description.trim()) ||
            (draft.files && draft.files.length > 0)
        );
    } catch (e) {
        return false;
    }
};

const BugReportModal = ({ onClose }) => {
    const [category, setCategory] = useState('');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [attachments, setAttachments] = useState([]); // { file, preview }
    const [selectedImageForLightbox, setSelectedImageForLightbox] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [isLoadingDraft, setIsLoadingDraft] = useState(true);

    const { addToast } = useToast();
    const fileInputRef = useRef(null);

    // Cargar borrador al montar
    useEffect(() => {
        const load = async () => {
            const draft = await getDraftDB();
            if (draft) {
                setCategory(draft.category || '');
                setSubject(draft.subject || '');
                setDescription(draft.description || '');

                if (draft.files && Array.isArray(draft.files)) {
                    // Reconstruir previews desde los objetos File guardados
                    const loadedAttachments = draft.files.map(file => ({
                        file,
                        preview: URL.createObjectURL(file)
                    }));
                    setAttachments(loadedAttachments);
                }
            }
            setIsLoadingDraft(false);
        };
        load();
    }, []);

    // Guardar borrador al cambiar datos
    useEffect(() => {
        if (isLoadingDraft) return;

        const filesToSave = attachments.map(a => a.file);
        const data = {
            category,
            subject,
            description,
            files: filesToSave // IndexedDB permite guardar File objects directamente
        };

        // 1. Guardar datos completos en IndexedDB
        saveDraftDB(data);

        // 2. Guardar "flag" en localStorage para que el padre sepa que hay contenido y abra el modal al recargar
        const hasContent = category || subject.trim() || description.trim() || attachments.length > 0;

        if (hasContent) {
            // Guardamos un objeto simple, el contenido real está en DB
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                hasContent: true,
                timestamp: Date.now(),
                note: 'Full content stored in IndexedDB'
            }));
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }

    }, [category, subject, description, attachments, isLoadingDraft]);

    // Limpiar URLs de objetos al desmontar
    useEffect(() => {
        return () => {
            attachments.forEach(a => URL.revokeObjectURL(a.preview));
        };
    }, [attachments]);

    const handleClose = async () => {
        // Al cerrar manualmente, limpiamos todo
        await clearDraftDB();
        localStorage.removeItem(STORAGE_KEY);
        onClose();
    };

    const handleFileSelect = (e) => {
        setFormError('');
        const files = Array.from(e.target.files);
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length + attachments.length > MAX_FILES) {
            addToast(`Máximo ${MAX_FILES} imágenes permitidas.`, 'warning');
            imageFiles.splice(MAX_FILES - attachments.length);
        }

        const newAttachments = [];
        for (const file of imageFiles) {
            if (file.size > MAX_FILE_SIZE) {
                setFormError(`"${file.name}" supera los 5MB permitidos.`);
                continue;
            }
            newAttachments.push({
                file,
                preview: URL.createObjectURL(file)
            });
        }

        if (newAttachments.length > 0) {
            setAttachments(prev => [...prev, ...newAttachments]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (indexToRemove) => {
        setAttachments(prev => {
            const newAtts = [...prev];
            URL.revokeObjectURL(newAtts[indexToRemove].preview);
            newAtts.splice(indexToRemove, 1);
            return newAtts;
        });
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
            const filesToSend = attachments.map(a => a.file);
            await createBugReport(category, subject, description, filesToSend);
            addToast('¡Gracias! Tu reporte ha sido enviado con éxito.', 'success');

            // Limpieza completa al enviar
            await clearDraftDB();
            localStorage.removeItem(STORAGE_KEY);
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-[100] animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]">

            {selectedImageForLightbox && (
                <div
                    className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out] !pt-[calc(1rem+env(safe-area-inset-top,24px))] !pb-[calc(1rem+env(safe-area-inset-bottom,24px))]"
                    onClick={() => setSelectedImageForLightbox(null)}
                >
                    <button className="absolute top-6 right-6 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95">
                        <X size={24} strokeWidth={2.5} />
                    </button>
                    <img
                        src={selectedImageForLightbox}
                        className="max-w-full max-h-[90vh] object-contain rounded-[24px] shadow-2xl animate-[scale-in_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                        alt="Vista previa completa"
                    />
                </div>
            )}

            <div className="bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 max-w-lg w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-[slide-up_0.3s_ease-out]">

                <div className="flex items-center justify-between p-6 sm:p-8 pb-5 border-b border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5">
                    <div className="flex items-center gap-4 text-text-primary">
                        <div className="p-3 bg-red/10 rounded-[16px] ring-1 ring-red/30 shadow-sm shrink-0">
                            <Bug className="text-red" size={24} strokeWidth={2} />
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight">Reportar un problema</h2>
                    </div>
                    <button 
                        onClick={handleClose} 
                        className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-text-secondary hover:text-text-primary active:scale-95"
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                    <div className="mb-6 p-4 rounded-[20px] bg-accent/10 ring-1 ring-accent/30 flex gap-3 text-left shadow-sm">
                        <AlertCircle className="text-accent shrink-0 mt-0.5" size={20} />
                        <p className="text-sm font-medium text-text-primary leading-relaxed">
                            Describe el error con detalle. Se enviará información técnica de tu dispositivo automáticamente para ayudarnos a resolverlo.
                        </p>
                    </div>

                    {formError && (
                        <div className="mb-6 p-4 rounded-[20px] bg-red/10 ring-1 ring-red/30 text-red text-sm font-bold flex items-center gap-3 animate-[fade-in_0.3s_ease-out] shadow-sm">
                            <AlertCircle size={20} className="shrink-0" strokeWidth={2.5} />
                            <span>{formError}</span>
                        </div>
                    )}

                    <form id="bug-form" onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-[11px] sm:text-xs font-bold mb-2 text-text-secondary text-left uppercase tracking-wider">
                                Categoría <span className="text-accent">*</span>
                            </label>
                            <CustomSelect
                                value={category}
                                onChange={(val) => { setCategory(val); setFormError(''); }}
                                options={REPORT_CATEGORIES}
                                placeholder="Selecciona una categoría"
                                className="w-full font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] sm:text-xs font-bold mb-2 text-text-secondary text-left uppercase tracking-wider">
                                Asunto <span className="text-accent">*</span>
                            </label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => { setSubject(e.target.value); setFormError(''); }}
                                placeholder="Ej: Error al guardar rutina..."
                                className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:ring-2 focus:ring-accent/50 outline-none text-text-primary transition-all font-bold placeholder:text-text-muted placeholder:font-medium shadow-inner"
                                disabled={isSubmitting}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] sm:text-xs font-bold mb-2 text-text-secondary text-left uppercase tracking-wider">
                                Descripción detallada <span className="text-accent">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setFormError(''); }}
                                placeholder="Explica qué estabas haciendo cuando ocurrió el error paso a paso..."
                                className="w-full px-5 py-4 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] focus:ring-2 focus:ring-accent/50 outline-none h-32 resize-none text-text-primary custom-scrollbar transition-all font-medium placeholder:text-text-muted shadow-inner"
                                disabled={isSubmitting}
                                required
                            />
                        </div>

                        <div>
                            <label className="flex justify-between items-center text-[11px] sm:text-xs font-bold mb-3 text-text-secondary uppercase tracking-wider">
                                <span>Capturas (Opcional - Máx 5MB)</span>
                                <span className={`text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-md ${attachments.length >= MAX_FILES ? 'bg-red/10 text-red ring-1 ring-red/30' : 'bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10'}`}>
                                    {attachments.length}/{MAX_FILES}
                                </span>
                            </label>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                                disabled={isSubmitting || attachments.length >= MAX_FILES}
                            />

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSubmitting || attachments.length >= MAX_FILES}
                                className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-black/5 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/20 rounded-[20px] text-text-secondary font-bold hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                <ImagePlus size={20} strokeWidth={2.5} />
                                <span>Añadir imágenes</span>
                            </button>

                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {attachments.map((item, index) => (
                                        <div key={index} className="relative group w-20 h-20 shrink-0 rounded-[16px] overflow-hidden ring-1 ring-black/5 dark:ring-white/10 cursor-zoom-in bg-bg-primary shadow-sm">
                                            <img
                                                src={item.preview}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                onClick={() => setSelectedImageForLightbox(item.preview)}
                                                alt={`Adjunto ${index + 1}`}
                                            />
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-end p-1.5 pointer-events-none">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                    className="bg-red text-white p-1.5 rounded-full hover:scale-110 transition-transform pointer-events-auto shadow-md"
                                                    title="Eliminar imagen"
                                                >
                                                    <X size={14} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-6 sm:p-8 pt-5 border-t border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                    <button 
                        type="button" 
                        onClick={handleClose} 
                        className="px-6 py-3.5 text-text-secondary font-bold hover:bg-black/10 dark:hover:bg-white/10 rounded-[16px] transition-colors active:scale-95" 
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="bug-form"
                        disabled={isSubmitting || !isValid}
                        className="flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white font-bold rounded-[20px] shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition-all"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={20} strokeWidth={2.5} />
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