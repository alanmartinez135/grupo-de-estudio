// Diccionario de traducción liviano para el mockup.
// El paquete @grupo-estudio/i18n queda como stub para la integración real de i18next;
// aquí resolvemos el selector Español/English de forma directa y sin dependencias de red.
import { useAppStore } from "@/store/useAppStore";

const dict = {
  es: {
    dashboard: "Inicio",
    groups: "Grupos",
    chat: "Comunidad",
    settings: "Ajustes",
    diagnosticTest: "Evaluación diagnóstica",
    signOut: "Cerrar sesión",
    deleteAccount: "Eliminar cuenta",
    lightMode: "Modo claro",
    darkMode: "Modo oscuro",
    language: "Idioma",
  },
  en: {
    dashboard: "Home",
    groups: "Groups",
    chat: "Community",
    settings: "Settings",
    diagnosticTest: "Diagnostic test",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    lightMode: "Light mode",
    darkMode: "Dark mode",
    language: "Language",
  },
} as const;

type DictKey = keyof (typeof dict)["es"];

export function useT() {
  const language = useAppStore((s) => s.language);
  return (key: DictKey) => dict[language][key] ?? key;
}
