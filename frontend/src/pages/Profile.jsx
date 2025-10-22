import React, { useState, useRef } from 'react';
// --- INICIO DE LA MODIFICACIÓN ---
import { ChevronLeft, Save, User, Camera } from 'lucide-react';
// --- FIN DE LA MODIFICACIÓN ---
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import { updateUserAccount } from '../services/userService';

// --- INICIO DE LA MODIFICACIÓN ---
// Obtenemos la URL base del backend desde las variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Eliminamos '/api' del final si existe para obtener solo la base del backend
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// Renombrado de AccountEditor a Profile
const Profile = ({ onCancel }) => {
    const { userProfile, fetchInitialData } = useAppStore(state => ({
// --- FIN DE LA MODIFICACIÓN ---
        userProfile: state.userProfile,
        fetchInitialData: state.fetchInitialData,
    }));
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    // States para la imagen
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(userProfile.profile_image_url || null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: userProfile.name || '',
        username: userProfile.username || '', // Añadido nombre de usuario
        email: userProfile.email || '',
        currentPassword: '',
        newPassword: '',
    });
    // --- FIN DE LA MODIFICACIÓN ---

    const handleChange = (e) => {
        setErrors({});
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- INICIO DE LA MODIFICACIÓN ---
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImageFile(file);
            // Generar previsualización
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'El nombre completo es requerido.';
        // Añadida validación para username
        if (!formData.username.trim()) newErrors.username = 'El nombre de usuario es requerido.';
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

        // Usamos FormData para enviar la imagen y los datos
        const data = new FormData();
        data.append('name', formData.name);
        data.append('username', formData.username);
        data.append('email', formData.email);

        if (formData.newPassword) {
            data.append('currentPassword', formData.currentPassword);
            data.append('newPassword', formData.newPassword);
        }

        if (profileImageFile) {
            data.append('profileImage', profileImageFile);
        }

        try {
            // updateUserAccount debe ser adaptado para FormData
            await updateUserAccount(data); 
            addToast('Perfil actualizado.', 'success');
            await fetchInitialData();
            // --- INICIO DE LA MODIFICACIÓN ---
            // Limpiamos el input de la imagen para evitar problemas de caché si se cancela y vuelve a entrar
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setProfileImageFile(null);
            // --- FIN DE LA MODIFICACIÓN ---
            onCancel();
        } catch (error) {
            addToast(error.message || 'No se pudo actualizar el perfil.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    // --- FIN DE LA MODIFICACIÓN ---

    const baseInputClasses = "w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition";

    return (
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out]">
            {/* --- INICIO DE LA MODIFICACIÓN --- */}
            <button onClick={onCancel} className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4">
                <ChevronLeft size={20} />
                Volver
            </button>
            <h1 className="text-4xl font-extrabold mb-8">Editar Perfil</h1>
            {/* --- FIN DE LA MODIFICACIÓN --- */}

            <GlassCard className="p-6">
                <form onSubmit={handleSave} className="flex flex-col gap-6">

                    {/* --- INICIO DE LA MODIFICACIÓN: Sección de Foto de Perfil --- */}
                    <div className="flex flex-col items-center gap-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/png, image/jpeg"
                            className="hidden"
                        />
                        <div className="relative w-32 h-32 rounded-full">
                            {imagePreview ? (
                                // --- INICIO DE LA MODIFICACIÓN ---
                                // Comprobamos si la URL es relativa (de la DB) o un blob (preview)
                                <img 
                                    src={imagePreview.startsWith('blob:') || imagePreview.startsWith('http') ? imagePreview : `${BACKEND_BASE_URL}${imagePreview}`} 
                                    alt="Perfil" 
                                    className="w-32 h-32 rounded-full object-cover" 
                                />
                                // --- FIN DE LA MODIFICACIÓN ---
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-bg-secondary flex items-center justify-center border border-glass-border">
                                    <User size={64} className="text-text-muted" />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="absolute bottom-0 right-0 p-2 bg-accent rounded-full text-bg-secondary hover:scale-110 transition"
                                aria-label="Cambiar foto de perfil"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>
                    {/* --- FIN DE LA MODIFICACIÓN --- */}


                    {/* Datos Básicos */}
                    <div>
                        <h3 className="text-lg font-bold mb-4">Datos Básicos</h3>
                        <div className="flex flex-col gap-4">
                            {/* --- INICIO DE LA MODIFICACIÓN --- */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-2">Nombre Completo</label>
                                <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} className={baseInputClasses} />
                                {errors.name && <p className="form-error-text mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-text-secondary mb-2">Nombre de usuario</label>
                                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} className={baseInputClasses} />
                                {errors.username && <p className="form-error-text mt-1">{errors.username}</p>}
                            </div>
                            {/* --- FIN DE LA MODIFICACIÓN --- */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-2">Email</label>
                                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className={baseInputClasses} />
                                {errors.email && <p className="form-error-text mt-1">{errors.email}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Cambiar Contraseña */}
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

                    {/* Botón Guardar */}
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
    );
};

export default Profile;