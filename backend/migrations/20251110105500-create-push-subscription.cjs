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
          model: 'Users', // Asegúrate que coincida con el nombre de tu tabla de usuarios
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE', 
      },
      endpoint: {
        // --- INICIO DE LA MODIFICACIÓN ---
        type: Sequelize.STRING(512), // Cambiado de TEXT a STRING(512) (VARCHAR)
        // --- FIN DE LA MODIFICACIÓN ---
        allowNull: false,
        unique: true, // Ahora esto funcionará
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