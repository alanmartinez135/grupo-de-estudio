import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { Language, Theme } from "@/data/mockData";

// Preferencias de la interfaz (idioma y tema) que se recuerdan entre aperturas de la app.
// En Android/iOS se guardan con expo-secure-store; en web, en localStorage del navegador.
export interface Preferences {
  language?: Language;
  theme?: Theme;
}

const KEY = "grupo-estudio.preferences";
const native = Platform.OS === "ios" || Platform.OS === "android";
// localStorage solo existe en el navegador; se declara aquí para no depender de los tipos del DOM.
const web = globalThis as unknown as {
  localStorage?: { getItem(key: string): string | null; setItem(key: string, value: string): void };
};

export async function loadPreferences(): Promise<Preferences> {
  try {
    const raw = native ? await SecureStore.getItemAsync(KEY) : web.localStorage?.getItem(KEY) ?? null;
    return raw ? (JSON.parse(raw) as Preferences) : {};
  } catch {
    return {};
  }
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  try {
    const raw = JSON.stringify(prefs);
    if (native) await SecureStore.setItemAsync(KEY, raw);
    else web.localStorage?.setItem(KEY, raw);
  } catch {
    // Si no se puede guardar, la preferencia vale solo para esta sesión.
  }
}
