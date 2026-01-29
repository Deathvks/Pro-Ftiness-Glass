/* backend/services/uploadService.js */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createRequire } from 'module';

// --- IA Moderation Imports (Versión Pura JS) ---
import * as tf from '@tensorflow/tfjs';

// Usamos require para 'nsfwjs' para evitar bugs de importación
const require = createRequire(import.meta.url);
const nsfw = require('nsfwjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorio base público
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Helper para asegurar directorios
const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

// Configuración de almacenamiento Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'others';
        if (req.baseUrl.includes('stories')) folder = 'stories';
        else if (req.baseUrl.includes('users')) folder = 'profiles';
        else if (req.baseUrl.includes('nutrition')) folder = 'nutrition';
        else if (req.baseUrl.includes('routines')) folder = 'routines';

        const uploadPath = path.join(UPLOADS_DIR, folder);
        ensureDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/webp', 'image/jpg',
        'video/mp4', 'video/quicktime', 'video/webm'
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Formato no soportado. Usa JPG, PNG, WEBP o MP4/MOV.'));
    }
};

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: fileFilter
});

// --- SINGLETON DEL MODELO NSFW ---
let _model;
const getNSFWModel = async () => {
    if (!_model) {
        // Carga el modelo en memoria
        _model = await nsfw.load(); 
    }
    return _model;
};

/**
 * Procesa el archivo subido con moderación de IA
 */
export const processUploadedFile = async (file, isHDR = false) => {
    if (!file) return null;

    // 1. VÍDEOS (Pasan directos)
    if (file.mimetype.startsWith('video/')) {
        const relativePath = path.relative(PUBLIC_DIR, file.path);
        return '/' + relativePath.split(path.sep).join('/');
    }

    // 2. IMÁGENES (Análisis + Optimización)
    try {
        // --- PASO A: DETECCIÓN NSFW (Estrategia Sharp + TFJS Puro) ---
        try {
            const model = await getNSFWModel();
            
            // Usamos Sharp para obtener los píxeles crudos (Raw Buffer)
            // Esto evita usar tf.node.decodeImage que requiere binarios de C++
            const { data, info } = await sharp(file.path)
                .removeAlpha() // Quitar transparencia (necesitamos 3 canales RGB)
                .resize(224, 224, { fit: 'fill' }) // Redimensionar al tamaño que espera la IA (más rápido)
                .raw()
                .toBuffer({ resolveWithObject: true });

            // Crear el tensor manualmente desde el buffer de píxeles
            const imageTensor = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
            
            // Clasificar
            const predictions = await model.classify(imageTensor);
            imageTensor.dispose(); // Liberar memoria

            // Validar predicciones (> 60% seguridad)
            const explicitContent = predictions.find(p => 
                (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.60
            );

            if (explicitContent) {
                // Si es indebido, borramos y lanzamos error
                fs.unlinkSync(file.path);
                const error = new Error('Imagen rechazada: Se ha detectado contenido explícito o inapropiado.');
                error.statusCode = 400; 
                throw error;
            }

        } catch (nsfwError) {
            // Si el error es nuestro rechazo, lo subimos
            if (nsfwError.message.includes('Imagen rechazada')) {
                throw nsfwError;
            }
            console.error('[NSFW Check Warning] Fallo técnico al verificar imagen:', nsfwError.message);
            // Permitimos continuar si la IA falla técnicamente (Fail-Open)
        }

        // --- PASO B: OPTIMIZACIÓN FINAL (Sharp) ---
        const dir = path.dirname(file.path);
        const name = path.parse(file.filename).name;
        const newFilename = `${name}.webp`;
        const newPath = path.join(dir, newFilename);

        const pipeline = sharp(file.path)
            .resize(1080, 1920, { 
                fit: 'inside', 
                withoutEnlargement: true 
            });

        if (isHDR) {
            pipeline.withMetadata().webp({ quality: 90, effort: 5 });
        } else {
            pipeline.webp({ quality: 80 });
        }

        await pipeline.toFile(newPath);

        // Limpieza del original
        if (file.path !== newPath && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        const relativePath = path.relative(PUBLIC_DIR, newPath);
        return '/' + relativePath.split(path.sep).join('/');

    } catch (error) {
        // Limpieza de emergencia
        if (file && file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch(e) {}
        }
        console.error('Error procesando imagen:', error.message);
        throw error;
    }
};

export default { upload, processUploadedFile };