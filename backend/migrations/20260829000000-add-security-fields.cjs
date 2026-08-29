'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('security_logs');
    
    if (!tableInfo.country) {
      await queryInterface.addColumn('security_logs', 'country', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
    
    if (!tableInfo.city) {
      await queryInterface.addColumn('security_logs', 'city', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }

    const tables = await queryInterface.showAllTables();
    if (!tables.includes('ip_blacklists')) {
      await queryInterface.createTable('ip_blacklists', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        ipAddress: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        reason: {
          type: Sequelize.STRING,
          allowNull: true
        },
        expiresAt: {
          type: Sequelize.DATE,
          allowNull: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('ip_blacklists')) {
      await queryInterface.dropTable('ip_blacklists');
    }
    
    const tableInfo = await queryInterface.describeTable('security_logs');
    if (tableInfo.city) {
      await queryInterface.removeColumn('security_logs', 'city');
    }
    if (tableInfo.country) {
      await queryInterface.removeColumn('security_logs', 'country');
    }
  }
};
