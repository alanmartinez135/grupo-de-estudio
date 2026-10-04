import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const authUser = useAppStore((s) => s.authUser);
  const activeRole = useAppStore((s) => s.activeRole);
  const sessionChecked = useAppStore((s) => s.sessionChecked);

  // Espera a saber si hay una sesión guardada antes de decidir a dónde ir.
  if (!sessionChecked) return null;

  if (!authUser) return <Redirect href="/(auth)/login" />;
  if (activeRole === "admin") return <Redirect href="/(admin)/users" />;
  return <Redirect href="/(student)/dashboard" />;
}
