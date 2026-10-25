/* frontend/src/utils/gymMedia.js */

/**
 * Catálogo de marcas de gimnasios populares (España e internacional)
 * con sus dominios oficiales para obtener sus logos en alta resolución (Google Favicon CDN)
 * y fotografías seleccionadas de sus clubes / instalaciones.
 */
export const GYM_BRANDS = [
  {
    name: 'Fitness Park',
    matches: ['fitness park', 'fitnesspark'],
    domain: 'fitnesspark.es',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    color: '#FFD100',
  },
  {
    name: 'Basic-Fit',
    matches: ['basic-fit', 'basic fit', 'basicfit'],
    domain: 'basic-fit.com',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
    color: '#FF6600',
  },
  {
    name: 'McFit',
    matches: ['mcfit', 'mc fit'],
    domain: 'mcfit.com',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
    color: '#EAB308',
  },
  {
    name: 'Altafit',
    matches: ['altafit', 'alta fit'],
    domain: 'altafitgymclub.com',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
    color: '#3B82F6',
  },
  {
    name: 'VivaGym',
    matches: ['vivagym', 'viva gym'],
    domain: 'vivagym.es',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=85',
    color: '#10B981',
  },
  {
    name: 'Synergym',
    matches: ['synergym', 'synergy gym'],
    domain: 'synergym.es',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85',
    color: '#06B6D4',
  },
  {
    name: 'Dreamfit',
    matches: ['dreamfit', 'dream fit'],
    domain: 'dreamfit.es',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    color: '#EF4444',
  },
  {
    name: 'Brooklyn Fitboxing',
    matches: ['brooklyn fitboxing', 'brooklyn boxing', 'fitboxing'],
    domain: 'brooklynfitboxing.com',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=85',
    color: '#18181B',
  },
  {
    name: 'CrossFit',
    matches: ['crossfit', 'cross fit', 'box crossfit'],
    domain: 'crossfit.com',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85',
    color: '#E11D48',
  },
  {
    name: 'Anytime Fitness',
    matches: ['anytime fitness', 'anytime'],
    domain: 'anytimefitness.es',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
    color: '#8B5CF6',
  },
  {
    name: 'GO fit',
    matches: ['go fit', 'gofit'],
    domain: 'go-fit.es',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
    color: '#2563EB',
  },
  {
    name: 'MacroFit',
    matches: ['macrofit', 'macro fit'],
    domain: 'macrofit.es',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
    color: '#0EA5E9',
  },
  {
    name: 'Metropolitan',
    matches: ['metropolitan', 'club metropolitan'],
    domain: 'clubmetropolitan.net',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
    color: '#0F172A',
  },
  {
    name: 'Snap Fitness',
    matches: ['snap fitness', 'snapfitness'],
    domain: 'snapfitness.com',
    image: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=85',
    color: '#DC2626',
  },
  {
    name: 'Holiday Gym',
    matches: ['holiday gym'],
    domain: 'holidaygym.es',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
    color: '#EA580C',
  },
  {
    name: 'Forus',
    matches: ['forus'],
    domain: 'forus.es',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
    color: '#0284C7',
  },
  {
    name: 'Supera',
    matches: ['supera', 'centro supera'],
    domain: 'centrosupera.com',
    image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
    color: '#059669',
  },
  {
    name: 'Smart Fit',
    matches: ['smart fit', 'smartfit'],
    domain: 'smartfit.com.br',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
    color: '#F59E0B',
  },
];

/**
 * Galería de imágenes de alta resolución de gimnasios modernos para gimnasios
 * locales o independientes, asignadas de forma determinista para que cada
 * centro tenga siempre la misma foto.
 */
export const GENERIC_GYM_PHOTOS = [
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85',
  'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=1200&q=85',
];

/**
 * Calcula un hash numérico estable para un string
 */
export const hashString = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/**
 * Obtiene la foto genérica asignada de forma estable para un nombre de gimnasio
 */
export const getGymPhotoForName = (name = '') => {
  const index = hashString(name) % GENERIC_GYM_PHOTOS.length;
  return GENERIC_GYM_PHOTOS[index];
};

/**
 * Obtiene la información visual (imagen de club, logo oficial de cadena y color de marca)
 * para un gimnasio o nombre de gimnasio.
 */
export const getGymMedia = (gymOrName) => {
  if (!gymOrName) {
    return {
      brand: null,
      logo: null,
      image: GENERIC_GYM_PHOTOS[0],
      brandColor: '#6366f1',
    };
  }

  const name = typeof gymOrName === 'string' ? gymOrName : (gymOrName.name || '');
  const brand = typeof gymOrName === 'object' ? (gymOrName.brand || '') : '';
  const rawText = `${name} ${brand}`.toLowerCase();

  for (const item of GYM_BRANDS) {
    if (item.matches.some(m => rawText.includes(m))) {
      return {
        brand: item.name,
        logo: item.domain ? `https://www.google.com/s2/favicons?domain=${item.domain}&sz=128` : null,
        image: item.image,
        brandColor: item.color,
      };
    }
  }

  return {
    brand: null,
    logo: null,
    image: getGymPhotoForName(name),
    brandColor: '#6366f1',
  };
};

/**
 * Enriquece un objeto de gimnasio con sus propiedades de imagen y logo
 */
export const enrichGymWithMedia = (gym) => {
  if (!gym) return gym;
  const media = getGymMedia(gym);
  let resolvedImage = gym.image || media.image;
  if (resolvedImage && typeof resolvedImage === 'string' && resolvedImage.includes('unsplash.com')) {
    resolvedImage = resolvedImage.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=85');
  }
  return {
    ...gym,
    image: resolvedImage,
    logo: gym.logo || media.logo,
    brand: gym.brand || media.brand,
    brandColor: gym.brandColor || media.brandColor,
  };
};
