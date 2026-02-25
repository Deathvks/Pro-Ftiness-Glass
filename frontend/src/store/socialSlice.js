/* frontend/src/store/socialSlice.js */
import socialService from '../services/socialService';
import { getSocket } from '../services/socket';

export const createSocialSlice = (set, get) => ({
    // --- Estado Inicial ---
    socialFriends: [],
    socialRequests: { received: [], sent: [] },
    socialSearchResults: [],
    socialLeaderboard: [],
    socialViewedProfile: null,
    isSocialLoading: false,
    socialError: null,

    // --- Acciones ---

    searchUsers: async (query) => {
        set({ isSocialLoading: true, socialError: null });
        try {
            const results = await socialService.searchUsers(query);
            set({ socialSearchResults: results, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    clearSocialSearch: () => {
        set({ socialSearchResults: [] });
    },

    fetchFriends: async () => {
        try {
            const friends = await socialService.getFriends();
            set({ socialFriends: friends });
        } catch (error) {
            set({ socialError: error.message });
        }
    },

    fetchFriendRequests: async () => {
        try {
            const requests = await socialService.getFriendRequests();
            set({ socialRequests: requests });
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    },

    sendFriendRequest: async (targetUserId) => {
        try {
            await socialService.sendFriendRequest(targetUserId);
            // Sincronización silenciosa
            get().fetchFriendRequests();
            return true;
        } catch (error) {
            set({ socialError: error.message });
            return false;
        }
    },

    respondFriendRequest: async (requestId, action) => {
        // ACTUALIZACIÓN OPTIMISTA: Quitamos la solicitud de la vista al instante
        const currentRequests = get().socialRequests;
        const updatedReceived = currentRequests.received.filter(r => r.id !== requestId);
        set({ socialRequests: { ...currentRequests, received: updatedReceived } });

        try {
            await socialService.respondFriendRequest(requestId, action);
            
            // Sincronizamos silenciosamente en segundo plano
            get().fetchFriendRequests();
            if (action === 'accept') {
                get().fetchFriends();
            }
        } catch (error) {
            set({ socialError: error.message });
            // Si falla, revertimos el estado trayendo lo real
            get().fetchFriendRequests();
        }
    },

    removeFriend: async (friendId) => {
        // ACTUALIZACIÓN OPTIMISTA
        const currentFriends = get().socialFriends;
        set({ socialFriends: currentFriends.filter(f => f.id !== friendId) });

        try {
            await socialService.removeFriend(friendId);
        } catch (error) {
            set({ socialError: error.message });
            get().fetchFriends();
        }
    },

    fetchLeaderboard: async () => {
        try {
            const leaderboard = await socialService.getLeaderboard();
            set({ socialLeaderboard: leaderboard });
        } catch (error) {
            set({ socialError: error.message });
        }
    },

    fetchPublicProfile: async (userId) => {
        set({ isSocialLoading: true, socialError: null, socialViewedProfile: null });
        try {
            const profile = await socialService.getPublicProfile(userId);
            set({ socialViewedProfile: profile, isSocialLoading: false });
        } catch (error) {
            set({ socialError: error.message, isSocialLoading: false });
        }
    },

    clearViewedProfile: () => {
        set({ socialViewedProfile: null });
    },

    // --- WEBSOCKETS (Tiempo Real) ---
    subscribeToSocialEvents: () => {
        const socket = getSocket();
        if (!socket) return;

        // Limpiar para evitar duplicados si se llama varias veces
        socket.off('new_friend_request');
        socket.off('friend_request_accepted');
        socket.off('friend_removed');

        socket.on('new_friend_request', () => {
            get().fetchFriendRequests();
        });

        socket.on('friend_request_accepted', () => {
            get().fetchFriends();
            get().fetchFriendRequests();
        });

        socket.on('friend_removed', () => {
            get().fetchFriends();
        });
    }
});