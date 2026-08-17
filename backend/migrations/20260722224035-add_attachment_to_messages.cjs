'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      const tableExists = await queryInterface.tableExists('messages');
      if (tableExists) {
        await queryInterface.addColumn('messages', 'attachment_url', {
          type: Sequelize.STRING(1000),
          allowNull: true,
        }).catch(err => console.log('Column attachment_url might already exist.'));
        
        await queryInterface.addColumn('messages', 'attachment_type', {
          type: Sequelize.STRING,
          allowNull: true,
        }).catch(err => console.log('Column attachment_type might already exist.'));
      } else {
        console.log('Table messages does not exist yet. It will be automatically created by Sequelize sync on startup.');
      }
    } catch (error) {
      console.error('Migration error safely caught:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      const tableExists = await queryInterface.tableExists('messages');
      if (tableExists) {
        await queryInterface.removeColumn('messages', 'attachment_url').catch(() => {});
        await queryInterface.removeColumn('messages', 'attachment_type').catch(() => {});
      }
    } catch (error) {
      console.error('Migration down error safely caught:', error.message);
    }
  }
};
