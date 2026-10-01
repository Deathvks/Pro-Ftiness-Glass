import { Sequelize } from 'sequelize';
import config from './config/config.cjs';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  port: dbConfig.port || 3306
});

async function run() {
  try {
    await sequelize.query('ALTER TABLE messages ADD COLUMN bot_push_status VARCHAR(255) DEFAULT "pending";');
    console.log("Added bot_push_status");
  } catch(e) { console.error(e.message); }
  
  try {
    await sequelize.query('ALTER TABLE messages ADD COLUMN bot_email_status VARCHAR(255) DEFAULT "pending";');
    console.log("Added bot_email_status");
  } catch(e) { console.error(e.message); }
  
  process.exit(0);
}
run();
