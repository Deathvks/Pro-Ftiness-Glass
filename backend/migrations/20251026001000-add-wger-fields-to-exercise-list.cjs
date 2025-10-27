/* backend/migrations/20251026001000-add-wger-fields-to-exercise-list.js */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.addColumn('exercise_list', 'wger_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        unique: true,
        after: 'video_url' // Opcional: lo sitúa después de video_url
      });
      
      await queryInterface.addColumn('exercise_list', 'category', {
        type: Sequelize.STRING(100),
        allowNull: true,
        after: 'wger_id'
      });
      
      await queryInterface.addColumn('exercise_list', 'equipment', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'category'
      });

      await queryInterface.addColumn('exercise_list', 'image_url_start', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'equipment'
      });

      await queryInterface.addColumn('exercise_list', 'image_url_end', {
        type: Sequelize.STRING(255),
        allowNull: true,
        after: 'image_url_start'
      });

    } catch (error) {
      console.error('Error in migration up:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.removeColumn('exercise_list', 'wger_id');
      await queryInterface.removeColumn('exercise_list', 'category');
      await queryInterface.removeColumn('exercise_list', 'equipment');
      await queryInterface.removeColumn('exercise_list', 'image_url_start');
      await queryInterface.removeColumn('exercise_list', 'image_url_end');
    } catch (error) {
      console.error('Error in migration down:', error);
      throw error;
    }
  }
};