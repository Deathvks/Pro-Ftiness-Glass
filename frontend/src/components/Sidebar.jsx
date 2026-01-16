/* frontend/src/components/Sidebar.jsx */
import React from 'react';
import { Dumbbell, User, LogOut, Bell } from 'lucide-react';
import useAppStore from '../store/useAppStore';

const SidebarItem = ({ label, icon, isActive, onClick, badgeCount, isRed, shouldTruncate }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-4 w-full md:px-4 md:py-3 lg:px-6 lg:py-4 rounded-lg text-base font-semibold transition-all duration-200 ${isRed
      ? 'text-text-secondary hover:bg-red/20 hover:text-red'
      : isActive
        ? 'bg-accent text-bg-secondary'
        : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
      }`}
  >
    <div className="relative flex items-center justify-center flex-shrink-0">
      {icon}
      {badgeCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-[--glass-bg]" />
      )}
    </div>
    {/* Aquí está el cambio:
      - Si shouldTruncate es true (Username): usa 'truncate' (...)
      - Si no (Notificaciones, etc): usa 'whitespace-nowrap' (comportamiento original)
    */}
    <span className={shouldTruncate ? "truncate" : "whitespace-nowrap"}>{label}</span>
  </button>
);

const Sidebar = ({ view, navigate, navItems, userProfile, BACKEND_BASE_URL, handleLogoutClick, unreadCount = 0 }) => {
  const socialRequests = useAppStore(state => state.socialRequests);

  const getProfileIcon = () => {
    if (userProfile?.profile_image_url) {
      const src = userProfile.profile_image_url.startsWith('http')
        ? userProfile.profile_image_url
        : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`;
      return <img src={src} alt="Perfil" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />;
    }
    return (
      <div className="w-6 h-6 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center flex-shrink-0">
        <User size={16} className="text-text-secondary" />
      </div>
    );
  };

  return (
    <nav className="hidden md:flex flex-col md:gap-4 lg:gap-10 md:p-4 lg:p-8 md:w-56 lg:w-64 h-full border-r border-[--glass-border] bg-[--glass-bg] backdrop-blur-glass overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 text-accent transition-transform hover:scale-105 flex-shrink-0">
        <Dumbbell className="h-7 w-7 flex-shrink-0" />
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
          // No pasamos shouldTruncate, así que se queda como estaba (whitespace-nowrap)
        />

        <div className="h-px bg-[--glass-border] my-2" />

        <SidebarItem
          label={userProfile?.username || 'Perfil'}
          icon={getProfileIcon()}
          isActive={view === 'profile'}
          onClick={() => navigate('profile')}
          shouldTruncate={true} // SOLO aplicamos "..." aquí
        />

        <SidebarItem
          label="Cerrar Sesión"
          icon={<LogOut size={24} />}
          onClick={handleLogoutClick}
          isRed
        />
      </div>
    </nav>
  );
};

export default Sidebar;