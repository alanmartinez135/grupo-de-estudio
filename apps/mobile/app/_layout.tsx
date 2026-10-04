import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { colorScheme } from "nativewind";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "react-native-reanimated";
import "../global.css";
import { useAppStore } from "@/store/useAppStore";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const theme = useAppStore((s) => s.theme);
  const restoreSession = useAppStore((s) => s.restoreSession);
  const loadPreferences = useAppStore((s) => s.loadPreferences);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Al abrir la app, recupera la sesión guardada (si existe) contra el API.
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Idioma y tema elegidos la última vez.
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Sincroniza el toggle claro/oscuro del store con las variantes `dark:` de NativeWind.
  useEffect(() => {
    colorScheme.set(theme);
  }, [theme]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(admin)" />
      </Stack>
    </QueryClientProvider>
  );
}
