'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('users');
    if (!columns.email_coaching_consent) {
      await queryInterface.addColumn('users', 'email_coaching_consent', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      });
    }

    await queryInterface.createTable('email_consent_events', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE'
      },
      purpose: { type: Sequelize.STRING(32), allowNull: false },
      granted: { type: Sequelize.BOOLEAN, allowNull: false },
      source: { type: Sequelize.STRING(32), allowNull: false },
      email_fingerprint: { type: Sequelize.STRING(64), allowNull: false },
      notice_version: { type: Sequelize.STRING(32), allowNull: true },
      notice_text: { type: Sequelize.TEXT, allowNull: true },
      occurred_at: { type: Sequelize.DATE, allowNull: false }
    });

    const indexName = 'email_consent_events_user_purpose_id';
    const indexes = await queryInterface.showIndex('email_consent_events');
    if (!indexes.some(index => index.name === indexName)) {
      await queryInterface.addIndex('email_consent_events', ['user_id', 'purpose', 'id'], { name: indexName });
    }

    // El indicador anterior no acredita el nuevo consentimiento por finalidad.
    await queryInterface.bulkUpdate('users', { email_marketing_consent: false }, { email_marketing_consent: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate('users', { email_marketing_consent: false }, { email_marketing_consent: true });
    await queryInterface.dropTable('email_consent_events');
    await queryInterface.removeColumn('users', 'email_coaching_consent');
  }
};
