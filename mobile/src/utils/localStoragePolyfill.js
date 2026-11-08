import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

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

export const initLocalStorage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      memoryStore[key] = value;
    });
  } catch (e) {
    console.error('Error loading AsyncStorage to memory', e);
  }
};

global.localStorage = {
  getItem: (key) => memoryStore[key] || null,
  setItem: (key, value) => {
    memoryStore[key] = String(value);
    AsyncStorage.setItem(key, String(value)).catch(() => {});
  },
  removeItem: (key) => {
    delete memoryStore[key];
    AsyncStorage.removeItem(key).catch(() => {});
  },
  clear: () => {
    Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
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
