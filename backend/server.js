/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './models/index.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken'; // Para decodificar el token

// Requerido en ESM para simular __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import bodyweightRoutes from './routes/bodyweight.js';
import creatinaRoutes from './routes/creatina.js';
import exerciseRoutes from './routes/exercises.js';
import exerciseListRoutes from './routes/exerciseList.js';
import favoriteMealsRoutes from './routes/favoriteMeals.js';
import nutritionRoutes from './routes/nutrition.js';
import personalRecordsRoutes from './routes/personalRecords.js';
import routineRoutes from './routes/routines.js';
import templateRoutinesRoutes from './routes/templateRoutines.js';
import userRoutes from './routes/users.js';
import workoutRoutes from './routes/workouts.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Confiar en el proxy (necesario para express-rate-limit en Zeabur)
app.set('trust proxy', 1);

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware para actualizar 'lastSeen' en cada petición
app.use(async (req, res, next) => { // <-- Marcado como async
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      // Verificamos el token
      // Usamos verify de forma síncrona o manejamos la promesa
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // Si es válido, actualizamos lastSeen en la DB
      if (payload && payload.userId) { // <-- Corregido: usa payload.userId como en authenticateToken
        // --- INICIO DE LA MODIFICACIÓN ---
        // Usamos await para esperar a que la actualización termine
        await db.User.update(
          { lastSeen: new Date() },
          { where: { id: payload.userId } } // <-- Corregido: usa payload.userId
        );
        // --- FIN DE LA MODIFICACIÓN ---
      }
    } catch (err) {
      // Si el token es inválido (expirado, etc.), no hacemos nada
      // console.error("Error verifying token for lastSeen update:", err.message); // Log opcional
    }
  }
  next(); // Continuamos a la siguiente ruta DESPUÉS de intentar actualizar
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/bodyweight', bodyweightRoutes);
app.use('/api/creatina', creatinaRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/exercise-list', exerciseListRoutes);
app.use('/api/meals', favoriteMealsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/records', personalRecordsRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/template-routines', templateRoutinesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

// Usamos db.sequelize.sync() que viene de models/index.js
db.sequelize.sync()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// --- Exportación opcional si usas start.js ---
// export default app; // Descomenta si usas start.js