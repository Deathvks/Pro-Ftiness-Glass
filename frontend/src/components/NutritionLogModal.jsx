/*
frontend/src/components/NutritionLogModal.jsx
*/
import React from 'react';
import { X, Star, Trash2, Edit, Check, Plus, Search, Camera, BookMarked, Clock, QrCode } from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import Spinner from './Spinner';
import ConfirmationModal from './ConfirmationModal';
import { useNutritionModal } from '../hooks/useNutritionModal';
import GlassCard from './GlassCard';

import TabButton from './nutrition/logModal/TabButton';
import ManualEntryForm from './nutrition/logModal/ManualEntryForm';
import SelectedItem from './nutrition/logModal/SelectedItem';
import FavoritesList from './nutrition/logModal/FavoritesList';
import RecentList from './nutrition/logModal/RecentList';

const NutritionLogModal = ({ mealType, onClose, onSave, logToEdit }) => {
    const {
        isEditingLog, editingFavorite, searchTerm, setSearchTerm, activeTab, setActiveTab,
        itemsToAdd, favoritesPage, setFavoritesPage, mealToDelete, setMealToDelete,
        editingListItemId, manualFormState, setManualFormState, showScanner, setShowScanner,
        paginatedFavorites, filteredRecents, isLoadingRecents, totalPages, isDarkTheme,
        handleAddManualItem, handleAddFavoriteItem, handleAddRecentItem, handleRemoveItem,
        handleToggleFavorite, handleEditListItem, handleEditFavorite, handleSaveListItem,
        handleSaveList, handleSaveSingle, handleSaveEdit, handleScanSuccess,
        handleDeleteFavorite, confirmDeleteFavorite, title, addModeType,
        isUploading, handleImageUpload,
        // --- INICIO DE LA MODIFICACIÓN ---
        // Extraer isPer100g y setIsPer100g del hook
        isPer100g, setIsPer100g
        // --- FIN DE LA MODIFICACIÓN ---
    } = useNutritionModal({ mealType, onSave, onClose, logToEdit });

    const renderContent = () => {
        if (showScanner) {
            return <BarcodeScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />;
        }
        switch (activeTab) {
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
                        isLoading={false}
                        isEditing={isEditingLog || !!editingFavorite}
                        editingListItem={itemsToAdd.find(item => item.tempId === editingListItemId)}
                        showFavoriteToggle={!editingFavorite}
                        formState={manualFormState}
                        onFormStateChange={setManualFormState}
                        isUploading={isUploading}
                        onImageUpload={handleImageUpload}
                        editingFavorite={editingFavorite} // Pasar prop editingFavorite
                        // --- INICIO DE LA MODIFICACIÓN ---
                        // Pasar isPer100g y setIsPer100g al formulario
                        isPer100g={isPer100g}
                        setIsPer100g={setIsPer100g}
                        // --- FIN DE LA MODIFICACIÓN ---
                    />
                );
            default: return null;
        }
    };


    if (showScanner) {
        return (
            <div className="fixed inset-0 bg-bg-primary z-50 flex flex-col p-4 animate-[slide-in-up_0.3s]">
                <div className="relative flex-grow">
                    {renderContent()}
                </div>
                 <button onClick={() => setShowScanner(false)} className="mt-4 w-full py-3 bg-bg-secondary text-text-primary font-bold rounded-xl">Cancelar</button>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-[fade-in_0.3s_ease-out]">
                <GlassCard className={`relative w-11/12 max-w-lg p-0 m-4 flex flex-col max-h-[90vh] ${!isDarkTheme ? '!bg-bg-secondary' : ''}`} onClick={(e) => e.stopPropagation()}>
                    <div className="p-5 flex items-center justify-between border-b border-glass-border flex-shrink-0">
                        <h3 className="text-xl font-bold truncate pr-4 text-text-primary">{title}</h3>
                        <button onClick={onClose} className="p-2 -m-2 rounded-full hover:bg-bg-primary transition flex-shrink-0"><X size={20} className="text-text-secondary" /></button>
                    </div>

                    <div className="flex-grow overflow-hidden flex flex-col">
                        {!(isEditingLog || editingFavorite) && (
                            <div className="p-5 flex-shrink-0">

                                {(activeTab === 'favorites' || activeTab === 'recent') && (
                                     <div className="relative mb-4">
                                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                                         <input
                                            type="text"
                                            placeholder="Buscar comida..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-glass-border rounded-xl text-text-primary focus:outline-none focus:border-accent"
                                        />
                                     </div>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    {/* Estas pestañas son visibles si NO estamos en modo manual */}
                                    {addModeType !== 'manual' && (
                                        <>
                                            {/* --- INICIO DE LA CORRECCIÓN --- */}
                                            <TabButton active={activeTab === 'favorites'} onClick={() => { setActiveTab('favorites'); handleEditListItem(null); handleEditFavorite(null); }}>
                                                <BookMarked size={16} /> Favoritas
                                            </TabButton>
                                            {/* --- FIN DE LA CORRECCIÓN (Era </Button>) --- */}
                                            <TabButton active={activeTab === 'recent'} onClick={() => { setActiveTab('recent'); handleEditListItem(null); handleEditFavorite(null); }}>
                                                <Clock size={16} /> Recientes
                                            </TabButton>
                                        </>
                                    )}

                                    {/* Estas pestañas solo son visibles si la lista temporal está vacía */}
                                    {itemsToAdd.length === 0 && (
                                        <>
                                            <TabButton active={activeTab === 'manual'} onClick={() => { setActiveTab('manual'); handleEditListItem(null); handleEditFavorite(null); }} disabled={addModeType === 'list'}>
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
                        <div className="overflow-y-auto px-5 pb-3 flex-grow min-h-[200px]">
                            {renderContent()}
                        </div>
                    </div>

                     {!(isEditingLog || editingFavorite) && itemsToAdd.length > 0 && (
                         <div className="p-5 border-t border-glass-border flex-shrink-0 animate-[fade-in-up_0.3s_ease-out]">
                             <div className="flex justify-between items-center mb-2">
                                 <h4 className="font-semibold text-text-primary">Añadir ({itemsToAdd.length})</h4>
                             </div>
                             <div className="space-y-2 max-h-32 overflow-y-auto mb-4 pr-1">
                                 {itemsToAdd.map(item =>
                                     <SelectedItem key={item.tempId} item={item} onRemove={handleRemoveItem} onToggleFavorite={handleToggleFavorite} onEdit={handleEditListItem} />
                                 )}
                             </div>
                             <button onClick={handleSaveList} disabled={false} className="w-full flex items-center justify-center py-3 rounded-xl bg-accent text-white dark:text-bg-secondary font-bold hover:scale-[1.01] transition disabled:opacity-60">
                                <Plus size={18} className="mr-2" />
                                {`Añadir ${itemsToAdd.length} Alimento${itemsToAdd.length > 1 ? 's' : ''}`}
                             </button>
                         </div>
                     )}
                </GlassCard>
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