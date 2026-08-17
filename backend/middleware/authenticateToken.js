/* backend/middleware/authenticateToken.js */
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { UserSession } = models;

/**
 * Middleware para verificar JWT y gestionar sesión.
 * OPTIMIZADO: Reduce escrituras en DB un 99%.
 */
const authenticateToken = async (req, res, next) => {
    // Obtener el token del header 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    // Si no hay token, denegar el acceso
    if (token == null) {
        return res.status(401).json({ error: 'Acceso no autorizado. Se requiere token.' });
    }

    try {
        // 1. Verificar firma y expiración del JWT (síncrono/librería - Rápido en CPU)
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Verificar si la sesión existe en la BBDD (Lectura rápida)
        const session = await UserSession.findOne({ where: { token } });

        if (!session) {
            return res.status(403).json({ error: 'Sesión no válida o expirada (revocada).' });
        }

        // --- OPTIMIZACIÓN CRÍTICA (AHORRO DE DINERO) ---
        // Problema: Actualizar la DB en cada petición consume I/O y CPU excesivo.
        // Solución: Solo actualizamos 'last_active' y 'lastSeen' si han pasado más de 5 MINUTOS.
        const fiveMinutes = 5 * 60 * 1000;
        const now = new Date();
        const lastActive = new Date(session.last_active);

        if (now - lastActive > fiveMinutes) {
            // Ejecutamos update en segundo plano (sin await) para no frenar la respuesta
            session.update({ last_active: now }).catch(err =>
                console.error("[Auth] Error actualizando heartbeat de sesión:", err.message)
            );
            models.User.update({ lastSeen: now }, { where: { id: session.user_id } }).catch(err =>
                console.error("[Auth] Error actualizando lastSeen de usuario:", err.message)
            );
        }
        // ----------------------------------------------

        // 4. Adjuntar usuario y sesión a la request
        req.user = user;
        req.userSessionId = session.id;
        next();

    } catch (err) {
        return res.status(403).json({ error: 'Token no válido o expirado.' });
    }
};

export default authenticateToken;