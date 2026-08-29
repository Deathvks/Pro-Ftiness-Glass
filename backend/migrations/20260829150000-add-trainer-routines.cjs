'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. A\u00F1adir is_trainer_template a routines
    const tableInfo = await queryInterface.describeTable('routines');
    if (!tableInfo.is_trainer_template) {
      await queryInterface.addColumn('routines', 'is_trainer_template', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      });
    }

    // 2. Crear tabla routine_assignments
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('routine_assignments')) {
      await queryInterface.createTable('routine_assignments', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        routine_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'routines',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        client_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        assigned_at: {
          type: Sequelize.DATE,
          allowNull: false
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('routine_assignments')) {
      await queryInterface.dropTable('routine_assignments');
    }
    
    const tableInfo = await queryInterface.describeTable('routines');
    if (tableInfo.is_trainer_template) {
      await queryInterface.removeColumn('routines', 'is_trainer_template');
    }
  }
};
