/* frontend/src/utils/gpsUtils.js */

// Radio de la Tierra en metros
const R = 6371e3;

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
};

export const formatDistance = (meters) => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
};

export const calculatePace = (seconds, meters) => {
    if (meters === 0) return '0:00 /km';
    const km = meters / 1000;
    const paceSeconds = seconds / km;

    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = Math.round(paceSeconds % 60);

    return `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} /km`;
};