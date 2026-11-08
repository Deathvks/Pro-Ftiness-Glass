'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('news');
    if (!tableInfo.likes_count) {
      await queryInterface.addColumn('news', 'likes_count', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        after: 'views_count'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('news');
    if (tableInfo.likes_count) {
      await queryInterface.removeColumn('news', 'likes_count');
    }
  }
};
