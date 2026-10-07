import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import type { DiagnosticTest } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { api, errorMessage } from "@/lib/api";
import { useT } from "@/lib/useT";
import { competencyName } from "@/lib/i18n";

export default function DiagnosticTestScreen() {
  const submitDiagnosticTest = useAppStore((s) => s.submitDiagnosticTest);
  const t = useT();
  const diagnosticCompleted = useAppStore((s) => s.diagnosticCompleted);
  const [test, setTest] = useState<DiagnosticTest | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Las preguntas vienen del servidor, sin la respuesta correcta.
  useEffect(() => {
    if (diagnosticCompleted) return;
    api.diagnostic
      .get()
      .then(setTest)
      .catch((error) => setLoadError(errorMessage(error)));
  }, [diagnosticCompleted]);

  if (diagnosticCompleted) {
    return (
      <Screen>
        <Card>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-2">{t("diag.doneTitle")}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mb-4">{t("diag.doneBody")}</Text>
          <Button label={t("diag.viewResults")} onPress={() => router.push("/(student)/diagnostic-test/result")} />
        </Card>
      </Screen>
    );
  }

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

  const questions = test.questions;
  const question = questions[step]!;
  const progress = Math.round(((step + 1) / questions.length) * 100);
  const isLast = step === questions.length - 1;

  function selectAnswer(index: number) {
    setAnswers((a) => ({ ...a, [question.id]: index }));
  }

  async function handleNext() {
    if (!isLast) return setStep((s) => s + 1);
    setSubmitting(true);
    setSubmitError("");
    const result = await submitDiagnosticTest(answers);
    setSubmitting(false);
    if (!result.ok) return setSubmitError(result.message);
    router.replace("/(student)/diagnostic-test/result");
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-2">
        <Badge label={question.skill === "reading" ? t("common.reading") : t("common.writing")} tone="gold" />
        <Text className="text-ink-muted dark:text-ink-mutedDark text-sm">
          {step + 1} / {questions.length}
        </Text>
      </View>
      <View className="h-2 w-full rounded-full bg-navy-50 dark:bg-navy-800 mb-6 overflow-hidden">
        <View className="h-full rounded-full bg-navy-700 dark:bg-gold-500" style={{ width: `${progress}%` }} />
      </View>

      <Card className="mb-5">
        <Text className="text-xs text-ink-muted dark:text-ink-mutedDark mb-1">{competencyName(question.competency)}</Text>
        <Text className="text-lg font-semibold text-ink-light dark:text-ink-dark leading-6">{question.prompt}</Text>
      </Card>

      <View className="gap-3 mb-6">
        {question.options.map((opt, i) => {
          const selected = answers[question.id] === i;
          return (
            <Pressable
              key={i}
              onPress={() => selectAnswer(i)}
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
      <View className="flex-row gap-3">
        {step > 0 && <Button label={t("common.previous")} variant="outline" onPress={() => setStep((s) => s - 1)} />}
        <View className="flex-1">
          <Button
            label={isLast ? t("diag.finish") : t("common.next")}
            onPress={handleNext}
            loading={submitting}
            disabled={answers[question.id] === undefined}
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}
