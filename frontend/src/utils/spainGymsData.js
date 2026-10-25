/* frontend/src/utils/spainGymsData.js */
import { calculateDistance, formatDistance } from './gpsUtils';

export const SPANISH_STOP_WORDS = new Set([
  'un', 'una', 'unos', 'unas',
  'el', 'la', 'los', 'las',
  'en', 'de', 'del', 'al', 'y', 'o', 'por', 'para', 'con',
  'cerca', 'cercano', 'cercanos', 'zona'
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
 * Catálogo exhaustivo de clubes y gimnasios de las principales cadenas y centros
 * emblemáticos en España (Canarias, Madrid, Barcelona, Valencia, Andalucía, Norte, Baleares).
 */
export const POPULAR_SPAIN_GYMS = [
  {
    "name": "GO fit Las Palmas - Las Canteras",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "las canteras",
      "canteras",
      "guanarteme",
      "secretario padilla",
      "las palmas",
      "gran canaria"
    ],
    "address": "Calle Secretario Padilla, 88, Guanarteme, 35010 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1325,
    "lng": -15.4423,
    "isVerified": true
  },
  {
    "name": "GO fit Vallehermoso",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "vallehermoso",
      "chamberi",
      "filipinas",
      "madrid"
    ],
    "address": "Av. de Filipinas, 7, Chamberí, 28003 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4418,
    "lng": -3.7118,
    "isVerified": true
  },
  {
    "name": "GO fit Mirasierra",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "mirasierra",
      "monasterio el paular",
      "fuencarral",
      "madrid"
    ],
    "address": "Calle del Monasterio de El Paular, 2, 28049 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4952,
    "lng": -3.7144,
    "isVerified": true
  },
  {
    "name": "GO fit Peñagrande",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "penagrande",
      "peñagrande",
      "monforte de lemos",
      "la vaguada",
      "madrid"
    ],
    "address": "Av. de Monforte de Lemos, 184, 28035 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4776,
    "lng": -3.7153,
    "isVerified": true
  },
  {
    "name": "GO fit San Lamberto - La Elipa",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "san lamberto",
      "la elipa",
      "ciudad lineal",
      "madrid"
    ],
    "address": "Calle de San Lamberto, 28017 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4243,
    "lng": -3.6406,
    "isVerified": true
  },
  {
    "name": "GO fit Plaza Elíptica",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "plaza eliptica",
      "usera",
      "carabanchel",
      "madrid"
    ],
    "address": "Av. de la Princesa Juana de Austria, 28025 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.3845,
    "lng": -3.7196,
    "isVerified": true
  },
  {
    "name": "GO fit Piscinas San Miguel",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "piscinas san miguel",
      "san miguel",
      "calle de la verdad",
      "carabanchel",
      "madrid"
    ],
    "address": "Calle de la Verdad, 28019 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.3957,
    "lng": -3.7188,
    "isVerified": true
  },
  {
    "name": "GO fit Torrejón de Ardoz",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "torrejon",
      "budapest",
      "madrid"
    ],
    "address": "Calle de Budapest, 28850 Torrejón de Ardoz",
    "city": "Torrejón de Ardoz",
    "province": "Madrid",
    "lat": 40.4578,
    "lng": -3.4735,
    "isVerified": true
  },
  {
    "name": "GO fit Alcalá de Henares",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "alcala de henares",
      "virgen del val",
      "madrid"
    ],
    "address": "Av. Virgen del Val, 28804 Alcalá de Henares",
    "city": "Alcalá de Henares",
    "province": "Madrid",
    "lat": 40.4812,
    "lng": -3.3551,
    "isVerified": true
  },
  {
    "name": "GO fit Sevilla",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "sevilla",
      "jose laguillo",
      "santa justa"
    ],
    "address": "Av. José Laguillo, 41003 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3942,
    "lng": -5.9806,
    "isVerified": true
  },
  {
    "name": "GO fit Córdoba",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "cordoba",
      "av libertad",
      "vial norte"
    ],
    "address": "Av. de la Libertad, 14006 Córdoba",
    "city": "Córdoba",
    "province": "Córdoba",
    "lat": 37.8931,
    "lng": -4.7865,
    "isVerified": true
  },
  {
    "name": "GO fit Málaga - Huelin",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "malaga",
      "huelin",
      "antonio machado",
      "paseo maritimo"
    ],
    "address": "Paseo Marítimo Antonio Machado, 29002 Málaga",
    "city": "Málaga",
    "province": "Málaga",
    "lat": 36.7042,
    "lng": -4.4357,
    "isVerified": true
  },
  {
    "name": "GO fit Málaga - Segalerva",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "malaga",
      "segalerva",
      "rosario pino"
    ],
    "address": "Calle Actriz Rosario Pino, 29014 Málaga",
    "city": "Málaga",
    "province": "Málaga",
    "lat": 36.7351,
    "lng": -4.4239,
    "isVerified": true
  },
  {
    "name": "GO fit Oviedo",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "oviedo",
      "asturias",
      "monte cerrau",
      "asturcon"
    ],
    "address": "Calle El Asturcón, 23, Monte Cerráu, 33006 Oviedo",
    "city": "Oviedo",
    "province": "Asturias",
    "lat": 43.3524,
    "lng": -5.8643,
    "isVerified": true
  },
  {
    "name": "GO fit Valladolid",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "valladolid",
      "los santos",
      "pilarica",
      "asteroide"
    ],
    "address": "Calle del Asteroide, 47011 Valladolid",
    "city": "Valladolid",
    "province": "Valladolid",
    "lat": 41.6578,
    "lng": -4.7076,
    "isVerified": true
  },
  {
    "name": "GO fit Ciudad Real",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "ciudad real",
      "ronda toledo"
    ],
    "address": "Ronda de Toledo, 13005 Ciudad Real",
    "city": "Ciudad Real",
    "province": "Ciudad Real",
    "lat": 38.9926,
    "lng": -3.9272,
    "isVerified": true
  },
  {
    "name": "GO fit Santander - La Albericia",
    "brand": "GO fit",
    "aliases": [
      "go fit",
      "gofit",
      "santander",
      "cantabria",
      "albericia",
      "rosalia de castro"
    ],
    "address": "Calle Rosalía de Castro, 39011 Santander",
    "city": "Santander",
    "province": "Cantabria",
    "lat": 43.4682,
    "lng": -3.8427,
    "isVerified": true
  },
  {
    "name": "CrossFit Las Canteras",
    "brand": "CrossFit",
    "aliases": [
      "crossfit",
      "las canteras",
      "canteras",
      "paseo las canteras",
      "playa las canteras",
      "las palmas"
    ],
    "address": "Paseo de Las Canteras, 28, 35007 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1416,
    "lng": -15.4345,
    "isVerified": true
  },
  {
    "name": "Gimnasio Las Canteras",
    "brand": "Gimnasio Las Canteras",
    "aliases": [
      "gimnasio las canteras",
      "canteras",
      "las canteras",
      "sagasta",
      "bernardo de la torre",
      "guanarteme",
      "las palmas"
    ],
    "address": "Calle Bernardo de la Torre, 35007 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1362,
    "lng": -15.4375,
    "isVerified": true
  },
  {
    "name": "Dreamfit Las Palmas - El Muelle",
    "brand": "Dreamfit",
    "aliases": [
      "dreamfit",
      "dream fit",
      "el muelle",
      "santa catalina",
      "puerto",
      "las canteras",
      "las palmas"
    ],
    "address": "Centro Comercial El Muelle, Muelle Santa Catalina, 35008 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1408,
    "lng": -15.4285,
    "isVerified": true
  },
  {
    "name": "MacroFit Las Palmas - Miller Bajo",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "las palmas",
      "miller bajo",
      "diego vega sarmiento"
    ],
    "address": "Calle Diego Vega Sarmiento, 59, Miller Bajo, 35014 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1065,
    "lng": -15.4382,
    "isVerified": true
  },
  {
    "name": "MacroFit Las Palmas - La Ballena",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "las palmas",
      "la ballena",
      "carretera del norte",
      "escaleritas"
    ],
    "address": "Centro Comercial La Ballena, Carretera del Norte, 112, 35013 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1148,
    "lng": -15.4398,
    "isVerified": true
  },
  {
    "name": "MacroFit Tamaraceite",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "tamaraceite",
      "lomo los frailes",
      "las palmas"
    ],
    "address": "Calle San Daniel, Tamaraceite, 35018 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1072,
    "lng": -15.4682,
    "isVerified": true
  },
  {
    "name": "MacroFit Telde",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "telde",
      "san juan",
      "gran canaria"
    ],
    "address": "Calle Poeta Fernando González, 35200 Telde",
    "city": "Telde",
    "province": "Las Palmas",
    "lat": 27.9984,
    "lng": -15.4192,
    "isVerified": true
  },
  {
    "name": "MacroFit Vecindario",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "vecindario",
      "atlantico",
      "santa lucia de tirajana"
    ],
    "address": "Av. del Atlántico, 35110 Vecindario, Santa Lucía de Tirajana",
    "city": "Vecindario",
    "province": "Las Palmas",
    "lat": 27.8542,
    "lng": -15.4378,
    "isVerified": true
  },
  {
    "name": "MacroFit Arrecife (Lanzarote)",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "arrecife",
      "lanzarote",
      "marina lanzarote"
    ],
    "address": "Centro Comercial Marina Lanzarote, Av. Olof Palme, 35500 Arrecife",
    "city": "Arrecife",
    "province": "Las Palmas",
    "lat": 28.9634,
    "lng": -13.5427,
    "isVerified": true
  },
  {
    "name": "MacroFit Puerto del Rosario (Fuerteventura)",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "puerto del rosario",
      "fuerteventura"
    ],
    "address": "Calle León y Castillo, 35600 Puerto del Rosario",
    "city": "Puerto del Rosario",
    "province": "Las Palmas",
    "lat": 28.5015,
    "lng": -13.8642,
    "isVerified": true
  },
  {
    "name": "MacroFit La Laguna (Tenerife)",
    "brand": "MacroFit",
    "aliases": [
      "macrofit",
      "macro fit",
      "la laguna",
      "san cristobal de la laguna",
      "tenerife"
    ],
    "address": "Calle San Francisco de Paula, 38206 San Cristóbal de La Laguna",
    "city": "La Laguna",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4721,
    "lng": -16.3154,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Las Palmas - Mesa y López",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "mesa y lopez",
      "las palmas",
      "guanarteme",
      "canteras",
      "basicfit"
    ],
    "address": "Av. José Mesa y López, 35007 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1342,
    "lng": -15.4391,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Las Palmas - Triana",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "triana",
      "vegueta",
      "las palmas",
      "mayor de triana",
      "basicfit"
    ],
    "address": "Calle Mayor de Triana, 35002 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1062,
    "lng": -15.4168,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Santa Cruz de Tenerife - Tres de Mayo",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "santa cruz de tenerife",
      "tres de mayo",
      "tenerife",
      "basicfit"
    ],
    "address": "Av. Tres de Mayo, 38003 Santa Cruz de Tenerife",
    "city": "Santa Cruz de Tenerife",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4615,
    "lng": -16.2572,
    "isVerified": true
  },
  {
    "name": "Altafit Santa Cruz de Tenerife",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "santa cruz de tenerife",
      "tenerife",
      "la salle"
    ],
    "address": "Av. La Salle, 38005 Santa Cruz de Tenerife",
    "city": "Santa Cruz de Tenerife",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4651,
    "lng": -16.2589,
    "isVerified": true
  },
  {
    "name": "Altafit Las Palmas - Miller",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "las palmas",
      "miller",
      "gran canaria"
    ],
    "address": "Calle Miller Industrial, 35014 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1082,
    "lng": -15.4361,
    "isVerified": true
  },
  {
    "name": "McFIT Santa Cruz de Tenerife",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "mc fit",
      "santa cruz de tenerife",
      "tenerife"
    ],
    "address": "Calle Juan Álvarez Delgado, 38007 Santa Cruz de Tenerife",
    "city": "Santa Cruz de Tenerife",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4638,
    "lng": -16.2647,
    "isVerified": true
  },
  {
    "name": "Fitness Park Las Ramblas",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "las ramblas",
      "juan carlos i",
      "las palmas",
      "fitnesspark"
    ],
    "address": "Centro Comercial Las Ramblas, Av. Juan Carlos I, 29, 35019 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1137,
    "lng": -15.4492,
    "isVerified": true
  },
  {
    "name": "Fitness Park Gran Canaria - Tamaraceite",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "tamaraceite",
      "las palmas",
      "fitnesspark"
    ],
    "address": "Calle San Daniel, Tamaraceite, 35018 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1068,
    "lng": -15.4674,
    "isVerified": true
  },
  {
    "name": "Fitness Park Telde - Las Terrazas",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "telde",
      "las terrazas",
      "gran canaria",
      "fitnesspark"
    ],
    "address": "Centro Comercial Las Terrazas, 35220 Telde",
    "city": "Telde",
    "province": "Las Palmas",
    "lat": 28.0315,
    "lng": -15.4055,
    "isVerified": true
  },
  {
    "name": "Fitness Park Gran Canaria - Cruce de Arinaga",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "arinaga",
      "aguimes",
      "gran canaria",
      "fitnesspark"
    ],
    "address": "Calle Ciprés, 1, Pol. Ind. Arinaga, 35118 Agüimes",
    "city": "Agüimes",
    "province": "Las Palmas",
    "lat": 27.8763,
    "lng": -15.4241,
    "isVerified": true
  },
  {
    "name": "Fitness Park Gran Canaria - Vecindario",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "vecindario",
      "santa lucia",
      "gran canaria",
      "fitnesspark"
    ],
    "address": "Av. de Canarias, 35110 Vecindario, Santa Lucía de Tirajana",
    "city": "Vecindario",
    "province": "Las Palmas",
    "lat": 27.8521,
    "lng": -15.4418,
    "isVerified": true
  },
  {
    "name": "Fitness Park Gran Canaria - Carvajal",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "carvajal",
      "las palmas",
      "obelisco",
      "fitnesspark"
    ],
    "address": "Calle Carvajal, 35004 Las Palmas de Gran Canaria",
    "city": "Las Palmas de Gran Canaria",
    "province": "Las Palmas",
    "lat": 28.1189,
    "lng": -15.4265,
    "isVerified": true
  },
  {
    "name": "Fitness Park Tenerife - La Cuesta",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "la cuesta",
      "la laguna",
      "tenerife",
      "fitnesspark"
    ],
    "address": "Carretera General Santa Cruz-Laguna, 38320 San Cristóbal de La Laguna",
    "city": "La Laguna",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4652,
    "lng": -16.2913,
    "isVerified": true
  },
  {
    "name": "Fitness Park Tenerife - Las Chafiras",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "las chafiras",
      "san miguel de abona",
      "tenerife sur",
      "fitnesspark"
    ],
    "address": "Av. Ten Bel, Pol. Ind. Las Chafiras, 38639 San Miguel de Abona",
    "city": "Las Chafiras",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.0833,
    "lng": -16.6358,
    "isVerified": true
  },
  {
    "name": "Fitness Park Santa Cruz - Añaza",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "anaza",
      "añaza",
      "carrefour",
      "santa cruz de tenerife",
      "fitnesspark"
    ],
    "address": "Centro Comercial Añaza Carrefour, 38109 Santa Cruz de Tenerife",
    "city": "Santa Cruz de Tenerife",
    "province": "Santa Cruz de Tenerife",
    "lat": 28.4312,
    "lng": -16.3051,
    "isVerified": true
  },
  {
    "name": "Fitness Park Palma de Mallorca - Aragó",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "palma de mallorca",
      "arago",
      "mallorca",
      "fitnesspark"
    ],
    "address": "Carrer d'Aragó, 231, 07008 Palma de Mallorca",
    "city": "Palma de Mallorca",
    "province": "Illes Balears",
    "lat": 39.5828,
    "lng": 2.6715,
    "isVerified": true
  },
  {
    "name": "McFIT Palma de Mallorca",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "palma de mallorca",
      "mallorca"
    ],
    "address": "Camí dels Reis, 308, 07010 Palma de Mallorca",
    "city": "Palma de Mallorca",
    "province": "Illes Balears",
    "lat": 39.5962,
    "lng": 2.6457,
    "isVerified": true
  },
  {
    "name": "VivaGym Palma de Mallorca",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "palma de mallorca",
      "mallorca"
    ],
    "address": "Carrer del Cardenal Rossell, 07007 Palma de Mallorca",
    "city": "Palma de Mallorca",
    "province": "Illes Balears",
    "lat": 39.5632,
    "lng": 2.6751,
    "isVerified": true
  },
  {
    "name": "Fitness Park La Vaguada",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "la vaguada",
      "monforte de lemos",
      "madrid",
      "fitnesspark"
    ],
    "address": "Centro Comercial La Vaguada, Av. de Monforte de Lemos, 36, 28029 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4795,
    "lng": -3.7082,
    "isVerified": true
  },
  {
    "name": "Fitness Park Castellana 85",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "castellana",
      "azca",
      "nuevos ministerios",
      "madrid",
      "fitnesspark"
    ],
    "address": "Paseo de la Castellana, 85, Complejo AZCA, 28046 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4497,
    "lng": -3.6918,
    "isVerified": true
  },
  {
    "name": "Fitness Park Príncipe Pío",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "principe pio",
      "paseo florida",
      "madrid",
      "fitnesspark"
    ],
    "address": "Centro Comercial Príncipe Pío, Paseo de la Florida, 2, 28008 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4208,
    "lng": -3.7197,
    "isVerified": true
  },
  {
    "name": "Fitness Park Plaza Río 2",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "plaza rio 2",
      "antonio lopez",
      "madrid rio",
      "madrid",
      "fitnesspark"
    ],
    "address": "Centro Comercial Plaza Río 2, Calle de Antonio López, 109, 28026 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.3905,
    "lng": -3.6991,
    "isVerified": true
  },
  {
    "name": "Fitness Park Méndez Álvaro",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "mendez alvaro",
      "atocha",
      "madrid",
      "fitnesspark"
    ],
    "address": "Calle de Méndez Álvaro, 28045 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.3982,
    "lng": -3.6784,
    "isVerified": true
  },
  {
    "name": "Fitness Park Alcorcón - X-Madrid",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "x-madrid",
      "xmadrid",
      "alcorcon",
      "madrid",
      "fitnesspark"
    ],
    "address": "Centro Comercial X-Madrid, Calle Oslo, 53, 28922 Alcorcón",
    "city": "Alcorcón",
    "province": "Madrid",
    "lat": 40.3392,
    "lng": -3.8327,
    "isVerified": true
  },
  {
    "name": "Fitness Park Torrejón - Oasiz",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "oasiz",
      "torrejon de ardoz",
      "madrid",
      "fitnesspark"
    ],
    "address": "Centro Comercial Oasiz, Av. Premios Nobel, 3, 28850 Torrejón de Ardoz",
    "city": "Torrejón de Ardoz",
    "province": "Madrid",
    "lat": 40.4632,
    "lng": -3.4561,
    "isVerified": true
  },
  {
    "name": "Fitness Park Calle Toledo",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "calle toledo",
      "la latina",
      "madrid",
      "fitnesspark"
    ],
    "address": "Calle de Toledo, 28005 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4078,
    "lng": -3.7126,
    "isVerified": true
  },
  {
    "name": "Fitness Park San Sebastián de los Reyes",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "san sebastian de los reyes",
      "sanse",
      "madrid",
      "fitnesspark"
    ],
    "address": "Av. de España, 28703 San Sebastián de los Reyes",
    "city": "San Sebastián de los Reyes",
    "province": "Madrid",
    "lat": 40.5471,
    "lng": -3.6264,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Atocha",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "atocha",
      "paseo delicias",
      "madrid",
      "basicfit"
    ],
    "address": "Paseo de las Delicias, 28045 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4035,
    "lng": -3.6932,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Goya",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "goya",
      "salamanca",
      "madrid",
      "basicfit"
    ],
    "address": "Calle de Goya, 28001 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4248,
    "lng": -3.6791,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Chamberí",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "chamberi",
      "santa engracia",
      "madrid",
      "basicfit"
    ],
    "address": "Calle de Santa Engracia, 28010 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4342,
    "lng": -3.7011,
    "isVerified": true
  },
  {
    "name": "VivaGym Madrid Cuzco",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "cuzco",
      "castellana",
      "madrid"
    ],
    "address": "Paseo de la Castellana, 140, 28046 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4571,
    "lng": -3.6892,
    "isVerified": true
  },
  {
    "name": "VivaGym Madrid Las Tablas",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "las tablas",
      "madrid"
    ],
    "address": "Paseo de la Tierra de Melide, 28050 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.5042,
    "lng": -3.6685,
    "isVerified": true
  },
  {
    "name": "Altafit Madrid Estudiantes",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "estudiantes",
      "serrano",
      "madrid"
    ],
    "address": "Calle de Serrano, 127, 28006 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4402,
    "lng": -3.6865,
    "isVerified": true
  },
  {
    "name": "Altafit Madrid Cuatro Caminos",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "cuatro caminos",
      "bravo murillo",
      "madrid"
    ],
    "address": "Calle de Bravo Murillo, 28020 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4491,
    "lng": -3.7038,
    "isVerified": true
  },
  {
    "name": "McFIT Madrid Nuevos Ministerios",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "nuevos ministerios",
      "raimundo fernandez villaverde",
      "madrid"
    ],
    "address": "Calle Raimundo Fernández Villaverde, 28003 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4468,
    "lng": -3.6985,
    "isVerified": true
  },
  {
    "name": "Club Metropolitan Eurobuilding",
    "brand": "Metropolitan",
    "aliases": [
      "metropolitan",
      "eurobuilding",
      "padre damian",
      "chamartin",
      "madrid"
    ],
    "address": "Calle de Padre Damián, 23, 28036 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4582,
    "lng": -3.6861,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barcelona - Casanova",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "casanova",
      "eixample",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Carrer de Casanova, 161, 08036 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3892,
    "lng": 2.1524,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barcelona - Berlín",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "berlin",
      "sants",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Carrer de Berlín, 50, Sants, 08029 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3831,
    "lng": 2.1387,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barcelona - Balmes",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "balmes",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Carrer de Balmes, 184, 08006 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3976,
    "lng": 2.1539,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barcelona - Diagonal Mar",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "diagonal mar",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Centro Comercial Diagonal Mar, Av. Diagonal, 3, 08019 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4089,
    "lng": 2.2157,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barcelona - La Maquinista",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "la maquinista",
      "sant andreu",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Centro Comercial Westfield La Maquinista, Carrer de Potosí, 2, 08030 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4414,
    "lng": 2.1983,
    "isVerified": true
  },
  {
    "name": "Fitness Park L'Illa Diagonal",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "l'illa",
      "diagonal",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Centro Comercial L'illa Diagonal, Av. Diagonal, 557, 08029 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3895,
    "lng": 2.1348,
    "isVerified": true
  },
  {
    "name": "Fitness Park Vilanova i la Geltrú",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "vilanova",
      "barcelona",
      "fitnesspark"
    ],
    "address": "Rambla de la Torre de l'Onclet, 08800 Vilanova i la Geltrú",
    "city": "Vilanova i la Geltrú",
    "province": "Barcelona",
    "lat": 41.2263,
    "lng": 1.7258,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Barcelona Sants",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "sants",
      "barcelona",
      "basicfit"
    ],
    "address": "Carrer de Sants, 08014 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3752,
    "lng": 2.1341,
    "isVerified": true
  },
  {
    "name": "VivaGym Barcelona Glòries",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "glories",
      "diagonal",
      "barcelona"
    ],
    "address": "Gran Via de les Corts Catalanes, 08018 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4038,
    "lng": 2.1882,
    "isVerified": true
  },
  {
    "name": "Altafit Barcelona Diagonal",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "diagonal",
      "mallorca",
      "barcelona"
    ],
    "address": "Carrer de Mallorca, 08037 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4012,
    "lng": 2.1691,
    "isVerified": true
  },
  {
    "name": "Club Metropolitan Sagrada Família",
    "brand": "Metropolitan",
    "aliases": [
      "metropolitan",
      "sagrada familia",
      "provenza",
      "barcelona"
    ],
    "address": "Carrer de Provença, 408, 08025 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4042,
    "lng": 2.1732,
    "isVerified": true
  },
  {
    "name": "Fitness Park Valencia - Aqua",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "aqua",
      "valencia",
      "fitnesspark"
    ],
    "address": "Centro Comercial Aqua, Carrer de Menorca, 19, 46023 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4589,
    "lng": -0.3475,
    "isVerified": true
  },
  {
    "name": "Fitness Park Valencia - Nou Mestalla",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "nou mestalla",
      "valencia",
      "fitnesspark"
    ],
    "address": "Carrer del Doctor Nicasi Benlloch, 46015 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4891,
    "lng": -0.3957,
    "isVerified": true
  },
  {
    "name": "Fitness Park Valencia - Ruzafa",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "ruzafa",
      "cuba",
      "valencia",
      "fitnesspark"
    ],
    "address": "Carrer de Cuba, Ruzafa, 46006 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4608,
    "lng": -0.3754,
    "isVerified": true
  },
  {
    "name": "Fitness Park Valencia - Marítim (Serrería)",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "maritim",
      "serreria",
      "valencia",
      "fitnesspark"
    ],
    "address": "Carrer de la Serradora, 46024 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4639,
    "lng": -0.3347,
    "isVerified": true
  },
  {
    "name": "Fitness Park Alfafar - MN4",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "mn4",
      "alfafar",
      "valencia",
      "fitnesspark"
    ],
    "address": "Centro Comercial MN4, Calle Alcalde José Puertes, 46910 Alfafar",
    "city": "Alfafar",
    "province": "Valencia",
    "lat": 39.4183,
    "lng": -0.3871,
    "isVerified": true
  },
  {
    "name": "Fitness Park Alicante - Gran Vía",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "gran via",
      "alicante",
      "fitnesspark"
    ],
    "address": "Centro Comercial Gran Vía, Calle José García Sellés, 2, 03015 Alicante",
    "city": "Alicante",
    "province": "Alicante",
    "lat": 38.3662,
    "lng": -0.4728,
    "isVerified": true
  },
  {
    "name": "Fitness Park Murcia - Thader",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "thader",
      "murcia",
      "fitnesspark"
    ],
    "address": "Centro Comercial Thader, Av. Juan de Borbón, 30110 Murcia",
    "city": "Murcia",
    "province": "Murcia",
    "lat": 38.0264,
    "lng": -1.1398,
    "isVerified": true
  },
  {
    "name": "Fitness Park Cartagena",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "cartagena",
      "murcia",
      "fitnesspark"
    ],
    "address": "Plaza Juan XXIII, 30201 Cartagena",
    "city": "Cartagena",
    "province": "Murcia",
    "lat": 37.6033,
    "lng": -0.9856,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Valencia Campanar",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "campanar",
      "valencia",
      "basicfit"
    ],
    "address": "Avinguda de Campanar, 46015 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4821,
    "lng": -0.3924,
    "isVerified": true
  },
  {
    "name": "VivaGym Valencia Cánovas",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "canovas",
      "gran via",
      "valencia"
    ],
    "address": "Carrer de Salamanca, 46005 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4641,
    "lng": -0.3672,
    "isVerified": true
  },
  {
    "name": "Fitness Park Málaga - Plaza Mayor",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "plaza mayor",
      "malaga",
      "fitnesspark"
    ],
    "address": "Centro Comercial Plaza Mayor, Calle Alfonso Ponce de León, 29004 Málaga",
    "city": "Málaga",
    "province": "Málaga",
    "lat": 36.6578,
    "lng": -4.4812,
    "isVerified": true
  },
  {
    "name": "Fitness Park Sevilla - Lagoh",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "lagoh",
      "sevilla",
      "fitnesspark"
    ],
    "address": "Centro Comercial Lagoh, Av. de Palmas Altas, 41012 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3371,
    "lng": -5.9868,
    "isVerified": true
  },
  {
    "name": "Fitness Park Granada - Nevada",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "nevada",
      "armilla",
      "granada",
      "fitnesspark"
    ],
    "address": "Centro Comercial Nevada Shopping, Av. de las Palmeras, 75, 18100 Armilla",
    "city": "Granada",
    "province": "Granada",
    "lat": 37.1438,
    "lng": -3.6189,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Sevilla Nervión",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "nervion",
      "sevilla",
      "basicfit"
    ],
    "address": "Calle Luis de Morales, 41018 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3824,
    "lng": -5.9741,
    "isVerified": true
  },
  {
    "name": "Synergym Málaga Reding",
    "brand": "Synergym",
    "aliases": [
      "synergym",
      "malaga",
      "reding",
      "malagueta"
    ],
    "address": "Paseo de Reding, 29016 Málaga",
    "city": "Málaga",
    "province": "Málaga",
    "lat": 36.7212,
    "lng": -4.4124,
    "isVerified": true
  },
  {
    "name": "VivaGym Sevilla Los Arcos",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "sevilla",
      "los arcos"
    ],
    "address": "Av. de Andalucía, 41007 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3921,
    "lng": -5.9624,
    "isVerified": true
  },
  {
    "name": "Fitness Park Bilbao - Intermodal",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "bilbao",
      "intermodal",
      "basurto",
      "fitnesspark"
    ],
    "address": "Gurtubay Kalea, 1, Basurtu-Zorrotza, 48013 Bilbao",
    "city": "Bilbao",
    "province": "Bizkaia",
    "lat": 43.2612,
    "lng": -2.9482,
    "isVerified": true
  },
  {
    "name": "Fitness Park Barakaldo - Megapark",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "megapark",
      "barakaldo",
      "bizkaia",
      "fitnesspark"
    ],
    "address": "Parque Comercial Megapark, 48902 Barakaldo",
    "city": "Barakaldo",
    "province": "Bizkaia",
    "lat": 43.2954,
    "lng": -2.9982,
    "isVerified": true
  },
  {
    "name": "Fitness Park Zaragoza - Puerto Venecia",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "puerto venecia",
      "zaragoza",
      "fitnesspark"
    ],
    "address": "Centro Comercial Puerto Venecia, Calle Teatro Malibrán, 50021 Zaragoza",
    "city": "Zaragoza",
    "province": "Zaragoza",
    "lat": 41.6083,
    "lng": -0.8872,
    "isVerified": true
  },
  {
    "name": "Fitness Park Zaragoza - Plaza Imperial",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "plaza imperial",
      "zaragoza",
      "fitnesspark"
    ],
    "address": "Av. Diagonal Plaza, 50197 Zaragoza",
    "city": "Zaragoza",
    "province": "Zaragoza",
    "lat": 41.6385,
    "lng": -0.9972,
    "isVerified": true
  },
  {
    "name": "Fitness Park Oviedo",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "oviedo",
      "asturias",
      "general elorza",
      "fitnesspark"
    ],
    "address": "Calle del General Elorza, 33001 Oviedo",
    "city": "Oviedo",
    "province": "Asturias",
    "lat": 43.3668,
    "lng": -5.8455,
    "isVerified": true
  },
  {
    "name": "Fitness Park Santander - Peñacastillo",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "santander",
      "penacastillo",
      "cantabria",
      "fitnesspark"
    ],
    "address": "Calle Joaquín Rodrigo, 2, 39011 Santander",
    "city": "Santander",
    "province": "Cantabria",
    "lat": 43.4478,
    "lng": -3.8562,
    "isVerified": true
  },
  {
    "name": "Altafit Vitoria - General Álava",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "vitoria",
      "gasteiz",
      "alava"
    ],
    "address": "Calle General Álava, 01005 Vitoria-Gasteiz",
    "city": "Vitoria-Gasteiz",
    "province": "Álava",
    "lat": 42.8465,
    "lng": -2.6732,
    "isVerified": true
  },
  {
    "name": "Altafit Gijón - Centro",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "gijon",
      "asturias"
    ],
    "address": "Calle Marqués de San Esteban, 33206 Gijón",
    "city": "Gijón",
    "province": "Asturias",
    "lat": 43.5412,
    "lng": -5.6672,
    "isVerified": true
  },
  {
    "name": "Altafit Vigo - Gran Vía",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "vigo",
      "pontevedra",
      "gran via"
    ],
    "address": "Av. da Gran Vía, 36203 Vigo",
    "city": "Vigo",
    "province": "Pontevedra",
    "lat": 42.2285,
    "lng": -8.7231,
    "isVerified": true
  },
  {
    "name": "McFIT A Coruña - Marineda City",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "coruna",
      "a coruna",
      "marineda city"
    ],
    "address": "Centro Comercial Marineda City, Carretera Baños de Arteixo, 15008 A Coruña",
    "city": "A Coruña",
    "province": "A Coruña",
    "lat": 43.3448,
    "lng": -8.4285,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Moncloa",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "moncloa",
      "madrid",
      "basicfit"
    ],
    "address": "Calle de Hilarión Eslava, 28015 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4352,
    "lng": -3.7178,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Bravo Murillo",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "bravo murillo",
      "tetuan",
      "madrid",
      "basicfit"
    ],
    "address": "Calle de Bravo Murillo, 28020 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4562,
    "lng": -3.7018,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Madrid Carabanchel",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "carabanchel",
      "general ricardos",
      "madrid",
      "basicfit"
    ],
    "address": "Calle General Ricardos, 28019 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.3912,
    "lng": -3.7254,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Leganés - Parquesur",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "leganes",
      "parquesur",
      "madrid",
      "basicfit"
    ],
    "address": "Centro Comercial Parquesur, 28916 Leganés",
    "city": "Leganés",
    "province": "Madrid",
    "lat": 40.3361,
    "lng": -3.7548,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Getafe - Centro",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "getafe",
      "madrid",
      "basicfit"
    ],
    "address": "Calle Madrid, 28902 Getafe",
    "city": "Getafe",
    "province": "Madrid",
    "lat": 40.3082,
    "lng": -3.7315,
    "isVerified": true
  },
  {
    "name": "VivaGym Madrid Embajadores",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "embajadores",
      "lavapies",
      "madrid"
    ],
    "address": "Calle de Embajadores, 28012 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4065,
    "lng": -3.7008,
    "isVerified": true
  },
  {
    "name": "VivaGym Madrid Plenilunio",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "plenilunio",
      "barajas",
      "madrid"
    ],
    "address": "Centro Comercial Plenilunio, Calle Aracne, 28022 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4438,
    "lng": -3.5852,
    "isVerified": true
  },
  {
    "name": "Altafit Madrid Pozuelo",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "pozuelo",
      "pozuelo de alarcon",
      "madrid"
    ],
    "address": "Calle Vía de las Dos Castillas, 28224 Pozuelo de Alarcón",
    "city": "Pozuelo de Alarcón",
    "province": "Madrid",
    "lat": 40.4385,
    "lng": -3.8012,
    "isVerified": true
  },
  {
    "name": "Altafit Madrid Alcorcón",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "alcorcon",
      "madrid"
    ],
    "address": "Av. de Leganés, 28921 Alcorcón",
    "city": "Alcorcón",
    "province": "Madrid",
    "lat": 40.3478,
    "lng": -3.8215,
    "isVerified": true
  },
  {
    "name": "Synergym Madrid Chamberí",
    "brand": "Synergym",
    "aliases": [
      "synergym",
      "chamberi",
      "santa engracia",
      "madrid"
    ],
    "address": "Calle de Santa Engracia, 28010 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4328,
    "lng": -3.7005,
    "isVerified": true
  },
  {
    "name": "McFIT Madrid Ventas",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "ventas",
      "alcala",
      "madrid"
    ],
    "address": "Calle de Alcalá, 28028 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4321,
    "lng": -3.6645,
    "isVerified": true
  },
  {
    "name": "Club Metropolitan Abascal",
    "brand": "Metropolitan",
    "aliases": [
      "metropolitan",
      "abascal",
      "jose abascal",
      "chamberi",
      "madrid"
    ],
    "address": "Calle de José Abascal, 46, 28003 Madrid",
    "city": "Madrid",
    "province": "Madrid",
    "lat": 40.4378,
    "lng": -3.6961,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Barcelona Girona",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "girona",
      "eixample",
      "barcelona",
      "basicfit"
    ],
    "address": "Carrer de Girona, 08009 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3965,
    "lng": 2.1712,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Badalona",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "badalona",
      "barcelona",
      "basicfit"
    ],
    "address": "Avinguda del Marquès de Mont-Roig, 08918 Badalona",
    "city": "Badalona",
    "province": "Barcelona",
    "lat": 41.4418,
    "lng": 2.2351,
    "isVerified": true
  },
  {
    "name": "VivaGym Barcelona Manso",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "manso",
      "sant antoni",
      "barcelona"
    ],
    "address": "Carrer de Manso, 08015 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3768,
    "lng": 2.1612,
    "isVerified": true
  },
  {
    "name": "VivaGym Barcelona Meridiana",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "meridiana",
      "sagrera",
      "barcelona"
    ],
    "address": "Avinguda Meridiana, 08027 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4241,
    "lng": 2.1895,
    "isVerified": true
  },
  {
    "name": "Altafit Barcelona Sant Martí",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "sant marti",
      "clot",
      "barcelona"
    ],
    "address": "Carrer de Guipúscoa, 08018 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4152,
    "lng": 2.1965,
    "isVerified": true
  },
  {
    "name": "McFIT Barcelona El Clot",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "el clot",
      "mallorca",
      "barcelona"
    ],
    "address": "Carrer de Mallorca, 08026 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.4112,
    "lng": 2.1878,
    "isVerified": true
  },
  {
    "name": "Club Metropolitan Iradier",
    "brand": "Metropolitan",
    "aliases": [
      "metropolitan",
      "iradier",
      "sarria",
      "barcelona"
    ],
    "address": "Carrer de les Escoles Pies, 105, 08017 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3985,
    "lng": 2.1285,
    "isVerified": true
  },
  {
    "name": "Club Metropolitan Las Arenas",
    "brand": "Metropolitan",
    "aliases": [
      "metropolitan",
      "las arenas",
      "plaza espana",
      "barcelona"
    ],
    "address": "Centro Comercial Arenas, Gran Via de les Corts Catalanes, 08015 Barcelona",
    "city": "Barcelona",
    "province": "Barcelona",
    "lat": 41.3762,
    "lng": 2.1492,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Valencia Gran Vía",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "gran via",
      "marques del turia",
      "valencia",
      "basicfit"
    ],
    "address": "Gran Via del Marqués del Túria, 46005 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 41.4648,
    "lng": -0.3685,
    "isVerified": true
  },
  {
    "name": "VivaGym Valencia Campanar",
    "brand": "VivaGym",
    "aliases": [
      "vivagym",
      "campanar",
      "valencia"
    ],
    "address": "Carrer de Valle de la Ballestera, 46015 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 41.4815,
    "lng": -0.3985,
    "isVerified": true
  },
  {
    "name": "Synergym Valencia Puerto",
    "brand": "Synergym",
    "aliases": [
      "synergym",
      "valencia",
      "puerto",
      "avenida del puerto"
    ],
    "address": "Avinguda del Port, 46021 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4665,
    "lng": -0.3512,
    "isVerified": true
  },
  {
    "name": "McFIT Valencia Campanar",
    "brand": "McFIT",
    "aliases": [
      "mcfit",
      "campanar",
      "valencia"
    ],
    "address": "Avinguda de les Corts Valencianes, 46015 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 41.4885,
    "lng": -0.3995,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Alicante Maisonnave",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "alicante",
      "maisonnave",
      "basicfit"
    ],
    "address": "Av. Federico Soto, 03003 Alicante",
    "city": "Alicante",
    "province": "Alicante",
    "lat": 38.3451,
    "lng": -0.4905,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Sevilla Triana",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "triana",
      "sevilla",
      "basicfit"
    ],
    "address": "Calle San Jacinto, 41010 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3821,
    "lng": -6.0045,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Sevilla Los Remedios",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "los remedios",
      "republica argentina",
      "sevilla",
      "basicfit"
    ],
    "address": "Av. República Argentina, 41011 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3778,
    "lng": -5.9985,
    "isVerified": true
  },
  {
    "name": "Synergym Sevilla Nervión",
    "brand": "Synergym",
    "aliases": [
      "synergym",
      "sevilla",
      "nervion",
      "eduardo dato"
    ],
    "address": "Av. de Eduardo Dato, 41005 Sevilla",
    "city": "Sevilla",
    "province": "Sevilla",
    "lat": 37.3828,
    "lng": -5.9725,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Málaga Teatinos",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "malaga",
      "teatinos",
      "basicfit"
    ],
    "address": "Calle Mesonero Romanos, 29010 Málaga",
    "city": "Málaga",
    "province": "Málaga",
    "lat": 36.7195,
    "lng": -4.4695,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Granada Neptuno",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "granada",
      "neptuno",
      "basicfit"
    ],
    "address": "Centro Comercial Neptuno, Calle Arabial, 18004 Granada",
    "city": "Granada",
    "province": "Granada",
    "lat": 37.1695,
    "lng": -3.6085,
    "isVerified": true
  },
  {
    "name": "Synergym Córdoba Vial",
    "brand": "Synergym",
    "aliases": [
      "synergym",
      "cordoba",
      "vial norte"
    ],
    "address": "Paseo de Córdoba, 14008 Córdoba",
    "city": "Córdoba",
    "province": "Córdoba",
    "lat": 37.8921,
    "lng": -4.7815,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Zaragoza Delicias",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "zaragoza",
      "delicias",
      "basicfit"
    ],
    "address": "Calle de las Delicias, 50017 Zaragoza",
    "city": "Zaragoza",
    "province": "Zaragoza",
    "lat": 41.6521,
    "lng": -0.9085,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Bilbao Deusto",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "bilbao",
      "deusto",
      "vizcaya",
      "basicfit"
    ],
    "address": "Lehendakari Aguirre Kalea, 48014 Bilbao",
    "city": "Bilbao",
    "province": "Bizkaia",
    "lat": 43.2731,
    "lng": -2.9465,
    "isVerified": true
  },
  {
    "name": "Altafit Bilbao Indautxu",
    "brand": "Altafit",
    "aliases": [
      "altafit",
      "bilbao",
      "indautxu"
    ],
    "address": "Urkixo Zumarkalea, 48011 Bilbao",
    "city": "Bilbao",
    "province": "Bizkaia",
    "lat": 43.2605,
    "lng": -2.9392,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Palma Aragó",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "palma de mallorca",
      "arago",
      "mallorca",
      "basicfit"
    ],
    "address": "Carrer d'Aragó, 07005 Palma de Mallorca",
    "city": "Palma de Mallorca",
    "province": "Illes Balears",
    "lat": 39.5785,
    "lng": 2.6651,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Valladolid Paseo Zorrilla",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "valladolid",
      "paseo zorrilla",
      "basicfit"
    ],
    "address": "Paseo de Zorrilla, 47007 Valladolid",
    "city": "Valladolid",
    "province": "Valladolid",
    "lat": 41.6421,
    "lng": -4.7395,
    "isVerified": true
  },
  {
    "name": "Basic-Fit Vigo Travesía",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "vigo",
      "travesia",
      "basicfit"
    ],
    "address": "Travesía de Vigo, 36206 Vigo",
    "city": "Vigo",
    "province": "Pontevedra",
    "lat": 42.2395,
    "lng": -8.7051,
    "isVerified": true
  },
  {
    "name": "Basic-Fit A Coruña Ronda Outeiro",
    "brand": "Basic-Fit",
    "aliases": [
      "basic fit",
      "basic-fit",
      "a coruna",
      "coruna",
      "ronda outeiro",
      "basicfit"
    ],
    "address": "Rolda de Outeiro, 15007 A Coruña",
    "city": "A Coruña",
    "province": "A Coruña",
    "lat": 43.3562,
    "lng": -8.4145,
    "isVerified": true
  },
  {
    "name": "Fitness Park Valencia - Camí de Montcada",
    "brand": "Fitness Park",
    "aliases": [
      "fitness park",
      "fitnesspark"
    ],
    "address": "Camí de Montcada, 85, 46019 València",
    "city": "Valencia",
    "province": "Valencia",
    "lat": 39.4921,
    "lng": -0.3789,
    "isVerified": true
  }
];

/**
 * Búsqueda local ultrarrápida con tolerancia a frases coloquiales (ej: "un go fit en las canteras"),
 * apodos, marcas, calles, barrios y distancias GPS.
 */
export function searchLocalGyms(queryText, activeCoords = null) {
  const q = (queryText || '').trim();
  if (!q) return [];

  const { norm, significant } = cleanSearchTokens(q);
  if (significant.length === 0) return [];

  const matches = [];

  for (const gym of POPULAR_SPAIN_GYMS) {
    const gymText = normalizeGymText(`${gym.name} ${gym.brand} ${gym.address} ${gym.city} ${gym.province}`);
    const aliasTexts = (gym.aliases || []).map(normalizeGymText);
    const allSearchable = [gymText, ...aliasTexts].join(' ');

    let score = 0;

    // 1. Coincidencia de frase exacta
    if (gymText.includes(norm) || aliasTexts.some(a => a.includes(norm) || norm.includes(a))) {
      score += 100;
    }

    // 2. Coincidencia de tokens significativos
    const matchedTokens = significant.filter(token => allSearchable.includes(token));
    const matchCount = matchedTokens.length;
    const matchesAllTokens = matchCount === significant.length;

    if (matchesAllTokens) {
      score += 60;
    } else if (significant.length >= 2) {
      // Si la búsqueda tiene varias palabras, solo damos puntos si coincide una proporción relevante
      const minRequired = Math.max(2, Math.ceil(significant.length * 0.65));
      if (matchCount >= minRequired) {
        score += matchCount * 15;
      }
    } else if (matchCount === 1) {
      score += 25;
    }

    // Solo se incluye si hubo coincidencia relevante
    const isRelevant = score >= 50 || (significant.length === 1 && score >= 25);

    if (isRelevant) {
      let distanceMeters = null;
      let distanceFormatted = null;
      if (activeCoords?.lat && activeCoords?.lng && gym.lat && gym.lng) {
        distanceMeters = calculateDistance(activeCoords.lat, activeCoords.lng, gym.lat, gym.lng);
        distanceFormatted = formatDistance(distanceMeters);
      }

      matches.push({
        id: `local_${gym.name}_${gym.city}`.replace(/\s+/g, '_'),
        name: gym.name,
        brand: gym.brand,
        address: gym.address,
        city: gym.city,
        suburb: gym.province,
        lat: gym.lat,
        lng: gym.lng,
        distanceMeters,
        distanceFormatted,
        isVerified: true,
        matchScore: score
      });
    }
  }

  // Ordenar por score de coincidencia y luego por distancia si hay GPS
  matches.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    if (a.distanceMeters != null && b.distanceMeters != null) {
      return a.distanceMeters - b.distanceMeters;
    }
    return 0;
  });

  return matches;
}
