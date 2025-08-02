import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { User } = models;

// Función auxiliar para crear las opciones de la cookie de forma consistente
const getCookieOptions = () => {
  const options = {
    httpOnly: true,
    path: '/',
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
    options.sameSite = 'none';
    // --- INICIO DE LA CORRECCIÓN ---
    // Especificamos el dominio padre con un punto al principio.
    // Esto hace que la cookie sea válida para fittrack-pro.zeabur.app y fittrack-pro-api.zeabur.app
    options.domain = '.zeabur.app';
    // --- FIN DE LA CORRECCIÓN ---
  } else {
    options.sameSite = 'lax';
  }
  
  return options;
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

    const cookieOptions = getCookieOptions();
    cookieOptions.maxAge = 24 * 60 * 60 * 1000; // 24 horas

    res.cookie('token', token, cookieOptions);
    res.json({ message: 'Inicio de sesión exitoso.' });

  } catch (error) {
    next(error);
  }
};

// Cerrar sesión de usuario
export const logoutUser = (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.json({ message: 'Cierre de sesión exitoso.' });
};


// Registrar un nuevo usuario (sin cambios)
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

const authController = {
  registerUser,
  loginUser,
  logoutUser
};

export default authController;