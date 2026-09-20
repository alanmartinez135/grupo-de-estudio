import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { diagnosticTestQuestions } from "@/data/mockData";

export default function DiagnosticTestScreen() {
  const submitDiagnosticTest = useAppStore((s) => s.submitDiagnosticTest);
  const diagnosticCompleted = useAppStore((s) => s.diagnosticCompleted);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const question = diagnosticTestQuestions[step];
  const progress = Math.round(((step + 1) / diagnosticTestQuestions.length) * 100);
  const isLast = step === diagnosticTestQuestions.length - 1;

  function selectAnswer(index: number) {
    setAnswers((a) => ({ ...a, [question.id]: index }));
  }

  function handleNext() {
    if (isLast) {
      submitDiagnosticTest();
      router.replace("/(student)/diagnostic-test/result");
      return;
    }
    setStep((s) => s + 1);
  }

  if (diagnosticCompleted) {
    return (
      <Screen>
        <Card>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-2">Ya rendiste tu evaluación diagnóstica</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mb-4">Puedes revisar tus resultados cuando quieras.</Text>
          <Button label="Ver resultados" onPress={() => router.push("/(student)/diagnostic-test/result")} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-2">
        <Badge label={question.skill === "reading" ? "Lectura" : "Escritura"} tone="gold" />
        <Text className="text-ink-muted dark:text-ink-mutedDark text-sm">
          {step + 1} / {diagnosticTestQuestions.length}
        </Text>
      </View>
      <View className="h-2 w-full rounded-full bg-navy-50 dark:bg-navy-800 mb-6 overflow-hidden">
        <View className="h-full rounded-full bg-navy-700 dark:bg-gold-500" style={{ width: `${progress}%` }} />
      </View>

      <Card className="mb-5">
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

      <Button
        label={isLast ? "Finalizar evaluación" : "Siguiente"}
        onPress={handleNext}
        disabled={answers[question.id] === undefined}
        fullWidth
      />
    </Screen>
  );
}
