/* frontend/src/components/Flags.jsx */
import React from 'react';

/**
 * Bandera de España oficial en formato SVG vectorial
 * (Rojo carmesí y amarillo gualda con proporción 1:2:1 y escudo estilizado)
 */
export const SpainFlag = ({ className = 'w-4 h-2.5' }) => (
  <span className={`inline-flex items-center justify-center overflow-hidden rounded-[2.5px] shadow-xs border border-black/15 dark:border-white/20 shrink-0 ${className}`}>
    <svg viewBox="0 0 750 500" className="w-full h-full block" aria-label="Bandera de España">
      <rect width="750" height="500" fill="#AD1519" />
      <rect width="750" height="250" y="125" fill="#FABD00" />
      {/* Escudo simplificado */}
      <g transform="translate(195, 250) scale(0.95)">
        <path d="M-26,-36 h52 v44 a26,26 0 0,1 -52,0 z" fill="#AD1519" />
        <path d="M-18,-28 h36 v34 a18,18 0 0,1 -36,0 z" fill="#FABD00" />
        <circle cx="0" cy="-44" r="8" fill="#AD1519" />
        <rect x="-3" y="-50" width="6" height="5" fill="#FABD00" />
        <rect x="-34" y="-28" width="5.5" height="56" rx="1.5" fill="#FFFFFF" opacity="0.95" />
        <rect x="28.5" y="-28" width="5.5" height="56" rx="1.5" fill="#FFFFFF" opacity="0.95" />
      </g>
    </svg>
  </span>
);

/**
 * Bandera oficial de la Comunidad Autónoma de Canarias en formato SVG vectorial
 * (Tricolor vertical: Blanco a la izquierda, Azul marino/celeste en el centro, Amarillo canario a la derecha)
 */
export const CanariasFlag = ({ className = 'w-4 h-2.5' }) => (
  <span className={`inline-flex items-center justify-center overflow-hidden rounded-[2.5px] shadow-xs border border-black/15 dark:border-white/20 shrink-0 ${className}`}>
    <svg viewBox="0 0 750 500" className="w-full h-full block" aria-label="Bandera de Canarias">
      <rect width="250" height="500" x="0" fill="#FFFFFF" />
      <rect width="250" height="500" x="250" fill="#0067C6" />
      <rect width="250" height="500" x="500" fill="#FEDB00" />
    </svg>
  </span>
);

/**
 * Bandera oficial de las Islas Baleares en formato SVG vectorial
 * (Senyera de 9 barras con cantón morado y castillo estilizado)
 */
export const BalearesFlag = ({ className = 'w-4 h-2.5' }) => (
  <span className={`inline-flex items-center justify-center overflow-hidden rounded-[2.5px] shadow-xs border border-black/15 dark:border-white/20 shrink-0 ${className}`}>
    <svg viewBox="0 0 750 500" className="w-full h-full block" aria-label="Bandera de las Islas Baleares">
      {/* 9 barras: fondo amarillo con 4 franjas rojas */}
      <rect width="750" height="500" fill="#FABD00" />
      <rect y="55.55" width="750" height="55.55" fill="#AD1519" />
      <rect y="166.66" width="750" height="55.55" fill="#AD1519" />
      <rect y="277.77" width="750" height="55.55" fill="#AD1519" />
      <rect y="388.88" width="750" height="55.55" fill="#AD1519" />
      {/* Cantón morado superior izquierdo */}
      <rect x="0" y="0" width="375" height="250" fill="#6B2D5C" />
      {/* Castillo estilizado */}
      <g transform="translate(187, 125) scale(0.9)" fill="#FFFFFF">
        <rect x="-42" y="-12" width="84" height="48" rx="2" />
        <rect x="-38" y="-32" width="18" height="24" rx="2" />
        <rect x="-9" y="-42" width="18" height="34" rx="2" />
        <rect x="20" y="-32" width="18" height="24" rx="2" />
        <rect x="-8" y="16" width="16" height="20" rx="2" fill="#6B2D5C" />
      </g>
    </svg>
  </span>
);

/**
 * Distintivo informativo unificado que indica que la búsqueda cubre toda España, Canarias y Baleares
 */
export const SpainTerritoryBadge = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-glass-border text-xs font-semibold text-text-secondary select-none ${className}`}>
    <div className="flex items-center -space-x-1 shrink-0">
      <SpainFlag className="w-4 h-2.5 z-30" />
      <CanariasFlag className="w-4 h-2.5 z-20" />
      <BalearesFlag className="w-4 h-2.5 z-10" />
    </div>
    <span className="text-[11px] font-bold text-text-primary tracking-tight">España • Canarias • Baleares</span>
  </div>
);

/**
 * Detecta si un gimnasio o ubicación pertenece al archipiélago de Canarias
 * tanto por coordenadas geográficas como por palabras clave en nombre o dirección.
 */
export const isCanarias = (gym) => {
  if (!gym) return false;

  // 1. Detección por coordenadas GPS de las Islas Canarias (27.4°N - 29.6°N, 13.2°W - 18.5°W)
  if (typeof gym.lat === 'number' && typeof gym.lng === 'number') {
    if (gym.lat >= 27.4 && gym.lat <= 29.6 && gym.lng >= -18.5 && gym.lng <= -13.2) {
      return true;
    }
  }

  // 2. Detección por texto (nombre, ciudad, provincia, dirección)
  const fullText = `${gym.name || ''} ${gym.address || ''} ${gym.city || ''} ${gym.province || ''} ${gym.suburb || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const canariasKeywords = [
    'canaria', 'canarias', 'palmas', 'gran canaria', 'tenerife', 'lanzarote', 
    'fuerteventura', 'la palma', 'la gomera', 'el hierro', 'telde', 'vecindario',
    'tamaraceite', 'arrecife', 'puerto del rosario', 'arinaga', 'chafiras', 
    'la cuesta', 'la laguna', 'carvajal', 'maspalomas', 'corralejo', 'adeje',
    'arona', 'orotava', 'realejos', 'santa cruz de tenerife'
  ];

  return canariasKeywords.some(kw => fullText.includes(kw));
};
