import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { TokenStore, Tokens } from "@grupo-estudio/api";

// Tokens de sesión. En Android/iOS se guardan cifrados con expo-secure-store
// (Keystore / Keychain). En web no hay almacenamiento seguro equivalente, así que
// quedan solo en memoria: al recargar la página hay que iniciar sesión de nuevo.
const ACCESS_KEY = "grupo-estudio.accessToken";
const REFRESH_KEY = "grupo-estudio.refreshToken";

let memory: Tokens | null = null;
const native = Platform.OS === "ios" || Platform.OS === "android";

export const tokenStore: TokenStore = {
  async get() {
    if (!native) return memory;
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    return accessToken && refreshToken ? { accessToken, refreshToken } : null;
  },
  async set(tokens) {
    if (!native) {
      memory = tokens;
      return;
    }
    if (tokens) {
      await SecureStore.setItemAsync(ACCESS_KEY, tokens.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken);
    } else {
      await SecureStore.deleteItemAsync(ACCESS_KEY);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
    }
  },
};
