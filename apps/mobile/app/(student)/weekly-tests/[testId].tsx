import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { TestResult, WeeklyTestDetail } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { api, errorMessage } from "@/lib/api";
import { useT } from "@/lib/useT";

export default function WeeklyTestScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const t = useT();
  const submitWeeklyTest = useAppStore((s) => s.submitWeeklyTest);
  const [test, setTest] = useState<WeeklyTestDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<TestResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // El test (sin respuestas correctas) y su estado vienen del servidor.
  useEffect(() => {
    if (!testId) return;
    api.tests
      .get(testId)
      .then(setTest)
      .catch((error) => setLoadError(errorMessage(error)));
  }, [testId]);

  const backToGroup = () =>
    test?.groupIds[0] ? router.push(`/(student)/groups/${test.groupIds[0]}`) : router.push("/(student)/groups");

  if (!test) {
    return (
      <Screen>
        {loadError ? (
          <Card>
            <Text className="text-ink-light dark:text-ink-dark">{loadError}</Text>
          </Card>
        ) : (
          <ActivityIndicator className="mt-10" />
        )}
      </Screen>
    );
  }

  if (result || test.status === "completed") {
    return (
      <Screen>
        <Card className="items-center py-8">
          <Text className="text-3xl mb-2">✅</Text>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-1">{t("test.doneTitle")}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark text-center mb-5">
            {result
              ? t("test.doneResult", { correct: result.correct, total: result.total, score: result.score })
              : t("test.alreadyDone", { score: test.score ?? 0 })}
          </Text>
          <Button label={t("test.backToGroup")} onPress={backToGroup} />
        </Card>
      </Screen>
    );
  }

  const question = test.questions[step]!;
  const isLast = step === test.questions.length - 1;

  async function handleNext() {
    if (!isLast) return setStep((s) => s + 1);
    setSubmitting(true);
    setSubmitError("");
    const r = await submitWeeklyTest(test!.id, answers);
    setSubmitting(false);
    if (!r.ok || !r.result) return setSubmitError(r.message);
    setResult(r.result);
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-bold text-ink-light dark:text-ink-dark flex-1 pr-2">{test.title}</Text>
        <Badge label={test.skill === "reading" ? t("common.reading") : t("common.writing")} tone="navy" />
      </View>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-5">
        {t("test.progress", { n: step + 1, total: test.questions.length, level: test.level })}
      </Text>

      <Card className="mb-5">
        <Text className="text-base font-semibold text-ink-light dark:text-ink-dark leading-6">{question.prompt}</Text>
      </Card>

      <View className="gap-3 mb-6">
        {question.options.map((opt, i) => {
          const selected = answers[question.id] === i;
          return (
            <Pressable
              key={i}
              onPress={() => setAnswers((a) => ({ ...a, [question.id]: i }))}
              className={`rounded-2xl px-4 py-3.5 border ${
                selected ? "bg-navy-700 border-navy-700" : "bg-white dark:bg-surface-cardDark border-navy-100 dark:border-navy-600"
              }`}
            >
              <Text className={selected ? "text-white font-medium" : "text-ink-light dark:text-ink-dark"}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>

      {submitError ? <Text className="text-xs text-red-500 mb-2">{submitError}</Text> : null}
      <Button
        label={isLast ? t("test.submit") : t("common.next")}
        onPress={handleNext}
        loading={submitting}
        disabled={answers[question.id] === undefined}
        fullWidth
      />
    </Screen>
  );
}
