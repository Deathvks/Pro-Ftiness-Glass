/* backend/controllers/authController.js */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { UAParser } from 'ua-parser-js';
import models from '../models/index.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { createNotification } from '../services/notificationService.js';
import { checkStreak, unlockBadge, addXp, DAILY_LOGIN_XP } from '../services/gamificationService.js';

const { User, UserSession } = models;

// Inicializar cliente de Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- HELPER PARA CREAR O ACTUALIZAR SESIÓN ---
const createUserSession = async (userId, token, req) => {
  try {
    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) {
      ip = ip.split(',')[0].trim();
    }
    const userAgent = req.headers['user-agent'] || '';

    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceType = result.device.type || 'desktop';
    const browserName = result.browser.name || 'Navegador desconocido';
    const osName = result.os.name || 'SO desconocido';
    const deviceName = `${browserName} en ${osName}`;

    const existingSession = await UserSession.findOne({
      where: {
        user_id: userId,
        device_name: deviceName,
        device_type: deviceType
      }
    });

    if (existingSession) {
      await existingSession.update({
        token: token,
        ip_address: ip,
        last_active: new Date()
      });
    } else {
      await UserSession.create({
        user_id: userId,
        token: token,
        device_type: deviceType,
        device_name: deviceName,
        ip_address: ip,
        last_active: new Date()
      });
    }
  } catch (error) {
    console.error('Error al gestionar la sesión del usuario:', error);
  }
};

// --- HELPER PARA GAMIFICACIÓN DIARIA ---
const handleDailyLoginGamification = async (user) => {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Obtenemos la fecha del último login (antes de actualizarla)
    const lastSeenDate = user.last_seen
      ? new Date(user.last_seen).toISOString().split('T')[0]
      : null;

    // Actualizamos last_seen al momento actual
    await user.update({ last_seen: now });

    // Si ya se logueó hoy, no hacemos nada más (evita spam de XP al recargar)
    if (lastSeenDate === today) return;

    // Intentamos desbloquear 'first_login'
    // Si devuelve unlocked: true, es la PRIMERA vez absoluta -> Gana 50 XP (por configuración de badge)
    const badgeResult = await unlockBadge(user.id, 'first_login');

    if (badgeResult.unlocked) {
      // Fue la primera vez de todas. Iniciamos racha sin dar XP extra (ya obtuvo los 50 de la badge)
      await checkStreak(user.id, today);
    } else {
      // No es la primera vez absoluta (ya tenía la badge).
      // Como lastSeenDate !== today, es el primer login DE HOY.
      // Damos XP diario (25) + procesamos racha.
      await addXp(user.id, DAILY_LOGIN_XP, 'Login diario');
      await checkStreak(user.id, today);
    }
  } catch (gError) {
    console.error('Error gamificación en login:', gError);
  }
};

// --- FUNCIONES DE AUTENTICACIÓN ---

export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user;
    try {
      user = await User.findOne({ where: { email } });
    } catch (dbError) {
      console.error('Error de Sequelize al buscar usuario:', dbError);
      return next(dbError);
    }

    if (!user) {
      return res.status(404).json({ error: 'La cuenta no existe.' });
    }

    // --- CORRECCIÓN: Verificar si el usuario tiene contraseña (puede ser usuario de Google) ---
    if (!user.password_hash) {
      if (user.google_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con Google. Por favor, inicia sesión con Google.' });
      }
      return res.status(400).json({ error: 'La cuenta no tiene contraseña configurada.' });
    }
    // --- FIN CORRECCIÓN ---

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!user.is_verified) {
      const verificationCode = generateVerificationCode();
      sendVerificationEmail(email, verificationCode).catch(emailError => {
        console.error(`Error enviando email de verificación a ${email} durante login:`, emailError);
      });

      try {
        await user.update({
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        });
      } catch (updateError) {
        console.error(`Error actualizando código de verificación para ${email}:`, updateError);
      }

      return res.status(403).json({ error: 'Cuenta no verificada. Se ha enviado un nuevo código.', requiresVerification: true, email: email });
    }

    // 2FA Check
    if (user.two_factor_enabled) {
      if (user.two_factor_method === 'email') {
        const code = generateVerificationCode();
        try {
          await sendVerificationEmail(user.email, code);
        } catch (emailError) {
          console.error("Error enviando código 2FA por email:", emailError);
        }

        await user.update({
          verification_code: code,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000)
        });
      }

      return res.json({
        requires2FA: true,
        userId: user.id,
        method: user.two_factor_method
      });
    }

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    await createUserSession(user.id, token, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Nuevo inicio de sesión',
      message: 'Se ha detectado un nuevo inicio de sesión en tu cuenta.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({ message: 'Inicio de sesión exitoso.', token });

  } catch (error) {
    console.error('Error inesperado en loginUser:', error);
    next(error);
  }
};

export const googleLogin = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Se requiere el token de Google.' });
  }

  try {
    let googleUser = {};

    // 1. Intentar verificar como ID Token (JWT) - Flujo estándar de botón Google
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleUser = {
        email: payload.email,
        name: payload.name,
        googleId: payload.sub,
        picture: payload.picture
      };
    } catch (idTokenError) {
      // 2. Si falla, intentar verificar como Access Token - Flujo useGoogleLogin
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Token inválido');
        }

        const data = await response.json();
        googleUser = {
          email: data.email,
          name: data.name,
          googleId: data.sub,
          picture: data.picture
        };
      } catch (accessTokenError) {
        console.error("Fallo verificación de token Google (ID y Access):", accessTokenError.message);
        return res.status(401).json({ error: 'Token de Google inválido.' });
      }
    }

    const { email, name, googleId, picture } = googleUser;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.google_id) {
        return res.status(409).json({
          error: 'Este correo ya está registrado. Por favor, inicia sesión con tu contraseña.'
        });
      }

      let updated = false;

      if (!user.is_verified) {
        user.is_verified = true;
        user.verification_code = null;
        updated = true;
      }
      if (!user.profile_image_url && picture) {
        user.profile_image_url = picture;
        updated = true;
      }

      if (updated) await user.save();

      // 2FA Check para Google
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const code = generateVerificationCode();
          try {
            await sendVerificationEmail(user.email, code);
          } catch (emailError) {
            console.error("Error enviando código 2FA (Google Login):", emailError);
          }

          await user.update({
            verification_code: code,
            verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000)
          });
        }

        return res.json({
          requires2FA: true,
          userId: user.id,
          method: user.two_factor_method
        });
      }

    } else {
      // Registro nuevo
      let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: name || baseUsername,
        username: username,
        email: email,
        password_hash: null,
        google_id: googleId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con Google.'
      });
    }

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn: '30d' });

    await createUserSession(user.id, appToken, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (Google)',
      message: 'Se ha iniciado sesión con Google.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con Google exitoso.',
      token: appToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        profile_image_url: user.profile_image_url,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Error en Google Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con Google.' });
  }
};

export const logoutUser = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      await UserSession.destroy({ where: { token } });
    } catch (err) {
      console.error("Error al eliminar sesión en logout:", err);
    }
  }

  res.json({ message: 'Cierre de sesión exitoso.' });
};

export const register = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return res.status(400).json({ error: 'Nombre de usuario solo puede contener letras, números, _, . y -' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 30 caracteres.' });
    }

    let existingUserByEmail = await User.findOne({ where: { email } });
    let existingUserByUsername = await User.findOne({ where: { username } });

    if (existingUserByEmail && existingUserByEmail.is_verified) {
      return res.status(409).json({ error: 'El email ya está registrado y verificado' });
    }
    if (existingUserByUsername && existingUserByUsername.is_verified) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }

    const userToProcess = existingUserByEmail || existingUserByUsername;

    const verificationCode = generateVerificationCode();
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Error enviando código de verificación' });
    }

    if (userToProcess) {
      await userToProcess.update({
        name: username,
        username: username,
        email: email,
        password_hash: password,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false
      });
    } else {
      await User.create({
        name: username,
        username: username,
        email,
        password_hash: password,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false
      });
    }

    res.status(200).json({
      message: 'Código de verificación enviado al email',
      email: email
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      if (error.fields && error.fields.email) {
        return res.status(409).json({ error: 'El email ya está en uso.' });
      }
      if (error.fields && error.fields.username) {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso.' });
      }
    }
    console.error('Error en registro:', error);
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    if (user.is_verified) {
      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
      await createUserSession(user.id, token, req);
      return res.status(200).json({
        message: 'Email ya verificado.',
        token,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          is_verified: user.is_verified
        }
      });
    }

    if (!user.verification_code) {
      return res.status(400).json({ error: 'Código no encontrado o expirado' });
    }

    if (new Date() > user.verification_code_expires_at) {
      await user.update({
        verification_code: null,
        verification_code_expires_at: null
      });
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    await user.update({
      is_verified: true,
      verification_code: null,
      verification_code_expires_at: null
    });

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

    await createUserSession(user.id, token, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    createNotification(user.id, {
      type: 'success',
      title: '¡Email verificado!',
      message: 'Tu cuenta ha sido verificada correctamente. ¡Bienvenido!'
    });

    return res.status(200).json({
      message: 'Email verificado exitosamente',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    console.error('Error verificando email:', error);
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado. Por favor, regístrate nuevamente.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada.' });
    }

    const verificationCode = generateVerificationCode();
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Error enviando código de verificación' });
    }

    await user.update({
      verification_code: verificationCode,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });

    res.json({ message: 'Código de verificación reenviado.' });
  } catch (error) {
    console.error('Error reenviando código:', error);
    next(error);
  }
};

export const updateEmailForVerification = async (req, res, next) => {
  const { email: newEmail } = req.body;
  const { userId } = req.user;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada.' });
    }

    const existingUser = await User.findOne({ where: { email: newEmail, is_verified: true } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }

    const verificationCode = generateVerificationCode();
    await sendVerificationEmail(newEmail, verificationCode);

    await user.update({
      email: newEmail,
      verification_code: verificationCode,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });

    res.json({ message: 'Email actualizado y código de verificación enviado.' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer tu contraseña.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.password_reset_token = hashedToken;
    user.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'Se ha enviado un email para restablecer tu contraseña.' });

  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { token, password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'El token no es válido o ha expirado.' });
    }

    const isSamePassword = await bcrypt.compare(password, user.password_hash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'La nueva contraseña no puede ser igual a la anterior.' });
    }

    user.password_hash = password;
    user.password_reset_token = null;
    user.password_reset_expires_at = null;
    await user.save();

    createNotification(user.id, {
      type: 'alert',
      title: 'Contraseña modificada',
      message: 'Tu contraseña ha sido restablecida correctamente.'
    });

    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    next(error);
  }
};

const authController = {
  register,
  verifyEmail,
  loginUser,
  googleLogin,
  logoutUser,
  resendVerificationEmail,
  updateEmailForVerification,
  forgotPassword,
  resetPassword,
};

export default authController;