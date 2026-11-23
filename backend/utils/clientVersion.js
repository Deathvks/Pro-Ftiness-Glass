/* backend/utils/clientVersion.js */
const VERSION_REGEX = /^[0-9A-Za-z._+-]{1,32}$/;
const PRE_RELEASE_REGEX = /(?:^|[-.])(beta|alpha|rc)(?:[.-]|\d|$)/i;
const ALLOWED_CHANNELS = new Set(['beta', 'stable']);
const ALLOWED_OS = new Set(['android', 'ios', 'web']);

export const extractClientMetadata = (req) => {
  const headers = req?.headers || {};
  const rawVersion = typeof headers['x-app-version'] === 'string'
    ? headers['x-app-version'].trim().slice(0, 32)
    : '';
  const appVersion = rawVersion && VERSION_REGEX.test(rawVersion) ? rawVersion : null;

  const rawChannel = typeof headers['x-app-channel'] === 'string'
    ? headers['x-app-channel'].trim().toLowerCase()
    : '';
  let appChannel = ALLOWED_CHANNELS.has(rawChannel) ? rawChannel : null;
  if (!appChannel && appVersion) {
    appChannel = PRE_RELEASE_REGEX.test(appVersion) ? 'beta' : 'stable';
  }

  const rawOs = typeof headers['x-app-os'] === 'string'
    ? headers['x-app-os'].trim().toLowerCase()
    : '';
  const rawPlatform = typeof headers['x-app-platform'] === 'string'
    ? headers['x-app-platform'].trim().toLowerCase()
    : '';
  let appOs = ALLOWED_OS.has(rawOs) ? rawOs : null;
  if (!appOs && (rawPlatform === 'web' || rawPlatform === 'pwa')) {
    appOs = 'web';
  }

  return { appVersion, appChannel, appOs };
};

export const buildClientSessionFields = (req) => {
  const { appVersion, appChannel, appOs } = extractClientMetadata(req);
  const fields = {};
  if (appVersion) fields.app_version = appVersion;
  if (appChannel) fields.app_channel = appChannel;
  if (appOs) fields.app_os = appOs;
  return fields;
};
