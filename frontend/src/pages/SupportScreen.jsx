import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  Info, ChevronRight, Play, Smartphone, Download, Bug, Mail, Binary, ChevronLeft
} from 'lucide-react';
import { APP_VERSION } from '../config/version';
import GlassCard from '../components/GlassCard';
import BugReportModal from '../components/BugReportModal';

const isAndroidWebOrPWA = () => {
  if (typeof navigator === 'undefined') return false;
  const isAndroid = /android/i.test(navigator.userAgent);
  const isNative = window.Capacitor?.isNativePlatform?.() || false;
  return isAndroid && !isNative;
};

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



export default function SupportScreen({ setView }) {
  const showGooglePlayLink = isAndroidWebOrPWA();
  const [apkDownloadUrl, setApkDownloadUrl] = useState(null);
  
  const [showBugModal, setShowBugModal] = useState(() => {
    try {
      const draftStr = localStorage.getItem('bug_report_draft');
      if (!draftStr) return false;
      const draft = JSON.parse(draftStr);
      return !!(draft.hasContent || draft.category || draft.subject?.trim() || draft.description?.trim());
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (data && data.downloadUrl) {
            setApkDownloadUrl(data.downloadUrl);
          }
        }
      } catch (error) {
        console.warn("No se pudo obtener la información de versión dinámica", error);
      }
    };
    fetchVersionInfo();
  }, []);

  const glassCardClass = "glass p-6 sm:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300 mb-6";

  return (
    <div className="px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-4xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Soporte - Pro Fitness Glass</title>
      </Helmet>
      


      <div className="w-full">
        <GlassCard className={glassCardClass}>
          <SectionTitle icon={Info} title="Ayuda y Comunidad" />
          <p className="text-sm text-text-secondary mb-6 ml-1">
            Encuentra descargas, reporta problemas y únete a nuestra comunidad.
          </p>
          <div className="flex flex-col gap-3">

            {showGooglePlayLink && (
              <a href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419" target="_blank" rel="noopener noreferrer" className="no-underline">
                <SettingsItem
                  icon={Play}
                  title="Google Play"
                  subtitle="Consigue la App oficial"
                  action={<ChevronRight size={18} className="text-text-muted" />}
                />
              </a>
            )}

            <a
              href={apkDownloadUrl || "https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.1.0/app-release.apk"}
              className="no-underline"
            >
              <SettingsItem
                icon={Smartphone}
                title="Descargar App Android"
                subtitle="Instalar APK nativo"
                action={<Download size={18} className="text-accent shrink-0" />}
              />
            </a>

            <SettingsItem
              icon={Bug}
              title="Reportar un problema"
              subtitle="¿Algo no funciona bien?"
              onClick={() => setShowBugModal(true)}
              action={<ChevronRight size={18} className="text-text-muted" />}
            />

            <a href="mailto:profitnessglass@gmail.com" className="no-underline">
              <SettingsItem icon={Mail} title="Contactar Soporte" subtitle="profitnessglass@gmail.com" />
            </a>

            <div className="my-4" />
            <SectionTitle icon={Binary} title="App Info" />

            <div className="flex items-center gap-4 w-full p-4 rounded-[20px] bg-black/5 dark:bg-white/5 text-text-primary">
              <div className="p-2.5 rounded-[14px] bg-black/5 dark:bg-white/5 text-accent shrink-0">
                <Binary size={20} />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="text-sm font-bold truncate">Versión de App</div>
                <div className="text-[10px] sm:text-xs text-text-secondary font-medium truncate mt-0.5">v{APP_VERSION}</div>
              </div>
            </div>


          </div>
        </GlassCard>
      </div>

      {showBugModal && <BugReportModal onClose={() => setShowBugModal(false)} />}
    </div>
  );
}
