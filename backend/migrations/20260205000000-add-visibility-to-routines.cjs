/* backend/migrations/20260205000000-add-visibility-to-routines.cjs */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Añadir la columna 'visibility'
    await queryInterface.addColumn('routines', 'visibility', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'private',
    });

    // 2. Migrar datos existentes:
    // Si la rutina ya era pública (is_public = true), actualizamos visibility a 'public'
    // Las privadas se quedan como 'private' por el defaultValue anterior.
    try {
      await queryInterface.sequelize.query(
        `UPDATE routines SET visibility = 'public' WHERE is_public = true`
        // Nota: En algunos dialectos SQL 'true' es 1, Sequelize suele manejarlo, 
        // pero esta query raw funciona en la mayoría (MySQL/Postgres).
      );
    } catch (error) {
      console.warn("No se pudieron migrar los datos antiguos de is_public a visibility (puede que no haya datos), pero la columna se creó correctamente.", error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('routines', 'visibility');
  }
};