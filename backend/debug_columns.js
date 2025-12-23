import sequelize from './db.js';

async function checkColumns() {
    try {
        console.log("\n🔍 Inspecting 'notifications' table...");
        try {
            const [results] = await sequelize.query("SHOW COLUMNS FROM notifications");
            console.table(results.map(r => ({ Field: r.Field, Type: r.Type })));
        } catch (e) {
            console.error("Error checking notifications:", e.message);
        }

        console.log("\n🔍 Inspecting 'PushSubscriptions' table...");
        try {
            const [results2] = await sequelize.query("SHOW COLUMNS FROM PushSubscriptions");
            console.table(results2.map(r => ({ Field: r.Field, Type: r.Type })));
        } catch (e) {
            // Fallback for case sensitivity or different name
            console.error("Error checking PushSubscriptions (trying lowercase 'pushsubscriptions')...");
            try {
                const [results3] = await sequelize.query("SHOW COLUMNS FROM pushsubscriptions");
                console.table(results3.map(r => ({ Field: r.Field, Type: r.Type })));
            } catch (e2) {
                console.error("Error checking pushsubscriptions:", e2.message);
            }
        }

    } catch (error) {
        console.error("General Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
