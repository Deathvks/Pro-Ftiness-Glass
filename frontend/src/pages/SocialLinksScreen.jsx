import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, Share2, Instagram, ChevronLeft } from 'lucide-react';
import GlassCard from '../components/GlassCard';

const SectionTitle = ({ icon: Icon, title }) => (
  <div className="flex items-center gap-3 mb-6 relative z-10">
    <div className="p-2.5 rounded-[16px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
      <Icon size={24} strokeWidth={2.5} />
    </div>
    <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">{title}</h2>
  </div>
);

const SettingsItem = ({ icon: Icon, title, subtitle, onClick, action }) => {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`flex items-center gap-3 sm:gap-4 w-full p-4 rounded-[20px] transition-all duration-300 group text-left
      ${onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10' : 'bg-black/5 dark:bg-white/5 text-text-primary'}`}
    >
      {Icon && (
        <div className={`p-2.5 rounded-[14px] shrink-0 transition-transform ${onClick ? 'group-hover:scale-110' : ''} bg-black/5 dark:bg-white/5 text-text-secondary group-hover:text-accent`}>
          <Icon size={20} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold leading-tight text-text-primary">{title}</div>
        {subtitle && <div className="text-[10px] sm:text-xs font-medium mt-0.5 text-text-secondary">{subtitle}</div>}
      </div>
      {action && <div className="shrink-0 ml-1 sm:ml-2">{action}</div>}
    </Component>
  );
};

const TikTokIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const YoutubeIcon = ({ size = 20, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

export default function SocialLinksScreen({ setView }) {
  const glassCardClass = "glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300 mb-6";

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-4xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Nuestras Redes - Pro Fitness Glass</title>
      </Helmet>
      


      <div className="w-full">
        <GlassCard className={glassCardClass}>
          <SectionTitle icon={Share2} title="Nuestras Redes" />
          <p className="text-sm text-text-secondary mb-6 ml-1">
            Síguenos en nuestras redes para rutinas exclusivas y novedades.
          </p>
          <div className="flex flex-col gap-3">
            <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="no-underline">
              <SettingsItem
                icon={Instagram}
                title="Instagram"
                subtitle="@pro_fitness_glass"
                action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
              />
            </a>
            <a href="https://www.tiktok.com/@pro_fitness_glass" target="_blank" rel="noopener noreferrer" className="no-underline">
              <SettingsItem
                icon={TikTokIcon}
                title="TikTok"
                subtitle="@pro_fitness_glass"
                action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
              />
            </a>
            <a href="https://www.youtube.com/@ProFitnessGlass" target="_blank" rel="noopener noreferrer" className="no-underline">
              <SettingsItem
                icon={YoutubeIcon}
                title="YouTube"
                subtitle="@ProFitnessGlass"
                action={<ChevronRight size={18} className="text-text-muted shrink-0" />}
              />
            </a>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
