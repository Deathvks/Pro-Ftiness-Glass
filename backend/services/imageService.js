/* backend/services/imageService.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import models from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asumimos que la carpeta public está en backend/public
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

const { User, FavoriteMeal, NutritionLog, Exercise } = models;

/**
 * Borra un archivo del sistema de archivos dada su ruta relativa (ej: /uploads/perfil/foto.jpg)
 */
export const deleteFile = (relativePath) => {
    if (!relativePath) return;

    // Ignorar URLs externas (ej: fotos de Google)
    if (relativePath.startsWith('http') || relativePath.startsWith('//')) {
        return;
    }

    try {
        // Normalizar ruta para evitar problemas de barras
        const fullPath = path.join(PUBLIC_DIR, relativePath);

        // Verificar seguridad: asegurar que el archivo está dentro de public
        if (!fullPath.startsWith(PUBLIC_DIR)) {
            console.warn(`Intento de borrado fuera de public: ${fullPath}`);
            return;
        }

        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`🗑️ Archivo eliminado: ${relativePath}`);
        }
    } catch (error) {
        console.error(`Error al eliminar archivo ${relativePath}:`, error);
    }
};

/**
 * Escanea la carpeta 'uploads' y elimina archivos que no estén en la base de datos.
 */
export const cleanOrphanedImages = async () => {
    console.log('🧹 Iniciando limpieza de imágenes huérfanas...');

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log('Carpeta uploads no existe, omitiendo limpieza.');
        return;
    }

    try {
        // 1. Recolectar todas las imágenes en uso en la BD
        const activeImages = new Set();

        const users = await User.findAll({ attributes: ['profile_image_url'] });
        users.forEach(u => u.profile_image_url && activeImages.add(path.normalize(u.profile_image_url)));

        const meals = await FavoriteMeal.findAll({ attributes: ['image_url'] });
        meals.forEach(m => m.image_url && activeImages.add(path.normalize(m.image_url)));

        const logs = await NutritionLog.findAll({ attributes: ['image_url'] });
        logs.forEach(l => l.image_url && activeImages.add(path.normalize(l.image_url)));

        // Añadir aquí otros modelos si tienen imágenes subidas (ej: Ejercicios si son subidos por usuario)

        // 2. Obtener todos los archivos físicos en uploads (recursivo)
        const filesOnDisk = getAllFiles(UPLOADS_DIR);

        // 3. Comparar y eliminar
        let deletedCount = 0;
        filesOnDisk.forEach(fullPath => {
            // Convertir ruta absoluta a relativa para comparar con la BD (ej: /uploads/users/img.jpg)
            const relativePath = fullPath.replace(PUBLIC_DIR, '');
            const normalizedRelative = path.normalize(relativePath);

            // Windows/Linux compatibilidad de barras
            const isUsed = [...activeImages].some(activePath => {
                // Normalizar ambas para comparar
                return activePath.includes(normalizedRelative) || normalizedRelative.includes(activePath);
            });

            if (!isUsed) {
                fs.unlinkSync(fullPath);
                console.log(`🗑️ Huérfano eliminado: ${relativePath}`);
                deletedCount++;
            }
        });

        console.log(`✅ Limpieza completada. ${deletedCount} archivos eliminados.`);

    } catch (error) {
        console.error('Error durante la limpieza de imágenes:', error);
    }
};

// Helper para listar archivos recursivamente
const getAllFiles = (dirPath, arrayOfFiles) => {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(file => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
};

export default { deleteFile, cleanOrphanedImages };