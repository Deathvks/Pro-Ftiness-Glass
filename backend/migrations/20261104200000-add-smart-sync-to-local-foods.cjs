'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('local_foods').catch(() => ({}));

    if (!tableInfo.barcode) {
      await queryInterface.addColumn('local_foods', 'barcode', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null
      }).catch(err => console.log('Column barcode might already exist:', err.message));
    }

    if (!tableInfo.brand) {
      await queryInterface.addColumn('local_foods', 'brand', {
        type: Sequelize.STRING(100),
        allowNull: true,
        defaultValue: null
      }).catch(err => console.log('Column brand might already exist:', err.message));
    }

    if (!tableInfo.serving_quantity) {
      await queryInterface.addColumn('local_foods', 'serving_quantity', {
        type: Sequelize.FLOAT,
        allowNull: true,
        defaultValue: null
      }).catch(err => console.log('Column serving_quantity might already exist:', err.message));
    }

    if (!tableInfo.last_synced_at) {
      await queryInterface.addColumn('local_foods', 'last_synced_at', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.fn('NOW')
      }).catch(err => console.log('Column last_synced_at might already exist:', err.message));
    }

    await queryInterface.addIndex('local_foods', ['barcode']).catch(() => {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('local_foods', ['barcode']).catch(() => {});
    await queryInterface.removeColumn('local_foods', 'barcode').catch(() => {});
    await queryInterface.removeColumn('local_foods', 'brand').catch(() => {});
    await queryInterface.removeColumn('local_foods', 'serving_quantity').catch(() => {});
    await queryInterface.removeColumn('local_foods', 'last_synced_at').catch(() => {});
  }
};
