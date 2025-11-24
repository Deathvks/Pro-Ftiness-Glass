/* backend/controllers/twoFactorController.js */
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import db from '../models/index.js';
import { generateVerificationCode, sendVerificationEmail, sendLoginAlertEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';

const { User } = db;

/**
 * Genera un secreto temporal y código QR para configurar Google Authenticator.
 */
export const setupApp2FA = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const user = await User.findByPk(userId);

    // Generar secreto único asociado al nombre de la App
    const secret = speakeasy.generateSecret({
      name: `ProFitnessGlass (${user.email})`,
    });

    // Generar imagen QR
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32, // El usuario lo necesita para confirmar
      qrCodeUrl, // Imagen para escanear
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica el token TOTP y habilita 2FA modo App.
 */
export const verifyAndEnableApp = async (req, res, next) => {
  const { token, secret } = req.body; // 'secret' viene del paso anterior (frontend)
  const { userId } = req.user;

  try {
    // Aumentamos window a 2 para permitir un margen de +/- 60 segundos por desajuste de hora
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2, 
    });

    if (!verified) {
      return res.status(400).json({ error: 'Código incorrecto. Inténtalo de nuevo.' });
    }

    // Guardar configuración
    await User.update(
      {
        two_factor_enabled: true,
        two_factor_method: 'app',
        two_factor_secret: secret,
        last_totp_slice: Math.floor(Date.now() / 30000) // Guardar slice actual
      },
      { where: { id: userId } }
    );

    createNotification(userId, {
      type: 'success',
      title: '2FA Activado',
      message: 'Has activado la autenticación en dos pasos mediante App Authenticator.'
    });

    res.json({ message: 'Autenticación en dos pasos (App) habilitada correctamente.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Envía un código al email para configurar o verificar 2FA modo Email.
 */
export const sendEmailCode = async (req, res, next) => {
  try {
    let user;
    if (req.user && req.user.userId) {
        user = await User.findByPk(req.user.userId);
    } else if (req.body.email) {
        user = await User.findOne({ where: { email: req.body.email } });
    } else if (req.body.userId) {
        user = await User.findByPk(req.body.userId);
    }

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const code = generateVerificationCode();
    await sendVerificationEmail(user.email, code);

    await user.update({
      verification_code: code,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    res.json({ message: 'Código enviado a tu correo electrónico.', email: user.email });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica el código de email y habilita 2FA modo Email.
 */
export const verifyAndEnableEmail = async (req, res, next) => {
  const { code } = req.body;
  const { userId } = req.user;

  try {
    const user = await User.findByPk(userId);

    if (
      !user.verification_code ||
      user.verification_code !== code ||
      new Date() > user.verification_code_expires_at
    ) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    await user.update({
      two_factor_enabled: true,
      two_factor_method: 'email',
      verification_code: null,
      two_factor_secret: null,
    });

    createNotification(userId, {
      type: 'success',
      title: '2FA Activado',
      message: 'Has activado la autenticación en dos pasos por Email.'
    });

    res.json({ message: 'Autenticación en dos pasos (Email) habilitada correctamente.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Deshabilita el 2FA.
 */
export const disable2FA = async (req, res, next) => {
  const { userId } = req.user;
  try {
    await User.update(
      {
        two_factor_enabled: false,
        two_factor_method: null,
        two_factor_secret: null,
        last_totp_slice: null,
      },
      { where: { id: userId } }
    );

    createNotification(userId, {
      type: 'warning',
      title: '2FA Desactivado',
      message: 'Has desactivado la autenticación en dos pasos. Tu cuenta es menos segura.'
    });

    res.json({ message: 'Autenticación en dos pasos desactivada.' });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifica el 2FA durante el proceso de LOGIN y emite el JWT final.
 */
export const verifyLogin2FA = async (req, res, next) => {
  const { userId, token, code } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

    let verified = false;
    let updates = {}; // Objeto para acumular actualizaciones

    if (user.two_factor_method === 'app') {
      if (!token) return res.status(400).json({ error: 'Código TOTP requerido.' });

      const currentSlice = Math.floor(Date.now() / 30000);
      
      // Protección simple contra reuso (replay attack)
      if (user.last_totp_slice === currentSlice) {
          return res.status(400).json({ 
              error: 'Este código ya ha sido utilizado. Por favor, espera unos segundos.' 
          });
      }

      // Aumentamos window a 2 para permitir mayor tolerancia de tiempo
      verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: token,
        window: 2, 
      });

      if (verified) {
          updates.last_totp_slice = currentSlice;
      }

    } else if (user.two_factor_method === 'email') {
      if (!code) return res.status(400).json({ error: 'Código de email requerido.' });
      if (
        user.verification_code === code &&
        new Date() < user.verification_code_expires_at
      ) {
        verified = true;
        updates.verification_code = null; // Limpiar código
      }
    }

    if (!verified) {
      return res.status(401).json({ error: 'Código de verificación incorrecto.' });
    }

    // --- GENERACIÓN DE TOKEN DE RESET PARA EL EMAIL ---
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    updates.password_reset_token = hashedToken;
    updates.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Aplicamos todas las actualizaciones
    await user.update(updates);

    // --- ENVIAR ALERTA (Lógica IP Mejorada) ---
    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';
    
    // Solo enviar email si el usuario tiene activada la preferencia
    if (user.login_email_notifications) {
        sendLoginAlertEmail(user.email, { ip, userAgent, token: resetToken }).catch(err => 
            console.error('Fallo al enviar alerta de login 2FA:', err)
        );
    }

    // --- INICIO DE LA MODIFICACIÓN ---
    // Notificación interna de inicio de sesión con DATOS EXTRA
    createNotification(user.id, {
      type: 'warning',
      title: 'Nuevo inicio de sesión (2FA)',
      message: 'Se ha iniciado sesión correctamente utilizando la verificación en dos pasos.',
      data: { // Guardamos IP y UserAgent para que el frontend los muestre
          ip,
          userAgent,
          date: new Date()
      }
    });
    // --- FIN DE LA MODIFICACIÓN ---

    const payload = { userId: user.id, role: user.role };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Verificación exitosa.',
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profile_image_url: user.profile_image_url,
        role: user.role
      }
    });

  } catch (error) {
    next(error);
  }
};

const twoFactorController = {
  setupApp2FA,
  verifyAndEnableApp,
  sendEmailCode,
  verifyAndEnableEmail,
  disable2FA,
  verifyLogin2FA
};

export default twoFactorController;