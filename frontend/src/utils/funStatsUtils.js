/* frontend/src/utils/funStatsUtils.js */

// ==========================================
// 1. COMPARACIONES DE PESO (Volumen Total)
// ==========================================
const WEIGHT_ITEMS = [
    { name: 'Gato Gordo', singular: 'Gato Gordo', weight: 5, icon: '🐱' },
    { name: 'Bicicletas', singular: 'Bicicleta', weight: 12, icon: '🚲' },
    { name: 'Microondas', singular: 'Microondas', weight: 15, icon: '⚡' },
    { name: 'Border Collies', singular: 'Border Collie', weight: 20, icon: '🐕' },
    { name: 'Sofás', singular: 'Sofá', weight: 50, icon: '🛋️' },
    { name: 'Lavadoras', singular: 'Lavadora', weight: 70, icon: '🧼' },
    { name: 'Neveras Americanas', singular: 'Nevera', weight: 100, icon: '❄️' },
    { name: 'Motos Deportivas', singular: 'Moto', weight: 180, icon: '🏍️' },
    { name: 'Leones Adultos', singular: 'León', weight: 200, icon: '🦁' },
    { name: 'Pianos de Cola', singular: 'Piano', weight: 350, icon: '🎹' },
    { name: 'Toros de Lidia', singular: 'Toro', weight: 500, icon: '🐂' },
    { name: 'Coches Smart', singular: 'Smart', weight: 800, icon: '🚗' },
    { name: 'Toyota Yaris', singular: 'Toyota Yaris', weight: 1100, icon: '🚙' },
    { name: 'Hipopótamos', singular: 'Hipopótamo', weight: 1500, icon: '🦛' },
    { name: 'Camionetas', singular: 'Camioneta', weight: 2500, icon: '🛻' },
    { name: 'T-Rex', singular: 'T-Rex', weight: 8000, icon: '🦖' },
    { name: 'Aviones F-16', singular: 'F-16', weight: 12000, icon: '✈️' },
    { name: 'Ballenas Jorobadas', singular: 'Ballena', weight: 30000, icon: '🐋' },
    { name: 'Transbordadores Espaciales', singular: 'Transbordador', weight: 75000, icon: '🚀' }
];

export const getFunWeightComparison = (totalKg) => {
    if (!totalKg || totalKg <= 0) return null;

    // Buscar el item que dé un número entre 1 y 10 (aprox) para que sea visualizable
    // Preferimos decir "3 Coches" a "500 Gatos" o "0.01 Ballenas"
    let bestMatch = WEIGHT_ITEMS[0];
    let bestCount = totalKg / bestMatch.weight;

    for (const item of WEIGHT_ITEMS) {
        const count = totalKg / item.weight;
        // Si el conteo es >= 1 y más pequeño que el actual "mejor" (pero sigue siendo >= 1)
        // O si el actual es demasiado grande (> 20) y este es más manejable
        if ((count >= 1 && count < bestCount) || (bestCount > 20 && count >= 1)) {
            bestMatch = item;
            bestCount = count;
        }
    }

    // Redondear a 1 decimal si es < 10, o entero si es > 10
    const finalCount = bestCount < 10 ? parseFloat(bestCount.toFixed(1)) : Math.round(bestCount);
    
    // Pluralización básica
    const label = finalCount === 1 ? bestMatch.singular : bestMatch.name;

    return {
        text: `Has levantado el equivalente a ${finalCount} ${label}`,
        highlight: `${finalCount} ${label}`,
        icon: bestMatch.icon,
        rawCount: finalCount,
        item: bestMatch.singular
    };
};

// ==========================================
// 2. COMPARACIONES DE CALORÍAS
// ==========================================
const CALORIE_ITEMS = [
    { name: 'Ositos de Goma', singular: 'Osito de Goma', kcal: 10, icon: '🧸' },
    { name: 'Galletas', singular: 'Galleta', kcal: 50, icon: '🍪' },
    { name: 'Plátanos', singular: 'Plátano', kcal: 90, icon: '🍌' },
    { name: 'Latas de Cola', singular: 'Lata de Cola', kcal: 140, icon: '🥤' },
    { name: 'Cervezas', singular: 'Cerveza', kcal: 150, icon: '🍺' },
    { name: 'Donuts', singular: 'Donut', kcal: 250, icon: '🍩' },
    { name: 'Porciones de Pizza', singular: 'Porción de Pizza', kcal: 300, icon: '🍕' },
    { name: 'Hamburguesas', singular: 'Hamburguesa', kcal: 550, icon: '🍔' },
    { name: 'Burritos XL', singular: 'Burrito XL', kcal: 900, icon: '🌯' },
    { name: 'Menús de Cine', singular: 'Menú de Cine', kcal: 1200, icon: '🍿' },
    { name: 'Pizzas Familiares', singular: 'Pizza Familiar', kcal: 2200, icon: '🥘' }
];

export const getFunCalorieComparison = (totalKcal) => {
    if (!totalKcal || totalKcal <= 0) return null;

    let bestMatch = CALORIE_ITEMS[0];
    let bestCount = totalKcal / bestMatch.kcal;

    for (const item of CALORIE_ITEMS) {
        const count = totalKcal / item.kcal;
        if ((count >= 1 && count < bestCount) || (bestCount > 20 && count >= 1)) {
            bestMatch = item;
            bestCount = count;
        }
    }

    const finalCount = bestCount < 10 ? parseFloat(bestCount.toFixed(1)) : Math.round(bestCount);
    const label = finalCount === 1 ? bestMatch.singular : bestMatch.name;

    return {
        text: `Has quemado ${finalCount} ${label}`,
        highlight: `${finalCount} ${label}`,
        icon: bestMatch.icon,
        rawCount: finalCount,
        item: bestMatch.singular
    };
};

// ==========================================
// 3. COMPARACIONES DE TIEMPO
// ==========================================
const TIME_ITEMS = [
    { name: 'TikToks', singular: 'TikTok', mins: 0.5, icon: '📱' },
    { name: 'Canciones de Queen', singular: 'Canción', mins: 3.5, icon: '🎵' },
    { name: 'Partidas de Mario Kart', singular: 'Partida', mins: 5, icon: '🏎️' },
    { name: 'Episodios de Anime', singular: 'Episodio', mins: 20, icon: '📺' },
    { name: 'Capítulos de Serie', singular: 'Capítulo', mins: 45, icon: '🎬' },
    { name: 'Partidos de Fútbol', singular: 'Partido', mins: 90, icon: '⚽' },
    { name: 'Películas de Marvel', singular: 'Película', mins: 140, icon: '🍿' },
    { name: 'Vuelos Madrid-Londres', singular: 'Vuelo', mins: 150, icon: '✈️' },
    { name: 'Trilogías del Señor de los Anillos', singular: 'Trilogía', mins: 680, icon: '💍' }
];

export const getFunTimeComparison = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) return null;
    const minutes = totalSeconds / 60;

    let bestMatch = TIME_ITEMS[0];
    let bestCount = minutes / bestMatch.mins;

    for (const item of TIME_ITEMS) {
        const count = minutes / item.mins;
        if ((count >= 1 && count < bestCount) || (bestCount > 20 && count >= 1)) {
            bestMatch = item;
            bestCount = count;
        }
    }

    const finalCount = bestCount < 10 ? parseFloat(bestCount.toFixed(1)) : Math.round(bestCount);
    const label = finalCount === 1 ? bestMatch.singular : bestMatch.name;

    return {
        text: `Entrenaste el tiempo de ${finalCount} ${label}`,
        highlight: `${finalCount} ${label}`,
        icon: bestMatch.icon,
        rawCount: finalCount,
        item: bestMatch.singular
    };
};

// ==========================================
// 4. GENERADOR DE FRASE ALEATORIA (Motivational/Sarcastic)
// ==========================================
const QUOTES = [
    "Tu sofá te echa de menos, pero tus músculos no.",
    "Eres oficialmente una máquina de quemar combustible.",
    "Gravedad: 0, Tú: 1.",
    "Si esto fuera un videojuego, acabas de subir de nivel.",
    "Más fuerte que el café del lunes por la mañana.",
    "Tus excusas están llorando en un rincón ahora mismo.",
    "Hércules estaría orgulloso (probablemente).",
    "Has sudado más que un testigo falso.",
    "Hoy has sido tu propio superhéroe.",
    "Bestia modo: ACTIVADO."
];

export const getRandomQuote = () => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
};