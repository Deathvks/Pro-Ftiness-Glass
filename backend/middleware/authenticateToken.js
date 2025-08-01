import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    const token = req.cookies.token;

    if (token == null) {
        // Devuelve un error en formato JSON
        return res.status(401).json({ error: 'Token no proporcionado.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Devuelve un error en formato JSON
            return res.status(403).json({ error: 'Token no válido o sesión expirada.' });
        }
        req.user = user;
        next();
    });
};

export default authenticateToken;