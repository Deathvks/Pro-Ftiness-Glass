/* frontend/src/store/socialSlice.js */
import socialService from '../services/socialService';

export const createSocialSlice = (set, get) => ({
    // --- Estado Inicial ---
    socialFriends: [],
    socialRequests: { received: [], sent: [] }, // Estructura preparada para recibidas/enviadas
    socialSearchResults: [],
    socialLeaderboard: [],
    socialViewedProfile: null,
    isSocialLoading: false,
    socialError: null,

    // --- Acciones ---

    // Buscar usuarios
    searchUsers: async (query) => {
        set({ isSocialLoading: true, socialError: null });
        try {
            const results = await socialService.searchUsers(query);
            set({ socialSearchResults: results, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    // Limpiar resultados de búsqueda
    clearSocialSearch: () => {
        set({ socialSearchResults: [] });
    },

    // Obtener lista de amigos
    fetchFriends: async () => {
        set({ isSocialLoading: true, socialError: null });
        try {
            const friends = await socialService.getFriends();
            set({ socialFriends: friends, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    // Obtener solicitudes pendientes (Recibidas y Enviadas)
    fetchFriendRequests: async () => {
        // No activamos loading global para evitar parpadeos en actualizaciones de fondo
        try {
            const requests = await socialService.getFriendRequests();
            // El backend devuelve: { received: [...], sent: [...] }
            set({ socialRequests: requests });
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    },

    // Enviar solicitud de amistad
    sendFriendRequest: async (targetUserId) => {
        set({ isSocialLoading: true, socialError: null });
        try {
            await socialService.sendFriendRequest(targetUserId);
            // Actualizamos solicitudes para que aparezca inmediatamente en "Enviadas"
            await get().fetchFriendRequests();
            set({ isSocialLoading: false });
            return true;
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
            return false;
        }
    },

    // Responder solicitud (aceptar/rechazar)
    respondFriendRequest: async (requestId, action) => {
        set({ isSocialLoading: true, socialError: null });
        try {
            await socialService.respondFriendRequest(requestId, action);
            await get().fetchFriendRequests();
            if (action === 'accept') {
                await get().fetchFriends();
            }
            set({ isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    // Eliminar amigo
    removeFriend: async (friendId) => {
        set({ isSocialLoading: true, socialError: null });
        try {
            await socialService.removeFriend(friendId);
            // Actualización optimista
            const currentFriends = get().socialFriends;
            set({
                socialFriends: currentFriends.filter(f => f.id !== friendId),
                isSocialLoading: false
            });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
            // Si falla, recargamos la lista real
            get().fetchFriends();
        }
    },

    // Obtener Leaderboard
    fetchLeaderboard: async () => {
        set({ isSocialLoading: true, socialError: null });
        try {
            const leaderboard = await socialService.getLeaderboard();
            set({ socialLeaderboard: leaderboard, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    // Ver perfil público
    fetchPublicProfile: async (userId) => {
        // Limpiamos el perfil anterior para evitar flasheos de datos viejos
        set({ isSocialLoading: true, socialError: null, socialViewedProfile: null });
        try {
            const profile = await socialService.getPublicProfile(userId);
            // Ahora profile puede incluir { warning: "..." } si no son amigos
            set({ socialViewedProfile: profile, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    // Limpiar perfil visto
    clearViewedProfile: () => {
        set({ socialViewedProfile: null });
    }
});