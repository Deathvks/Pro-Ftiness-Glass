/* backend/migrations/20260225000000-create-feed-tables.cjs */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear tabla de Likes
    await queryInterface.createTable('workout_likes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      workout_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'workout_logs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Añadir restricción única para que un usuario solo pueda dar 1 like por entrenamiento
    await queryInterface.addIndex('workout_likes', ['user_id', 'workout_id'], {
      unique: true,
      name: 'unique_workout_like'
    });

    // 2. Crear tabla de Comentarios
    await queryInterface.createTable('workout_comments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      workout_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'workout_logs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workout_comments');
    await queryInterface.dropTable('workout_likes');
  }
};