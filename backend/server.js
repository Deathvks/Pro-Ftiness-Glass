import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import helmet from 'helmet'; // <-- 1. Importar helmet

dotenv.config();

import authRoutes from './routes/auth.js';
import routineRoutes from './routes/routines.js';
import exerciseRoutes from './routes/exercises.js';
import workoutRoutes from './routes/workouts.js';
import bodyweightRoutes from './routes/bodyweight.js';
import userRoutes from './routes/users.js';
import exerciseListRoutes from './routes/exerciseList.js';
import personalRecordRoutes from './routes/personalRecords.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet()); // <-- 2. Usar helmet al principio

// --- INICIO DE LA MODIFICACIÓN ---
// Línea añadida para depurar y verificar la variable de entorno
console.log(`[CORS] Configurando CORS para el origen: ${process.env.FRONTEND_URL}`);
// --- FIN DE LA MODIFICACIÓN ---

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// Usa las rutas con sus prefijos
app.use('/api/auth', authRoutes);
app.use('/api', routineRoutes);
app.use('/api', exerciseRoutes);
app.use('/api', workoutRoutes);
app.use('/api', bodyweightRoutes);
app.use('/api', userRoutes);
app.use('/api', exerciseListRoutes);
app.use('/api', personalRecordRoutes);

// Usar el middleware de errores al final de todas las rutas
app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});