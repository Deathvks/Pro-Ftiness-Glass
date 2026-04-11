/* frontend/src/pages/LandingPage.jsx */
import React, { useEffect, useState, useRef } from 'react';
import {
    Dumbbell, Activity, Shield, ChevronRight, ChevronLeft, Utensils,
    LineChart, Users, Zap, Smartphone, Trophy, ArrowRight,
    Instagram, Youtube, Github, Globe, Download, Sparkles, Bot, Apple, Check
} from 'lucide-react';
import { FaGooglePlay } from 'react-icons/fa';

import packageJson from '../../package.json';
import socialService from '../services/socialService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BACKEND_BASE_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;

// --- COMPONENTES AUXILIARES ---

const TikTokIcon = ({ size = 20, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

const useIntersectionObserver = (options = {}) => {
    const { threshold = 0, rootMargin = '400px', triggerOnce = true } = options;
    const [isIntersecting, setIsIntersecting] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const rootElement = document.getElementById('landing-scroll-container');

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsIntersecting(true);
                if (triggerOnce && elementRef.current) {
                    observer.unobserve(elementRef.current);
                }
            }
        }, {
            root: rootElement || null,
            threshold,
            rootMargin
        });

        const currentElement = elementRef.current;
        if (currentElement) {
            observer.observe(currentElement);
        }

        return () => {
            if (currentElement) observer.unobserve(currentElement);
        };
    }, [threshold, rootMargin, triggerOnce]);

    return [elementRef, isIntersecting];
};

// --- ANIMACIONES SVG FLOTANTES ---
const FloatingHeroElements = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10 hidden sm:block transform-gpu" aria-hidden="true">
        <style>{`
            @keyframes float-1 {
                0% { transform: translateY(0px) rotate(0deg) translateZ(0); }
                50% { transform: translateY(-20px) rotate(10deg) translateZ(0); }
                100% { transform: translateY(0px) rotate(0deg) translateZ(0); }
            }
            @keyframes float-2 {
                0% { transform: translateY(0px) rotate(0deg) scale(1) translateZ(0); }
                50% { transform: translateY(-15px) rotate(-8deg) scale(1.05) translateZ(0); }
                100% { transform: translateY(0px) rotate(0deg) scale(1) translateZ(0); }
            }
            @keyframes float-3 {
                0% { transform: translateY(0px) rotate(0deg) translateZ(0); }
                50% { transform: translateY(15px) rotate(15deg) translateZ(0); }
                100% { transform: translateY(0px) rotate(0deg) translateZ(0); }
            }
        `}</style>

        <div className="absolute top-[5%] right-[5%] lg:right-[8%] opacity-60 animate-[float-2_7s_ease-in-out_infinite]">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="url(#ai-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_20px_rgba(139,92,246,0.6)]">
                <defs>
                    <linearGradient id="ai-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#8b5cf6" />
                        <stop offset="1" stopColor="#ec4899" />
                    </linearGradient>
                </defs>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                <circle cx="12" cy="12" r="4" className="animate-[spin_4s_linear_infinite]" />
            </svg>
        </div>

        <div className="absolute bottom-[10%] lg:bottom-[20%] left-[2%] lg:left-[5%] opacity-50 animate-[float-1_6s_ease-in-out_infinite]">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="url(#workout-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_20px_rgba(59,130,246,0.6)] transform -rotate-12">
                <defs>
                    <linearGradient id="workout-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#3b82f6" />
                        <stop offset="1" stopColor="#8b5cf6" />
                    </linearGradient>
                </defs>
                <path d="m6.5 6.5 11 11" />
                <path d="m21 21-1-1" />
                <path d="m3 3 1 1" />
                <path d="m18 22 4-4" />
                <path d="m2 6 4-4" />
                <path d="m3 10 7-7" />
                <path d="m14 21 7-7" />
            </svg>
        </div>

        <div className="absolute top-[12%] left-[5%] lg:left-[10%] opacity-40 animate-[float-3_8s_ease-in-out_infinite]">
            <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="url(#food-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] transform rotate-12">
                <defs>
                    <linearGradient id="food-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#10b981" />
                        <stop offset="1" stopColor="#3b82f6" />
                    </linearGradient>
                </defs>
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                <path d="M12 4v-2c0-1.1.9-2 2-2" />
                <path d="M12 12h.01" />
            </svg>
        </div>
    </div>
);

const GymBot = ({ isDocked }) => (
    <div
        aria-hidden="true"
        className={`fixed z-30 transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none origin-right transform-gpu will-change-transform
            ${isDocked
                ? 'top-1/2 right-4 sm:right-8 -translate-y-1/2 scale-50 sm:scale-60 opacity-80'
                : 'top-[22%] sm:top-[25%] right-10 sm:right-8 lg:right-16 scale-75 sm:scale-100 opacity-100'
            }
        `}
        style={{ WebkitTransform: isDocked ? 'translateY(-50%) translateZ(0)' : 'translateZ(0)' }}
    >
        <style>{`
            @keyframes gymbot-roam {
                0% { transform: translate(0, 0) rotate(0deg) translateZ(0); }
                25% { transform: translate(-15px, -10px) rotate(-3deg) translateZ(0); }
                50% { transform: translate(0, 15px) rotate(0deg) translateZ(0); }
                75% { transform: translate(10px, -10px) rotate(3deg) translateZ(0); }
                100% { transform: translate(0, 0) rotate(0deg) translateZ(0); }
            }
        `}</style>

        <div
            className="w-40 h-40 relative group cursor-pointer perspective-1000 sm:pointer-events-auto transform-gpu"
            style={{ animation: 'gymbot-roam 8s infinite ease-in-out' }}
        >
            <div className="w-full h-full relative animate-[bounce_4s_infinite_ease-in-out] group-hover:[animation-play-state:paused] transform-gpu">

                <div
                    className={`absolute inset-4 rounded-[2.5rem] flex flex-col items-center justify-center z-20 transition-all duration-500 group-hover:scale-105 
                    bg-gradient-to-br from-white/90 to-white/60 
                    border border-white/50 
                    shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)]
                    dark:bg-gradient-to-br dark:from-gray-800/90 dark:to-black/60
                    dark:border-white/10
                    dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transform-gpu
                    ${isDocked ? 'shadow-accent/40 dark:shadow-accent/20' : ''}
                    `}
                    style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
                >
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-[2.5rem] pointer-events-none"></div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-gray-300 dark:bg-gray-600 rounded-full transition-all group-hover:h-8"></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-accent animate-pulse shadow-[0_0_15px_var(--accent)] group-hover:scale-125 transition-transform z-10 transform-gpu"></div>

                    <div className="relative w-full px-6 py-2 flex flex-col items-center gap-3 z-10">
                        <div className="flex gap-6 w-full justify-center">
                            <div className="w-3.5 h-5 bg-accent rounded-full animate-[pulse_3s_infinite] shadow-[0_0_12px_var(--accent)] transform-gpu"></div>
                            <div className="w-3.5 h-5 bg-accent rounded-full animate-[pulse_3s_infinite] delay-100 shadow-[0_0_12px_var(--accent)] transform-gpu"></div>
                        </div>
                        <div className="w-6 h-3 bg-gray-400/50 dark:bg-gray-500/50 rounded-b-full group-hover:bg-accent/80 transition-colors group-hover:scale-110 transform-gpu"></div>
                    </div>
                </div>

                <div className="absolute top-1/2 -left-7 w-12 h-12 flex items-center justify-center origin-right animate-[spin_4s_ease-in-out_infinite_alternate] transform-gpu">
                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 absolute right-0 rounded-full"></div>
                    <div className="absolute left-0 p-1.5 bg-accent rounded-lg shadow-lg text-white transform -rotate-90 border border-white/20">
                        <Dumbbell size={18} fill="currentColor" />
                    </div>
                </div>

                <div className="absolute top-1/2 -right-7 w-12 h-12 flex items-center justify-center origin-left animate-[spin_4s_ease-in-out_infinite_alternate-reverse] transform-gpu">
                    <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 absolute left-0 rounded-full"></div>
                    <div className="absolute right-0 p-1.5 bg-accent rounded-lg shadow-lg text-white transform rotate-90 border border-white/20">
                        <Dumbbell size={18} fill="currentColor" />
                    </div>
                </div>

                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-4 bg-accent/20 blur-xl rounded-[100%] animate-[pulse_2s_infinite_ease-in-out] transform-gpu"></div>

                <div className={`absolute -top-24 -left-28 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-2xl rounded-br-none text-xs font-bold text-accent shadow-xl transition-all duration-500 transform-gpu origin-bottom-right z-30
                    ${isDocked ? 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 -translate-y-2 group-hover:translate-y-0' : 'opacity-0'}
                `}>
                    ¡Dale caña! 🔥
                </div>
            </div>
        </div>
    </div>
);

const ScrollRevealCard = ({ children, delay = 0, className = "" }) => {
    const [ref, isVisible] = useIntersectionObserver();

    return (
        <div
            ref={ref}
            className={`transform-gpu will-change-transform will-change-opacity transition-all duration-700 ease-out ${className}
                ${isVisible
                    ? 'opacity-100 translate-y-0 scale-100'
                    : 'opacity-0 translate-y-12 scale-95'
                }
            `}
            style={{
                transitionDelay: `${delay}ms`,
                WebkitTransform: isVisible ? 'translate3d(0, 0, 0) scale(1)' : 'translate3d(0, 3rem, 0) scale(0.95)'
            }}
        >
            {children}
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }) => (
    <ScrollRevealCard delay={delay} className="h-full">
        <div className="h-full p-6 rounded-3xl bg-glass-base border border-glass-border backdrop-blur-md flex flex-col items-center text-center hover:border-accent/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/10 group relative overflow-hidden transform-gpu">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform-gpu" />
            <div className="relative z-10 p-5 rounded-2xl bg-accent/10 text-accent mb-8 group-hover:bg-accent group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-sm transform-gpu">
                <Icon size={32} strokeWidth={1.5} />
            </div>
            <h3 className="relative z-10 font-bold text-text-primary text-xl mb-4">{title}</h3>
            <p className="relative z-10 text-sm text-text-secondary leading-relaxed">{desc}</p>
        </div>
    </ScrollRevealCard>
);

const BentoCard = ({ children, className = "", delay = 0, bgIcon: BgIcon, bgIconColor = "text-text-primary" }) => (
    <ScrollRevealCard delay={delay} className={className}>
        <div className="h-full p-8 rounded-[2rem] bg-gradient-to-br from-glass-base via-glass-base/50 to-transparent border border-glass-border backdrop-blur-xl hover:border-accent/30 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/10 group relative overflow-hidden transform-gpu">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none transform-gpu"></div>

            {BgIcon && (
                <div className={`absolute -bottom-12 -right-12 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700 pointer-events-none transform-gpu ${bgIconColor}`}>
                    <BgIcon size={240} />
                </div>
            )}

            {children}
        </div>
    </ScrollRevealCard>
);

const MockupGallery = () => {
    const scrollRef = useRef(null);
    const images = [
        { src: '/aver.jpg', alt: 'Dashboard' },
        { src: '/entrenamiento.png', alt: 'Entrenamiento' },
        { src: '/graficas.png', alt: 'Gráficas' },
        { src: '/nutrición.png', alt: 'Nutrición' },
        { src: '/social.png', alt: 'Social' },
        { src: '/perfil.png', alt: 'Perfil' },
        { src: '/ajustes.png', alt: 'Ajustes' },
        { src: '/mapa.png', alt: 'Mapa' }
    ];

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = window.innerWidth > 640 ? 320 : 250;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="w-full mt-16 mb-8 relative z-20 group">
            <ScrollRevealCard delay={200}>
                <button
                    onClick={() => scroll('left')}
                    className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-glass-base/90 hover:bg-bg-secondary text-text-primary hover:text-accent rounded-full items-center justify-center backdrop-blur-md border border-glass-border hover:border-accent/50 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:scale-110 transform-gpu"
                >
                    <ChevronLeft size={24} />
                </button>
                <button
                    onClick={() => scroll('right')}
                    className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-glass-base/90 hover:bg-bg-secondary text-text-primary hover:text-accent rounded-full items-center justify-center backdrop-blur-md border border-glass-border hover:border-accent/50 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:scale-110 transform-gpu"
                >
                    <ChevronRight size={24} />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-6 overflow-x-auto py-10 px-4 sm:px-12 snap-x snap-mandatory hide-scrollbar relative"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    {images.map((img, i) => (
                        <div key={i} className="snap-center shrink-0 w-[240px] sm:w-[280px] relative transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-accent/20 rounded-[3rem] transform-gpu">
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="w-full h-auto object-contain rounded-[3rem]"
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            </ScrollRevealCard>
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---

const LandingPage = ({ onLogin, onRegister }) => {
    const currentYear = new Date().getFullYear();
    const appVersion = packageJson.version;

    const [isVisible, setIsVisible] = useState(false);
    const [isDocked, setIsDocked] = useState(false);
    const [communityUsers, setCommunityUsers] = useState([]);
    const [apkDownloadUrl, setApkDownloadUrl] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        setIsVisible(true);

        const fetchCommunityPreview = async () => {
            try {
                const response = await socialService.getLeaderboard();
                const usersList = Array.isArray(response) ? response : (response.data || []);

                const validUsers = usersList
                    .filter(user => user.profile_image_url)
                    .slice(0, 5)
                    .map(user => {
                        if (user.profile_image_url.startsWith('http')) {
                            return user.profile_image_url;
                        }
                        return `${BACKEND_BASE_URL}${user.profile_image_url}`;
                    });

                setCommunityUsers(validUsers);
            } catch (error) {
                console.log('Modo vista previa: No se pudieron cargar avatares reales.', error);
            }
        };

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

        fetchCommunityPreview();
        fetchVersionInfo();
    }, []);

    const handleScroll = (e) => {
        const scrollTop = e.target.scrollTop;
        const shouldBeDocked = scrollTop > 200;

        if (isDocked !== shouldBeDocked) {
            setIsDocked(shouldBeDocked);
        }
    };

    return (
        <div
            id="landing-scroll-container"
            ref={containerRef}
            onScroll={handleScroll}
            className="absolute inset-0 z-[100] bg-bg-primary text-text-primary overflow-y-auto overflow-x-hidden font-sans custom-scrollbar scroll-smooth transform-gpu"
            style={{ WebkitOverflowScrolling: 'touch' }}
        >
            <svg width="0" height="0" className="absolute pointer-events-none">
                <defs>
                    <linearGradient id="play-grad-vibrant" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop stopColor="#4285F4" offset="0%" />
                        <stop stopColor="#34A853" offset="33%" />
                        <stop stopColor="#FBBC05" offset="66%" />
                        <stop stopColor="#EA4335" offset="100%" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Ruido SVG fijo de fondo */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0" aria-hidden="true">
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
            </div>

            <FloatingHeroElements />
            <GymBot isDocked={isDocked} />

            {/* Contenedor relativo principal que engloba todo el contenido con scroll */}
            <div className="relative z-10 flex flex-col min-h-full">

                {/* --- NUEVO: Círculos de colores distribuidos por toda la página --- */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
                    <div className="absolute top-[0%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-15 dark:opacity-20 animate-[pulse_10s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)' }} />
                    <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 dark:opacity-15 animate-[pulse_12s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)', animationDelay: '2s' }} />
                    <div className="absolute top-[40%] left-[-5%] w-[700px] h-[700px] rounded-full blur-[150px] opacity-10 dark:opacity-15 animate-[pulse_14s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, #a855f7, transparent)', animationDelay: '4s' }} />
                    <div className="absolute top-[65%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 dark:opacity-15 animate-[pulse_11s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, #10b981, transparent)', animationDelay: '1s' }} />
                    <div className="absolute top-[85%] left-[-10%] w-[800px] h-[800px] rounded-full blur-[150px] opacity-15 dark:opacity-20 animate-[pulse_13s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, rgb(var(--accent-r), var(--accent-g), var(--accent-b)), transparent)', animationDelay: '3s' }} />
                    <div className="absolute bottom-[0%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] opacity-10 dark:opacity-15 animate-[pulse_10s_ease-in-out_infinite] transform-gpu" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', animationDelay: '5s' }} />
                </div>
                {/* ---------------------------------------------------------------- */}

                {/* --- NAVBAR --- */}
                <nav className={`sticky top-0 z-50 transition-all duration-500 border-b transform-gpu ${isDocked ? 'bg-bg-primary/80 backdrop-blur-xl border-glass-border shadow-sm' : 'bg-transparent border-transparent'}`} aria-label="Navegación principal">
                    <div className="flex justify-between items-center p-4 sm:px-8 max-w-7xl mx-auto w-full relative z-10">
                        <div
                            className="flex items-center gap-4 cursor-pointer group"
                            onClick={() => containerRef.current.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <img src="/logo.webp" alt="Pro Fitness Glass Logo" className="w-10 h-10 group-hover:scale-110 transition-transform duration-300" />
                            <span className="font-black text-xl tracking-tighter hidden sm:block bg-clip-text text-transparent bg-gradient-to-r from-text-primary to-text-secondary group-hover:to-accent transition-all duration-500">
                                PRO FITNESS GLASS
                            </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-5">
                            <a
                                href="/privacy"
                                className="flex items-center gap-2.5 text-xs font-medium text-text-secondary hover:text-accent transition-colors mr-1 outline-none border-none focus:outline-none"
                                title="Política de Privacidad"
                            >
                                <Shield size={16} className="md:hidden" />
                                <span className="hidden md:inline">Privacidad</span>
                            </a>

                            <button
                                onClick={onLogin}
                                className="text-sm font-semibold text-text-secondary hover:text-accent transition-colors px-4 py-2 hover:bg-glass-base rounded-lg"
                            >
                                Iniciar Sesión
                            </button>

                            <button
                                onClick={onRegister}
                                className="text-sm font-bold bg-accent hover:bg-accent/90 text-white px-6 py-2.5 rounded-full transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-3"
                            >
                                Empezar
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                </nav>

                {/* --- HERO SECTION --- */}
                <main className="flex-grow flex flex-col items-center px-4 pt-12 pb-24 text-center w-full max-w-7xl mx-auto overflow-x-hidden relative z-10">

                    <div className="h-32 sm:h-28 md:h-12 lg:h-6 w-full mb-8 sm:mb-16 md:mb-6 lg:mb-4 pointer-events-none" aria-hidden="true"></div>

                    <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full bg-glass-base border border-white/20 dark:border-white/10 mb-8 backdrop-blur-md shadow-sm transition-all duration-1000 delay-100 transform-gpu ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
                        </span>
                        <span className="text-xs font-bold text-text-primary tracking-wide uppercase">Versión {appVersion}</span>
                    </div>

                    <div className={`space-y-6 max-w-5xl mx-auto transition-all duration-1000 delay-200 transform-gpu ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                        <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter leading-[1] mb-8 drop-shadow-sm z-20 relative">
                            Tu Cuerpo, <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-400 to-accent animate-gradient-x bg-[length:200%_auto]">
                                Bajo Control.
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl md:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed font-medium z-20 relative">
                            La única plataforma que combina <strong>entrenamiento inteligente</strong>, <strong>nutrición precisa</strong> y <strong>análisis de datos</strong> en una experiencia de cristal.
                        </p>
                    </div>

                    {/* CTAs Y AVISO DE PRECIO */}
                    <div className={`flex flex-col items-center mt-12 md:mt-8 mb-8 transition-all duration-1000 delay-300 transform-gpu ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

                        <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto justify-center mb-8">
                            <button
                                onClick={onRegister}
                                className="group relative inline-flex items-center justify-center gap-4 px-8 py-4 bg-accent hover:bg-accent/90 text-white rounded-2xl font-bold text-lg transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-accent/25 ring-1 ring-white/20 overflow-hidden z-20 transform-gpu"
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                Empezar Gratis
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={onLogin}
                                className="inline-flex items-center justify-center gap-4 px-8 py-4 bg-glass-base hover:bg-glass-border text-text-primary rounded-2xl font-bold text-lg transition-all border border-glass-border hover:border-accent/30 hover:-translate-y-1 z-20 transform-gpu"
                            >
                                Ya tengo cuenta
                            </button>
                        </div>

                        {/* GOOGLE PLAY BADGE PROMO */}
                        <div className="relative group inline-block z-20 mt-2 transform-gpu">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-green-500 to-yellow-500 rounded-2xl blur-lg opacity-40 group-hover:opacity-80 transition duration-500 animate-gradient-x transform-gpu"></div>
                            <a
                                href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative flex items-center justify-center gap-5 px-8 py-3 bg-black/90 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold transition-all transform-gpu hover:scale-105 active:scale-95 shadow-2xl"
                                style={{ WebkitTransform: 'translateZ(0)' }}
                            >
                                <FaGooglePlay style={{ fill: 'url(#play-grad-vibrant)' }} className="text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" />
                                <div className="flex flex-col text-left leading-none">
                                    <span className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">CONSIGUELA EN</span>
                                    <span className="text-xl font-black tracking-tight text-white">Google Play</span>
                                </div>

                                <span
                                    className="absolute -top-3 -right-3 flex items-center gap-1.5 px-3 py-1 rounded-full z-30 shadow-xl overflow-hidden transform-gpu"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.3)'
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_var(--accent)]"></span>
                                    <span className="text-[9px] font-black tracking-widest uppercase text-white drop-shadow-md">NUEVA</span>
                                </span>
                            </a>
                        </div>

                        {apkDownloadUrl && (
                            <a
                                href={apkDownloadUrl}
                                className="mt-6 inline-flex items-center justify-center gap-3 text-xs font-medium text-text-tertiary hover:text-accent transition-colors z-20 transform-gpu"
                            >
                                <Download size={14} />
                                Descargar APK directamente
                            </a>
                        )}

                        <p className="mt-6 text-sm font-medium text-text-secondary z-20">
                            Sin tarjeta de crédito. <span className="text-accent font-bold">100% Gratuito.</span>
                        </p>
                    </div>

                    {/* --- MOCKUPS GALLERY --- */}
                    {isVisible && <MockupGallery />}

                    {/* --- SECCIÓN 1: BENTO GRID --- */}
                    <div className="w-full mt-16 relative z-10">
                        <ScrollRevealCard>
                            <div className="flex items-center justify-center gap-5 mb-14">
                                <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent/50"></div>
                                <h2 className="text-sm font-bold text-accent tracking-[0.2em] uppercase">
                                    Todo lo que necesitas
                                </h2>
                                <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent/50"></div>
                            </div>
                        </ScrollRevealCard>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">

                            <BentoCard className="md:col-span-2" delay={100} bgIcon={Dumbbell} bgIconColor="text-blue-500">
                                <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                    <Dumbbell size={32} />
                                </div>
                                <h3 className="text-3xl font-bold text-text-primary mb-4 group-hover:text-blue-400 transition-colors relative z-10">Rutinas Avanzadas</h3>
                                <p className="text-text-secondary mb-8 max-w-md text-lg leading-relaxed relative z-10">
                                    Diseña entrenamientos con superseries, dropsets y descansos personalizados. Registra pesos, RPE y notas en tiempo real.
                                </p>
                                <div className="flex gap-4 flex-wrap relative z-10">
                                    {['Superseries', 'Historial', '1RM Estimado'].map(tag => (
                                        <span key={tag} className="px-4 py-2 bg-bg-secondary/50 rounded-lg text-xs font-bold font-mono text-text-secondary border border-glass-border group-hover:border-blue-500/30 group-hover:text-blue-400 transition-colors">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </BentoCard>

                            <BentoCard delay={200} bgIcon={Bot} bgIconColor="text-purple-500">
                                <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                    <Sparkles size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4 group-hover:text-purple-400 transition-colors relative z-10">IA Integrada</h3>
                                <p className="text-text-secondary mb-6 leading-relaxed relative z-10">
                                    Asistente inteligente para generar entrenamientos personalizados desde cero con un solo clic.
                                </p>
                                <div className="flex gap-3 flex-wrap relative z-10 mt-auto">
                                    <span className="px-3 py-1.5 bg-purple-500/10 rounded-md text-[10px] font-bold text-purple-400 border border-purple-500/20">Auto-Ajuste</span>
                                </div>
                            </BentoCard>

                            <BentoCard delay={300} bgIcon={Apple} bgIconColor="text-green-500">
                                <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                    <Utensils size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4 group-hover:text-green-400 transition-colors relative z-10">Nutrición & Macros</h3>
                                <p className="text-text-secondary mb-4 leading-relaxed relative z-10">
                                    Base de datos verificada. Escanea códigos de barras y controla tus calorías diarias sin estrés.
                                </p>
                            </BentoCard>

                            <BentoCard delay={400} bgIcon={LineChart} bgIconColor="text-yellow-500">
                                <div className="w-14 h-14 bg-yellow-500/10 text-yellow-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-yellow-500 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                    <LineChart size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4 group-hover:text-yellow-500 transition-colors relative z-10">Análisis Visual</h3>
                                <p className="text-text-secondary mb-4 leading-relaxed relative z-10">
                                    Gráficos interactivos de tu peso, volumen de carga y medidas para ver tu evolución real.
                                </p>
                            </BentoCard>

                            <BentoCard delay={500} bgIcon={Globe} bgIconColor="text-orange-500">
                                <div className="w-14 h-14 bg-orange-500/10 text-orange-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-sm relative z-10">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-text-primary mb-4 group-hover:text-orange-400 transition-colors relative z-10">Comunidad</h3>
                                <p className="text-text-secondary mb-8 leading-relaxed relative z-10">
                                    Comparte tus logros, sube historias de tus entrenos y encuentra motivación con tus amigos.
                                </p>
                                <div className="flex items-center gap-5 relative z-10">
                                    <div className="flex -space-x-3 pl-2">
                                        {[0, 1, 2].map((index) => {
                                            const userImage = communityUsers[index];
                                            return (
                                                <div key={index} className="w-10 h-10 rounded-full bg-glass-border border-2 border-bg-primary flex items-center justify-center overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:z-10 relative shadow-md">
                                                    {userImage ? (
                                                        <img
                                                            src={userImage}
                                                            alt={`Usuario ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                                        />
                                                    ) : null}
                                                    <div style={{ display: userImage ? 'none' : 'flex' }} className="w-full h-full items-center justify-center bg-glass-base">
                                                        <Users size={14} className="text-text-tertiary" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </BentoCard>

                        </div>
                    </div>

                    {/* --- SECCIÓN 2: CARACTERÍSTICAS TÉCNICAS --- */}
                    <div className="w-full mt-32 relative z-10">
                        <ScrollRevealCard>
                            <h2 className="text-4xl md:text-5xl font-black text-center mb-16">
                                Diseñado para <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">Rendir</span>
                            </h2>
                        </ScrollRevealCard>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FeatureCard
                                icon={Smartphone}
                                title="PWA Instalable"
                                desc="Instálala como una app nativa en iOS y Android. Funciona incluso sin internet."
                                delay={100}
                            />
                            <FeatureCard
                                icon={Shield}
                                title="Privacidad Total"
                                desc="Tus fotos y datos son privados. Tú tienes el control total de lo que compartes."
                                delay={200}
                            />
                            <FeatureCard
                                icon={Trophy}
                                title="Gamificación"
                                desc="Gana XP, sube de nivel y desbloquea medallas por tu constancia en el gym."
                                delay={300}
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Rápido y Fluido"
                                desc="Interfaz Glassmorphism ultra optimizada para ser rápida en cualquier dispositivo."
                                delay={400}
                            />
                        </div>
                    </div>

                    {/* --- SECCIÓN: TRANSPARENCIA Y USO DE DATOS --- */}
                    <div className="w-full mt-32 max-w-5xl mx-auto px-4 text-left relative z-10">
                        <ScrollRevealCard>
                            <div className="p-8 md:p-12 rounded-[2rem] bg-glass-base border border-glass-border backdrop-blur-xl relative overflow-hidden transform-gpu">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <Shield size={200} />
                                </div>

                                <div className="flex items-center gap-5 mb-8 relative z-10">
                                    <div className="p-4 bg-blue-500/20 text-blue-400 rounded-2xl">
                                        <Shield size={32} />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-text-primary">Transparencia y Uso de Datos</h3>
                                </div>

                                <p className="text-text-secondary text-lg leading-relaxed mb-8 relative z-10">
                                    En <strong>Pro Fitness Glass</strong>, tu privacidad es fundamental. Solo solicitamos los datos estrictamente necesarios para ofrecerte la mejor experiencia posible:
                                </p>

                                <ul className="space-y-5 text-text-secondary mb-10 relative z-10">
                                    <li className="flex items-start gap-4">
                                        <Check size={20} className="text-green-400 shrink-0 mt-1" />
                                        <span><strong>Inicio de Sesión con Google:</strong> Solicitamos acceso a tu dirección de correo electrónico y nombre de perfil público. Esto se usa <em>exclusivamente</em> para crear tu cuenta, identificarte de forma segura y permitirte sincronizar tu progreso entre dispositivos.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <Check size={20} className="text-green-400 shrink-0 mt-1" />
                                        <span><strong>Salud y Progreso:</strong> Tus rutinas, pesos y medidas se almacenan de forma segura en nuestros servidores para generar tus gráficas. Tú tienes el control absoluto sobre qué información haces pública en la comunidad.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <Check size={20} className="text-green-400 shrink-0 mt-1" />
                                        <span><strong>Sin venta de datos:</strong> Tus datos te pertenecen. No vendemos ni compartimos tu información personal con terceros para fines publicitarios.</span>
                                    </li>
                                </ul>

                                <div className="relative z-10">
                                    <a href="/privacy" className="inline-flex items-center gap-3 text-accent font-bold px-6 py-3 bg-accent/10 hover:bg-accent/20 rounded-xl transition-colors">
                                        Leer la Política de Privacidad completa <ChevronRight size={18} />
                                    </a>
                                </div>
                            </div>
                        </ScrollRevealCard>
                    </div>

                    {/* --- CTA FINAL --- */}
                    <div className="mt-32 w-full max-w-4xl relative z-20">
                        <ScrollRevealCard delay={200}>
                            <div className="p-1 rounded-[2.5rem] bg-gradient-to-r from-accent/50 via-purple-500/30 to-accent/50 animate-gradient-x shadow-2xl shadow-accent/20 transform-gpu">
                                <div className="bg-bg-primary rounded-[2.2rem] p-12 md:p-20 text-center relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
                                    <div className="relative z-10">
                                        <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">¿Listo para el cambio?</h2>
                                        <p className="text-text-secondary text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                                            Únete hoy mismo a Pro Fitness Glass. Sin trucos, sin pagos ocultos, solo herramientas profesionales para tu mejor versión.
                                        </p>

                                        <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
                                            <button
                                                onClick={onRegister}
                                                className="w-full sm:w-auto px-12 py-4 bg-accent text-white rounded-2xl font-black text-xl shadow-xl shadow-accent/30 hover:scale-105 hover:shadow-accent/50 transition-all duration-300 hover:-translate-y-1 transform-gpu"
                                            >
                                                Comenzar Gratis
                                            </button>
                                            <a
                                                href="https://play.google.com/store/apps/details?id=com.profitnessglass.app&hl=es_419"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full sm:w-auto relative flex items-center justify-center gap-4 px-8 py-3 bg-black border border-white/10 text-white rounded-2xl transition-all transform-gpu hover:scale-105 shadow-xl hover:shadow-blue-500/20 group"
                                                style={{ WebkitTransform: 'translateZ(0)' }}
                                            >
                                                <FaGooglePlay style={{ fill: 'url(#play-grad-vibrant)' }} className="text-2xl group-hover:animate-pulse" />
                                                <div className="flex flex-col text-left leading-none">
                                                    <span className="text-[9px] text-gray-400 font-semibold tracking-wider mb-0.5">DISPONIBLE EN</span>
                                                    <span className="text-lg font-black tracking-tight">Google Play</span>
                                                </div>

                                                <span
                                                    className="absolute -top-3 -right-3 flex items-center gap-1.5 px-3 py-1 rounded-full z-30 shadow-xl overflow-hidden transform-gpu"
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        backdropFilter: 'blur(12px)',
                                                        WebkitBackdropFilter: 'blur(12px)',
                                                        border: '1px solid rgba(255, 255, 255, 0.3)'
                                                    }}
                                                >
                                                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_8px_var(--accent)]"></span>
                                                    <span className="text-[9px] font-black tracking-widest uppercase text-white drop-shadow-md">NUEVA</span>
                                                </span>
                                            </a>
                                        </div>

                                        <p className="mt-8 text-sm font-medium text-text-secondary z-20">
                                            Sin tarjeta de crédito. <span className="text-accent font-bold">100% Gratuito.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </ScrollRevealCard>
                    </div>

                </main>

                {/* --- FOOTER LEGAL Y SOCIAL --- */}
                <footer className="p-10 pb-16 text-center border-t border-glass-border bg-glass-base/30 backdrop-blur-xl relative z-20 transform-gpu">

                    <div className="flex justify-center gap-8 mb-8">
                        <a href="https://www.instagram.com/pro_fitness_glass/" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-[#E1306C] transition-all transform hover:scale-125 hover:-translate-y-1">
                            <Instagram size={28} />
                        </a>
                        <a href="https://www.tiktok.com/@pro_fitness_glass" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-[#00f2fe] transition-all transform hover:scale-125 hover:-translate-y-1">
                            <TikTokIcon size={28} />
                        </a>
                        <a href="https://www.youtube.com/@ProFitnessGlass" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-[#FF0000] transition-all transform hover:scale-125 hover:-translate-y-1">
                            <Youtube size={28} />
                        </a>
                        <a href="https://github.com/Deathvks/Pro-Ftiness-Glass" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-white transition-all transform hover:scale-125 hover:-translate-y-1">
                            <Github size={28} />
                        </a>
                        <a href="https://pro-fitness-glass.zeabur.app" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-all transform hover:scale-125 hover:-translate-y-1">
                            <Globe size={28} />
                        </a>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm text-text-secondary font-medium mb-8">
                        <a href="/privacy" className="hover:text-accent transition-colors flex items-center justify-center gap-3 hover:underline decoration-accent underline-offset-4">
                            Política de Privacidad
                        </a>
                        <span className="hidden sm:block text-text-secondary/20">•</span>
                        <a href="/terms" className="hover:text-accent transition-colors flex items-center justify-center gap-3 hover:underline decoration-accent underline-offset-4">
                            Términos del Servicio
                        </a>
                    </div>
                    <p className="text-xs text-text-tertiary opacity-60">
                        © {currentYear} Pro Fitness Glass. Desarrollado con pasión y cafeína. v{appVersion}
                    </p>
                </footer>

            </div>
        </div>
    );
};

export default LandingPage;