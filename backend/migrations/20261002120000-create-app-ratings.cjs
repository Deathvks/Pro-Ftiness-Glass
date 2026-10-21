'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('app_ratings').catch(() => false);
    if (!tableExists) {
      await queryInterface.createTable('app_ratings', {
        id: {
          allowNull: false,
          primaryKey: true,
          type: Sequelize.INTEGER,
          autoIncrement: true
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        rating: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        comment: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE
        }
      }).catch(err => console.log('Table app_ratings might already exist:', err.message));
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('app_ratings').catch(() => {});
  }
};
