import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import creatinaRoutes from './routes/creatina.js';
// --- INICIO DE LA MODIFICACIÓN ---
import path from 'path';
import { fileURLToPath } from 'url';
// --- FIN DE LA MODIFICACIÓN ---

dotenv.config();

import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routines.js';
import exerciseRoutes from './routes/exercises.js';
import workoutRoutes from './routes/workouts.js';
import bodyweightRoutes from './routes/bodyweight.js';
import userRoutes from './routes/users.js';
import exerciseListRoutes from './routes/exerciseList.js';
import personalRecordRoutes from './routes/personalRecords.js';
import adminRoutes from './routes/admin.js';
import nutritionRoutes from './routes/nutrition.js';
import favoriteMealRoutes from './routes/favoriteMeals.js';
import templateRoutineRoutes from './routes/templateRoutines.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

// --- INICIO DE LA MODIFICACIÓN ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- FIN DE LA MODIFICACIÓN ---

app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// --- INICIO DE LA MODIFICACIÓN ---
// Servir archivos estáticos desde la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --- FIN DE LA MODIFICACIÓN ---


// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', routineRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', workoutRoutes);
app.use('/api', bodyweightRoutes);
app.use('/api', userRoutes);
app.use('/api', exerciseListRoutes);
app.use('/api', personalRecordRoutes);
app.use('/api', nutritionRoutes);
app.use('/api', favoriteMealRoutes);
app.use('/api', templateRoutineRoutes); 
app.use('/api/creatina', creatinaRoutes);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});