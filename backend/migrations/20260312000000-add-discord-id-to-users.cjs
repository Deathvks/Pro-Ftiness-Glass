/* backend/migrations/20260312000000-add-discord-id-to-users.cjs */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'discord_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'discord_id');
  }
};