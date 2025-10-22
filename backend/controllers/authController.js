import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import crypto from 'crypto';
import models from '../models/index.js';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

const { User } = models;

// --- FUNCIONES DE AUTENTICACIÓN ---

export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: 'La cuenta no existe.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Si el usuario no está verificado, reenviar código
    if (!user.is_verified) {
      const verificationCode = generateVerificationCode();
      await sendVerificationEmail(email, verificationCode);

      await user.update({
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      });
      // Devolvemos un error específico para indicar que se necesita verificación
      return res.status(403).json({ error: 'Cuenta no verificada. Se ha enviado un nuevo código.', requiresVerification: true, email: email });
    }

    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({ message: 'Inicio de sesión exitoso.', token });

  } catch (error) {
    next(error);
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
    // --- INICIO MODIFICACIÓN: Usar 'username' ---
    const { username, email, password } = req.body; // Cambiado 'name' por 'username'

    // Validación de formato de nombre de usuario
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        return res.status(400).json({ error: 'Nombre de usuario solo puede contener letras, números, _, . y -' });
    }
    if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: 'El nombre de usuario debe tener entre 3 y 30 caracteres.' });
    }
    // --- FIN MODIFICACIÓN ---

    let existingUserByEmail = await User.findOne({ where: { email } });
    // --- INICIO MODIFICACIÓN: Comprobar username ---
    let existingUserByUsername = await User.findOne({ where: { username } });

    // Si existe por email Y está verificado
    if (existingUserByEmail && existingUserByEmail.is_verified) {
      return res.status(409).json({ error: 'El email ya está registrado y verificado' });
    }
    // Si existe por username Y está verificado
    if (existingUserByUsername && existingUserByUsername.is_verified) {
      return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
    }
    // --- FIN MODIFICACIÓN ---

    // Priorizar actualizar si existe por email (usuario intentando re-registrarse sin verificar)
    const userToProcess = existingUserByEmail || existingUserByUsername;

    const verificationCode = generateVerificationCode();
    const emailResult = await sendVerificationEmail(email, verificationCode);

    if (!emailResult.success) {
      return res.status(500).json({ error: 'Error enviando código de verificación' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    if (userToProcess) {
       // --- INICIO MODIFICACIÓN: Actualizar también 'username' y 'name' ---
      await userToProcess.update({
        name: username, // Copiamos username a name por compatibilidad temporal
        username: username, // Guardamos el username
        email: email, // Actualizar email si cambió (en caso de encontrar por username)
        password_hash,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false // Asegurarse de que no esté verificado
      });
      // --- FIN MODIFICACIÓN ---
    } else {
       // --- INICIO MODIFICACIÓN: Crear con 'username' y 'name' ---
      await User.create({
        name: username, // Copiamos username a name
        username: username, // Guardamos username
        email,
        password_hash,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false
      });
       // --- FIN MODIFICACIÓN ---
    }

    res.status(200).json({
      message: 'Código de verificación enviado al email',
      email: email
    });

  } catch (error) {
    // Manejar error de unicidad si dos requests simultáneos intentan crear el mismo usuario
     if (error.name === 'SequelizeUniqueConstraintError') {
       // Comprobar qué campo causó el error
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
         // Si ya está verificado, simplemente generamos un token y lo devolvemos
        const payload = { userId: user.id, role: user.role };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
         return res.status(200).json({
             message: 'Email ya verificado.',
             token,
             user: {
                 id: user.id,
                 name: user.name,
                 username: user.username, // Devolver username
                 email: user.email,
                 is_verified: user.is_verified
             }
         });
     }


    if (!user.verification_code) {
      return res.status(400).json({ error: 'Código no encontrado o expirado' });
    }

    if (new Date() > user.verification_code_expires_at) {
      // Código expirado, limpiar campos
      await user.update({
        verification_code: null,
        verification_code_expires_at: null
      });
      return res.status(400).json({ error: 'Código expirado' });
    }

    if (user.verification_code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Código correcto, verificar y limpiar
    await user.update({
      is_verified: true,
      verification_code: null,
      verification_code_expires_at: null
    });

    // Generar token JWT para inicio de sesión automático
    const payload = { userId: user.id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    return res.status(200).json({
      message: 'Email verificado exitosamente',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username, // Devolver username
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
      verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    });

    res.json({ message: 'Código de verificación reenviado.' });
  } catch (error) {
    console.error('Error reenviando código:', error);
    next(error);
  }
};

export const updateEmailForVerification = async (req, res, next) => {
  const { email: newEmail } = req.body;
  // --- INICIO MODIFICACIÓN: Usar userId del token ---
  const { userId } = req.user; // Obtener userId del token verificado por authenticateToken
  // --- FIN MODIFICACIÓN ---

  try {
    const user = await User.findByPk(userId); // Buscar por ID
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'La cuenta ya está verificada.' });
    }

    // Verificar si el nuevo email ya está en uso por OTRO usuario verificado
    const existingUser = await User.findOne({ where: { email: newEmail, is_verified: true } });
    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }

    const verificationCode = generateVerificationCode();
    await sendVerificationEmail(newEmail, verificationCode);

    await user.update({
        email: newEmail,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 minutos
    });

    res.json({ message: 'Email actualizado y código de verificación enviado.' });
  } catch (error) {
    next(error);
  }
};

// --- RESTABLECIMIENTO DE CONTRASEÑA ---

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            // No revelamos si el usuario existe o no por seguridad.
            return res.json({ message: 'Si existe una cuenta con ese email, se ha enviado un enlace para restablecer tu contraseña.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.password_reset_token = hashedToken;
        user.password_reset_expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
        await user.save();

        // Enviamos el token sin hashear en la URL
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
  registerUser: register,
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