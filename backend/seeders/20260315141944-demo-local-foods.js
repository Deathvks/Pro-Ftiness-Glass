/* backend/seeders/XXXXXX-demo-local-foods.js */
import axios from 'axios';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default {
  async up(queryInterface, Sequelize) {
    console.log('⏳ Descargando alimentos en ESPAÑOL de OpenFoodFacts...');

    let allFoods = [];
    const pagesToFetch = 10;
    const pageSize = 50; // Reducido para no saturar su servidor

    for (let page = 1; page <= pagesToFetch; page++) {
      try {
        if (page > 1) {
          console.log(`⏱️ Esperando 5 segundos para evitar bloqueos...`);
          await delay(5000);
        }

        console.log(`📥 Descargando bloque ${page} de ${pagesToFetch}...`);

        const url = `https://es.openfoodfacts.org/cgi/search.pl?action=process&json=1&page=${page}&page_size=${pageSize}&sort_by=popularity_key&fields=product_name_es,product_name,generic_name,nutriments,image_front_small_url`;

        const response = await axios.get(url, {
          timeout: 30000, // Subido a 30s por la lentitud de su API
          headers: { 'User-Agent': 'FitApp_Backend/1.0' }
        });

        if (response.data && response.data.products) {
          const products = response.data.products.map(p => {
            const name = p.product_name_es || p.product_name || p.generic_name;
            if (!name) return null;

            return {
              name: name.substring(0, 255),
              calories: p.nutriments?.['energy-kcal_100g'] || 0,
              protein_g: p.nutriments?.proteins_100g || 0,
              carbs_g: p.nutriments?.carbohydrates_100g || 0,
              fats_g: p.nutriments?.fat_100g || 0,
              sugars_g: p.nutriments?.sugars_100g || 0,
              image_url: p.image_front_small_url || null
            }; // Eliminados created_at y updated_at
          }).filter(p => p !== null && p.calories > 0);

          allFoods = allFoods.concat(products);
          console.log(`   ✅ Bloque ${page} procesado: ${products.length} productos válidos.`);
        }
      } catch (error) {
        console.error(`❌ Error en el bloque ${page}:`, error.message);
      }
    }

    const uniqueFoodsMap = new Map();
    for (const item of allFoods) {
      const key = item.name.toLowerCase().trim();
      if (!uniqueFoodsMap.has(key)) {
        uniqueFoodsMap.set(key, item);
      }
    }
    const uniqueFoods = Array.from(uniqueFoodsMap.values());

    console.log(`✅ ¡Proceso terminado! Insertando ${uniqueFoods.length} alimentos únicos de España en la base de datos...`);

    if (uniqueFoods.length > 0) {
<<<<<<< HEAD
      await queryInterface.bulkInsert('local_foods', uniqueFoods);
=======
      await queryInterface.bulkInsert('local_foods', uniqueFoods, {
        ignoreDuplicates: true // <--- AÑADE ESTA LÍNEA
      });
>>>>>>> main
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('local_foods', null, {});
  }
};