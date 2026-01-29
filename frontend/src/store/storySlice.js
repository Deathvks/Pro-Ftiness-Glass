/* frontend/src/store/storySlice.js */
import api from '../services/apiClient';
import { initSocket } from '../services/socket'; // Importamos el servicio de Socket

export const createStorySlice = (set, get) => ({
  stories: [], // Historias de amigos/públicas
  myStories: [], // Mis historias activas
  isStoriesLoading: false,

  // --- Acciones ---

  // Cargar historias reales desde el backend (REST inicial)
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

    // Limpiamos listener previo para evitar duplicados
    socket.off('new_story');

    // Escuchar el evento 'new_story'
    socket.on('new_story', (payload) => {
      // payload esperado: { story: Object, user: { id, username, avatar } }
      const { story, user } = payload;
      
      const state = get();
      const myId = state.userProfile?.id;

      // 1. Si la historia es mía (subida desde otro dispositivo/pestaña)
      if (user.id === myId) {
         // Evitar duplicados si ya la tenemos (por la actualización optimista de uploadStory)
         const alreadyExists = state.myStories.some(s => s.id === story.id);
         if (!alreadyExists) {
             set(state => ({
                 myStories: [...state.myStories, story]
             }));
         }
         return;
      }

      // 2. Si la historia es de otro usuario
      set(state => {
        const existingUserIndex = state.stories.findIndex(u => u.userId === user.id);
        let newStories = [...state.stories];

        if (existingUserIndex >= 0) {
            // El usuario YA existe en la lista
            const existingUser = newStories[existingUserIndex];
            
            // Verificamos si la historia ya existe para evitar duplicados
            const storyExists = existingUser.items.some(s => s.id === story.id);
            if (storyExists) return {}; // No cambiamos nada

            const updatedUser = {
                ...existingUser,
                hasUnseen: true, // Marcamos que tiene algo nuevo
                items: [...existingUser.items, story]
            };
            
            // Movemos al usuario al principio de la lista (Feedback visual de novedad)
            newStories.splice(existingUserIndex, 1);
            newStories.unshift(updatedUser);

        } else {
            // El usuario NO estaba en la lista (primera historia del día)
            const newUserGroup = {
                userId: user.id,
                username: user.username,
                avatar: user.profile_image_url || user.avatar,
                hasUnseen: true,
                items: [story]
            };
            // Lo añadimos al principio
            newStories.unshift(newUserGroup);
        }

        return { stories: newStories };
      });
    });
  },

  // Subir una nueva historia (soporta imagen/video, privacidad y HDR)
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
      
      // Aseguramos que likes sea un array para evitar errores en la UI
      if (!Array.isArray(newStory.likes)) newStory.likes = [];

      // Actualización optimista
      set(state => ({
        myStories: [...state.myStories, newStory]
      }));

      // Devolvemos objeto de éxito
      return { success: true }; 
    } catch (error) {
      console.error("Error subiendo historia:", error);
      return { success: false, error: error.message || "Error al subir la historia" };
    }
  },

  // Dar like a una historia (Manejo de Array de Likes)
  likeStory: async (targetUserId, storyId) => {
    const userProfile = get().userProfile;
    const myId = userProfile?.id;
    
    // Objeto de mi usuario para la UI optimista
    const myLikeObject = {
        userId: myId,
        username: userProfile?.username || 'Yo',
        avatar: userProfile?.profile_image_url || userProfile?.avatar
    };

    // 1. Actualización Optimista en la UI (Feedback instantáneo)
    set(state => {
      // Helper para actualizar lista de items
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

      // Actualizar en la lista de historias de amigos
      const newStories = state.stories.map(user => {
        if (user.userId === targetUserId) {
          return {
            ...user,
            items: updateItems(user.items)
          };
        }
        return user;
      });

      // Actualizar también si la historia es mía
      let newMyStories = state.myStories;
      if (targetUserId === myId) {
          newMyStories = updateItems(state.myStories);
      }

      return { stories: newStories, myStories: newMyStories };
    });

    // 2. Llamada a la API y sincronización real
    try {
      const response = await api(`/stories/${storyId}/like`, { method: 'POST' });

      // Si el servidor devuelve la lista actualizada, la usamos
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
    set(state => ({
      myStories: state.myStories.filter(s => s.id !== storyId)
    }));

    try {
      await api(`/stories/${storyId}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Error eliminando historia:", error);
    }
  }
});