/* backend/migrations/20251221000000-create-user-sessions.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('user_sessions', {
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
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            token: {
                type: Sequelize.TEXT, // Guardamos el token para poder validarlo/invalidarlo
                allowNull: false
            },
            device_type: {
                type: Sequelize.STRING, // 'mobile', 'tablet', 'console', 'smarttv', 'wearable', 'embedded', o undefined (desktop)
                allowNull: true
            },
            device_name: {
                type: Sequelize.STRING, // Ej: "iPhone - Safari", "Windows - Chrome"
                allowNull: true
            },
            ip_address: {
                type: Sequelize.STRING,
                allowNull: true
            },
            last_active: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE
            }
        });

        await queryInterface.addIndex('user_sessions', ['user_id']);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('user_sessions');
    }
};