import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function ChatConversationScreen() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const t = useT();
  const friend = useAppStore((s) => s.friends.find((f) => f.id === friendId));
  const messages = useAppStore((s) => s.chats[friendId as string] ?? []);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const authUser = useAppStore((s) => s.authUser);
  const dark = useAppStore((s) => s.theme === "dark");
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim() || !friendId) return;
    sendMessage(friendId, text.trim());
    setText("");
  }

  return (
    <SafeAreaView className={`flex-1 ${dark ? "bg-surface-dark" : "bg-surface-light"}`}>
      <View className="bg-navy-700 px-4 pt-2 pb-3 flex-row items-center gap-3">
        <Pressable onPress={() => router.back()} className="w-9 h-9 rounded-full bg-navy-600 items-center justify-center">
          <Text className="text-white">←</Text>
        </Pressable>
        <Avatar name={friend?.name ?? "?"} color={friend?.avatarColor} size={36} />
        <View>
          <Text className="text-white font-semibold">{friend?.name}</Text>
          <Text className="text-navy-100 text-xs">{friend?.online ? t("chat.online") : t("chat.offline")}</Text>
        </View>
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }} className="flex-1">
          {messages.map((m) => {
            const mine = m.senderId === authUser?.id;
            return (
              <View key={m.id} className={`max-w-[80%] mb-2 ${mine ? "self-end items-end" : "self-start items-start"}`}>
                <View className={`rounded-2xl px-4 py-2.5 ${mine ? "bg-navy-700 rounded-br-md" : "bg-white dark:bg-surface-cardDark rounded-bl-md"}`}>
                  <Text className={mine ? "text-white" : "text-ink-light dark:text-ink-dark"}>{m.text}</Text>
                </View>
                <Text className="text-[10px] text-ink-muted dark:text-ink-mutedDark mt-0.5 px-1">{m.sentAt}</Text>
              </View>
            );
          })}
        </ScrollView>

        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-navy-50 dark:border-navy-800">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t("chat.placeholder")}
            placeholderTextColor={dark ? "#5B6B85" : "#9AA8C2"}
            className={`flex-1 rounded-full px-4 py-2.5 border ${dark ? "border-navy-600 bg-surface-cardDark text-ink-dark" : "border-navy-100 bg-white text-ink-light"}`}
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} className="w-11 h-11 rounded-full bg-gold-500 items-center justify-center">
            <Text className="text-navy-800 font-bold">➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
