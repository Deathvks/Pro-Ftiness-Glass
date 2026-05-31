/* frontend/src/components/NutritionLogModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, Search, BookMarked, Clock, Edit, QrCode, Plus } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import Spinner from './Spinner';
import ConfirmationModal from './ConfirmationModal';
import { useNutritionModal } from '../hooks/useNutritionModal';
import { useLocalNotifications } from '../hooks/useLocalNotifications';
import { searchFoods } from '../services/nutritionService';

import TabButton from './nutrition/logModal/TabButton';
import ManualEntryForm from './nutrition/logModal/ManualEntryForm';
import SelectedItem from './nutrition/logModal/SelectedItem';
import FavoritesList from './nutrition/logModal/FavoritesList';
import RecentList from './nutrition/logModal/RecentList';
import SearchResultItem from './nutrition/logModal/SearchResultItem';

import FoodDetailView from './nutrition/logModal/FoodDetailView';

const NutritionLogModal = ({ mealType, onClose, onSave, logToEdit, isLoading }) => {

    const {
        isEditingLog, editingFavorite, searchTerm, setSearchTerm, activeTab, setActiveTab,
        itemsToAdd, favoritesPage, setFavoritesPage, mealToDelete, setMealToDelete,
        editingListItemId, manualFormState, setManualFormState, showScanner, setShowScanner,
        paginatedFavorites, filteredRecents, isLoadingRecents, totalPages,
        handleAddManualItem, handleAddFavoriteItem, handleAddRecentItem, handleRemoveItem,
        handleToggleFavorite, handleEditListItem, handleEditFavorite, handleSaveListItem,
        handleSaveList, handleSaveSingle, handleSaveEdit, handleScanSuccess,
        handleDeleteFavorite, confirmDeleteFavorite, title, addModeType,
        isUploading, handleImageUpload,
        isPer100g, setIsPer100g
    } = useNutritionModal({ mealType, onSave, onClose, logToEdit });

    const { cancelMealReminder } = useLocalNotifications();

    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [selectedDetailItem, setSelectedDetailItem] = useState(null);

    const executeSearch = async () => {
        if (searchTerm.trim().length < 3) return;

        setIsSearching(true);
        setHasSearched(true);

        try {
            const results = await searchFoods(searchTerm.trim());
            setSearchResults(results);
        } catch (error) {
            console.error("Error buscando alimentos:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            executeSearch();
        }
    };

    useEffect(() => {
        if (activeTab !== 'search') {
            setSearchResults([]);
            setHasSearched(false);
        }
    }, [activeTab]);

    const handleSelectSearchResult = (food) => {
        const foodData = {
            id: food.id,
            name: food.name || food.description || 'Alimento',
            description: food.name || food.description || 'Alimento',
            calories: food.calories || 0,
            protein_g: food.protein_g || food.protein || 0,
            carbs_g: food.carbs_g || food.carbs || 0,
            fats_g: food.fats_g || food.fat || 0,
            sugars_g: food.sugars_g || food.sugars || 0,

            weight_g: food.weight_g || 100,
            serving_weight_g: food.serving_weight_g,
            image_url: food.image_url,
            brand: food.brand,

            calories_per_100g: food.calories_per_100g,
            protein_per_100g: food.protein_per_100g,
            carbs_per_100g: food.carbs_per_100g,
            fat_per_100g: food.fat_per_100g,
            sugars_per_100g: food.sugars_per_100g || food.sugars_per_100,

            calories_per_serving: food.calories_per_serving,
            protein_per_serving: food.protein_per_serving,
            carbs_per_serving: food.carbs_per_serving,
            fat_per_serving: food.fat_per_serving,
            sugars_per_serving: food.sugars_per_serving,
        };

        setSelectedDetailItem(foodData);
    };

    const handleAddFromDetail = (itemToAdd) => {
        handleAddRecentItem(itemToAdd);
        setSelectedDetailItem(null);
        setSearchTerm('');
        setSearchResults([]);
        setHasSearched(false);
    };

    if (selectedDetailItem) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-[fade-in_0.2s_ease-out]">
                <div className="relative w-full max-w-md overflow-hidden bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
                    <FoodDetailView
                        food={selectedDetailItem}
                        onClose={() => setSelectedDetailItem(null)}
                        onAdd={handleAddFromDetail}
                    />
                </div>
            </div>
        );
    }

    const renderContent = () => {
        if (showScanner) {
            return <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />;
        }
        switch (activeTab) {
            case 'search':
                return (
                    <div className="flex flex-col space-y-2">
                        {isSearching ? (
                            <div className="flex justify-center py-12">
                                <Spinner size={32} />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((food, index) => (
                                <SearchResultItem
                                    key={`${food.id || index}-search`}
                                    item={food}
                                    onAdd={() => handleSelectSearchResult(food)}
                                />
                            ))
                        ) : hasSearched && searchTerm.length >= 3 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-black/5 dark:bg-white/5 rounded-[24px] ring-1 ring-black/5 dark:ring-white/10 mt-4">
                                <div className="w-16 h-16 bg-bg-primary rounded-[20px] flex items-center justify-center mb-4 ring-1 ring-black/5 dark:ring-white/10 shadow-sm">
                                    <Search size={28} className="text-text-muted opacity-50" strokeWidth={2} />
                                </div>
                                <h3 className="text-lg font-bold text-text-primary mb-1">Sin resultados</h3>
                                <p className="text-text-secondary text-sm font-medium">No se encontraron alimentos.</p>
                            </div>
                        ) : !hasSearched && searchTerm.length >= 3 ? (
                            <div className="text-center text-text-secondary py-16 flex flex-col items-center opacity-60">
                                <p className="font-bold">Pulsa Enter o la Lupa para buscar.</p>
                            </div>
                        ) : searchTerm.length > 0 && searchTerm.length < 3 ? (
                            <div className="text-center text-text-secondary py-16 flex flex-col items-center opacity-60">
                                <p className="font-bold">Escribe al menos 3 letras...</p>
                            </div>
                        ) : null}

                        {!searchTerm && !isSearching && (
                            <div className="text-center text-text-secondary py-16 flex flex-col items-center opacity-50">
                                <Search size={48} className="mb-4" strokeWidth={1.5} />
                                <p className="font-bold">Escribe arriba y pulsa Enter</p>
                            </div>
                        )}
                    </div>
                );
            case 'favorites':
                return <FavoritesList
                    favorites={paginatedFavorites}
                    onAdd={handleAddFavoriteItem}
                    onEdit={handleEditFavorite}
                    onDelete={handleDeleteFavorite}
                    currentPage={favoritesPage}
                    totalPages={totalPages}
                    onPageChange={setFavoritesPage}
                />;
            case 'recent':
                return <RecentList
                    items={filteredRecents}
                    onAdd={handleAddRecentItem}
                    isLoading={isLoadingRecents}
                />;
            case 'manual':
                return (
                    <ManualEntryForm
                        onAddManual={handleAddManualItem}
                        onSaveSingle={async (data) => {
                            await handleSaveSingle(data);
                            cancelMealReminder();
                        }}
                        onSaveEdit={handleSaveEdit}
                        onSaveListItem={handleSaveListItem}
                        isLoading={isLoading}
                        isEditing={isEditingLog || !!editingFavorite}
                        editingListItem={itemsToAdd.find(item => item.tempId === editingListItemId)}
                        showFavoriteToggle={!editingFavorite}
                        formState={manualFormState}
                        onFormStateChange={setManualFormState}
                        isUploading={isUploading}
                        onImageUpload={handleImageUpload}
                        editingFavorite={editingFavorite}
                        isPer100g={isPer100g}
                        setIsPer100g={setIsPer100g}
                    />
                );
            default: return null;
        }
    };

    if (showScanner) {
        return (
            <div className="fixed inset-0 bg-bg-primary z-[70] flex flex-col p-4 animate-[slide-in-up_0.3s]">
                <div className="relative flex-grow">
                    {renderContent()}
                </div>
                <button onClick={() => setShowScanner(false)} className="mt-4 w-full py-4 bg-black/5 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 text-text-primary font-bold rounded-[20px] active:scale-95 transition-all">Cancelar</button>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md animate-[fade-in_0.3s_ease-out] p-4 sm:p-0 pb-12 md:pb-0">
                <div className="relative w-full max-w-lg p-0 m-0 sm:m-4 flex flex-col h-full max-h-[85dvh] sm:h-auto sm:max-h-[90vh] bg-bg-primary rounded-[32px] ring-1 ring-black/5 dark:ring-white/10 shadow-2xl animate-[slide-up_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
                    
                    {/* Header: Cambio aquí para line-clamp-2 y leading-tight en el título */}
                    <div className="p-6 sm:p-8 pb-5 flex items-center justify-between border-b border-black/5 dark:border-white/10 flex-shrink-0 bg-black/5 dark:bg-white/5 rounded-t-[32px]">
                        <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight line-clamp-2 leading-tight pr-4 text-text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors flex-shrink-0 text-text-secondary hover:text-text-primary active:scale-95"><X size={20} strokeWidth={2.5} /></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col min-h-0">
                        {!(isEditingLog || editingFavorite) && (
                            <div className="p-6 sm:p-8 pt-6 pb-4 flex-shrink-0">
                                {(activeTab === 'search' || activeTab === 'favorites' || activeTab === 'recent') && (
                                    <div className="relative mb-6 flex items-center">
                                        <input
                                            type="text"
                                            placeholder={activeTab === 'search' ? "Buscar alimento..." : "Filtrar lista..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            onKeyDown={activeTab === 'search' ? handleKeyDown : undefined}
                                            autoFocus={activeTab === 'search'}
                                            className="w-full pl-5 pr-14 py-3.5 bg-black/5 dark:bg-white/5 border-none ring-1 ring-black/5 dark:ring-white/10 rounded-[20px] text-text-primary font-bold placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all shadow-inner"
                                        />
                                        <button
                                            onClick={activeTab === 'search' ? executeSearch : undefined}
                                            className={`absolute right-3 p-2 rounded-[12px] transition-all active:scale-95 ${activeTab === 'search' ? 'bg-accent/10 text-accent hover:bg-accent hover:text-white cursor-pointer' : 'text-text-muted cursor-default'}`}
                                            title="Buscar"
                                        >
                                            <Search size={18} strokeWidth={2.5} />
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {addModeType !== 'manual' && !(isEditingLog || editingFavorite || editingListItemId) && (
                                        <>
                                            <TabButton active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
                                                <Search size={16} /> Buscar
                                            </TabButton>
                                            <TabButton active={activeTab === 'favorites'} onClick={() => { setActiveTab('favorites'); }}>
                                                <BookMarked size={16} /> Favoritas
                                            </TabButton>
                                            <TabButton active={activeTab === 'recent'} onClick={() => { setActiveTab('recent'); }}>
                                                <Clock size={16} /> Recientes
                                            </TabButton>
                                        </>
                                    )}

                                    {itemsToAdd.length === 0 && !(isEditingLog || editingFavorite || editingListItemId) && (
                                        <>
                                            <TabButton active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); }} disabled={addModeType === 'list'}>
                                                <Edit size={16} /> Manual
                                            </TabButton>
                                            <TabButton active={false} onClick={() => setShowScanner(true)} disabled={addModeType === 'list'}>
                                                <QrCode size={16} /> Escanear
                                            </TabButton>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Contenido: Si estamos editando y el título creció, usamos pt-4 para que el form no se pegue al borde */}
                        <div className={`overflow-y-auto px-6 sm:px-8 pb-6 sm:pb-8 flex-grow custom-scrollbar ${(isEditingLog || editingFavorite) ? 'pt-4' : ''}`}>
                            {renderContent()}
                        </div>
                    </div>

                    {!(isEditingLog || editingFavorite) && itemsToAdd.length > 0 && (
                        <div className="p-6 sm:p-8 border-t border-black/5 dark:border-white/10 flex-shrink-0 animate-[fade-in-up_0.3s_ease-out] bg-bg-primary z-10 rounded-b-[32px]">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-extrabold text-text-primary uppercase tracking-wider text-xs">Añadir ({itemsToAdd.length})</h4>
                            </div>
                            <div className="space-y-3 max-h-32 overflow-y-auto mb-5 pr-2 custom-scrollbar">
                                {itemsToAdd.map(item =>
                                    <SelectedItem key={item.tempId} item={item} onRemove={handleRemoveItem} onToggleFavorite={handleToggleFavorite} onEdit={handleEditListItem} />
                                )}
                            </div>
                            <button
                                onClick={async () => {
                                    await handleSaveList();
                                    cancelMealReminder();
                                }}
                                disabled={isLoading}
                                className={`w-full flex items-center justify-center py-4 rounded-[20px] bg-accent text-white font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-accent/20 ${isLoading ? 'opacity-60 cursor-not-allowed' : 'disabled:opacity-60'}`}
                            >
                                {isLoading ? <Spinner size={20} color="white" className="mr-2" /> : <Plus size={20} strokeWidth={2.5} className="mr-2" />}
                                {isLoading ? 'Guardando...' : `Añadir ${itemsToAdd.length} Alimento${itemsToAdd.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {mealToDelete && (<ConfirmationModal
                title="Confirmar Eliminación"
                message={`¿Seguro que quieres eliminar "${mealToDelete.name}" de tus favoritos?`}
                onConfirm={confirmDeleteFavorite}
                onCancel={() => setMealToDelete(null)}
                confirmText="Eliminar"
            />)}
        </>
    );
};

export default NutritionLogModal;