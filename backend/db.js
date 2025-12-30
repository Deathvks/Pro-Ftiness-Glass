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
    // MODIFICACIÓN: Forzamos UTC ('+00:00') para que Sequelize no convierta 
    // las horas basándose en la hora local del servidor.
    timezone: '+00:00',
    port: dbConfig.port,
    dialectOptions: {
      ...dbConfig.dialectOptions || {},
      // Esto ayuda a que MySQL interprete las fechas escritas como UTC
      timezone: '+00:00',
    },
    logging: false,
  }
);

export default sequelize;