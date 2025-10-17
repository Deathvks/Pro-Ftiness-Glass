import React from 'react';
import Spinner from '../../Spinner';

const SearchResults = ({ results, onSelect, loading }) => {
  if (loading) {
    return <Spinner />;
  }

  return (
    <ul>
      {results.map((food, index) => (
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

export default SearchResults;