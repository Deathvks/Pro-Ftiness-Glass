import * as React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Spinner from '../../Spinner';

const FoodEntryForm = ({ food, onSave, onClose, onBack, mealType, date, isEditing, isLoading }) => {
  const initialGrams = isEditing ? food.weight_g : 100;

  const formik = useFormik({
    initialValues: {
      grams: initialGrams,
    },
    validationSchema: Yup.object({
      grams: Yup.number().positive('Must be positive').required('Required'),
    }),
    onSubmit: (values) => {
      const multiplier = values.grams / (food.serving_weight_grams || 100);
      const calculatedData = {
        description: food.food_name,
        calories: Math.round(food.calories * multiplier),
        protein_g: (food.protein_g * multiplier).toFixed(1),
        carbs_g: (food.carbs_g * multiplier).toFixed(1),
        fats_g: (food.fats_g * multiplier).toFixed(1),
        weight_g: values.grams,
        meal_type: mealType,
        log_date: date,
      };
      
      if (isEditing) {
        // Pass the original food id for updates
        onSave({ ...calculatedData, id: food.id }, true);
      } else {
        onSave([calculatedData], false);
      }
    },
    enableReinitialize: true,
  });

  const getNutrientValue = (nutrient) => {
    if (!food || !formik.values.grams) return 0;
    const multiplier = formik.values.grams / (food.serving_weight_grams || 100);
    // Ensure nutrient is a number before calculation
    return (Number(nutrient) * multiplier).toFixed(1);
  };
  
  return (
    <form onSubmit={formik.handleSubmit}>
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{food.food_name || food.description}</h3>
        <p className="text-sm text-gray-400">
          Serving: {food.serving_weight_grams || 100}g
        </p>
      </div>
      
      <div className="mb-4">
        <label htmlFor="grams" className="block text-sm font-medium text-gray-300">Amount (grams)</label>
        <input
          id="grams"
          name="grams"
          type="number"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.grams}
          className="w-full p-2 mt-1 bg-gray-700 border border-gray-600 rounded text-white"
        />
        {formik.touched.grams && formik.errors.grams ? (
          <div className="text-red-500 text-xs mt-1">{formik.errors.grams}</div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-center">
        <div>
          <p className="font-bold text-lg text-white">{getNutrientValue(food.calories)}</p>
          <p className="text-sm text-gray-400">Calories</p>
        </div>
        <div>
          <p className="font-bold text-lg text-white">{getNutrientValue(food.protein_g)}g</p>
          <p className="text-sm text-gray-400">Protein</p>
        </div>
        <div>
          <p className="font-bold text-lg text-white">{getNutrientValue(food.carbs_g)}g</p>
          <p className="text-sm text-gray-400">Carbs</p>
        </div>
        <div>
          <p className="font-bold text-lg text-white">{getNutrientValue(food.fats_g)}g</p>
          <p className="text-sm text-gray-400">Fats</p>
        </div>
      </div>

      <div className="flex justify-between mt-4">
        <div>
          {onBack && (
            <button type="button" onClick={onBack} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
              Back
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center">
            {isLoading ? <Spinner size={20} /> : (isEditing ? 'Update' : 'Add')}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FoodEntryForm;