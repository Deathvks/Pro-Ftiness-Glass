/* backend/migrations/20261105010000-seed-popular-spanish-foods.cjs */
'use strict';

const POPULAR_FOODS = [
  {
    name: 'Pechuga de Pollo 92% (MERCADONA)',
    barcode: '8480000086679',
    brand: 'MERCADONA',
    serving_quantity: 100,
    calories: 89,
    protein_g: 18.1,
    carbs_g: 1,
    fats_g: 1.7,
    sugars_g: 1,
    last_synced_at: new Date()
  },
  {
    name: 'Claras de huevo pasteurizadas (Guillén)',
    barcode: '8411384100941',
    brand: 'Guillén',
    serving_quantity: 100,
    calories: 42,
    protein_g: 11,
    carbs_g: 0.5,
    fats_g: 0.5,
    sugars_g: 0.5,
    last_synced_at: new Date()
  },
  {
    name: 'Queso fresco batido 0% (Hacendado)',
    barcode: '8480000510211',
    brand: 'Hacendado',
    serving_quantity: 120,
    calories: 46,
    protein_g: 8,
    carbs_g: 3.5,
    fats_g: 0.1,
    sugars_g: 3.5,
    last_synced_at: new Date()
  },
  {
    name: 'Copos de avena extra suaves (Brüggen)',
    barcode: '4008713713411',
    brand: 'H. & J. Brüggen',
    serving_quantity: 40,
    calories: 375,
    protein_g: 14,
    carbs_g: 59,
    fats_g: 7,
    sugars_g: 0.7,
    last_synced_at: new Date()
  },
  {
    name: 'Pan de molde 100% integral (Hacendado)',
    barcode: '8480000823281',
    brand: 'Hacendado',
    serving_quantity: 29,
    calories: 231,
    protein_g: 11,
    carbs_g: 37,
    fats_g: 3.2,
    sugars_g: 2.9,
    last_synced_at: new Date()
  },
  {
    name: 'Tortitas de arroz (Hacendado)',
    barcode: '8480000140135',
    brand: 'Hacendado',
    serving_quantity: 31,
    calories: 363,
    protein_g: 8.5,
    carbs_g: 75,
    fats_g: 2.8,
    sugars_g: 1,
    last_synced_at: new Date()
  },
  {
    name: 'Guacamole (Hacendado)',
    barcode: '8480000038524',
    brand: 'Hacendado',
    serving_quantity: 50,
    calories: 149,
    protein_g: 1.9,
    carbs_g: 2,
    fats_g: 13.7,
    sugars_g: 1.4,
    last_synced_at: new Date()
  },
  {
    name: 'Leche desnatada (Hacendado)',
    barcode: '8480000108341',
    brand: 'Hacendado',
    serving_quantity: 250,
    calories: 35,
    protein_g: 3.2,
    carbs_g: 4.9,
    fats_g: 0.3,
    sugars_g: 4.9,
    last_synced_at: new Date()
  },
  {
    name: 'Atún claro al natural (Hacendado)',
    barcode: '8480000184405',
    brand: 'Hacendado',
    serving_quantity: 60,
    calories: 101,
    protein_g: 24,
    carbs_g: 0,
    fats_g: 0.6,
    sugars_g: 0,
    last_synced_at: new Date()
  },
  {
    name: 'Aceite de oliva virgen extra (Hacendado)',
    barcode: '8480000120021',
    brand: 'Hacendado',
    serving_quantity: 10,
    calories: 900,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 100,
    sugars_g: 0,
    last_synced_at: new Date()
  },
  {
    name: 'Yogur natural bífidus desnatado (Hacendado)',
    barcode: '8480000213334',
    brand: 'Hacendado',
    serving_quantity: 125,
    calories: 50,
    protein_g: 7.1,
    carbs_g: 4.2,
    fats_g: 0.4,
    sugars_g: 3.8,
    last_synced_at: new Date()
  },
  {
    name: 'Cacao puro desgrasado (Valor)',
    barcode: '8410109121551',
    brand: 'Chocolates Valor',
    serving_quantity: 10,
    calories: 375,
    protein_g: 25.5,
    carbs_g: 16.4,
    fats_g: 16,
    sugars_g: 0.7,
    last_synced_at: new Date()
  },
  {
    name: 'Arroz redondo (Hacendado)',
    barcode: '8480000282033',
    brand: 'Hacendado',
    serving_quantity: 80,
    calories: 347,
    protein_g: 7.2,
    carbs_g: 76.8,
    fats_g: 0.9,
    sugars_g: 0.2,
    last_synced_at: new Date()
  },
  {
    name: 'Crema de cacahuete 100% (Hacendado)',
    barcode: '8480000630049',
    brand: 'Hacendado',
    serving_quantity: 15,
    calories: 618,
    protein_g: 30,
    carbs_g: 7,
    fats_g: 50,
    sugars_g: 5.7,
    last_synced_at: new Date()
  },
  {
    name: 'Lentejas cocidas (Hacendado)',
    barcode: '8480000171016',
    brand: 'Hacendado',
    serving_quantity: 200,
    calories: 90,
    protein_g: 6.7,
    carbs_g: 12,
    fats_g: 0.6,
    sugars_g: 0.3,
    last_synced_at: new Date()
  },
  {
    name: 'Garbanzos cocidos (Hacendado)',
    barcode: '8480000171023',
    brand: 'Hacendado',
    serving_quantity: 200,
    calories: 105,
    protein_g: 6.8,
    carbs_g: 14.5,
    fats_g: 1.8,
    sugars_g: 0.5,
    last_synced_at: new Date()
  },
  {
    name: 'Yogur líquido +Proteínas fresa (Hacendado)',
    barcode: '8480000217035',
    brand: 'Hacendado',
    serving_quantity: 280,
    calories: 56,
    protein_g: 10,
    carbs_g: 3.5,
    fats_g: 0.2,
    sugars_g: 3.4,
    last_synced_at: new Date()
  },
  {
    name: 'Plátano de Canarias I.G.P',
    barcode: '24098984',
    brand: 'Genérico',
    serving_quantity: 100,
    calories: 93,
    protein_g: 1.4,
    carbs_g: 21.7,
    fats_g: 0.5,
    sugars_g: 17.8,
    last_synced_at: new Date()
  }
];

module.exports = {
  async up(queryInterface, Sequelize) {
    for (const food of POPULAR_FOODS) {
      try {
        const [existing] = await queryInterface.sequelize.query(
          'SELECT id FROM local_foods WHERE barcode = :barcode OR name = :name LIMIT 1',
          {
            replacements: { barcode: food.barcode, name: food.name },
            type: queryInterface.sequelize.QueryTypes.SELECT
          }
        );

        if (existing) {
          await queryInterface.sequelize.query(
            `UPDATE local_foods SET 
              barcode = :barcode, 
              brand = :brand, 
              serving_quantity = :serving_quantity, 
              calories = :calories, 
              protein_g = :protein_g, 
              carbs_g = :carbs_g, 
              fats_g = :fats_g, 
              sugars_g = :sugars_g, 
              last_synced_at = :last_synced_at 
            WHERE id = :id`,
            {
              replacements: { ...food, id: existing.id }
            }
          );
        } else {
          await queryInterface.bulkInsert('local_foods', [food]);
        }
      } catch (err) {
        console.warn(`[Migration Seed] Could not seed food ${food.name}:`, err.message);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const barcodes = POPULAR_FOODS.map(f => f.barcode).filter(Boolean);
    if (barcodes.length > 0) {
      await queryInterface.bulkDelete('local_foods', {
        barcode: barcodes
      });
    }
  }
};
