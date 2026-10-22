'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.bulkUpdate(
        'news',
        {
          image_url: 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?auto=format&fit=crop&w=1200&q=80',
          updatedAt: new Date()
        },
        {
          slug: 'futuro-del-fitness-inteligencia-artificial-biosensores'
        }
      );
      console.log('[Migration] Imagen de portada para la noticia "futuro-del-fitness" actualizada con éxito.');
    } catch (err) {
      console.error('[Migration] Error actualizando imagen de noticia:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // No-op revert
  }
};
