'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // Copia el valor de 'name' a 'username' solo donde 'username' es NULL
      // y 'name' no es NULL y no contiene solo espacios.
      // También se asegura de que no viole la restricción UNIQUE de 'username'.
      // Considera nombres de usuario duplicados potenciales si 'name' no era único.
      // Esta consulta intentará actualizar, pero fallará si crea duplicados en username.
      // Sería ideal manejar duplicados manualmente si ocurren.
      await queryInterface.sequelize.query(`
        UPDATE users
        SET username = name,
            name = name -- Opcional: mantener name igual
        WHERE username IS NULL
          AND name IS NOT NULL
          AND TRIM(name) <> ''
          AND name NOT IN (SELECT existing_username FROM (SELECT username as existing_username FROM users WHERE username IS NOT NULL) AS temp_users);
      `, { transaction });

      // Opcional: Si quieres asegurarte de que todos los usuarios tengan un 'name',
      // podrías copiar 'username' a 'name' donde 'name' sea NULL.
      // await queryInterface.sequelize.query(`
      //   UPDATE users
      //   SET name = username
      //   WHERE name IS NULL AND username IS NOT NULL;
      // `, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      console.error("Error copying name to username:", err);
      // Decide si quieres que la migración falle completamente o solo advierta
      // throw err;
      console.warn("Could not copy all names to usernames, possibly due to potential duplicates. Please check manually.");
    }
  },

  async down (queryInterface, Sequelize) {
    // El 'down' podría intentar revertir, pero es complejo si había NULLs antes.
    // Por simplicidad, podemos dejarlo vacío o poner un log.
    console.log("Reverting copy-name-to-username migration is not directly supported by this script.");
    // Opcionalmente, podrías poner 'username' a NULL donde sea igual a 'name',
    // pero eso podría borrar usernames establecidos independientemente.
    // await queryInterface.sequelize.query(`
    //   UPDATE users SET username = NULL WHERE username = name;
    // `);
  }
};