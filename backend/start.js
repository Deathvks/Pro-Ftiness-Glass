const { exec } = require('child_process');
const { sequelize } = require('./models');
const server = require('./server');

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
        // El objeto 'error' contiene el código de salida y otros detalles.
        // Rechazamos la promesa con un mensaje claro que incluye el error estándar.
        reject(new Error(`Error ejecutando comando: ${command}\n${stderr}`));
        return;
      }
      resolve(stdout);
    });

    // Redirigir la salida estándar y de error del proceso hijo al proceso principal
    // para obtener un registro en tiempo real, útil en plataformas como Zeabur.
    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

/**
 * Función principal para iniciar la aplicación.
 * Conecta con la base de datos, ejecuta migraciones, seeders y finalmente inicia el servidor.
 */
async function start() {
  try {
    // 1. Verificar la conexión a la base de datos.
    await sequelize.authenticate();
    console.log('✅ Database connection successful.');
  } catch (error) {
    console.error('❌ Error de conexión con la base de datos:', error);
    process.exit(1); // Detiene la ejecución si la conexión falla.
  }

  try {
    // 2. Ejecutar las migraciones de la base de datos.
    console.log('🚀 Running database migrations...');
    await runCommand('npx sequelize-cli db:migrate --env production');
    console.log('✅ Migrations completed.');
  } catch (error) {
    console.error('❌ Fallo al ejecutar las migraciones.', error.message);
    process.exit(1); // Detiene la ejecución si las migraciones fallan.
  }

  try {
    // 3. Ejecutar los seeders para poblar la base de datos.
    console.log('🚀 Running database seeders...');
    await runCommand('npx sequelize-cli db:seed:all --env production');
    console.log('✅ Seeders completed.');
  } catch (error) {
    console.error('❌ Fallo al ejecutar los seeders.', error.message);
    process.exit(1); // Detiene la ejecución si los seeders fallan.
  }

  // 4. Si todo lo anterior tiene éxito, iniciar el servidor.
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// Iniciar la aplicación.
start();