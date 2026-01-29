/* backend/models/storyViewModel.js */
export default (sequelize, DataTypes) => {
  const StoryView = sequelize.define('StoryView', {
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
    tableName: 'StoryViews',
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