import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // 1. Leer el token desde las cookies
    const token = req.cookies.token;
    // --- FIN ---

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

export default authenticateToken;