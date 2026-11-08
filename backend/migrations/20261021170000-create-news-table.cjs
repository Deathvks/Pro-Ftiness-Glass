'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableExists = await queryInterface.tableExists('news').catch(() => false);
    if (!tableExists) {
      await queryInterface.createTable('news', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
        },
        slug: {
          type: Sequelize.STRING(191),
          allowNull: false,
          unique: true,
        },
        title: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        summary: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        content: {
          type: Sequelize.TEXT('long'),
          allowNull: false,
        },
        image_url: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        category: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 'Entrenamiento',
        },
        tags: {
          type: Sequelize.STRING(255),
          allowNull: true,
          defaultValue: '',
        },
        author_name: {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 'Equipo Pro Fitness Glass',
        },
        author_avatar: {
          type: Sequelize.STRING(500),
          allowNull: true,
        },
        reading_time: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 4,
        },
        views_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        is_published: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        published_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
        seo_title: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        seo_description: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
        updatedAt: {
          allowNull: false,
          type: Sequelize.DATE,
          defaultValue: Sequelize.fn('NOW'),
        },
      });

      // Add index on slug and published_at for rapid lookups and SEO queries
      await queryInterface.addIndex('news', ['slug']).catch(() => {});
      await queryInterface.addIndex('news', ['is_published', 'published_at']).catch(() => {});
      await queryInterface.addIndex('news', ['category']).catch(() => {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('news').catch(() => {});
  }
};
