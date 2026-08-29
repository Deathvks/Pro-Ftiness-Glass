module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(255),
      defaultValue: 'user'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Para volver atrs, habra que asegurarse de que no haya roles fuera del ENUM original
    // Es arriesgado, as que lo dejamos como STRING
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.STRING(255),
      defaultValue: 'user'
    });
  }
};
