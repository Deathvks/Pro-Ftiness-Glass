import { calculateDistance, formatDistance } from './gpsUtils';
import spainGymsDatabase from '../data/spainGymsDatabase.json';

export interface SpainGymItem {
  id?: string;
  name: string;
  brand?: string;
  address?: string;
  city?: string;
  province?: string;
  lat?: number;
  lng?: number;
  distanceMeters?: number | null;
  distanceFormatted?: string | null;
  isVerified?: boolean;
  matchScore?: number;
  aliases?: string[];
  image?: string | null;
  logo?: string | null;
  brandColor?: string | null;
  [key: string]: any;
}

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

export function normalizeGymText(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

export function cleanSearchTokens(rawQuery: string) {
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

export const SPAIN_GYMS_DATABASE: SpainGymItem[] = spainGymsDatabase as SpainGymItem[];
export const POPULAR_SPAIN_GYMS: SpainGymItem[] = spainGymsDatabase as SpainGymItem[];

export function searchLocalGyms(queryText: string, activeCoords: { lat?: number; lng?: number } | null = null): SpainGymItem[] {
  const q = (queryText || '').trim();
  const hasCoords = activeCoords?.lat != null && activeCoords?.lng != null;

  if (!q && !hasCoords) return [];

  const { norm, significant } = cleanSearchTokens(q);
  const specificWords = significant.filter(w => !GENERIC_GYM_WORDS.has(w));

  const matches: SpainGymItem[] = [];

  for (const gym of SPAIN_GYMS_DATABASE) {
    const gymText = normalizeGymText(`${gym.name} ${gym.brand || ''} ${gym.address || ''} ${gym.city || ''} ${gym.province || ''}`);
    const aliasTexts = (gym.aliases || []).map(normalizeGymText);
    const allSearchable = [gymText, ...aliasTexts].join(' ');

    let score = 0;

    if (q) {
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

      if (specificWords.length > 0 && specificMatches === specificWords.length) {
        score += 50;
      }

      if (gym.isVerified) score += 15;
    } else {
      score = 50;
    }

    let distanceMeters: number | null = null;
    let distanceFormatted: string | null = null;
    if (hasCoords && gym.lat && gym.lng && activeCoords?.lat != null && activeCoords?.lng != null) {
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
      matchScore: score,
    });
  }

  if (hasCoords) {
    matches.sort((a, b) => {
      if (Math.abs((b.matchScore || 0) - (a.matchScore || 0)) >= 50) {
        return (b.matchScore || 0) - (a.matchScore || 0);
      }
      if (a.distanceMeters != null && b.distanceMeters != null) {
        return a.distanceMeters - b.distanceMeters;
      }
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  } else {
    matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
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
