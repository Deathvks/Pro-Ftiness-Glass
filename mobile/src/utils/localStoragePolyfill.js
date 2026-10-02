import AsyncStorage from '@react-native-async-storage/async-storage';

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
