/* backend/middleware/authenticateToken.js */
import jwt from 'jsonwebtoken';
import models from '../models/index.js';

const { UserSession } = models;

/**
 * Middleware para verificar el token JWT de las peticiones.
 * Ahora también verifica que la sesión exista y esté activa en la base de datos.
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
        // 1. Verificar firma y expiración del JWT (síncrono/librería)
        const user = jwt.verify(token, process.env.JWT_SECRET);

        // 2. Verificar si la sesión existe en la BBDD
        // Esto es crucial para poder revocar acceso (cerrar sesión en dispositivos específicos)
        const session = await UserSession.findOne({ where: { token } });

        if (!session) {
            return res.status(403).json({ error: 'Sesión no válida o expirada (revocada).' });
        }

        // 3. Actualizar 'last_active' (sin await para no bloquear respuesta)
        session.update({ last_active: new Date() }).catch(err =>
            console.error("Error actualizando last_active de sesión:", err)
        );

        // 4. Adjuntar usuario y sesión a la request
        req.user = user;
        req.userSessionId = session.id;
        next();

    } catch (err) {
        // Si jwt.verify falla o hay error de base de datos
        return res.status(403).json({ error: 'Token no válido o expirado.' });
    }
};

export default authenticateToken;