import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "@/components/AppHeader";
import { RoleSwitcher } from "@/components/RoleSwitcher";

const navItems = [
  { label: "Usuarios", href: "/(admin)/users" },
  { label: "Evaluaciones", href: "/(admin)/tests" },
];

export default function AdminLayout() {
  const authUser = useAppStore((s) => s.authUser);
  const theme = useAppStore((s) => s.theme);

  if (!authUser) return <Redirect href="/(auth)/login" />;

  return (
    <View className={`flex-1 ${theme === "dark" ? "bg-surface-dark" : "bg-surface-light"}`}>
      <AppHeader navItems={navItems} />
      <Stack screenOptions={{ headerShown: false }} />
      <RoleSwitcher />
    </View>
  );
}
