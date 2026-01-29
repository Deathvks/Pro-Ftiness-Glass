/* backend/models/storyLikeModel.js */
export default (sequelize, DataTypes) => {
  const StoryLike = sequelize.define('StoryLike', {
    story_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Stories',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    tableName: 'StoryLikes',
    underscored: true,
  });

  StoryLike.associate = function(models) {
    StoryLike.belongsTo(models.Story, { 
      foreignKey: 'story_id', 
      as: 'story' 
    });
    StoryLike.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  };

  return StoryLike;
};