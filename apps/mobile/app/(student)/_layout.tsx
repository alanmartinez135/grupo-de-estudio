import { View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { AppHeader } from "@/components/AppHeader";
import { RoleSwitcher } from "@/components/RoleSwitcher";

const navItems = [
  { label: "Inicio", href: "/(student)/dashboard" },
  { label: "Evaluación diagnóstica", href: "/(student)/diagnostic-test" },
  { label: "Grupos", href: "/(student)/groups" },
  { label: "Comunidad", href: "/(student)/chat" },
  { label: "Ajustes", href: "/(student)/settings" },
];

export default function StudentLayout() {
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
