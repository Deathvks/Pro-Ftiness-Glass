import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // Buscar el token en la cabecera 'Authorization' en lugar de las cookies.
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"
    // --- FIN DE LA CORRECCIÓN ---

    if (token == null) {
        return res.status(401).json({ error: 'Token no proporcionado.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token no válido o sesión expirada.' });
        }
        req.user = user;
        next();
    });
};

export default authenticateToken;