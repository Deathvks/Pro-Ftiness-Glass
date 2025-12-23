/* backend/fixNotifications.js */
import db from './models/index.js';

const { Notification } = db;

const fixNotificationsTable = async () => {
    try {
        console.log('🔄 Iniciando reparación y sincronización de la tabla notifications...');

        // 1. Forzamos la recreación de la tabla (sync force)
        // Esto elimina la tabla y la vuelve a crear EXACTAMENTE como la define el modelo.
        // Es la única forma segura de eliminar el error "Unknown column" si hay discrepancias ocultas.
        await Notification.sync({ force: true });

        console.log('✅ Tabla notifications recreada correctamente.');

        // 2. Verificamos técnicamente que las columnas existen para tu tranquilidad
        const tableDescription = await Notification.describe();
        const columns = Object.keys(tableDescription);

        console.log('📋 Columnas confirmadas en la nueva tabla:', columns.join(', '));

        if (columns.includes('created_at')) {
            console.log('✅ Verificado: La columna created_at existe y es accesible por el sistema.');
        } else {
            console.error('❌ ALERTA: Algo ha fallado, la columna created_at no aparece.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error fatal al reparar la tabla:', error);
        process.exit(1);
    }
};

fixNotificationsTable();