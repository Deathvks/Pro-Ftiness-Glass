/* backend/models/index.js */
import sequelize from "../db.js";
import { DataTypes } from 'sequelize'; // Necesario para inicializar los modelos de historias

// 1. Importa todos los modelos existentes
import User from './userModel.js';
import Routine from './routineModel.js';
import RoutineExercise from './exerciseModel.js';
import WorkoutLog from './workoutModel.js';
import BodyWeightLog from './bodyweightModel.js';
import BodyMeasurementLog from './bodyMeasurementModel.js';
import WorkoutLogDetail from './workoutLogDetailModel.js';
import WorkoutLogSet from './workoutLogSetModel.js';
import ExerciseList from './exerciseListModel.js';
import PersonalRecord from './personalRecordModel.js';
import NutritionLog from './nutritionLogModel.js';
import WaterLog from './waterLogModel.js';
import FavoriteMeal from './favoriteMealModel.js';
import CreatinaLog from './creatinaLogModel.js';
import TemplateRoutine from './templateRoutineModel.js';
import TemplateRoutineExercise from './templateRoutineExerciseModel.js';
import PushSubscription from './pushSubscriptionModel.js';
import Notification from './notificationModel.js';
import UserSession from './userSessionModel.js';
import Friendship from './friendshipModel.js';
import BugReport from './bugReportModel.js';

// 2. Importa las factorías de los nuevos modelos de Historias
// Nota: Usamos una importación por defecto que traerá la función constructora
import storyFactory from './storyModel.js';
import storyLikeFactory from './storyLikeModel.js';
import storyViewFactory from './storyViewModel.js';

// 3. Inicializa los modelos de Historias
const Story = storyFactory(sequelize, DataTypes);
const StoryLike = storyLikeFactory(sequelize, DataTypes);
const StoryView = storyViewFactory(sequelize, DataTypes);

// 4. Configuración de las asociaciones

// --- Usuarios y Rutinas ---
User.hasMany(Routine, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'Routines' });
Routine.belongsTo(User, { foreignKey: 'user_id' });

// --- Logs de Entrenamiento ---
User.hasMany(WorkoutLog, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'WorkoutLogs' });
WorkoutLog.belongsTo(User, { foreignKey: 'user_id' });

WorkoutLog.belongsTo(Routine, { foreignKey: 'routine_id', as: 'routine' });
Routine.hasMany(WorkoutLog, { foreignKey: 'routine_id', as: 'workoutLogs' });

// --- Métricas Corporales ---
User.hasMany(BodyWeightLog, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'BodyWeightLogs' });
BodyWeightLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(BodyMeasurementLog, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'BodyMeasurementLogs' });
BodyMeasurementLog.belongsTo(User, { foreignKey: 'user_id' });

// --- Nutrición e Hidratación ---
User.hasMany(NutritionLog, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'NutritionLogs' });
NutritionLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(WaterLog, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'WaterLogs' });
WaterLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(FavoriteMeal, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'FavoriteMeals' });
FavoriteMeal.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(CreatinaLog, { foreignKey: 'user_id', as: 'creatinaLogs' });
CreatinaLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- Detalles de Rutinas y Ejercicios ---
Routine.hasMany(RoutineExercise, { foreignKey: 'routine_id', onDelete: 'CASCADE', as: 'RoutineExercises' });
RoutineExercise.belongsTo(Routine, { foreignKey: 'routine_id' });

WorkoutLog.hasMany(WorkoutLogDetail, { foreignKey: 'workout_log_id', onDelete: 'CASCADE', as: 'WorkoutLogDetails' });
WorkoutLogDetail.belongsTo(WorkoutLog, { foreignKey: 'workout_log_id' });

WorkoutLogDetail.hasMany(WorkoutLogSet, { foreignKey: 'log_detail_id', onDelete: 'CASCADE', as: 'WorkoutLogSets' });
WorkoutLogSet.belongsTo(WorkoutLogDetail, { foreignKey: 'log_detail_id' });

ExerciseList.hasMany(RoutineExercise, { foreignKey: 'exercise_list_id' });
RoutineExercise.belongsTo(ExerciseList, { foreignKey: 'exercise_list_id' });

// --- Otros ---
User.hasMany(PersonalRecord, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'PersonalRecords' });
PersonalRecord.belongsTo(User, { foreignKey: 'user_id' });

TemplateRoutine.hasMany(TemplateRoutineExercise, { foreignKey: 'template_routine_id', as: 'TemplateRoutineExercises' });
TemplateRoutineExercise.belongsTo(TemplateRoutine, { foreignKey: 'template_routine_id' });

User.hasMany(PushSubscription, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'PushSubscriptions' });
PushSubscription.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'Notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserSession, { foreignKey: 'user_id', onDelete: 'CASCADE', as: 'Sessions' });
UserSession.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(BugReport, { foreignKey: 'user_id', as: 'reports' });
BugReport.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- Amistades ---
User.hasMany(Friendship, { foreignKey: 'requester_id', as: 'SentRequests' });
User.hasMany(Friendship, { foreignKey: 'addressee_id', as: 'ReceivedRequests' });
Friendship.belongsTo(User, { foreignKey: 'requester_id', as: 'Requester' });
Friendship.belongsTo(User, { foreignKey: 'addressee_id', as: 'Addressee' });

// --- HISTORIAS (Nuevas Asociaciones) ---
// Usuario tiene muchas historias
User.hasMany(Story, { foreignKey: 'user_id', as: 'stories', onDelete: 'CASCADE' });
Story.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Likes en Historias
Story.hasMany(StoryLike, { foreignKey: 'story_id', as: 'likes', onDelete: 'CASCADE' });
StoryLike.belongsTo(Story, { foreignKey: 'story_id', as: 'story' });
User.hasMany(StoryLike, { foreignKey: 'user_id', as: 'likedStories' });
StoryLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Vistas en Historias
Story.hasMany(StoryView, { foreignKey: 'story_id', as: 'views', onDelete: 'CASCADE' });
StoryView.belongsTo(Story, { foreignKey: 'story_id', as: 'story' });
User.hasMany(StoryView, { foreignKey: 'user_id', as: 'viewedStories' });
StoryView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

const models = {
    sequelize,
    User,
    Routine,
    RoutineExercise,
    WorkoutLog,
    WorkoutLogDetail,
    WorkoutLogSet,
    BodyWeightLog,
    BodyMeasurementLog,
    ExerciseList,
    PersonalRecord,
    NutritionLog,
    WaterLog,
    FavoriteMeal,
    TemplateRoutine,
    TemplateRoutineExercise,
    CreatinaLog,
    PushSubscription,
    Notification,
    UserSession,
    Friendship,
    BugReport,
    // Nuevos modelos
    Story,
    StoryLike,
    StoryView
};

export default models;