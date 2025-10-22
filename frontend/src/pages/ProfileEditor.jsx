import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { updateUserProfile } from '../services/userService';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';

const ProfileEditor = ({ onDone }) => {
    const { user, fetchInitialData } = useAppStore(state => ({
        user: state.user,
        fetchInitialData: state.fetchInitialData,
    }));
    const { addToast } = useToast();

    const [username, setUsername] = useState(user?.username || '');
    const [profileImage, setProfileImage] = useState(null);
    const [previewImage, setPreviewImage] = useState(user?.profileImageUrl || null);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const validateForm = () => {
        const newErrors = {};
        
        if (!username.trim()) {
            newErrors.username = 'El nombre de usuario es requerido.';
        } else if (username.length < 3 || username.length > 30) {
            newErrors.username = 'El nombre de usuario debe tener entre 3 y 30 caracteres.';
        } else if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
             // --- INICIO MODIFICACIÓN: Aclarar error ---
             newErrors.username = 'Solo letras, números, _, . y - (sin espacios).';
             // --- FIN MODIFICACIÓN ---
        }

        if (profileImage && profileImage.size > 2 * 1024 * 1024) { // 2MB
            newErrors.profileImage = 'La imagen no debe pesar más de 2MB.';
        }
        if (profileImage && !['image/jpeg', 'image/png', 'image/webp'].includes(profileImage.type)) {
            newErrors.profileImage = 'Solo se permiten imágenes JPG, PNG o WebP.';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({});
        setIsLoading(true);

        const formData = new FormData();
        // Solo añadir campos si han cambiado
        if (username !== user?.username) {
            formData.append('username', username);
        }
        if (profileImage) {
            formData.append('profileImage', profileImage);
        }

        // Si no hay cambios, simplemente cerramos
        if (!profileImage && username === user?.username) {
            setIsLoading(false);
            onDone();
            return;
        }

        try {
            const response = await updateUserProfile(formData);
            await fetchInitialData(); // Recargar datos del usuario
            addToast(response.message, 'success');
            onDone();
        } catch (err) {
            const errorMessage = err.message || 'Error al actualizar el perfil.';
            if (err.errors && Array.isArray(err.errors)) {
                 const apiErrors = {};
                 err.errors.forEach(error => {
                     if (error.param) {
                         apiErrors[error.param] = error.msg;
                     }
                 });
                 setErrors(apiErrors);
            } else if (errorMessage.toLowerCase().includes('nombre de usuario')) {
                 setErrors({ username: errorMessage });
            } else {
                 setErrors({ api: errorMessage });
            }
            addToast(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            setPreviewImage(URL.createObjectURL(file));
            setErrors(prev => ({ ...prev, profileImage: null })); // Limpiar error de imagen
        }
    };

    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary p-4 animate-[fade-in_0.5s_ease_out]">
            <div className="w-full max-w-sm text-center">
                <h1 className="text-4xl font-extrabold mb-8">Editar Perfil</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {errors.api && <p className="text-center text-red">{errors.api}</p>}

                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <img
                            src={previewImage || '/logo.png'} // Fallback a logo si no hay imagen
                            alt="Perfil"
                            className="w-32 h-32 rounded-full object-cover border-2 border-accent shadow-lg"
                        />
                        <button
                            type="button"
                            onClick={handleImageClick}
                            className="absolute bottom-0 right-0 bg-accent text-bg-secondary p-2 rounded-full transition hover:scale-110"
                            aria-label="Cambiar imagen de perfil"
                        >
                            <Camera size={20} />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                        />
                    </div>
                    {errors.profileImage && <p className="form-error-text -mt-3">{errors.profileImage}</p>}


                    <div>
                        <input
                            type="text"
                            placeholder="Nombre de usuario"
                            className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            maxLength={30}
                        />
                        {errors.username && <p className="form-error-text text-left">{errors.username}</p>}
                    </div>
                    
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition disabled:opacity-50"
                            value={user?.email || ''}
                            disabled
                        />
                        <p className="text-xs text-text-muted text-left mt-1">El email no se puede cambiar.</p>
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onDone}
                            disabled={isLoading}
                            className="flex-1 rounded-md bg-bg-secondary border border-glass-border text-text-primary font-semibold py-3 transition hover:bg-glass-border disabled:opacity-70"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center rounded-md bg-accent text-bg-secondary font-semibold py-3 transition hover:scale-105 hover:shadow-lg hover:shadow-accent/20 disabled:opacity-70"
                        >
                            {isLoading ? <Spinner /> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileEditor;