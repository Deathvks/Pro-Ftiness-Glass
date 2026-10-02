/* backend/routes/twoFactor.js */
import express from 'express';
import twoFactorController from '../controllers/twoFactorController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// --- Rutas Públicas (Proceso de Login 2FA) ---
// Estas rutas se usan cuando el usuario ha pasado el primer factor (password) 
// pero aún no tiene el token JWT completo de sesión.

// 1. Verificar el código 2FA (App o Email) para completar el login
router.post('/login/verify', twoFactorController.verifyLogin2FA);

// 2. Reenviar código por email durante el login (si el método es email)
// Se espera { email: ... } en el cuerpo si es login, o usa el usuario logueado si hay token.
router.post('/login/resend', twoFactorController.sendEmailCode);


// --- Rutas Protegidas (Configuración de 2FA) ---
// Requieren que el usuario ya esté logueado completamente para acceder a la configuración.
router.use(authenticateToken);

// 3. Iniciar configuración App: Genera secreto y QR
router.post('/setup/app', twoFactorController.setupApp2FA);

// 4. Confirmar configuración App: Verifica TOTP y activa
router.post('/enable/app', twoFactorController.verifyAndEnableApp);

// 5. Iniciar configuración Email: Envía código al correo del usuario logueado
router.post('/setup/email', twoFactorController.sendEmailCode);

// 6. Confirmar configuración Email: Verifica código y activa
router.post('/enable/email', twoFactorController.verifyAndEnableEmail);

// 7. Desactivar 2FA (cualquier método activo)
// CAMBIO: Se cambia de DELETE a POST para coincidir con la llamada del cliente
router.post('/disable', twoFactorController.disable2FA);

export default router;