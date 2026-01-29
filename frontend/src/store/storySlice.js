/* frontend/src/store/storySlice.js */
import api from '../services/apiClient';
import { initSocket } from '../services/socket';

export const createStorySlice = (set, get) => ({
  stories: [], // Historias de amigos/públicas
  myStories: [], // Mis historias activas
  isStoriesLoading: false,

  // --- Acciones ---

  // Cargar historias reales desde el backend
  fetchStories: async () => {
    set({ isStoriesLoading: true });
    try {
      const response = await api('/stories');
      
      const storiesData = Array.isArray(response) ? response : (response?.data || []);
      
      const userProfile = get().userProfile;
      const myId = userProfile?.id;

      if (!storiesData) {
         set({ stories: [], myStories: [], isStoriesLoading: false });
         return;
      }

      // Separar mis historias de las de los demás
      const myStoriesData = storiesData.find(s => s.userId === myId);
      const otherStories = storiesData.filter(s => s.userId !== myId);

      set({ 
        stories: otherStories || [], 
        myStories: myStoriesData ? myStoriesData.items : [], 
        isStoriesLoading: false 
      });

    } catch (error) {
      console.error("Error cargando historias:", error);
      set({ stories: [], myStories: [], isStoriesLoading: false });
    }
  },

  // --- SOCKETS: Suscripción en Tiempo Real ---
  subscribeToStories: () => {
    const socket = initSocket();
    if (!socket) return;

    // Limpiamos listeners previos para evitar duplicados
    socket.off('new_story');
    socket.off('delete_story');

    // 1. EVENTO: Nueva Historia
    socket.on('new_story', (payload) => {
      const { story, user } = payload;
      
      const state = get();
      const myId = state.userProfile?.id;
      const socialFriends = state.socialFriends || []; // Necesitamos la lista de amigos para filtrar

      // A) Si la historia es mía (subida desde otro dispositivo)
      if (user.id === myId) {
         const alreadyExists = state.myStories.some(s => s.id === story.id);
         if (!alreadyExists) {
             set(state => ({
                 myStories: [...state.myStories, story]
             }));
         }
         return;
      }

      // B) Filtro de Privacidad (IMPORTANTE):
      // Si la historia es "friends", solo la mostramos si el usuario está en mis amigos.
      if (story.privacy === 'friends') {
          const isFriend = socialFriends.some(f => f.id === user.id);
          if (!isFriend) return; // Ignorar evento si no somos amigos
      }

      // C) Añadir a la lista de otros usuarios
      set(state => {
        const existingUserIndex = state.stories.findIndex(u => u.userId === user.id);
        let newStories = [...state.stories];

        if (existingUserIndex >= 0) {
            // El usuario YA existe en el carrusel
            const existingUser = newStories[existingUserIndex];
            
            const storyExists = existingUser.items.some(s => s.id === story.id);
            if (storyExists) return {}; 

            const updatedUser = {
                ...existingUser,
                hasUnseen: true,
                items: [...existingUser.items, story]
            };
            
            // Lo movemos al principio (izquierda) para notificar novedad
            newStories.splice(existingUserIndex, 1);
            newStories.unshift(updatedUser);

        } else {
            // El usuario NO estaba en el carrusel
            const newUserGroup = {
                userId: user.id,
                username: user.username,
                avatar: user.profile_image_url || user.avatar,
                hasUnseen: true,
                items: [story]
            };
            newStories.unshift(newUserGroup);
        }

        return { stories: newStories };
      });
    });

    // 2. EVENTO: Historia Eliminada (NUEVO)
    socket.on('delete_story', ({ storyId, userId }) => {
        const state = get();
        const myId = state.userProfile?.id;

        // Convertimos a string para comparar seguramente (ids de DB vs params de socket)
        const targetStoryId = String(storyId);

        // A) Si se borró una historia mía
        if (userId === myId) {
            set(state => ({
                myStories: state.myStories.filter(s => String(s.id) !== targetStoryId)
            }));
            return;
        }

        // B) Si se borró la historia de otro
        set(state => {
            const newStories = state.stories.map(user => {
                if (user.userId === userId) {
                    return {
                        ...user,
                        items: user.items.filter(s => String(s.id) !== targetStoryId)
                    };
                }
                return user;
            })
            // Limpieza: Si el usuario se queda sin historias, lo quitamos del carrusel
            .filter(user => user.items.length > 0);

            return { stories: newStories };
        });
    });
  },

  // Subir una nueva historia
  uploadStory: async (file, privacy = 'friends', isHDR = false) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('privacy', privacy);
      formData.append('isHDR', isHDR.toString()); 
      
      const response = await api('/stories', {
        body: formData
      });

      const newStory = response.story || response;
      if (!Array.isArray(newStory.likes)) newStory.likes = [];

      // Actualización optimista
      set(state => ({
        myStories: [...state.myStories, newStory]
      }));

      return { success: true }; 
    } catch (error) {
      console.error("Error subiendo historia:", error);
      return { success: false, error: error.message || "Error al subir la historia" };
    }
  },

  // Dar like a una historia
  likeStory: async (targetUserId, storyId) => {
    const userProfile = get().userProfile;
    const myId = userProfile?.id;
    
    const myLikeObject = {
        userId: myId,
        username: userProfile?.username || 'Yo',
        avatar: userProfile?.profile_image_url || userProfile?.avatar
    };

    set(state => {
      const updateItems = (items) => items.map(item => {
        if (item.id === storyId) {
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
        if (user.userId === targetUserId) {
          return { ...user, items: updateItems(user.items) };
        }
        return user;
      });

      let newMyStories = state.myStories;
      if (targetUserId === myId) {
          newMyStories = updateItems(state.myStories);
      }

      return { stories: newStories, myStories: newMyStories };
    });

    try {
      const response = await api(`/stories/${storyId}/like`, { method: 'POST' });
      if (response && Array.isArray(response.likes)) {
          set(state => {
              const syncItems = (items) => items.map(item => {
                  if (item.id === storyId) {
                      return { 
                          ...item, 
                          likes: response.likes, 
                          isLiked: response.isLiked 
                      };
                  }
                  return item;
              });

              const newStories = state.stories.map(user => {
                  if (user.userId === targetUserId) {
                      return { ...user, items: syncItems(user.items) };
                  }
                  return user;
              });

              let newMyStories = state.myStories;
              if (targetUserId === myId) {
                  newMyStories = syncItems(state.myStories);
              }

              return { stories: newStories, myStories: newMyStories };
          });
      }
    } catch (error) {
      console.error("Error dando like:", error);
    }
  },

  // Marcar historia como vista
  markStoryAsViewed: async (targetUserId, storyId) => {
    set(state => {
      const newStories = state.stories.map(user => {
        if (user.userId === targetUserId) {
          const updatedItems = user.items.map(item => 
            item.id === storyId ? { ...item, viewed: true } : item
          );
          const hasUnseen = updatedItems.some(item => !item.viewed);
          return { ...user, items: updatedItems, hasUnseen };
        }
        return user;
      });
      return { stories: newStories };
    });

    try {
      await api(`/stories/${storyId}/view`, { method: 'POST' });
    } catch (error) {
      console.error("Error marcando vista:", error);
    }
  },

  // Eliminar mi historia
  deleteMyStory: async (storyId) => {
    // Optimista local
    set(state => ({
      myStories: state.myStories.filter(s => s.id !== storyId)
    }));

    try {
      await api(`/stories/${storyId}`, { method: 'DELETE' });
      // Nota: No hace falta emitir nada aquí, el backend lo hará al recibir el DELETE
    } catch (error) {
      console.error("Error eliminando historia:", error);
    }
  }
});