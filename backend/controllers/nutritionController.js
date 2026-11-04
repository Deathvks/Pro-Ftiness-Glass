/* backend/controllers/nutritionController.js */
import db from '../models/index.js';
import { Op } from 'sequelize';
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { deleteFile } from '../services/imageService.js';
import {
  addXp,
  checkStreak,
  processFoodGamification,
  CALORIE_TARGET_XP,
  getWaterXpToday,
  addWaterXpToday
} from '../services/gamificationService.js';
import { createNotification } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FOOD_IMAGES_DIR = path.join(__dirname, '..', 'public', 'images', 'food');

const { NutritionLog, WaterLog, FavoriteMeal, LocalFood, User, Notification, BodyWeightLog, sequelize } = db;

const MAX_DAILY_WATER_XP = 50;
const searchCache = new Map();
const CACHE_TTL = 1000 * 60 * 60 * 24;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const OFF_USER_AGENT = 'ProFitnessGlass - Android - Version 7.12.0 - https://profitnessglass.com';

const offSearchTimestamps = [];
const canMakeOffSearch = () => {
  const now = Date.now();
  while (offSearchTimestamps.length > 0 && now - offSearchTimestamps[0] > 60000) {
    offSearchTimestamps.shift();
  }
  return offSearchTimestamps.length < 25;
};

const ensureUploadDirExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

const downloadAndConvertToWebP = async (imageUrl, outputDir) => {
  if (!imageUrl) return null;
  try {
    await ensureUploadDirExists(outputDir);
    const response = await axios({ url: imageUrl, responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const webpFilename = `barcode-${uniqueSuffix}.webp`;
    const outputPath = path.join(outputDir, webpFilename);

    await sharp(imageBuffer)
      .rotate()
      .resize(600, 600, { fit: sharp.fit.inside, withoutEnlargement: true })
      .webp({ quality: 70 })
      .toFile(outputPath);

    return `/images/food/${webpFilename}`;
  } catch (error) {
    return null;
  }
};

const fetchProductFromOFF = async (barcode) => {
  try {
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_es,generic_name,brands,image_url,image_front_url,serving_quantity,nutriments`;
    const response = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { 'User-Agent': OFF_USER_AGENT }
    });
    if (!response.data || response.data.status === 0 || !response.data.product) {
      return null;
    }
    return response.data.product;
  } catch (err) {
    return null;
  }
};

const persistProductToLocalFood = async (product, localImageUrl = null) => {
  if (!product || !LocalFood) return null;
  try {
    const barcode = product.code ? String(product.code).trim() : null;
    let name = (product.product_name_es || product.product_name || product.generic_name || (product.brands ? `${product.brands} Producto` : null) || (barcode ? `Producto ${barcode}` : 'Alimento')).trim();
    const brand = product.brands ? product.brands.split(',')[0].trim() : null;

    if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
      name = `${name} (${brand})`;
    }

    const servingQuantity = parseFloat(product.serving_quantity) || null;
    const nutriments = product.nutriments || {};
    const calories = Math.round(parseFloat(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0));
    const protein_g = Math.round(parseFloat(nutriments.proteins_100g ?? nutriments.proteins ?? 0) * 10) / 10;
    const carbs_g = Math.round(parseFloat(nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0) * 10) / 10;
    const fats_g = Math.round(parseFloat(nutriments.fat_100g ?? nutriments.fat ?? 0) * 10) / 10;
    const sugars_g = Math.round(parseFloat(nutriments.sugars_100g ?? nutriments.sugars ?? 0) * 10) / 10;

    let existing = null;
    if (barcode) {
      existing = await LocalFood.findOne({ where: { barcode } });
    }
    if (!existing) {
      existing = await LocalFood.findOne({ where: { name } });
    }

    if (existing) {
      await existing.update({
        barcode: barcode || existing.barcode,
        brand: brand || existing.brand,
        serving_quantity: servingQuantity || existing.serving_quantity,
        calories: calories || existing.calories,
        protein_g: protein_g || existing.protein_g,
        carbs_g: carbs_g || existing.carbs_g,
        fats_g: fats_g || existing.fats_g,
        sugars_g: sugars_g || existing.sugars_g,
        image_url: localImageUrl || existing.image_url,
        last_synced_at: new Date()
      });
      return existing;
    }

    const created = await LocalFood.create({
      name,
      barcode,
      brand,
      serving_quantity: servingQuantity,
      calories,
      protein_g,
      carbs_g,
      fats_g,
      sugars_g,
      image_url: localImageUrl,
      last_synced_at: new Date()
    });
    return created;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError' && product.code) {
      try {
        const fallbackName = `${(product.product_name_es || product.product_name || 'Producto').trim()} [${product.code}]`;
        const fallbackCreated = await LocalFood.create({
          name: fallbackName,
          barcode: String(product.code).trim(),
          brand: product.brands ? product.brands.split(',')[0].trim() : null,
          serving_quantity: parseFloat(product.serving_quantity) || null,
          calories: Math.round(parseFloat(product.nutriments?.['energy-kcal_100g'] ?? 0)),
          protein_g: parseFloat(product.nutriments?.proteins_100g ?? 0),
          carbs_g: parseFloat(product.nutriments?.carbohydrates_100g ?? 0),
          fats_g: parseFloat(product.nutriments?.fat_100g ?? 0),
          sugars_g: parseFloat(product.nutriments?.sugars_100g ?? 0),
          image_url: localImageUrl,
          last_synced_at: new Date()
        });
        return fallbackCreated;
      } catch (innerErr) {
        console.error('Error in fallback persistProductToLocalFood:', innerErr.message);
      }
    }
    console.error('Error persisting product to LocalFood:', err.message);
    return null;
  }
};

const refreshFoodFromOFF = async (barcode) => {
  const product = await fetchProductFromOFF(barcode);
  if (!product) return null;

  const originalImageUrl = product.image_url || product.image_front_url || null;
  let localImageUrl = null;
  if (originalImageUrl) {
    localImageUrl = await downloadAndConvertToWebP(originalImageUrl, FOOD_IMAGES_DIR);
  }

  return await persistProductToLocalFood(product, localImageUrl);
};

const isImageInUse = async (imageUrl, excludeLogId = null) => {
  if (!imageUrl) return false;
  const whereClause = { image_url: imageUrl };
  if (excludeLogId) whereClause.id = { [Op.ne]: excludeLogId };

  const logsCount = await NutritionLog.count({ where: whereClause });
  if (logsCount > 0) return true;

  const favsCount = await FavoriteMeal.count({ where: { image_url: imageUrl } });
  if (favsCount > 0) return true;

  return false;
};

const checkCalorieTargetReward = async (userId, logDate) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayNotifications = await Notification.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.between]: [startOfDay, endOfDay] }
      },
      attributes: ['data', 'message'],
      raw: true
    });

    const alreadyAwarded = todayNotifications.some(n => {
      let data = n.data;
      if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { } }
      if (data && data.reason === 'Objetivo de calorías cumplido') return true;
      return n.message && n.message.includes('Objetivo de calorías cumplido');
    });

    if (alreadyAwarded) return null;

    const user = await User.findByPk(userId, { raw: true });
    if (!user) return null;

    const lastWeightLog = await BodyWeightLog.findOne({
      where: { user_id: userId },
      order: [['log_date', 'DESC']],
      attributes: ['weight_kg'],
      raw: true
    });

    const weight = lastWeightLog ? parseFloat(lastWeightLog.weight_kg) : 70;
    const { gender, age, height, activity_level, goal } = user;
    const userHeight = height || 170;
    const userAge = age || 30;
    const userActivity = activity_level || 1.2;
    const userGender = gender || 'male';

    let bmr = userGender === 'male'
      ? 10 * weight + 6.25 * userHeight - 5 * userAge + 5
      : 10 * weight + 6.25 * userHeight - 5 * userAge - 161;
    let target = bmr * userActivity;

    if (goal === 'lose') target -= 500;
    else if (goal === 'gain') target += 500;

    target = Math.round(target);

    const totalCalories = await NutritionLog.sum('calories', { where: { user_id: userId, log_date: logDate } }) || 0;

    if (totalCalories >= target) {
      return await addXp(userId, CALORIE_TARGET_XP, 'Objetivo de calorías cumplido');
    }
    return null;
  } catch (error) {
    return null;
  }
};

const getNutritionLogsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    const { userId } = req.user;
    if (!date) return res.status(400).json({ error: 'La fecha es requerida.' });

    const nutritionLogs = await NutritionLog.findAll({ where: { user_id: userId, log_date: date }, order: [['meal_type', 'ASC'], ['id', 'ASC']] });
    const waterLog = await WaterLog.findOne({ where: { user_id: userId, log_date: date } });

    res.json({ nutrition: nutritionLogs, water: waterLog });
  } catch (error) {
    next(error);
  }
};

const getRecentMeals = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const recentLogs = await NutritionLog.findAll({
      where: { user_id: userId },
      limit: 50,
      order: [['id', 'DESC']],
      raw: true
    });

    const uniqueMeals = [];
    const descriptionsSeen = new Set();

    for (const log of recentLogs) {
      const lowerCaseDescription = log.description.toLowerCase();
      if (!descriptionsSeen.has(lowerCaseDescription)) {
        descriptionsSeen.add(lowerCaseDescription);
        uniqueMeals.push(log);
      }
    }
    res.json(uniqueMeals.slice(0, 20));
  } catch (error) {
    next(error);
  }
};

const getNutritionSummary = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'El mes y el año son requeridos.' });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const nutritionSummary = await NutritionLog.findAll({
      where: { user_id: userId, log_date: { [Op.between]: [startDate, endDate] } },
      attributes: [
        ['log_date', 'date'],
        [sequelize.fn('sum', sequelize.col('calories')), 'total_calories'],
        [sequelize.fn('sum', sequelize.col('protein_g')), 'total_protein'],
        [sequelize.fn('sum', sequelize.col('carbs_g')), 'total_carbs'],
        [sequelize.fn('sum', sequelize.col('fats_g')), 'total_fats'],
        [sequelize.fn('sum', sequelize.col('sugars_g')), 'total_sugars']
      ],
      group: ['log_date'],
      order: [['log_date', 'ASC']],
      raw: true
    });

    const waterSummary = await WaterLog.findAll({
      where: { user_id: userId, log_date: { [Op.between]: [startDate, endDate] } },
      attributes: ['log_date', 'quantity_ml'],
      order: [['log_date', 'ASC']],
      raw: true
    });

    res.json({ nutritionSummary, waterSummary });
  } catch (error) {
    next(error);
  }
};

const addFoodLog = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { userId } = req.user;
    const { log_date, meal_type, description, calories, protein_g, carbs_g, fats_g, sugars_g, weight_g, image_url, micronutrients, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugars_per_100g, save_as_favorite } = req.body;

    let sanitizedImageUrl = image_url;
    if (sanitizedImageUrl === 'null' || sanitizedImageUrl === 'undefined' || sanitizedImageUrl === '') sanitizedImageUrl = null;
    const finalImageUrl = (req.file && req.file.processedPath) ? req.file.processedPath : sanitizedImageUrl;

    const foodData = {
      user_id: userId, log_date, meal_type, description,
      calories: calories || 0,
      protein_g: protein_g || null,
      carbs_g: carbs_g || null,
      fats_g: fats_g || null,
      sugars_g: sugars_g || null,
      weight_g: weight_g || null,
      image_url: finalImageUrl,
      micronutrients: micronutrients || null,
      calories_per_100g: calories_per_100g || null,
      protein_per_100g: protein_per_100g || null,
      carbs_per_100g: carbs_per_100g || null,
      fat_per_100g: fat_per_100g || null,
      sugars_per_100g: sugars_per_100g || null
    };

    const newLog = await NutritionLog.create(foodData, { transaction: t });

    if (save_as_favorite) {
      const favData = { ...foodData, name: description, user_id: userId };
      delete favData.log_date;
      delete favData.meal_type;

      const existingFav = await FavoriteMeal.findOne({ where: { user_id: userId, name: description }, transaction: t });
      if (existingFav) {
        await existingFav.update(favData, { transaction: t });
      } else {
        await FavoriteMeal.create(favData, { transaction: t });
      }
    }

    await t.commit();

    const gamificationEvents = [];
    try {
      const { trackChallenge } = await import('../services/challengeService.js');
      
      // Reto de registrar 5 comidas
      const mealRes = await trackChallenge(userId, 'daily_5_meals', 1);
      if (mealRes.completedNow && mealRes.xpResult) {
        gamificationEvents.push({ type: 'xp', amount: mealRes.xpResult.xpAdded, reason: 'Reto: 5 comidas diarias' });
      }

      // Comprobar si hemos guardado en favoritos
      if (save_as_favorite) {
        const favRes = await trackChallenge(userId, 'nutri_save_favorite', 1);
        if (favRes.completedNow && favRes.xpResult) {
          gamificationEvents.push({ type: 'xp', amount: favRes.xpResult.xpAdded, reason: 'Reto: Comida en Favoritos' });
        }
      }

      // Check Calories target
      const user = await User.findByPk(userId);
      const totalCalories = await NutritionLog.sum('calories', { where: { user_id: userId, log_date: log_date } }) || 0;
      if (user && user.target_calories > 0 && totalCalories >= user.target_calories) {
        const calRes = await trackChallenge(userId, 'daily_calories', 1);
        if (calRes.completedNow && calRes.xpResult) {
          gamificationEvents.push({ type: 'xp', amount: calRes.xpResult.xpAdded, reason: 'Reto: Calorías diarias' });
        }
      }

      // Check Protein target
      const totalProtein = await NutritionLog.sum('protein_g', { where: { user_id: userId, log_date: log_date } }) || 0;
      if (user && user.target_protein > 0 && totalProtein >= user.target_protein) {
        const protRes = await trackChallenge(userId, 'daily_protein', 1);
        if (protRes.completedNow && protRes.xpResult) {
          gamificationEvents.push({ type: 'xp', amount: protRes.xpResult.xpAdded, reason: 'Reto: Proteína diaria' });
        }
      }

    } catch (gError) { 
      console.error('Error gamification nutrition:', gError);
    }

    res.status(201).json({ ...newLog.toJSON(), gamification: gamificationEvents });

  } catch (error) {
    if (!t.finished) await t.rollback();
    if (req.file && req.file.processedPath) deleteFile(req.file.processedPath);
    next(error);
  }
};

const updateFoodLog = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { logId } = req.params;
    const { userId } = req.user;

    const log = await NutritionLog.findOne({ where: { id: logId, user_id: userId }, transaction: t });
    if (!log) {
      await t.rollback();
      if (req.file && req.file.processedPath) deleteFile(req.file.processedPath);
      return res.status(404).json({ error: 'Registro no encontrado.' });
    }

    const { description, calories, protein_g, carbs_g, fats_g, sugars_g, weight_g, image_url, meal_type, log_date, micronutrients, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, sugars_per_100g, save_as_favorite } = req.body;

    const oldImageUrl = log.image_url;
    let newImageUrl;
    if (req.file && req.file.processedPath) newImageUrl = req.file.processedPath;
    else if (image_url !== undefined) newImageUrl = (image_url === 'null' || image_url === '' || image_url === undefined) ? null : image_url;
    else newImageUrl = oldImageUrl;

    const foodData = {
      description: description ?? log.description,
      calories: calories ?? log.calories,
      protein_g: protein_g ?? log.protein_g,
      carbs_g: carbs_g ?? log.carbs_g,
      fats_g: fats_g ?? log.fats_g,
      sugars_g: sugars_g ?? log.sugars_g,
      weight_g: weight_g ?? log.weight_g,
      image_url: newImageUrl,
      meal_type: meal_type ?? log.meal_type,
      log_date: log_date ?? log.log_date,
      micronutrients: micronutrients ?? log.micronutrients,
      calories_per_100g: calories_per_100g ?? log.calories_per_100g,
      protein_per_100g: protein_per_100g ?? log.protein_per_100g,
      carbs_per_100g: carbs_per_100g ?? log.carbs_per_100g,
      fat_per_100g: fat_per_100g ?? log.fat_per_100g,
      sugars_per_100g: sugars_per_100g ?? log.sugars_per_100g
    };

    await log.update(foodData, { transaction: t });

    const favData = { ...foodData, name: foodData.description, user_id: userId };
    delete favData.log_date;
    delete favData.meal_type;

    if (save_as_favorite) {
      const existingFav = await FavoriteMeal.findOne({ where: { user_id: userId, name: foodData.description }, transaction: t });
      if (existingFav) await existingFav.update(favData, { transaction: t });
      else await FavoriteMeal.create(favData, { transaction: t });
    }
    // EL ELSE ELIMINADO AQUÍ. Ya no sobreescribirá el favorito a menos que save_as_favorite sea true.

    await t.commit();

    if (oldImageUrl && oldImageUrl !== newImageUrl) {
      const inUse = await isImageInUse(oldImageUrl, logId);
      if (!inUse) deleteFile(oldImageUrl);
    }

    const gamificationEvents = [];
    try {
      const calorieResult = await checkCalorieTargetReward(userId, foodData.log_date);
      if (calorieResult && calorieResult.success) gamificationEvents.push({ type: 'xp', amount: CALORIE_TARGET_XP, reason: 'Objetivo de calorías cumplido' });
    } catch (gError) { }

    res.json({ ...log.toJSON(), gamification: gamificationEvents });

  } catch (error) {
    if (!t.finished) await t.rollback();
    if (req.file && req.file.processedPath) deleteFile(req.file.processedPath);
    next(error);
  }
};

const deleteFoodLog = async (req, res, next) => {
  try {
    const { logId } = req.params;
    const { userId } = req.user;
    const log = await NutritionLog.findOne({ where: { id: logId, user_id: userId } });
    if (!log) return res.status(404).json({ error: 'Registro no encontrado.' });

    const imageUrl = log.image_url;
    await log.destroy();

    if (imageUrl) {
      const inUse = await isImageInUse(imageUrl);
      if (!inUse) deleteFile(imageUrl);
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const upsertWaterLog = async (req, res, next) => {
  try {
    const { userId } = req.user;
    const { log_date, quantity_ml } = req.body;
    if (!log_date || quantity_ml === undefined) return res.status(400).json({ error: 'Fecha y cantidad son requeridas.' });

    const user = await User.findByPk(userId);
    const lastWeightLog = await BodyWeightLog.findOne({
      where: { user_id: userId },
      order: [['log_date', 'DESC']],
      attributes: ['weight_kg'],
      raw: true
    });

    const weight = lastWeightLog ? parseFloat(lastWeightLog.weight_kg) : 70;
    const waterTarget = weight > 0 ? weight * 35 : 2500;

    const [waterLog, created] = await WaterLog.findOrCreate({ where: { user_id: userId, log_date }, defaults: { quantity_ml: 0 } });
    const prevQuantity = created ? 0 : waterLog.quantity_ml;
    const prevProgress = Math.min(prevQuantity / waterTarget, 1);

    waterLog.quantity_ml = quantity_ml;
    await waterLog.save();

    const gamificationEvents = [];
    try {
      const currentProgress = quantity_ml / waterTarget;
      if (currentProgress >= 1) {
        const { trackChallenge } = await import('../services/challengeService.js');
        const waterRes = await trackChallenge(userId, 'daily_water', 1);
        if (waterRes.completedNow && waterRes.xpResult) {
          gamificationEvents.push({ type: 'xp', amount: waterRes.xpResult.xpAdded, reason: 'Reto: Objetivo de agua' });
        }
      }
    } catch (gError) {
      console.error('Error gamification water:', gError);
    }

    res.json({ ...waterLog.toJSON(), gamification: gamificationEvents });
  } catch (error) { next(error); }
};

const searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    if (!barcode) return res.status(400).json({ error: 'Código de barras requerido.' });

    // 1. Local Cache Lookup (MySQL local_foods)
    if (LocalFood) {
      try {
        const cached = await LocalFood.findOne({ where: { barcode: String(barcode).trim() } });
        if (cached) {
          // Stale check (30 days) -> Trigger background sync without blocking user
          const isStale = !cached.last_synced_at || (Date.now() - new Date(cached.last_synced_at).getTime() > THIRTY_DAYS_MS);
          if (isStale) {
            refreshFoodFromOFF(barcode).catch(err => {
              console.error(`[SmartSync] Background refresh failed for ${barcode}:`, err.message);
            });
          }

          // Gamification
          try {
            const { trackChallenge } = await import('../services/challengeService.js');
            const userId = req.user?.id || req.user?.userId;
            if (userId) await trackChallenge(userId, 'nutri_scan_3_barcodes', 1);
          } catch (err) {}

          return res.json({
            product: {
              product_name: cached.name,
              brand: cached.brand || null,
              nutriments: {
                'energy-kcal_100g': cached.calories || 0,
                'energy-kcal': cached.calories || 0,
                'proteins_100g': cached.protein_g || 0,
                'proteins': cached.protein_g || 0,
                'carbohydrates_100g': cached.carbs_g || 0,
                'carbohydrates': cached.carbs_g || 0,
                'fat_100g': cached.fats_g || 0,
                'fat': cached.fats_g || 0,
                'fats_100g': cached.fats_g || 0,
                'sugars_100g': cached.sugars_g || 0,
                'sugars': cached.sugars_g || 0
              },
              image_url: cached.image_url || null,
              serving_quantity: cached.serving_quantity || null,
              barcode: cached.barcode,
              source: 'local_cache',
              last_synced_at: cached.last_synced_at
            }
          });
        }
      } catch (cacheErr) {
        console.error('[SmartSync] Error querying LocalFood cache:', cacheErr.message);
      }
    }

    // 2. Fetch from OpenFoodFacts if not in local cache
    const product = await fetchProductFromOFF(barcode);
    if (!product) {
      return res.status(404).json({ product: { product_name: 'Producto no encontrado', nutriments: {}, image_url: null } });
    }

    const originalImageUrl = product.image_url || product.image_front_url || null;
    let localImageUrl = null;
    if (originalImageUrl) {
      localImageUrl = await downloadAndConvertToWebP(originalImageUrl, FOOD_IMAGES_DIR);
    }

    // Persist to local_foods for instant future scans
    const saved = await persistProductToLocalFood(product, localImageUrl);

    // Gamification
    try {
      const { trackChallenge } = await import('../services/challengeService.js');
      const userId = req.user?.id || req.user?.userId;
      if (userId) await trackChallenge(userId, 'nutri_scan_3_barcodes', 1);
    } catch (err) {}

    const nutriments = product.nutriments || {};
    res.json({
      product: {
        product_name: saved?.name || product.product_name_es || product.product_name || product.generic_name || product.brands || 'Producto escaneado',
        brand: saved?.brand || (product.brands ? product.brands.split(',')[0].trim() : null),
        nutriments: nutriments,
        image_url: localImageUrl || originalImageUrl,
        serving_quantity: product.serving_quantity || null,
        barcode: barcode,
        source: 'openfoodfacts',
        last_synced_at: new Date()
      }
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED' || (error.message && error.message.includes('timeout'))) {
      return res.status(408).json({ error: 'El servidor tardó demasiado en responder.' });
    }
    if (error.response && error.response.status === 404) return res.status(404).json({ product: { product_name: 'No encontrado' } });
    next(error);
  }
};

const refreshFoodByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    if (!barcode) return res.status(400).json({ error: 'Código de barras requerido.' });

    const updated = await refreshFoodFromOFF(barcode);
    if (!updated) {
      return res.status(404).json({ error: 'No se pudo actualizar el producto desde OpenFoodFacts.' });
    }

    res.json({
      success: true,
      product: {
        product_name: updated.name,
        brand: updated.brand || null,
        nutriments: {
          'energy-kcal_100g': updated.calories,
          'energy-kcal': updated.calories,
          'proteins_100g': updated.protein_g,
          'proteins': updated.protein_g,
          'carbohydrates_100g': updated.carbs_g,
          'carbohydrates': updated.carbs_g,
          'fat_100g': updated.fats_g,
          'fat': updated.fats_g,
          'fats_100g': updated.fats_g,
          'sugars_100g': updated.sugars_g,
          'sugars': updated.sugars_g
        },
        image_url: updated.image_url,
        serving_quantity: updated.serving_quantity,
        barcode: updated.barcode,
        source: 'openfoodfacts_refreshed',
        last_synced_at: updated.last_synced_at
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadFoodImage = async (req, res, next) => {
  if (req.imageUrl) res.status(201).json({ imageUrl: req.imageUrl });
  else res.status(400).json({ error: "No se procesó ninguna imagen." });
};

const searchFoods = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const searchTerm = q.toLowerCase().trim();
    const searchPattern = `%${searchTerm}%`;

    const [favoriteResults, localFoods] = await Promise.all([
      FavoriteMeal.findAll({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          'LIKE',
          searchPattern
        ),
        limit: 10,
        raw: true
      }),
      LocalFood ? LocalFood.findAll({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('name')),
          'LIKE',
          searchPattern
        ),
        limit: 50,
        raw: true
      }) : Promise.resolve([])
    ]);

    const formattedFavorites = favoriteResults.map(f => ({
      ...f, source: 'local', calories_per_100g: (f.weight_g > 0) ? (f.calories / f.weight_g * 100) : 0
    }));

    const formattedLocals = localFoods.map(food => ({
      id: `local-${food.id}`,
      name: food.name,
      brand: food.brand || null,
      barcode: food.barcode || null,
      calories: food.calories,
      protein_g: food.protein_g,
      carbs_g: food.carbs_g,
      fats_g: food.fats_g,
      sugars_g: food.sugars_g,
      calories_per_100g: food.calories,
      protein_per_100g: food.protein_g,
      carbs_per_100g: food.carbs_g,
      fat_per_100g: food.fats_g,
      sugars_per_100g: food.sugars_g,
      image_url: food.image_url || null,
      serving_quantity: food.serving_quantity || null,
      source: 'local_db',
      weight_g: 100
    }));

    const localResults = [...formattedFavorites, ...formattedLocals];

    if (searchCache.has(searchTerm)) {
      const cachedData = searchCache.get(searchTerm);
      if (Date.now() - cachedData.timestamp < CACHE_TTL) {
        return res.json([...localResults, ...cachedData.results]);
      }
    }

    let externalResults = [];

    if (canMakeOffSearch()) {
      try {
        offSearchTimestamps.push(Date.now());
        const offRes = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
          params: {
            search_terms: q,
            search_simple: 1,
            action: 'process',
            json: 1,
            page_size: 20,
            fields: 'code,product_name,product_name_es,generic_name,brands,nutriments,image_front_small_url,serving_quantity'
          },
          timeout: 6000,
          headers: { 'User-Agent': OFF_USER_AGENT }
        });

        if (offRes.data && offRes.data.products) {
          // Deduplicate external hits against local results
          const seenBarcodes = new Set(localResults.map(r => r.barcode).filter(Boolean));
          const seenNames = new Set(localResults.map(r => r.name.toLowerCase().trim()));

          externalResults = offRes.data.products
            .filter(p => {
              if (p.code && seenBarcodes.has(String(p.code).trim())) return false;
              const pName = (p.product_name_es || p.product_name || p.generic_name || '').toLowerCase().trim();
              if (pName && seenNames.has(pName)) return false;
              return true;
            })
            .map(p => ({
              id: `off-${p.code}`,
              barcode: p.code || null,
              brand: p.brands ? p.brands.split(',')[0].trim() : null,
              name: p.product_name_es || p.product_name || p.generic_name || (p.brands ? `${p.brands} Alimento` : 'Sin nombre'),
              calories: p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? 0,
              protein_g: p.nutriments?.proteins_100g ?? p.nutriments?.proteins ?? 0,
              carbs_g: p.nutriments?.carbohydrates_100g ?? p.nutriments?.carbohydrates ?? 0,
              fats_g: p.nutriments?.fat_100g ?? p.nutriments?.fat ?? 0,
              sugars_g: p.nutriments?.sugars_100g ?? p.nutriments?.sugars ?? 0,
              calories_per_100g: p.nutriments?.['energy-kcal_100g'] ?? p.nutriments?.['energy-kcal'] ?? 0,
              protein_per_100g: p.nutriments?.proteins_100g ?? p.nutriments?.proteins ?? 0,
              carbs_per_100g: p.nutriments?.carbohydrates_100g ?? p.nutriments?.carbohydrates ?? 0,
              fat_per_100g: p.nutriments?.fat_100g ?? p.nutriments?.fat ?? 0,
              sugars_per_100g: p.nutriments?.sugars_100g ?? p.nutriments?.sugars ?? 0,
              image_url: p.image_front_small_url || null,
              serving_quantity: p.serving_quantity || null,
              source: 'openfoodfacts',
              weight_g: 100
            }));

          searchCache.set(searchTerm, { timestamp: Date.now(), results: externalResults });

          // Background auto-cache top 5 items into LocalFood for offline & instant future queries
          const topHits = offRes.data.products.slice(0, 5);
          Promise.all(topHits.map(p => persistProductToLocalFood(p))).catch(err => {
            console.error('[SmartSync] Error auto-caching search results:', err.message);
          });
        }
      } catch (err) {
        console.error('[SmartSync] Error fetching OFF search results:', err.message);
      }
    }
    // Gamification
    try {
      const { trackChallenge } = await import('../services/challengeService.js');
      const userId = req.user?.userId || req.user?.id;
      if (userId) await trackChallenge(userId, 'nutri_search_meal', 1);
    } catch (err) {}

    res.json([...localResults, ...externalResults]);
  } catch (error) {
    next(error);
  }
};

export default {
  getNutritionLogsByDate,
  getRecentMeals,
  getNutritionSummary,
  addFoodLog,
  updateFoodLog,
  deleteFoodLog,
  upsertWaterLog,
  searchByBarcode,
  refreshFoodByBarcode,
  uploadFoodImage,
  searchFoods
};
