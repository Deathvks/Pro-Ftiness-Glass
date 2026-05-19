/* frontend/src/components/Sidebar.jsx */
import React, { useState, useEffect } from 'react';
import { User, LogOut, Bell, Settings, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import useAppStore from '../store/useAppStore';
import StoryViewer from './StoryViewer';
import AIInfoModal from './AIInfoModal';

const SidebarItem = ({ label, icon, isActive, onClick, onIconClick, badgeCount, isRed, shouldTruncate, className = '', isCollapsed }) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`flex items-center w-full rounded-2xl text-[15px] font-semibold transition-all duration-300 group text-left overflow-hidden ${
      isCollapsed ? 'justify-center p-3.5' : 'px-4 py-3.5 gap-4'
    } ${className} ${
      isRed
        ? 'text-text-secondary hover:bg-red-500/10 hover:text-red-500'
        : isActive
        ? 'glass shadow-sm text-accent translate-x-1'
        : 'text-text-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:translate-x-1'
    }`}
  >
    <div 
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 active:scale-95'}`}
        onClick={(e) => {
            if (onIconClick) {
                e.stopPropagation();
                onIconClick();
            }
        }}
    >
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-accent rounded-full border-2 border-[--glass-bg]" />
      )}
    </div>
    <span className={`transition-all duration-300 whitespace-nowrap ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[250px] opacity-100'} ${shouldTruncate ? "truncate" : ""}`}>
      {label}
    </span>
  </button>
);

const Sidebar = ({ view, navigate, navItems, userProfile, BACKEND_BASE_URL = '', handleLogoutClick, unreadCount = 0 }) => {
  const socialRequests = useAppStore(state => state.socialRequests);
  const myStories = useAppStore(state => state.myStories);
  
  const [viewingStory, setViewingStory] = useState(false);
  const [imgError, setImgError] = useState(false); 
  const [showAIModal, setShowAIModal] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  const [aiRemaining, setAiRemaining] = useState(() => localStorage.getItem('ai_remaining_uses') || '5');
  const [aiLimit, setAiLimit] = useState(() => localStorage.getItem('ai_daily_limit') || '5');

  const hasStories = myStories && myStories.length > 0;
  const hasUnseen = hasStories && myStories.some(s => !s.viewed);

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

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', newState.toString());
  };

  const getProfileIcon = () => {
    if (imgError) {
        return (
            <div className={`rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-bg-secondary ${hasStories ? 'w-full h-full' : 'w-9 h-9 border border-glass-border'}`}>
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
        <div className={`w-10 h-10 rounded-full p-[2px] shrink-0 transition-all duration-300 cursor-pointer ${hasUnseen ? 'bg-accent shadow-md shadow-accent/40 animate-pulse-slow' : 'bg-glass-border'}`}>
            <div className="w-full h-full rounded-full border-2 border-[--glass-bg] overflow-hidden bg-bg-primary">
              {InnerContent}
            </div>
        </div>
      );
    }

    return (
      <div className="w-9 h-9 rounded-full border border-glass-border overflow-hidden shrink-0 flex items-center justify-center bg-bg-secondary">
         {InnerContent}
      </div>
    );
  };

  const isAILimitReached = parseInt(aiRemaining, 10) === 0;

  return (
    <>
        {viewingStory && userProfile && (
            <StoryViewer userId={userProfile.id} onClose={() => setViewingStory(false)} />
        )}

        {showAIModal && (
            <AIInfoModal onClose={() => setShowAIModal(false)} />
        )}

        <nav className={`hidden md:flex flex-col h-full border-r border-glass-border bg-glass-bg backdrop-blur-glass shadow-lg overflow-y-auto overflow-x-hidden z-40 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[88px] px-3 py-6' : 'w-64 lg:w-72 p-6'}`}>
        
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-2'} mb-8 shrink-0`}>
            <button 
                onClick={() => navigate('dashboard')} 
                className={`flex items-center gap-3 transition-transform hover:scale-105 shrink-0 outline-none focus:outline-none ${isCollapsed ? 'w-fit' : 'w-full'}`}
                title="Ir al inicio"
            >
                <img src="/logo.webp" alt="Logo" className="h-9 w-9 object-contain drop-shadow-md shrink-0" />
                <h1 className={`text-lg lg:text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight whitespace-nowrap transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 hidden' : 'max-w-[250px] opacity-100'}`}>
                    Pro Fitness Glass
                </h1>
            </button>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
            {navItems.filter(item => item.id !== 'profile').map(item => (
            <SidebarItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                isActive={view === item.id}
                onClick={() => navigate(item.id)}
                badgeCount={item.id === 'social' ? (socialRequests?.received?.length || 0) : 0}
                isCollapsed={isCollapsed}
            />
            ))}
        </div>

        <div className="mt-auto flex flex-col gap-1 shrink-0 pt-6">
            <SidebarItem
                label={`IA: ${aiRemaining}/${aiLimit}`}
                icon={<Sparkles size={22} className={isAILimitReached ? 'text-text-muted' : 'text-accent'} />}
                isActive={false}
                onClick={() => setShowAIModal(true)}
                className={`mb-2 border ${isAILimitReached ? 'border-glass-border opacity-70' : 'border-glass-border bg-accent/5 text-accent hover:bg-accent/10'}`}
                isCollapsed={isCollapsed}
            />

            <SidebarItem
                label="Ajustes"
                icon={<Settings size={22} />}
                isActive={view === 'settings'}
                onClick={() => navigate('settings')}
                isCollapsed={isCollapsed}
            />

            <SidebarItem
                label="Notificaciones"
                icon={<Bell size={22} />}
                isActive={view === 'notifications'}
                onClick={() => navigate('notifications')}
                badgeCount={unreadCount}
                isCollapsed={isCollapsed}
            />

            <SidebarItem
                label={isCollapsed ? "Expandir" : "Contraer"}
                icon={isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                onClick={toggleSidebar}
                isCollapsed={isCollapsed}
                className="text-text-muted hover:text-text-primary mt-1"
            />

            <div className={`h-px bg-glass-border my-2 transition-all duration-300 ${isCollapsed ? 'mx-4' : 'mx-2'}`} />

            <SidebarItem
                label={userProfile?.username || 'Perfil'}
                icon={getProfileIcon()}
                isActive={view === 'profile'}
                onClick={() => navigate('profile')}
                onIconClick={hasStories ? () => setViewingStory(true) : undefined}
                shouldTruncate={true}
                isCollapsed={isCollapsed}
            />

            <SidebarItem
                label="Cerrar Sesión"
                icon={<LogOut size={22} />}
                onClick={handleLogoutClick}
                isRed
                isCollapsed={isCollapsed}
            />
        </div>
        </nav>
    </>
  );
};

export default Sidebar;