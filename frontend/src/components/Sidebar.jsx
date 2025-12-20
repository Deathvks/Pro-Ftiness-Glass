/* frontend/src/components/Sidebar.jsx */
import React from 'react';
import { Dumbbell, User, LogOut, Bell } from 'lucide-react';
import useAppStore from '../store/useAppStore'; // Importamos el store

const Sidebar = ({
  view,
  navigate,
  navItems,
  userProfile,
  BACKEND_BASE_URL,
  handleLogoutClick,
  unreadCount = 0
}) => {
  // Obtenemos las solicitudes del estado global
  const { socialRequests } = useAppStore();

  return (
    <nav className="hidden md:flex flex-col gap-10 p-8 w-64 h-full border-r border-[--glass-border] bg-[--glass-bg] backdrop-blur-glass">

      {/* Logo y título */}
      <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 text-accent transition-transform hover:scale-105">
        <Dumbbell className="h-7 w-7 flex-shrink-0" />
        <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">Pro Fitness Glass</h1>
      </button>

      {/* Navegación principal */}
      <div className="flex flex-col gap-4">
        {navItems.map(item => {
          // Calculamos si hay solicitudes pendientes para este ítem (si es social)
          const isSocial = item.id === 'social';
          const pendingCount = isSocial ? (socialRequests?.received?.length || 0) : 0;

          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.id);
              }}
              className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === item.id
                ? 'bg-accent text-bg-secondary'
                : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
                }`}
            >
              {/* Envolvemos el icono para posicionar el badge relativo a él */}
              <div className="relative flex items-center justify-center">
                {item.icon}
                {pendingCount > 0 && (
                  // Badge idéntico al de notificaciones
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-[--glass-bg]"></span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Navegación inferior (Notificaciones, Perfil y Salir) */}
      <div className="mt-auto flex flex-col gap-2">

        {/* Botón de Notificaciones */}
        <button
          onClick={() => navigate('notifications')}
          className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === 'notifications'
            ? 'bg-accent text-bg-secondary'
            : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
            }`}
        >
          <div className="relative">
            <Bell size={24} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-[--glass-bg]"></span>
            )}
          </div>
          <span>Notificaciones</span>
        </button>

        <div className="h-px bg-[--glass-border] my-2"></div>

        <button
          onClick={() => {
            navigate('profile');
          }}
          className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 overflow-hidden ${view === 'profile'
            ? 'bg-accent text-bg-secondary'
            : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
            }`}>

          {userProfile && userProfile.profile_image_url ? (
            <img
              src={userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`}
              alt={`Foto de perfil de ${userProfile?.username || 'usuario'}`}
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-bg-secondary border border-glass-border flex items-center justify-center overflow-hidden flex-shrink-0">
              <User size={16} className="text-text-secondary" />
            </div>
          )}
          <span className="truncate">{userProfile?.username || 'Perfil'}</span>
        </button>
        <button onClick={handleLogoutClick} className="flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold text-text-secondary hover:bg-red/20 hover:text-red transition-colors duration-200">
          <LogOut size={24} />
          <span className="whitespace-nowrap">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;