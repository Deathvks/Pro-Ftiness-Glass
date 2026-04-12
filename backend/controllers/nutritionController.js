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

const offSearchTimestamps = [];
const canMakeOffSearch = () => {
  const now = Date.now();
  while (offSearchTimestamps.length > 0 && now - offSearchTimestamps[0] > 60000) {
    offSearchTimestamps.shift();
  }
  return offSearchTimestamps.length < 8;
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
      const gamificationResult = await processFoodGamification(userId, log_date);

      if (gamificationResult.xpAdded > 0) {
        gamificationEvents.push({ type: 'xp', amount: gamificationResult.xpAdded, reason: 'Comida registrada' });
      } else if (gamificationResult.reason === 'daily_limit_reached') {
        gamificationEvents.push({ type: 'info', message: 'Límite diario alcanzado (5/5).' });
      }

      if (gamificationResult.limitReachedNow) {
        createNotification(userId, { type: 'warning', title: 'Límite XP', message: 'Límite diario comidas (5/5).', data: { type: 'xp_limit' } }).catch(() => { });
      }

      const calorieResult = await checkCalorieTargetReward(userId, log_date);
      if (calorieResult && calorieResult.success) {
        gamificationEvents.push({ type: 'xp', amount: CALORIE_TARGET_XP, reason: 'Objetivo de calorías cumplido' });
      }
    } catch (gError) { }

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
      const xpEarnedToday = await getWaterXpToday(userId, log_date);
      const currentProgress = Math.min(quantity_ml / waterTarget, 1);
      const totalXpDeserved = Math.floor(currentProgress * MAX_DAILY_WATER_XP);
      const xpToAward = Math.max(0, totalXpDeserved - xpEarnedToday);

      if (xpToAward > 0) {
        const success = await addWaterXpToday(userId, log_date, xpToAward);
        if (success) {
          const xpResult = await addXp(userId, xpToAward, `Hidratación: ${Math.round(currentProgress * 100)}% del objetivo`);
          if (xpResult.success) {
            gamificationEvents.push({ type: 'xp', amount: xpToAward, reason: `Hidratación: ${Math.round(currentProgress * 100)}%` });
          }
          if ((xpEarnedToday + xpToAward) >= MAX_DAILY_WATER_XP) {
            createNotification(userId, { type: 'warning', title: 'Límite XP', message: 'Límite hidratación alcanzado.', data: { type: 'xp_limit' } }).catch(() => { });
          }
        }
      } else {
        if (currentProgress > prevProgress && xpEarnedToday >= MAX_DAILY_WATER_XP) {
          gamificationEvents.push({ type: 'info', message: 'Límite diario hidratación alcanzado.' });
        }
      }

      const todayStr = new Date().toISOString().split('T')[0];
      checkStreak(userId, todayStr).catch(() => { });
    } catch (gError) { }

    res.json({ ...waterLog.toJSON(), gamification: gamificationEvents });
  } catch (error) { next(error); }
};

const searchByBarcode = async (req, res, next) => {
  try {
    const { barcode } = req.params;
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_es,generic_name,brands,image_url,image_front_url,serving_quantity,nutriments`;

    const response = await axios.get(apiUrl, {
      timeout: 8000,
      headers: { 'User-Agent': 'FitApp_Backend/1.0 (profitnessglass@gmail.com)' }
    });

    if (!response.data || response.data.status === 0 || !response.data.product) {
      return res.status(404).json({ product: { product_name: 'Producto no encontrado', nutriments: {}, image_url: null } });
    }

    const product = response.data.product;
    const nutriments = product.nutriments || {};

    const originalImageUrl = product.image_url || product.image_front_url || null;
    let localImageUrl = null;

    if (originalImageUrl) {
      localImageUrl = await downloadAndConvertToWebP(originalImageUrl, FOOD_IMAGES_DIR);
    }

    res.json({
      product: {
        product_name: product.product_name_es || product.product_name || product.generic_name || product.brands || 'Producto escaneado',
        nutriments: nutriments,
        image_url: localImageUrl,
        serving_quantity: product.serving_quantity || null
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
            fields: 'code,product_name,product_name_es,generic_name,nutriments,image_front_small_url'
          },
          timeout: 4000,
          headers: { 'User-Agent': 'FitApp_Backend/1.0 (profitnessglass@gmail.com)' }
        });

        if (offRes.data && offRes.data.products) {
          externalResults = offRes.data.products.map(p => ({
            id: `off-${p.code}`,
            name: p.product_name_es || p.product_name || p.generic_name || 'Sin nombre',
            calories: p.nutriments?.['energy-kcal_100g'] || 0,
            protein_g: p.nutriments?.proteins_100g || 0,
            carbs_g: p.nutriments?.carbohydrates_100g || 0,
            fats_g: p.nutriments?.fat_100g || 0,
            sugars_g: p.nutriments?.sugars_100g || 0,
            calories_per_100g: p.nutriments?.['energy-kcal_100g'] || 0,
            protein_per_100g: p.nutriments?.proteins_100g || 0,
            carbs_per_100g: p.nutriments?.carbohydrates_100g || 0,
            fat_per_100g: p.nutriments?.fat_100g || 0,
            sugars_per_100g: p.nutriments?.sugars_100g || 0,
            image_url: p.image_front_small_url || null,
            source: 'openfoodfacts',
            weight_g: 100
          }));

          searchCache.set(searchTerm, { timestamp: Date.now(), results: externalResults });
        }
      } catch (err) { }
    }

    res.json([...localResults, ...externalResults]);
  } catch (error) {
    next(error);
  }
};

export default { getNutritionLogsByDate, getRecentMeals, getNutritionSummary, addFoodLog, updateFoodLog, deleteFoodLog, upsertWaterLog, searchByBarcode, uploadFoodImage, searchFoods };