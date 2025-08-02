import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { User } = models;

// Registrar un nuevo usuario
export const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password_hash,
    });

    res.status(201).json({ message: 'Usuario registrado con éxito.', userId: newUser.id });
  } catch (error) {
    next(error);
  }
};

// Iniciar sesión de usuario
export const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const payload = { userId: user.id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // --- CÓDIGO CORREGIDO PARA LA COOKIE ---
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    };

    // Añadimos el dominio solo en producción
    if (process.env.NODE_ENV === 'production') {
      // Esto permite que la cookie sea válida para fittrack-pro.zeabur.app y fittrack-pro-api.zeabur.app
      cookieOptions.domain = '.zeabur.app'; 
    }

    res.cookie('token', token, cookieOptions);
    // --- FIN DE LA CORRECCIÓN ---

    res.json({ message: 'Inicio de sesión exitoso.' });

  } catch (error) {
    next(error);
  }
};

// Cerrar sesión de usuario (no necesita cambios)
export const logoutUser = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Cierre de sesión exitoso.' });
};

const authController = {
  registerUser,
  loginUser,
  logoutUser
};

export default authController;