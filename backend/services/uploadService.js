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
        else if (req.baseUrl.includes('exercises')) folder = 'exercises';

        const finalPath = path.join(UPLOADS_DIR, folder);
        ensureDir(finalPath);
        cb(null, finalPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Formato de archivo no soportado'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB límite
});

// --- Variables Globales para el Modelo IA ---
let model;

const loadModel = async () => {
    if (!model) {
        try {
            // Opción A: Cargar desde URL pública (más fácil, no requiere archivos locales)
            model = await nsfw.load();
            console.log("Modelo NSFWJS cargado correctamente.");
        } catch (err) {
            console.error("Error cargando modelo NSFWJS:", err);
        }
    }
    return model;
};

// Inicializar modelo al arrancar
loadModel();

/**
 * Procesa la imagen: Verifica NSFW y Optimiza/Convierte a WebP
 * @param {Object} file - Objeto file de Multer
 * @param {Boolean} isHDR - Si el usuario solicitó HDR
 * @returns {String} - URL relativa del archivo procesado
 */
export const processUploadedFile = async (file, isHDR = false) => {
    if (!file) throw new Error("No file provided");

    // Si es video, por ahora no procesamos (solo devolvemos ruta)
    if (file.mimetype.startsWith('video/')) {
        const relativePath = path.relative(PUBLIC_DIR, file.path);
        return '/' + relativePath.split(path.sep).join('/');
    }

    try {
        // --- PASO A: VERIFICACIÓN NSFW ---
        // Usamos sharp para leer la imagen y obtener metadatos antes de nada
        const imagePipeline = sharp(file.path);
        const metadata = await imagePipeline.metadata();

        // Buffer para la IA (redimensionado pequeño para velocidad)
        const buffer = await imagePipeline
            .clone() // Clonamos para no afectar el pipeline principal
            .resize(224, 224, { fit: 'cover' })
            .toBuffer();

        // Convertir buffer a tensor 3D
        const tfImage = tf.node.decodeImage(buffer, 3);

        const loadedModel = await loadModel();
        if (loadedModel) {
            const predictions = await loadedModel.classify(tfImage);
            tfImage.dispose(); // Liberar memoria del tensor

            // Reglas de bloqueo (Pornografía o Hentai > 60%)
            const nsfwFound = predictions.find(p =>
                (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.60
            );

            if (nsfwFound) {
                // Borrar archivo temporal
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                const nsfwError = new Error("Contenido inapropiado detectado (NSFW).");
                nsfwError.code = "NSFW_DETECTED";
                throw nsfwError;
            }
        } else {
            if (tfImage) tfImage.dispose();
            console.warn('[NSFW Check Warning] Modelo no cargado, saltando verificación.');
        }

        // --- PASO B: OPTIMIZACIÓN FINAL (Sharp) ---
        const dir = path.dirname(file.path);
        const name = path.parse(file.filename).name;
        const newFilename = `${name}.webp`;
        const newPath = path.join(dir, newFilename);

        // --- LÓGICA HDR INTELIGENTE ---
        // Verificamos si la imagen original realmente soporta HDR.
        // Las imágenes HDR suelen tener una profundidad de bits 'ushort' (16-bit) o 'float',
        // a diferencia del estándar 'uchar' (8-bit).
        const isSourceHighDepth = metadata.depth === 'ushort' || metadata.depth === 'float';
        
        // Solo aplicamos procesado HDR si el usuario lo pidió Y la imagen tiene datos suficientes.
        const shouldProcessAsHDR = isHDR && isSourceHighDepth;

        const finalPipeline = sharp(file.path)
            .rotate() // Auto-rotar según EXIF
            .resize(1080, 1920, { 
                fit: 'inside', 
                withoutEnlargement: true 
            });

        if (shouldProcessAsHDR) {
            // Modo HDR Real: Mantenemos metadatos (perfiles de color P3/Rec2020) y alta calidad
            finalPipeline.withMetadata().webp({ quality: 90, effort: 5 });
        } else {
            // Modo Estándar: Eliminamos metadatos extra para ahorrar espacio, calidad estándar
            finalPipeline.webp({ quality: 80, effort: 4 });
        }

        await finalPipeline.toFile(newPath);

        // Limpieza del original
        if (file.path !== newPath && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        const relativePath = path.relative(PUBLIC_DIR, newPath);
        return '/' + relativePath.split(path.sep).join('/');

    } catch (error) {
        // Limpieza de emergencia
        if (file && file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
        }
        throw error;
    }
};