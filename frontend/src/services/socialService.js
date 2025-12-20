/* frontend/src/services/socialService.js */
import apiClient from './apiClient';

const socialService = {
    // Buscar usuarios por nombre o username
    searchUsers: async (query) => {
        return await apiClient(`/social/search?query=${encodeURIComponent(query)}`);
    },

    // Enviar solicitud de amistad
    sendFriendRequest: async (targetUserId) => {
        return await apiClient('/social/request', {
            body: { targetUserId }
        });
    },

    // Obtener solicitudes pendientes (enviadas y recibidas)
    getFriendRequests: async () => {
        return await apiClient('/social/requests');
    },

    // Responder a una solicitud (accept/reject)
    respondFriendRequest: async (requestId, action) => {
        return await apiClient('/social/respond', {
            body: { requestId, action }
        });
    },

    // Obtener lista de amigos
    getFriends: async () => {
        return await apiClient('/social/friends');
    },

    // Obtener leaderboard global
    getLeaderboard: async () => {
        return await apiClient('/social/leaderboard');
    },

    // Eliminar a un amigo
    removeFriend: async (friendId) => {
        return await apiClient('/social/remove', {
            body: { friendId }
        });
    },

    // Obtener perfil público de un usuario
    getPublicProfile: async (userId) => {
        return await apiClient(`/social/profile/${userId}`);
    }
};

export default socialService;