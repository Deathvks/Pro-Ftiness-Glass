/* backend/routes/reports.js */
import express from 'express';
import * as reportController from '../controllers/reportController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Rutas públicas o de usuario autenticado

// Crear un nuevo reporte de bug
// POST /api/reports
router.post('/', authenticateToken, reportController.createReport);

export default router;