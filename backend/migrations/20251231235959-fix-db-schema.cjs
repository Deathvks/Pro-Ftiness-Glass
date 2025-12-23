'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Eliminar tabla fantasma si existe
        await queryInterface.dropTable('pushsubscriptions').catch(() => { });

        // 2. Arreglar tabla push_subscriptions
        // La borramos y recreamos para garantizar que tenga la estructura perfecta (endpoint STRING(500) + fechas)
        await queryInterface.dropTable('push_subscriptions').catch(() => { });

        await queryInterface.createTable('push_subscriptions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            endpoint: {
                type: Sequelize.STRING(500), // IMPORTANTE: Longitud definida para permitir índices únicos
                allowNull: false,
                unique: true
            },
            keys: {
                type: Sequelize.JSON,
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

        // 3. Arreglar tabla notifications
        // La borramos y recreamos para asegurar que las columnas created_at/updated_at existen y son snake_case
        await queryInterface.dropTable('notifications').catch(() => { });

        await queryInterface.createTable('notifications', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id'
                },
                onDelete: 'CASCADE'
            },
            type: {
                type: Sequelize.STRING(50),
                allowNull: false,
                defaultValue: 'info'
            },
            title: {
                type: Sequelize.STRING(255),
                allowNull: false
            },
            message: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            is_read: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            data: {
                type: Sequelize.JSON,
                allowNull: true
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

        // Índices para notificaciones
        await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
        await queryInterface.addIndex('notifications', ['created_at']);
    },

    async down(queryInterface, Sequelize) {
        // En caso de revertir, borramos las tablas creadas
        await queryInterface.dropTable('push_subscriptions');
        await queryInterface.dropTable('notifications');
    }
};