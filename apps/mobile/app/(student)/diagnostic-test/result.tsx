import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function DiagnosticResultScreen() {
  const result = useAppStore((s) => s.diagnosticResult);

  if (!result) {
    return (
      <Screen>
        <Card>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-2">Aún no hay resultados</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mb-4">Rinde la evaluación diagnóstica para conocer tu nivel.</Text>
          <Button label="Rendir evaluación" onPress={() => router.replace("/(student)/diagnostic-test")} />
        </Card>
      </Screen>
    );
  }

  const fecha = new Date(result.completedAt).toLocaleDateString("es-CL");

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-1">Tus resultados</Text>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-6">Evaluación diagnóstica · {fecha}</Text>

      <Card className="items-center mb-5 bg-navy-700">
        <Text className="text-navy-100 mb-1">Calificación general</Text>
        <Text className="text-5xl font-extrabold text-gold-500">{result.overallScore}</Text>
        <Text className="text-navy-100 mb-3">
          / 100 · {result.correct} de {result.total} correctas
        </Text>
        <Badge label={`Nivel asignado: ${result.level}`} tone="gold" />
      </Card>

      <Card className="mb-5">
        <Text className="text-base font-bold text-ink-light dark:text-ink-dark mb-3">Competencias evaluadas</Text>
        {result.competencies.map((c) => (
          <ProgressBar key={c.name} label={c.name} value={c.score} tone={c.skill === "writing" ? "gold" : "navy"} />
        ))}
      </Card>

      <View className="flex-row gap-3 mb-5">
        <Card className="flex-1">
          <Badge label="Fortalezas" tone="success" />
          <View className="mt-3 gap-1.5">
            {result.strengths.length === 0 ? (
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">Sigue practicando para desarrollarlas.</Text>
            ) : (
              result.strengths.map((s) => (
                <Text key={s} className="text-sm text-ink-light dark:text-ink-dark">• {s}</Text>
              ))
            )}
          </View>
        </Card>
        <Card className="flex-1">
          <Badge label="A reforzar" tone="danger" />
          <View className="mt-3 gap-1.5">
            {result.weaknesses.length === 0 ? (
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">¡Nada pendiente!</Text>
            ) : (
              result.weaknesses.map((w) => (
                <Text key={w} className="text-sm text-ink-light dark:text-ink-dark">• {w}</Text>
              ))
            )}
          </View>
        </Card>
      </View>

      <Card>
        <Text className="text-base font-bold text-ink-light dark:text-ink-dark mb-3">Recomendaciones pedagógicas</Text>
        <View className="gap-2.5">
          {result.recommendations.map((r, i) => (
            <View key={i} className="flex-row">
              <Text className="text-gold-600 font-bold mr-2">{i + 1}.</Text>
              <Text className="flex-1 text-ink-light dark:text-ink-dark">{r}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}
