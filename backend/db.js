import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Usamos un objeto de configuración para que sea más claro
const config = {
  dialect: 'mysql',
  host: isProduction ? process.env.MYSQL_HOST : process.env.DB_HOST,
  port: isProduction ? process.env.MYSQL_PORT : 3306, // Añadimos el puerto
  dialectOptions: isProduction ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {}
};

const sequelize = new Sequelize(
  isProduction ? process.env.MYSQL_DATABASE : process.env.DB_NAME,
  isProduction ? process.env.MYSQL_USERNAME : process.env.DB_USER,
  isProduction ? process.env.MYSQL_PASSWORD : process.env.DB_PASSWORD,
  config
);

export default sequelize;