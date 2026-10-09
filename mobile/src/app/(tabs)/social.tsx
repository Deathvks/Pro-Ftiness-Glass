import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
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
import { GlassButton } from '@/components/ui/GlassButton';

import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import ThemeBackground from '@/components/ThemeBackground';
import GlobalHeader from '@/components/GlobalHeader';
import { PrivacyModal } from '@/components/modals/PrivacyModal';
import { getContrastTextColor } from '@/utils/routineHelpers';

// Subcomponents
import { PrivacyBanner } from '@/components/social/PrivacyBanner';
import { StoryBubble } from '@/components/social/StoryBubble';
import {
  StoryTermsModal,
  UploadStoryModal,
  StoryViewerModal,
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
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabsScrollRef = useRef<ScrollView>(null);
  const mainScrollRef = useRef<any>(null);
  const isDark = !['light', 'ocean', 'desert'].includes(theme);

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
  const fetchStories = useAppStore(state => state.fetchStories);
  const uploadStory = useAppStore(state => state.uploadStory);
  const subscribeToStories = useAppStore(state => state.subscribeToStories);
  const subscribeToSocialEvents = useAppStore(state => state.subscribeToSocialEvents);

  // Modals state
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const [viewingStoryUserId, setViewingStoryUserId] = useState<string | number | null>(null);

  // Initial data loading & subscriptions
  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
    fetchLeaderboard();
    if (subscribeToStories) subscribeToStories();
    if (subscribeToSocialEvents) subscribeToSocialEvents();
  }, []);

  useEffect(() => {
    if (userProfile?.id && fetchStories) {
      fetchStories();
    }
  }, [userProfile?.id]);

  // Stories computation
  const visibleStories = useMemo(() => {
    return stories.filter((storyUser: any) => {
      const isFriend = socialFriends.some((f: any) => String(f.id) === String(storyUser.userId));
      const hasPublicStories = storyUser.items?.some((item: any) => item.privacy === 'public');
      return isFriend || hasPublicStories;
    });
  }, [stories, socialFriends]);

  const myStoriesUnseen = useMemo(() => {
    return myStories && myStories.some((s: any) => !s.viewed);
  }, [myStories]);

  // Handle Stories actions
  const initiateStoryUpload = async () => {
    try {
      const accepted = await AsyncStorage.getItem('story_terms_accepted');
      if (accepted === 'true') {
        setShowUploadModal(true);
      } else {
        setShowTermsModal(true);
      }
    } catch {
      setShowUploadModal(true);
    }
  };

  const handleAcceptTerms = async () => {
    try {
      await AsyncStorage.setItem('story_terms_accepted', 'true');
    } catch {}
    setShowTermsModal(false);
    setShowUploadModal(true);
  };

  const handleMyStoryClick = () => {
    if (myStories.length > 0 && userProfile?.id) {
      setViewingStoryUserId(userProfile.id);
    } else {
      initiateStoryUpload();
    }
  };

  const handleUploadStory = async (fileData: any, privacy: string) => {
    setIsUploadingStory(true);
    try {
      const res = await uploadStory(fileData, privacy, false);
      if (res && res.success) {
        setShowUploadModal(false);
        Alert.alert('¡Éxito!', 'Historia compartida correctamente');
      } else {
        Alert.alert('Error', res?.error || 'No se pudo subir la historia');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Error al subir historia');
    } finally {
      setIsUploadingStory(false);
    }
  };

  const navigateToProfile = (userId: any) => {
    if (String(userId) === String(userProfile?.id)) {
      router.push('/profile');
    } else {
      // In mobile, we can navigate to profile or show details
      router.push('/profile');
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeBackground />

      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader title="Comunidad" scrollY={scrollY} />
      </View>

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
            <Text style={[styles.mainTitle, { color: colors.text }]}>Comunidad</Text>
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
                  username: userProfile?.username || 'Yo',
                  profile_image_url: userProfile?.profile_image_url,
                  avatar: userProfile?.avatar,
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
                    user={{ username, avatar, profile_image_url: avatar }}
                    isMe={false}
                    hasStories={true}
                    hasUnseen={hasUnseen}
                    onClick={() => setViewingStoryUserId(storyUser.userId)}
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
                  <GlassButton
                    key={tab.id}
                    onPress={() => handleTabChange(tab.id)}
                    theme={theme}
                    noShadow={true}
                    color={isActive ? colors.tint : undefined}
                    style={[
                      styles.tabPill,
                      {
                        borderColor: isActive
                          ? colors.tint
                          : isDark
                          ? 'rgba(255, 255, 255, 0.12)'
                          : 'rgba(0, 0, 0, 0.08)',
                      },
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
                          fontWeight: isActive ? '800' : '600',
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
                  </GlassButton>
                );
              })}
            </ScrollView>
          </View>

          {/* Tab Content */}
          {activeTab === 'feed' && <Feed onNavigateProfile={navigateToProfile} />}
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

      {/* MODALS */}
      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <StoryTermsModal
        visible={showTermsModal}
        onAccept={handleAcceptTerms}
        onReject={() => setShowTermsModal(false)}
      />

      <UploadStoryModal
        visible={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleUploadStory}
        isUploading={isUploadingStory}
      />

      {viewingStoryUserId !== null && (
        <StoryViewerModal
          visible={true}
          userId={viewingStoryUserId}
          onClose={() => setViewingStoryUserId(null)}
        />
      )}
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
