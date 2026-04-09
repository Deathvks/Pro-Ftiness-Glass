/* backend/services/imageService.js */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import models from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.resolve(__dirname, '../public');
// CORRECCIÓN CRÍTICA: Apuntamos a 'images' para coincidir con tu volumen persistente de Zeabur
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'images');

const { User, FavoriteMeal, NutritionLog, Routine, Story, BugReport } = models;

/**
 * Borra un archivo de forma asíncrona (No bloquea el servidor).
 */
export const deleteFile = async (relativePath) => {
    if (!relativePath) return;

    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
        return;
    }

    try {
        const fullPath = path.join(PUBLIC_DIR, relativePath);

        // Seguridad: Evitar Path Traversal (intentar borrar archivos fuera de public)
        if (!fullPath.startsWith(PUBLIC_DIR)) {
            console.warn(`[Security] Intento de borrado fuera de public: ${fullPath}`);
            return;
        }

        // Verificamos si existe antes de intentar borrar
        try {
            await fs.access(fullPath); // Check if exists
            await fs.unlink(fullPath); // Delete
            // console.log(`🗑️ Archivo eliminado: ${relativePath}`);
        } catch (e) {
            // Si el archivo no existe, no hacemos nada (evita errores en logs)
        }
    } catch (error) {
        console.error(`Error al eliminar archivo ${relativePath}:`, error.message);
    }
};

/**
 * Función auxiliar recursiva para listar archivos (Async)
 */
async function getFilesRecursively(dir) {
    let results = [];
    try {
        const list = await fs.readdir(dir, { withFileTypes: true });
        
        const promises = list.map(async (dirent) => {
            const res = path.resolve(dir, dirent.name);
            if (dirent.isDirectory()) {
                const subFiles = await getFilesRecursively(res);
                results = results.concat(subFiles);
            } else {
                results.push(res);
            }
        });

        await Promise.all(promises);
    } catch (err) {
        // Si el directorio 'images' no existe aún, no pasa nada
        if (err.code !== 'ENOENT') console.error(`Error leyendo directorio ${dir}:`, err.message);
    }
    return results;
}

/**
 * Función auxiliar para cargar URLs activas procesando la BD por lotes (Evita picos de RAM)
 */
const loadActiveImagesInBatches = async (Model, column, activeImagesSet) => {
    const limit = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
        const records = await Model.findAll({
            attributes: [column],
            where: { [column]: { [models.Sequelize.Op.ne]: null } },
            limit,
            offset,
            raw: true
        });

        records.forEach(item => {
            if (item[column]) {
                // Normalizamos a minúsculas y formato path para comparar
                activeImagesSet.add(path.normalize(item[column]).toLowerCase());
            }
        });
        
        hasMore = records.length === limit;
        offset += limit;
    }
};

/**
 * Limpieza de imágenes optimizada (RAM eficiente)
 */
export const cleanOrphanedImages = async () => {
    console.log('🧹 [Mantenimiento] Iniciando limpieza de imágenes huérfanas...');

    try {
        const activeImages = new Set();
        
        // 1. Recolectar URLs en uso (Paralelo, RAW y por lotes para ahorrar RAM)
        // Añadimos BugReport para no borrar capturas de errores reportados
        await Promise.all([
            loadActiveImagesInBatches(User, 'profile_image_url', activeImages),
            loadActiveImagesInBatches(FavoriteMeal, 'image_url', activeImages),
            loadActiveImagesInBatches(NutritionLog, 'image_url', activeImages),
            loadActiveImagesInBatches(Routine, 'image_url', activeImages),
            loadActiveImagesInBatches(Story, 'url', activeImages),
            loadActiveImagesInBatches(BugReport, 'image_url', activeImages)
        ]);

        // 2. Escanear disco físico
        const filesOnDisk = await getFilesRecursively(UPLOADS_DIR);

        // 3. Comparar y eliminar
        let deletedCount = 0;
        const deletePromises = filesOnDisk.map(async (fullPath) => {
            // Convertir ruta absoluta de disco a relativa web
            // Ej: /src/public/images/file.jpg -> /images/file.jpg
            let relativePath = fullPath.replace(PUBLIC_DIR, '');
            
            // Asegurar que empieza con /
            if (!relativePath.startsWith(path.sep)) relativePath = path.sep + relativePath;

            const normalizedRelative = path.normalize(relativePath).toLowerCase();

            // Si la imagen en disco NO está en la lista de activas -> Borrar
            if (!activeImages.has(normalizedRelative)) {
                try {
                    await fs.unlink(fullPath);
                    deletedCount++;
                } catch (e) {
                    console.error(`Error borrando ${relativePath}`, e.message);
                }
            }
        });

        await Promise.all(deletePromises);

        if (deletedCount > 0) {
            console.log(`✅ Limpieza completada. ${deletedCount} archivos eliminados (Espacio recuperado).`);
        } else {
            console.log(`✅ Limpieza completada. No se encontraron archivos huérfanos.`);
        }

    } catch (error) {
        console.error('Error crítico en limpieza de imágenes:', error);
    }
};

export default { deleteFile, cleanOrphanedImages };