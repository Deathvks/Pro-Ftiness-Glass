import express from 'express';
import { check } from 'express-validator';
import authController from '../controllers/authController.js';
import rateLimit from 'express-rate-limit'; // <-- 1. Importar

const router = express.Router();

// --- 2. Crear el middleware de rate limit ---
// Permitirá un máximo de 20 peticiones por IP cada 15 minutos a estas rutas
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutos
	max: 20, 
	message: 'Demasiados intentos de inicio de sesión desde esta IP, por favor intente de nuevo después de 15 minutos',
    standardHeaders: true, // Devuelve información del rate limit en las cabeceras `RateLimit-*`
	legacyHeaders: false, // Deshabilita las cabeceras `X-RateLimit-*`
});

// --- 3. Aplicar el middleware a las rutas de registro y login ---
router.post('/register', authLimiter, [
    check('name', 'El nombre es requerido').not().isEmpty().trim(),
    check('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    check('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
], authController.registerUser);

router.post('/login', authLimiter, [
    check('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    check('password', 'La contraseña es requerida').not().isEmpty()
], authController.loginUser);

// La ruta de logout no necesita esta protección
router.post('/logout', authController.logoutUser);

export default router;