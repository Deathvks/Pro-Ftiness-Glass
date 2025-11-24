/* frontend/src/store/notificationSlice.js */
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications
} from '../services/notificationService';

export const createNotificationSlice = (set, get) => ({
  notifications: [],
  unreadCount: 0,
  notificationsLoading: false,
  notificationsError: null,
  notificationPage: 1,
  notificationTotalPages: 1,

  /**
   * Obtiene las notificaciones del servidor.
   * Si page > 1, las añade a la lista existente (scroll infinito/paginación).
   */
  fetchNotifications: async (page = 1) => {
    // Solo mostramos loading global si es la primera página
    if (page === 1) {
        set({ notificationsLoading: true, notificationsError: null });
    }

    try {
      // --- CAMBIO: Límite ajustado a 10 para paginación ---
      const response = await getNotifications({ page, limit: 10 });
      
      set(state => {
        const newNotifications = response.notifications;
        // Si es página 1, reemplazamos. Si no, concatenamos.
        const updatedList = page === 1 
            ? newNotifications 
            : [...state.notifications, ...newNotifications];
        
        return {
            notifications: updatedList,
            unreadCount: response.unreadCount,
            notificationPage: response.currentPage,
            notificationTotalPages: response.totalPages,
            notificationsLoading: false
        };
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      set({ notificationsLoading: false, notificationsError: error.message || 'Error al cargar notificaciones' });
    }
  },

  /**
   * Marca una notificación como leída (Optimista).
   */
  markNotificationAsRead: async (id) => {
    const { notifications, unreadCount } = get();
    const notificationIndex = notifications.findIndex(n => n.id === id);
    
    if (notificationIndex === -1) return;
    if (notifications[notificationIndex].is_read) return; // Ya estaba leída

    // Actualización optimista
    const updatedList = [...notifications];
    updatedList[notificationIndex] = { ...updatedList[notificationIndex], is_read: true };

    set({
        notifications: updatedList,
        unreadCount: Math.max(0, unreadCount - 1)
    });

    try {
      await markAsRead(id);
    } catch (error) {
      console.error("Error marcando como leída:", error);
    }
  },

  /**
   * Marca todas como leídas (Optimista).
   */
  markAllNotificationsAsRead: async () => {
    const { notifications } = get();
    
    const updatedList = notifications.map(n => ({ ...n, is_read: true }));
    
    set({
        notifications: updatedList,
        unreadCount: 0
    });

    try {
      await markAllAsRead();
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
    }
  },

  /**
   * Elimina una notificación (Optimista).
   */
  removeNotification: async (id) => {
    const { notifications, unreadCount } = get();
    const notificationToDelete = notifications.find(n => n.id === id);
    
    if (!notificationToDelete) return;

    const wasUnread = !notificationToDelete.is_read;
    const updatedList = notifications.filter(n => n.id !== id);

    set({
        notifications: updatedList,
        unreadCount: wasUnread ? Math.max(0, unreadCount - 1) : unreadCount
    });

    try {
      await deleteNotification(id);
    } catch (error) {
      console.error("Error eliminando notificación:", error);
    }
  },

  /**
   * Elimina todas las notificaciones (Optimista).
   */
  clearAllNotifications: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await deleteAllNotifications();
    } catch (error) {
      console.error("Error vaciando notificaciones:", error);
    }
  },
  
  incrementUnreadCount: () => {
      set(state => ({ unreadCount: state.unreadCount + 1 }));
  }
});