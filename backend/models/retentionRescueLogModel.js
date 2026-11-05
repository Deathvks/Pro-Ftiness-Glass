/* backend/models/retentionRescueLogModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const RetentionRescueLog = sequelize.define(
  'RetentionRescueLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    segment: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: 'no_setup',
      comment: "'routine_ready' | 'has_workout_pr' | 'nutrition_only' | 'no_setup'",
    },
    inactive_hours: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 72,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    context_label: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    in_app_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'success',
    },
    push_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'no_subscription',
      comment: "'success' | 'no_subscription' | 'error'",
    },
    push_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    email_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'success',
      comment: "'success' | 'error' | 'skipped'",
    },
    email_error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    overall_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'success',
      comment: "'success' | 'partial' | 'error'",
    },
    trigger_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'auto_cron',
      comment: "'auto_cron' | 'manual_admin'",
    },
    reference_activity_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sent_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'retention_rescue_logs',
    timestamps: false,
  }
);

export default RetentionRescueLog;
