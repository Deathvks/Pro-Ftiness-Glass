/* backend/models/index.js */
import sequelize from "../db.js";
import { DataTypes } from 'sequelize';

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

// Nuevos modelos de Squads
import Squad from './squadModel.js';
import SquadMember from './squadMemberModel.js';

// Nuevos modelos de Feed (Likes y Comentarios en Entrenamientos)
import WorkoutLike from './workoutLikeModel.js';
import WorkoutComment from './workoutCommentModel.js';

// 2. Importa las factorías de los nuevos modelos de Historias
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
WorkoutLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' }); // Añadido alias 'user' para el feed

WorkoutLog.belongsTo(Routine, { foreignKey: 'routine_id', as: 'routine' });
Routine.hasMany(WorkoutLog, { foreignKey: 'routine_id', as: 'workoutLogs' });

// --- Feed: Likes y Comentarios en Entrenamientos ---
WorkoutLog.hasMany(WorkoutLike, { foreignKey: 'workout_id', as: 'Likes', onDelete: 'CASCADE' });
WorkoutLike.belongsTo(WorkoutLog, { foreignKey: 'workout_id', as: 'workout' });
User.hasMany(WorkoutLike, { foreignKey: 'user_id', as: 'WorkoutLikes', onDelete: 'CASCADE' });
WorkoutLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

WorkoutLog.hasMany(WorkoutComment, { foreignKey: 'workout_id', as: 'Comments', onDelete: 'CASCADE' });
WorkoutComment.belongsTo(WorkoutLog, { foreignKey: 'workout_id', as: 'workout' });
User.hasMany(WorkoutComment, { foreignKey: 'user_id', as: 'WorkoutComments', onDelete: 'CASCADE' });
WorkoutComment.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

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

// --- HISTORIAS ---
User.hasMany(Story, { foreignKey: 'user_id', as: 'stories', onDelete: 'CASCADE' });
Story.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Story.hasMany(StoryLike, { foreignKey: 'story_id', as: 'likes', onDelete: 'CASCADE' });
StoryLike.belongsTo(Story, { foreignKey: 'story_id', as: 'story' });
User.hasMany(StoryLike, { foreignKey: 'user_id', as: 'likedStories' });
StoryLike.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Story.hasMany(StoryView, { foreignKey: 'story_id', as: 'views', onDelete: 'CASCADE' });
StoryView.belongsTo(Story, { foreignKey: 'story_id', as: 'story' });
User.hasMany(StoryView, { foreignKey: 'user_id', as: 'viewedStories' });
StoryView.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// --- SQUADS / CLANES (Nuevas Asociaciones) ---
User.belongsToMany(Squad, { through: SquadMember, foreignKey: 'user_id', as: 'Squads' });
Squad.belongsToMany(User, { through: SquadMember, foreignKey: 'squad_id', as: 'Members' });
Squad.hasMany(SquadMember, { foreignKey: 'squad_id', as: 'SquadMemberships' });
SquadMember.belongsTo(Squad, { foreignKey: 'squad_id' });
User.hasMany(SquadMember, { foreignKey: 'user_id', as: 'UserSquadMemberships' });
SquadMember.belongsTo(User, { foreignKey: 'user_id' });

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
  Story,
  StoryLike,
  StoryView,
  Squad,
  SquadMember,
  WorkoutLike,
  WorkoutComment
};

export default models;