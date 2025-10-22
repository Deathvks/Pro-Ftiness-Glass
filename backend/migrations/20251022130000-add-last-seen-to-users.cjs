/* backend/migrations/20251022130000-add-last-seen-to-users.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Obtenemos la descripción de la tabla 'users'
    const tableDescription = await queryInterface.describeTable('users');
    // Verificamos si la columna 'lastSeen' NO existe
    if (!tableDescription.lastSeen) {
      // Si no existe, la añadimos
      await queryInterface.addColumn('users', 'lastSeen', {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      });
    }
    // Si ya existe, no hacemos nada
    // --- FIN DE LA MODIFICACIÓN ---
  },

  async down(queryInterface, Sequelize) {
    // --- INICIO DE LA MODIFICACIÓN ---
    // Hacemos lo mismo para el 'down' por seguridad
    const tableDescription = await queryInterface.describeTable('users');
    // Verificamos si la columna 'lastSeen' SÍ existe
    if (tableDescription.lastSeen) {
      // Si existe, la eliminamos
      await queryInterface.removeColumn('users', 'lastSeen');
    }
    // Si no existe, no hacemos nada
    // --- FIN DE LA MODIFICACIÓN ---
  }
};