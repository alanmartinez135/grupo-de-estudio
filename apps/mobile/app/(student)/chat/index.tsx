import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { useAppStore } from "@/store/useAppStore";

export default function ChatListScreen() {
  const friends = useAppStore((s) => s.friends);
  const chats = useAppStore((s) => s.chats);
  const addFriend = useAppStore((s) => s.addFriend);
  const [query, setQuery] = useState("");

  const filtered = friends.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const exactNoMatch = query.trim().length > 2 && filtered.length === 0;

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-4">Comunidad</Text>
      <Input label="Buscar personas" placeholder="Buscar por nombre..." value={query} onChangeText={setQuery} />

      {exactNoMatch && (
        <Card className="mb-4 flex-row items-center justify-between">
          <Text className="text-ink-muted dark:text-ink-mutedDark flex-1 pr-3">Sin resultados para "{query}"</Text>
          <Pressable onPress={() => { addFriend(query); setQuery(""); }} className="bg-gold-500 rounded-full px-4 py-2">
            <Text className="text-navy-800 font-semibold text-sm">+ Agregar</Text>
          </Pressable>
        </Card>
      )}

      <Text className="text-sm font-semibold text-ink-muted dark:text-ink-mutedDark mb-3">MIS AMIGOS</Text>
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
