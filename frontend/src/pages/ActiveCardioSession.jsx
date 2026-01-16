/* frontend/src/pages/ActiveCardioSession.jsx */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Play, Pause, Square, MapPin, Navigation,
  Clock, Flame, Footprints, ChevronLeft
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { 
  calculateDistance, 
  calculatePace, 
  formatDistance, 
  getCurrentLocation, 
  watchLocation, 
  clearLocationWatch 
} from '../utils/gpsUtils';
import { useToast } from '../hooks/useToast';
import { useAppTheme } from '../hooks/useAppTheme';
import Spinner from '../components/Spinner';
import { CARDIO_ACTIVITIES } from '../data/cardioLibrary';
import ConfirmationModal from '../components/ConfirmationModal';

const LS_KEY = 'active_cardio_session';

// Color exacto del tema oscuro de la web (extraído de index.css)
const DARK_THEME_COLOR = '#0c111b';

const createUserIcon = () => {
  return L.divIcon({
    className: 'custom-user-marker',
    html: `<div style="
      background-color: #22c55e;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const MapRecenter = ({ position, follow }) => {
  const map = useMap();
  useEffect(() => {
    if (position && follow) {
      map.panTo(position, { animate: true });
    }
  }, [position, follow, map]);
  return null;
};

const ActiveCardioSession = ({ activityId: propActivityId, setView: propSetView }) => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { userProfile, bodyWeightLog, fetchInitialData, logWorkout } = useAppStore(state => ({
    userProfile: state.userProfile,
    bodyWeightLog: state.bodyWeightLog,
    fetchInitialData: state.fetchInitialData,
    logWorkout: state.logWorkout
  }));

  // --- TEMA PARA EL MAPA ---
  const { theme } = useAppTheme();

  // Lógica para determinar el estilo del mapa
  const mapConfig = useMemo(() => {
    const isSystemDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveTheme = theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;

    if (effectiveTheme === 'light') {
      return {
        url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        opacity: 1,
        bgColor: '#f7fafc',
        className: '',
        gradientFrom: 'from-bg-primary/80'
      };
    } else if (effectiveTheme === 'oled') {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        opacity: 1,
        bgColor: '#000000',
        className: '',
        gradientFrom: 'from-black/80'
      };
    } else {
      return {
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        opacity: 0.5,
        bgColor: DARK_THEME_COLOR,
        className: 'map-tiles-dark-adjusted',
        gradientFrom: 'from-bg-primary/80'
      };
    }
  }, [theme]);

  // --- LÓGICA DE INICIALIZACIÓN Y RECUPERACIÓN ---
  const getSavedState = () => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  };

  const savedState = useMemo(() => getSavedState(), []);

  const activityId = propActivityId || state?.activityId || savedState?.activityId;

  const goBack = () => {
    localStorage.removeItem(LS_KEY);
    propSetView ? propSetView('quickCardio') : navigate('/quickCardio');
  };
  const goDashboard = () => {
    localStorage.removeItem(LS_KEY);
    propSetView ? propSetView('dashboard') : navigate('/dashboard');
  };

  const activity = useMemo(() => {
    return CARDIO_ACTIVITIES.find(a => a.id === activityId);
  }, [activityId]);

  const [status, setStatus] = useState(savedState?.status || 'idle');
  const [seconds, setSeconds] = useState(savedState?.seconds || 0);
  const [position, setPosition] = useState(savedState?.lastPosition || null);
  const [path, setPath] = useState(savedState?.path || []);
  const [distance, setDistance] = useState(savedState?.distance || 0);

  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [followUser, setFollowUser] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (savedState && savedState.status === 'running' && savedState.lastTimestamp) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - savedState.lastTimestamp) / 1000);
      if (diffSeconds > 0) {
        setSeconds(prev => prev + diffSeconds);
        addToast('Sesión recuperada', 'success');
      }
    }
  }, []);

  useEffect(() => {
    if (status !== 'idle' && activityId) {
      const stateToSave = {
        activityId,
        status,
        seconds,
        path,
        distance,
        lastPosition: position,
        lastTimestamp: Date.now()
      };
      localStorage.setItem(LS_KEY, JSON.stringify(stateToSave));
    }
  }, [status, seconds, path, distance, position, activityId]);


  const currentWeight = useMemo(() => {
    if (bodyWeightLog && bodyWeightLog.length > 0) {
      const sorted = [...bodyWeightLog].sort((a, b) => new Date(b.log_date) - new Date(a.log_date));
      return parseFloat(sorted[0].weight_kg) || 75;
    }
    return userProfile?.weight || 75;
  }, [bodyWeightLog, userProfile]);

  useEffect(() => {
    if (!activity) {
      goBack();
      return;
    }

    // Inicializamos la posición usando gpsUtils (maneja Web/Nativo)
    if (!position) {
      getCurrentLocation()
        .then((pos) => {
          setPosition([pos.lat, pos.lng]);
          setPermissionStatus('granted');
        })
        .catch((err) => {
          console.error("Error inicial GPS:", err);
          // Si falla, asumimos que no hay permisos o GPS
          setPermissionStatus('denied');
        });
    } else {
      setPermissionStatus('granted');
    }

    if (savedState?.status === 'running' && !timerRef.current) {
      startSession(true);
    }

    return () => stopTracking();
  }, [activity, addToast]);

  const startSession = async (isResuming = false) => {
    if (permissionStatus === 'denied') {
      addToast('Habilita la ubicación para usar el GPS', 'error');
      return;
    }

    setStatus('running');
    setFollowUser(true);

    if (!timerRef.current) {
      timerRef.current = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }

    if (!watchIdRef.current) {
      try {
        // watchLocation devuelve una promesa con el ID
        const id = await watchLocation((loc) => {
          const { lat, lng, accuracy } = loc;
          
          // Ignoramos lecturas con mala precisión
          if (accuracy > 50) return;

          const newPos = [lat, lng];
          setPosition(newPos);

          setPath(prevPath => {
            const lastPos = prevPath[prevPath.length - 1];
            let newDistance = 0;
            if (lastPos) {
              const dist = calculateDistance(lastPos[0], lastPos[1], lat, lng);
              if (dist > 2) newDistance = dist;
            }

            if (newDistance > 0) {
              setDistance(d => d + newDistance);
              return [...prevPath, newPos];
            }
            if (prevPath.length === 0) return [newPos];
            return prevPath;
          });
        });
        watchIdRef.current = id;
      } catch (error) {
        console.error("Error iniciando seguimiento:", error);
      }
    }
  };

  const pauseSession = () => {
    setStatus('paused');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current) {
      clearLocationWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const resumeSession = () => startSession();

  const stopTracking = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchIdRef.current) {
      clearLocationWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const handleBackClick = () => {
    if (status === 'running') pauseSession();
    if (seconds > 0) setShowExitConfirm(true);
    else goBack();
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    stopTracking();
    localStorage.removeItem(LS_KEY);
    goBack();
  };

  const handleFinishClick = () => setShowSaveConfirm(true);

  const handleConfirmSave = () => {
    setShowSaveConfirm(false);
    finishSession();
  };

  const finishSession = async () => {
    stopTracking();
    setIsSaving(true);

    const calories = Math.round(activity.mets * currentWeight * (seconds / 3600));
    const gpsNote = path.length > 0 ? `GPS_DATA::${JSON.stringify(path)}` : '';
    const userNote = `Sesión GPS: ${formatDistance(distance)}. Ritmo: ${calculatePace(seconds, distance)}.`;

    const payload = {
      routineName: activity.name,
      workout_date: new Date().toISOString(),
      duration_seconds: seconds,
      calories_burned: calories,
      notes: `${userNote}\n${gpsNote}`,
      exercises: []
    };

    try {
      const result = await logWorkout(payload);
      await fetchInitialData();

      if (result.success) {
        if (result.message && result.message.includes('Límite de XP')) {
          addToast(result.message, 'warning');
        } else {
          addToast(result.message || '¡Entrenamiento guardado!', 'success');
        }
        localStorage.removeItem(LS_KEY);
        goDashboard();
      } else {
        addToast(result.message, 'error');
        setIsSaving(false);
      }
    } catch (error) {
      console.error(error);
      addToast('Error al guardar sesión. Verifica los datos.', 'error');
      setIsSaving(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (permissionStatus === 'denied') {
    return (
      <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <MapPin size={40} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Ubicación desactivada</h2>
        <p className="text-text-secondary mb-8">
          Para registrar tu ruta en el mapa, necesitamos acceso a tu ubicación.
          Por favor, actívala en los ajustes de tu dispositivo.
        </p>
        <button onClick={goBack} className="px-6 py-3 bg-bg-secondary rounded-full font-bold text-text-primary">
          Volver
        </button>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="relative w-full h-screen bg-bg-primary flex flex-col overflow-hidden">
      <style>
        {`
          .map-tiles-dark-adjusted {
            filter: brightness(0.9) contrast(1.1);
          }
        `}
      </style>

      <div
        className="absolute inset-0 z-0"
        style={{ backgroundColor: mapConfig.bgColor }}
      >
        {position ? (
          <MapContainer
            center={position}
            zoom={16}
            style={{ height: '100%', width: '100%', background: 'transparent' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url={mapConfig.url}
              attribution='&copy; CartoDB'
              opacity={mapConfig.opacity}
              className={mapConfig.className}
            />
            <Polyline positions={path} pathOptions={{ color: '#22c55e', weight: 5, opacity: 0.8 }} />
            <Marker position={position} icon={createUserIcon()} />
            <MapRecenter position={position} follow={followUser} />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-bg-secondary">
            <Spinner size={30} />
            <span className="ml-3 text-text-secondary">Buscando señal GPS...</span>
          </div>
        )}
      </div>

      <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${mapConfig.gradientFrom} to-transparent z-10 pointer-events-none`} />

      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start">
        <button onClick={handleBackClick} className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition">
          <ChevronLeft size={24} />
        </button>
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
          <activity.icon size={16} className={activity.color} />
          <span className="font-bold text-white text-sm">{activity.name}</span>
        </div>
        <button onClick={() => setFollowUser(!followUser)} className={`p-3 backdrop-blur-md rounded-full transition ${followUser ? 'bg-accent text-bg-primary' : 'bg-black/40 text-white'}`}>
          <Navigation size={24} fill={followUser ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-20 bg-bg-primary/90 backdrop-blur-xl rounded-t-3xl border-t border-text-primary/10 p-6 pb-20 md:pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-6xl font-black font-mono text-text-primary tracking-tight">{formatTime(seconds)}</div>
          <p className="text-xs text-text-muted uppercase tracking-widest mt-1">Tiempo Transcurrido</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-1 mb-1">
              <span className="text-2xl font-bold text-text-primary">{formatDistance(distance).split(' ')[0]}</span>
              <span className="text-xs text-text-tertiary mb-1.5">{formatDistance(distance).split(' ')[1]}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary"><Footprints size={12} /> Distancia</div>
          </div>
          <div className="flex flex-col items-center border-x border-text-primary/10">
            <div className="flex items-end gap-1 mb-1">
              <span className="text-2xl font-bold text-text-primary">{calculatePace(seconds, distance).split(' ')[0]}</span>
              <span className="text-xs text-text-tertiary mb-1.5">/km</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary"><Clock size={12} /> Ritmo</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-end gap-1 mb-1">
              <span className="text-2xl font-bold text-text-primary">{Math.round(activity.mets * currentWeight * (seconds / 3600))}</span>
              <span className="text-xs text-text-tertiary mb-1.5">kcal</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-text-secondary"><Flame size={12} /> Energía</div>
          </div>
        </div>

        <div className="flex justify-center items-center gap-6">
          {status === 'idle' && (
            <button onClick={() => startSession()} className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform">
              <Play size={32} className="text-bg-secondary ml-1" fill="currentColor" />
            </button>
          )}

          {status === 'running' && (
            <button onClick={pauseSession} className="w-20 h-20 bg-accent rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:scale-105 transition-transform">
              <Pause size={32} className="text-bg-secondary" fill="currentColor" />
            </button>
          )}

          {status === 'paused' && (
            <>
              <button onClick={resumeSession} className="w-16 h-16 bg-accent rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Play size={24} className="text-bg-secondary ml-1" fill="currentColor" />
              </button>
              <button onClick={handleFinishClick} disabled={isSaving} className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform disabled:opacity-50">
                {isSaving ? <Spinner size={24} color="border-white" /> : <Square size={24} className="text-white" fill="currentColor" />}
              </button>
            </>
          )}
        </div>
      </div>

      {showExitConfirm && (
        <ConfirmationModal
          message="¿Estás seguro de que quieres salir? Se perderá el progreso de la sesión actual."
          confirmText="Salir sin guardar"
          cancelText="Continuar"
          onConfirm={handleConfirmExit}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}

      {showSaveConfirm && (
        <ConfirmationModal
          message="¿Deseas finalizar y guardar esta sesión?"
          confirmText="Guardar"
          cancelText="Cancelar"
          onConfirm={handleConfirmSave}
          onCancel={() => setShowSaveConfirm(false)}
        />
      )}
    </div>
  );
};

export default ActiveCardioSession;