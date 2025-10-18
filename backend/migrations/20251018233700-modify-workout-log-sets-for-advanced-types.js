'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up (queryInterface, Sequelize) {
    // 1. Añadir la nueva columna 'set_type'
    await queryInterface.addColumn('workout_log_sets', 'set_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      defaultValue: null,
      comment: 'Tipo de serie avanzada (null para normal)',
      // Intentar colocarla después de weight_kg si es posible
      after: 'weight_kg'
    });

    // Opcional: Migrar datos existentes si 'is_dropset' era true
    // Podrías descomentar esto si tienes datos existentes que migrar
    // await queryInterface.sequelize.query(
    //   `UPDATE workout_log_sets SET set_type = 'dropset' WHERE is_dropset = true;`
    // );

    // 2. Eliminar la columna antigua 'is_dropset'
    await queryInterface.removeColumn('workout_log_sets', 'is_dropset');
  },

  async down (queryInterface, Sequelize) {
    // 1. Volver a añadir la columna 'is_dropset'
    await queryInterface.addColumn('workout_log_sets', 'is_dropset', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      after: 'weight_kg' // Intentar mantener el orden original
    });

    // Opcional: Revertir la migración de datos
    // Podrías descomentar esto si necesitas revertir
    // await queryInterface.sequelize.query(
    //   `UPDATE workout_log_sets SET is_dropset = true WHERE set_type = 'dropset';`
    // );

    // 2. Eliminar la nueva columna 'set_type'
    await queryInterface.removeColumn('workout_log_sets', 'set_type');
  }
};