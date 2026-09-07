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

      // PROCESAMIENTO SEGURO DE MIS HISTORIAS:
      // Verificamos si realmente las he visto basándonos en la lista de 'views' si está disponible.
      // Esto corrige el bug donde el backend podría devolver viewed:true por defecto al creador.
      let myCleanStories = [];
      if (myStoriesData && Array.isArray(myStoriesData.items)) {
          myCleanStories = myStoriesData.items.map(item => {
              // Si el backend nos da la lista de espectadores, esa es la fuente de verdad
              if (Array.isArray(item.views)) {
                  const amIInViews = item.views.some(v => v.userId === myId || v.id === myId);
                  return { ...item, viewed: amIInViews };
              }
              // Si no hay lista de views, confiamos en la propiedad viewed, 
              // pero si viene undefined asumimos falso.
              return item;
          });
      }

      set({ 
        stories: otherStories || [], 
        myStories: myCleanStories, 
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
      const socialFriends = state.socialFriends || []; 

      // A) Si la historia es mía (subida desde otro dispositivo o confirmación de socket)
      if (user.id === myId) {
         // Verificación robusta de duplicados (String vs Number)
         const alreadyExists = state.myStories.some(s => String(s.id) === String(story.id));
         if (!alreadyExists) {
             set(state => ({
                 myStories: [...state.myStories, story]
             }));
         }
         return;
      }

      // B) Filtro de Privacidad: solo amigos
      if (story.privacy === 'friends') {
          const isFriend = socialFriends.some(f => f.id === user.id);
          if (!isFriend) return; 
      }

      // C) Añadir a la lista de otros usuarios
      set(state => {
        const existingUserIndex = state.stories.findIndex(u => u.userId === user.id);
        let newStories = [...state.stories];

        if (existingUserIndex >= 0) {
            const existingUser = newStories[existingUserIndex];
            const storyExists = existingUser.items.some(s => String(s.id) === String(story.id));
            if (storyExists) return {}; 

            const updatedUser = {
                ...existingUser,
                hasUnseen: true,
                items: [...existingUser.items, story]
            };
            
            newStories.splice(existingUserIndex, 1);
            newStories.unshift(updatedUser);

        } else {
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

    // 2. EVENTO: Historia Eliminada
    socket.on('delete_story', ({ storyId, userId }) => {
        const state = get();
        const myId = state.userProfile?.id;
        const targetStoryId = String(storyId);

        if (userId === myId) {
            set(state => ({
                myStories: state.myStories.filter(s => String(s.id) !== targetStoryId)
            }));
            return;
        }

        set(state => {
            const newStories = state.stories.map(user => {
                if (user.userId === userId) {
                    return {
                        ...user,
                        items: user.items.filter(s => String(s.id) !== targetStoryId)
                    };
                }
                return user;
            }).filter(user => user.items.length > 0);

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
      // Aseguramos que viewed sea false al subirla
      newStory.viewed = false;

      // Actualización segura evitando duplicados si el socket llegó primero
      set(state => {
        const exists = state.myStories.some(s => String(s.id) === String(newStory.id));
        if (exists) return {};
        
        return {
           myStories: [...state.myStories, newStory]
        };
      });

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
    const state = get();
    const myId = state.userProfile?.id;

    set(state => {
      // 1. Si la historia es mía, actualizamos myStories
      if (targetUserId === myId) {
          const newMyStories = state.myStories.map(item => 
              item.id === storyId ? { ...item, viewed: true } : item
          );
          return { myStories: newMyStories };
      }

      // 2. Si es historia de otro, actualizamos stories
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

    // Llamamos SIEMPRE a la API, incluso si es mi historia.
    // Esto asegura que el backend registre que la he visto y lo devuelva correctamente
    // en futuras cargas (fetchStories).
    try {
      await api(`/stories/${storyId}/view`, { method: 'POST' });
    } catch (error) {
      // Si falla silenciosamente no pasa nada crítico, ya se actualizó localmente
      console.warn("Error marcando vista en backend:", error);
    }
  },

  // Eliminar mi historia
  deleteMyStory: async (storyId) => {
    // Optimista local
    set(state => ({
      myStories: state.myStories.filter(s => String(s.id) !== String(storyId))
    }));

    try {
      await api(`/stories/${storyId}`, { method: 'DELETE' });
    } catch (error) {
      console.error("Error eliminando historia:", error);
    }
  }
});