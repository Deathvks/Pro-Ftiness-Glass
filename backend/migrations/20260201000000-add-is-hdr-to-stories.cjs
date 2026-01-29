/* backend/migrations/20260201000000-add-is-hdr-to-stories.cjs */
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tableName = 'stories'; // IMPORTANTE: Minúscula para Linux
    const columnName = 'is_hdr';

    try {
      // 1. Verificamos qué columnas tiene la tabla actualmente
      const tableInfo = await queryInterface.describeTable(tableName);

      // 2. Solo añadimos la columna si NO existe
      if (!tableInfo[columnName]) {
        await queryInterface.addColumn(tableName, columnName, {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false
        });
        console.log(`Columna ${columnName} añadida a ${tableName}`);
      } else {
        console.log(`La columna ${columnName} ya existía en ${tableName}. Saltando.`);
      }
    } catch (error) {
      console.error('Error verificando/añadiendo columna is_hdr:', error.message);
      // No lanzamos error para no detener el despliegue si es un error menor
    }
  },

  async down(queryInterface, Sequelize) {
    const tableName = 'stories';
    try {
      const tableInfo = await queryInterface.describeTable(tableName);
      if (tableInfo['is_hdr']) {
        await queryInterface.removeColumn(tableName, 'is_hdr');
      }
    } catch (error) {
      // Ignorar error si la tabla no existe al revertir
    }
  }
};