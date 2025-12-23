/* backend/fixPushSubscriptions.js */
import db from './models/index.js';

const { PushSubscription } = db;

const fixPushTable = async () => {
    try {
        console.log('🔄 Reparando tabla push_subscriptions...');

        // Borramos y recreamos la tabla problemática
        await PushSubscription.sync({ force: true });

        console.log('✅ Tabla push_subscriptions arreglada.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixPushTable();