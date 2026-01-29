/* frontend/src/components/Sidebar.jsx */
import React, { useState } from 'react';
import { User, LogOut, Bell } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import StoryViewer from './StoryViewer';

// Modificamos SidebarItem para aceptar un click específico en el icono
const SidebarItem = ({ label, icon, isActive, onClick, onIconClick, badgeCount, isRed, shouldTruncate }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full md:px-4 md:py-3 lg:px-6 lg:py-4 rounded-lg text-base font-semibold transition-all duration-200 group text-left ${isRed
      ? 'text-text-secondary hover:bg-red/20 hover:text-red'
      : isActive
        ? 'bg-accent text-bg-secondary'
        : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
      }`}
  >
    <div 
        className="relative flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
        onClick={(e) => {
            // Si hay una acción específica para el icono (ej: abrir historia), la ejecutamos y paramos la navegación normal
            if (onIconClick) {
                e.stopPropagation();
                onIconClick();
            }
        }}
    >
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-[--glass-bg]" />
      )}
    </div>
    <span className={shouldTruncate ? "truncate" : "whitespace-nowrap"}>{label}</span>
  </button>
);

const Sidebar = ({ view, navigate, navItems, userProfile, BACKEND_BASE_URL, handleLogoutClick, unreadCount = 0 }) => {
  const socialRequests = useAppStore(state => state.socialRequests);
  const myStories = useAppStore(state => state.myStories);
  
  // Estado local para abrir el visor desde el sidebar
  const [viewingStory, setViewingStory] = useState(false);

  // Calcular si hay historias y si hay alguna sin ver
  const hasStories = myStories && myStories.length > 0;
  const hasUnseen = hasStories && myStories.some(s => !s.viewed);

  const getProfileIcon = () => {
    // Obtener URL de la imagen
    let imageUrl = null;
    if (userProfile?.profile_image_url) {
      imageUrl = userProfile.profile_image_url.startsWith('http')
        ? userProfile.profile_image_url
        : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`;
    }

    // Contenido interno (Imagen o Icono por defecto)
    const InnerContent = imageUrl ? (
      <img src={imageUrl} alt="Perfil" className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
        <User size={18} className="text-text-secondary" />
      </div>
    );

    // Caso 1: Tiene Historia
    if (hasStories) {
      return (
        // Aumentado tamaño a w-10 h-10 (40px)
        <div className={`w-10 h-10 rounded-full p-[2.5px] flex-shrink-0 transition-all duration-300
            ${hasUnseen 
                ? 'bg-accent shadow-md shadow-accent/40 animate-pulse-slow cursor-pointer' // No vista: Acento + Glow
                : 'bg-gray-400 dark:bg-white/20 cursor-pointer' // Vista: Gris/Apagado
            }
        `}>
           <div className="w-full h-full rounded-full border-[2px] border-bg-primary overflow-hidden bg-bg-primary">
              {InnerContent}
           </div>
        </div>
      );
    }

    // Caso 2: Normal (Sin historia) - Aumentado tamaño a w-9 h-9 (36px)
    return (
      <div className="w-9 h-9 rounded-full border border-transparent dark:border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center bg-bg-secondary">
         {imageUrl ? (
            <img src={imageUrl} alt="Perfil" className="w-full h-full object-cover" />
         ) : (
            <User size={20} className="text-text-secondary" />
         )}
      </div>
    );
  };

  return (
    <>
        {/* Renderizar visor si está activo */}
        {viewingStory && (
            <StoryViewer 
                userId={userProfile.id} 
                onClose={() => setViewingStory(false)} 
            />
        )}

        <nav className="hidden md:flex flex-col md:gap-4 lg:gap-10 md:p-4 lg:p-8 md:w-56 lg:w-64 h-full border-r border-transparent dark:border-r dark:border-white/10 bg-[--glass-bg] backdrop-blur-glass overflow-y-auto scrollbar-hide border-l-0 border-y-0">
        {/* Logo */}
        <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 transition-transform hover:scale-105 flex-shrink-0">
            <img src="/logo.webp" alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">Pro Fitness Glass</h1>
        </button>

        {/* Navegación Principal */}
        <div className="flex flex-col gap-2 lg:gap-4 flex-shrink-0">
            {navItems.map(item => (
            <SidebarItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isActive={view === item.id}
                onClick={() => navigate(item.id)}
                badgeCount={item.id === 'social' ? (socialRequests?.received?.length || 0) : 0}
            />
            ))}
        </div>

        {/* Acciones Inferiores */}
        <div className="mt-auto flex flex-col gap-2 flex-shrink-0 pt-4">
            <SidebarItem
            label="Notificaciones"
            icon={<Bell size={24} />}
            isActive={view === 'notifications'}
            onClick={() => navigate('notifications')}
            badgeCount={unreadCount}
            />

            <div className="h-px bg-black/5 dark:bg-white/10 my-2" />

            <SidebarItem
            label={userProfile?.username || 'Perfil'}
            icon={getProfileIcon()}
            isActive={view === 'profile'}
            onClick={() => navigate('profile')} // Clic en texto -> Ir al perfil
            onIconClick={hasStories ? () => setViewingStory(true) : undefined} // Clic en icono -> Ver historia (si hay)
            shouldTruncate={true}
            />

            <SidebarItem
            label="Cerrar Sesión"
            icon={<LogOut size={24} />}
            onClick={handleLogoutClick}
            isRed
            />
        </div>
        </nav>
    </>
  );
};

export default Sidebar;