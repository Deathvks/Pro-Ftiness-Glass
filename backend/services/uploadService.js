/* backend/services/uploadService.js */
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { createRequire } from 'module';
import * as tf from '@tensorflow/tfjs';

const require = createRequire(import.meta.url);
const nsfw = require('nsfwjs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'images');

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

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
  limits: { fileSize: 50 * 1024 * 1024 }
});

let model;

// Carga Lazy: Solo cargamos el modelo la primera vez que se necesita
const getModel = async () => {
  if (!model) {
    try {
      model = await nsfw.load();
      console.log("Modelo NSFWJS cargado en memoria.");
    } catch (err) {
      console.error("Error cargando modelo NSFWJS:", err);
    }
  }
  return model;
};

export const processUploadedFile = async (file, isHDRRequested = false) => {
  if (!file) throw new Error("No file provided");

  if (file.mimetype.startsWith('video/')) {
    const relativePath = path.relative(PUBLIC_DIR, file.path);
    return {
      url: '/' + relativePath.split(path.sep).join('/'),
      isHDR: isHDRRequested 
    };
  }

  try {
    // --- PASO A: VERIFICACIÓN NSFW ---
    const { data, info } = await sharp(file.path)
      .resize(224, 224, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tfImage = tf.tensor3d(new Uint8Array(data), [info.height, info.width, 3], 'int32');
    const loadedModel = await getModel();

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

    // --- PASO B: PROCESAMIENTO OPTIMIZADO (SDR/HDR) ---
    const dir = path.dirname(file.path);
    const name = path.parse(file.filename).name;
    const newFilename = `${name}.webp`;
    const newPath = path.join(dir, newFilename);

    const imagePipeline = sharp(file.path);
    const metadata = await imagePipeline.metadata();
    
    const isSourceHighDepth = metadata.depth === 'ushort' || metadata.depth === 'float';
    const shouldProcessAsHDR = isHDRRequested && isSourceHighDepth;

    // Pipeline base
    const finalPipeline = sharp(file.path)
      .rotate() 
      .resize(1080, 1920, { 
        fit: 'inside', 
        withoutEnlargement: true 
      });

    if (shouldProcessAsHDR) {
      // HDR: Calidad alta necesaria para profundidad de color
      finalPipeline.withMetadata().webp({ quality: 85, effort: 4 });
    } else {
      // SDR: Ahorro máximo. Eliminamos metadatos no visuales y bajamos calidad a estándar web
      finalPipeline
        .toColourspace('srgb')
        .webp({ quality: 75, effort: 3 }); // Effort 3 es más rápido (menos CPU)
    }

    await finalPipeline.toFile(newPath);

    // Borrar original inmediatamente para liberar espacio temporal
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