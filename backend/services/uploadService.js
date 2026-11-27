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

const BLOCKED_EXTENSIONS = new Set([
  '.html', '.htm', '.svg', '.svgz', '.xml', '.xhtml',
  '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx',
  '.php', '.phtml', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.py', '.sh', '.bash',
  '.exe', '.bat', '.cmd', '.vbs', '.msi', '.dll', '.ps1'
]);

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png',
  'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif'
]);

const ALLOWED_IMAGE_EXTS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif', '.avif'
]);

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v', 'video/3gpp'
]);

const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.mov', '.webm', '.m4v', '.3gp']);

const VIDEO_MIME_TO_EXT = {
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
  'video/webm': '.webm',
  'video/x-m4v': '.m4v',
  'video/3gpp': '.3gp',
};

const hasValidVideoSignature = (filePath) => {
  let fd;
  try {
    const header = Buffer.alloc(16);
    fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, header, 0, 16, 0);
    if (bytesRead < 8) return false;

    // WebM / Matroska EBML header: 1A 45 DF A3
    if (header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3) {
      return true;
    }

    // MP4 / MOV / M4V / 3GP ISO Base Media File Format boxes at offset 4..8
    const boxType = header.subarray(4, 8).toString('ascii');
    return ['ftyp', 'moov', 'mdat', 'wide', 'free', 'skip'].includes(boxType);
  } catch {
    return false;
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch {}
    }
  }
};

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
    else if (req.baseUrl.includes('exercise')) folder = 'exercises';

    const finalPath = path.join(UPLOADS_DIR, folder);
    ensureDir(finalPath);
    cb(null, finalPath);
  },
  filename: (req, file, cb) => {
    const mime = (file.mimetype || '').toLowerCase();
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    let safeExt = '.bin';

    if (ALLOWED_VIDEO_MIMES.has(mime)) {
      safeExt = ALLOWED_VIDEO_EXTS.has(rawExt) ? rawExt : (VIDEO_MIME_TO_EXT[mime] || '.mp4');
    } else if (ALLOWED_IMAGE_MIMES.has(mime)) {
      safeExt = ALLOWED_IMAGE_EXTS.has(rawExt) ? rawExt : '.img';
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + safeExt);
  }
});

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const rawExt = path.extname(file.originalname || '').toLowerCase();

  if (rawExt && BLOCKED_EXTENSIONS.has(rawExt)) {
    return cb(new Error('Extensión de archivo bloqueada por seguridad.'), false);
  }

  if (ALLOWED_IMAGE_MIMES.has(mime)) {
    if (rawExt && !ALLOWED_IMAGE_EXTS.has(rawExt)) {
      return cb(new Error('Extensión de imagen no permitida.'), false);
    }
    return cb(null, true);
  }

  if (ALLOWED_VIDEO_MIMES.has(mime)) {
    if (rawExt && !ALLOWED_VIDEO_EXTS.has(rawExt)) {
      return cb(new Error('Extensión de vídeo no permitida (usa .mp4, .mov o .webm).'), false);
    }
    return cb(null, true);
  }

  return cb(new Error('Formato de archivo no soportado'), false);
};

export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

export const uploadProfileImage = (req, res, next) => {
  const isPrivileged = req.user && (req.user.role === 'admin' || req.user.role === 'entrenador');

  const profileMulter = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: isPrivileged ? undefined : { fileSize: 5 * 1024 * 1024 }
  }).single('profileImage');

  profileMulter(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La foto de perfil excede el tamaño máximo permitido de 5MB.' });
      }
      return res.status(400).json({ error: err.message || 'Error al procesar la subida de la imagen.' });
    }
    next();
  });
};

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter,
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB limit para vídeos
});

// --- OPTIMIZACIÓN DE MEMORIA RAM ---
let model = null;
let activeUploads = 0; // Evita borrar el modelo si hay subidas simultáneas

const getModel = async () => {
  if (!model) {
    try {
      console.log("🧠 [IA] Cargando modelo NSFWJS en RAM...");
      model = await nsfw.load();
    } catch (err) {
      console.error("Error cargando modelo NSFWJS:", err);
    }
  }
  return model;
};

// Se ejecuta al terminar cada procesamiento de imagen
const releaseModelSafely = () => {
  if (activeUploads <= 0 && model) {
    console.log("🧹 [IA] Liberando memoria RAM: Destruyendo modelo TensorFlow.");
    model = null; // Eliminamos la referencia del objeto
    tf.disposeVariables(); // Destruimos los pesos de la IA de la memoria del servidor
  }
};

export const processUploadedFile = async (file, isHDRRequested = false) => {
  if (!file) throw new Error("No file provided");

  if ((file.mimetype || '').toLowerCase().startsWith('video/')) {
    if (!hasValidVideoSignature(file.path)) {
      if (fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch {}
      }
      throw new Error('El archivo de vídeo no tiene una cabecera multimedia válida.');
    }
    const relativePath = path.relative(PUBLIC_DIR, file.path);
    return {
      url: '/' + relativePath.split(path.sep).join('/'),
      isHDR: isHDRRequested 
    };
  }

  activeUploads++; // Registramos que un proceso está usando la IA

  try {
    const dir = path.dirname(file.path);
    const isExercisePic = dir.includes('exercises');

    if (!isExercisePic) {
      const { data, info } = await sharp(file.path, { limitInputPixels: false })
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
    }

    const name = path.parse(file.filename).name;
    const newFilename = `${name}.webp`;
    const newPath = path.join(dir, newFilename);

    const isProfilePic = dir.includes('profiles');
    const isStoryPic = dir.includes('stories');
    const imagePipeline = sharp(file.path, { limitInputPixels: false });
    const metadata = await imagePipeline.metadata();
    
    const isSourceHighDepth = metadata.depth === 'ushort' || metadata.depth === 'float';
    const shouldProcessAsHDR = isHDRRequested && isSourceHighDepth;
    const isAnimated = Number(metadata.pages || 1) > 1;
    const isRotated90 = Number(metadata.orientation || 0) >= 5 && Number(metadata.orientation || 0) <= 8;
    const srcW = isRotated90 ? metadata.height : metadata.width;
    const srcH = isRotated90 ? metadata.width : metadata.height;
    const srcAspect = srcW && srcH ? srcW / srcH : 9 / 16;

    let finalPipeline = sharp(file.path, { limitInputPixels: false }).rotate();

    if (isProfilePic) {
      finalPipeline = finalPipeline.resize(300, 300, {
        fit: 'cover'
      });
    } else if (isStoryPic && !isAnimated && !shouldProcessAsHDR) {
      if (Math.abs(srcAspect - 9 / 16) <= 0.03) {
        finalPipeline = finalPipeline.resize(1080, 1920, {
          fit: 'inside',
          withoutEnlargement: true
        });
      } else if (srcAspect >= 0.45 && srcAspect <= 0.65) {
        finalPipeline = finalPipeline.resize(1080, 1920, {
          fit: 'cover',
          position: 'centre'
        });
      } else {
        const [bgBuffer, fgBuffer] = await Promise.all([
          sharp(file.path, { limitInputPixels: false })
            .rotate()
            .resize(1080, 1920, { fit: 'cover', position: 'centre' })
            .blur(36)
            .modulate({ brightness: 0.52, saturation: 1.15 })
            .toBuffer(),
          sharp(file.path, { limitInputPixels: false })
            .rotate()
            .resize(1040, 1820, { fit: 'inside', withoutEnlargement: true })
            .toBuffer(),
        ]);
        finalPipeline = sharp(bgBuffer).composite([{ input: fgBuffer, gravity: 'centre' }]);
      }
    } else {
      finalPipeline = finalPipeline.resize(1080, 1920, { 
        fit: 'inside', 
        withoutEnlargement: true 
      });
    }

    if (shouldProcessAsHDR && !isProfilePic) {
      finalPipeline.withMetadata().webp({ quality: 85, effort: 4 });
    } else {
      finalPipeline
        .toColourspace('srgb')
        .webp({ quality: 75, effort: 3 }); 
    }

    await finalPipeline.toFile(newPath);

    if (file.path !== newPath && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    const relativePath = path.relative(PUBLIC_DIR, newPath);
    
    return {
      url: '/' + relativePath.split(path.sep).join('/'),
      isHDR: shouldProcessAsHDR && !isProfilePic
    };

  } catch (error) {
    if (file && file.path && fs.existsSync(file.path)) {
      try { fs.unlinkSync(file.path); } catch (e) { }
    }
    throw error;
  } finally {
    // El bloque finally se asegura de que la RAM se libere siempre, 
    // incluso si hubo un error (como la detección NSFW)
    activeUploads--;
    releaseModelSafely();
  }
};