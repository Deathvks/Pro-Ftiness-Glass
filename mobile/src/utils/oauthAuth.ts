import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import useAppStore from '@/store/useAppStore';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'discord' | 'facebook' | 'x' | 'github' | 'spotify';

const APP_SCHEME = 'profitnessglass';

function isConfiguredClientId(value?: string | null): value is string {
  if (!value) return false;
  const trimmed = value.trim();
  return Boolean(trimmed) && !trimmed.includes('dummy');
}

function getGoogleReverseRedirectUri(clientId: string): string {
  const prefix = clientId.trim().replace(/\.apps\.googleusercontent\.com$/i, '');
  return `com.googleusercontent.apps.${prefix}:/oauthredirect`;
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const bytes = Crypto.getRandomBytes(32);
  const verifier = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return { verifier, challenge: toBase64Url(digest) };
}

function extractAuthParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  const queryParts: string[] = [];
  const qIdx = url.indexOf('?');
  const hIdx = url.indexOf('#');
  if (qIdx >= 0) {
    queryParts.push(url.slice(qIdx + 1, hIdx > qIdx ? hIdx : undefined));
  }
  if (hIdx >= 0) {
    queryParts.push(url.slice(hIdx + 1));
  }
  queryParts.forEach(part => {
    part.split('&').forEach(pair => {
      const eq = pair.indexOf('=');
      if (eq > 0) {
        const key = decodeURIComponent(pair.slice(0, eq));
        const val = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
        params[key] = val;
      }
    });
  });
  return params;
}

async function exchangeGoogleCode(
  code: string,
  clientId: string,
  redirectUri: string,
  codeVerifier: string,
): Promise<string> {
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  }).toString();

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'No se pudo validar el acceso con Google.');
  }

  const token = data.access_token || data.id_token;
  if (!token) {
    throw new Error('Google no devolvió ningún token de sesión.');
  }
  return token;
}

export async function runOAuthFlow(
  provider: OAuthProvider,
  explicitReferralCode?: string | null,
): Promise<boolean> {
  const defaultRedirectUri = AuthSession.makeRedirectUri({ scheme: APP_SCHEME, path: 'oauth' });
  let activeRedirectUri = defaultRedirectUri;
  const store: any = useAppStore.getState();

  const storedRef =
    typeof localStorage !== 'undefined' ? localStorage.getItem('pending_ref') : null;
  const referralCode = (explicitReferralCode || storedRef || '').trim() || undefined;

  let authUrl = '';
  let pkceVerifier = '';
  let googleNativeClientId = '';
  let githubClientId = '';

  if (provider === 'google') {
    if (Platform.OS === 'web') {
      const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
      if (!isConfiguredClientId(clientId)) throw new Error('Google OAuth no está configurado.');
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&response_type=token&scope=${encodeURIComponent('email profile')}&state=google`;
    } else {
      const platformClientId =
        Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
          : process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

      if (!isConfiguredClientId(platformClientId)) {
        const missingKey =
          Platform.OS === 'ios'
            ? 'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'
            : 'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID';
        throw new Error(`Falta configurar ${missingKey} para iniciar sesión con Google en ${Platform.OS}.`);
      }

      googleNativeClientId = platformClientId.trim();
      activeRedirectUri = getGoogleReverseRedirectUri(googleNativeClientId);
      const pkce = await generatePkcePair();
      pkceVerifier = pkce.verifier;
      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(googleNativeClientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&state=google&code_challenge=${encodeURIComponent(pkce.challenge)}&code_challenge_method=S256`;
    }
  } else if (provider === 'discord') {
    const clientId = process.env.EXPO_PUBLIC_DISCORD_CLIENT_ID;
    if (!isConfiguredClientId(clientId)) throw new Error('Discord OAuth no está configurado.');
    authUrl = `https://discord.com/api/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&response_type=token&scope=${encodeURIComponent('identify email')}&state=discord`;
  } else if (provider === 'facebook') {
    const clientId = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_ID;
    if (!isConfiguredClientId(clientId)) throw new Error('Facebook OAuth no está configurado.');
    authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&response_type=token&scope=${encodeURIComponent('email,public_profile')}&state=facebook`;
  } else if (provider === 'x') {
    const clientId = process.env.EXPO_PUBLIC_X_CLIENT_ID;
    if (!isConfiguredClientId(clientId)) throw new Error('X (Twitter) OAuth no está configurado.');
    const pkce = await generatePkcePair();
    pkceVerifier = pkce.verifier;
    authUrl = `https://x.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&scope=${encodeURIComponent('tweet.read users.read')}&state=x&code_challenge=${encodeURIComponent(pkce.challenge)}&code_challenge_method=S256`;
  } else if (provider === 'github') {
    const clientId =
      process.env.EXPO_PUBLIC_GITHUB_MOBILE_CLIENT_ID || process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID;
    if (!isConfiguredClientId(clientId)) throw new Error('GitHub OAuth no está configurado.');
    githubClientId = clientId.trim();
    authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(githubClientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&scope=${encodeURIComponent('user:email')}&state=github`;
  } else if (provider === 'spotify') {
    const clientId = process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!isConfiguredClientId(clientId)) throw new Error('Spotify OAuth no está configurado en esta compilación.');
    authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(activeRedirectUri)}&scope=${encodeURIComponent('user-read-email user-read-private')}&state=spotify`;
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, activeRedirectUri);
  if (result.type !== 'success' || !result.url) {
    return false;
  }

  const params = extractAuthParams(result.url);
  if (params.error) {
    throw new Error(params.error_description || params.error);
  }

  if (provider === 'google') {
    let googleToken = params.access_token || params.id_token;
    if (!googleToken && params.code && googleNativeClientId) {
      googleToken = await exchangeGoogleCode(
        params.code,
        googleNativeClientId,
        activeRedirectUri,
        pkceVerifier,
      );
    }
    if (!googleToken) throw new Error('No se recibió el token de Google.');
    await store.handleGoogleLogin({ token: googleToken, referralCode });
  } else if (provider === 'discord') {
    if (!params.access_token) throw new Error('No se recibió el token de Discord.');
    await store.handleDiscordLogin({ token: params.access_token, referralCode });
  } else if (provider === 'facebook') {
    if (!params.access_token) throw new Error('No se recibió el token de Facebook.');
    await store.handleFacebookLogin({ token: params.access_token, referralCode });
  } else if (provider === 'x') {
    if (!params.code) throw new Error('No se recibió el código de autorización de X.');
    await store.handleXLogin({
      code: params.code,
      redirectUri: activeRedirectUri,
      codeVerifier: pkceVerifier,
      referralCode,
    });
  } else if (provider === 'github') {
    if (!params.code) throw new Error('No se recibió el código de autorización de GitHub.');
    await store.handleGithubLogin({
      code: params.code,
      redirectUri: activeRedirectUri,
      clientId: githubClientId,
      referralCode,
    });
  } else if (provider === 'spotify') {
    if (!params.code) throw new Error('No se recibió el código de autorización de Spotify.');
    await store.handleSpotifyLogin({
      code: params.code,
      redirectUri: activeRedirectUri,
      referralCode,
    });
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('pending_ref');
  }
  return true;
}
