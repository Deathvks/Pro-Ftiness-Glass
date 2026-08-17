'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('exercise_list').catch(() => ({}));
    
    // Add images column if it doesn't exist
    if (!tableInfo.images) {
      await queryInterface.addColumn('exercise_list', 'images', {
        type: Sequelize.JSON,
        allowNull: true,
      }).catch(err => console.log('Column images might already exist:', err.message));
    }

    // Alter muscle_group to string 255 if needed
    try {
      await queryInterface.changeColumn('exercise_list', 'muscle_group', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    } catch (err) {
      console.log('Could not alter muscle_group:', err.message);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('exercise_list', 'images').catch(() => {});
    
    try {
      await queryInterface.changeColumn('exercise_list', 'muscle_group', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    } catch (err) {}
  }
};
