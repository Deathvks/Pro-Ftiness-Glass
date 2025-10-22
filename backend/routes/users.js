import express from 'express';
import userController from '../controllers/userController.js';
import { body } from 'express-validator';
import authenticateToken from '../middleware/authenticateToken.js';

// --- INICIO DE LA MODIFICACIÓN ---
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Usamos fs síncrono para crear el dir al inicio
import { fileURLToPath } from 'url'; // Importamos esto
// --- FIN DE LA MODIFICACIÓN ---

const router = express.Router();


// --- INICIO DE LA MODIFICACIÓN: Configuración de Multer ---

// Requerido en ESM para simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // Esto será /app/backend/routes

// Directorio de subida para fotos de perfil
// Usamos path.join con __dirname para subir un nivel (a /app/backend) y luego a public
const profileUploadDir = path.join(__dirname, '..', 'public', 'images', 'profiles');

// Asegurarse de que el directorio existe al iniciar
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
  console.log(`Directorio de subida creado: ${profileUploadDir}`);
}

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    // Usar req.user.userId (del token) para un nombre único
    // El middleware authenticateToken debe correr ANTES
    const uniqueSuffix = `user-${req.user.userId}-${Date.now()}`;
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    // Rechaza el fichero
    cb(new Error('Formato de imagen no válido. Solo JPG o PNG.'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  } 
});
// --- FIN DE LA MODIFICACIÓN ---


// Aplicar autenticación a todas las rutas de /users
// Esto asegura que req.user.userId esté disponible para multer
router.use(authenticateToken);

// GET /api/users/me (Obtener perfil)
router.get('/me', userController.getMyProfile);

// PUT /api/users/me (Actualizar perfil físico)
router.put(
  '/me',
  [
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('age').optional().isInt({ min: 14, max: 100 }),
    body('height').optional().isInt({ min: 100, max: 250 }),
    body('activityLevel').optional().isFloat({ min: 1.0, max: 2.5 }),
    body('goal').optional().isIn(['lose', 'maintain', 'gain']),
    body('weight').optional().isFloat({ min: 20, max: 500 })
  ],
  userController.updateMyProfile
);

// PUT /api/users/me/account (Actualizar datos de la cuenta)
router.put(
  '/me/account',
  // 1. Aplicar middleware de Multer. 'profileImage' debe coincidir con el FormData
  upload.single('profileImage'), 
  
  // --- INICIO DE LA MODIFICACIÓN (Validaciones) ---
  
  // 2. Validaciones (hechas opcionales para actualizaciones parciales)
  [
    // Name: Opcional, pero si se envía, debe tener una longitud válida.
    body('name')
      .optional({ checkFalsy: true }) // Permite que sea "" o undefined
      .isLength({ min: 3, max: 50 })
      .withMessage('Si se proporciona, el nombre debe tener entre 3 y 50 caracteres.'),
      
    // Username: Opcional, pero si se envía, debe ser válido.
    body('username')
      .optional({ checkFalsy: true }) // Permite que sea "" o undefined
      .isLength({ min: 3, max: 30 })
      .withMessage('Si se proporciona, el nombre de usuario debe tener entre 3 y 30 caracteres.')
      .matches(/^[a-zA-Z0-9_.-]+$/)
      .withMessage('Nombre de usuario solo puede contener letras, números, _, . y -'),
      
    // Email: Opcional, pero si se envía, debe ser un email.
    body('email')
      .optional({ checkFalsy: true }) // Permite que sea "" o undefined
      .isEmail()
      .withMessage('Si se proporciona, debe ser un email válido.'),
      
    // New Password: Ya estaba correcto.
    body('newPassword')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('La nueva contraseña debe tener al menos 6 caracteres.')
  ],
  // --- FIN DE LA MODIFICACIÓN ---

  // 3. Controlador
  userController.updateMyAccount
);

export default router;