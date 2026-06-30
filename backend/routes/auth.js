/* backend/routes/auth.js */
import express from 'express';
import { body } from 'express-validator';
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

// Validador reutilizable para el código de referido (acepta null o vacío)
const referralValidator = body('referralCode').optional({ nullable: true, checkFalsy: true }).isString().trim();

router.post('/register', authLimiter, [
  body('username', 'El nombre de usuario es requerido')
    .not().isEmpty()
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('El nombre de usuario debe tener entre 3 y 30 caracteres.')
    .matches(/^[a-zA-Z0-9_.-]+$/).withMessage('Nombre de usuario solo puede contener letras, números, _, . y - (sin espacios).'),
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim(),
  body('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 }),
  referralValidator
], authController.register);

router.post('/verify-email', authLimiter, [
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim(),
  body('code', 'El código de verificación es requerido').not().isEmpty().trim()
], authController.verifyEmail);

router.post('/resend-verification', [
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim()
], authController.resendVerificationEmail);

router.put('/update-email-verification', authenticateToken, [
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim()
], authController.updateEmailForVerification);

router.post('/login', authLimiter, [
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim(),
  body('password', 'La contraseña es requerida').not().isEmpty()
], authController.loginUser);

router.post('/google-login', authLimiter, [
  body('token', 'El token de Google es requerido').not().isEmpty(),
  referralValidator
], authController.googleLogin);

router.post('/discord-login', authLimiter, [
  body('token', 'El token de Discord es requerido').not().isEmpty(),
  referralValidator
], authController.discordLogin);

router.post('/facebook-login', authLimiter, [
  body('token', 'El token de Facebook es requerido').not().isEmpty(),
  referralValidator
], authController.facebookLogin);

router.post('/x-login', authLimiter, [
  body('code', 'El código de X es requerido').not().isEmpty(),
  body('redirectUri', 'La URI de redirección es requerida').not().isEmpty(),
  referralValidator
], authController.xLogin);

router.post('/github-login', authLimiter, [
  body('code', 'El código de GitHub es requerido').not().isEmpty(),
  referralValidator
], authController.githubLogin);

router.post('/spotify-login', authLimiter, [
  body('code', 'El código de Spotify es requerido').not().isEmpty(),
  body('redirectUri', 'La URI de redirección es requerida').not().isEmpty(),
  referralValidator
], authController.spotifyLogin);

router.post('/logout', authController.logoutUser);

router.post('/forgot-password', authLimiter, [
  body('email', 'Por favor, incluye un email válido').isEmail().toLowerCase().trim(),
], authController.forgotPassword);

router.post('/reset-password', authLimiter, [
  body('token', 'El token es requerido').not().isEmpty(),
  body('password', 'La nueva contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
], authController.resetPassword);

export default router;