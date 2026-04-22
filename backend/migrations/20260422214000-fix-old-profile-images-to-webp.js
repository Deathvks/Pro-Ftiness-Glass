/* backend/migrations/20260422214000-fix-old-profile-images-to-webp.js */
'use strict';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// --- Configuración ---
const IMAGE_QUALITY_PROFILE = 80;
const IMAGE_QUALITY_FOOD = 75;
const RESIZE_OPTIONS_PROFILE = { width: 300, height: 300, fit: 'cover' };
const RESIZE_OPTIONS_FOOD = { width: 800, height: 800, fit: 'inside', withoutEnlargement: true };
const BATCH_SIZE = 50;
// --- Fin Configuración ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.resolve(__dirname, '..', 'public');

async function convertImage(relativePath, quality, resizeOptions = null) {
  if (!relativePath || typeof relativePath !== 'string' || relativePath.toLowerCase().endsWith('.webp')) {
    return null;
  }

  let cleanRelativePath = relativePath.replace(/\\/g, '/').trim();

  // IGNORAR URLs EXTERNAS (Evita errores con fotos de Google/Discord/Facebook)
  if (cleanRelativePath.startsWith('http://') || cleanRelativePath.startsWith('https://')) {
      return null;
  }

  // REPARACIÓN: Si es un usuario muy antiguo y le falta la barra inicial, se la añadimos
  if (!cleanRelativePath.startsWith('/')) {
      cleanRelativePath = '/' + cleanRelativePath;
  }

  const originalFullPath = path.join(basePath, cleanRelativePath);
  const parsedPath = path.parse(cleanRelativePath);

  const safeName = parsedPath.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const webpFilename = `${safeName}.webp`;
  const webpRelativePath = path.join(parsedPath.dir, webpFilename).replace(/\\/g, '/');
  const webpFullPath = path.join(basePath, webpRelativePath);

  try {
    await fs.access(originalFullPath);

    try {
      await fs.access(webpFullPath);
      return { newRelativePath: webpRelativePath, originalFullPath: originalFullPath };
    } catch (e) {}

    await fs.mkdir(path.dirname(webpFullPath), { recursive: true });

    let sharpInstance = sharp(originalFullPath);
    if (resizeOptions) {
      sharpInstance = sharpInstance.resize(resizeOptions);
    }
    await sharpInstance.webp({ quality }).toFile(webpFullPath);

    console.log(`✅ Convertido: ${cleanRelativePath} -> ${webpRelativePath}`);
    return { newRelativePath: webpRelativePath, originalFullPath: originalFullPath };

  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`❌ Error convirtiendo ${cleanRelativePath}: ${error.message}`);
    }
    return null; 
  }
}

export default {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    const originalFilesToDelete = new Set();
    let totalChecked = 0;
    let totalConvertedOrUpdated = 0;

    console.log("--- Iniciando REPARACIÓN de imágenes antiguas a WebP ---");

    try {
      // --- 1. Procesar imágenes de Perfil (Users) ---
      console.log("\n👤 Procesando imágenes de Perfil...");
      
      // Optimizamos la query para descartar directamente las que empiezan por HTTP
      const [users] = await queryInterface.sequelize.query(
        `SELECT id, profile_image_url FROM users WHERE profile_image_url IS NOT NULL AND profile_image_url NOT LIKE '%.webp' AND profile_image_url NOT LIKE 'http%'`,
        { transaction }
      );
      
      console.log(`Encontrados ${users.length} perfiles con imágenes locales no-WebP.`);
      for (const user of users) {
        totalChecked++;
        const currentUrl = user.profile_image_url;
        const result = await convertImage(currentUrl, IMAGE_QUALITY_PROFILE, RESIZE_OPTIONS_PROFILE);
        
        if (result && result.newRelativePath !== currentUrl) {
          await queryInterface.sequelize.query(
            `UPDATE users SET profile_image_url = ? WHERE id = ?`,
            { replacements: [result.newRelativePath, user.id], transaction }
          );
          originalFilesToDelete.add(result.originalFullPath);
          totalConvertedOrUpdated++;
        } else if (result && result.newRelativePath === currentUrl && !currentUrl.toLowerCase().endsWith('.webp')) {
           originalFilesToDelete.add(result.originalFullPath);
        }
      }
      console.log(`Perfiles procesados. ${totalConvertedOrUpdated} actualizados en BBDD.`);

      // --- 2. Procesar imágenes de Comidas (NutritionLog) ---
      console.log("\n🍔 Procesando imágenes de Registros de Comida...");
      let offset = 0;
      let logsFoundInBatch = 0;
      do {
          const [logsBatch] = await queryInterface.sequelize.query(
              `SELECT id, image_url FROM nutrition_logs WHERE image_url IS NOT NULL AND image_url NOT LIKE '%.webp' LIMIT ? OFFSET ?`,
              { replacements: [BATCH_SIZE, offset], transaction }
          );
          logsFoundInBatch = logsBatch.length;
          if(logsFoundInBatch > 0) console.log(`Procesando lote de ${logsFoundInBatch} registros de comida (offset: ${offset})...`);

          for (const log of logsBatch) {
              totalChecked++;
              const currentUrl = log.image_url;
              const result = await convertImage(currentUrl, IMAGE_QUALITY_FOOD, RESIZE_OPTIONS_FOOD);
              if (result && result.newRelativePath !== currentUrl) {
                  await queryInterface.sequelize.query(
                    `UPDATE nutrition_logs SET image_url = ? WHERE id = ?`,
                    { replacements: [result.newRelativePath, log.id], transaction }
                  );
                  originalFilesToDelete.add(result.originalFullPath);
                  totalConvertedOrUpdated++;
                } else if (result && result.newRelativePath === currentUrl && !currentUrl.toLowerCase().endsWith('.webp')) {
                   originalFilesToDelete.add(result.originalFullPath);
               }
          }
          offset += logsFoundInBatch;
      } while (logsFoundInBatch === BATCH_SIZE);
      console.log(`Registros de comida procesados. ${totalConvertedOrUpdated} actualizados en BBDD (acumulado).`);

      // --- 3. Procesar imágenes de Comidas Favoritas (FavoriteMeal) ---
      console.log("\n⭐ Procesando imágenes de Comidas Favoritas...");
      offset = 0; 
      let mealsFoundInBatch = 0;
       do {
          const [mealsBatch] = await queryInterface.sequelize.query(
              `SELECT id, image_url FROM favorite_meals WHERE image_url IS NOT NULL AND image_url NOT LIKE '%.webp' LIMIT ? OFFSET ?`,
              { replacements: [BATCH_SIZE, offset], transaction }
          );
          mealsFoundInBatch = mealsBatch.length;
           if(mealsFoundInBatch > 0) console.log(`Procesando lote de ${mealsFoundInBatch} comidas favoritas (offset: ${offset})...`);

          for (const meal of mealsBatch) {
              totalChecked++;
              const currentUrl = meal.image_url;
              const result = await convertImage(currentUrl, IMAGE_QUALITY_FOOD, RESIZE_OPTIONS_FOOD);
              if (result && result.newRelativePath !== currentUrl) {
                  await queryInterface.sequelize.query(
                    `UPDATE favorite_meals SET image_url = ? WHERE id = ?`,
                    { replacements: [result.newRelativePath, meal.id], transaction }
                  );
                  originalFilesToDelete.add(result.originalFullPath);
                  totalConvertedOrUpdated++;
                } else if (result && result.newRelativePath === currentUrl && !currentUrl.toLowerCase().endsWith('.webp')) {
                   originalFilesToDelete.add(result.originalFullPath);
               }
          }
           offset += mealsFoundInBatch;
      } while (mealsFoundInBatch === BATCH_SIZE);
      console.log(`Comidas favoritas procesadas. ${totalConvertedOrUpdated} actualizados en BBDD (acumulado).`);

      // --- Commit ---
      await transaction.commit();
      console.log("\n✅ Transacción de base de datos completada.");
      console.log(`Total registros BBDD verificados: ${totalChecked}`);
      console.log(`Total URLs BBDD actualizadas a .webp: ${totalConvertedOrUpdated}`);

      // --- Borrar Originales (DESPUÉS del commit) ---
      console.log(`\n🗑️ Intentando borrar ${originalFilesToDelete.size} archivos originales...`);
      let deletedCount = 0;
      let failedDeleteCount = 0;
      for (const filePath of originalFilesToDelete) {
        try {
          await fs.unlink(filePath);
          deletedCount++;
        } catch (unlinkError) {
          if (unlinkError.code !== 'ENOENT') { 
             console.warn(`   ⚠️ No se pudo borrar ${filePath}: ${unlinkError.message}`);
             failedDeleteCount++;
          }
        }
      }
      console.log(`   Archivos originales borrados: ${deletedCount}`);
      if (failedDeleteCount > 0) {
          console.warn(`   Archivos originales NO borrados (ver warnings): ${failedDeleteCount}`);
      }
      console.log("\n--- REPARACIÓN de imágenes a WebP finalizada ---");

    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Error durante la reparación de imágenes. Rollback realizado.", error);
      throw error;
    }
  },

  async down() {
    console.warn("⚠️ No se puede revertir automáticamente la conversión de imágenes a WebP.");
  }
};