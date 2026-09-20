import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function WeeklyTestScreen() {
  const { testId } = useLocalSearchParams<{ testId: string }>();
  const test = useAppStore((s) => s.weeklyTests.find((t) => t.id === testId));
  const completeWeeklyTest = useAppStore((s) => s.completeWeeklyTest);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);

  if (!test) {
    return (
      <Screen>
        <Text className="text-ink-light dark:text-ink-dark">Test no encontrado.</Text>
      </Screen>
    );
  }

  const question = test.questions[step];
  const isLast = step === test.questions.length - 1;

  function handleNext() {
    if (isLast) {
      completeWeeklyTest(test!.id);
      setFinished(true);
      return;
    }
    setStep((s) => s + 1);
  }

  if (finished || test.status === "completed") {
    const correctCount = test.questions.filter((q, i) => answers[q.id] === q.correctIndex).length;
    return (
      <Screen>
        <Card className="items-center py-8">
          <Text className="text-3xl mb-2">✅</Text>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-1">¡Test completado!</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark text-center mb-5">
            {finished ? `Respondiste correctamente ${correctCount} de ${test.questions.length} preguntas.` : "Ya habías completado este test."}
          </Text>
          <Button label="Volver al grupo" onPress={() => router.push(`/(student)/groups/${test.groupId}`)} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-xl font-bold text-ink-light dark:text-ink-dark">{test.title}</Text>
        <Badge label={test.skill === "reading" ? "Lectura" : "Escritura"} tone="navy" />
      </View>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-5">Pregunta {step + 1} de {test.questions.length}</Text>

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

      <Button label={isLast ? "Entregar test" : "Siguiente"} onPress={handleNext} disabled={answers[question.id] === undefined} fullWidth />
    </Screen>
  );
}
