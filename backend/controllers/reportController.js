/* backend/controllers/reportController.js */
import db from '../models/index.js';

const { BugReport, User } = db;

// Crear un nuevo reporte (Usuario autenticado)
export const createReport = async (req, res) => {
    try {
        const { subject, description, deviceInfo } = req.body;

        // --- CORRECCIÓN ---
        // Intentamos obtener el ID de req.user.userId (lo más probable según tu server.js)
        // o de req.user.id por si acaso.
        const userId = req.user.userId || req.user.id;

        // Verificación de seguridad extra
        if (!userId) {
            console.error("Error: Token decodificado no contiene userId ni id:", req.user);
            return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
        }

        if (!subject || !description) {
            return res.status(400).json({ error: 'Asunto y descripción son obligatorios' });
        }

        const newReport = await BugReport.create({
            user_id: userId,
            subject,
            description,
            deviceInfo,
            status: 'open'
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error al crear reporte:', error);
        // Enviamos el error específico si es de validación, para facilitar el debug
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ error: error.errors[0].message });
        }
        res.status(500).json({ error: 'Error interno al guardar el reporte' });
    }
};

// Obtener todos los reportes (Solo Admin)
export const getReports = async (req, res) => {
    try {
        const reports = await BugReport.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email'] // Traemos datos básicos del usuario
            }],
            order: [['created_at', 'DESC']] // Los más recientes primero
        });

        // Formateamos para facilitar la lectura en el frontend
        const formattedReports = reports.map(r => ({
            id: r.id,
            subject: r.subject,
            description: r.description,
            deviceInfo: r.deviceInfo,
            status: r.status,
            created_at: r.created_at,
            username: r.user ? (r.user.username || 'Usuario sin nombre') : 'Usuario eliminado',
            email: r.user ? r.user.email : ''
        }));

        res.json(formattedReports);
    } catch (error) {
        console.error('Error al obtener reportes:', error);
        res.status(500).json({ error: 'Error al cargar los reportes' });
    }
};

// Eliminar/Resolver un reporte (Solo Admin)
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await BugReport.destroy({
            where: { id }
        });

        if (!deleted) {
            return res.status(404).json({ error: 'Reporte no encontrado' });
        }

        res.json({ message: 'Reporte eliminado/resuelto correctamente' });
    } catch (error) {
        console.error('Error al eliminar reporte:', error);
        res.status(500).json({ error: 'Error al eliminar el reporte' });
    }
};