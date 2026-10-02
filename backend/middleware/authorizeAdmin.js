const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // El usuario es admin, puede continuar
    } else {
        res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
};

export default authorizeAdmin;