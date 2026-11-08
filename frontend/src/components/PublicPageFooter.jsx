/* frontend/src/components/PublicPageFooter.jsx */
import React from 'react';
import { Link } from 'react-router-dom';
import { preloadViewChunk } from '../App';
import { 
  FaGooglePlay, 
  FaInstagram, 
  FaTiktok, 
  FaYoutube, 
  FaGithub, 
  FaHeart,
  FaCalculator,
  FaFire,
  FaDumbbell,
  FaNewspaper,
  FaCircleQuestion,
  FaUsers,
  FaShieldHalved,
  FaScaleBalanced
} from 'react-icons/fa6';

export default function PublicPageFooter({ className = '' }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mt-14 pt-8 pb-12 border-t border-glass-border/60 text-text-secondary ${className}`}>
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6">
        
        {/* Cabecera / Marca del Footer */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-8 border-b border-glass-border/40 text-center sm:text-left">
          <div className="space-y-2 max-w-md">
            <Link to="/" className="inline-flex items-center gap-2.5 group outline-none">
              <img 
                src="/icons/icon-96.png" 
                alt="Logo Pro Fitness Glass" 
                className="w-9 h-9 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform" 
              />
              <span className="text-base sm:text-lg font-black tracking-tight text-text-primary">
                Pro Fitness Glass
              </span>
            </Link>
            <p className="text-xs text-text-tertiary leading-relaxed">
              Software deportivo libre y 100% gratuito. Sobrecarga progresiva, vídeos biomecánicos, nutrición científica y cronómetro en segundo plano sin suscripciones.
            </p>
          </div>

          {/* Redes Sociales y Tiendas Oficiales */}
          <div className="flex flex-col items-center sm:items-end gap-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              Canales y Código
            </span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <a 
                href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Google Play Store"
                title="Google Play Store"
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-center text-text-secondary hover:text-[#4285F4] hover:border-[#4285F4]/40 hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <FaGooglePlay size={14} />
              </a>
              <a 
                href="https://www.instagram.com/pro_fitness_glass/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram"
                title="Instagram"
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-center text-text-secondary hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <FaInstagram size={15} />
              </a>
              <a 
                href="https://www.tiktok.com/@pro_fitness_glass" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="TikTok"
                title="TikTok"
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-center text-text-secondary hover:text-[#00f2fe] hover:border-[#00f2fe]/40 hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <FaTiktok size={14} />
              </a>
              <a 
                href="https://www.youtube.com/@ProFitnessGlass" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="YouTube"
                title="YouTube"
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-center text-text-secondary hover:text-[#FF0000] hover:border-[#FF0000]/40 hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <FaYoutube size={15} />
              </a>
              <a 
                href="https://github.com/Deathvks/Pro-Ftiness-Glass" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="GitHub"
                title="GitHub"
                className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/5 border border-glass-border flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-text-primary/40 hover:scale-110 active:scale-95 transition-all shadow-sm"
              >
                <FaGithub size={15} />
              </a>
            </div>
          </div>
        </div>

        {/* Bloque de Enlaces en Grid Responsive (1 columna en móvil, 3 en escritorio) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 py-8 text-left">
          
          {/* Sección 1: Calculadoras y Ejercicios */}
          <div className="p-4 sm:p-0 rounded-2xl bg-black/5 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent border border-glass-border sm:border-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-primary mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Herramientas Deportivas</span>
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/calculadora-1rm" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaCalculator size={13} className="text-accent shrink-0" />
                  <span className="font-semibold">Calculadora 1RM (Fuerza Máxima)</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/calculadora-calorias-macros" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaFire size={13} className="text-rose-400 shrink-0" />
                  <span className="font-semibold">Calculadora de Calorías y Macros</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/ejercicios" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaDumbbell size={13} className="text-sky-400 shrink-0" />
                  <span className="font-semibold">Guía y Enciclopedia de Ejercicios</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Sección 2: Plataforma y Comunidad */}
          <div className="p-4 sm:p-0 rounded-2xl bg-black/5 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent border border-glass-border sm:border-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-primary mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              <span>Plataforma y Ciencia</span>
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/sobre-nosotros" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaUsers size={13} className="text-emerald-400 shrink-0" />
                  <span className="font-semibold">¿Quiénes Somos y Misión?</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/faq" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaCircleQuestion size={13} className="text-amber-400 shrink-0" />
                  <span className="font-semibold">Preguntas Frecuentes (FAQ)</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/noticias" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaNewspaper size={13} className="text-purple-400 shrink-0" />
                  <span className="font-semibold">Portal de Artículos y Noticias</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Sección 3: Legal y Descarga */}
          <div className="p-4 sm:p-0 rounded-2xl bg-black/5 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent border border-glass-border sm:border-0">
            <h4 className="text-xs font-black uppercase tracking-wider text-text-primary mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Legal y Privacidad</span>
            </h4>
            <ul className="space-y-1 text-xs">
              <li>
                <Link 
                  to="/privacy" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaShieldHalved size={13} className="text-sky-400 shrink-0" />
                  <span className="font-semibold">Política de Privacidad</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-black/10 dark:bg-white/10 shrink-0 inline-flex items-center justify-center text-[10px] font-bold">§</span>
                  <span className="font-semibold">Términos del Servicio</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/aviso-legal" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <FaScaleBalanced size={13} className="text-amber-400 shrink-0" />
                  <span className="font-semibold">Aviso Legal (LSSI-CE)</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookies" 
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors"
                >
                  <span className="w-3.5 h-3.5 rounded-full bg-accent/20 text-accent shrink-0 inline-flex items-center justify-center text-[10px] font-bold">🍪</span>
                  <span className="font-semibold">Política de Cookies</span>
                </Link>
              </li>
              <li>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-2 px-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:text-accent transition-colors text-emerald-400"
                >
                  <FaGooglePlay size={13} className="shrink-0" />
                  <span className="font-bold">App Oficial en Google Play</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Franja Inferior: Copyright & Autor */}
        <div className="pt-6 border-t border-glass-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-tertiary text-center sm:text-left">
          <p className="leading-relaxed">
            © {currentYear} <strong className="text-text-secondary font-bold">Pro Fitness Glass</strong> — Creado y desarrollado por <strong className="text-text-primary font-bold">Dylan Jesús Suárez Falcón</strong>.
          </p>
          <div className="flex items-center gap-1.5 shrink-0 text-text-secondary">
            <span>Hecho con dedicación para atletas reales</span>
            <FaHeart size={11} className="text-rose-500 fill-rose-500 animate-pulse inline" />
          </div>
        </div>

      </div>
    </footer>
  );
}
