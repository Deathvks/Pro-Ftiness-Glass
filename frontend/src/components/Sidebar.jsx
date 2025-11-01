/* frontend/src/components/Sidebar.jsx */
import React from 'react';
import { Dumbbell, User, LogOut } from 'lucide-react';

const Sidebar = ({
  view,
  navigate,
  // --- INICIO DE LA MODIFICACIÓN ---
  // setPreviousView, // ELIMINADO: La función 'navigate' ya gestiona esto
  // --- FIN DE LA MODIFICACIÓN ---
  navItems,
  userProfile,
  BACKEND_BASE_URL,
  handleLogoutClick
}) => {
  return (
    <nav className="hidden md:flex flex-col gap-10 p-8 w-64 h-full border-r border-[--glass-border] bg-[--glass-bg] backdrop-blur-glass">

      {/* Logo y título */}
      <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 text-accent transition-transform hover:scale-105">
        <Dumbbell className="h-7 w-7 flex-shrink-0" />
        <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">Pro Fitness Glass</h1>
      </button>

      {/* Navegación principal */}
      <div className="flex flex-col gap-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              // --- INICIO DE LA MODIFICACIÓN ---
              // setPreviousView(view); // ELIMINADO: Esta llamada era redundante y causaba el bug.
              navigate(item.id); // 'navigate' se encarga de todo.
              // --- FIN DE LA MODIFICACIÓN ---
            }}
            className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === item.id
              ? 'bg-accent text-bg-secondary'
              : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
              }`}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Navegación inferior (Perfil y Salir) */}
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-px bg-[--glass-border] my-2"></div>
        <button
          onClick={() => {
            // --- INICIO DE LA MODIFICACIÓN ---
            // setPreviousView(view); // ELIMINADO: 'navigate' se encarga de esto.
            navigate('profile');
            // --- FIN DE LA MODIFICACIÓN ---
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