export const CHRISTMAS_THEME_BADGE_ID = 'theme_christmas_2026';
export const CHRISTMAS_MISSION_BADGE_ID = 'event_christmas_2026';
export const CHRISTMAS_MISSION_SEEN_PREFIX = 'seen_christmas_challenge_2026_';

// Gratis y permanente si se reclama antes de que termine el 6 de enero (hasta fin del 6 de enero de 2027)
export const CHRISTMAS_PROMO_DEADLINE_MS = Date.parse('2027-01-07T04:59:59.999Z');

export const isChristmasPromoActive = (nowMs = Date.now()) =>
  nowMs <= CHRISTMAS_PROMO_DEADLINE_MS;

const getUserBadgesList = (userProfile: any, unlockedBadges: any[] = []): string[] => {
  let profileBadges: any[] = [];
  if (Array.isArray(userProfile?.unlocked_badges)) {
    profileBadges = userProfile.unlocked_badges;
  } else if (typeof userProfile?.unlocked_badges === 'string') {
    try {
      profileBadges = JSON.parse(userProfile.unlocked_badges) || [];
    } catch {
      profileBadges = [];
    }
  }
  const extraBadges = Array.isArray(unlockedBadges) ? unlockedBadges : [];
  return [...new Set([...profileBadges, ...extraBadges].map(String))];
};

export const hasChristmasThemeBadge = (userProfile: any, unlockedBadges: any[] = []): boolean =>
  getUserBadgesList(userProfile, unlockedBadges).includes(CHRISTMAS_THEME_BADGE_ID);

export const hasChristmasThemeUnlocked = (userProfile: any, unlockedBadges: any[] = []): boolean => {
  if (!userProfile && !Array.isArray(unlockedBadges)) return false;
  if (userProfile?.role === 'admin') return true;
  if ((userProfile?.referralCount || 0) >= 1) return true;

  return hasChristmasThemeBadge(userProfile, unlockedBadges);
};

export const hasChristmasMissionCompleted = (userProfile: any, unlockedBadges: any[] = []): boolean =>
  getUserBadgesList(userProfile, unlockedBadges).includes(CHRISTMAS_MISSION_BADGE_ID);

export const hasUnseenChristmasMission = (
  userProfile: any,
  unlockedBadges: any[] = [],
  christmasMissionSeen = false,
): boolean => {
  if (!userProfile?.id || !isChristmasPromoActive()) return false;
  if (christmasMissionSeen) return false;
  return !hasChristmasMissionCompleted(userProfile, unlockedBadges);
};
