'use strict';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
// Importa los modelos y la instancia de sequelize desde tu index.js
import db from '../models/index.js';
const { User, NutritionLog, FavoriteMeal, sequelize } = db;
// Necesitamos Op para las queries Where
const { Op } = db.sequelize.Sequelize;

// --- Configuración ---
const IMAGE_QUALITY_PROFILE = 80;
const IMAGE_QUALITY_FOOD = 75;
const RESIZE_OPTIONS_PROFILE = { width: 300, height: 300, fit: 'cover' };
const RESIZE_OPTIONS_FOOD = { width: 800, height: 800, fit: 'inside', withoutEnlargement: true };
const BATCH_SIZE = 50; // Procesar N imágenes a la vez para no sobrecargar memoria
// --- Fin Configuración ---

// Helper para obtener la ruta base del directorio 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basePath = path.resolve(__dirname, '..', 'public');

/**
 * Convierte una imagen a WebP si no existe ya.
 * @param {string} relativePath Ruta relativa desde /public (ej: /images/profiles/...)
 * @param {number} quality Calidad de WebP (1-100)
 * @param {object|null} resizeOptions Opciones de redimensionado para Sharp
 * @returns {Promise<{newRelativePath: string, originalFullPath: string}|null>} Objeto con nueva ruta y ruta original, o null si falla/no aplica.
 */
async function convertImage(relativePath, quality, resizeOptions = null) {
  // Validar entrada y omitir si ya es WebP o inválida
  if (!relativePath || typeof relativePath !== 'string' || relativePath.toLowerCase().endsWith('.webp')) {
    return null;
  }

  // Asegurar formato de ruta consistente (forward slashes) y limpiar
  const cleanRelativePath = relativePath.replace(/\\/g, '/').trim();
  if (!cleanRelativePath.startsWith('/')) {
      console.warn(`Ruta relativa inválida (no empieza con /): ${cleanRelativePath}`);
      return null;
  }


  const originalFullPath = path.join(basePath, cleanRelativePath);
  const parsedPath = path.parse(cleanRelativePath);

  // Crear nombre seguro por si acaso viene de URLs antiguas con caracteres raros
  const safeName = parsedPath.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const webpFilename = `${safeName}.webp`;
  // Reconstruir ruta relativa con /
  const webpRelativePath = path.join(parsedPath.dir, webpFilename).replace(/\\/g, '/');
  const webpFullPath = path.join(basePath, webpRelativePath);

  try {
    // 1. Verificar si el original existe
    await fs.access(originalFullPath);

    // 2. Verificar si la versión WebP ya existe (evita re-procesar)
    try {
      await fs.access(webpFullPath);
      // console.log(`WebP ya existe, omitiendo conversión: ${webpRelativePath}`);
      // Devolvemos la ruta WebP existente para actualizar la BBDD si es necesario
      return { newRelativePath: webpRelativePath, originalFullPath: originalFullPath };
    } catch (e) {
      // No existe, continuar con la conversión
    }

    // 3. Asegurar que el directorio de destino existe
    await fs.mkdir(path.dirname(webpFullPath), { recursive: true });

    // 4. Procesar con Sharp
    let sharpInstance = sharp(originalFullPath);
    if (resizeOptions) {
      sharpInstance = sharpInstance.resize(resizeOptions);
    }
    await sharpInstance.webp({ quality }).toFile(webpFullPath);

    console.log(`✅ Convertido: ${cleanRelativePath} -> ${webpRelativePath}`);
    return { newRelativePath: webpRelativePath, originalFullPath: originalFullPath };

  } catch (error) {
    if (error.code === 'ENOENT') {
      // No loguear cada "archivo no encontrado", podría haber muchos registros antiguos
      // console.warn(`Archivo original no encontrado, omitiendo: ${cleanRelativePath}`);
    } else {
      // Loguear otros errores (permisos, sharp, etc.)
      console.error(`❌ Error convirtiendo ${cleanRelativePath}: ${error.message}`);
    }
    return null; // Indicar fallo
  }
}

// Objeto de migración para Sequelize CLI (compatible con ESM)
export default {
  async up(queryInterface, Sequelize) { // queryInterface no se usa aquí, usamos modelos directamente
    const transaction = await sequelize.transaction();
    const originalFilesToDelete = new Set(); // Usar Set para evitar duplicados
    let totalChecked = 0;
    let totalConvertedOrUpdated = 0;

    console.log("--- Iniciando migración de imágenes a WebP ---");

    try {
      // --- 1. Procesar imágenes de Perfil (Users) ---
      console.log("\n👤 Procesando imágenes de Perfil...");
      const users = await User.findAll({
        where: {
          profile_image_url: { [Op.ne]: null, [Op.notLike]: '%.webp' }
        },
        transaction,
      });
      console.log(`Encontrados ${users.length} perfiles con imágenes no-WebP.`);
      for (const user of users) {
        totalChecked++;
        const currentUrl = user.profile_image_url;
        const result = await convertImage(currentUrl, IMAGE_QUALITY_PROFILE, RESIZE_OPTIONS_PROFILE);
        if (result && result.newRelativePath !== currentUrl) {
          await user.update({ profile_image_url: result.newRelativePath }, { transaction });
          originalFilesToDelete.add(result.originalFullPath);
          totalConvertedOrUpdated++;
        } else if (result && result.newRelativePath === currentUrl && !currentUrl.toLowerCase().endsWith('.webp')) {
           // Si WebP ya existía pero BBDD no estaba actualizada
           originalFilesToDelete.add(result.originalFullPath);
        }
      }
      console.log(`Perfiles procesados. ${totalConvertedOrUpdated} actualizados en BBDD.`);

      // --- 2. Procesar imágenes de Comidas (NutritionLog) ---
      console.log("\n🍔 Procesando imágenes de Registros de Comida...");
      let offset = 0;
      let logsFoundInBatch = 0;
      do {
          const logsBatch = await NutritionLog.findAll({
              where: { image_url: { [Op.ne]: null, [Op.notLike]: '%.webp' } },
              limit: BATCH_SIZE,
              offset,
              transaction,
          });
          logsFoundInBatch = logsBatch.length;
          if(logsFoundInBatch > 0) console.log(`Procesando lote de ${logsFoundInBatch} registros de comida (offset: ${offset})...`);

          for (const log of logsBatch) {
              totalChecked++;
              const currentUrl = log.image_url;
              const result = await convertImage(currentUrl, IMAGE_QUALITY_FOOD, RESIZE_OPTIONS_FOOD);
              if (result && result.newRelativePath !== currentUrl) {
                  await log.update({ image_url: result.newRelativePath }, { transaction });
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
      offset = 0; // Reset offset
      let mealsFoundInBatch = 0;
       do {
          const mealsBatch = await FavoriteMeal.findAll({
              where: { image_url: { [Op.ne]: null, [Op.notLike]: '%.webp' } },
              limit: BATCH_SIZE,
              offset,
              transaction,
          });
          mealsFoundInBatch = mealsBatch.length;
           if(mealsFoundInBatch > 0) console.log(`Procesando lote de ${mealsFoundInBatch} comidas favoritas (offset: ${offset})...`);

          for (const meal of mealsBatch) {
              totalChecked++;
              const currentUrl = meal.image_url;
              const result = await convertImage(currentUrl, IMAGE_QUALITY_FOOD, RESIZE_OPTIONS_FOOD);
              if (result && result.newRelativePath !== currentUrl) {
                  await meal.update({ image_url: result.newRelativePath }, { transaction });
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
          if (unlinkError.code !== 'ENOENT') { // No warn if already deleted
             console.warn(`   ⚠️ No se pudo borrar ${filePath}: ${unlinkError.message}`);
             failedDeleteCount++;
          }
        }
      }
      console.log(`   Archivos originales borrados: ${deletedCount}`);
      if (failedDeleteCount > 0) {
          console.warn(`   Archivos originales NO borrados (ver warnings): ${failedDeleteCount}`);
      }
      console.log("\n--- Migración de imágenes a WebP finalizada ---");


    } catch (error) {
      await transaction.rollback();
      console.error("\n❌ Error durante la migración de imágenes. Rollback realizado.", error);
      // Re-lanzar el error para que Sequelize CLI marque la migración como fallida
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.warn("⚠️ No se puede revertir automáticamente la conversión de imágenes a WebP.");
    console.warn("   Los registros de la base de datos seguirán apuntando a los archivos .webp.");
    console.warn("   Si es necesario revertir, restaura una copia de seguridad de la base de datos y los archivos.");
    // No lanzamos error para permitir otros rollbacks, pero dejamos claro que esta parte no se revierte.
  }
};