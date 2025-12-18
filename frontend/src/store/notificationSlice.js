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

  fetchNotifications: async (page = 1) => {
    if (page === 1) set({ notificationsLoading: true, notificationsError: null });

    try {
      const { notifications, unreadCount, currentPage, totalPages } = await getNotifications({ page, limit: 10 });

      set(state => ({
        notifications: page === 1 ? notifications : [...state.notifications, ...notifications],
        unreadCount,
        notificationPage: currentPage,
        notificationTotalPages: totalPages,
        notificationsLoading: false
      }));
    } catch (error) {
      set({ notificationsLoading: false, notificationsError: error.message || 'Error al cargar notificaciones' });
    }
  },

  markNotificationAsRead: async (id) => {
    const { notifications, unreadCount } = get();
    const index = notifications.findIndex(n => n.id === id);

    if (index === -1 || notifications[index].is_read) return;

    const updatedList = [...notifications];
    updatedList[index] = { ...updatedList[index], is_read: true };

    set({ notifications: updatedList, unreadCount: Math.max(0, unreadCount - 1) });

    try {
      await markAsRead(id);
    } catch (e) {
      console.error(e);
    }
  },

  markAllNotificationsAsRead: async () => {
    const { notifications } = get();
    set({ notifications: notifications.map(n => ({ ...n, is_read: true })), unreadCount: 0 });

    try {
      await markAllAsRead();
    } catch (e) {
      console.error(e);
    }
  },

  removeNotification: async (id) => {
    const { notifications, unreadCount } = get();
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    set({
      notifications: notifications.filter(n => n.id !== id),
      unreadCount: !target.is_read ? Math.max(0, unreadCount - 1) : unreadCount
    });

    try {
      await deleteNotification(id);
    } catch (e) {
      console.error(e);
    }
  },

  clearAllNotifications: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await deleteAllNotifications();
    } catch (e) {
      console.error(e);
    }
  },

  incrementUnreadCount: () => set(state => ({ unreadCount: state.unreadCount + 1 }))
});