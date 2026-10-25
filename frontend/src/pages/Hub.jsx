/* frontend/src/pages/Hub.jsx */
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ChartBarIcon, 
  Cog8ToothIcon, 
  TrophyIcon, 
  ChevronRightIcon,
  PaintBrushIcon,
  InformationCircleIcon,
  ShareIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  NewspaperIcon
} from '@heroicons/react/24/outline';
import { BookOpenIcon } from '@heroicons/react/24/outline';
import AppRatingModal from '../components/AppRatingModal';
import { HeartIcon } from '@heroicons/react/24/solid';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import HubTourGuide from '../components/HubTourGuide';
import apiClient from '../services/apiClient';
import TutorialsCenter from '../components/TutorialsCenter';
import { preloadViewChunk } from '../App';
import { TUTORIAL_COMPLETION_ACTIONS } from '../data/tutorials';
const CoachingPromoModal = lazy(() => import('../components/CoachingPromoModal'));

const HubButton = ({ id, icon: Icon, title, description, onClick, onPreload, isComingSoon, badge, highlight = false }) => (
  <button 
    id={id}
    onClick={onClick}
    onMouseEnter={onPreload}
    onTouchStart={onPreload}
    disabled={isComingSoon}
    className={`w-full flex items-center justify-between p-4 glass rounded-2xl transition-all duration-300 ${highlight ? 'border-accent ring-2 ring-accent/60 shadow-lg shadow-accent/20' : ''} ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 hover:bg-glass-border/30'}`}
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${highlight ? 'bg-accent text-accent-contrast shadow-md shadow-accent/30' : 'bg-accent/10 text-accent'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-left">
        <h3 className="text-[17px] font-bold text-text-primary flex items-center gap-2">
          {title}
          {isComingSoon && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-accent/20 text-accent px-2 py-0.5 rounded-full">
              Pronto
            </span>
          )}
          {highlight && !isComingSoon ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-accent-contrast shadow-sm">Pulsa aquí</span>
          ) : badge && !isComingSoon && (
            <span className="inline-block w-2.5 h-2.5 shrink-0 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(0,0,0,0.5)] dark:shadow-[0_0_8px_rgba(255,255,255,0.3)] mt-0.5 relative">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-75"></span>
            </span>
          )}
        </h3>
        {description && (
          <p className="text-[13px] font-medium text-text-secondary mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
    <ChevronRightIcon className="w-5 h-5 text-text-muted" />
  </button>
);

export default function Hub({ setView }) {
  const userProfile = useAppStore(state => state.userProfile);
  const unreadChats = useAppStore(state => state.unreadChats);
  const [visitedChallenges, setVisitedChallenges] = React.useState(true);
  const [visitedAsesoria, setVisitedAsesoria] = React.useState(true);
  const [showCoachingPromo, setShowCoachingPromo] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [hasOpenedTutorials, setHasOpenedTutorials] = useState(false);

  useEffect(() => {
    if (!userProfile?.id) return;
    setHasOpenedTutorials(localStorage.getItem(`tutorials_opened_from_hub_${userProfile.id}`) === 'true');
  }, [userProfile?.id]);

  const handleOpenTutorials = () => {
    if (userProfile?.id) {
      localStorage.setItem(`tutorials_opened_from_hub_${userProfile.id}`, 'true');
    }
    setHasOpenedTutorials(true);
    setShowTutorials(true);
    window.dispatchEvent(new Event('hub-badges-updated'));
  };

  useEffect(() => {
    if (sessionStorage.getItem('open_tutorials_on_hub') === 'true') {
      sessionStorage.removeItem('open_tutorials_on_hub');
      setShowTutorials(true);
    }
  }, []);

  const startTutorial = (tutorial) => {
    const store = useAppStore.getState();
    const completionAction = TUTORIAL_COMPLETION_ACTIONS[tutorial.id];
    if (completionAction && store[completionAction]) store[completionAction]();
    if (tutorial.id === 'routines') {
      localStorage.setItem('routinesForceTab', 'myRoutines');
      localStorage.setItem('routinesSelectedFolder', 'all');
    }
    setShowTutorials(false);
    setView(tutorial.view, { tutorialId: tutorial.id, returnToHub: true });
  };

  React.useEffect(() => {
    if (userProfile?.id) {
      setVisitedChallenges(localStorage.getItem(`visited_challenges_v2_${userProfile.id}`) === 'true');
      setVisitedAsesoria(localStorage.getItem(`visited_asesoria_${userProfile.id}`) === 'true');
      
      if (!['trainer', 'admin'].includes(userProfile?.role)) {
        const hasSeen = localStorage.getItem(`coaching_promo_seen_v2_${userProfile.id}`);
        if (!hasSeen) {
          setShowCoachingPromo(true);
        }
      }

      if (userProfile?.role === 'admin') {
        preloadViewChunk('adminPanel');
      }
    }
  }, [userProfile?.id, userProfile?.role]);

  const handleCloseCoachingPromo = () => {
    setShowCoachingPromo(false);
    if (userProfile?.id) {
      localStorage.setItem(`coaching_promo_seen_v2_${userProfile.id}`, 'true');
    }
  };

  return (
    <div className="w-full h-full pb-[calc(var(--safe-bottom)+90px)] animate-fade-in custom-scrollbar">
      <Helmet>
        <title>Menú - Pro Fitness Glass</title>
      </Helmet>
      
      <div className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        
        {/* Banner Hero */}
        <div className="relative w-full h-40 sm:h-48 rounded-3xl overflow-hidden shadow-xl mb-8 group select-none">
          <img 
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80" 
            alt="Explorar" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none z-0"
            draggable="false"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none z-10"></div>
          
          <div className="absolute bottom-0 left-0 p-5 w-full pointer-events-none z-20">
            <h1 className="text-3xl font-extrabold text-white drop-shadow-md">
              Explorar
            </h1>
            <p className="text-sm font-medium text-white/90 mt-1 max-w-sm drop-shadow-sm">
              Tu centro de control. Descubre retos, ajusta tu perfil y analiza todo tu progreso en un solo lugar.
            </p>
          </div>
        </div>

        {/* Grid de Accesos Directos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <HubButton
            id="hub-tutorials"
            icon={BookOpenIcon}
            title="Tutoriales"
            description="Guías visuales de cada sección"
            onClick={handleOpenTutorials}
            highlight={!hasOpenedTutorials}
          />
          
          <HubButton 
            id="hub-progress"
            onPreload={() => preloadViewChunk('progress')}
            icon={ChartBarIcon}
            title="Tu Progreso"
            description="Estadísticas, RM y volumen"
            onClick={() => setView('progress')}
          />
          
          {!['trainer', 'admin'].includes(userProfile?.role) && (
              <HubButton 
                id="hub-asesoria"
                onPreload={() => preloadViewChunk('asesoria')}
                icon={ChatBubbleLeftRightIcon}
                title="Asesoría"
                description="Habla con tu entrenador"
                onClick={() => {
                  localStorage.setItem(`visited_asesoria_${userProfile?.id}`, 'true');
                  setVisitedAsesoria(true);
                  window.dispatchEvent(new Event('hub-badges-updated'));
                  setView('asesoria');
                }}
                badge={!visitedAsesoria || unreadChats > 0}
                highlight={!visitedAsesoria || unreadChats > 0}
              />
          )}

          <HubButton 
            id="hub-challenges"
            onPreload={() => preloadViewChunk('challenges')}
            icon={TrophyIcon}
            title="Retos y Misiones"
            description="Gana XP y sube de nivel"
            onClick={() => {
              if (userProfile?.id) {
                localStorage.setItem(`visited_challenges_v2_${userProfile.id}`, 'true');
              }
              setVisitedChallenges(true);
              window.dispatchEvent(new Event('hub-badges-updated'));
              setView('challenges');
            }}
            badge={!visitedChallenges}
          />

          <HubButton 
            id="hub-appearance"
            onPreload={() => preloadViewChunk('appearance')}
            icon={PaintBrushIcon}
            title="Apariencia"
            description="Temas, acentos y colores"
            onClick={() => setView('appearance')}
          />

          <HubButton 
            icon={ShareIcon}
            onPreload={() => preloadViewChunk('socialLinks')}
            title="Nuestras Redes"
            description="Instagram, TikTok y YouTube"
            onClick={() => setView('socialLinks')}
          />

          <HubButton 
            id="hub-news"
            onPreload={() => preloadViewChunk('noticias')}
            icon={NewspaperIcon}
            title="Noticias y Artículos"
            description="Ciencia, nutrición y novedades"
            onClick={() => setView('noticias')}
          />
          <HubButton 
            icon={InformationCircleIcon}
            onPreload={() => preloadViewChunk('support')}
            title="Soporte"
            description="Ayuda, descargas y app info"
            onClick={() => setView('support')}
          />

          <HubButton 
            id="hub-settings"
            onPreload={() => preloadViewChunk('settings')}
            icon={Cog8ToothIcon}
            title="Ajustes"
            description="Cuenta, privacidad y notificaciones"
            onClick={() => setView('settings')}
          />

          {(userProfile?.role === 'admin' || userProfile?.role === 'trainer') && (
            <HubButton 
              id="hub-trainer-panel"
              onPreload={() => preloadViewChunk('trainerPanel')}
              icon={UserGroupIcon}
              title="Panel de Entrenador"
              description="Gestión de clientes y cuestionarios"
              onClick={() => setView('trainerPanel')}
              badge={unreadChats > 0}
            />
          )}

          {userProfile?.role === 'admin' && (
            <HubButton 
              id="hub-admin-panel"
              onPreload={() => preloadViewChunk('adminPanel')}
              icon={ShieldCheckIcon}
              title="Panel Admin"
              description="Gestión de usuarios y sistema"
              onClick={() => setView('adminPanel')}
            />
          )}

        </div>

        <button 
          onClick={() => setShowRating(true)}
          className="w-full mt-6 bg-gradient-to-r from-accent to-purple-500 text-accent-contrast p-5 rounded-[24px] flex items-center justify-between transition-all active:scale-95 shadow-[0_8px_30px_var(--color-accent-transparent)] group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex flex-col text-left relative z-10">
            <span className="font-black text-lg md:text-xl">¿Qué nota nos pones?</span>
            <span className="text-sm font-medium opacity-90 mt-1">Danos feedback. Prometemos leerlo mientras descansamos entre series 🏋️‍♂️</span>
          </div>
          <div className="bg-black/10 p-3 rounded-full group-hover:scale-110 transition-transform relative z-10 shrink-0">
            <HeartIcon className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
        </button>

        {showRating && (
          <AppRatingModal 
            visible={showRating} 
            onClose={() => setShowRating(false)} 
            bottomSheet={true}
          />
        )}
        
        {showCoachingPromo && (
          <Suspense fallback={null}>
            <CoachingPromoModal onClose={handleCloseCoachingPromo} />
          </Suspense>
        )}
        {showTutorials && (
          <TutorialsCenter
            userRole={userProfile?.role}
            onClose={() => setShowTutorials(false)}
            onStart={startTutorial}
          />
        )}
        <HubTourGuide />
      </div>
    </div>
  );
}
