function extractGoogleReverseScheme(clientId) {
  if (!clientId || typeof clientId !== 'string') return null;
  const trimmed = clientId.trim();
  if (!trimmed || trimmed.includes('dummy') || !trimmed.endsWith('.apps.googleusercontent.com')) {
    return null;
  }
  const prefix = trimmed.replace(/\.apps\.googleusercontent\.com$/i, '');
  return prefix ? `com.googleusercontent.apps.${prefix}` : null;
}

module.exports = ({ config }) => {
  const androidScheme = extractGoogleReverseScheme(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
  const iosScheme = extractGoogleReverseScheme(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID);

  const nextAndroidFilters = Array.isArray(config.android?.intentFilters)
    ? [...config.android.intentFilters]
    : [];

  if (androidScheme) {
    const hasFilter = nextAndroidFilters.some(filter =>
      Array.isArray(filter.data) && filter.data.some(d => d?.scheme === androidScheme)
    );
    if (!hasFilter) {
      nextAndroidFilters.push({
        action: 'VIEW',
        data: [{ scheme: androidScheme, pathPrefix: '/oauthredirect' }, { scheme: androidScheme }],
        category: ['BROWSABLE', 'DEFAULT'],
      });
    }
  }

  const existingUrlTypes = Array.isArray(config.ios?.infoPlist?.CFBundleURLTypes)
    ? [...config.ios.infoPlist.CFBundleURLTypes]
    : [];

  if (iosScheme) {
    const hasIosScheme = existingUrlTypes.some(t =>
      Array.isArray(t?.CFBundleURLSchemes) && t.CFBundleURLSchemes.includes(iosScheme)
    );
    if (!hasIosScheme) {
      existingUrlTypes.push({ CFBundleURLSchemes: [iosScheme] });
    }
  }

  return {
    ...config,
    android: {
      ...config.android,
      intentFilters: nextAndroidFilters,
    },
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        ...(existingUrlTypes.length > 0 ? { CFBundleURLTypes: existingUrlTypes } : {}),
      },
    },
  };
};
