import { DataTypes } from 'sequelize';
import sequelize from '../db.js';

export default sequelize.define('EmailConsentEvent', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE'
  },
  purpose: { type: DataTypes.STRING(32), allowNull: false },
  granted: { type: DataTypes.BOOLEAN, allowNull: false },
  source: { type: DataTypes.STRING(32), allowNull: false },
  email_fingerprint: { type: DataTypes.STRING(64), allowNull: false },
  notice_version: DataTypes.STRING(32),
  notice_text: DataTypes.TEXT,
  occurred_at: { type: DataTypes.DATE, allowNull: false }
}, {
  tableName: 'email_consent_events',
  timestamps: false,
  indexes: [{ name: 'email_consent_events_user_purpose_id', fields: ['user_id', 'purpose', 'id'] }]
});
