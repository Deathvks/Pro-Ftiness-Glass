import React from 'react';

const Recent = ({ recentFoods, onSelect }) => {
  return (
    <ul>
      {recentFoods.map((food, index) => (
        <li
          key={index}
          onClick={() => onSelect(food)}
          className="p-2 hover:bg-gray-700 cursor-pointer text-white"
        >
          {food.food_name} - {food.calories} kcal
        </li>
      ))}
    </ul>
  );
};

export default Recent;