import React, { useState } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, TouchableOpacity } from 'react-native';
import { Activity, Users, Shield, UserPlus, Search, Trophy } from 'lucide-react-native';
import useAppStore from '@/store/useAppStore';
import { useAppColors } from '@/hooks/useAppColors';
import GlobalHeader from '@/components/GlobalHeader';
import ThemeBackground from '@/components/ThemeBackground';
import { GlassView } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Feed } from '@/components/social/Feed';
import { Leaderboard } from '@/components/social/Leaderboard';

type TabKey = 'feed' | 'friends' | 'squads' | 'requests' | 'search' | 'leaderboard';

export default function SocialScreen() {
  const theme = useAppStore(state => state.theme);
  const colors = useAppColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabKey>('feed');
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const TABS = [
    { id: 'feed', label: 'Muro', icon: Activity },
    { id: 'friends', label: 'Amigos', icon: Users },
    { id: 'squads', label: 'Grupos', icon: Shield },
    { id: 'requests', label: 'Solicitudes', icon: UserPlus },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'leaderboard', label: 'Ranking', icon: Trophy },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemeBackground />
      
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <GlobalHeader title="Comunidad" scrollY={scrollY} />
      </View>

      <View style={{ flex: 1, paddingTop: insets.top + 70 }}>
        {/* Horizontal Tabs */}
        <View style={{ height: 60, marginBottom: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 12 }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{ 
                    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 40, 
                    borderRadius: 20, borderWidth: 1, borderColor: isActive ? colors.tint + '50' : colors.border,
                    overflow: 'hidden' 
                  }}
                >
                  <GlassView glassEffectStyle="regular" colorScheme={['light', 'ocean', 'desert'].includes(theme) ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
                  {isActive && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.tint, opacity: 0.15 }]} />}
                  <Icon size={16} color={isActive ? colors.tint : colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: isActive ? colors.tint : colors.text }}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        {activeTab === 'feed' && <Feed />}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab !== 'feed' && activeTab !== 'leaderboard' && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 16, color: colors.textSecondary, textAlign: 'center' }}>{TABS.find(t => t.id === activeTab)?.label} (Próximamente)</Text>
          </View>
        )}
      </View>
    </View>
  );
}

