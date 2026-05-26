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

    // --- Estado Inicial de Historias ---
    stories: [],
    myStories: [],
    activeStoryUser: null,

    // --- Acciones de Usuarios y Amigos ---

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
            get().fetchFriendRequests();
            return true;
        } catch (error) {
            set({ socialError: error.message });
            return false;
        }
    },

    respondFriendRequest: async (requestId, action) => {
        const currentRequests = get().socialRequests;
        const updatedReceived = currentRequests.received.filter(r => r.id !== requestId);
        set({ socialRequests: { ...currentRequests, received: updatedReceived } });

        try {
            await socialService.respondFriendRequest(requestId, action);
            
            get().fetchFriendRequests();
            if (action === 'accept') {
                get().fetchFriends();
            }
        } catch (error) {
            set({ socialError: error.message });
            get().fetchFriendRequests();
        }
    },

    removeFriend: async (friendId) => {
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

    // --- ACCIONES DE HISTORIAS ---

    fetchStories: async (forceUserId = null) => {
        try {
            const feed = await socialService.getStoryFeed();
            
            // Usamos el ID forzado desde el componente si existe, sino caemos al estado global
            const myUserId = forceUserId || get().userProfile?.id;
            
            console.log('[Historias] myUserId activo:', myUserId);
            console.log('[Historias] Grupos recibidos del backend:', feed?.length);

            const localViewed = JSON.parse(localStorage.getItem('viewed_stories_cache') || '[]');
            const isViewedLocally = (id) => localViewed.some(vid => String(vid) === String(id));

            let myFilteredStories = [];
            let friendsStories = [];

            if (feed && feed.length > 0) {
                // Separar de forma estricta convirtiendo a string
                const myStoryGroup = feed.find(group => String(group.userId) === String(myUserId));
                
                if (myStoryGroup) {
                    console.log('[Historias] Encontrado grupo PROPIO con', myStoryGroup.items?.length, 'historias');
                    myFilteredStories = (myStoryGroup.items || []).map(story => ({
                        ...story,
                        // Para nuestras historias, forzamos que no estén vistas a menos que la caché diga lo contrario
                        viewed: isViewedLocally(story.id)
                    }));
                }

                const rawFriendsStories = feed.filter(group => String(group.userId) !== String(myUserId));
                friendsStories = rawFriendsStories.map(group => ({
                    ...group,
                    items: (group.items || []).map(story => ({
                        ...story,
                        viewed: story.viewed || isViewedLocally(story.id)
                    }))
                }));

                friendsStories = friendsStories.map(group => ({
                    ...group,
                    hasUnseen: group.items.some(story => !story.viewed)
                }));
            }

            set({ 
                stories: friendsStories, 
                myStories: myFilteredStories 
            });
        } catch (error) {
            console.error("Error fetching stories:", error);
            set({ socialError: error.message });
        }
    },

    uploadStory: async (file, privacy, isHDR) => {
        try {
            await socialService.uploadStory(file, privacy, isHDR);
            await get().fetchStories();
            return { success: true };
        } catch (error) {
            console.error("Error upload story:", error);
            return { success: false, error: error.message };
        }
    },

    deleteStory: async (storyId) => {
        try {
            await socialService.deleteStory(storyId);
            
            const currentMyStories = get().myStories;
            set({
                myStories: currentMyStories.filter(s => s.id !== storyId)
            });
            
            return true;
        } catch (error) {
            console.error("Error delete story:", error);
            return false;
        }
    },

    markStoryAsViewed: async (storyId) => {
        const localViewed = JSON.parse(localStorage.getItem('viewed_stories_cache') || '[]');
        if (!localViewed.includes(storyId)) {
            localViewed.push(storyId);
            if (localViewed.length > 100) localViewed.shift();
            localStorage.setItem('viewed_stories_cache', JSON.stringify(localViewed));
            console.log('[Historias] Historia marcada como vista en caché local:', storyId);
        }

        const currentMyStories = get().myStories;
        if (currentMyStories.some(s => s.id === storyId)) {
            const updatedMyStories = currentMyStories.map(s => 
                s.id === storyId ? { ...s, viewed: true } : s
            );
            set({ myStories: updatedMyStories });
        } else {
            const currentStories = get().stories;
            const updatedStories = currentStories.map(group => {
                const hasStory = group.items.some(s => s.id === storyId);
                if (!hasStory) return group;

                const updatedItems = group.items.map(s => 
                    s.id === storyId ? { ...s, viewed: true } : s
                );
                
                return { 
                    ...group, 
                    items: updatedItems,
                    hasUnseen: updatedItems.some(item => !item.viewed)
                };
            });
            set({ stories: updatedStories });
        }

        try {
            await socialService.markStoryAsViewed(storyId);
        } catch (error) {
            console.warn("Fallo al marcar historia como vista en BD", error);
        }
    },

    setActiveStoryUser: (userId) => {
        set({ activeStoryUser: userId });
    },

    // --- WEBSOCKETS (Tiempo Real) ---
    
    subscribeToStories: () => {
        const socket = getSocket();
        if (!socket) return;

        socket.off('new_story');
        socket.on('new_story', () => {
            get().fetchStories();
        });
    },

    subscribeToSocialEvents: () => {
        const socket = getSocket();
        if (!socket) return;

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