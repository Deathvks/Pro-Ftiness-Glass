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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">

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
                        alt="Vista previa completa"
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
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
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
                                <span className={`text-xs ${attachments.length >= MAX_FILES ? 'text-accent' : 'text-text-muted'}`}>
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
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-bg-secondary border border-glass-border border-dashed rounded-xl text-text-secondary hover:text-accent hover:border-accent transition-all disabled:opacity-50"
                            >
                                <ImagePlus size={20} />
                                <span className="font-medium">Añadir imágenes</span>
                            </button>

                            {attachments.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-4">
                                    {attachments.map((item, index) => (
                                        <div key={index} className="relative group w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-glass-border cursor-zoom-in">
                                            <img
                                                src={item.preview}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                onClick={() => setSelectedImageForLightbox(item.preview)}
                                                alt={`Adjunto ${index + 1}`}
                                            />
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
                    <button type="button" onClick={handleClose} className="px-5 py-2.5 text-text-secondary hover:bg-white/5 rounded-xl transition-colors" disabled={isSubmitting}>
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