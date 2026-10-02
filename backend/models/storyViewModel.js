/* backend/models/storyViewModel.js */
export default (sequelize, DataTypes) => {
  const StoryView = sequelize.define('StoryView', {
    story_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stories', // CAMBIO: minúscula
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users', // CAMBIO: minúscula
        key: 'id'
      }
    }
  }, {
    tableName: 'story_views', // CAMBIO: minúscula y snake_case
    underscored: true,
  });

  StoryView.associate = function(models) {
    StoryView.belongsTo(models.Story, { 
      foreignKey: 'story_id', 
      as: 'story' 
    });
    StoryView.belongsTo(models.User, { 
      foreignKey: 'user_id', 
      as: 'user' 
    });
  };

  return StoryView;
};