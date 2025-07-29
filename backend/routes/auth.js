import express from 'express';
import { check } from 'express-validator';
import authController from '../controllers/authController.js';

const router = express.Router();

router.post('/register', [
    check('name', 'El nombre es requerido').not().isEmpty().trim(),
    check('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    check('password', 'La contraseña debe tener 6 o más caracteres').isLength({ min: 6 })
], authController.registerUser);

router.post('/login', [
    check('email', 'Por favor, incluye un email válido').isEmail().normalizeEmail(),
    check('password', 'La contraseña es requerida').not().isEmpty()
], authController.loginUser);

router.post('/logout', authController.logoutUser);

export default router;