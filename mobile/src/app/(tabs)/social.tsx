import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {
  Activity,
  Users,
  Shield,
  UserPlus,
  Search,
  Trophy,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassView } from 'expo-glass-effect';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import { useToast } from '@/hooks/useToast';
import { getThemeBaseBackground, getUnselectedControlColors } from '@/constants/theme';
import GlobalHeader from '@/components/GlobalHeader';
import { AndroidHeaderBlurTarget } from '@/components/AndroidHeaderBlur';
import ThemeBackground from '@/components/ThemeBackground';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import { getContrastTextColor } from '@/utils/routineHelpers';

// Subcomponents
import { PrivacyBanner } from '@/components/social/PrivacyBanner';
import { StoryBubble } from '@/components/social/StoryBubble';
import {
  StoryComposerModal,
  type StoryComposerStep,
  type StoryUploadFile,
} from '@/components/social/StoryModals';
import { Feed } from '@/components/social/Feed';
import { Leaderboard } from '@/components/social/Leaderboard';
import { FriendsTab } from '@/components/social/FriendsTab';
import { SquadsTab } from '@/components/social/SquadsTab';
import { RequestsTab } from '@/components/social/RequestsTab';
import { SearchTab } from '@/components/social/SearchTab';

type TabKey = 'feed' | 'leaderboard' | 'friends' | 'squads' | 'requests' | 'search';

export default function SocialScreen() {
  const router = useRouter();
  const theme = useAppStore(state => state.theme) || 'oled';
  const colors = useAppColors();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const androidBlurTarget = useRef<React.ComponentRef<typeof View>>(null);
  const tabsScrollRef = useRef<any>(null);
  const mainScrollRef = useRef<any>(null);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);
  const unselectedTab = getUnselectedControlColors(theme);

  const [activeTab, setActiveTab] = useState<TabKey>('feed');

  // Zustand Store
  const userProfile = useAppStore(state => state.userProfile);
  const socialFriends = useAppStore(state => state.socialFriends) || [];
  const socialRequests = useAppStore(state => state.socialRequests) || { received: [], sent: [] };
  const stories = useAppStore(state => state.stories) || [];
  const myStories = useAppStore(state => state.myStories) || [];

  const fetchFriends = useAppStore(state => state.fetchFriends);
  const fetchFriendRequests = useAppStore(state => state.fetchFriendRequests);
  const fetchLeaderboard = useAppStore(state => state.fetchLeaderboard);
  const uploadStory = useAppStore(state => state.uploadStory);

  // Modals state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [storyComposer, setStoryComposer] = useState<{ visible: boolean; step: StoryComposerStep; session: number }>({
    visible: false, step: 'terms', session: 0,
  });
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const openStory = useAppStore(state => state.openStory);
  const closeStoryComposer = useCallback(() => setStoryComposer(current => ({ ...current, visible: false })), []);

  // Initial data loading & subscriptions
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchLeaderboard();
  }, []);

  const visibleStories = stories;
  const myStoriesUnseen = myStories.some((story: any) => !story.viewed);

  // Handle Stories actions
  const initiateStoryUpload = async () => {
    let step: StoryComposerStep = 'upload';
    try {
      if (await AsyncStorage.getItem('story_terms_accepted') !== 'true') step = 'terms';
    } catch {}
    setStoryComposer(current => ({ visible: true, step, session: current.session + 1 }));
  };

  const handleAcceptTerms = async () => {
    try {
      await AsyncStorage.setItem('story_terms_accepted', 'true');
    } catch {}
    setStoryComposer(current => current.visible ? { ...current, step: 'upload' } : current);
  };

  const handleMyStoryClick = () => {
    if (!openStory(userProfile?.id)) initiateStoryUpload();
  };

  const handleUploadStory = async (fileData: StoryUploadFile, privacy: string, isHDR: boolean) => {
    setIsUploadingStory(true);
    try {
      const result = await uploadStory(fileData, privacy, isHDR);
      if (!result?.success) throw new Error(result?.error || 'No se pudo subir la historia.');
      closeStoryComposer();
      showToast('Historia publicada.', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo subir la historia.';
      return /inapropiado|nsfw|rechazada/i.test(message)
        ? 'La revisión automática detectó contenido no permitido. Elige otro archivo.'
        : message;
    } finally {
      setIsUploadingStory(false);
    }
  };

  const navigateToProfile = (userId: any) => {
    if (userId == null) return;
    router.push({ pathname: '/public-profile/[id]', params: { id: String(userId) } });
  };

  interface TabItem {
    id: TabKey;
    label: string;
    icon: any;
    badge?: number;
  }

  const TABS: TabItem[] = [
    { id: 'feed', label: 'Muro', icon: Activity },
    { id: 'leaderboard', label: 'Ranking', icon: Trophy },
    { id: 'friends', label: 'Amigos', icon: Users },
    { id: 'squads', label: 'Grupos', icon: Shield },
    {
      id: 'requests',
      label: 'Solicitudes',
      icon: UserPlus,
      badge: socialRequests?.received?.length || 0,
    },
    { id: 'search', label: 'Buscar', icon: Search },
  ];

  const handleTabChange = (tabId: TabKey) => {
    setActiveTab(tabId);
    const index = TABS.findIndex(t => t.id === tabId);
    if (index >= 0 && tabsScrollRef.current) {
      tabsScrollRef.current.scrollTo({
        x: Math.max(0, index * 88 - 20),
        animated: true,
      });
    }
  };

  const handleSwitchToSearch = () => {
    handleTabChange('search');
    setTimeout(() => {
      mainScrollRef.current?.scrollTo?.({ y: 240, animated: true });
    }, 150);
  };

  const handleFocusSearch = () => {
    mainScrollRef.current?.scrollTo?.({ y: 260, animated: true });
  };

  const bgColor =
    colors.background === 'transparent'
      ? getThemeBaseBackground(theme)
      : colors.background;

  return (
    <View style={{ flex: 1, backgroundColor: bgColor }}>
      <AndroidHeaderBlurTarget target={androidBlurTarget}>
        <ThemeBackground />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <Animated.ScrollView
            ref={mainScrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
            scrollEventThrottle={16}
            contentContainerStyle={{
              paddingTop: insets.top + 70,
              paddingBottom: insets.bottom + 100,
            }}
          >
            {/* Page Subtitle Header */}
            <View style={styles.header}>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Conecta y compite con otros atletas
              </Text>
            </View>

            {/* Privacy Banner */}
            <View style={{ paddingHorizontal: 16 }}>
              <PrivacyBanner
                privacy={userProfile?.is_public_profile ? 'public' : 'private'}
                onNavigate={() => setShowPrivacyModal(true)}
              />
            </View>

            {/* Stories Horizontal Bar */}
            <View style={styles.storiesSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storiesContainer}
              >
                {/* My Story Bubble */}
                <StoryBubble
                  user={{
                    ...userProfile,
                    username: userProfile?.username || 'Yo',
                  }}
                  isMe={true}
                  hasStories={myStories.length > 0}
                  hasUnseen={myStoriesUnseen}
                  onClick={handleMyStoryClick}
                  onAdd={initiateStoryUpload}
                />

                {/* Other Users' Stories */}
                {visibleStories.map((storyUser: any) => {
                  const rawUser = storyUser.user || {};
                  const username = storyUser.username || rawUser.username || 'Usuario';
                  const avatar =
                    storyUser.profile_image_url ||
                    rawUser.profile_image_url ||
                    storyUser.avatar ||
                    rawUser.avatar;
                  const hasUnseen =
                    storyUser.hasUnseen !== undefined
                      ? storyUser.hasUnseen
                      : storyUser.items?.some((item: any) => !item.viewed);

                  return (
                    <StoryBubble
                      key={storyUser.userId}
                      user={{
                        ...rawUser,
                        id: storyUser.userId,
                        username,
                        avatar,
                        profile_image_url: avatar,
                        role: storyUser.role ?? rawUser.role,
                        trainer_id: storyUser.trainer_id ?? rawUser.trainer_id,
                      }}
                      isMe={false}
                      hasStories={true}
                      hasUnseen={hasUnseen}
                      onClick={() => openStory(storyUser.userId)}
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* Horizontal Navigation Tabs */}
            <View style={styles.tabsSection}>
              <ScrollView
                ref={tabsScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabsContainer}
              >
                {TABS.map(tab => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;

                  return (
                    <TouchableOpacity
                      key={tab.id}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: isActive }}
                      activeOpacity={0.75}
                      onPress={() => handleTabChange(tab.id)}
                      style={[
                        styles.tabPill,
                        isActive
                          ? { backgroundColor: colors.tint + '18', borderColor: colors.tint + '48' }
                          : unselectedTab,
                      ]}
                    >
                      <Icon
                        size={16}
                        color={isActive ? colors.tint : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />

                      <Text
                        style={[
                          styles.tabText,
                          {
                            color: isActive ? colors.tint : colors.textSecondary,
                            fontWeight: isActive ? (Platform.OS === 'ios' ? '700' : '800') : '600',
                          },
                        ]}
                      >
                        {tab.label}
                      </Text>

                      {tab.badge && tab.badge > 0 ? (
                        <View style={styles.tabBadge}>
                          <Text style={styles.tabBadgeText}>{tab.badge}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Tab Content */}
            {activeTab === 'feed' && <Feed onNavigateProfile={navigateToProfile} visibleStories={visibleStories} myStories={myStories} />}
            {activeTab === 'leaderboard' && (
              <Leaderboard onNavigateProfile={navigateToProfile} />
            )}
            {activeTab === 'friends' && (
              <FriendsTab
                onSwitchToSearch={handleSwitchToSearch}
                onNavigateProfile={navigateToProfile}
              />
            )}
            {activeTab === 'squads' && (
              <SquadsTab onNavigateProfile={navigateToProfile} />
            )}
            {activeTab === 'requests' && (
              <RequestsTab onNavigateProfile={navigateToProfile} />
            )}
            {activeTab === 'search' && (
              <SearchTab
                onNavigateProfile={navigateToProfile}
                onFocusInput={handleFocusSearch}
              />
            )}
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </AndroidHeaderBlurTarget>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }} pointerEvents="box-none">
        <GlobalHeader title="Comunidad" scrollY={scrollY} androidBlurTarget={androidBlurTarget} />
      </View>

      {/* MODALS */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <StoryComposerModal
        {...storyComposer}
        busy={isUploadingStory}
        onClose={closeStoryComposer}
        onAccept={handleAcceptTerms}
        onUpload={handleUploadStory}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  storiesSection: {
    marginBottom: 16,
  },
  storiesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  tabsSection: {
    marginBottom: 16,
  },
  tabsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tabText: {
    fontSize: 13,
  },
  tabBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
  },
});
