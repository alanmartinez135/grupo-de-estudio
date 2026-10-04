import { useEffect } from "react";
import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "@/components/AppHeader";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import type { TKey } from "@/lib/i18n";

const navItems: { labelKey: TKey; href: string }[] = [
  { labelKey: "nav.dashboard", href: "/(student)/dashboard" },
  { labelKey: "nav.diagnostic", href: "/(student)/diagnostic-test" },
  { labelKey: "nav.groups", href: "/(student)/groups" },
  { labelKey: "nav.community", href: "/(student)/chat" },
  { labelKey: "nav.settings", href: "/(student)/settings" },
];

export default function StudentLayout() {
  const authUser = useAppStore((s) => s.authUser);
  const theme = useAppStore((s) => s.theme);
  const sessionChecked = useAppStore((s) => s.sessionChecked);
  const loadGroups = useAppStore((s) => s.loadGroups);
  const loadWeeklyTests = useAppStore((s) => s.loadWeeklyTests);
  const loadDiagnostic = useAppStore((s) => s.loadDiagnostic);
  const userId = authUser?.id;

  // Datos del estudiante desde la API: grupos, tests semanales y resultado del diagnóstico.
  useEffect(() => {
    if (!userId) return;
    loadGroups();
    loadWeeklyTests();
    loadDiagnostic();
  }, [userId, loadGroups, loadWeeklyTests, loadDiagnostic]);

  if (!sessionChecked) return null;
  if (!authUser) return <Redirect href="/(auth)/login" />;

  return (
    <View className={`flex-1 ${theme === "dark" ? "bg-surface-dark" : "bg-surface-light"}`}>
      <AppHeader navItems={navItems} />
      <Stack screenOptions={{ headerShown: false }} />
      <RoleSwitcher />
    </View>
  );
}
