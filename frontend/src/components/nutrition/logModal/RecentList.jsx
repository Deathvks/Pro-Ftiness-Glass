/* frontend/src/components/nutrition/logModal/RecentList.jsx */
import React from 'react';
import SearchResultItem from './SearchResultItem';
import Spinner from '../../Spinner';

const RecentList = ({ items = [], onAdd, isLoading }) => {
    return (
        <div className="space-y-2 flex-grow overflow-y-auto pr-1">
            {isLoading ? (
                <div className="flex justify-center items-center pt-10">
                    <Spinner />
                </div>
            ) : items.length > 0 ? (
                items.map(meal => (
                    <SearchResultItem
                        key={`recent-${meal.id}`}
                        item={meal}
                        onAdd={onAdd}
                        onDelete={null}
                    />
                ))
            ) : (
                <p className="text-center text-text-muted pt-10">
                    No hay comidas recientes.
                </p>
            )}
        </div>
    );
};

export default RecentList;