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
