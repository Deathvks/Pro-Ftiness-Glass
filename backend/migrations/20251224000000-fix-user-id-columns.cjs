/* backend/migrations/20251224000000-fix-user-id-columns.cjs */
'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        const tableNames = ['PushSubscriptions', 'notifications']; // Tablas a verificar

        for (const tableName of tableNames) {
            try {
                const tableInfo = await queryInterface.describeTable(tableName);

                // Si existe 'userId' pero no 'user_id', la renombramos
                if (tableInfo.userId && !tableInfo.user_id) {
                    await queryInterface.renameColumn(tableName, 'userId', 'user_id');
                    console.log(`✅ Columna renombrada de 'userId' a 'user_id' en la tabla ${tableName}`);
                } else {
                    console.log(`ℹ️ La tabla ${tableName} ya parece tener la columna correcta o no existe.`);
                }
            } catch (error) {
                console.warn(`⚠️ No se pudo verificar/actualizar la tabla ${tableName}:`, error.message);
            }
        }
    },

    async down(queryInterface, Sequelize) {
        // Revertir el cambio si es necesario (opcional)
        const tableNames = ['PushSubscriptions', 'notifications'];
        for (const tableName of tableNames) {
            try {
                const tableInfo = await queryInterface.describeTable(tableName);
                if (tableInfo.user_id && !tableInfo.userId) {
                    await queryInterface.renameColumn(tableName, 'user_id', 'userId');
                }
            } catch (error) {
                console.warn(`⚠️ Error revirtiendo tabla ${tableName}:`, error.message);
            }
        }
    }
};