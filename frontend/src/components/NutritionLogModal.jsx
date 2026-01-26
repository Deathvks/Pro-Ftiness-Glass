/* frontend/src/components/NutritionLogModal.jsx */
import React, { useState, useEffect } from 'react';
import { X, Search, BookMarked, Clock, Edit, QrCode, Plus } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import Spinner from './Spinner';
import ConfirmationModal from './ConfirmationModal';
import { useNutritionModal } from '../hooks/useNutritionModal';
import { searchFoods } from '../services/nutritionService';

import TabButton from './nutrition/logModal/TabButton';
import ManualEntryForm from './nutrition/logModal/ManualEntryForm';
import SelectedItem from './nutrition/logModal/SelectedItem';
import FavoritesList from './nutrition/logModal/FavoritesList';
import RecentList from './nutrition/logModal/RecentList';
import SearchResultItem from './nutrition/logModal/SearchResultItem';

import FoodDetailView from './nutrition/logModal/FoodDetailView';

// CORRECCIÓN: Añadida prop isLoading para deshabilitar botón
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

    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const [selectedDetailItem, setSelectedDetailItem] = useState(null);

    useEffect(() => {
        if (activeTab !== 'search' || !searchTerm.trim()) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchFoods(searchTerm);
                setSearchResults(results);
            } catch (error) {
                console.error("Error buscando alimentos:", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, activeTab]);

    const handleSelectSearchResult = (food) => {
        const foodData = {
            id: food.id, // Preservamos ID si viene de la API
            name: food.name || food.description || 'Alimento', // --- CORRECCIÓN: 'name' es obligatorio para favoritesService
            description: food.name || food.description || 'Alimento',
            calories: food.calories || 0,
            protein_g: food.protein_g || food.protein || 0,
            carbs_g: food.carbs_g || food.carbs || 0,
            fats_g: food.fats_g || food.fat || 0,
            // --- CORRECCIÓN SUGAR: Mapear azúcar explícitamente ---
            sugars_g: food.sugars_g || food.sugars || 0,
            
            weight_g: food.weight_g || 100,
            serving_weight_g: food.serving_weight_g,
            image_url: food.image_url,
            brand: food.brand,
            
            calories_per_100g: food.calories_per_100g,
            protein_per_100g: food.protein_per_100g,
            carbs_per_100g: food.carbs_per_100g,
            fat_per_100g: food.fat_per_100g,
            // --- CORRECCIÓN SUGAR: Mapear azúcar por 100g ---
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
    };

    if (selectedDetailItem) {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.2s]">
                <div className="relative w-11/12 max-w-md overflow-hidden m-4 bg-bg-primary rounded-2xl border border-glass-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
                            <div className="flex justify-center py-8">
                                <Spinner size={30} />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((food, index) => (
                                <SearchResultItem
                                    key={`${food.id || index}-search`}
                                    item={food}
                                    onAdd={() => handleSelectSearchResult(food)}
                                />
                            ))
                        ) : (
                            searchTerm && (
                                <p className="text-center text-text-secondary py-8">
                                    No se encontraron resultados.
                                </p>
                            )
                        )}
                        {!searchTerm && !isSearching && (
                            <div className="text-center text-text-secondary py-8 flex flex-col items-center opacity-50">
                                <Search size={48} className="mb-2" />
                                <p>Escribe arriba para buscar</p>
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
                        onSaveSingle={handleSaveSingle}
                        onSaveEdit={handleSaveEdit}
                        onSaveListItem={handleSaveListItem}
                        isLoading={isLoading} // También pasamos isLoading aquí si es necesario
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
                <button onClick={() => setShowScanner(false)} className="mt-4 w-full py-3 bg-bg-secondary text-text-primary font-bold rounded-xl">Cancelar</button>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out] p-4 sm:p-0 pb-12 md:pb-0">
                <div className="relative w-full max-w-lg p-0 m-0 sm:m-4 flex flex-col h-full max-h-[85dvh] sm:h-auto sm:max-h-[90vh] bg-bg-primary rounded-2xl border border-glass-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                        <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col min-h-0">
                        {!(isEditingLog || editingFavorite) && (
                            <div className="p-5 flex-shrink-0">
                                {(activeTab === 'search' || activeTab === 'favorites' || activeTab === 'recent') && (
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input
                                            type="text"
                                            placeholder={activeTab === 'search' ? "Buscar en base de datos..." : "Filtrar lista..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus={activeTab === 'search'}
                                            className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                                        />
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

                        <div className="overflow-y-auto px-5 pb-5 flex-grow overscroll-contain">
                            {renderContent()}
                        </div>
                    </div>

                    {!(isEditingLog || editingFavorite) && itemsToAdd.length > 0 && (
                        <div className="p-5 border-t border-glass-border flex-shrink-0 animate-[fade-in-up_0.3s_ease-out] bg-bg-primary z-10">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-text-primary">Añadir ({itemsToAdd.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                                {itemsToAdd.map(item =>
                                    <SelectedItem key={item.tempId} item={item} onRemove={handleRemoveItem} onToggleFavorite={handleToggleFavorite} onEdit={handleEditListItem} />
                                )}
                            </div>
                            {/* CORRECCIÓN: Botón deshabilitado si isLoading es true */}
                            <button
                                onClick={handleSaveList}
                                disabled={isLoading}
                                className={`w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white dark:text-bg-secondary font-bold hover:scale-[1.01] transition ${isLoading ? 'opacity-60 cursor-not-allowed' : 'disabled:opacity-60'}`}
                            >
                                {isLoading ? <Spinner size={20} className="mr-2" /> : <Plus size={18} className="mr-2" />}
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