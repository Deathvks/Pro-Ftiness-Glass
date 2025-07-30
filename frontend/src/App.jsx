import React, { useState, useEffect } from 'react';
import { Home, Dumbbell, BarChart2, Settings, LogOut } from 'lucide-react';
import useAppStore from './store/useAppStore';

// --- Importaciones de Páginas y Componentes ---
import Dashboard from './pages/Dashboard';
import Progress from './pages/Progress';
import Routines from './pages/Routines';
import Workout from './pages/Workout';
import SettingsScreen from './pages/SettingsScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import OnboardingScreen from './pages/OnboardingScreen';
import ProfileEditor from './pages/ProfileEditor';
import PRToast from './components/PRToast';

export default function App() {
  // Obtenemos todo el estado y las acciones necesarias del store de Zustand
  const {
    isAuthenticated,
    userProfile,
    isLoading,
    prNotification,
    fetchInitialData,
    handleLogout,
  } = useAppStore();

  const [isLoginView, setIsLoginView] = useState(true);
  const [view, setView] = useState('dashboard');
  const [viewProps, setViewProps] = useState({});
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  
  const setTheme = (newTheme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  // La carga de datos inicial se dispara desde aquí solo una vez al montar el componente
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Lógica para gestionar el tema (claro/oscuro/sistema)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = (themeValue) => {
      document.body.classList.remove('light-theme', 'dark-theme');
      if (themeValue === 'system') {
        document.body.classList.add(mediaQuery.matches ? 'dark-theme' : 'light-theme');
      } else {
        document.body.classList.add(`${themeValue}-theme`);
      }
    };
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };
    applyTheme(theme);
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
  }, [theme]);

  // Función de navegación para cambiar entre vistas
  const navigate = (viewName, props = {}) => {
    setViewProps(props);
    setView(viewName);
  };
  
  // --- Renderizado Condicional ---
  
  if (isLoading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return isLoginView
      ? <LoginScreen onLogin={fetchInitialData} showRegister={() => setIsLoginView(false)} />
      : <RegisterScreen showLogin={() => setIsLoginView(true)} />;
  }

  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigate} />;
      case 'progress': return <Progress darkMode={theme !== 'light'} />;
      case 'routines': return <Routines setView={navigate} />;
      case 'workout': return <Workout routine={viewProps.routine} setView={navigate} />;
      case 'settings': return <SettingsScreen theme={theme} setTheme={setTheme} setView={navigate} />;
      case 'profileEditor': return <ProfileEditor onCancel={() => navigate('settings')} />;
      default: return <Dashboard setView={navigate} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={24} /> },
    { id: 'progress', label: 'Progreso', icon: <BarChart2 size={24} /> },
    { id: 'routines', label: 'Rutinas', icon: <Dumbbell size={24} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={24} /> },
  ];

  return (
    <div className="relative flex w-full h-full overflow-hidden">
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-accent rounded-full opacity-20 filter blur-3xl -z-10 animate-roam-blob"></div>

      <nav className="hidden md:flex flex-col gap-10 p-8 w-64 h-full border-r border-[--glass-border] bg-bg-primary">
        <button onClick={() => navigate('dashboard')} className="flex items-center gap-4 text-accent transition-transform hover:scale-105">
          <Dumbbell size={32} />
          <h1 className="text-xl font-bold text-text-primary whitespace-nowrap">FitTrack Pro</h1>
        </button>
        <div className="flex flex-col gap-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${view === item.id
                  ? 'bg-accent text-bg-secondary'
                  : 'text-text-secondary hover:bg-accent-transparent hover:text-accent'
                }`}>
              {item.icon}
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
        <button onClick={handleLogout} className="mt-auto flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold text-text-secondary hover:bg-white/10 hover:text-text-primary transition-colors duration-200">
          <LogOut size={24} />
          <span className="whitespace-nowrap">Cerrar Sesión</span>
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
        {renderView()}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 flex justify-around items-center bg-[--glass-bg] backdrop-blur-glass border-t border-[--glass-border]">
        {navItems.map(item => (
          <button key={item.id} onClick={() => navigate(item.id)} className={`flex flex-col items-center justify-center gap-1 h-full flex-grow transition-colors duration-200 ${view === item.id ? 'text-accent' : 'text-text-secondary'}`}>
            {item.icon}
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <PRToast newPRs={prNotification} onClose={() => useAppStore.setState({ prNotification: null })} />
    </div>
  );
}