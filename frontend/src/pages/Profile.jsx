/* frontend/src/pages/Profile.jsx */
import React, { useState, useRef, useEffect } from 'react';
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

  const hasPassword = userProfile?.hasPassword;

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
        <title>{`Editar Perfil: ${formData.username || 'Usuario'} - Pro Fitness Glass`}</title>
      </Helmet>

      <div className="w-full max-w-4xl mx-auto px-4 pb-28 sm:p-6 lg:p-10 animate-[fade-in_0.5s_ease-out] mt-6 sm:mt-0">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2.5 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 ring-1 ring-black/5 dark:ring-white/10 rounded-full text-text-secondary font-bold hover:text-text-primary transition-colors mb-6 w-fit active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
          Volver
        </button>

        <h1 className="hidden md:block w-fit text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
          Editar Perfil
        </h1>

        <GlassCard className="glass p-6 sm:p-10 rounded-[32px] shadow-xl border-none ring-1 ring-black/5 dark:ring-white/10 mb-8 transition-all duration-300">
          <form onSubmit={handleSave} className="flex flex-col gap-6 sm:gap-8" noValidate>
            {errors.api && (
              <p className="text-center text-red font-bold mb-4 -mt-2">{errors.api}</p>
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
                className="relative w-36 h-36 rounded-[40px] cursor-pointer group hover:scale-105 transition-transform duration-300 shadow-xl bg-bg-primary ring-1 ring-black/5 dark:ring-white/10 p-1"
                onClick={openImageModal}
                title="Ver imagen ampliada"
              >
                {imagePreview ? (
                  <img
                    src={getProcessedImageUrl(imagePreview)}
                    alt={`Foto de perfil de ${formData.username || 'usuario'}`}
                    className="w-full h-full rounded-[36px] object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.target.onerror = null; }}
                  />
                ) : (
                  <div className="w-full h-full rounded-[36px] bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    <User size={64} className="text-text-muted opacity-50" strokeWidth={1.5} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current.click();
                  }}
                  className="absolute -bottom-2 -right-2 p-3 bg-accent rounded-[16px] text-white shadow-lg shadow-accent/40 group-hover:scale-110 transition-transform duration-300"
                  aria-label="Cambiar foto de perfil"
                >
                  <Camera size={20} strokeWidth={2.5} />
                </button>
              </div>
              {errors.image && (
                <p className="form-error-text -mt-2 font-bold">{errors.image}</p>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-extrabold mb-6 flex items-center gap-3 text-text-primary tracking-tight">
                <div className="p-2.5 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm shrink-0">
                  <User size={24} strokeWidth={2.5} />
                </div>
                Datos Básicos
              </h2>
              <div className="flex flex-col gap-5">
                <div>
                  <label htmlFor="username" className="block text-[11px] sm:text-xs font-bold text-text-secondary mb-2 px-1 uppercase tracking-wider">
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
                    placeholder="Escribe tu nombre de usuario"
                  />
                  {errors.username && (
                    <p className="form-error-text mt-2 font-bold px-2">{errors.username}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-[11px] sm:text-xs font-bold text-text-secondary mb-2 px-1 uppercase tracking-wider">
                    Correo Electrónico
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={baseInputClasses}
                    placeholder="Escribe tu email"
                  />
                  {errors.email && (
                    <p className="form-error-text mt-2 font-bold px-2">{errors.email}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-black/5 dark:border-white/10">
              <h2 className="text-2xl font-extrabold mb-3 flex items-center gap-3 text-text-primary tracking-tight">
                <div className="p-2.5 bg-accent/10 text-accent rounded-[16px] ring-1 ring-accent/30 shadow-sm shrink-0">
                  <Shield size={24} strokeWidth={2.5} />
                </div>
                {hasPassword ? 'Seguridad y Contraseña' : 'Establecer Contraseña'}
              </h2>
              <p className="text-sm font-medium text-text-secondary mb-6 leading-relaxed px-1">
                {hasPassword
                  ? 'Si dejas estos campos en blanco tu contraseña no cambiará.'
                  : 'Añade una contraseña para poder iniciar sesión directamente con tu correo electrónico.'}
              </p>
              <div className="flex flex-col gap-5">
                {hasPassword && (
                  <div>
                    <label htmlFor="currentPassword" className="block text-[11px] sm:text-xs font-bold text-text-secondary mb-2 px-1 uppercase tracking-wider">
                      Contraseña Actual
                    </label>
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={baseInputClasses}
                      placeholder="Ingresa tu contraseña actual"
                    />
                    {errors.currentPassword && (
                      <p className="form-error-text mt-2 font-bold px-2">
                        {errors.currentPassword}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <label htmlFor="newPassword" className="block text-[11px] sm:text-xs font-bold text-text-secondary mb-2 px-1 uppercase tracking-wider">
                    {hasPassword ? 'Nueva Contraseña' : 'Contraseña Nueva'}
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={baseInputClasses}
                    placeholder="Escribe una nueva contraseña"
                  />
                  {errors.newPassword && (
                    <p className="form-error-text mt-2 font-bold px-2">{errors.newPassword}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-8 border-t border-black/5 dark:border-white/10 mt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-8 py-4 w-full sm:w-auto min-w-[200px] rounded-[20px] bg-accent text-white font-bold text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-accent/20"
              >
                {isLoading ? (
                  <Spinner size={24} color="white" />
                ) : (
                  <>
                    <Save size={20} strokeWidth={2.5} />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </GlassCard>

        {/* --- APARTADO: PERFIL SOCIAL --- */}
        <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 mb-8 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-extrabold text-text-primary mb-3 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-accent/10 rounded-[12px] ring-1 ring-accent/30 shrink-0">
              <Eye size={20} className="text-accent" strokeWidth={2.5} />
            </div>
            Perfil Social Público
          </h3>
          <p className="text-sm font-medium text-text-secondary mb-6 leading-relaxed">
            Así es como otros usuarios ven tu perfil, logros y estadísticas en la comunidad.
            Puedes personalizar qué información compartir desde la sección de privacidad en Ajustes.
          </p>
          <button
            type="button"
            onClick={handleViewPublicProfile}
            className="flex items-center justify-center gap-2 px-6 py-4 w-full sm:w-auto rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95 shadow-sm"
          >
            <User size={18} strokeWidth={2.5} />
            <span>Previsualizar Mi Perfil</span>
          </button>
        </GlassCard>

        {/* --- APARTADO: INSIGNIAS --- */}
        <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 mb-8 hover:shadow-xl transition-all duration-300">
          <h3 className="text-xl font-extrabold text-text-primary mb-6 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-accent/10 rounded-[12px] ring-1 ring-accent/30 shrink-0">
              <Trophy size={20} className="text-accent" strokeWidth={2.5} />
            </div>
            Mis Insignias
          </h3>

          {gamification?.unlockedBadges && gamification.unlockedBadges.length > 0 ? (
            (() => {
              const unlockedBadges = gamification.unlockedBadges;
              const totalPages = Math.ceil(unlockedBadges.length / itemsPerPage);
              const currentBadges = unlockedBadges.slice(
                badgePage * itemsPerPage,
                (badgePage + 1) * itemsPerPage
              );

              return (
                <div className="relative px-2 sm:px-12">
                  {totalPages > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setBadgePage(p => Math.max(0, p - 1))}
                        disabled={badgePage === 0}
                        className="absolute left-0 top-1/2 -translate-y-1/2 p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-[16px] text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 hidden sm:block active:scale-95 shadow-sm"
                      >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBadgePage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={badgePage === totalPages - 1}
                        className="absolute right-0 top-1/2 -translate-y-1/2 p-2.5 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 hover:bg-black/10 dark:hover:bg-white/10 rounded-[16px] text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all z-10 hidden sm:block active:scale-95 shadow-sm"
                      >
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </button>
                    </>
                  )}

                  <div className={`grid gap-4 ${itemsPerPage === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    {currentBadges.map((badgeId) => {
                      const badge = BADGE_DETAILS[badgeId] || BADGE_DETAILS.default;
                      return (
                        <div key={badgeId} className="flex flex-col items-center text-center p-5 rounded-[24px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 transition-transform hover:-translate-y-1">
                          <div className={`p-4 rounded-[20px] mb-4 bg-bg-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10 ${badge.color}`}>
                            <badge.icon size={32} strokeWidth={1.5} />
                          </div>
                          <span className="font-extrabold text-sm text-text-primary mb-1">{badge.name}</span>
                          <span className="text-xs font-medium text-text-secondary">{badge.desc}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Controles de página para móvil */}
                  {totalPages > 1 && (
                    <div className="flex sm:hidden items-center justify-between mt-6 px-2">
                      <button
                        onClick={() => setBadgePage(p => Math.max(0, p - 1))}
                        disabled={badgePage === 0}
                        className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 disabled:opacity-30 text-text-secondary active:scale-95"
                      >
                        <ChevronLeft size={20} strokeWidth={2.5} />
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: totalPages }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === badgePage ? 'bg-accent' : 'bg-black/10 dark:bg-white/20'}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setBadgePage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={badgePage === totalPages - 1}
                        className="p-2.5 rounded-[12px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 disabled:opacity-30 text-text-secondary active:scale-95"
                      >
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </button>
                    </div>
                  )}

                  {/* Indicadores de página Desktop */}
                  {totalPages > 1 && (
                    <div className="hidden sm:flex justify-center gap-2 mt-6">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${i === badgePage ? 'bg-accent' : 'bg-black/10 dark:bg-white/20'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-center p-10 bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10">
              <Trophy size={48} className="mx-auto text-text-muted opacity-50 mb-4" strokeWidth={1.5} />
              <p className="text-text-primary font-extrabold text-lg mb-1">Sin insignias aún</p>
              <p className="text-text-secondary font-medium text-sm">¡Sigue entrenando para desbloquear recompensas!</p>
            </div>
          )}
        </GlassCard>

        {/* --- ZONA DE PELIGRO --- */}
        <GlassCard className="glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-red/30 bg-red/5">
          <h3 className="text-xl font-extrabold text-red mb-6 flex items-center gap-3 tracking-tight">
            <div className="p-2.5 bg-red/10 rounded-[12px] ring-1 ring-red/30 shrink-0">
              <AlertTriangle size={20} strokeWidth={2.5} />
            </div>
            Zona de Peligro
          </h3>
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 bg-bg-primary rounded-[24px] p-6 ring-1 ring-black/5 dark:ring-white/10 shadow-sm flex flex-col">
              <p className="text-sm text-text-primary font-extrabold mb-2 uppercase tracking-wider">Borrar Mis Datos</p>
              <p className="text-xs font-medium text-text-secondary mb-6 leading-relaxed flex-1">
                Elimina todo tu historial de entrenamientos, rutinas y nutrición, pero conserva tu perfil de usuario.
              </p>
              <button
                type="button"
                onClick={() => setModalAction('deleteData')}
                className="w-full px-4 py-4 rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
              >
                Borrar Historial
              </button>
            </div>

            <div className="flex-1 bg-bg-primary rounded-[24px] p-6 ring-1 ring-red/20 shadow-sm flex flex-col">
              <p className="text-sm text-red font-extrabold mb-2 uppercase tracking-wider">Borrar Cuenta Definitivamente</p>
              <p className="text-xs font-medium text-red/80 mb-6 leading-relaxed flex-1">
                Elimina permanentemente tu cuenta y todos tus datos. Esta acción no se puede deshacer.
              </p>
              <button
                type="button"
                onClick={() => setModalAction('deleteAccount')}
                className="w-full px-4 py-4 rounded-[20px] bg-red text-white font-bold hover:bg-red/90 transition-colors shadow-lg shadow-red/20 active:scale-95"
              >
                Borrar Cuenta
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* --- MODAL DE RECORTE DE IMAGEN --- */}
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

      {/* --- MODAL DE CONFIRMACIÓN DE BORRADO --- */}
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

      {isImageModalOpen && (
        <ProfileImageModal
          imageUrl={getProcessedImageUrl(imagePreview)}
          username={formData.username}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
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
      <div className="bg-bg-primary p-5 pb-8 flex justify-between items-center px-6 sm:px-10 border-t border-black/5 dark:border-white/10" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
        <button type="button" onClick={onCancel} className="text-text-secondary font-bold px-6 py-3.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-[16px] transition-colors active:scale-95">
          Cancelar
        </button>
        <button type="button" onClick={() => onComplete(croppedAreaPixels)} className="bg-accent text-white font-bold px-8 py-3.5 rounded-[20px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20">
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
  if (!modalAction) return null;

  const isDeleteAccount = modalAction === 'deleteAccount';
  const title = isDeleteAccount ? 'Borrar Cuenta Definitivamente' : 'Borrar Historial de Datos';

  const themeConfig = isDeleteAccount 
    ? {
        ring: 'ring-red/30',
        iconBg: 'bg-red/10',
        iconRing: 'ring-red/30',
        text: 'text-red',
        buttonBg: 'bg-red',
        buttonHover: 'hover:scale-[1.02]',
        shadow: 'shadow-red/20'
      }
    : {
        ring: 'ring-orange-500/30',
        iconBg: 'bg-orange-500/10',
        iconRing: 'ring-orange-500/30',
        text: 'text-orange-500',
        buttonBg: 'bg-orange-500',
        buttonHover: 'hover:scale-[1.02]',
        shadow: 'shadow-orange-500/20'
      };

  const message = isDeleteAccount
    ? `¿Estás ABSOLUTAMENTE seguro? Esta acción es irreversible. Tu cuenta y todos tus datos serán eliminados permanentemente.`
    : `¿Estás seguro? Todos tus registros de entrenamientos, nutrición y progreso serán eliminados. Tu cuenta se conservará.`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-[fade-in_0.2s_ease-out]">
      <div className="absolute inset-0" onClick={handleModalClose} />
      <div className={`w-full max-w-md p-6 sm:p-8 relative z-10 animate-[slide-up_0.3s_ease-out] rounded-[32px] shadow-2xl bg-bg-primary ring-1 ${themeConfig.ring}`}>
        
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-5 ring-1 shadow-sm ${themeConfig.iconBg} ${themeConfig.text} ${themeConfig.iconRing}`}>
            <AlertTriangle size={40} strokeWidth={1.5} />
          </div>
          <h3 className={`text-2xl font-extrabold tracking-tight ${themeConfig.text}`}>{title}</h3>
          <p className="text-text-secondary font-medium text-sm mt-3 leading-relaxed">
            {message}
          </p>
          {hasPassword && (
            <p className="text-sm font-bold text-text-primary mt-3">
              Escribe tu contraseña para confirmar.
            </p>
          )}
        </div>

        {hasPassword && (
          <div className="mb-8">
            <input
              type="password"
              placeholder="Contraseña actual"
              value={modalPassword}
              onChange={(e) => {
                setModalPassword(e.target.value);
                setModalError('');
              }}
              className={baseInputClasses}
              autoFocus
            />
            {modalError && <p className="form-error-text text-center text-xs mt-3 font-bold">{modalError}</p>}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleModalConfirm}
            disabled={isModalLoading}
            className={`flex items-center justify-center gap-2 w-full py-4 rounded-[20px] font-bold transition-all text-white active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg ${themeConfig.buttonBg} ${themeConfig.shadow} ${themeConfig.buttonHover}`}
          >
            {isModalLoading ? (
              <Spinner size={20} color="#ffffff" />
            ) : (
              `Confirmar ${isDeleteAccount ? 'Borrado' : 'Limpieza'}`
            )}
          </button>
          <button
            onClick={handleModalClose}
            disabled={isModalLoading}
            className="w-full py-4 rounded-[20px] bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 font-bold text-text-primary hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;