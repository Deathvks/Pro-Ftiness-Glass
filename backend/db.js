/* backend/db.js */
import { Sequelize } from 'sequelize';
import config from './config/config.cjs'; // <-- Cambio aquí

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

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
    // --- INICIO DE LA MODIFICACIÓN ---
    // Cambia console.log a false para desactivar siempre los logs
    logging: false, // env === 'development' ? console.log : false,
    // --- FIN DE LA MODIFICACIÓN ---
  }
);

export default sequelize;