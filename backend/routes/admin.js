/* backend/routes/admin.js */
import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import * as adminController from '../controllers/adminController.js';
import * as reportController from '../controllers/reportController.js';
import * as ratingController from '../controllers/ratingController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeAdmin from '../middleware/authorizeAdmin.js';
import { uploadProfileImage } from '../services/uploadService.js';

const router = express.Router();

const notificationTestLimiter = rateLimit({
    windowMs: 60_000,
    max: 6,
    keyGenerator: req => String(req.user.userId),
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Has alcanzado el límite de pruebas. Espera un minuto antes de repetir.' }
});

// Todas las rutas en este fichero requieren que el usuario esté autenticado Y sea admin
router.use(authenticateToken, authorizeAdmin);

// Reglas de validación para la actualización de usuario
const userUpdateValidationRules = [
    body('email').optional().isEmail().withMessage('El email no es válido.'),
    body('username').optional().notEmpty().withMessage('El nombre de usuario no puede estar vacío.'),
    body('role').optional().isIn(['user', 'admin', 'trainer']).withMessage('El rol no es válido.'),
];

// Reglas de validación para la creación de usuario
const userCreateValidationRules = [
    body('email').isEmail().withMessage('El email no es válido.'),
    body('username').notEmpty().withMessage('El nombre de usuario no puede estar vacío.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('role').optional().isIn(['user', 'admin', 'trainer']).withMessage('El rol no es válido.'),
];

// Rutas del CRUD de usuarios
router.get('/users', adminController.getAllUsers);
router.post('/users', userCreateValidationRules, adminController.createUser);
router.put('/users/:userId', userUpdateValidationRules, adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);
router.post('/users/:userId/profile-image', uploadProfileImage, adminController.updateTrainerProfileImage);
router.delete('/users/:userId/profile-image', adminController.updateTrainerProfileImage);

// Rutas de gestión de reportes de bugs
router.get('/reports', reportController.getReports);
router.delete('/reports/:id', reportController.deleteReport);

  // Rutas de valoraciones
  router.get('/ratings', ratingController.getRatings);

// Rutas de configuración global
router.get('/settings/:key', adminController.getSetting);
router.post('/settings/:key', adminController.updateSetting);

// Rutas de Notificaciones Push
router.get('/push-logs', adminController.getPushLogs);
router.post('/push-send', adminController.sendCustomPush);

// Rutas de Notificaciones Email
router.get('/email-logs', adminController.getEmailLogs);
router.get('/email-stats', adminController.getEmailStats);
router.get('/email-unsubscribe-test', adminController.getEmailUnsubscribeTestStatus);
router.post('/email-unsubscribe-test', notificationTestLimiter, adminController.sendEmailUnsubscribeTest);
router.post('/email-mailbox-test', notificationTestLimiter, adminController.sendEmailMailboxTest);
router.get('/notification-tests/status', notificationTestLimiter, adminController.getNotificationTestStatus);
router.get('/notification-tests/devices', adminController.getPushTestDevices);
router.post('/notification-tests/push', notificationTestLimiter, adminController.sendPushDeviceTest);
router.get('/notification-tests/review', adminController.getNotificationReview);
router.put('/notification-tests/review', adminController.updateNotificationReview);

router.get('/cron-jobs', adminController.getCronJobs);
router.post('/cron-jobs/test/:id', adminController.testCronJob);

// Mantenimiento y Memoria
router.get('/system-stats', adminController.getSystemStats);
router.get('/server-resources', adminController.getServerResources);
router.post('/free-memory', adminController.freeMemory);

// Reset global
router.post('/reset-milestones', adminController.resetMilestoneBadges);

router.get('/upload-logs', adminController.getUploadLogs);

// Retención temprana y rescate de inactividad (+72h)
router.get('/retention-rescue', adminController.getRetentionRescueDashboard);
router.post('/retention-rescue/send', adminController.triggerRetentionRescue);

export default router;

