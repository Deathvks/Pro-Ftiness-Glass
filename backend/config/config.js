// Importar dotenv para cargar las variables de entorno
import dotenv from 'dotenv';
dotenv.config();

// La configuración para development y test no cambia
const config = {
  development: {
    username: "root",
    password: "1234",
    database: "fittrack",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  test: {
    username: "root",
    password: "1234",
    database: "fittrack_test",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    // --- INICIO DE LA CORRECCIÓN ---
    // En lugar de 'use_env_variable', construimos la URL dinámicamente
    // usando las mismas variables que tu aplicación ya utiliza.
    url: `mysql://${process.env.MYSQL_USERNAME}:${process.env.MYSQL_PASSWORD}@${process.env.MYSQL_HOST}:${process.env.MYSQL_PORT}/${process.env.MYSQL_DATABASE}`,
    // --- FIN DE LA CORRECCIÓN ---
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  }
};

export default config;