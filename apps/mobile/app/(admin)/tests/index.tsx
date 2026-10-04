import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import type { AdminEvaluation } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { api, errorMessage } from "@/lib/api";
import { useT } from "@/lib/useT";

export default function AdminTestsScreen() {
  const [tests, setTests] = useState<AdminEvaluation[]>([]);
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminEvaluation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Se recarga al volver desde "Crear test".
  useFocusEffect(
    useCallback(() => {
      api.admin
        .evaluations()
        .then((list) => {
          setTests(list);
          setError(null);
        })
        .catch((e) => setError(errorMessage(e)))
        .finally(() => setLoading(false));
    }, []),
  );

  async function togglePublished(test: AdminEvaluation) {
    setBusyId(test.id);
    try {
      const updated = await api.admin.setPublished(test.id, !test.published);
      setTests((list) => list.map((t) => (t.id === updated.id ? updated : t)));
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.admin.deleteEvaluation(confirmDelete.id);
      setTests((list) => list.filter((t) => t.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">{t("admin.testsTitle")}</Text>
        <Button label={t("admin.createTest")} size="sm" onPress={() => router.push("/(admin)/tests/new")} />
      </View>

      {error ? <Text className="text-red-600 text-sm mb-3">{error}</Text> : null}

      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <View className="gap-2.5">
          {tests.map((ev) => {
            const isDiagnostic = ev.type === "diagnostica";
            return (
              <Card key={ev.id}>
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-ink-light dark:text-ink-dark mb-2">{ev.title}</Text>
                    <View className="flex-row flex-wrap gap-2">
                      <Badge label={isDiagnostic ? t("admin.diagnostic") : t("admin.weekly", { level: ev.level ?? "" })} tone="navy" />
                      {ev.skill && <Badge label={ev.skill === "reading" ? t("common.reading") : t("common.writing")} tone="gold" />}
                      <Badge label={t("admin.questions", { n: ev.questionCount })} tone="neutral" />
                      <Badge label={t("admin.answers", { n: ev.resultsCount })} tone="neutral" />
                      <Badge label={ev.published ? t("admin.published") : t("admin.draft")} tone={ev.published ? "success" : "neutral"} />
                    </View>
                  </View>
                  {!isDiagnostic && (
                    <Pressable
                      onPress={() => {
                        setDeleteError(null);
                        setConfirmDelete(ev);
                      }}
                      className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center"
                    >
                      <Text className="text-red-600">🗑</Text>
                    </Pressable>
                  )}
                </View>
                {!isDiagnostic && (
                  <View className="mt-3 items-start">
                    <Button
                      label={ev.published ? t("admin.unpublish") : t("admin.publish")}
                      size="sm"
                      variant={ev.published ? "outline" : "primary"}
                      loading={busyId === ev.id}
                      onPress={() => togglePublished(ev)}
                    />
                  </View>
                )}
              </Card>
            );
          })}
          {tests.length === 0 && (
            <Card>
              <Text className="text-ink-muted dark:text-ink-mutedDark text-center">{t("admin.noTests")}</Text>
            </Card>
          )}
        </View>
      )}
      <Text className="text-xs text-ink-muted dark:text-ink-mutedDark mt-3 text-center">
        {t("admin.testsHint")}
      </Text>

      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t("admin.deleteTestTitle")}>
        <Text className="text-ink-light dark:text-ink-dark mb-5">
          {t("admin.deleteTestBody", {
            title: confirmDelete?.title ?? "",
            answers: confirmDelete?.resultsCount ? t("admin.deleteTestAnswers", { n: confirmDelete.resultsCount }) : "",
          })}
        </Text>
        {deleteError ? <Text className="text-red-600 text-sm mb-4">{deleteError}</Text> : null}
        <View className="flex-row gap-3">
          <Button label={t("common.cancel")} variant="outline" fullWidth onPress={() => setConfirmDelete(null)} />
          <Button label={t("common.delete")} variant="danger" fullWidth loading={deleting} onPress={handleDelete} />
        </View>
      </Modal>
    </Screen>
  );
}
