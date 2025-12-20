/* frontend/src/pages/Social.jsx */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Users,
    UserPlus,
    Trophy,
    Search,
    UserX,
    Check,
    X,
    Medal,
    ChevronRight,
    ChevronLeft,
    Loader
} from 'lucide-react';
import useAppStore from '../store/useAppStore';
import { useToast } from '../hooks/useToast';
import GlassCard from '../components/GlassCard';
import Spinner from '../components/Spinner';

export default function Social({ setView }) {
    // Usamos useSearchParams para mantener la pestaña en la URL (persistencia al recargar)
    const [searchParams, setSearchParams] = useSearchParams();

    // El estado inicial sale de la URL, o por defecto 'friends'
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'friends');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchPage, setSearchPage] = useState(1);

    const [friendsPage, setFriendsPage] = useState(1);
    const FRIENDS_PER_PAGE = 5;

    const [highlightedId, setHighlightedId] = useState(null);
    const ITEMS_PER_PAGE = 10;

    const { showToast } = useToast();

    const {
        userProfile,
        socialFriends,
        socialRequests,
        socialSearchResults,
        socialLeaderboard,
        isSocialLoading,
        searchUsers,
        fetchFriends,
        fetchFriendRequests,
        sendFriendRequest,
        respondFriendRequest,
        removeFriend,
        fetchLeaderboard,
    } = useAppStore();

    useEffect(() => {
        fetchFriends();
        fetchFriendRequests();
        fetchLeaderboard();
    }, [fetchFriends, fetchFriendRequests, fetchLeaderboard]);

    // Sincronizar URL -> Estado y manejar Highlight
    useEffect(() => {
        const tab = searchParams.get('tab');
        const highlight = searchParams.get('highlight');

        if (tab && ['friends', 'requests', 'search', 'leaderboard'].includes(tab)) {
            setActiveTab(tab);
        }

        if (highlight) {
            setHighlightedId(parseInt(highlight));
            const timer = setTimeout(() => setHighlightedId(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [searchParams]);

    // Función para cambiar pestaña y actualizar URL
    const changeTab = (newTab) => {
        setActiveTab(newTab);
        setSearchParams({ tab: newTab }); // Esto actualiza la URL
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim()) {
                setSearchPage(1);
                searchUsers(searchQuery);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchUsers]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            setSearchPage(1);
            searchUsers(searchQuery);
        }
    };

    const handleSendRequest = async (e, targetUserId) => {
        e.stopPropagation();
        const success = await sendFriendRequest(targetUserId);
        if (success) {
            showToast('Solicitud enviada', 'success');
        } else {
            showToast('Error al enviar solicitud', 'error');
        }
    };

    const handleRespond = async (e, requestId, action) => {
        e.stopPropagation();
        await respondFriendRequest(requestId, action);
        showToast(action === 'accept' ? 'Solicitud aceptada' : 'Solicitud rechazada', 'success');
    };

    const handleRemoveFriend = async (e, friendId) => {
        e.stopPropagation();
        if (window.confirm('¿Seguro que quieres eliminar a este amigo?')) {
            await removeFriend(friendId);
            showToast('Amigo eliminado', 'success');
        }
    };

    const goToProfile = (userId) => {
        if (userId === userProfile?.id) {
            setView('profile');
        } else {
            setView('publicProfile', { userId });
        }
    };

    // --- Render Components ---

    const TabButton = ({ id, icon: Icon, label, badge }) => (
        <button
            onClick={() => changeTab(id)} // Usamos changeTab en lugar de setActiveTab directo
            className={`flex-1 flex md:flex-row flex-col items-center md:justify-start justify-center py-3 md:px-4 md:gap-3 gap-1 text-xs md:text-sm font-medium transition-colors relative md:rounded-xl
                ${activeTab === id
                    ? 'text-accent-primary border-b-2 md:border-b-0 border-accent-primary md:bg-accent-primary/10'
                    : 'text-text-secondary hover:text-text-primary md:hover:bg-white/5'
                }`}
        >
            <Icon size={20} className="md:w-5 md:h-5" />
            <span>{label}</span>
            {badge > 0 && (
                <span className="absolute top-2 right-2 md:static md:ml-auto bg-red-500 text-white text-[10px] md:text-xs font-bold w-4 h-4 md:w-5 md:h-5 flex items-center justify-center rounded-full shadow-sm">
                    {badge}
                </span>
            )}
        </button>
    );

    const UserListItem = ({ user, action, subtext }) => {
        const isHighlighted = highlightedId && user.id === highlightedId;

        return (
            <div
                onClick={() => goToProfile(user.id)}
                className={`flex items-center justify-between p-3 border-b border-white/10 last:border-0 transition-all duration-500 cursor-pointer group
                    ${isHighlighted
                        ? 'bg-accent-primary/10 border-l-2 border-l-accent-primary shadow-[inset_0_0_20px_rgba(var(--accent-primary-rgb),0.1)]'
                        : 'hover:bg-white/5'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-bg-secondary flex items-center justify-center overflow-hidden border border-white/10 relative flex-shrink-0">
                        {user.profile_image_url ? (
                            <img src={user.profile_image_url} alt={user.username} className="w-full h-full object-cover" />
                        ) : (
                            <Users size={18} className="text-text-tertiary" />
                        )}
                    </div>
                    <div>
                        <p className={`font-semibold transition-colors line-clamp-1 ${isHighlighted ? 'text-accent-primary' : 'text-text-primary group-hover:text-accent-primary'}`}>
                            {user.username || user.name || 'Usuario'}
                        </p>
                        <p className="text-xs text-text-tertiary line-clamp-1">
                            {subtext || `Nivel ${user.level || 1} • ${user.xp || 0} XP`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    {action}
                    {!action && <ChevronRight size={16} className="text-white/20" />}
                </div>
            </div>
        );
    };

    const renderFriends = () => {
        const totalFriends = socialFriends.length;
        const totalPages = Math.ceil(totalFriends / FRIENDS_PER_PAGE);
        const paginatedFriends = socialFriends.slice(
            (friendsPage - 1) * FRIENDS_PER_PAGE,
            friendsPage * FRIENDS_PER_PAGE
        );

        return (
            <GlassCard>
                <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 border-b border-white/5 pb-2">Mis Amigos ({socialFriends.length})</h3>
                {socialFriends.length === 0 ? (
                    <div className="text-center py-12 text-text-tertiary">
                        <Users size={48} className="mx-auto mb-4 opacity-20" />
                        <p>Aún no tienes amigos agregados.</p>
                        <button
                            onClick={() => changeTab('search')}
                            className="mt-4 text-accent-primary hover:text-accent-primary/80 font-medium text-sm transition-colors"
                        >
                            Buscar personas
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {paginatedFriends.map((friend) => (
                            <UserListItem
                                key={friend.id}
                                user={friend}
                                action={
                                    <button
                                        onClick={(e) => handleRemoveFriend(e, friend.id)}
                                        className="p-2 text-text-tertiary hover:text-red-400 transition-colors z-10"
                                        title="Eliminar amigo"
                                    >
                                        <UserX size={18} />
                                    </button>
                                }
                            />
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex justify-between items-center p-3 border-t border-white/5">
                        <button
                            onClick={() => setFriendsPage(p => Math.max(1, p - 1))}
                            disabled={friendsPage === 1}
                            className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-xs text-text-tertiary">
                            Página {friendsPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setFriendsPage(p => Math.min(totalPages, p + 1))}
                            disabled={friendsPage === totalPages}
                            className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </GlassCard>
        );
    };

    const renderRequests = () => {
        const received = socialRequests?.received || [];
        const sent = socialRequests?.sent || [];

        return (
            <div className="space-y-6">
                <GlassCard>
                    <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 flex items-center gap-2 border-b border-white/5 pb-2">
                        Solicitudes Recibidas
                        {received.length > 0 && <span className="bg-accent-primary text-bg-primary text-xs px-2 py-0.5 rounded-full font-bold">{received.length}</span>}
                    </h3>
                    {received.length === 0 ? (
                        <p className="text-text-tertiary text-center py-8 text-sm">No tienes solicitudes pendientes.</p>
                    ) : (
                        <div className="flex flex-col">
                            {received.map((req) => (
                                <UserListItem
                                    key={req.id}
                                    user={req.Requester}
                                    subtext="Quiere ser tu amigo"
                                    action={
                                        <div className="flex gap-2 z-10">
                                            <button
                                                onClick={(e) => handleRespond(e, req.id, 'accept')}
                                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                                title="Aceptar"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleRespond(e, req.id, 'reject')}
                                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                                title="Rechazar"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    }
                                />
                            ))}
                        </div>
                    )}
                </GlassCard>

                {sent.length > 0 && (
                    <GlassCard>
                        <h3 className="text-lg font-bold text-text-primary mb-4 px-4 pt-4 border-b border-white/5 pb-2">Enviadas</h3>
                        <div className="flex flex-col">
                            {sent.map((req) => (
                                <UserListItem
                                    key={req.id}
                                    user={req.Addressee}
                                    subtext="Solicitud pendiente"
                                    action={
                                        <span className="text-xs text-text-tertiary bg-white/5 px-2 py-1 rounded border border-white/5">Esperando</span>
                                    }
                                />
                            ))}
                        </div>
                    </GlassCard>
                )}
            </div>
        );
    };

    const renderSearch = () => {
        const totalResults = socialSearchResults.length;
        const totalPages = Math.ceil(totalResults / ITEMS_PER_PAGE);
        const paginatedResults = socialSearchResults.slice(
            (searchPage - 1) * ITEMS_PER_PAGE,
            searchPage * ITEMS_PER_PAGE
        );

        return (
            <div className="space-y-4 max-w-xl w-full">
                <form onSubmit={handleSearch}>
                    <GlassCard className="flex items-center px-3 py-2 gap-2 focus-within:border-accent-primary/50 transition-colors">
                        <Search size={20} className="text-text-tertiary ml-1" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre de usuario..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-text-primary flex-1 placeholder-text-tertiary text-sm py-2"
                        />
                        <button
                            type="submit"
                            disabled={isSocialLoading}
                            className="bg-accent-primary text-bg-primary font-bold px-4 py-1.5 rounded-lg active:scale-95 transition-all hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {isSocialLoading ? <Spinner size={18} /> : 'Buscar'}
                        </button>
                    </GlassCard>
                </form>

                {totalResults > 0 && (
                    <GlassCard>
                        <h3 className="text-lg font-bold text-text-primary mb-2 px-4 pt-4 border-b border-white/5 pb-2 flex justify-between items-center">
                            <span>Resultados</span>
                            <span className="text-xs font-medium text-text-tertiary">{totalResults} encontrados</span>
                        </h3>
                        <div className="flex flex-col">
                            {paginatedResults.map((user) => {
                                const isMe = user.id === userProfile?.id;
                                const isFriend = socialFriends.some(f => f.id === user.id);
                                const hasSentRequest = socialRequests?.sent?.some(r => r.addressee_id === user.id);

                                return (
                                    <UserListItem
                                        key={user.id}
                                        user={user}
                                        action={
                                            !isMe && !isFriend && !hasSentRequest ? (
                                                <button
                                                    onClick={(e) => handleSendRequest(e, user.id)}
                                                    className="p-2 bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 z-10 transition-colors"
                                                    title="Enviar solicitud"
                                                >
                                                    <UserPlus size={18} />
                                                </button>
                                            ) : isFriend ? (
                                                <span className="text-xs text-green-400 font-medium px-2 py-1 bg-green-500/10 rounded">Amigo</span>
                                            ) : hasSentRequest ? (
                                                <span className="text-xs text-text-tertiary px-2 py-1 bg-white/5 rounded">Enviada</span>
                                            ) : isMe ? (
                                                <span className="text-xs text-text-tertiary px-2 py-1 bg-white/5 rounded">Tú</span>
                                            ) : null
                                        }
                                    />
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex justify-between items-center p-3 border-t border-white/5">
                                <button
                                    onClick={() => setSearchPage(p => Math.max(1, p - 1))}
                                    disabled={searchPage === 1}
                                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-xs text-text-tertiary">
                                    Página {searchPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setSearchPage(p => Math.min(totalPages, p + 1))}
                                    disabled={searchPage === totalPages}
                                    className="p-1 text-text-tertiary hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-tertiary"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </GlassCard>
                )}

                {totalResults === 0 && searchQuery && !isSocialLoading && (
                    <div className="text-center py-8 text-text-tertiary">
                        <p className="text-sm">No se encontraron usuarios.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderLeaderboard = () => (
        <GlassCard className="overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                    <Trophy className="text-yellow-500" size={20} />
                    Ranking Global
                </h3>
                <span className="text-xs font-medium text-text-tertiary bg-white/10 px-2 py-1 rounded-full">Top 50</span>
            </div>
            <div className="flex flex-col">
                <div className="flex text-xs text-text-tertiary p-3 border-b border-white/5 uppercase tracking-wider font-bold bg-white/5">
                    <span className="w-10 text-center">#</span>
                    <span className="flex-1 pl-2">Atleta</span>
                    <span className="w-16 text-right">Nivel</span>
                    <span className="w-24 text-right">XP</span>
                </div>
                {socialLeaderboard.map((user, index) => {
                    const rank = index + 1;
                    let rankIcon = null;
                    if (rank === 1) rankIcon = <Medal size={20} className="text-yellow-400 drop-shadow-md" />;
                    if (rank === 2) rankIcon = <Medal size={20} className="text-gray-300 drop-shadow-md" />;
                    if (rank === 3) rankIcon = <Medal size={20} className="text-amber-700 drop-shadow-md" />;

                    const isMe = user.id === userProfile?.id;

                    return (
                        <div
                            key={user.id}
                            onClick={() => goToProfile(user.id)}
                            className={`flex items-center p-3 border-b border-white/5 last:border-0 cursor-pointer transition-colors hover:bg-white/10 
                                ${isMe ? 'bg-accent-primary/10 border-l-4 border-l-accent-primary pl-2' : ''}`}
                        >
                            <div className="w-10 flex justify-center font-bold text-text-secondary text-lg">
                                {rankIcon || <span className="text-sm opacity-60">#{rank}</span>}
                            </div>
                            <div className="flex-1 flex items-center gap-3 min-w-0 pl-2">
                                <div className="w-9 h-9 rounded-full bg-bg-secondary overflow-hidden flex-shrink-0 border border-white/10">
                                    {user.profile_image_url ? (
                                        <img src={user.profile_image_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users size={16} className="text-text-tertiary m-auto mt-2" />
                                    )}
                                </div>
                                <span className={`truncate text-sm ${isMe ? 'text-accent-primary font-bold' : 'text-text-primary font-medium'}`}>
                                    {user.username} {isMe && "(Tú)"}
                                </span>
                            </div>
                            <div className="w-16 text-right text-sm text-text-secondary font-medium">{user.level}</div>
                            <div className="w-24 text-right text-sm text-text-primary font-mono font-semibold tracking-tight">{user.xp?.toLocaleString()}</div>
                        </div>
                    );
                })}
            </div>
        </GlassCard>
    );

    return (
        <div className="w-full max-w-7xl mx-auto px-4 pt-6 pb-24 md:pb-8 animate-fade-in">
            <header className="mb-6">
                <div className="hidden md:flex items-center gap-3">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary">
                        Comunidad
                    </h1>
                    {/* AÑADIDO: Badge BETA */}
                    <span className="px-2 py-0.5 rounded-md bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase">
                        BETA
                    </span>
                </div>
                <p className="text-text-tertiary text-sm mt-1">Conecta y compite con otros atletas</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* Navegación (Tabs) */}
                <div className="md:col-span-1">
                    <GlassCard className="flex md:flex-col overflow-hidden md:p-2 sticky md:top-24 z-10">
                        <TabButton
                            id="friends"
                            icon={Users}
                            label="Amigos"
                        />
                        <TabButton
                            id="requests"
                            icon={UserPlus}
                            label="Solicitudes"
                            badge={socialRequests?.received?.length || 0}
                        />
                        <TabButton
                            id="search"
                            icon={Search}
                            label="Buscar"
                        />
                        <TabButton
                            id="leaderboard"
                            icon={Trophy}
                            label="Ranking"
                        />
                    </GlassCard>
                </div>

                {/* Contenido Principal */}
                <div className="md:col-span-3 min-h-[400px]">
                    {activeTab === 'friends' && renderFriends()}
                    {activeTab === 'requests' && renderRequests()}
                    {activeTab === 'search' && renderSearch()}
                    {activeTab === 'leaderboard' && renderLeaderboard()}
                </div>
            </div>
        </div>
    );
}