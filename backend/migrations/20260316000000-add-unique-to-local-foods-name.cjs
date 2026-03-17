/* backend/migrations/20260316000000-add-unique-to-local-foods-name.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addConstraint('local_foods', {
            fields: ['name'],
            type: 'unique',
            name: 'unique_name_local_foods'
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeConstraint('local_foods', 'unique_name_local_foods');
    }
};