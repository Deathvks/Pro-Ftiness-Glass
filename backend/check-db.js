import { Sequelize, DataTypes } from 'sequelize';
import config from './config/config.cjs';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];
const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host, dialect: dbConfig.dialect, port: dbConfig.port || 3306, logging: false
});

const Message = sequelize.define('Message', {
  content: DataTypes.TEXT,
  bot_reminder_level: DataTypes.INTEGER,
  bot_push_status: DataTypes.STRING,
  bot_email_status: DataTypes.STRING
}, { tableName: 'messages', timestamps: false });

async function run() {
  const msgs = await Message.findAll({ where: { bot_reminder_level: 1 } });
  console.log(JSON.stringify(msgs, null, 2));
  process.exit(0);
}
run();
