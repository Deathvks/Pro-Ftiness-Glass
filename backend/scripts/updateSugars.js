/* backend/scripts/updateSugars.js */
import 'dotenv/config'; // Asegura que las variables de entorno se carguen (.env)
import db from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';

const { NutritionLog, FavoriteMeal } = db;

// Configuración
const SLEEP_MS = 1000; // Esperar 1 segundo entre peticiones para respetar API

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Intenta extraer un código de barras de una URL de imagen de OpenFoodFacts
 */
const extractBarcodeFromUrl = (url) => {
  if (!url || !url.includes('openfoodfacts.org')) return null;
  try {
    const regex = /\/products\/(\d+)\/(\d+)\/(\d+)\/(\d+)\//;
    const match = url.match(regex);
    if (match) {
      return `${match[1]}${match[2]}${match[3]}${match[4]}`;
    }
  } catch (e) {
    return null;
  }
  return null;
};

/**
 * Busca info en OpenFoodFacts (por código de barras o por nombre)
 */
const fetchOpenFoodFactsData = async (term, isBarcode = false) => {
  try {
    let url;
    if (isBarcode) {
      url = `https://world.openfoodfacts.org/api/v2/product/${term}.json?fields=nutriments,product_name,product_name_es`;
    } else {
      url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(term)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,product_name_es,nutriments`;
    }

    const response = await axios.get(url, {
      headers: { 'User-Agent': 'ProFitnessGlass-Updater/1.0' }
    });

    if (isBarcode) {
      if (response.data.status === 1 && response.data.product) {
        return response.data.product;
      }
    } else {
      if (response.data.products && response.data.products.length > 0) {
        const exactMatch = response.data.products.find(p => {
          const name = p.product_name_es || p.product_name;
          return name && name.toLowerCase() === term.toLowerCase();
        });
        return exactMatch || response.data.products[0];
      }
    }
  } catch (error) {
    console.warn(`Error consultando OFF para "${term}":`, error.message);
  }
  return null;
};

const updateBatch = async (model, modelName) => {
  console.log(`\n--- Analizando ${modelName} ---`);
  
  // --- CORRECCIÓN: Selección dinámica del campo de nombre ---
  const textField = modelName === 'FavoriteMeal' ? 'name' : 'description';

  // Buscar registros sin azúcar definido (null)
  // Solo consultamos para saber cuántos únicos hay (informativo)
  try {
    const pendingItems = await model.findAll({
      where: {
        sugars_g: { [Op.is]: null }
      },
      attributes: [textField, 'image_url'], 
      group: [textField, 'image_url']
    });
    console.log(`Encontrados ${pendingItems.length} grupos de items únicos sin azúcar en ${modelName}.`);
  } catch (error) {
    console.warn(`Aviso: No se pudo agrupar items pendientes (posiblemente tabla vacía o error de SQL menor). Continuando con individuales...`);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  // Recuperamos TODOS los registros individuales que faltan
  const itemsToUpdate = await model.findAll({
    where: { sugars_g: { [Op.is]: null } }
  });

  console.log(`Total de registros individuales a procesar: ${itemsToUpdate.length}`);

  const cache = {};

  for (let i = 0; i < itemsToUpdate.length; i++) {
    const item = itemsToUpdate[i];
    const name = item[textField]; // Usamos el campo dinámico (name o description)
    const imageUrl = item.image_url;

    if (!name) {
      skippedCount++;
      continue;
    }

    // Comprobar cache
    let productData = cache[name];

    if (!productData) {
        // 1. Intentar por Barcode (desde URL)
        const barcode = extractBarcodeFromUrl(imageUrl);
        if (barcode) {
            console.log(`[${i + 1}/${itemsToUpdate.length}] Buscando por Barcode detectado (${barcode}): ${name}`);
            productData = await fetchOpenFoodFactsData(barcode, true);
        }

        // 2. Si no hay barcode, buscar por nombre
        if (!productData) {
            console.log(`[${i + 1}/${itemsToUpdate.length}] Buscando por Nombre: ${name}`);
            productData = await fetchOpenFoodFactsData(name, false);
            await sleep(500); 
        }

        cache[name] = productData || 'NOT_FOUND';
    } else {
        // Cache hit silencioso
    }

    if (productData && productData !== 'NOT_FOUND' && productData.nutriments) {
      const sugars100g = productData.nutriments.sugars_100g || 0;
      
      const weight = parseFloat(item.weight_g) || 100;
      const totalSugars = (sugars100g * weight) / 100;

      // Actualizar DB
      item.sugars_per_100g = sugars100g;
      item.sugars_g = totalSugars;
      
      if (!item.calories_per_100g && productData.nutriments['energy-kcal_100g']) item.calories_per_100g = productData.nutriments['energy-kcal_100g'];
      if (!item.protein_per_100g && productData.nutriments.proteins_100g) item.protein_per_100g = productData.nutriments.proteins_100g;

      await item.save();
      updatedCount++;
      console.log(`   ✅ Actualizado: ${name} (Azúcar: ${totalSugars.toFixed(1)}g)`);
    } else {
      skippedCount++;
      console.log(`   ⚠️ No encontrado o sin datos: ${name}`);
    }
  }

  console.log(`\nResumen ${modelName}: Actualizados ${updatedCount}, Saltados ${skippedCount}`);
};

const run = async () => {
  try {
    console.log('Iniciando script de actualización de azúcares...');
    
    // 1. Actualizar Logs de Nutrición
    await updateBatch(NutritionLog, 'NutritionLog');
    
    // 2. Actualizar Comidas Favoritas
    await updateBatch(FavoriteMeal, 'FavoriteMeal');

    console.log('\n¡Proceso completado!');
    process.exit(0);
  } catch (error) {
    console.error('Error fatal:', error);
    process.exit(1);
  }
};

run();