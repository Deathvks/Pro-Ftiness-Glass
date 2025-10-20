import { exec } from 'child_process';
import models from './models/index.js';
import app from './server.js'; // Cambiado de 'server' a 'app'

const { sequelize } = models;
const PORT = process.env.PORT || 5000;

/**
 * Ejecuta un comando en la shell y lo muestra en la consola en tiempo real.
 * @param {string} command - El comando a ejecutar.
 * @returns {Promise<string>} - El resultado del comando.
 */
function runCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Error ejecutando comando: ${command}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });

    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

/**
 * Función principal para iniciar la aplicación.
 */
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');
  } catch (error) {
    console.error('❌ Error de conexión con la base de datos:', error);
    process.exit(1);
  }

  try {
    console.log('🚀 Running database migrations...');
    await runCommand('npx sequelize-cli db:migrate --env production');
    console.log('✅ Migrations completed.');
  } catch (error) {
    console.error('❌ Fallo al ejecutar las migraciones.', error.message);
    process.exit(1);
  }

  try {
    console.log('🚀 Running database seeders...');
    await runCommand('npx sequelize-cli db:seed:all --env production');
    console.log('✅ Seeders completed.');
  } catch (error) {
    console.error('❌ Fallo al ejecutar los seeders.', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start();