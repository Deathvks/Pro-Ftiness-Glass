/* backend/migrations/20260130000000-create-stories.cjs */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabla de Historias
    await queryInterface.createTable('Stories', {
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
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('image', 'video'),
        defaultValue: 'image'
      },
      privacy: {
        type: Sequelize.ENUM('public', 'friends'),
        defaultValue: 'friends'
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. Tabla de Likes en Historias
    await queryInterface.createTable('StoryLikes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      story_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. Tabla de Vistas de Historias (para saber cuáles ya vio el usuario)
    await queryInterface.createTable('StoryViews', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      story_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Stories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para optimizar búsquedas
    await queryInterface.addIndex('Stories', ['user_id', 'expires_at']); // Buscar historias activas de un usuario
    await queryInterface.addIndex('StoryLikes', ['story_id', 'user_id'], { unique: true }); // Un like por usuario por historia
    await queryInterface.addIndex('StoryViews', ['story_id', 'user_id'], { unique: true }); // Una vista por usuario por historia
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StoryViews');
    await queryInterface.dropTable('StoryLikes');
    await queryInterface.dropTable('Stories');
  }
};