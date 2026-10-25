/* backend/models/newsVisitLogModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const NewsVisitLog = sequelize.define(
  'NewsVisitLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    news_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    article_slug: {
      type: DataTypes.STRING(191),
      allowNull: true,
    },
    article_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    page_path: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '/noticias',
    },
    visitor_id: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    session_id: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    referrer: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    referrer_host: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    referrer_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'direct', // 'direct', 'search', 'social', 'messaging', 'internal', 'external'
    },
    ip_address: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    country: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: 'ES',
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    device_type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'desktop', // 'mobile', 'tablet', 'desktop'
    },
    browser: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    os: {
      type: DataTypes.STRING(80),
      allowNull: true,
    },
    screen_resolution: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    language: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    utm_source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    utm_medium: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    utm_campaign: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_test: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'news_visit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['article_slug'] },
      { fields: ['visitor_id'] },
      { fields: ['user_id'] },
      { fields: ['created_at'] },
      { fields: ['is_test'] },
      { fields: ['referrer_type'] },
    ],
  }
);

export default NewsVisitLog;
