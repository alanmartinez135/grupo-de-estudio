import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { translate, type TKey } from "./i18n";

// Traductor para componentes. Al cambiar el idioma en Ajustes, los componentes que lo usan
// se vuelven a dibujar en el idioma nuevo.
export function useT() {
  const language = useAppStore((s) => s.language);
  return useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
}
