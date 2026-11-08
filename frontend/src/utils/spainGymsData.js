/* frontend/src/utils/spainGymsData.js */
import { calculateDistance, formatDistance } from './gpsUtils';
import spainGymsDatabase from '../data/spainGymsDatabase.json';

export const SPANISH_STOP_WORDS = new Set([
  'un', 'una', 'unos', 'unas',
  'el', 'la', 'los', 'las',
  'en', 'de', 'del', 'al', 'y', 'o', 'por', 'para', 'con',
  'cerca', 'cercano', 'cercanos', 'zona'
]);

export const GENERIC_GYM_WORDS = new Set([
  'gimnasio', 'gimnasios', 'gym', 'gyms', 'fitness', 'fit',
  'centro', 'centros', 'club', 'clubs', 'deportivo', 'deportivos', 'polideportivo'
]);

export function normalizeGymText(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function cleanSearchTokens(rawQuery) {
  const norm = normalizeGymText(rawQuery);
  const words = norm.split(/\s+/).filter(Boolean);
  const significant = words.filter(w => !SPANISH_STOP_WORDS.has(w));
  return {
    raw: rawQuery,
    norm,
    words,
    significant: significant.length > 0 ? significant : words,
    cleanedQueryString: (significant.length > 0 ? significant : words).join(' ')
  };
}

/**
 * Base de datos completa unificada de centros deportivos y gimnasios de toda España:
 * más de 3.100 centros registrados en todas las 50 provincias (Península, Canarias, Baleares, Ceuta y Melilla),
 * vinculados con sus marcas oficiales, municipios y coordenadas geográficas.
 */
export const SPAIN_GYMS_DATABASE = spainGymsDatabase;
export const POPULAR_SPAIN_GYMS = spainGymsDatabase;

/**
 * Motor de búsqueda local optimizado sobre el catálogo de toda España:
 * - Filtra por coincidencia exacta o por tokens de marca, ciudad, provincia y dirección.
 * - Discrimina términos genéricos ("gimnasio", "gym") para evitar resultados de otras provincias cuando se busca una ciudad específica.
 * - Calcula distancias en metros si se proporciona ubicación GPS.
 */
export function searchLocalGyms(queryText, activeCoords = null) {
  const q = (queryText || '').trim();
  const hasCoords = activeCoords?.lat != null && activeCoords?.lng != null;

  if (!q && !hasCoords) return [];

  const { norm, significant } = cleanSearchTokens(q);
  const specificWords = significant.filter(w => !GENERIC_GYM_WORDS.has(w));

  const matches = [];

  for (const gym of SPAIN_GYMS_DATABASE) {
    const gymText = normalizeGymText(`${gym.name} ${gym.brand || ''} ${gym.address || ''} ${gym.city || ''} ${gym.province || ''}`);
    const aliasTexts = (gym.aliases || []).map(normalizeGymText);
    const allSearchable = [gymText, ...aliasTexts].join(' ');

    let score = 0;

    if (q) {
      // Si el usuario incluyó palabras específicas (ej: "teruel", "canteras", "altafit", "ponferrada"),
      // el gimnasio DEBE coincidir con al menos una palabra específica para evitar que aparezcan
      // gimnasios irrelevantes de otras ciudades que solo coincidan con la palabra "gimnasio"
      if (specificWords.length > 0) {
        const hasSpecificMatch = specificWords.some(w => allSearchable.includes(w));
        if (!hasSpecificMatch) continue;
      }

      // 1. Coincidencia de frase exacta
      if (allSearchable.includes(norm)) score += 120;
      if (normalizeGymText(gym.name).includes(norm)) score += 60;

      // 2. Coincidencia de tokens individuales
      let specificMatches = 0;
      for (const token of significant) {
        const isSpec = !GENERIC_GYM_WORDS.has(token);
        if (normalizeGymText(gym.name).includes(token)) {
          if (isSpec) specificMatches++;
          score += isSpec ? 40 : 15;
        } else if (normalizeGymText(gym.brand || '').includes(token)) {
          if (isSpec) specificMatches++;
          score += isSpec ? 35 : 15;
        } else if (normalizeGymText(gym.city || '').includes(token) || normalizeGymText(gym.province || '').includes(token)) {
          if (isSpec) specificMatches++;
          score += isSpec ? 30 : 10;
        } else if (allSearchable.includes(token)) {
          if (isSpec) specificMatches++;
          score += isSpec ? 20 : 5;
        }
      }

      // Bonus si coincidieron todas las palabras específicas
      if (specificWords.length > 0 && specificMatches === specificWords.length) {
        score += 50;
      }

      if (gym.isVerified) score += 15;
    } else {
      // Búsqueda pura por cercanía GPS sin texto
      score = 50;
    }

    let distanceMeters = null;
    let distanceFormatted = null;
    if (hasCoords && gym.lat && gym.lng) {
      distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, gym.lat, gym.lng);
      distanceFormatted = formatDistance(distanceMeters);
    }

    matches.push({
      id: gym.id || `gym_${gym.name}_${gym.lat}_${gym.lng}`.replace(/\s+/g, '_'),
      name: gym.name,
      brand: gym.brand,
      address: gym.address,
      city: gym.city,
      province: gym.province,
      lat: gym.lat,
      lng: gym.lng,
      distanceMeters,
      distanceFormatted,
      isVerified: gym.isVerified || false,
      matchScore: score
    });
  }

  // Ordenación:
  if (hasCoords) {
    matches.sort((a, b) => {
      // Si la diferencia de puntuación textual es alta, priorizamos relevancia
      if (Math.abs(b.matchScore - a.matchScore) >= 50) {
        return b.matchScore - a.matchScore;
      }
      // Por defecto ordenamos por cercanía física GPS
      if (a.distanceMeters != null && b.distanceMeters != null) {
        return a.distanceMeters - b.distanceMeters;
      }
      return b.matchScore - a.matchScore;
    });
  } else {
    matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  return matches.slice(0, 25);
}

export default {
  SPANISH_STOP_WORDS,
  GENERIC_GYM_WORDS,
  SPAIN_GYMS_DATABASE,
  POPULAR_SPAIN_GYMS,
  normalizeGymText,
  cleanSearchTokens,
  searchLocalGyms
};
