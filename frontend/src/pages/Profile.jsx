/* frontend/src/pages/Profile.jsx */
import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
// --- INICIO DE LA MODIFICACIÓN ---
import { ChevronLeft, Save, User, Camera, AlertTriangle } from 'lucide-react';
// --- FIN DE LA MODIFICACIÓN ---
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
// --- INICIO DE LA MODIFICACIÓN ---
import {
  updateUserAccount,
  deleteMyData,
  deleteMyAccount,
} from '../services/userService';
// --- FIN DE LA MODIFICACIÓN ---
import ProfileImageModal from '../components/ProfileImageModal';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

const Profile = ({ onCancel }) => {
  const { userProfile, fetchInitialData, handleLogout } = useAppStore(
    (state) => ({
      userProfile: state.userProfile,
      fetchInitialData: state.fetchInitialData,
      handleLogout: state.handleLogout, // Añadido
    }),
  );
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [profileImageFile, setProfileImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    userProfile.profile_image_url || null,
  );
  const fileInputRef = useRef(null);

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const openImageModal = () => {
    if (imagePreview) {
      setIsImageModalOpen(true);
    }
  };

  const [formData, setFormData] = useState({
    username: userProfile.username || '',
    email: userProfile.email || '',
    currentPassword: '',
    newPassword: '',
  });

  // --- INICIO DE LA MODIFICACIÓN: Estado del modal ---
  const [modalAction, setModalAction] = useState(null); // 'deleteData' | 'deleteAccount'
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState('');
  // --- FIN DE LA MODIFICACIÓN ---

  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        addToast('Formato de imagen no válido (solo JPG, PNG, WebP).', 'error');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        // 2MB
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
      newErrors.username =
        'El nombre de usuario debe tener entre 3 y 30 caracteres.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.username)) {
      newErrors.username = 'Solo letras, números, _, . y -';
    }

    if (!formData.email.trim()) newErrors.email = 'El email es requerido.';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'El formato del email no es válido.';

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword =
          'La contraseña actual es requerida para cambiarla.';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword =
          'La nueva contraseña debe tener al menos 6 caracteres.';
      }
    }

    if (profileImageFile && profileImageFile.size > 2 * 1024 * 1024) {
      newErrors.image = 'La imagen no debe pesar más de 2MB.';
    }
    if (
      profileImageFile &&
      !['image/jpeg', 'image/png', 'image/webp'].includes(profileImageFile.type)
    ) {
      newErrors.image = 'Solo imágenes JPG, PNG o WebP.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      addToast('Por favor, corrige los errores.', 'error');
      return;
    }
    setIsLoading(true);

    const data = new FormData();
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

    if (
      !profileImageFile &&
      formData.username === userProfile.username &&
      formData.email === userProfile.email &&
      !formData.newPassword
    ) {
      addToast('No se detectaron cambios.', 'info');
      setIsLoading(false);
      onCancel();
      return;
    }

    try {
      await updateUserAccount(data);
      addToast('Perfil actualizado.', 'success');
      await fetchInitialData();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setProfileImageFile(null);
    } catch (error) {
      const errorMessage = error.message || 'No se pudo actualizar el perfil.';
      if (errorMessage.toLowerCase().includes('nombre de usuario')) {
        setErrors({ username: errorMessage });
      } else if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: errorMessage });
      } else {
        setErrors({ api: errorMessage });
      }
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // --- INICIO DE LA MODIFICACIÓN: Handlers del Modal ---
  const handleModalClose = () => {
    setModalAction(null);
    setModalPassword('');
    setModalError('');
    setIsModalLoading(false);
  };

  const handleModalConfirm = async () => {
    if (!modalPassword) {
      setModalError('La contraseña es requerida.');
      return;
    }
    setIsModalLoading(true);
    setModalError('');

    try {
      if (modalAction === 'deleteData') {
        await deleteMyData(modalPassword);
        addToast('Todos tus datos han sido borrados.', 'success');
        await fetchInitialData(); // Recarga los datos (ahora vacíos)
        handleModalClose();
      } else if (modalAction === 'deleteAccount') {
        await deleteMyAccount(modalPassword);
        addToast('Tu cuenta ha sido borrada permanentemente.', 'success');
        handleModalClose();
        handleLogout(); // Desloguea al usuario
      }
    } catch (error) {
      setModalError(error.message || 'Ha ocurrido un error.');
    } finally {
      setIsModalLoading(false);
    }
  };
  // --- FIN DE LA MODIFICACIÓN ---

  const baseInputClasses =
    'w-full bg-bg-secondary border border-glass-border rounded-md px-4 py-3 text-text-primary focus:border-accent focus:ring-accent/50 focus:ring-2 outline-none transition';

  return (
    <>
      <Helmet>
        <title>{`Editar Perfil: ${
          formData.username || 'Usuario'
        } - Pro Fitness Glass`}</title>
        <meta
          name="description"
          content={`Edita tu foto de perfil, nombre de usuario (${
            formData.username || 'Usuario'
          }), email y contraseña en Pro Fitness Glass.`}
        />
      </Helmet>

      <div className="w-full max-w-4xl mx-auto px-4 pb-4 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] mt-6 sm:mt-0">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-text-secondary font-semibold hover:text-text-primary transition mb-4"
        >
          <ChevronLeft size={20} />
          Volver
        </button>
        <h1 className="hidden md:block text-4xl font-extrabold mb-8">
          Editar Perfil
        </h1>

        <GlassCard className="p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            {errors.api && (
              <p className="text-center text-red mb-4 -mt-2">{errors.api}</p>
            )}

            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <div
                className="relative w-32 h-32 rounded-full cursor-pointer"
                onClick={openImageModal}
                title="Ver imagen ampliada"
              >
                {imagePreview ? (
                  <img
                    src={
                      imagePreview.startsWith('blob:') ||
                      imagePreview.startsWith('http')
                        ? imagePreview
                        : `${BACKEND_BASE_URL}${imagePreview}`
                    }
                    alt={`Foto de perfil de ${formData.username || 'usuario'}`}
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
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                  className="absolute bottom-0 right-0 p-2 bg-accent rounded-full text-bg-secondary hover:scale-110 transition"
                  aria-label="Cambiar foto de perfil"
                >
                  <Camera size={20} />
                </button>
              </div>
              {errors.image && (
                <p className="form-error-text -mt-3">{errors.image}</p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold mb-4">Datos Básicos</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Nombre de usuario
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={formData.username}
                    onChange={handleChange}
                    className={baseInputClasses}
                    maxLength={30}
                  />
                  {errors.username && (
                    <p className="form-error-text mt-1">{errors.username}</p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={baseInputClasses}
                  />
                  {errors.email && (
                    <p className="form-error-text mt-1">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-glass-border">
              <h2 className="text-lg font-bold mb-4">Cambiar Contraseña</h2>
              <p className="text-sm text-text-secondary mb-4 -mt-3">
                Deja los campos en blanco si no quieres cambiar tu contraseña.
              </p>
              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Contraseña Actual
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={baseInputClasses}
                  />
                  {errors.currentPassword && (
                    <p className="form-error-text mt-1">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-text-secondary mb-2"
                  >
                    Nueva Contraseña
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={baseInputClasses}
                  />
                  {errors.newPassword && (
                    <p className="form-error-text mt-1">{errors.newPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-6 border-t border-glass-border">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 w-40 rounded-full bg-accent text-bg-secondary font-semibold transition hover:scale-105 disabled:opacity-70"
              >
                {isLoading ? (
                  <Spinner size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* --- INICIO DE LA MODIFICACIÓN: Zona de Peligro --- */}
        <GlassCard className="p-6 mt-8 border border-red-500/50">
          <h3 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Zona de Peligro
          </h3>
          {/* --- INICIO DE LA MODIFICACIÓN --- */}
          <div className="flex flex-col gap-4">
            {/* Borrar Datos */}
            <div className="flex-1">
              <p className="text-sm text-text-secondary mb-2">
                Borra todos tus datos (entrenamientos, nutrición, etc.) pero
                conserva tu cuenta de usuario.
              </p>
              <button
                type="button"
                onClick={() => setModalAction('deleteData')}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-accent text-bg-secondary font-semibold hover:opacity-90 transition"
              >
                Borrar Datos
              </button>
            </div>

            {/* Borrar Cuenta */}
            <div className="flex-1">
              <p className="text-sm text-text-secondary mb-2">
                Borra permanentemente tu cuenta y todos tus datos. Esta acción
                no se puede deshacer.
              </p>
              <button
                type="button"
                onClick={() => setModalAction('deleteAccount')}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-red-600/20 text-red-400 font-semibold border border-red-500/50 hover:bg-red-600/30 transition"
              >
                Borrar Cuenta
              </button>
            </div>
          </div>
          {/* --- FIN DE LA MODIFICACIÓN --- */}
        </GlassCard>
        {/* --- FIN DE LA MODIFICACIÓN --- */}
      </div>

      {/* --- INICIO DE LA MODIFICACIÓN: Componente de Modal --- */}
      <DeleteConfirmationModal
        modalAction={modalAction}
        isModalLoading={isModalLoading}
        modalPassword={modalPassword}
        setModalPassword={setModalPassword}
        modalError={modalError}
        setModalError={setModalError}
        handleModalClose={handleModalClose}
        handleModalConfirm={handleModalConfirm}
        baseInputClasses={baseInputClasses}
      />
      {/* --- FIN DE LA MODIFICACIÓN --- */}

      {isImageModalOpen && (
        <ProfileImageModal
          imageUrl={
            imagePreview?.startsWith('blob:') ||
            imagePreview?.startsWith('http')
              ? imagePreview
              : `${BACKEND_BASE_URL}${imagePreview}`
          }
          username={formData.username}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </>
  );
};

// --- INICIO DE LA MODIFICACIÓN: Componente de Modal (Definición) ---
/**
 * Modal de confirmación que solicita contraseña para acciones destructivas.
 */
const DeleteConfirmationModal = ({
  modalAction,
  isModalLoading,
  modalPassword,
  setModalPassword,
  modalError,
  setModalError,
  handleModalClose,
  handleModalConfirm,
  baseInputClasses,
}) => {
  if (!modalAction) return null;

  const isDeleteAccount = modalAction === 'deleteAccount';
  const title = isDeleteAccount ? 'Borrar Cuenta' : 'Borrar Datos';
  const message = isDeleteAccount
    ? '¿Estás ABSOLUTAMENTE seguro? Esta acción es irreversible. Tu cuenta y todos tus datos serán eliminados permanentemente. Escribe tu contraseña actual para confirmar.'
    : '¿Estás seguro? Todos tus registros de entrenamientos, nutrición y progreso serán eliminados. Tu cuenta se conservará. Escribe tu contraseña actual para confirmar.';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-[fade-in_0.2s_ease-out]">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <h3
          className={`text-2xl font-bold mb-4 ${
            isDeleteAccount ? 'text-red-500' : 'text-accent'
          }`}
        >
          {title}
        </h3>
        <p className="text-text-secondary mb-6">{message}</p>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-text-secondary mb-2"
          >
            Contraseña Actual
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={modalPassword}
            onChange={(e) => {
              setModalPassword(e.target.value);
              setModalError('');
            }}
            className={baseInputClasses}
            autoFocus
          />
          {modalError && <p className="form-error-text mt-1">{modalError}</p>}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8">
          <button
            onClick={handleModalClose}
            disabled={isModalLoading}
            className="px-4 py-2 rounded-md bg-bg-secondary font-medium text-text-primary border border-glass-border hover:bg-bg-tertiary transition w-full sm:w-auto"
          >
            Cancelar
          </button>
          <button
            onClick={handleModalConfirm}
            disabled={isModalLoading}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md font-semibold transition w-full sm:w-auto ${
              isDeleteAccount
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-accent text-bg-secondary hover:opacity-90'
            }`}
          >
            {isModalLoading ? (
              <Spinner size={18} />
            ) : (
              `Confirmar ${
                isDeleteAccount ? 'Borrado de Cuenta' : 'Borrado de Datos'
              }`
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
// --- FIN DE LA MODIFICACIÓN ---

export default Profile;