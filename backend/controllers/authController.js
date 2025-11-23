/* backend/controllers/authController.js */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import models from '../models/index.js'; // Asegúrate que models/index.js exporta User correctamente
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const { User } = models; // User debería estar disponible aquí

// Inicializar cliente de Google
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
      // Busca al usuario por email
      user = await User.findOne({ where: { email } });
    } catch (dbError) {
      console.error('Error de Sequelize al buscar usuario:', dbError);
      return next(dbError);
    }

    // Si no se encuentra el usuario
    if (!user) {
      return res.status(404).json({ error: 'La cuenta no existe.' });
    }

    // Compara la contraseña proporcionada con el hash almacenado
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Si el usuario existe y la contraseña es correcta, pero no está verificado
    if (!user.is_verified) {
      const verificationCode = generateVerificationCode();
      sendVerificationEmail(email, verificationCode).catch(emailError => {
        console.error(`Error enviando email de verificación a ${email} durante login:`, emailError);
      });

      try {
        await user.update({
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        });
      } catch (updateError) {
        console.error(`Error actualizando código de verificación para ${email}:`, updateError);
      }

      return res.status(403).json({ error: 'Cuenta no verificada. Se ha enviado un nuevo código.', requiresVerification: true, email: email });
    }

    // --- INICIO DE LA MODIFICACIÓN (2FA Check) ---
    if (user.two_factor_enabled) {
      // Si el método es email, generar y enviar código ahora
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

      // Retornar respuesta intermedia indicando que se requiere 2FA
      // NO enviamos el token de sesión todavía.
      return res.json({
        requires2FA: true,
        userId: user.id,
        method: user.two_factor_method
      });
    }
    // --- FIN DE LA MODIFICACIÓN ---

    // Si NO tiene 2FA, genera el token JWT normal
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

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
    // Verificar el token con Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, 
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

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

      // --- INICIO DE LA MODIFICACIÓN (2FA Check para Google) ---
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
      // --- FIN DE LA MODIFICACIÓN ---

    } else {
      // Registro nuevo (por defecto sin 2FA)
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
    }

    // Generar token JWT de la aplicación
    const appPayload = { userId: user.id, role: user.role };
    const appToken = jwt.sign(appPayload, process.env.JWT_SECRET, { expiresIn: '24h' });

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

export const logoutUser = (req, res) => {
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
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
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
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

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
    user.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
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

    // Se pasa la contraseña en texto plano. El hook del modelo la hasheará.
    user.password_hash = password;
    
    user.password_reset_token = null;
    user.password_reset_expires_at = null;
    await user.save();

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