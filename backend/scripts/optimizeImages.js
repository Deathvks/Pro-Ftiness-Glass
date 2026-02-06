/* backend/scripts/optimizeImages.js */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';
import { Op } from 'sequelize';
import db from '../models/index.js';

const { User, NutritionLog, FavoriteMeal, Story, Routine, BugReport } = db;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');

/**
 * Helper core: Optimiza un archivo físico y devuelve la nueva URL.
 * Retorna null si no se hizo ningún cambio.
 */
async function processFile(originalUrl) {
    if (!originalUrl) return null;
    if (originalUrl.endsWith('.webp')) return null; // Ya optimizado
    
    // Ignorar videos
    const ext = path.extname(originalUrl).toLowerCase();
    if (['.mp4', '.mov', '.avi', '.webm'].includes(ext)) return null;

    // Normalizar ruta
    const relativePath = originalUrl.startsWith('/') ? originalUrl.slice(1) : originalUrl;
    const inputPath = path.join(PUBLIC_DIR, relativePath);

    // Verificar existencia
    if (!fs.existsSync(inputPath)) return null;

    // Rutas de salida
    const dir = path.dirname(inputPath);
    const name = path.parse(inputPath).name;
    const outputFilename = `${name}.webp`;
    const outputPath = path.join(dir, outputFilename);

    try {
        // Conversión
        await sharp(inputPath)
            .rotate()
            .resize(1080, 1920, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 75 })
            .toFile(outputPath);

        // Borrar original si es diferente
        if (inputPath !== outputPath) {
            fs.unlinkSync(inputPath);
        }

        // Construir nueva URL
        const newRelativePath = path.relative(PUBLIC_DIR, outputPath);
        return '/' + newRelativePath.split(path.sep).join('/');

    } catch (error) {
        console.error(`❌ Error procesando fichero ${originalUrl}:`, error.message);
        return null;
    }
}

/**
 * Optimiza un registro estándar (columna string única)
 */
async function optimizeRecord(record, fieldName, modelName) {
    const originalUrl = record[fieldName];
    const newUrl = await processFile(originalUrl);
    
    if (newUrl) {
        record[fieldName] = newUrl;
        await record.save({ hooks: false });
        console.log(`✅ [${modelName}] ID ${record.id}: ${originalUrl} -> ${newUrl}`);
    }
}

/**
 * Optimiza específicamente BugReports (columna JSON Array 'images')
 */
async function optimizeBugReport(bug) {
    const images = bug.images; // Array de strings
    if (!images || !Array.isArray(images) || images.length === 0) return;

    let changed = false;
    const newImages = [];

    for (const imgUrl of images) {
        const newUrl = await processFile(imgUrl);
        if (newUrl) {
            newImages.push(newUrl);
            changed = true;
            console.log(`✅ [BugReport] ID ${bug.id} img: ${imgUrl} -> ${newUrl}`);
        } else {
            newImages.push(imgUrl);
        }
    }

    if (changed) {
        // Actualizamos el array completo en la BD
        bug.images = newImages; 
        bug.changed('images', true); // Forzar detección de cambios en JSON para Sequelize
        await bug.save({ hooks: false });
    }
}

async function runOptimization() {
    console.log('🚀 Iniciando optimización masiva de imágenes (V2)...');
    
    try {
        // --- 1. USUARIOS ---
        console.log('--- Procesando Usuarios ---');
        const users = await User.findAll({ where: { profile_image_url: { [Op.ne]: null } } });
        for (const user of users) await optimizeRecord(user, 'profile_image_url', 'User');

        // --- 2. COMIDAS ---
        console.log('--- Procesando Registros de Comida ---');
        const logs = await NutritionLog.findAll({ where: { image_url: { [Op.ne]: null } } });
        for (const log of logs) await optimizeRecord(log, 'image_url', 'NutritionLog');

        // --- 3. FAVORITOS ---
        console.log('--- Procesando Comidas Favoritas ---');
        const favs = await FavoriteMeal.findAll({ where: { image_url: { [Op.ne]: null } } });
        for (const fav of favs) await optimizeRecord(fav, 'image_url', 'FavoriteMeal');

        // --- 4. HISTORIAS ---
        console.log('--- Procesando Historias ---');
        const stories = await Story.findAll({ where: { url: { [Op.ne]: null }, type: 'image' } });
        for (const story of stories) await optimizeRecord(story, 'url', 'Story');

        // --- 5. RUTINAS ---
        console.log('--- Procesando Rutinas ---');
        const routines = await Routine.findAll({ where: { image_url: { [Op.ne]: null } } });
        for (const routine of routines) await optimizeRecord(routine, 'image_url', 'Routine');
        
        // --- 6. REPORTES DE BUGS (FIXED) ---
        console.log('--- Procesando Reportes de Bugs ---');
        // Traemos todos para filtrar el JSON en JS (más seguro entre DBs)
        const bugs = await BugReport.findAll();
        for (const bug of bugs) {
            await optimizeBugReport(bug);
        }

        console.log('✨ Optimización completada con éxito.');
        process.exit(0);

    } catch (error) {
        console.error('🔥 Error crítico en el script:', error);
        process.exit(1);
    }
}

runOptimization();