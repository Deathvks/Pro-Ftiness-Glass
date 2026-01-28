/* backend/routes/favoriteMeals.js */
import express from 'express';
import { body } from 'express-validator';
import favoriteMealController from '../controllers/favoriteMealController.js';
import authenticateToken from '../middleware/authenticateToken.js';

const router = express.Router();

// Todas las rutas de este fichero requieren que el usuario esté autenticado
router.use(authenticateToken);

// --- Reglas de Validación para Crear/Actualizar una Comida Favorita ---
const favoriteMealValidationRules = [
  body('name').trim().notEmpty().withMessage('El nombre de la comida es requerido.'),
  // CORRECCIÓN: Cambiado de isInt a isFloat para permitir calorías con decimales (ej: 0.4 kcal)
  body('calories').isFloat({ min: 0 }).withMessage('Las calorías deben ser un número positivo.'),
  body('protein_g').optional().isFloat({ min: 0 }).withMessage('Las proteínas deben ser un número positivo.'),
  body('carbs_g').optional().isFloat({ min: 0 }).withMessage('Los carbohidratos deben ser un número positivo.'),
  body('fats_g').optional().isFloat({ min: 0 }).withMessage('Las grasas deben ser un número positivo.'),
  // AÑADIDO: Validación para azúcar
  body('sugars_g').optional().isFloat({ min: 0 }).withMessage('El azúcar debe ser un número positivo.'),
  body('weight_g').optional().isFloat({ min: 0 }).withMessage('Los gramos deben ser un número positivo.'),
  
  // AÑADIDO: Validaciones para campos por 100g
  body('calories_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las calorías por 100g deben ser un número positivo.'),
  body('protein_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las proteínas por 100g deben ser un número positivo.'),
  body('carbs_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Los carbohidratos por 100g deben ser un número positivo.'),
  body('fat_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Las grasas por 100g deben ser un número positivo.'),
  body('sugars_per_100g').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El azúcar por 100g debe ser un número positivo.'),
];

// --- Definición de Rutas ---

// GET /api/favorite-meals -> Obtener todas las comidas favoritas del usuario
router.get('/', favoriteMealController.getFavoriteMeals);

// POST /api/favorite-meals -> Crear una nueva comida favorita
router.post('/', favoriteMealValidationRules, favoriteMealController.createFavoriteMeal);

// PUT /api/favorite-meals/:mealId -> Actualizar una comida favorita existente
router.put('/:mealId', favoriteMealValidationRules, favoriteMealController.updateFavoriteMeal);

// DELETE /api/favorite-meals/:mealId -> Eliminar una comida favorita
router.delete('/:mealId', favoriteMealController.deleteFavoriteMeal);

export default router;