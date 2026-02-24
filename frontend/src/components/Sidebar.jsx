/* frontend/src/components/Sidebar.jsx */
import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Settings, Sparkles } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import StoryViewer from './StoryViewer';
import AIInfoModal from './AIInfoModal'; // Lo crearemos en el siguiente paso

// Componente SidebarItem optimizado
const SidebarItem = ({ label, icon, isActive, onClick, onIconClick, badgeCount, isRed, shouldTruncate, className = '' }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full md:px-4 md:py-3 lg:px-6 lg:py-4 rounded-lg text-base font-semibold transition-all duration-200 group text-left ${className} ${
      isRed
        ? 'text-text-secondary hover:bg-red/20 hover:text-red'
        : isActive
        ? 'bg-accent text-bg-secondary'
        : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
    }`}
  >
    <div 
        className="relative flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
        onClick={(e) => {
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

const Sidebar = ({ view, navigate, navItems, userProfile, BACKEND_BASE_URL = '', handleLogoutClick, unreadCount = 0 }) => {
  const socialRequests = useAppStore(state => state.socialRequests);
  const myStories = useAppStore(state => state.myStories);
  
  const [viewingStory, setViewingStory] = useState(false);
  const [imgError, setImgError] = useState(false); 
  const [showAIModal, setShowAIModal] = useState(false);

  // Estados reactivos para la IA
  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');

  const hasStories = myStories && myStories.length > 0;
  const hasUnseen = hasStories && myStories.some(s => !s.viewed);

  // Escuchar cambios en los límites de IA para actualizar en tiempo real
  useEffect(() => {
    const updateAILimits = () => {
      setAiRemaining(localStorage.getItem('ai_remaining_uses') || '5');
      setAiLimit(localStorage.getItem('ai_daily_limit') || '5');
    };

    window.addEventListener('storage', updateAILimits);
    window.addEventListener('focus', updateAILimits);
    window.addEventListener('ai_limit_updated', updateAILimits);

    return () => {
      window.removeEventListener('storage', updateAILimits);
      window.removeEventListener('focus', updateAILimits);
      window.removeEventListener('ai_limit_updated', updateAILimits);
    };
  }, []);

  const getProfileIcon = () => {
    if (imgError) {
        return (
            <div className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-bg-secondary ${hasStories ? 'w-full h-full' : 'w-9 h-9 border border-transparent dark:border-white/10'}`}>
               <User size={hasStories ? 18 : 20} className="text-text-secondary" />
            </div>
        );
    }

    const imageUrl = userProfile?.profile_image_url?.startsWith('http')
      ? userProfile.profile_image_url
      : userProfile?.profile_image_url 
        ? `${BACKEND_BASE_URL}${userProfile.profile_image_url}` 
        : null;

    const InnerContent = imageUrl ? (
      <img 
        key={imageUrl}
        src={imageUrl} 
        alt="Perfil" 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        loading="eager"
        onError={(e) => {
            e.target.style.display = 'none'; 
            setImgError(true);
        }}
      />
    ) : (
      <div className="w-full h-full bg-bg-secondary flex items-center justify-center">
        <User size={hasStories ? 18 : 20} className="text-text-secondary" />
      </div>
    );

    if (hasStories) {
      return (
        <div className={`w-10 h-10 rounded-full p-[2.5px] flex-shrink-0 transition-all duration-300 cursor-pointer
            ${hasUnseen 
                ? 'bg-accent shadow-md shadow-accent/40 animate-pulse-slow' 
                : 'bg-gray-400 dark:bg-white/20'
            }
        `}>
            <div className="w-full h-full rounded-full border-[2px] border-bg-primary overflow-hidden bg-bg-primary">
              {InnerContent}
            </div>
        </div>
      );
    }

    return (
      <div className="w-9 h-9 rounded-full border border-transparent dark:border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center bg-bg-secondary">
         {InnerContent}
      </div>
    );
  };

  const isAILimitReached = parseInt(aiRemaining, 10) === 0;

  return (
    <>
        {viewingStory && userProfile && (
            <StoryViewer 
                userId={userProfile.id} 
                onClose={() => setViewingStory(false)} 
            />
        )}

        {showAIModal && (
            <AIInfoModal onClose={() => setShowAIModal(false)} />
        )}

        <nav className="hidden md:flex flex-col md:gap-4 lg:gap-10 md:p-4 lg:p-8 md:w-56 lg:w-64 h-full border-r border-transparent dark:border-r dark:border-white/10 bg-[--glass-bg] backdrop-blur-glass overflow-y-auto scrollbar-hide border-l-0 border-y-0">
        
        <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 transition-transform hover:scale-105 flex-shrink-0">
            <img src="/logo.webp" alt="Logo" className="h-8 w-8 object-contain" />
            <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">Pro Fitness Glass</h1>
        </button>

        <div className="flex flex-col gap-2 lg:gap-4 flex-shrink-0">
            {navItems.filter(item => item.id !== 'profile').map(item => (
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

        <div className="mt-auto flex flex-col gap-2 flex-shrink-0 pt-4">
            
            {/* Nuevo botón del estado de IA con borde más sutil */}
            <div className="mb-2">
              <SidebarItem
                  label={`IA: ${aiRemaining}/${aiLimit}`}
                  icon={<Sparkles size={24} className={isAILimitReached ? 'text-text-muted' : 'text-accent'} />}
                  isActive={false}
                  onClick={() => setShowAIModal(true)}
                  className={`border ${isAILimitReached ? 'border-glass-border opacity-70' : 'border-black/5 dark:border-white/10 bg-accent/5 text-accent'}`}
              />
            </div>

            <SidebarItem
                label="Ajustes"
                icon={<Settings size={24} />}
                isActive={view === 'settings'}
                onClick={() => navigate('settings')}
            />

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
                onClick={() => navigate('profile')}
                onIconClick={hasStories ? () => setViewingStory(true) : undefined}
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