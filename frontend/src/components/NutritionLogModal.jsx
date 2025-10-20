/* frontend/src/components/NutritionLogModal.jsx */
import React from 'react';
import { X, BookMarked, Search, QrCode, Clock, Edit } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import Spinner from '../components/Spinner';
import ConfirmationModal from './ConfirmationModal';
import GlassCard from './GlassCard';

import TabButton from './nutrition/logModal/TabButton';
import FavoritesList from './nutrition/logModal/FavoritesList';
import RecentList from './nutrition/logModal/RecentList';
import ManualEntryForm from './nutrition/logModal/ManualEntryForm';
import SelectedItem from './nutrition/logModal/SelectedItem';
import { useNutritionModal } from '../hooks/useNutritionModal';

const NutritionLogModal = (props) => {
    // --- Llamada ÚNICA al hook ---
    const {
        isEditingLog, editingFavorite, searchTerm, setSearchTerm, activeTab, setActiveTab, itemsToAdd,
        favoritesPage, setFavoritesPage, mealToDelete, setMealToDelete, editingListItemId,
        manualFormState, setManualFormState, showScanner, setShowScanner, paginatedFavorites,
        filteredRecents, totalPages, isDarkTheme, handleAddFavoriteItem, handleAddRecentItem,
        handleAddManualItem, handleRemoveItem, handleToggleFavorite, handleEditListItem, handleEditFavorite,
        handleSaveListItem, handleSaveList, handleSaveSingle, handleSaveEdit, handleScanSuccess,
        handleDeleteFavorite, confirmDeleteFavorite, title, addModeType,
    } = useNutritionModal(props);

    const { isLoading, onClose } = props;

    const renderListContent = () => {
        if (activeTab === 'manual') {
            const editingItem = itemsToAdd.find(item => item.tempId === editingListItemId);
            return <ManualEntryForm
                onAddManual={handleAddManualItem}
                isLoading={isLoading}
                onSaveSingle={handleSaveSingle}
                showFavoriteToggle={itemsToAdd.length === 0 && !editingListItemId && !isEditingLog && !editingFavorite}
                isEditing={isEditingLog || !!editingFavorite}
                editingListItem={editingItem}
                onSaveEdit={handleSaveEdit}
                onSaveListItem={handleSaveListItem}
                // --- Usar las variables del hook directamente ---
                formState={manualFormState}
                onFormStateChange={setManualFormState}
            />;
        }
        if (activeTab === 'favorites') {
             return <FavoritesList
                items={paginatedFavorites}
                onAdd={handleAddFavoriteItem}
                onDelete={handleDeleteFavorite}
                onEdit={handleEditFavorite}
                currentPage={favoritesPage}
                totalPages={totalPages}
                onPageChange={setFavoritesPage}
             />;
        }
        if (activeTab === 'recent') {
            return <RecentList items={filteredRecents} onAdd={handleAddRecentItem} onEdit={handleEditFavorite} />;
        }
        return null;
    };

    return (
        <>
            {showScanner && <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                <GlassCard className={`relative w-11/12 max-w-lg p-0 m-4 flex flex-col max-h-[90vh] ${!isDarkTheme ? '!bg-bg-secondary' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                        <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col">
                        {!(isEditingLog || editingFavorite) && (
                            <div className="p-5 flex-shrink-0">
                                {activeTab !== 'manual' && (
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                        <input type="text" placeholder="Buscar comida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent" />
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <TabButton active={activeTab === 'favorites'} onClick={() => { setActiveTab('favorites'); handleEditListItem(null); handleEditFavorite(null); }} disabled={addModeType === 'manual'}>
                                        <BookMarked size={16} /> Favoritas
                                    </TabButton>
                                    <TabButton active={activeTab === 'recent'} onClick={() => { setActiveTab('recent'); handleEditListItem(null); handleEditFavorite(null); }} disabled={addModeType === 'manual'}>
                                        <Clock size={16} /> Recientes
                                    </TabButton>
                                    <TabButton active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); handleEditListItem(null); handleEditFavorite(null); }} disabled={addModeType === 'list'}>
                                        <Edit size={16} /> Manual
                                    </TabButton>
                                    <TabButton active={false} onClick={() => setShowScanner(true)} disabled={addModeType === 'list'}>
                                        <QrCode size={16} /> Escanear
                                    </TabButton>
                                </div>
                            </div>
                        )}
                        <div className="overflow-y-auto px-5 pb-3 flex-grow min-h-[200px]">
                            {renderListContent()}
                        </div>
                    </div>

                    {!isEditingLog && !editingFavorite && itemsToAdd.length > 0 && (
                        <div className="p-5 border-t border-glass-border flex-shrink-0 animate-[fade-in-up_0.3s_ease-out]">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold text-text-primary">Añadir ({itemsToAdd.length})</h4>
                            </div>
                            <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                                {itemsToAdd.map(item =>
                                    <SelectedItem key={item.tempId} item={item} onRemove={handleRemoveItem} onToggleFavorite={handleToggleFavorite} onEdit={handleEditListItem} />
                                )}
                            </div>
                            <button onClick={handleSaveList} disabled={isLoading} className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white dark:text-bg-secondary font-bold hover:scale-[1.01] transition disabled:opacity-60">{isLoading ? <Spinner /> : `Añadir ${itemsToAdd.length} Alimento${itemsToAdd.length > 1 ? 's' : ''}`}</button>
                        </div>
                    )}
                </GlassCard>
            </div>
            {/* --- CORREGIDO: Usar la función `setMealToDelete` directamente --- */}
            {mealToDelete && (<ConfirmationModal message={`¿Seguro que quieres eliminar "${mealToDelete.name}" de tus favoritos?`} onConfirm={confirmDeleteFavorite} onCancel={() => setMealToDelete(null)} isLoading={isLoading} confirmText="Eliminar" />)}
        </>
    );
};

export default NutritionLogModal;