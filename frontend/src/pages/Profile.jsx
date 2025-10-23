/* frontend/src/pages/Profile.jsx */
import React, { useState, useRef } from 'react';
import { ChevronLeft, Save, User, Camera } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import { updateUserAccount } from '../services/userService';
// --- INICIO DE LA MODIFICACIÓN ---
import ProfileImageModal from '../components/ProfileImageModal'; // Importar el modal
// --- FIN DE LA MODIFICACIÓN ---

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

const Profile = ({ onCancel }) => {
    const { userProfile, fetchInitialData } = useAppStore(state => ({
        userProfile: state.userProfile,
        fetchInitialData: state.fetchInitialData,
    }));
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [profileImageFile, setProfileImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(userProfile.profile_image_url || null);
    const fileInputRef = useRef(null);

    // --- INICIO DE LA MODIFICACIÓN ---
    // Estado para controlar el modal de imagen ampliada
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // Función para abrir el modal
    const openImageModal = () => {
        if (imagePreview) {
            setIsImageModalOpen(true);
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    const [formData, setFormData] = useState({
        username: userProfile.username || '',
        email: userProfile.email || '',
        currentPassword: '',
        newPassword: '',
    });

    const handleChange = (e) => {
        setErrors({});
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tamaño y tipo antes de mostrar previsualización
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                addToast('Formato de imagen no válido (solo JPG, PNG, WebP).', 'error');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB
                addToast('La imagen no debe pesar más de 2MB.', 'error');
                return;
            }
            setProfileImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.username.trim()) {
             newErrors.username = 'El nombre de usuario es requerido.';
        } else if (formData.username.length < 3 || formData.username.length > 30) {
            newErrors.username = 'El nombre de usuario debe tener entre 3 y 30 caracteres.';
        } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
             newErrors.username = 'Solo letras, números, _, . y -';
        }

        if (!formData.email.trim()) newErrors.email = 'El email es requerido.';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'El formato del email no es válido.';

        if (formData.newPassword) {
            if (!formData.currentPassword) {
                newErrors.currentPassword = 'La contraseña actual es requerida para cambiarla.';
            }
            if (formData.newPassword.length < 6) {
                newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
            }
        }

        // Validación de la imagen (aunque ya se hizo en handleImageChange, por si acaso)
        if (profileImageFile && profileImageFile.size > 2 * 1024 * 1024) {
            newErrors.image = 'La imagen no debe pesar más de 2MB.';
        }
        if (profileImageFile && !['image/jpeg', 'image/png', 'image/webp'].includes(profileImageFile.type)) {
             newErrors.image = 'Solo imágenes JPG, PNG o WebP.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validate()) {
            addToast("Por favor, corrige los errores.", 'error');
            return;
        }
        setIsLoading(true);

        const data = new FormData();
        // Solo añadir si ha cambiado
        if (formData.username !== userProfile.username) {
            data.append('username', formData.username);
        }
        if (formData.email !== userProfile.email) {
            data.append('email', formData.email);
        }

        if (formData.newPassword) {
            data.append('currentPassword', formData.currentPassword);
            data.append('newPassword', formData.newPassword);
        }

        if (profileImageFile) {
            data.append('profileImage', profileImageFile);
        }

        // Si no hay cambios ni nueva imagen, no enviar nada
        if (!profileImageFile &&
            formData.username === userProfile.username &&
            formData.email === userProfile.email &&
            !formData.newPassword) {
            addToast("No se detectaron cambios.", "info");
            setIsLoading(false);
            onCancel(); // O simplemente no hacer nada y quedarse
            return;
        }


        try {
            await updateUserAccount(data);
            addToast('Perfil actualizado.', 'success');
            await fetchInitialData();
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Limpiar input file
            }
            setProfileImageFile(null); // Limpiar archivo en estado
            // No llamar a onCancel aquí, fetchInitialData actualizará userProfile y la imagen
        } catch (error) {
             const errorMessage = error.message || 'No se pudo actualizar el perfil.';
             if (errorMessage.toLowerCase().includes('nombre de usuario')) {
                 setErrors({ username: errorMessage });
             } else if (errorMessage.toLowerCase().includes('email')) {
                 setErrors({ email: errorMessage });
             } else {
                 setErrors({ api: errorMessage }); // Error genérico
             }
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <> {/* Fragmento para incluir el modal */}
            <div className="w-full max-w-4xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] mt-6 sm:mt-0">
                <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
                    <ChevronLeft size={20} />
                    Volver
                </button>
                <h1 className="hidden md:block text-4xl font-extrabold mb-8">Editar Perfil</h1>

                <GlassCard className="p-6">
                    <form onSubmit={handleSave} className="flex flex-col gap-6">

                        {errors.api && <p className="text-center text-red mb-4 -mt-2">{errors.api}</p>}

                        <div className="flex flex-col items-center gap-4">
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/png, image/jpeg, image/webp"
                                className="hidden"
                            />
                             {/* --- INICIO DE LA MODIFICACIÓN --- */}
                             {/* Añadir onClick para abrir el modal */}
                            <div className="relative w-32 h-32 rounded-full cursor-pointer" onClick={openImageModal} title="Ver imagen ampliada">
                            {/* --- FIN DE LA MODIFICACIÓN --- */}
                                {imagePreview ? (
                                    <img
                                        src={imagePreview.startsWith('blob:') || imagePreview.startsWith('http') ? imagePreview : `${BACKEND_BASE_URL}${imagePreview}`}
                                        alt="Perfil"
                                        className="w-32 h-32 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-bg-secondary flex items-center justify-center border border-glass-border">
                                        <User size={64} className="text-text-muted" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation(); // Evita abrir el modal al hacer clic en el botón de cámara
                                        fileInputRef.current.click();
                                    }}
                                    className="absolute bottom-0 right-0 p-2 bg-accent rounded-full text-bg-secondary hover:scale-110 transition"
                                    aria-label="Cambiar foto de perfil"
                                >
                                    <Camera size={20} />
                                </button>
                            </div>
                             {/* --- INICIO DE LA MODIFICACIÓN --- */}
                             {/* Mostrar error de imagen aquí */}
                             {errors.image && <p className="form-error-text -mt-3">{errors.image}</p>}
                             {/* --- FIN DE LA MODIFICACIÓN --- */}
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-4">Datos Básicos</h3>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">Nombre de usuario</label>
                                    <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} className={baseInputClasses} maxLength={30} />
                                    {errors.username && <p className="form-error-text mt-1">{errors.username}</p>}
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={baseInputClasses} />
                                    {errors.email && <p className="form-error-text mt-1">{errors.email}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-glass-border">
                            <h3 className="text-lg font-bold mb-4">Cambiar Contraseña</h3>
                            <p className="text-sm text-text-secondary mb-4 -mt-3">Deja los campos en blanco si no quieres cambiar tu contraseña.</p>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-text-secondary mb-2">Contraseña Actual</label>
                                    <input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleChange} className={baseInputClasses} />
                                    {errors.currentPassword && <p className="form-error-text mt-1">{errors.currentPassword}</p>}
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-text-secondary mb-2">Nueva Contraseña</label>
                                    <input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleChange} className={baseInputClasses} />
                                    {errors.newPassword && <p className="form-error-text mt-1">{errors.newPassword}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center pt-6 border-t border-glass-border">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 px-6 py-3 w-40 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
                            >
                                {isLoading ? <Spinner size={18} /> : <><Save size={18} /><span>Guardar</span></>}
                            </button>
                        </div>
                    </form>
                </GlassCard>
            </div>

            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            {/* Renderizar el modal si está abierto */}
            {isImageModalOpen && (
                <ProfileImageModal
                    imageUrl={imagePreview?.startsWith('blob:') || imagePreview?.startsWith('http') ? imagePreview : `${BACKEND_BASE_URL}${imagePreview}`}
                    username={formData.username}
                    onClose={() => setIsImageModalOpen(false)}
                />
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}
        </>
    );
};

export default Profile;