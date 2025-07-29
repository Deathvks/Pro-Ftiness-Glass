import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // 1. Importar cookie-parser

dotenv.config();

import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routines.js';
import exerciseRoutes from './routes/exercises.js';
import workoutRoutes from './routes/workouts.js';
import bodyweightRoutes from './routes/bodyweight.js';
import userRoutes from './routes/users.js';
import exerciseListRoutes from './routes/exerciseList.js'; // <-- AÑADIDO

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
// 2. Configurar CORS para que acepte credenciales (cookies) del frontend
app.use(cors({
  origin: 'http://localhost:5173', // La URL de tu frontend
  credentials: true
}));
app.use(express.json());
app.use(cookieParser()); // 3. Usar cookie-parser

// Usa las rutas con sus prefijos
app.use('/api/auth', authRoutes);
app.use('/api', routineRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', workoutRoutes);
app.use('/api', bodyweightRoutes);
app.use('/api', userRoutes);
app.use('/api', exerciseListRoutes); // <-- AÑADIDO

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});