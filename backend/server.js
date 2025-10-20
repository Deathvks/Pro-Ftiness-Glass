require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

const authRoutes = require('./routes/auth');
const bodyweightRoutes = require('./routes/bodyweight');
const creatinaRoutes = require('./routes/creatina');
const exerciseRoutes = require('./routes/exercises');
const exerciseListRoutes = require('./routes/exerciseList');
const favoriteMealsRoutes = require('./routes/favoriteMeals');
const nutritionRoutes = require('./routes/nutrition');
const personalRecordsRoutes = require('./routes/personalRecords');
const routineRoutes = require('./routes/routines');
const templateRoutinesRoutes = require('./routes/templateRoutines');
const userRoutes = require('./routes/users');
const workoutRoutes = require('./routes/workouts');
const adminRoutes = require('./routes/admin');

const app = express();

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
app.use('/api/favorite-meals', favoriteMealsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/personal-records', personalRecordsRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/template-routines', templateRoutinesRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3001;

sequelize.sync()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });