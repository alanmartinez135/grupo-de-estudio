import { Pressable, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { useT } from "@/lib/useT";
import type { TKey } from "@/lib/i18n";

interface NavItem {
  labelKey: TKey;
  href: string;
}

export function AppHeader({ navItems }: { navItems: NavItem[] }) {
  const pathname = usePathname();
  const authUser = useAppStore((s) => s.authUser);
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const t = useT();

  return (
    <View className="bg-navy-700 px-5 pt-3 pb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-9 h-9 rounded-full bg-gold-500 items-center justify-center">
            <Text className="text-navy-800 font-extrabold text-sm">DU</Text>
          </View>
          <Text className="text-white font-bold text-base">{t("app.name")}</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={toggleTheme}
            className="w-9 h-9 rounded-full bg-navy-600 items-center justify-center"
          >
            <Text className="text-white">{theme === "dark" ? "☀︎" : "☾"}</Text>
          </Pressable>
          {authUser && (
            <Pressable onPress={() => router.push("/(student)/settings")}>
              <Avatar name={authUser.name} color={authUser.avatarColor} size={34} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="flex-row flex-wrap gap-2 mt-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href as any)}
              className={`px-4 py-2 rounded-full ${active ? "bg-gold-500" : "bg-navy-600"}`}
            >
              <Text className={`text-sm font-semibold ${active ? "text-navy-800" : "text-white"}`}>{t(item.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
