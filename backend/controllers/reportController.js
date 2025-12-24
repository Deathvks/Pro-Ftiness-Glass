/* backend/controllers/reportController.js */
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');

const { BugReport, User } = db;

export const createReport = async (req, res) => {
    try {
        const { category, subject, description, deviceInfo: deviceInfoStr } = req.body;
        const userId = req.user.userId || req.user.id;

        if (!userId) return res.status(401).json({ error: 'No se pudo identificar al usuario.' });
        if (!category || !subject || !description) return res.status(400).json({ error: 'Campos obligatorios faltantes.' });

        let deviceInfo = null;
        if (deviceInfoStr) {
            try { deviceInfo = JSON.parse(deviceInfoStr); } catch (e) { console.warn("Error parse deviceInfo", e); }
        }

        const images = [];
        if (req.files && req.files.length > 0) {
            const reportUploadsDir = path.join(PUBLIC_DIR, 'uploads', 'reports');
            if (!fs.existsSync(reportUploadsDir)) fs.mkdirSync(reportUploadsDir, { recursive: true });

            for (const file of req.files) {
                const newFileName = `bug-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                const newPath = path.join(reportUploadsDir, newFileName);

                // Procesamos el buffer directamente desde memoria a WebP
                await sharp(file.buffer)
                    .webp({ quality: 80 })
                    .toFile(newPath);

                images.push(`/uploads/reports/${newFileName}`);
            }
        }

        const newReport = await BugReport.create({
            user_id: userId,
            category,
            subject,
            description,
            deviceInfo,
            images,
            status: 'open'
        });

        res.status(201).json(newReport);
    } catch (error) {
        console.error('Error al crear reporte:', error);
        res.status(500).json({ error: 'Error interno al guardar el reporte' });
    }
};

export const getReports = async (req, res) => {
    try {
        const reports = await BugReport.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['username', 'email']
            }],
            order: [['created_at', 'DESC']]
        });

        const formattedReports = reports.map(r => ({
            id: r.id,
            category: r.category,
            subject: r.subject,
            description: r.description,
            deviceInfo: r.deviceInfo,
            images: r.images || [],
            status: r.status,
            created_at: r.created_at,
            username: r.user ? (r.user.username || 'Usuario sin nombre') : 'Anónimo',
            email: r.user ? r.user.email : ''
        }));

        res.json(formattedReports);
    } catch (error) {
        res.status(500).json({ error: 'Error al cargar los reportes' });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BugReport.findByPk(id);

        if (!report) return res.status(404).json({ error: 'No encontrado' });

        if (report.images) {
            report.images.forEach(imgUrl => {
                const fullPath = path.join(PUBLIC_DIR, imgUrl);
                if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
            });
        }

        await report.destroy();
        res.json({ message: 'Resuelto correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};