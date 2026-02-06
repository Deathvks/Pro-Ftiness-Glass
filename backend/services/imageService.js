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
 * Limpieza de imágenes optimizada (RAM eficiente)
 */
export const cleanOrphanedImages = async () => {
    console.log('🧹 [Mantenimiento] Iniciando limpieza de imágenes huérfanas...');

    try {
        // 1. Recolectar URLs en uso (Paralelo y RAW para ahorrar RAM)
        // Añadimos BugReport para no borrar capturas de errores reportados
        const [users, meals, logs, routines, stories, bugs] = await Promise.all([
            User.findAll({ attributes: ['profile_image_url'], where: { profile_image_url: { [models.Sequelize.Op.ne]: null } }, raw: true }),
            FavoriteMeal.findAll({ attributes: ['image_url'], where: { image_url: { [models.Sequelize.Op.ne]: null } }, raw: true }),
            NutritionLog.findAll({ attributes: ['image_url'], where: { image_url: { [models.Sequelize.Op.ne]: null } }, raw: true }),
            Routine.findAll({ attributes: ['image_url'], where: { image_url: { [models.Sequelize.Op.ne]: null } }, raw: true }),
            Story.findAll({ attributes: ['url'], where: { url: { [models.Sequelize.Op.ne]: null } }, raw: true }),
            BugReport.findAll({ attributes: ['image_url'], where: { image_url: { [models.Sequelize.Op.ne]: null } }, raw: true })
        ]);

        const activeImages = new Set();
        
        // Helper para normalizar rutas y añadirlas al Set
        const addToSet = (list, key) => list.forEach(item => {
            if (item[key]) {
                // Normalizamos a minúsculas y formato path para comparar
                activeImages.add(path.normalize(item[key]).toLowerCase());
            }
        });

        addToSet(users, 'profile_image_url');
        addToSet(meals, 'image_url');
        addToSet(logs, 'image_url');
        addToSet(routines, 'image_url');
        addToSet(stories, 'url');
        addToSet(bugs, 'image_url');

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