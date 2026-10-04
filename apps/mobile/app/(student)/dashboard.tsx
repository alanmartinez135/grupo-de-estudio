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

export default function DashboardScreen() {
  const authUser = useAppStore((s) => s.authUser);
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
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-1">Hola, {authUser?.name.split(" ")[0]} 👋</Text>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-6">Este es tu resumen de la semana.</Text>

      {!diagnosticCompleted && (
        <Card className="mb-4 bg-navy-700">
          <Text className="text-white font-bold text-base mb-1">Aún no rindes tu evaluación diagnóstica</Text>
          <Text className="text-navy-100 mb-4">Complétala para conocer tu nivel de inglés y recibir recomendaciones personalizadas.</Text>
          <Button label="Rendir evaluación" variant="secondary" onPress={() => router.push("/(student)/diagnostic-test")} />
        </Card>
      )}

      <View className="flex-row flex-wrap gap-3 mb-4">
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{myGroups.length}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">Grupos de estudio</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{pendingTests.length}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">Tests pendientes</Text>
        </Card>
        <Card className="flex-1 min-w-[140px]">
          <Text className="text-3xl font-extrabold text-navy-700 dark:text-gold-500">{authUser?.englishLevel}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mt-1">Nivel actual</Text>
        </Card>
      </View>

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-3">Próximos encuentros</Text>
      {meetings.length === 0 ? (
        <Card className="mb-4">
          <Text className="text-ink-muted dark:text-ink-mutedDark">No tienes encuentros programados. Puedes proponer uno desde tus grupos.</Text>
        </Card>
      ) : (
        meetings.slice(0, 3).map((m) => (
          <Pressable key={m.id} onPress={() => router.push(`/(student)/groups/${m.groupId}`)}>
            <Card className="mb-3">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="flex-1 pr-2 font-semibold text-ink-light dark:text-ink-dark">{m.topic}</Text>
                <Badge label={m.myResponse === "yes" ? "Asistiré" : m.myResponse === "no" ? "No asistiré" : "Sin responder"} tone={m.myResponse === "yes" ? "success" : "gold"} />
              </View>
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">
                {m.groupName} · {formatMeetingDate(m.startsAt)}
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-3 mt-2">Tests semanales pendientes</Text>
      {pendingTests.length === 0 ? (
        <Card>
          <Text className="text-ink-muted dark:text-ink-mutedDark">No tienes tests pendientes. ¡Vas al día! 🎉</Text>
        </Card>
      ) : (
        pendingTests.map((t) => (
          <Card key={t.id} className="mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-ink-light dark:text-ink-dark mb-1">{t.title}</Text>
                <Badge label={t.skill === "reading" ? "Lectura" : "Escritura"} tone="navy" />
              </View>
              <Button label="Resolver" size="sm" onPress={() => router.push(`/(student)/weekly-tests/${t.id}`)} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}
