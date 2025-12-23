'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            // 1. LIMPIEZA TOTAL: Borramos cualquier versión anterior de las tablas
            await queryInterface.dropTable('notifications', { transaction });
            await queryInterface.dropTable('PushSubscriptions', { transaction }); // PascalCase (la que tenías antes)
            await queryInterface.dropTable('pushsubscriptions', { transaction }); // Lowercase
            await queryInterface.dropTable('push_subscriptions', { transaction }); // Snake_case

            // 2. CREAR TABLA: push_subscriptions (snake_case correcto)
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
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
                },
                endpoint: {
                    type: Sequelize.STRING(500),
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
            }, { transaction });

            // 3. CREAR TABLA: notifications
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
                    references: { model: 'users', key: 'id' },
                    onDelete: 'CASCADE',
                    onUpdate: 'CASCADE'
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
            }, { transaction });

            // Índices
            await queryInterface.addIndex('notifications', ['user_id', 'is_read'], { transaction });
            await queryInterface.addIndex('notifications', ['created_at'], { transaction });

            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('push_subscriptions');
        await queryInterface.dropTable('notifications');
    }
};