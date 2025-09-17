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

    if (!user.is_verified) {
      const verificationCode = generateVerificationCode();
      await sendVerificationEmail(email, verificationCode);
      
      await user.update({
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      });
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
    const { name, email, password } = req.body;
    
    let existingUser = await User.findOne({ where: { email } });
    if (existingUser && existingUser.is_verified) {
      return res.status(400).json({ error: 'El email ya está registrado y verificado' });
    }
    
    const verificationCode = generateVerificationCode();
    const emailResult = await sendVerificationEmail(email, verificationCode);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Error enviando código de verificación' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    if (existingUser) {
      await existingUser.update({
        name,
        password_hash,
        verification_code: verificationCode,
        verification_code_expires_at: new Date(Date.now() + 10 * 60 * 1000),
        is_verified: false
      });
    } else {
      await User.create({
        name,
        email,
        password_hash,
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

    const existingUser = await User.findOne({ where: { email: newEmail } });
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
            return res.status(404).json({ message: 'No se encontró un usuario con ese email.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.password_reset_token = hashedToken;
        // **CORRECCIÓN CLAVE**: Usamos el nombre de columna correcto del modelo
        user.password_reset_expires_at = new Date(Date.now() + 10 * 60 * 1000); 
        await user.save();
        
        const frontendUrl = process.env.FRONTEND_URL;
        if (!frontendUrl) {
             return res.status(500).json({ message: 'Error de configuración del servidor.' });
        }

        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);
        
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
        // **CORRECCIÓN CLAVE**: Usamos el nombre de columna correcto del modelo
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

// Se agrupan todas las funciones en un objeto para exportar, por consistencia.
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