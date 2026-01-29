/* backend/models/storyModel.js */
export default (sequelize, DataTypes) => {
  const Story = sequelize.define('Story', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('image', 'video'),
      defaultValue: 'image'
    },
    privacy: {
      type: DataTypes.ENUM('public', 'friends'),
      defaultValue: 'friends'
    },
    // --- NUEVO CAMPO HDR ---
    is_hdr: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'Stories',
    underscored: true,
  });

  Story.associate = function(models) {
    Story.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
    Story.hasMany(models.StoryLike, { 
      foreignKey: 'story_id', 
      as: 'likes',
      onDelete: 'CASCADE'
    });
    Story.hasMany(models.StoryView, { 
      foreignKey: 'story_id', 
      as: 'views',
      onDelete: 'CASCADE'
    });
  };

  return Story;
};