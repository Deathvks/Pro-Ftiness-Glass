import { useEffect } from 'react';
import { AppState } from 'react-native';
import { StoryViewerModal } from './StoryModals';
import { disconnectSocket } from '@/services/socket';
import useAppStore from '@/store/useAppStore';

export function StoryHost() {
  const token = useAppStore(state => state.token);
  const userId = useAppStore(state => state.userProfile?.id);
  const viewingUserId = useAppStore(state => state.viewingStoryUserId);
  const closeStory = useAppStore(state => state.closeStory);
  const stories = useAppStore(state => state.stories);
  const myStories = useAppStore(state => state.myStories);

  useEffect(() => {
    if (!token || userId == null) {
      if (!token) disconnectSocket();
      return;
    }
    const state = useAppStore.getState();
    const unsubscribe = state.subscribeToStories();
    state.subscribeToSocialEvents();
    void state.fetchStories();

    const foreground = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') return;
      useAppStore.getState().pruneExpiredStories();
      void useAppStore.getState().fetchStories();
    });

    return () => {
      foreground.remove();
      unsubscribe?.();
    };
  }, [token, userId]);

  useEffect(() => {
    let expires = Infinity;
    for (const item of myStories) {
      const date = Date.parse(item.expiresAt);
      if (Number.isFinite(date)) expires = Math.min(expires, date);
    }
    for (const group of stories) {
      for (const item of group.items) {
        const date = Date.parse(item.expiresAt);
        if (Number.isFinite(date)) expires = Math.min(expires, date);
      }
    }
    if (!Number.isFinite(expires)) return;
    const timer = setTimeout(() => useAppStore.getState().pruneExpiredStories(), Math.max(0, expires - Date.now()));
    return () => clearTimeout(timer);
  }, [myStories, stories]);

  if (!token || userId == null || viewingUserId == null) return null;
  return <StoryViewerModal key={viewingUserId} userId={viewingUserId} onClose={closeStory} />;
}
