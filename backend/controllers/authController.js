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

  let { email, password } = req.body;
  email = email.toLowerCase().trim(); // Limpieza del email

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

    // --- CORRECCIÓN: Verificar si el usuario tiene contraseña ---
    if (!user.password_hash) {
      if (user.google_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con Google. Por favor, inicia sesión con Google.' });
      }
      if (user.discord_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con Discord. Por favor, inicia sesión con Discord.' });
      }
      if (user.facebook_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con Facebook. Por favor, inicia sesión con Facebook.' });
      }
      if (user.x_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con X. Por favor, inicia sesión con X.' });
      }
      if (user.github_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con GitHub. Por favor, inicia sesión con GitHub.' });
      }
      if (user.spotify_id) {
        return res.status(400).json({ error: 'Esta cuenta se creó con Spotify. Por favor, inicia sesión con Spotify.' });
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

    // Lógica para tiempo de expiración según plataforma
    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

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
        email: payload.email.toLowerCase().trim(), // Limpieza del email
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
          email: data.email.toLowerCase().trim(), // Limpieza del email
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

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

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

export const discordLogin = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Se requiere el token de Discord.' });
  }

  try {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const discordUser = await response.json();

    if (!discordUser.email) {
      return res.status(400).json({ error: 'Se requiere acceso al email de Discord.' });
    }

    const email = discordUser.email.toLowerCase().trim(); // Limpieza del email
    const discordId = discordUser.id;
    const picture = discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUser.avatar}.png` : null;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.discord_id) {
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

      // 2FA Check para Discord
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const code = generateVerificationCode();
          try {
            await sendVerificationEmail(user.email, code);
          } catch (emailError) {
            console.error("Error enviando código 2FA (Discord Login):", emailError);
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
      let baseUsername = (discordUser.global_name || discordUser.username).replace(/[^a-zA-Z0-9_.-]/g, '');
      if(!baseUsername) baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: discordUser.global_name || discordUser.username || baseUsername,
        username: username,
        email: email,
        password_hash: null,
        discord_id: discordId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con Discord.'
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, appToken, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (Discord)',
      message: 'Se ha iniciado sesión con Discord.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con Discord exitoso.',
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
    console.error('Error en Discord Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con Discord.' });
  }
};

export const facebookLogin = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Se requiere el token de Facebook.' });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${token}`);
    
    if (!response.ok) {
      throw new Error('Token inválido');
    }

    const fbUser = await response.json();

    if (!fbUser.email) {
      return res.status(400).json({ error: 'Se requiere acceso al email de Facebook.' });
    }

    const email = fbUser.email.toLowerCase().trim(); // Limpieza del email
    const facebookId = fbUser.id;
    const picture = fbUser.picture?.data?.url || null;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.facebook_id) {
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

      // 2FA Check para Facebook
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const code = generateVerificationCode();
          try {
            await sendVerificationEmail(user.email, code);
          } catch (emailError) {
            console.error("Error enviando código 2FA (Facebook Login):", emailError);
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
      let baseUsername = fbUser.name.replace(/[^a-zA-Z0-9_.-]/g, '');
      if(!baseUsername) baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: fbUser.name || baseUsername,
        username: username,
        email: email,
        password_hash: null,
        facebook_id: facebookId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con Facebook.'
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, appToken, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (Facebook)',
      message: 'Se ha iniciado sesión con Facebook.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con Facebook exitoso.',
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
    console.error('Error en Facebook Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con Facebook.' });
  }
};

export const xLogin = async (req, res, next) => {
  const { code, redirectUri, codeVerifier } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Se requiere el código de autorización de X.' });
  }

  try {
    // 1. Intercambiar el código (code) por un access_token
    const basicAuth = Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64');
    
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.X_CLIENT_ID,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier || 'challenge'
      })
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.json();
      console.error('Error obteniendo token de X:', err);
      throw new Error('El código de autorización es inválido o ha expirado.');
    }

    const { access_token } = await tokenResponse.json();

    // 2. Obtener la información del perfil del usuario
    const userResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=profile_image_url', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userResponse.ok) {
      throw new Error('Error al obtener perfil de X');
    }

    const { data: xUser } = await userResponse.json();

    // X (Twitter) OAuth 2.0 no devuelve el email. Usamos un email interno seguro como placeholder.
    const email = `${xUser.username}@x-auth.local`.toLowerCase().trim(); // Limpieza del placeholder
    const xId = xUser.id;
    const picture = xUser.profile_image_url ? xUser.profile_image_url.replace('_normal', '') : null;

    let user = await User.findOne({ where: { x_id: xId } });

    if (!user) {
      // Intentar buscar por el email placeholder por precaución
      user = await User.findOne({ where: { email } });
    }

    if (user) {
      if (!user.x_id) {
        user.x_id = xId;
        await user.save();
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

      // 2FA Check para X
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const codeStr = generateVerificationCode();
          try {
            // Nota: Aquí enviará un email al placeholder. Al ser placeholder, dará error de envío (silencioso).
            // En un entorno real, si X es el método principal, el usuario debería registrar su email real desde ajustes.
            await sendVerificationEmail(user.email, codeStr);
          } catch (emailError) {
            console.error("Error enviando código 2FA (X Login):", emailError);
          }

          await user.update({
            verification_code: codeStr,
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
      let baseUsername = xUser.username.replace(/[^a-zA-Z0-9_.-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: xUser.name || baseUsername,
        username: username,
        email: email, // Usamos el placeholder
        password_hash: null,
        x_id: xId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con X.'
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, appToken, req);

    // --- MODIFICACIÓN: Gamificación controlada ---
    await handleDailyLoginGamification(user);
    // --- FIN MODIFICACIÓN ---

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (X)',
      message: 'Se ha iniciado sesión con X.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con X exitoso.',
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
    console.error('Error en X Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con X.' });
  }
};

export const githubLogin = async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Se requiere el código de autorización de GitHub.' });
  }

  try {
    // 1. Intercambiar el código (code) por un access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Error obteniendo token de GitHub');
    }

    const { access_token } = tokenData;

    // 2. Obtener la información del perfil del usuario
    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userResponse.ok) {
      throw new Error('Error al obtener perfil de GitHub');
    }

    const githubUser = await userResponse.json();

    // 3. Obtener el email (algunos usuarios lo tienen privado, por lo que requerimos buscar en sus emails)
    let email = githubUser.email;
    
    if (!email) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const emails = await emailsResponse.json();
      email = emails.find(e => e.primary)?.email || emails[0]?.email;
    }

    if (!email) {
      return res.status(400).json({ error: 'Se requiere acceso al email de GitHub.' });
    }

    email = email.toLowerCase().trim(); // Limpieza del email
    const githubId = githubUser.id.toString();
    const picture = githubUser.avatar_url || null;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.github_id) {
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

      // 2FA Check para GitHub
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const codeStr = generateVerificationCode();
          try {
            await sendVerificationEmail(user.email, codeStr);
          } catch (emailError) {
            console.error("Error enviando código 2FA (GitHub Login):", emailError);
          }

          await user.update({
            verification_code: codeStr,
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
      let baseUsername = (githubUser.login || email.split('@')[0]).replace(/[^a-zA-Z0-9_.-]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await User.findOne({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        name: githubUser.name || baseUsername,
        username: username,
        email: email,
        password_hash: null,
        github_id: githubId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con GitHub.'
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, appToken, req);

    // Gamificación controlada
    await handleDailyLoginGamification(user);

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (GitHub)',
      message: 'Se ha iniciado sesión con GitHub.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con GitHub exitoso.',
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
    console.error('Error en GitHub Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con GitHub.' });
  }
};

// --- INICIO DE LA MODIFICACIÓN: Nueva función Spotify Login ---
export const spotifyLogin = async (req, res, next) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Se requiere el código de autorización y la URI de Spotify.' });
  }

  try {
    const basicAuth = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'Error obteniendo token de Spotify');
    }

    const { access_token } = tokenData;

    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!userResponse.ok) {
      throw new Error('Error al obtener perfil de Spotify');
    }

    const spotifyUser = await userResponse.json();

    let email = spotifyUser.email;
    if (!email) {
      return res.status(400).json({ error: 'Se requiere acceso al email de Spotify.' });
    }

    email = email.toLowerCase().trim(); // Limpieza del email
    const spotifyId = spotifyUser.id;
    const picture = spotifyUser.images && spotifyUser.images.length > 0 ? spotifyUser.images[0].url : null;
    const name = spotifyUser.display_name;

    let user = await User.findOne({ where: { email } });

    if (user) {
      if (!user.spotify_id) {
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

      // 2FA Check para Spotify
      if (user.two_factor_enabled) {
        if (user.two_factor_method === 'email') {
          const codeStr = generateVerificationCode();
          try {
            await sendVerificationEmail(user.email, codeStr);
          } catch (emailError) {
            console.error("Error enviando código 2FA (Spotify Login):", emailError);
          }

          await user.update({
            verification_code: codeStr,
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
      let baseUsername = (name || email.split('@')[0]).replace(/[^a-zA-Z0-9_.-]/g, '');
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
        spotify_id: spotifyId,
        profile_image_url: picture,
        is_verified: true,
        role: 'user'
      });

      createNotification(user.id, {
        type: 'success',
        title: '¡Bienvenido!',
        message: 'Gracias por registrarte en Pro Fitness Glass con Spotify.'
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, appToken, req);

    // Gamificación controlada
    await handleDailyLoginGamification(user);

    let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP desconocida';
    if (typeof ip === 'string' && ip.includes(',')) ip = ip.split(',')[0].trim();
    const userAgent = req.headers['user-agent'] || 'Dispositivo desconocido';

    createNotification(user.id, {
      type: 'warning',
      title: 'Inicio de sesión (Spotify)',
      message: 'Se ha iniciado sesión con Spotify.',
      data: { ip, userAgent, date: new Date() }
    });

    res.json({
      message: 'Inicio de sesión con Spotify exitoso.',
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
    console.error('Error en Spotify Login:', error);
    res.status(401).json({ error: 'Fallo en la autenticación con Spotify.' });
  }
};
// --- FIN DE LA MODIFICACIÓN ---

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

  let { username, email, password } = req.body;
  email = email.toLowerCase().trim(); // Limpieza del email

  try {
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

  let { email, code } = req.body;
  email = email.toLowerCase().trim(); // Limpieza del email
  code = code.trim(); // Limpieza del código

  try {
    let isPendingUpdate = false;
    let user = await User.findOne({ where: { email } });

    // Si no encuentra el usuario por el correo introducido, leemos el token de la sesión para saber quién es
    if (!user) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = await User.findByPk(decoded.userId);
          // Solo permitimos este atajo si la cuenta tiene el correo falso
          if (user && user.email.endsWith('@x-auth.local')) {
            isPendingUpdate = true;
          } else {
            user = null;
          }
        } catch (err) {
          user = null;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    if (user.is_verified && !isPendingUpdate) {
      const platform = req.headers['x-app-platform'] || 'web';
      const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

      const payload = { userId: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

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

    // Aplicar los cambios en la Base de Datos
    if (isPendingUpdate) {
      await user.update({
        email: email, // Actualizamos con el correo real por fin
        is_verified: true,
        verification_code: null,
        verification_code_expires_at: null
      });
    } else {
      await user.update({
        is_verified: true,
        verification_code: null,
        verification_code_expires_at: null
      });
    }

    const platform = req.headers['x-app-platform'] || 'web';
    const expiresIn = (platform === 'native' || platform === 'pwa') ? '3650d' : '30d';

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

    await createUserSession(user.id, token, req);
    await handleDailyLoginGamification(user);

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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { email } = req.body;
  email = email.toLowerCase().trim(); // Limpieza del email

  try {
    let isPendingUpdate = false;
    let user = await User.findOne({ where: { email } });

    // Si no lo encontramos por el correo, lo buscamos por su token de sesión actual
    if (!user) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          user = await User.findByPk(decoded.userId);
          // Asegurarse de que este usuario de verdad tiene el email falso
          if (user && user.email.endsWith('@x-auth.local')) {
            isPendingUpdate = true;
          } else {
            user = null;
          }
        } catch(err) {
          user = null;
        }
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado. Por favor, regístrate nuevamente.' });
    }

    if (user.is_verified && !user.email.endsWith('@x-auth.local') && !isPendingUpdate) {
      return res.status(400).json({ error: 'Tu cuenta ya está verificada con un correo válido.' });
    }

    const verificationCode = generateVerificationCode();
    // Enviamos el código al correo nuevo que nos llegó en req.body, NO al de la base de datos
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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { email: newEmail } = req.body;
  newEmail = newEmail.toLowerCase().trim(); // Limpieza del email
  const { userId } = req.user;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.is_verified && !user.email.endsWith('@x-auth.local')) {
      return res.status(400).json({ error: 'Tu cuenta ya está verificada con un correo válido.' });
    }

    const existingUser = await User.findOne({ where: { email: newEmail } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'El email ya está en uso por otra cuenta.' });
    }

    const verificationCode = generateVerificationCode();
    await sendVerificationEmail(newEmail, verificationCode);

    // Solo actualizamos el código. El correo en DB NO CAMBIA hasta que ponga el código.
    await user.update({
      verification_code: verificationCode,
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000)
    });

    res.json({ message: 'Código de verificación enviado al nuevo email.' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  let { email } = req.body;
  email = email.toLowerCase().trim(); // Limpieza del email

  try {
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
  discordLogin,
  facebookLogin,
  xLogin,
  githubLogin,
  spotifyLogin,
  logoutUser,
  resendVerificationEmail,
  updateEmailForVerification,
  forgotPassword,
  resetPassword,
};

export default authController;