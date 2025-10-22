/* backend/controllers/authController.js */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import crypto from 'crypto';
import models from '../models/index.js'; // Asegúrate que models/index.js exporta User correctamente
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const { User } = models; // User debería estar disponible aquí

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
      // Maneja errores específicos de la base de datos durante la búsqueda
      console.error('Error de Sequelize al buscar usuario:', dbError); // Mantenemos este log crítico
      return next(dbError); // Pasa al manejador global
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
      // Intenta reenviar el código de verificación (sin esperar el resultado del email)
      sendVerificationEmail(email, verificationCode).catch(emailError => {
        console.error(`Error enviando email de verificación a ${email} durante login:`, emailError); // Mantenemos este log crítico
      });

      // Actualiza el código y la expiración en la base de datos
      try {
        await user.update({
          verification_code: verificationCode,
          verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
        });
      } catch (updateError) {
        console.error(`Error actualizando código de verificación para ${email}:`, updateError); // Mantenemos este log crítico
      }

      // Devuelve estado 403 indicando que se requiere verificación
      return res.status(403).json({ error: 'Cuenta no verificada. Se ha enviado un nuevo código.', requiresVerification: true, email: email });
    }

    // Si el usuario está verificado, genera el token JWT
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Devuelve el token
    res.json({ message: 'Inicio de sesión exitoso.', token });

  } catch (error) {
    // Captura cualquier otro error inesperado
    console.error('Error inesperado en loginUser:', error); // Mantenemos este log crítico
    next(error); // Pasa al manejador de errores global
  }
};

// --- RESTO DE FUNCIONES (sin cambios respecto a la versión anterior con logs) ---

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

    // Hash password here before create/update
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);


    if (userToProcess) {
      await userToProcess.update({
        name: username,
        username: username,
        email: email,
        password_hash: password_hash, // Use pre-hashed password
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false
      });
    } else {
      await User.create({
        name: username,
        username: username,
        email,
        password_hash: password_hash, // Use pre-hashed password
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
    console.error('Error en registro:', error); // Mantenemos log crítico
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
    console.error('Error verificando email:', error); // Mantenemos log crítico
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
    console.error('Error reenviando código:', error); // Mantenemos log crítico
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

    // Hash the new password before saving (Model hook should also handle this)
    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
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
  logoutUser,
  resendVerificationEmail,
  updateEmailForVerification,
  forgotPassword,
  resetPassword,
};

export default authController;