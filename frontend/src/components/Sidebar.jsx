import React from 'react';
import { Dumbbell, User, LogOut } from 'lucide-react';

const Sidebar = ({
  view,
  navigate,
  setPreviousView,
  navItems,
  userProfile,
  BACKEND_BASE_URL,
  handleLogoutClick
}) => {
  return (
    <nav className="hidden md:flex flex-col gap-10 p-8 w-64 h-full border-r border-[--glass-border] bg-bg-primary">
      <button onClick={() => navigate('dashboard')} className="flex items-center justify-center gap-3 text-accent transition-transform hover:scale-105">
        <Dumbbell className="h-7 w-7 flex-shrink-0" />
        <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">Pro Fitness Glass</h1>
      </button>
      <div className="flex flex-col gap-4">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setPreviousView(view); // Guardar vista actual al navegar
              navigate(item.id);
            }}
            className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === item.id
                ? 'bg-accent text-bg-secondary'
                : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
              }`}>
            {item.icon}
            <span className="whitespace-noww-rap">{item.label}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-auto flex flex-col gap-2">
        <div className="h-px bg-[--glass-border] my-2"></div>
        <button
          onClick={() => {
            setPreviousView(view); // Guardar vista actual
            navigate('profile');
          }}
          className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === 'profile'
              ? 'bg-accent text-bg-secondary'
              : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
            }`}>
          
          {userProfile && userProfile.profile_image_url ? (
              <img 
                  src={userProfile.profile_image_url.startsWith('http') ? userProfile.profile_image_url : `${BACKEND_BASE_URL}${userProfile.profile_image_url}`} 
                  alt="Perfil" 
                  className="w-6 h-6 rounded-full object-cover"
              />
          ) : (
              <User size={24} />
          )}
          
          <span className="whitespace-nowrap">{userProfile?.username || 'Perfil'}</span>
        </button>
        <button onClick={handleLogoutClick} className="flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors duration-200">
          <LogOut size={24} />
          <span className="whitespace-nowrap">Cerrar Sesión</span>
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;