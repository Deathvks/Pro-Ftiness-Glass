/* backend/controllers/sessionController.js */
import models from '../models/index.js';

const { UserSession } = models;

// Obtener todas las sesiones activas del usuario
export const getUserSessions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const currentSessionId = req.userSessionId; // Viene del middleware authenticateToken

        const sessions = await UserSession.findAll({
            where: { user_id: userId },
            order: [['last_active', 'DESC']],
            attributes: ['id', 'device_type', 'device_name', 'ip_address', 'last_active', 'created_at'] // No enviamos el token por seguridad
        });

        // Añadir flag 'is_current' para que el front sepa cuál es la actual
        const sessionsWithCurrentFlag = sessions.map(session => ({
            ...session.toJSON(),
            is_current: session.id === currentSessionId
        }));

        res.json(sessionsWithCurrentFlag);
    } catch (error) {
        next(error);
    }
};

// Revocar (eliminar) una sesión específica
export const revokeSession = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { sessionId } = req.params;

        const session = await UserSession.findOne({
            where: {
                id: sessionId,
                user_id: userId
            }
        });

        if (!session) {
            return res.status(404).json({ error: 'Sesión no encontrada.' });
        }

        await session.destroy();

        res.json({ message: 'Sesión cerrada correctamente.' });
    } catch (error) {
        next(error);
    }
};

// Revocar todas las sesiones EXCEPTO la actual
export const revokeAllOtherSessions = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const currentSessionId = req.userSessionId;

        if (!currentSessionId) {
            return res.status(400).json({ error: 'No se pudo identificar la sesión actual.' });
        }

        // Importante: Usar Op.ne (not equal)
        const { Op } = models.sequelize.Sequelize;

        await UserSession.destroy({
            where: {
                user_id: userId,
                id: { [Op.ne]: currentSessionId }
            }
        });

        res.json({ message: 'Se han cerrado todas las otras sesiones.' });
    } catch (error) {
        next(error);
    }
};