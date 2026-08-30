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
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import GlassCard from '../components/GlassCard';
import useAppStore from '../store/useAppStore';
import HubTourGuide from '../components/HubTourGuide';
const CoachingPromoModal = lazy(() => import('../components/CoachingPromoModal'));

const HubButton = ({ id, icon: Icon, title, description, onClick, isComingSoon, badge }) => (
  <button 
    id={id}
    onClick={onClick}
    disabled={isComingSoon}
    className={`w-full flex items-center justify-between p-4 glass rounded-2xl transition-all duration-300 ${isComingSoon ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 hover:bg-glass-border/30'}`}
  >
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0">
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
          {badge && !isComingSoon && (
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
  const [visitedChallenges, setVisitedChallenges] = React.useState(true);
  const [visitedAsesoria, setVisitedAsesoria] = React.useState(true);
  const [showCoachingPromo, setShowCoachingPromo] = useState(false);

  React.useEffect(() => {
    if (userProfile?.id) {
      setVisitedChallenges(localStorage.getItem(`visited_challenges_v2_${userProfile.id}`) === 'true');
      setVisitedAsesoria(localStorage.getItem(`visited_asesoria_${userProfile.id}`) === 'true');
      
      // Show coaching promo if user hasn't seen it yet and is NOT a trainer/admin
      if (!['trainer', 'admin'].includes(userProfile?.role)) {
        const hasSeen = localStorage.getItem(`coaching_promo_seen_${userProfile.id}`);
        if (!hasSeen) {
          setShowCoachingPromo(true);
        }
      }
    }
  }, [userProfile?.id, userProfile?.role]);

  const handleCloseCoachingPromo = () => {
    setShowCoachingPromo(false);
    if (userProfile?.id) {
      localStorage.setItem(`coaching_promo_seen_${userProfile.id}`, 'true');
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
            id="hub-progress"
            icon={ChartBarIcon}
            title="Tu Progreso"
            description="Estadísticas, RM y volumen"
            onClick={() => setView('progress')}
          />
          
          {!['trainer', 'admin'].includes(userProfile?.role) && (
            <HubButton 
              id="hub-asesoria"
              icon={ChatBubbleLeftRightIcon}
              title="Asesoría"
              description="Habla con tu entrenador"
              onClick={() => {
                localStorage.setItem(`visited_asesoria_${userProfile?.id}`, 'true');
                setVisitedAsesoria(true);
                setView('asesoria');
              }}
              badge={!visitedAsesoria}
            />
          )}

          <HubButton 
            id="hub-challenges"
            icon={TrophyIcon}
            title="Retos y Misiones"
            description="Gana XP y sube de nivel"
            onClick={() => setView('challenges')}
            badge={!visitedChallenges}
          />

          <HubButton 
            id="hub-appearance"
            icon={PaintBrushIcon}
            title="Apariencia"
            description="Temas, acentos y colores"
            onClick={() => setView('appearance')}
          />

          <HubButton 
            icon={ShareIcon}
            title="Nuestras Redes"
            description="Instagram, TikTok y YouTube"
            onClick={() => setView('socialLinks')}
          />

          <HubButton 
            icon={InformationCircleIcon}
            title="Soporte"
            description="Ayuda, descargas y app info"
            onClick={() => setView('support')}
          />

          <HubButton 
            id="hub-settings"
            icon={Cog8ToothIcon}
            title="Ajustes"
            description="Cuenta, privacidad y notificaciones"
            onClick={() => setView('settings')}
          />

          {(userProfile?.role === 'admin' || userProfile?.role === 'trainer') && (
            <HubButton 
              id="hub-trainer-panel"
              icon={UserGroupIcon}
              title="Panel de Entrenador"
              description="Gestión de clientes y cuestionarios"
              onClick={() => setView('trainerPanel')}
            />
          )}

          {userProfile?.role === 'admin' && (
            <HubButton 
              id="hub-admin-panel"
              icon={ShieldCheckIcon}
              title="Panel Admin"
              description="Gestión de usuarios y sistema"
              onClick={() => setView('adminPanel')}
            />
          )}

        </div>
        
        {showCoachingPromo && (
          <Suspense fallback={null}>
            <CoachingPromoModal onClose={handleCloseCoachingPromo} />
          </Suspense>
        )}
        <HubTourGuide />
      </div>
    </div>
  );
}
