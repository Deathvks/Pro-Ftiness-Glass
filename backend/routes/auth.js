/* backend/routes/auth.js */
import express from 'express';
// --- INICIO MODIFICACIÓN: Cambiar 'check' por 'body' ---
import { body } from 'express-validator';
// --- FIN MODIFICACIÓN ---
import authController from '../controllers/authController.js';
import rateLimit from 'express-rate-limit';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Demasiados intentos desde esta IP, por favor intente de nuevo después de 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
});

// Ruta para registro con verificación
router.post('/register', authLimiter, [
    // --- INICIO MODIFICACIÓN: Cambiar 'check' por 'body' y 'name' por 'username' ---
    body('username', 'El nombre de usuario es requerido') // Cambiado de 'name' a 'username'
        .not().isEmpty()
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres.')
        .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Nombre de usuario solo puede contener letras, números, _, . y - (sin espacios).'), // Añadido validador regex y longitud
    body('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    body('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
    // --- FIN MODIFICACIÓN ---
], authController.register);

// Nueva ruta para verificar email
router.post('/verify-email', authLimiter, [
    // --- INICIO MODIFICACIÓN: Usar 'body' ---
    body('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    body('code', 'El código de verificación es requerido').not().isEmpty().trim()
    // --- FIN MODIFICACIÓN ---
], authController.verifyEmail);

router.post('/resend-verification', [
    // --- INICIO MODIFICACIÓN: Usar 'body' ---
    body('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail()
    // --- FIN MODIFICACIÓN ---
], authController.resendVerificationEmail);
router.put('/update-email-verification', authenticateToken, authController.updateEmailForVerification);

router.post('/login', authLimiter, [
    // --- INICIO MODIFICACIÓN: Usar 'body' ---
    body('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    body('password', 'La contraseña es requerida').not().isEmpty()
    // --- FIN MODIFICACIÓN ---
], authController.loginUser);

// --- INICIO DE LA MODIFICACIÓN: Nueva ruta Google Login ---
router.post('/google-login', authLimiter, [
    body('token', 'El token de Google es requerido').not().isEmpty()
], authController.googleLogin);
// --- FIN DE LA MODIFICACIÓN ---

router.post('/logout', authController.logoutUser);

// Rutas para reseteo de contraseña
router.post('/forgot-password', authLimiter, [
    // --- INICIO MODIFICACIÓN: Usar 'body' ---
    body('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    // --- FIN MODIFICACIÓN ---
], authController.forgotPassword);

router.post('/reset-password', authLimiter, [
    // --- INICIO MODIFICACIÓN: Usar 'body' ---
    body('token', 'El token es requerido').not().isEmpty(),
    body('password', 'La nueva contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
    // --- FIN MODIFICACIÓN ---
], authController.resetPassword);


export default router;