import sequelize from './backend/db.js';
import models from './backend/models/index.js';

async function sync() {
    await sequelize.sync({ alter: true });
    console.log("DB Synced");
    process.exit(0);
}
sync();
