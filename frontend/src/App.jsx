import React, { useState, useEffect, useCallback } from 'react';
import { Home, Dumbbell, BarChart2, Settings, LogOut } from 'lucide-react';
import { useToast } from './hooks/useToast'; // <-- CORREGIDO: Importa desde la nueva ubicación

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
  const { addToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginView, setIsLoginView] = useState(true);
  const [view, setView] = useState('dashboard');
  const [viewProps, setViewProps] = useState({});
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');

  const [routines, setRoutines] = useState([]);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [bodyWeightLog, setBodyWeightLog] = useState([]);
  const [prNotification, setPrNotification] = useState(null);

  useEffect(() => {
    if (prNotification) {
      const timer = setTimeout(() => {
        setPrNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [prNotification]);

  const setTheme = (newTheme) => {
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  const handleLogout = useCallback(async () => {
    try {
      await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      setIsAuthenticated(false);
      setUserProfile(null);
      setRoutines([]);
      setWorkoutLog([]);
      setBodyWeightLog([]);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const profileResponse = await fetch('http://localhost:3001/api/users/me', { credentials: 'include' });

      if (!profileResponse.ok) {
        handleLogout();
        throw new Error('Sesión no válida.');
      }

      const profileData = await profileResponse.json();
      setUserProfile(profileData);
      setIsAuthenticated(true);

      if (profileData.goal) {
        const [routinesRes, workoutsRes, bodyweightRes] = await Promise.all([
          fetch('http://localhost:3001/api/routines', { credentials: 'include' }),
          fetch('http://localhost:3001/api/workouts', { credentials: 'include' }),
          fetch('http://localhost:3001/api/bodyweight', { credentials: 'include' })
        ]);
        setRoutines(await routinesRes.json());
        setWorkoutLog(await workoutsRes.json());
        setBodyWeightLog(await bodyweightRes.json());
      }
    } catch (error) {
      if (error.message !== 'Sesión no válida.') {
        console.error("Error de autenticación:", error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const logBodyWeight = async (newWeightData) => {
    try {
      const response = await fetch('http://localhost:3001/api/bodyweight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: newWeightData.weight }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
      addToast('Peso registrado con éxito.', 'success');
      await fetchInitialData();
    } catch (error) {
      console.error("Error en logBodyWeight:", error.message);
      addToast(`Error al guardar: ${error.message}`, 'error');
    }
  };

  const updateTodayBodyWeight = async (updatedWeightData) => {
    try {
      const response = await fetch('http://localhost:3001/api/bodyweight/today', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: updatedWeightData.weight }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
      addToast('Peso actualizado con éxito.', 'success');
      await fetchInitialData();
    } catch (error) {
      console.error("Error en updateTodayBodyWeight:", error.message);
      addToast(`Error al actualizar: ${error.message}`, 'error');
    }
  };

  const logWorkout = async (workoutData) => {
    try {
      const response = await fetch('http://localhost:3001/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workoutData),
        credentials: 'include'
      });
      
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || 'Error al guardar el entrenamiento.');
      }
      
      if (responseData.newPRs && responseData.newPRs.length > 0) {
        setPrNotification(responseData.newPRs);
      }
      addToast('Entrenamiento guardado con éxito.', 'success');
      await fetchInitialData();
    } catch (error) {
      console.error("Error en logWorkout:", error);
      addToast(`Error al guardar: ${error.message}`, 'error');
    }
  };

  const deleteWorkoutLog = async (workoutId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/workouts/${workoutId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ocurrió un error.');
      addToast('Entrenamiento eliminado.', 'success');
      await fetchInitialData();
    } catch (error) {
      console.error("Error en deleteWorkoutLog:", error.message);
      addToast(`Error al eliminar: ${error.message}`, 'error');
    }
  };

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

  const handleLogin = () => {
    fetchInitialData();
  };

  const handleProfileUpdate = async (formData) => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar los datos.');
      }
      addToast('Perfil actualizado con éxito.', 'success');
      await fetchInitialData();
      navigate('settings');
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      addToast(`Error: ${error.message}`, 'error');
    }
  };

  const handleOnboardingComplete = async (formData) => {
    try {
      const response = await fetch('http://localhost:3001/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Error al guardar los datos.');
      await fetchInitialData();
    } catch (error) {
      console.error("Error al completar el onboarding:", error);
    }
  };

  const navigate = (viewName, props = {}) => {
    setViewProps(props);
    setView(viewName);
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <Dashboard setView={navigate} routines={routines} workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} logBodyWeight={logBodyWeight} updateTodayBodyWeight={updateTodayBodyWeight} userProfile={userProfile} />;
      case 'progress': return <Progress routines={routines} workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} darkMode={theme !== 'light'} userProfile={userProfile} deleteWorkoutLog={deleteWorkoutLog} />;
      case 'routines': return <Routines routines={routines} setRoutines={setRoutines} setView={navigate} workoutLog={workoutLog} />;
      case 'workout': return <Workout routine={viewProps.routine} setView={navigate} logWorkout={logWorkout} />;
      case 'settings': return <SettingsScreen theme={theme} setTheme={setTheme} setView={navigate} />;
      case 'profileEditor': return <ProfileEditor userProfile={userProfile} onSave={handleProfileUpdate} onCancel={() => navigate('settings')} />;
      default: return <Dashboard setView={navigate} routines={routines} workoutLog={workoutLog} bodyWeightLog={bodyWeightLog} logBodyWeight={logBodyWeight} updateTodayBodyWeight={updateTodayBodyWeight} userProfile={userProfile} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={24} /> },
    { id: 'progress', label: 'Progreso', icon: <BarChart2 size={24} /> },
    { id: 'routines', label: 'Rutinas', icon: <Dumbbell size={24} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={24} /> },
  ];

  if (isLoading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-bg-primary">Cargando...</div>;
  }

  if (!isAuthenticated) {
    return isLoginView
      ? <LoginScreen onLogin={handleLogin} showRegister={() => setIsLoginView(false)} />
      : <RegisterScreen showLogin={() => setIsLoginView(true)} />;
  }

  if (userProfile && !userProfile.goal) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

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
              className={`flex items-center gap-4 w-full px-6 py-4 rounded-lg text-base font-semibold transition-all duration-200 ${
                view === item.id 
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
      
      <PRToast newPRs={prNotification} onClose={() => setPrNotification(null)} />
    </div>
  );
}