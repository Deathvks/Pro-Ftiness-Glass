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
// CAMBIO IMPORTANTE: Usamos 'images' en lugar de 'uploads' para coincidir con el volumen persistente de Zeabur
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'images');

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
            // Opción A: Cargar desde URL pública
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
 * Procesa la imagen: Verifica NSFW y Gestiona HDR vs SDR
 * @param {Object} file - Objeto file de Multer
 * @param {Boolean} isHDRRequested - Si el usuario confirmó usar HDR
 * @returns {Promise<{url: string, isHDR: boolean}>}
 */
export const processUploadedFile = async (file, isHDRRequested = false) => {
    if (!file) throw new Error("No file provided");

    // --- VÍDEO: Pass-through (Sin renombrado forzoso) ---
    // Mantenemos la extensión original (.mov, .mp4).
    // Renombrar .mov a .mp4 sin convertir el codec (transcoding) causa errores en Safari
    // porque detecta una discrepancia entre el contenedor (QuickTime) y la extensión (MP4).
    if (file.mimetype.startsWith('video/')) {
        const relativePath = path.relative(PUBLIC_DIR, file.path);
        // Aseguramos formato de URL con barras normales
        return {
            url: '/' + relativePath.split(path.sep).join('/'),
            isHDR: isHDRRequested 
        };
    }

    try {
        // --- PASO A: VERIFICACIÓN NSFW (Imágenes) ---
        const { data, info } = await sharp(file.path)
            .resize(224, 224, { fit: 'cover' })
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        const tfImage = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');

        const loadedModel = await loadModel();
        if (loadedModel) {
            const predictions = await loadedModel.classify(tfImage);
            tfImage.dispose(); 

            const nsfwFound = predictions.find(p =>
                (p.className === 'Porn' || p.className === 'Hentai') && p.probability > 0.60
            );

            if (nsfwFound) {
                if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
                const nsfwError = new Error("Contenido inapropiado detectado (NSFW).");
                nsfwError.code = "NSFW_DETECTED";
                throw nsfwError;
            }
        } else {
            if (tfImage) tfImage.dispose();
        }

        // --- PASO B: PROCESAMIENTO HDR vs SDR ---
        const dir = path.dirname(file.path);
        const name = path.parse(file.filename).name;
        const newFilename = `${name}.webp`;
        const newPath = path.join(dir, newFilename);

        const imagePipeline = sharp(file.path);
        const metadata = await imagePipeline.metadata();
        
        const isSourceHighDepth = metadata.depth === 'ushort' || metadata.depth === 'float';
        
        const shouldProcessAsHDR = isHDRRequested && isSourceHighDepth;

        const finalPipeline = sharp(file.path)
            .rotate() 
            .resize(1080, 1920, { 
                fit: 'inside', 
                withoutEnlargement: true 
            });

        if (shouldProcessAsHDR) {
            finalPipeline.withMetadata().webp({ quality: 90, effort: 5 });
        } else {
            finalPipeline
                .toColourspace('srgb')
                .webp({ quality: 80, effort: 4 });
        }

        await finalPipeline.toFile(newPath);

        if (file.path !== newPath && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        const relativePath = path.relative(PUBLIC_DIR, newPath);
        
        return {
            url: '/' + relativePath.split(path.sep).join('/'),
            isHDR: shouldProcessAsHDR
        };

    } catch (error) {
        if (file && file.path && fs.existsSync(file.path)) {
            try { fs.unlinkSync(file.path); } catch (e) { /* ignore */ }
        }
        throw error;
    }
};