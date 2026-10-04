import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { Meeting } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import { formatMeetingDate } from "@/components/MeetingsTab";
import { useT } from "@/lib/useT";

export default function DashboardScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const t = useT();
  const diagnosticCompleted = useAppStore((s) => s.diagnosticCompleted);
  const groups = useAppStore((s) => s.groups);
  const weeklyTests = useAppStore((s) => s.weeklyTests);
  const myGroups = groups.filter((g) => g.memberIds.includes(authUser?.id ?? ""));
  // La API ya entrega solo los tests de los niveles de mis grupos.
  const pendingTests = weeklyTests.filter((t) => t.status === "pending");
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  // Próximos encuentros de mis grupos; se recargan cada vez que se vuelve al inicio.
  useFocusEffect(
    useCallback(() => {
      api.meetings.upcoming().then(setMeetings).catch(() => {});
    }, []),
  );

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-1">{t("dash.hello", { name: authUser?.name.split(" ")[0] ?? "" })}</Text>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-6">{t("dash.subtitle")}</Text>

      {!diagnosticCompleted && (
        <Card className="mb-4 bg-navy-700">
          <Text className="text-white font-bold text-base mb-1">{t("dash.diagTitle")}</Text>
          <Text className="text-navy-100 mb-4">{t("dash.diagBody")}</Text>
          <Button label={t("dash.diagButton")} variant="secondary" onPress={() => router.push("/(student)/diagnostic-test")} />
        </Card>
      )}

      <View className="flex-row flex-wrap gap-3 mb-4">
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{myGroups.length}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">{t("dash.groups")}</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{pendingTests.length}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">{t("dash.pendingTests")}</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{authUser?.englishLevel}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">{t("dash.level")}</Text>
        </Card>
      </View>

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-3">{t("dash.upcoming")}</Text>
      {meetings.length === 0 ? (
        <Card className="mb-4">
          <Text className="text-ink-muted dark:text-ink-mutedDark">{t("dash.noMeetings")}</Text>
        </Card>
      ) : (
        meetings.slice(0, 3).map((m) => (
          <Pressable key={m.id} onPress={() => router.push(`/(student)/groups/${m.groupId}`)}>
            <Card className="mb-3">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="flex-1 pr-2 font-semibold text-ink-light dark:text-ink-dark">{m.topic}</Text>
                <Badge label={m.myResponse === "yes" ? t("meet.yes") : m.myResponse === "no" ? t("meet.no") : t("meet.noAnswer")} tone={m.myResponse === "yes" ? "success" : "gold"} />
              </View>
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">
                {m.groupName} · {formatMeetingDate(m.startsAt)}
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-3 mt-2">{t("dash.weeklyPending")}</Text>
      {pendingTests.length === 0 ? (
        <Card>
          <Text className="text-ink-muted dark:text-ink-mutedDark">{t("dash.noTests")}</Text>
        </Card>
      ) : (
        pendingTests.map((test) => (
          <Card key={test.id} className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-ink-light dark:text-ink-dark mb-1">{test.title}</Text>
                <Badge label={test.skill === "reading" ? t("common.reading") : t("common.writing")} tone="navy" />
              </View>
              <Button label={t("common.solve")} size="sm" onPress={() => router.push(`/(student)/weekly-tests/${test.id}`)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
