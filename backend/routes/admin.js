/* backend/routes/admin.js */
import express from 'express';
import { body } from 'express-validator';
// Importamos los controladores
import * as adminController from '../controllers/adminController.js';
// --- INICIO DE LA MODIFICACIÓN ---
import * as reportController from '../controllers/reportController.js';
// --- FIN DE LA MODIFICACIÓN ---
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeAdmin from '../middleware/authorizeAdmin.js';

const router = express.Router();

// Todas las rutas en este fichero requieren que el usuario esté autenticado Y sea admin
router.use(authenticateToken, authorizeAdmin);

// Reglas de validación para la actualización de usuario
const userUpdateValidationRules = [
    body('email').optional().isEmail().withMessage('El email no es válido.'),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío.'),
    body('role').optional().isIn(['user', 'admin']).withMessage('El rol no es válido.'),
];

// Reglas de validación para la creación de usuario
const userCreateValidationRules = [
    body('email').isEmail().withMessage('El email no es válido.'),
    body('name').notEmpty().withMessage('El nombre no puede estar vacío.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('role').isIn(['user', 'admin']).withMessage('El rol no es válido.'),
];

// Rutas del CRUD de usuarios
router.get('/users', adminController.getAllUsers);
router.post('/users', userCreateValidationRules, adminController.createUser);
router.put('/users/:userId', userUpdateValidationRules, adminController.updateUser);
router.delete('/users/:userId', adminController.deleteUser);

// --- INICIO DE LA MODIFICACIÓN ---
// Rutas de gestión de reportes de bugs
router.get('/reports', reportController.getReports);
router.delete('/reports/:id', reportController.deleteReport);
// --- FIN DE LA MODIFICACIÓN ---

export default router;