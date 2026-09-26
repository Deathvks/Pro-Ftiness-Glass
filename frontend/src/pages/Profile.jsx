/* frontend/src/pages/Profile.jsx */
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ChevronLeft, ChevronRight, Save, User, Camera, AlertTriangle,
  Trophy, Flame, Dumbbell, Crown, Star, Eye, X, Shield, Zap, Diamond, Sparkles, Medal
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import Spinner from '../components/Spinner';
import {
  updateUserAccount,
  deleteMyData,
  deleteMyAccount,
} from '../services/userService';
import ProfileImageModal from '../components/ProfileImageModal';
import Cropper from 'react-easy-crop';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api')
  ? API_BASE_URL.slice(0, -4)
  : API_BASE_URL;

// --- Helper para extraer la imagen recortada ---
const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        file.name = 'cropped.jpg';
        resolve(new File([file], 'profile.jpg', { type: 'image/jpeg' }));
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.9);
  });
};

// --- Configuración de Insignias ---
const BADGE_DETAILS = {
  first_login: {
    name: 'Primer Paso',
    desc: 'Inicia sesión por primera vez',
    icon: User,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10'
  },
  first_workout: {
    name: 'Primer Sudor',
    desc: 'Completa tu primer entrenamiento',
    icon: Dumbbell,
    color: 'text-green-500',
    bg: 'bg-green-500/10'
  },
  streak_3: {
    name: 'En Llamas',
    desc: 'Racha de 3 días',
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10'
  },
  streak_7: {
    name: 'Imparable',
    desc: 'Racha de 7 días',
    icon: Flame,
    color: 'text-red',
    bg: 'bg-red/10'
  },
  streak_30: {
    name: 'Leyenda',
    desc: 'Racha de 30 días',
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10'
  },
  nutrition_master: {
    name: 'Chef',
    desc: 'Registra 5 comidas',
    icon: Star,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10'
  },
  milestone_10: { name: 'Plata (Lvl 10)', desc: 'Alcanza el nivel 10', icon: Medal, color: 'text-[#9CA3AF]', bg: 'bg-[#9CA3AF]/10' },
  milestone_20: { name: 'Oro (Lvl 20)', desc: 'Alcanza el nivel 20', icon: Trophy, color: 'text-[#FFD700]', bg: 'bg-[#FFD700]/10' },
  milestone_30: { name: 'Platino (Lvl 30)', desc: 'Alcanza el nivel 30', icon: Star, color: 'text-[#5F9EA0]', bg: 'bg-[#5F9EA0]/10' },
  milestone_40: { name: 'Diamante (Lvl 40)', desc: 'Alcanza el nivel 40', icon: Diamond, color: 'text-[#00FFFF]', bg: 'bg-[#00FFFF]/10' },
  milestone_50: { name: 'Maestro (Lvl 50)', desc: 'Alcanza el nivel 50', icon: Zap, color: 'text-[#9370DB]', bg: 'bg-[#9370DB]/10' },
  milestone_60: { name: 'Gran Maestro (Lvl 60)', desc: 'Alcanza el nivel 60', icon: Flame, color: 'text-[#FF69B4]', bg: 'bg-[#FF69B4]/10' },
  milestone_70: { name: 'Épico (Lvl 70)', desc: 'Alcanza el nivel 70', icon: Crown, color: 'text-[#FF4500]', bg: 'bg-[#FF4500]/10' },
  milestone_80: { name: 'Leyenda (Lvl 80)', desc: 'Alcanza el nivel 80', icon: Sparkles, color: 'text-[#FFD700]', bg: 'bg-orange-500/10' },
  milestone_90: { name: 'Mítico (Lvl 90)', desc: 'Alcanza el nivel 90', icon: Crown, color: 'text-[#00FFFF]', bg: 'bg-[#9370DB]/10' },
  milestone_100: { name: 'Inmortal (Lvl 100)', desc: 'Alcanza el nivel 100', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  default: {
    name: 'Insignia',
    desc: 'Logro desbloqueado',
    icon: Star,
    color: 'text-accent',
    bg: 'bg-accent/10'
  }
};

const Profile = ({ onCancel, setView, navigate }) => {
  const { userProfile, fetchInitialData, handleLogout, gamification } = useAppStore(
    (state) => ({
      userProfile: state.userProfile,
      fetchInitialData: state.fetchInitialData,
      handleLogout: state.handleLogout,
      gamification: state.gamification,
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

  // --- Estados para el Cropper ---
  const [tempImage, setTempImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // --- Estado para Paginación de Insignias Responsiva ---
  const [itemsPerPage, setItemsPerPage] = useState(() => window.innerWidth < 640 ? 1 : 3);
  const [badgePage, setBadgePage] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const newItems = window.innerWidth < 640 ? 1 : 3;
      setItemsPerPage(newItems);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setBadgePage(0);
  }, [itemsPerPage]);

  // Limpieza de memoria para ObjectURLs al desmontar
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      if (tempImage && tempImage.startsWith('blob:')) {
        URL.revokeObjectURL(tempImage);
      }
    };
  }, [imagePreview, tempImage]);

  const openImageModal = () => {
    if (imagePreview) {
      setIsImageModalOpen(true);
    }
  };

  const handleViewPublicProfile = () => {
    if (setView) {
      setView('publicProfile', { userId: userProfile.id });
    } else if (navigate) {
      navigate('publicProfile', { userId: userProfile.id });
    } else {
      console.warn("No se encontró función de navegación (setView o navigate)");
      addToast("Error de navegación", "error");
    }
  };

  const [formData, setFormData] = useState({
    username: userProfile.username || '',
    email: userProfile.email || '',
    currentPassword: '',
    newPassword: '',
  });

  const [modalAction, setModalAction] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  const hasPassword = userProfile?.hasPassword;

  const isDirty = formData.username !== (userProfile.username || '') ||
                  formData.email !== (userProfile.email || '') ||
                  formData.newPassword !== '' ||
                  profileImageFile !== null;

  const handleChange = (e) => {
    setErrors({});
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const isValidType = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

      if (!isValidType) {
        addToast('Formato de imagen no válido (solo JPG, PNG, WebP).', 'error');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        addToast('La imagen es demasiado grande (máx 5MB).', 'error');
        return;
      }

      // En lugar de guardarlo directo, abrimos el cropper
      setTempImage(URL.createObjectURL(file));
      setIsCropping(true);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedFile = await getCroppedImg(tempImage, croppedAreaPixels);
      setProfileImageFile(croppedFile);
      
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImagePreview(URL.createObjectURL(croppedFile));
      setIsCropping(false);
      setTempImage(null);
    } catch (e) {
      console.error(e);
      addToast('Error al procesar la imagen.', 'error');
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
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'El formato del email no es válido.';

    if (formData.newPassword) {
      if (hasPassword && !formData.currentPassword) {
        newErrors.currentPassword = 'La contraseña actual es requerida para cambiarla.';
      }
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres.';
      }
    }

    if (profileImageFile && profileImageFile.size > 5 * 1024 * 1024) {
      newErrors.image = 'La imagen no debe pesar más de 5MB.';
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
      if (hasPassword) {
        data.append('currentPassword', formData.currentPassword);
      }
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

      if (formData.newPassword) {
        addToast('Contraseña actualizada. Por favor, inicia sesión de nuevo.', 'success');
        handleLogout();
        return;
      }

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

  const handleModalClose = () => {
    setModalAction(null);
    setModalPassword('');
    setModalError('');
    setIsModalLoading(false);
  };

  const handleModalConfirm = async () => {
    if (hasPassword && !modalPassword) {
      setModalError('La contraseña es requerida.');
      return;
    }
    setIsModalLoading(true);
    setModalError('');

    try {
      if (modalAction === 'deleteData') {
        await deleteMyData(modalPassword);
        addToast('Todos tus datos han sido borrados.', 'success');
        await fetchInitialData();
        handleModalClose();
      } else if (modalAction === 'deleteAccount') {
        await deleteMyAccount(modalPassword);
        addToast('Tu cuenta ha sido borrada permanentemente.', 'success');
        handleModalClose();
        handleLogout();
      }
    } catch (error) {
      setModalError(error.message || 'Ha ocurrido un error.');
    } finally {
      setIsModalLoading(false);
    }
  };

  const getProcessedImageUrl = (url) => {
    if (!url) return null;
    if (typeof url === 'string' && url.startsWith('blob:')) return url;

    let finalUrl = url;
    if (typeof finalUrl === 'string' && !finalUrl.startsWith('http')) {
      const separator = finalUrl.startsWith('/') ? '' : '/';
      finalUrl = `${BACKEND_BASE_URL}${separator}${finalUrl}`;
    }

    const isLocalhost = typeof finalUrl === 'string' && (finalUrl.includes('localhost') || finalUrl.includes('127.0.0.1'));
    if (!isLocalhost && typeof finalUrl === 'string' && finalUrl.startsWith('http:')) {
      finalUrl = finalUrl.replace('http:', 'https:');
    }

    return finalUrl;
  };

  const baseInputClasses =
    'w-full bg-black/5 dark:bg-white/5 border border-transparent rounded-[20px] px-5 py-4 text-text-primary focus:border-accent/30 focus:ring-accent/20 focus:ring-4 outline-none transition-all font-bold placeholder:text-text-muted placeholder:font-medium';

  return (
    <>
      <Helmet>
        <title>{Editar Perfil:  - Pro Fitness Glass}</title>
      </Helmet>

      <div className="w-full max-w-2xl mx-auto px-4 pb-28 sm:p-6 lg:p-10 animate-[fade-in_0.3s_ease-out] mt-2 sm:mt-0">
        
        {/* Header - Avatar */}
        <div className="flex flex-col items-center mt-6 mb-8">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div
              className="relative w-28 h-28 rounded-full cursor-pointer group shadow-md bg-bg-secondary ring-1 ring-glass-border p-1"
              onClick={openImageModal}
            >
              {imagePreview ? (
                <img
                  src={getProcessedImageUrl(imagePreview)}
                  alt="Foto de perfil"
                  className="w-full h-full rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.onerror = null; }}
                />
              ) : (
                <div className="w-full h-full rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center">
                  <User size={48} className="text-text-muted" strokeWidth={1.5} />
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current.click();
                }}
                className="absolute bottom-0 right-0 p-2.5 bg-accent rounded-full text-accent-contrast shadow-lg shadow-accent/40 group-hover:scale-110 transition-transform"
              >
                <Camera size={18} strokeWidth={2.5} />
              </button>
            </div>
            <h1 className="text-2xl font-bold mt-4 text-text-primary">{userProfile.username || 'Usuario'}</h1>
            <p className="text-sm text-text-secondary">{userProfile.email}</p>
        </div>

        {/* Group 1: Datos Bsicos */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Datos Bsicos</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <span className="text-[15px] font-medium text-text-primary">Usuario</span>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu usuario" />
                </div>
                {errors.username && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.username}</p>}

                <div className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-medium text-text-primary">Email</span>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-1/2 min-w-[100px]" placeholder="Tu email" />
                </div>
                {errors.email && <p className="text-xs text-red font-bold px-4 pb-2 pt-1">{errors.email}</p>}
            </div>
        </div>

        {/* Group 2: Seguridad */}
        <div className="mb-6">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Seguridad</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                {hasPassword && (
                <div className="flex items-center justify-between p-4 border-b border-glass-border">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">Contrasea actual</span>
                    <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                )}
                <div className="flex items-center justify-between p-4">
                    <span className="text-[15px] font-medium text-text-primary whitespace-nowrap mr-2">{hasPassword ? "Nueva contrasea" : "Crear contrasea"}</span>
                    <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className="text-right bg-transparent outline-none text-text-secondary font-medium w-full min-w-0" placeholder="••••••" />
                </div>
                {(errors.currentPassword || errors.newPassword) && (
                    <div className="px-4 pb-3">
                        {errors.currentPassword && <p className="text-xs text-red font-bold">{errors.currentPassword}</p>}
                        {errors.newPassword && <p className="text-xs text-red font-bold">{errors.newPassword}</p>}
                    </div>
                )}
            </div>
        </div>

        {/* Action Button */}
        {isDirty && (
            <button
                onClick={(e) => handleSave(e)}
                disabled={isLoading}
                className="w-full bg-accent text-accent-contrast font-bold text-[15px] py-4 rounded-[20px] shadow-lg shadow-accent/20 mb-8 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? <Spinner size={20} color="white" /> : <><Save size={18} strokeWidth={2.5}/> Guardar Cambios</>}
            </button>
        )}

        {/* Group 3: Mi Perfil Social & Progreso */}
        <div className="mb-6">
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={handleViewPublicProfile} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-500/10 rounded-[10px] text-blue-500">
                            <Eye size={18} strokeWidth={2.5} />
                        </div>
                        <span className="text-[15px] font-medium text-text-primary">Ver mi perfil pblico</span>
                    </div>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>

        {/* Group 4: Badges */}
        <div className="mb-8">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 px-4">Mis Insignias</h2>
            {gamification?.unlockedBadges?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                    {gamification.unlockedBadges.slice(0, 6).map((badgeId) => {
                        const badge = BADGE_DETAILS[badgeId] || BADGE_DETAILS.default;
                        return (
                            <div key={badgeId} className="flex flex-col items-center p-3 rounded-[20px] bg-bg-secondary ring-1 ring-glass-border shadow-sm text-center">
                                <div className={w-10 h-10 rounded-[14px] flex items-center justify-center mb-2 \ \}>
                                    <badge.icon size={20} strokeWidth={2} />
                                </div>
                                <span className="text-[10px] font-bold text-text-primary leading-tight">{badge.name}</span>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-bg-secondary rounded-[24px] p-6 ring-1 ring-glass-border text-center">
                    <Trophy size={24} className="text-text-muted mx-auto mb-2" />
                    <p className="text-sm text-text-secondary">An no tienes insignias.</p>
                </div>
            )}
        </div>

        {/* Group 5: Danger Zone */}
        <div className="mb-10">
            <h2 className="text-xs font-bold text-red/60 uppercase tracking-wider mb-2 px-4">Zona de Peligro</h2>
            <div className="bg-bg-secondary rounded-[24px] shadow-sm ring-1 ring-glass-border overflow-hidden">
                <button type="button" onClick={() => setModalAction('deleteData')} className="w-full flex items-center justify-between p-4 border-b border-glass-border hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-orange-500">Borrar mi historial de datos</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
                <button type="button" onClick={() => setModalAction('deleteAccount')} className="w-full flex items-center justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors">
                    <span className="text-[15px] font-medium text-red">Borrar cuenta definitivamente</span>
                    <ChevronRight size={18} className="text-text-muted" />
                </button>
            </div>
        </div>

      </div>

      {isImageModalOpen && (
        <ProfileImageModal
          imageUrl={getProcessedImageUrl(imagePreview)}
          username={formData.username}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}

      {isCropping && tempImage && (
        <ImageCropModal
          imageSrc={tempImage}
          onComplete={handleCropComplete}
          onCancel={() => {
            setIsCropping(false);
            setTempImage(null);
          }}
        />
      )}

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
        hasPassword={hasPassword}
      />

      <AnimatePresence>
        {showUnsavedModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowUnsavedModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm"
            >
              <div className="bg-bg-secondary p-6 rounded-[28px] ring-1 ring-glass-border shadow-2xl flex flex-col gap-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-16 h-16 rounded-[20px] bg-accent/10 flex items-center justify-center text-accent ring-1 ring-accent/30">
                    <AlertTriangle size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Cambios sin guardar</h3>
                    <p className="text-sm text-text-secondary font-medium">
                      Tienes cambios pendientes. Quieres aplicarlos ahora o salir sin guardar?
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setShowUnsavedModal(false);
                      handleSave({ preventDefault: () => {} });
                    }}
                    className="w-full py-4 rounded-[16px] font-bold bg-accent text-accent-contrast hover:brightness-110 transition-all active:scale-95"
                  >
                    Guardar y salir
                  </button>
                  <button
                    onClick={() => {
                      setShowUnsavedModal(false);
                      onCancel();
                    }}
                    className="w-full py-4 rounded-[16px] font-bold bg-black/5 dark:bg-white/5 text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95"
                  >
                    Salir sin guardar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Componente: Modal de Recorte ---
const ImageCropModal = ({ imageSrc, onComplete, onCancel }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg-primary flex flex-col animate-[fade-in_0.2s_ease-out]">
      <div className="relative flex-1 bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="bg-bg-primary p-5 pb-8 flex justify-between items-center px-6 sm:px-10 border-t border-black/5 dark:border-white/10" style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}>
        <button type="button" onClick={onCancel} className="text-text-secondary font-bold px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-[16px] transition-colors active:scale-95">
          Cancelar
        </button>
        <button type="button" onClick={() => onComplete(croppedAreaPixels)} className="bg-accent text-accent-contrast font-bold px-8 py-3.5 rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20">
          Recortar
        </button>
      </div>
    </div>
  );
};

// --- Componente: Modal de Confirmación de Borrado ---
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
  hasPassword,
}) => {
  const [dragY, setDragY] = useState(0);
  const [touchStartY, setTouchStartY] = useState(null);

  if (!modalAction) return null;

  const isDeleteAccount = modalAction === "deleteAccount";
  const title = isDeleteAccount ? "Borrar Cuenta Definitivamente" : "Borrar Historial de Datos";

  const themeConfig = isDeleteAccount 
    ? {
        ring: "border-red-500/30",
        iconBg: "bg-red-500/10",
        iconRing: "ring-red-500/30",
        text: "text-red-500",
        buttonBg: "bg-red-600",
        shadow: "shadow-red-500/20"
      }
    : {
        ring: "border-orange-500/30",
        iconBg: "bg-orange-500/10",
        iconRing: "ring-orange-500/30",
        text: "text-orange-500",
        buttonBg: "bg-orange-500",
        shadow: "shadow-orange-500/20"
      };

  const message = isDeleteAccount
    ? "¿Estás ABSOLUTAMENTE seguro? Esta acción es irreversible. Tu cuenta y todos tus datos serán eliminados permanentemente."
    : "¿Estás seguro? Todos tus registros de entrenamientos, nutrición y progreso serán eliminados. Tu cuenta se conservará.";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end sm:justify-center items-center px-0 sm:px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity animate-[fade-in_0.2s_ease-out]" onClick={handleModalClose} />
      
      <div 
        className={`relative w-full max-w-md bg-bg-secondary sm:rounded-[24px] rounded-t-[32px] p-6 pb-[calc(max(env(safe-area-inset-bottom,0px),24px))] shadow-2xl sm:border border-t border-glass-border overflow-hidden flex flex-col animate-[scale-in_0.2s_ease-out] ${themeConfig.shadow}`}
        style={{ transform: "translateY(" + dragY + "px)", transition: touchStartY !== null ? "none" : "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)" }}
        onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
        onTouchMove={(e) => {
          if (touchStartY === null) return;
          const diff = e.touches[0].clientY - touchStartY;
          if (diff > 0) setDragY(diff);
        }}
        onTouchEnd={() => {
          if (dragY > 100) handleModalClose();
          setDragY(0);
          setTouchStartY(null);
        }}
      >
        <div className="w-12 h-1.5 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-6 sm:hidden shrink-0" />
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-5 ring-1 shadow-sm ${themeConfig.iconBg} ${themeConfig.text} ${themeConfig.iconRing}`}>
            <AlertTriangle size={40} strokeWidth={1.5} />
          </div>
          <h3 className={`text-2xl font-extrabold tracking-tight ${themeConfig.text}`}>{title}</h3>
          <p className="text-text-secondary font-medium text-sm mt-3 leading-relaxed px-2">
            {message}
          </p>
          {hasPassword && (
            <p className="text-sm font-bold text-text-primary mt-3">
              Escribe tu contraseña para confirmar.
            </p>
          )}
        </div>

        {hasPassword && (
          <div className="mb-6 px-2">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={modalPassword}
              onChange={(e) => {
                setModalPassword(e.target.value);
                setModalError("");
              }}
              className={baseInputClasses}
              autoFocus
            />
            {modalError && <p className="form-error-text text-center text-xs mt-3 font-bold">{modalError}</p>}
          </div>
        )}

        <div className="flex flex-col gap-3 px-2">
          <button
            onClick={handleModalConfirm}
            disabled={isModalLoading || (hasPassword && !modalPassword)}
            className={`w-full py-4 text-white font-bold rounded-[16px] hover:brightness-110 active:scale-95 transition-all shadow-lg ${themeConfig.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isModalLoading ? <Spinner size={20} color="#ffffff" /> : `Confirmar ${isDeleteAccount ? "Borrado" : "Limpieza"}`}
          </button>
          <button
            onClick={handleModalClose}
            disabled={isModalLoading}
            className="w-full py-4 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-text-primary font-bold rounded-[16px] active:scale-95 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;


