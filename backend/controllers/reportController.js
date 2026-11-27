/* backend/controllers/reportController.js */
import db from '../models/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createNotification } from '../services/notificationService.js';
import { sendBugReportResolvedEmail } from '../services/emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PRIVATE_REPORTS_DIR = path.resolve(__dirname, '../storage/reports');
const LEGACY_PUBLIC_REPORTS_DIR = path.join(PUBLIC_DIR, 'uploads', 'reports');
const SAFE_REPORT_FILENAME = /^[a-zA-Z0-9_-]+\.(webp|png|jpe?g)$/i;

const resolveReportImageFile = (rawFileName) => {
    const cleanName = path.basename(String(rawFileName || ''));
    if (!SAFE_REPORT_FILENAME.test(cleanName)) return null;

    const candidates = [PRIVATE_REPORTS_DIR, LEGACY_PUBLIC_REPORTS_DIR];
    for (const dir of candidates) {
        const candidate = path.resolve(dir, cleanName);
        if (candidate.startsWith(dir + path.sep) && fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
};

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
            if (!fs.existsSync(PRIVATE_REPORTS_DIR)) fs.mkdirSync(PRIVATE_REPORTS_DIR, { recursive: true });

            for (const file of req.files) {
                const newFileName = `bug-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
                const newPath = path.join(PRIVATE_REPORTS_DIR, newFileName);

                // Procesamos el buffer directamente desde memoria a WebP
                await sharp(file.buffer)
                    .rotate()
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

export const serveReportImage = async (req, res) => {
    try {
        const filePath = resolveReportImageFile(req.params.filename);
        if (!filePath) {
            return res.status(404).json({ error: 'Captura de reporte no encontrada.' });
        }

        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return res.sendFile(filePath);
    } catch (error) {
        console.error('Error sirviendo imagen de reporte:', error);
        return res.status(500).json({ error: 'Error al obtener la captura del reporte.' });
    }
};

export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await BugReport.findByPk(id);

        if (!report) return res.status(404).json({ error: 'No encontrado' });

        if (Array.isArray(report.images)) {
            report.images.forEach(imgUrl => {
                const cleanName = path.basename(String(imgUrl || ''));
                if (!SAFE_REPORT_FILENAME.test(cleanName)) return;
                [PRIVATE_REPORTS_DIR, LEGACY_PUBLIC_REPORTS_DIR].forEach((dir) => {
                    const fullPath = path.resolve(dir, cleanName);
                    if (fullPath.startsWith(dir + path.sep) && fs.existsSync(fullPath)) {
                        fs.unlinkSync(fullPath);
                    }
                });
            });
        }

        // --- NEW LOGIC: Send notifications ---
        if (report.user_id) {
            try {
                const user = await User.findByPk(report.user_id);
                if (user) {
                    const userName = user.username || user.name || 'Usuario';
                    // Send Email
                    if (user.email) {
                        await sendBugReportResolvedEmail(user.email, userName, report.subject);
                    }
                    
                    // Send In-App & Push Notification
                    await createNotification(user.id, {
                        type: 'success',
                        title: 'Reporte Resuelto ✅',
                        message: `Tu reporte "${report.subject}" ha sido solucionado. ¡Gracias por avisarnos!`,
                        data: { reportId: report.id }
                    });
                }
            } catch (notifError) {
                console.error("Error notificaciones:", notifError);
            }
        }

        await report.destroy();
        res.json({ message: 'Resuelto correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};
