/* backend/db.js */
import { Sequelize } from 'sequelize';
import config from './config/config.cjs';

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// --- AÑADE ESTO PARA VERIFICAR ---
console.log(`🔌 Conectando a Base de Datos: ${dbConfig.database} en ${dbConfig.host}`);
// ---------------------------------

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    timezone: dbConfig.timezone,
    port: dbConfig.port,
    dialectOptions: dbConfig.dialectOptions || {},
    logging: false,
  }
);

export default sequelize;