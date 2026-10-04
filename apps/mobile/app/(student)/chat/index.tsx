import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function ChatListScreen() {
  const friends = useAppStore((s) => s.friends);
  const t = useT();
  const chats = useAppStore((s) => s.chats);
  const addFriend = useAppStore((s) => s.addFriend);
  const [query, setQuery] = useState("");

  const filtered = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const exactNoMatch = query.trim().length > 2 && filtered.length === 0;

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-4">{t("chat.title")}</Text>
      <Input label={t("chat.search")} placeholder={t("chat.searchPlaceholder")} value={query} onChangeText={setQuery} />

      {exactNoMatch && (
        <Card className="mb-4 flex-row items-center justify-between">
          <Text className="text-ink-muted dark:text-ink-mutedDark flex-1 pr-3">{t("chat.noResults", { query })}</Text>
          <Pressable onPress={() => { addFriend(query); setQuery(""); }} className="bg-gold-500 rounded-full px-4 py-2">
            <Text className="text-navy-800 font-semibold text-sm">{t("chat.add")}</Text>
          </Pressable>
        </Card>
      )}

      <Text className="text-sm font-semibold text-ink-muted dark:text-ink-mutedDark mb-3">{t("chat.friends")}</Text>
      <View className="gap-2.5">
        {filtered.map((f) => {
          const lastMessage = chats[f.id]?.[chats[f.id].length - 1];
          return (
            <Pressable key={f.id} onPress={() => router.push(`/(student)/chat/${f.id}`)}>
              <Card className="flex-row items-center gap-3">
                <View>
                  <Avatar name={f.name} color={f.avatarColor} size={44} />
                  {f.online && <View className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-surface-cardDark" />}
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-ink-light dark:text-ink-dark">{f.name}</Text>
                  <Text className="text-sm text-ink-muted dark:text-ink-mutedDark" numberOfLines={1}>
                    {lastMessage ? lastMessage.text : f.career}
                  </Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
