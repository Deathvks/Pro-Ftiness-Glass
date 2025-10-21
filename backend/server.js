/* backend/server.js */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import db from './models/index.js';
import errorHandler from './middleware/errorHandler.js';
import path from 'path';
import { fileURLToPath } from 'url';

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

// --- INICIO DE LA MODIFICACIÓN ---
// Confiar en el proxy (necesario para express-rate-limit en Zeabur)
// Esto soluciona el error ERR_ERL_UNEXPECTED_X_FORWARDED_FOR
app.set('trust proxy', 1);
// --- FIN DE LA MODIFICACIÓN ---

app.use(cors({
    origin: process.env.CORS_ORIGIN,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/bodyweight', bodyweightRoutes);
app.use('/api/creatina', creatinaRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/exercise-list', exerciseListRoutes);
// CAMBIO: '/api/favorite-meals' -> '/api/meals'
app.use('/api/meals', favoriteMealsRoutes);
app.use('/api/nutrition', nutritionRoutes);

// --- INICIO DE LA MODIFICACIÓN ---
// Se cambia '/api/personal-records' por '/api/records' para coincidir con el frontend
app.use('/api/records', personalRecordsRoutes);
// --- FIN DE LA MODIFICACIÓN ---

app.use('/api/routines', routineRoutes);
app.use('/api/template-routines', templateRoutinesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

db.sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });