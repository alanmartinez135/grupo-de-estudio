import { Redirect } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export default function Index() {
  const authUser = useAppStore((s) => s.authUser);
  const activeRole = useAppStore((s) => s.activeRole);

  if (!authUser) return <Redirect href="/(auth)/login" />;
  if (activeRole === "admin") return <Redirect href="/(admin)/users" />;
  return <Redirect href="/(student)/dashboard" />;
}
