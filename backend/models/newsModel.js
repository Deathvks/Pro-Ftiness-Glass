/* backend/models/newsModel.js */
import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

const News = sequelize.define(
  'News',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    slug: {
      type: DataTypes.STRING(191),
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Entrenamiento',
    },
    tags: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: '',
    },
    author_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Equipo Pro Fitness Glass',
    },
    author_avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    reading_time: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    views_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    published_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    seo_title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    seo_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'news',
    timestamps: true,
  }
);

export default News;
