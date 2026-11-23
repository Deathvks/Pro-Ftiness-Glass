import models from '../models/index.js';

const authorizeRoles = (roles, message) => async (req, res, next) => {
    try {
        const account = req.user?.userId == null
            ? null
            : await models.User.findByPk(req.user.userId, { attributes: ['role'], raw: true });

        if (!roles.includes(account?.role)) {
            return res.status(403).json({ error: message });
        }

        // A long-lived session can predate a promotion or a demotion.
        req.user.role = account.role;
        return next();
    } catch (error) {
        return next(error);
    }
};

export const authorizeTrainer = authorizeRoles(['trainer', 'admin'], 'Acceso denegado. Se requiere rol de entrenador.');
export default authorizeRoles(['admin'], 'Acceso denegado. Se requiere rol de administrador.');
