/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Definimos DataTypes usando require de CommonJS
    const DataTypes = Sequelize.DataTypes;
    
    // Añade la columna image_url a la tabla favorite_meals
    await queryInterface.addColumn('favorite_meals', 'image_url', {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL de la imagen de la comida',
    });
  },

  async down(queryInterface, Sequelize) {
    // Elimina la columna image_url de la tabla favorite_meals
    await queryInterface.removeColumn('favorite_meals', 'image_url');
  }
};