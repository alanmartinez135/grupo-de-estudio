import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";
import type { DiagnosticResult } from "@grupo-estudio/types";
import { competencyName, dateLocale, tr, type TKey } from "@/lib/i18n";

// El servidor entrega las recomendaciones en español. Para mostrarlas en el idioma elegido se
// vuelven a armar con sus mismas reglas: una por cada competencia a reforzar y el nivel asignado.
function localizedRecommendations(result: DiagnosticResult): string[] {
  const known = result.weaknesses.filter((w) => `rec.${w}` in REC_KEYS);
  if (known.length !== result.weaknesses.length) return result.recommendations;
  const recs = known.map((w) => tr(`rec.${w}` as TKey));
  if (recs.length === 0) recs.push(tr("rec.keepPracticing"));
  recs.push(tr("rec.joinGroup", { level: result.level }));
  return recs;
}
const REC_KEYS = { "rec.Vocabulario": 1, "rec.Comprensión lectora": 1, "rec.Gramática": 1, "rec.Conectores": 1 };

export default function DiagnosticResultScreen() {
  const result = useAppStore((s) => s.diagnosticResult);
  const t = useT();

  if (!result) {
    return (
      <Screen>
        <Card>
          <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mb-2">{t("diag.noResultsTitle")}</Text>
          <Text className="text-ink-muted dark:text-ink-mutedDark mb-4">{t("diag.noResultsBody")}</Text>
          <Button label={t("dash.diagButton")} onPress={() => router.replace("/(student)/diagnostic-test")} />
        </Card>
      </Screen>
    );
  }

  const fecha = new Date(result.completedAt).toLocaleDateString(dateLocale());
  const recommendations = localizedRecommendations(result);

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-1">{t("diag.resultsTitle")}</Text>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-6">{t("diag.resultsSubtitle", { date: fecha })}</Text>

      <Card className="items-center mb-5 bg-navy-700">
        <Text className="text-navy-100 mb-1">{t("diag.overall")}</Text>
        <Text className="text-5xl font-extrabold text-gold-500">{result.overallScore}</Text>
        <Text className="text-navy-100 mb-3">
          {t("diag.correct", { correct: result.correct, total: result.total })}
        </Text>
        <Badge label={t("diag.level", { level: result.level })} tone="gold" />
      </Card>

      <Card className="mb-5">
        <Text className="text-base font-bold text-ink-light dark:text-ink-dark mb-3">{t("diag.competencies")}</Text>
        {result.competencies.map((c) => (
          <ProgressBar key={c.name} label={competencyName(c.name)} value={c.score} tone={c.skill === "writing" ? "gold" : "navy"} />
        ))}
      </Card>

      <View className="flex-row gap-3 mb-5">
        <Card className="flex-1">
          <Badge label={t("diag.strengths")} tone="success" />
          <View className="mt-3 gap-1.5">
            {result.strengths.length === 0 ? (
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">{t("diag.noStrengths")}</Text>
            ) : (
              result.strengths.map((s) => (
                <Text key={s} className="text-sm text-ink-light dark:text-ink-dark">• {competencyName(s)}</Text>
              ))
            )}
          </View>
        </Card>
        <Card className="flex-1">
          <Badge label={t("diag.weaknesses")} tone="danger" />
          <View className="mt-3 gap-1.5">
            {result.weaknesses.length === 0 ? (
              <Text className="text-sm text-ink-muted dark:text-ink-mutedDark">{t("diag.noWeaknesses")}</Text>
            ) : (
              result.weaknesses.map((w) => (
                <Text key={w} className="text-sm text-ink-light dark:text-ink-dark">• {competencyName(w)}</Text>
              ))
            )}
          </View>
        </Card>
      </View>

      <Card>
        <Text className="text-base font-bold text-ink-light dark:text-ink-dark mb-3">{t("diag.recommendations")}</Text>
        <View className="gap-2.5">
          {recommendations.map((r, i) => (
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
