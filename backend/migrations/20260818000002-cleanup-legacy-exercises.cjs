'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Intentar actualizar las rutinas para apuntar a los ejercicios nuevos si coinciden en nombre
      // Primero obtenemos los viejos y nuevos
      const oldExercises = await queryInterface.sequelize.query(
        `SELECT id, name FROM exercise_list WHERE wger_id IS NULL AND (video_url IS NULL OR video_url = '')`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      const newExercises = await queryInterface.sequelize.query(
        `SELECT id, name FROM exercise_list WHERE wger_id IS NOT NULL`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      // Crear un mapa de nombres (minúsculas) a IDs nuevos
      const newMap = {};
      for (const ex of newExercises) {
        newMap[ex.name.toLowerCase().trim()] = ex.id;
      }

      // Re-mapear routine_exercises si hay coincidencia
      for (const oldEx of oldExercises) {
        const matchingNewId = newMap[oldEx.name.toLowerCase().trim()];
        if (matchingNewId) {
          await queryInterface.sequelize.query(
            `UPDATE routine_exercises SET exercise_list_id = :newId WHERE exercise_list_id = :oldId`,
            {
              replacements: { newId: matchingNewId, oldId: oldEx.id },
              type: Sequelize.QueryTypes.UPDATE
            }
          ).catch(e => console.log('Error updating routine_exercises for', oldEx.name, e.message));
        }
      }

      // Eliminar definitivamente los ejercicios antiguos (sin wger_id ni video_url)
      await queryInterface.sequelize.query(
        `DELETE FROM exercise_list WHERE wger_id IS NULL AND (video_url IS NULL OR video_url = '')`
      );

    } catch (error) {
      console.error('Error limpiando ejercicios viejos:', error);
      // No lanzamos el error para no romper la migración si falla algo menor
    }
  },

  async down(queryInterface, Sequelize) {
    // No hay vuelta atrás para los ejercicios eliminados
  }
};
