import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Info,
  ChevronRight,
  Play,
  Smartphone,
  Download,
  Bug,
  Mail,
  Binary,
  CheckCircle2,
  Calculator,
  Utensils,
  Dumbbell,
  HelpCircle,
  Users,
  Sparkles,
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { APP_VERSION, isNewerVersion } from '../config/version';
import { supportEmail } from '../config/mailContacts';
import useAppStore from '../store/useAppStore';
import GlassCard from '../components/GlassCard';
import BugReportModal from '../components/BugReportModal';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419';
const DEFAULT_APK_URL = 'https://github.com/Deathvks/Pro-Ftiness-Glass/releases/download/v5.1.0/app-release.apk';

const SectionTitle = ({ icon: Icon, title, subtitle, iconBgClass = 'bg-black/5 dark:bg-white/5 text-accent' }) => (
  <div className="mb-6 relative z-10">
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`p-2.5 rounded-[16px] shrink-0 ${iconBgClass}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  </div>
);

const SettingsItem = ({
  id,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  onClick,
  action,
}) => {
  const Component = onClick ? 'button' : 'div';
  const showChevron = Boolean(onClick) && action === undefined;

  return (
    <Component
      id={id}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-start sm:items-center gap-3 sm:gap-4 w-full p-3.5 sm:p-4 rounded-[20px] transition-all duration-300 group text-left border border-black/5 dark:border-white/5
      ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10' : 'bg-black/5 dark:bg-white/5 text-text-primary'}`}
    >
      {Icon && (
        <div
          className={`p-2 sm:p-2.5 rounded-[14px] shrink-0 mt-0.5 sm:mt-0 transition-transform ${onClick ? 'group-hover:scale-110' : ''} ${iconColor ? '' : 'bg-black/5 dark:bg-white/5 text-accent'}`}
          style={iconColor ? { backgroundColor: `${iconColor}1A`, color: iconColor } : undefined}
        >
          <Icon size={20} strokeWidth={2.2} />
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex-1 min-w-[140px]">
          <div className="text-sm font-bold leading-snug text-text-primary break-words">{title}</div>
          {subtitle && (
            <div className="text-[11px] sm:text-xs font-medium mt-0.5 text-text-secondary leading-snug break-words">
              {subtitle}
            </div>
          )}
        </div>
        {action ? (
          <div className="shrink-0">{action}</div>
        ) : showChevron ? (
          <ChevronRight size={18} className="text-text-muted shrink-0" />
        ) : null}
      </div>
    </Component>
  );
};

export default function SupportScreen() {
  const navigate = useNavigate();
  const [apkDownloadUrl, setApkDownloadUrl] = useState(null);
  const [remoteVersion, setRemoteVersion] = useState(null);
  const [isUpToDate, setIsUpToDate] = useState(true);

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
    let isMounted = true;
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          if (!isMounted || !data) return;
          if (data.downloadUrl) {
            setApkDownloadUrl(data.downloadUrl);
          }
          if (data.version) {
            setRemoteVersion(data.version);
            setIsUpToDate(!isNewerVersion(APP_VERSION, data.version));
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener la información de versión dinámica', error);
      }
    };
    fetchVersionInfo();
    return () => {
      isMounted = false;
    };
  }, []);

  const platformLabel = Capacitor.isNativePlatform()
    ? (Capacitor.getPlatform() === 'ios' ? 'App iOS' : 'App Android')
    : 'Web / PWA';

  const glassCardClass =
    'glass p-4 sm:p-6 md:p-8 rounded-[32px] border-none ring-1 ring-black/5 dark:ring-white/10 flex flex-col relative overflow-hidden transition-all duration-300 mb-6';

  return (
    <div id="tutorial-support-main" className="px-3 sm:px-4 pt-6 pb-28 md:pb-8 md:p-8 max-w-4xl mx-auto animate-[fade-in_0.3s_ease-out]">
      <Helmet>
        <title>Soporte - Pro Fitness Glass</title>
      </Helmet>

      <div className="w-full">
        {/* ================= 1. AYUDA Y COMUNIDAD ================= */}
        <GlassCard className={glassCardClass}>
          <SectionTitle
            icon={Info}
            title="Ayuda y Comunidad"
            subtitle="Encuentra descargas, reporta problemas y contacta con soporte."
          />

          <div className="flex flex-col gap-3">
            <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer" className="no-underline">
              <SettingsItem
                icon={Play}
                iconColor="#0A84FF"
                title="Google Play"
                subtitle="Consigue la App oficial"
                action={<ChevronRight size={18} className="text-text-muted" />}
              />
            </a>

            <a
              href={apkDownloadUrl || DEFAULT_APK_URL}
              target="_blank"
              rel="noopener noreferrer"
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
              id="tutorial-support-bug"
              icon={Bug}
              iconColor="#FF453A"
              title="Reportar un problema"
              subtitle="¿Algo no funciona bien?"
              onClick={() => setShowBugModal(true)}
            />

            <a href={`mailto:${supportEmail}`} className="no-underline">
              <SettingsItem
                icon={Mail}
                iconColor="#30D158"
                title="Contactar Soporte"
                subtitle={supportEmail}
                action={<ChevronRight size={18} className="text-text-muted" />}
              />
            </a>
          </div>
        </GlassCard>

        {/* ================= 2. INFORMACIÓN DEL SISTEMA ================= */}
        <GlassCard className={glassCardClass}>
          <SectionTitle
            icon={Binary}
            title="Información del Sistema"
            subtitle="Detalles técnicos y estado de la versión instalada."
          />

          <div className="flex flex-col gap-3">
            <SettingsItem
              icon={Binary}
              iconColor="#5E5CE6"
              title="Versión de App"
              subtitle={`v${APP_VERSION} · ${platformLabel}`}
              action={
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${
                    isUpToDate
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                  }`}
                >
                  <CheckCircle2 size={12} />
                  {isUpToDate ? 'Actualizada' : `v${remoteVersion || 'Nueva'} disp.`}
                </span>
              }
            />

            <SettingsItem
              icon={Sparkles}
              title="Novedades de la versión"
              subtitle={`Ver qué incluye la versión v${APP_VERSION}`}
              onClick={() => useAppStore.setState({ showWelcomeModal: true })}
            />
          </div>
        </GlassCard>

        {/* ================= 3. HERRAMIENTAS Y GUÍAS PÚBLICAS ================= */}
        <GlassCard className={glassCardClass}>
          <SectionTitle
            icon={Calculator}
            iconBgClass="bg-emerald-500/15 text-emerald-500"
            title="Herramientas y Guías Públicas"
            subtitle="Utilidades deportivas gratuitas y documentación oficial."
          />

          <div className="flex flex-col gap-3">
            <SettingsItem
              icon={Calculator}
              iconColor="#0A84FF"
              title="Calculadora de 1RM"
              subtitle="Epley, Brzycki y Lander + zonas de carga"
              onClick={() => navigate('/calculadora-1rm')}
            />

            <SettingsItem
              icon={Utensils}
              iconColor="#30D158"
              title="Calculadora de Calorías y Macros"
              subtitle="TMB, TDEE, proteínas, hidratación y creatina"
              onClick={() => navigate('/calculadora-calorias-macros')}
            />

            <SettingsItem
              icon={Dumbbell}
              iconColor="#FF9F0A"
              title="Guía Técnica de Ejercicios"
              subtitle="Técnica paso a paso, errores comunes y rutinas"
              onClick={() => navigate('/ejercicios')}
            />

            <SettingsItem
              icon={HelpCircle}
              iconColor="#AF52DE"
              title="Preguntas Frecuentes (FAQ)"
              subtitle="Respuestas rápidas sobre la app, IA y 2FA"
              onClick={() => navigate('/faq')}
            />

            <SettingsItem
              icon={Users}
              iconColor="#5E5CE6"
              title="Sobre Nosotros"
              subtitle="Misión gratuita, módulos y desarrollador"
              onClick={() => navigate('/sobre-nosotros')}
            />
          </div>
        </GlassCard>
      </div>

      {showBugModal && <BugReportModal onClose={() => setShowBugModal(false)} />}
    </div>
  );
}
