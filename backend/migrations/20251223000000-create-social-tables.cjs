'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Crear tabla 'friendships'
        await queryInterface.createTable('friendships', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            requester_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            addressee_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            status: {
                type: Sequelize.STRING(20), // 'pending', 'accepted', 'rejected'
                defaultValue: 'pending',
                allowNull: false
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Añadir restricción única compuesta para evitar solicitudes duplicadas
        await queryInterface.addConstraint('friendships', {
            fields: ['requester_id', 'addressee_id'],
            type: 'unique',
            name: 'unique_friendship_request'
        });

        // 2. Modificar tabla 'users' para añadir opciones de privacidad
        await queryInterface.addColumn('users', 'is_public_profile', {
            type: Sequelize.BOOLEAN,
            defaultValue: false, // Por defecto privado
            allowNull: false
        });

        await queryInterface.addColumn('users', 'show_level_xp', { // Mostrar Nivel y XP
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        await queryInterface.addColumn('users', 'show_badges', { // Mostrar Insignias
            type: Sequelize.BOOLEAN,
            defaultValue: true,
            allowNull: false
        });

        // 3. Modificar tabla 'routines' para permitir compartir
        await queryInterface.addColumn('routines', 'is_public', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
            allowNull: false
        });

        await queryInterface.addColumn('routines', 'downloads_count', {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            allowNull: false
        });
    },

    async down(queryInterface, Sequelize) {
        // Revertir los cambios
        await queryInterface.removeColumn('routines', 'downloads_count');
        await queryInterface.removeColumn('routines', 'is_public');
        await queryInterface.removeColumn('users', 'show_badges');
        await queryInterface.removeColumn('users', 'show_level_xp');
        await queryInterface.removeColumn('users', 'is_public_profile');
        await queryInterface.dropTable('friendships');
    }
};