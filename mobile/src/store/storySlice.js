/* frontend/src/store/storySlice.js */
import api from '../services/apiClient';
import { initSocket } from '../services/socket';

const EMPTY_STORIES = [];
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const isActive = (story, now) => !story.expiresAt || Date.parse(story.expiresAt) > now;

export function selectUserStories(state, userId) {
  if (!state.token || !sameId(state.storyViewerId, state.userProfile?.id) || userId == null) return EMPTY_STORIES;
  if (sameId(userId, state.storyViewerId)) return state.myStories;
  return state.stories.find(group => sameId(group.userId, userId))?.items ?? EMPTY_STORIES;
}

export function selectHasUnseenStory(state, userId) {
  const now = Date.now();
  return selectUserStories(state, userId).some(item => !item.viewed && isActive(item, now));
}

function updateStoryGroups(groups, update) {
  let changed = false;
  const result = groups.flatMap(group => {
    const items = update(group.items, group.userId);
    if (items === group.items) return [group];
    changed = true;
    return items.length ? [{ ...group, items, hasUnseen: items.some(item => !item.viewed) }] : [];
  });
  return changed ? result : groups;
}

function filterItems(items, keep) {
  const next = items.filter(keep);
  return next.length === items.length ? items : next;
}

export const createStorySlice = (set, get) => {
  let requestVersion = 0;
  const seenIds = new Set();
  const removedIds = new Set();

  const updateViewed = (targetUserId, storyId) => {
    const state = get();
    if (!selectUserStories(state, targetUserId).some(item => sameId(item.id, storyId) && !item.viewed)) return false;
    seenIds.add(String(storyId));
    const mark = items => items.map(item => sameId(item.id, storyId) ? { ...item, viewed: true } : item);
    if (sameId(state.storyViewerId, targetUserId)) {
      set({ myStories: mark(state.myStories) });
    } else {
      set({ stories: updateStoryGroups(state.stories, (items, userId) => sameId(userId, targetUserId) ? mark(items) : items) });
    }
    return true;
  };

  const removeStory = (storyId, userId) => {
    removedIds.add(String(storyId));
    const state = get();
    const remove = items => filterItems(items, item => !sameId(item.id, storyId));
    set({
      myStories: sameId(state.storyViewerId, userId) ? remove(state.myStories) : state.myStories,
      stories: updateStoryGroups(state.stories, (items, ownerId) => sameId(ownerId, userId) ? remove(items) : items),
    });
  };

  return {
    stories: [],
    myStories: [],
    storyViewerId: null,
    viewingStoryUserId: null,
    isStoriesLoading: false,

    clearStories: () => {
      requestVersion++;
      seenIds.clear();
      removedIds.clear();
      set({ stories: [], myStories: [], storyViewerId: null, viewingStoryUserId: null, isStoriesLoading: false });
    },

    openStory: (userId) => {
      get().pruneExpiredStories();
      const now = Date.now();
      if (selectUserStories(get(), userId).some(item => isActive(item, now))) {
        set({ viewingStoryUserId: userId });
        return true;
      }
      return false;
    },

    closeStory: () => set({ viewingStoryUserId: null }),

    pruneExpiredStories: () => {
      const now = Date.now();
      const prune = items => filterItems(items, item => isActive(item, now));
      const { stories, myStories } = get();
      const nextGroups = updateStoryGroups(stories, prune);
      const nextOwn = prune(myStories);
      if (nextGroups !== stories || nextOwn !== myStories) set({ stories: nextGroups, myStories: nextOwn });
    },

    refreshStoriesAfterFriendRemoval: (friendId) => {
      set(state => ({
        stories: updateStoryGroups(state.stories, (items, ownerId) =>
          friendId == null || sameId(friendId, ownerId) ? filterItems(items, item => item.privacy === 'public') : items),
      }));
      return get().fetchStories();
    },

    fetchStories: async () => {
      const { token, userProfile } = get();
      const myId = userProfile?.id;
      if (!token || myId == null) return;
      if (!sameId(get().storyViewerId, myId)) get().clearStories();
      const request = ++requestVersion;
      set({ storyViewerId: myId, isStoriesLoading: true });
      const isCurrent = () => request === requestVersion && get().token === token && sameId(get().userProfile?.id, myId);
      try {
        const response = await api('/stories');
        if (!isCurrent()) return;
        const groups = Array.isArray(response) ? response : response?.data ?? [];
        const now = Date.now();
        const normalized = groups.map(group => {
          const items = (group.items ?? [])
            .filter(item => isActive(item, now) && !removedIds.has(String(item.id)))
            .map(item => seenIds.has(String(item.id)) ? { ...item, viewed: true } : item);
          return { ...group, items, hasUnseen: items.some(item => !item.viewed) };
        }).filter(group => group.items.length);
        set({
          myStories: normalized.find(group => sameId(group.userId, myId))?.items ?? EMPTY_STORIES,
          stories: normalized.filter(group => !sameId(group.userId, myId)),
          isStoriesLoading: false,
        });
      } catch (error) {
        if (!isCurrent()) return;
        console.warn('Error cargando historias:', error);
        set(state => ({
          isStoriesLoading: false,
          stories: updateStoryGroups(state.stories, items => filterItems(items, item => item.privacy === 'public')),
        }));
      }
    },

    subscribeToStories: () => {
      const socket = initSocket();
      if (!socket) return;
      const refresh = () => void get().fetchStories();
      const onDelete = ({ storyId, userId }) => removeStory(storyId, userId);
      const onViewed = ({ storyId, userId }) => updateViewed(userId, storyId);
      const onFriendRemoved = ({ userId } = {}) => void get().refreshStoriesAfterFriendRemoval(userId);
      const listeners = [
        ['connect', refresh], ['new_story', refresh], ['delete_story', onDelete],
        ['story_viewed', onViewed], ['friend_request_accepted', refresh], ['friend_removed', onFriendRemoved],
      ];
      listeners.forEach(([event, handler]) => socket.on(event, handler));
      return () => listeners.forEach(([event, handler]) => socket.off(event, handler));
    },

    // Subir una nueva historia
    uploadStory: async (file, privacy = 'friends', isHDR = false) => {
      const { token, userProfile } = get();
      const myId = userProfile?.id;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('privacy', privacy);
        formData.append('isHDR', isHDR.toString());

        const response = await api('/stories', {
          body: formData,
          method: 'POST',
          timeout: 120000,
          queueWhenOffline: false,
        });

        const newStory = response?.story || response;
        if (newStory?.id == null) throw new Error('El servidor no confirmó la publicación.');
        if (!Array.isArray(newStory.likes)) newStory.likes = [];
        // Aseguramos que viewed sea false al subirla
        newStory.viewed = false;

        if (get().token !== token || !sameId(get().userProfile?.id, myId)) return { success: true };

        // La publicación local se refleja antes de la siguiente sincronización.
        set(state => {
          const exists = state.myStories.some(s => String(s.id) === String(newStory.id));
          if (exists) return {};

          return {
             storyViewerId: myId,
             myStories: [...state.myStories, newStory]
          };
        });

        void get().fetchStories();
        return { success: true };
      } catch (error) {
        console.error("Error subiendo historia:", error);
        return { success: false, error: error.message || "Error al subir la historia" };
      }
    },

    // Dar like a una historia
    likeStory: async (targetUserId, storyId) => {
      const { userProfile, token } = get();
      if (!selectUserStories(get(), targetUserId).some(item => sameId(item.id, storyId))) return;
      const myId = userProfile?.id;

      const myLikeObject = {
          userId: myId,
          username: userProfile?.username || 'Yo',
          avatar: userProfile?.profile_image_url || userProfile?.avatar
      };

      set(state => {
        const updateItems = (items) => items.map(item => {
          if (sameId(item.id, storyId)) {
              const wasLiked = item.isLiked;
              let newLikesList = Array.isArray(item.likes) ? [...item.likes] : [];

              if (wasLiked) {
                  newLikesList = newLikesList.filter(l => l.userId !== myId);
              } else {
                  newLikesList.push(myLikeObject);
              }

              return {
                  ...item,
                  likes: newLikesList,
                  isLiked: !wasLiked
              };
          }
          return item;
        });

        const newStories = state.stories.map(user => {
          if (sameId(user.userId, targetUserId)) {
            return { ...user, items: updateItems(user.items) };
          }
          return user;
        });

        let newMyStories = state.myStories;
        if (sameId(targetUserId, myId)) {
            newMyStories = updateItems(state.myStories);
        }

        return { stories: newStories, myStories: newMyStories };
      });

      try {
        const response = await api(`/stories/${storyId}/like`, { method: 'POST' });
        if (get().token === token && response && Array.isArray(response.likes)) {
            set(state => {
                const syncItems = (items) => items.map(item => {
                    if (sameId(item.id, storyId)) {
                        return {
                            ...item,
                            likes: response.likes,
                            isLiked: response.isLiked
                        };
                    }
                    return item;
                });

                const newStories = state.stories.map(user => {
                    if (sameId(user.userId, targetUserId)) {
                        return { ...user, items: syncItems(user.items) };
                    }
                    return user;
                });

                let newMyStories = state.myStories;
                if (sameId(targetUserId, myId)) {
                    newMyStories = syncItems(state.myStories);
                }

                return { stories: newStories, myStories: newMyStories };
            });
        }
      } catch (error) {
        console.error("Error dando like:", error);
      }
    },

    markStoryAsViewed: async (targetUserId, storyId) => {
      if (!updateViewed(targetUserId, storyId)) return;
      const { token } = get();
      try {
        await api('/stories/' + storyId + '/view', { method: 'POST', queueWhenOffline: false });
      } catch (error) {
        if (get().token !== token) return;
        if (error?.status === 404) removeStory(storyId, targetUserId);
        console.warn('Error marcando vista en backend:', error);
      }
    },

    deleteMyStory: async (storyId) => {
      const { token, storyViewerId } = get();
      if (!selectUserStories(get(), storyViewerId).some(item => sameId(item.id, storyId))) return;
      removeStory(storyId, storyViewerId);
      try {
        await api('/stories/' + storyId, { method: 'DELETE' });
      } catch (error) {
        if (get().token !== token) return;
        removedIds.delete(String(storyId));
        void get().fetchStories();
        console.error('Error eliminando historia:', error);
      }
    },
  };
};
