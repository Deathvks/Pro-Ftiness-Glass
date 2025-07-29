import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import models from '../models/index.js';

const { User } = models;

// Registrar un nuevo usuario
export const registerUser = async (req, res) => {
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
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// Iniciar sesión de usuario
export const loginUser = async (req, res) => {
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

    // --- INICIO DE LA CORRECCIÓN ---
    // 1. Se envía el token en una cookie HttpOnly segura en lugar del cuerpo de la respuesta.
    res.cookie('token', token, {
      httpOnly: true, // Inaccesible para JavaScript en el navegador
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 horas
    });

    // 2. La respuesta JSON ahora solo confirma el éxito del login.
    res.json({ message: 'Inicio de sesión exitoso.' });
    // --- FIN DE LA CORRECCIÓN ---

  } catch (error) {
    res.status(500).json({ error: 'Error en el servidor durante el inicio de sesión' });
  }
};

// --- NUEVA FUNCIÓN ---
// Cerrar sesión de usuario
export const logoutUser = (req, res) => {
    // Se limpia la cookie que contiene el token.
    res.clearCookie('token');
    res.json({ message: 'Cierre de sesión exitoso.' });
};
// --- FIN ---

const authController = {
  registerUser,
  loginUser,
  logoutUser // Se añade la nueva función al controlador
};

export default authController;