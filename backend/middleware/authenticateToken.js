import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar el token JWT de las peticiones.
 */
const authenticateToken = (req, res, next) => {
    // Obtener el token del header 'Authorization'
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    // Si no hay token, denegar el acceso
    if (token == null) {
        return res.status(401).json({ error: 'Acceso no autorizado. Se requiere token.' });
    }

    // Verificar el token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Si el token no es válido (expirado, malformado, etc.)
            return res.status(403).json({ error: 'Token no válido o expirado.' });
        }
        // Si el token es válido, añadir los datos del usuario a la petición
        req.user = user;
        next(); // Pasar al siguiente middleware o a la ruta
    });
};

export default authenticateToken;