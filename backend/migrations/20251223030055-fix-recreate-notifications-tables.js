'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Borrar tablas defectuosas si existen
      await queryInterface.dropTable('notifications', { transaction });
      await queryInterface.dropTable('PushSubscriptions', { transaction });
      await queryInterface.dropTable('push_subscriptions', { transaction }); // Por si acaso existe la versión snake_case

      // 2. Crear tabla PushSubscriptions LIMPIA
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
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        endpoint: {
          type: Sequelize.TEXT,
          allowNull: false
        },
        keys: {
          type: Sequelize.JSON, // Guardamos p256dh y auth aquí o como columnas separadas según tu modelo
          allowNull: false
        },
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      }, { transaction });

      // 3. Crear tabla notifications LIMPIA
      await queryInterface.createTable('notifications', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE'
        },
        message: { type: Sequelize.STRING, allowNull: false },
        read: { type: Sequelize.BOOLEAN, defaultValue: false },
        type: { type: Sequelize.STRING }, // opcional
        createdAt: { allowNull: false, type: Sequelize.DATE },
        updatedAt: { allowNull: false, type: Sequelize.DATE }
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Si revertimos, borramos todo
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('PushSubscriptions');
  }
};