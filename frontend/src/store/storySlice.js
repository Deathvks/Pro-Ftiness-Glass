/* frontend/src/store/storySlice.js */
import api from '../services/apiClient';

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
      // Devolvemos el mensaje de error del backend (donde viene la alerta de moderación/NSFW)
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
            // Clonar array existente o iniciar vacío
            let newLikesList = Array.isArray(item.likes) ? [...item.likes] : [];

            if (wasLiked) {
                // Si ya tenía like, lo quitamos (filtramos por ID)
                newLikesList = newLikesList.filter(l => l.userId !== myId);
            } else {
                // Si no tenía, nos añadimos
                newLikesList.push(myLikeObject);
            }

            return {
                ...item,
                likes: newLikesList, // Guardamos el array actualizado
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

      // Actualizar también si la historia es mía (caso raro pero posible)
      let newMyStories = state.myStories;
      if (targetUserId === myId) {
          newMyStories = updateItems(state.myStories);
      }

      return { stories: newStories, myStories: newMyStories };
    });

    // 2. Llamada a la API y sincronización real
    try {
      const response = await api(`/stories/${storyId}/like`, { method: 'POST' });

      // Si el servidor devuelve la lista actualizada, la usamos para corregir cualquier discrepancia
      if (response && Array.isArray(response.likes)) {
          set(state => {
              const syncItems = (items) => items.map(item => {
                  if (item.id === storyId) {
                      return { 
                          ...item, 
                          likes: response.likes, // Usar lista oficial del backend
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
      // Aquí se podría revertir el cambio optimista si fuera necesario
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