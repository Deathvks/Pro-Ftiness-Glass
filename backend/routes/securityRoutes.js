import express from 'express';
import { getSecurityStats, getLogs, getBlacklist, blockIp, unblockIp } from '../controllers/securityController.js';
import authenticateToken from '../middleware/authenticateToken.js';
import authorizeAdmin from '../middleware/authorizeAdmin.js';

const router = express.Router();

// Todas las rutas de seguridad requieren ser administrador
router.use(authenticateToken);
router.use(authorizeAdmin);

router.get('/stats', getSecurityStats);
router.get('/logs', getLogs);
router.get('/blacklist', getBlacklist);
router.post('/blacklist', blockIp);
router.delete('/blacklist/:ip', unblockIp);

export default router;
