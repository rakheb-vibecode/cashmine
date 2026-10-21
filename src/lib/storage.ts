import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secrets go to the Keychain/Keystore on native. SecureStore has no web support;
// AsyncStorage is backed by localStorage there.
type Options = { secure?: boolean };

const isSecure = (o?: Options) => !!o?.secure && Platform.OS !== 'web';

export async function readItem(key: string, o?: Options): Promise<string | null> {
  try {
    return isSecure(o) ? await SecureStore.getItemAsync(key) : await AsyncStorage.getItem(key);
  } catch (e) {
    console.warn(`storage: could not read ${key}`, e);
    return null;
  }
}

export function writeItem(key: string, value: string | null, o?: Options): void {
  const secure = isSecure(o);
  // Promise.resolve().then also catches a synchronous throw (e.g. a missing native module).
  const op = Promise.resolve().then(() =>
    value == null
      ? secure
        ? SecureStore.deleteItemAsync(key)
        : AsyncStorage.removeItem(key)
      : secure
        ? SecureStore.setItemAsync(key, value)
        : AsyncStorage.setItem(key, value),
  );
  op.catch((e: unknown) => console.warn(`storage: could not write ${key}`, e));
}
