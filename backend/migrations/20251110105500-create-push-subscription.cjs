/* backend/migrations/20251110105500-create-push-subscription.cjs */

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PushSubscriptions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          // --- INICIO DE LA CORRECCIÓN ---
          model: 'users', // Cambiado de 'Users' a 'users' (minúscula)
          // --- FIN DE LA CORRECCIÓN ---
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', 
      },
      endpoint: {
        type: Sequelize.STRING(512), 
        allowNull: false,
        unique: true,
      },
      keys: {
        type: Sequelize.JSON, 
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    // Creamos un índice en 'userId' para optimizar las búsquedas
    await queryInterface.addIndex('PushSubscriptions', ['userId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PushSubscriptions');
  }
};