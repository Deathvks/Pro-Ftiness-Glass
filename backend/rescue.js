import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Recibir el archivo desde la base de datos
app.all('/rescue-upload', (req, res) => {
  console.log('Recibiendo archivo desde la BD...');
  const stream = fs.createWriteStream('/tmp/db_backup.tar.gz');
  req.pipe(stream);
  req.on('end', () => {
    console.log('Archivo guardado correctamente en el backend.');
    res.send('OK - Archivo recibido');
  });
});

// 2. Descargar el archivo desde el navegador del usuario
app.get('/rescue-download', (req, res) => {
  const filePath = '/tmp/db_backup.tar.gz';
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'db_backup.tar.gz');
  } else {
    res.status(404).send('El archivo an no ha sido subido.');
  }
});

// 3. Ruta de prueba para comprobar que el backend est vivo
app.get('/', (req, res) => {
  res.send('<h1>Servidor de Rescate Activo</h1><p>Ve a /rescue-download cuando el archivo est listo.</p>');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de rescate escuchando en el puerto ${PORT}`);
});
