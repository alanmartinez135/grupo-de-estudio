import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "@/components/AppHeader";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import type { TKey } from "@/lib/i18n";

const navItems: { labelKey: TKey; href: string }[] = [
  { labelKey: "nav.users", href: "/(admin)/users" },
  { labelKey: "nav.tests", href: "/(admin)/tests" },
];

export default function AdminLayout() {
  const authUser = useAppStore((s) => s.authUser);
  const theme = useAppStore((s) => s.theme);
  const sessionChecked = useAppStore((s) => s.sessionChecked);

  if (!sessionChecked) return null;
  if (!authUser) return <Redirect href="/(auth)/login" />;
  // El servidor rechaza igual a quien no es administrador (RNF-B06); esto evita mostrarle la pantalla.
  if (authUser.role !== "admin") return <Redirect href="/(student)/dashboard" />;

  return (
    <View className={`flex-1 ${theme === "dark" ? "bg-surface-dark" : "bg-surface-light"}`}>
      <AppHeader navItems={navItems} />
      <Stack screenOptions={{ headerShown: false }} />
      <RoleSwitcher />
    </View>
  );
}
