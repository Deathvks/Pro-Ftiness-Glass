'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('news_visit_logs').catch(() => false);
    if (!tableExists) {
      await queryInterface.createTable('news_visit_logs', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        news_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'news',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        article_slug: {
          type: Sequelize.STRING(191),
          allowNull: true,
        },
        article_title: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        page_path: {
          type: Sequelize.STRING(255),
          allowNull: false,
          defaultValue: '/noticias',
        },
        visitor_id: {
          type: Sequelize.STRING(64),
          allowNull: false,
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        session_id: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        referrer: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        referrer_host: {
          type: Sequelize.STRING(150),
          allowNull: true,
        },
        referrer_type: {
          type: Sequelize.STRING(50),
          allowNull: false,
          defaultValue: 'direct',
        },
        ip_address: {
          type: Sequelize.STRING(64),
          allowNull: true,
        },
        country: {
          type: Sequelize.STRING(10),
          allowNull: true,
          defaultValue: 'ES',
        },
        city: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        device_type: {
          type: Sequelize.STRING(30),
          allowNull: false,
          defaultValue: 'desktop',
        },
        browser: {
          type: Sequelize.STRING(80),
          allowNull: true,
        },
        os: {
          type: Sequelize.STRING(80),
          allowNull: true,
        },
        screen_resolution: {
          type: Sequelize.STRING(30),
          allowNull: true,
        },
        language: {
          type: Sequelize.STRING(20),
          allowNull: true,
        },
        utm_source: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        utm_medium: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        utm_campaign: {
          type: Sequelize.STRING(100),
          allowNull: true,
        },
        duration_seconds: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_test: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        created_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });

      await queryInterface.addIndex('news_visit_logs', ['article_slug']).catch(() => {});
      await queryInterface.addIndex('news_visit_logs', ['visitor_id']).catch(() => {});
      await queryInterface.addIndex('news_visit_logs', ['user_id']).catch(() => {});
      await queryInterface.addIndex('news_visit_logs', ['created_at']).catch(() => {});
      await queryInterface.addIndex('news_visit_logs', ['is_test']).catch(() => {});
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable('news_visit_logs').catch(() => {});
  },
};
