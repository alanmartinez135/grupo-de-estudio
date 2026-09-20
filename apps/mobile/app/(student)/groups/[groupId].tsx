import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function GroupDetailScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useAppStore((s) => s.groups.find((g) => g.id === groupId));
  const users = useAppStore((s) => s.users);
  const weeklyTests = useAppStore((s) => s.weeklyTests.filter((t) => t.groupId === groupId));
  const [tab, setTab] = useState<"members" | "tests">("members");
  const [copied, setCopied] = useState(false);

  if (!group) {
    return (
      <Screen>
        <Text className="text-ink-light dark:text-ink-dark">Grupo no encontrado.</Text>
      </Screen>
    );
  }

  function copyCode() {
    // Copia real solo disponible en web (Clipboard API del navegador);
    // en móvil el mock solo muestra la confirmación visual.
    if (Platform.OS === "web" && typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(group!.code).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const members = users.filter((u) => group.memberIds.includes(u.id));

  return (
    <Screen scroll={false}>
      <Card className="mb-4">
        <Text className="text-xl font-bold text-ink-light dark:text-ink-dark mb-1">{group.name}</Text>
        <Text className="text-ink-muted dark:text-ink-mutedDark mb-3">{group.description}</Text>
        <Pressable onPress={copyCode} className="self-start flex-row items-center gap-2 bg-navy-50 dark:bg-navy-800 rounded-full px-4 py-2">
          <Text className="font-semibold text-navy-700 dark:text-gold-500">{group.code}</Text>
          <Text className="text-navy-700 dark:text-gold-500 text-xs">{copied ? "¡Copiado!" : "Copiar"}</Text>
        </Pressable>
      </Card>

      <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1 mb-4">
        <Pressable onPress={() => setTab("members")} className={`flex-1 rounded-full py-2 items-center ${tab === "members" ? "bg-white dark:bg-navy-700" : ""}`}>
          <Text className={`font-semibold ${tab === "members" ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>Integrantes</Text>
        </Pressable>
        <Pressable onPress={() => setTab("tests")} className={`flex-1 rounded-full py-2 items-center ${tab === "tests" ? "bg-white dark:bg-navy-700" : ""}`}>
          <Text className={`font-semibold ${tab === "tests" ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>Tests semanales</Text>
        </Pressable>
      </View>

      {tab === "members" ? (
        <View className="gap-2.5">
          {members.map((m) => (
            <Card key={m.id} className="flex-row items-center gap-3">
              <Avatar name={m.name} color={m.avatarColor} />
              <View className="flex-1">
                <Text className="font-semibold text-ink-light dark:text-ink-dark">{m.name}</Text>
                <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{m.career}</Text>
              </View>
              {m.id === group.createdBy && <Badge label="Creador" tone="gold" />}
            </Card>
          ))}
        </View>
      ) : (
        <View className="gap-2.5">
          {weeklyTests.length === 0 ? (
            <Card><Text className="text-ink-muted dark:text-ink-mutedDark">Este grupo aún no tiene tests asignados.</Text></Card>
          ) : (
            weeklyTests.map((t) => (
              <Card key={t.id} className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-ink-light dark:text-ink-dark mb-1">{t.title}</Text>
                  <View className="flex-row gap-2">
                    <Badge label={t.skill === "reading" ? "Lectura" : "Escritura"} tone="navy" />
                    <Badge label={t.status === "completed" ? "Completado" : "Pendiente"} tone={t.status === "completed" ? "success" : "gold"} />
                  </View>
                </View>
                <Button label={t.status === "completed" ? "Ver" : "Resolver"} size="sm" onPress={() => router.push(`/(student)/weekly-tests/${t.id}`)} />
              </Card>
            ))
          )}
        </View>
      )}
    </Screen>
  );
}
