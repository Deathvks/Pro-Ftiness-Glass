/* backend/migrations/20251204000000-add-timestamps-templates.js */
'use strict';

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        // Añadir columnas a template_routines
        try {
            await queryInterface.addColumn('template_routines', 'created_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            });
        } catch (e) {
            console.log('created_at en template_routines ya existe o error:', e.message);
        }

        try {
            await queryInterface.addColumn('template_routines', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            });
        } catch (e) {
            console.log('updated_at en template_routines ya existe o error:', e.message);
        }

        // Añadir columnas a template_routine_exercises
        try {
            await queryInterface.addColumn('template_routine_exercises', 'created_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            });
        } catch (e) {
            console.log('created_at en template_routine_exercises ya existe o error:', e.message);
        }

        try {
            await queryInterface.addColumn('template_routine_exercises', 'updated_at', {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            });
        } catch (e) {
            console.log('updated_at en template_routine_exercises ya existe o error:', e.message);
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('template_routines', 'created_at');
        await queryInterface.removeColumn('template_routines', 'updated_at');
        await queryInterface.removeColumn('template_routine_exercises', 'created_at');
        await queryInterface.removeColumn('template_routine_exercises', 'updated_at');
    }
};