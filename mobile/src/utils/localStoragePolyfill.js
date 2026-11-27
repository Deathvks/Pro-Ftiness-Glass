import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_KEYS = new Set(['pro_fitness_token', 'fittrack_token']);
const canUseSecureStore = Platform.OS !== 'web';

// Polyfill global crypto para React Native / Hermes
if (typeof global.crypto === 'undefined' || !global.crypto) {
  global.crypto = {
    getRandomValues: (array) => Crypto.getRandomValues(array),
    randomUUID: () => Crypto.randomUUID(),
  };
} else {
  if (!global.crypto.getRandomValues) {
    global.crypto.getRandomValues = (array) => Crypto.getRandomValues(array);
  }
  if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = () => Crypto.randomUUID();
  }
}
if (typeof globalThis !== 'undefined') {
  globalThis.crypto = global.crypto;
}
if (typeof window !== 'undefined') {
  window.crypto = global.crypto;
}

const memoryStore = {};

export const setSecureTokenItem = (key, value) => {
  const stringVal = String(value);
  memoryStore[key] = stringVal;
  if (canUseSecureStore) {
    SecureStore.setItemAsync(key, stringVal).catch((err) => {
      console.warn('[SecureStore] Error guardando token:', err?.message || err);
    });
    AsyncStorage.removeItem(key).catch(() => {});
  } else {
    AsyncStorage.setItem(key, stringVal).catch(() => {});
  }
};

export const removeSecureTokenItem = (key) => {
  delete memoryStore[key];
  if (canUseSecureStore) {
    SecureStore.deleteItemAsync(key).catch(() => {});
  }
  AsyncStorage.removeItem(key).catch(() => {});
};

export const initLocalStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      memoryStore[key] = value;
    });

    if (canUseSecureStore) {
      for (const secureKey of SECURE_KEYS) {
        let secureVal = null;
        try {
          secureVal = await SecureStore.getItemAsync(secureKey);
        } catch (secErr) {
          console.warn(`[SecureStore] Error leyendo ${secureKey}:`, secErr?.message || secErr);
        }

        const legacyVal = memoryStore[secureKey];
        if (secureVal) {
          memoryStore[secureKey] = secureVal;
          // Limpiar cualquier copia antigua en AsyncStorage sin cifrar
          if (legacyVal !== undefined) {
            AsyncStorage.removeItem(secureKey).catch(() => {});
          }
        } else if (legacyVal) {
          // Migración transparente desde AsyncStorage al almacén cifrado por hardware (Keystore / Keychain)
          try {
            await SecureStore.setItemAsync(secureKey, String(legacyVal));
            await AsyncStorage.removeItem(secureKey);
          } catch (migErr) {
            console.warn(`[SecureStore] Error migrando ${secureKey}:`, migErr?.message || migErr);
          }
        }
      }
    }
  } catch (e) {
    console.error('Error loading storage to memory', e);
  }
};

global.localStorage = {
  getItem: (key) => memoryStore[key] || null,
  setItem: (key, value) => {
    if (SECURE_KEYS.has(key)) {
      setSecureTokenItem(key, value);
      return;
    }
    memoryStore[key] = String(value);
    AsyncStorage.setItem(key, String(value)).catch(() => {});
  },
  removeItem: (key) => {
    if (SECURE_KEYS.has(key)) {
      removeSecureTokenItem(key);
      return;
    }
    delete memoryStore[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },
  clear: () => {
    Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
    if (canUseSecureStore) {
      SECURE_KEYS.forEach((key) => {
        SecureStore.deleteItemAsync(key).catch(() => {});
      });
    }
    AsyncStorage.clear().catch(() => {});
  }
};

if (typeof window === 'undefined') {
  global.window = {
    location: { origin: '' },
    matchMedia: () => ({ matches: false })
  };
}
if (typeof navigator === 'undefined') {
  global.navigator = {};
}
