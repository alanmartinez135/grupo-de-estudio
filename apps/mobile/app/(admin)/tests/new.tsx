import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import {
  CreateWeeklyTestInputSchema,
  EnglishLevelSchema,
  type EnglishLevel,
  type Skill,
} from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api, errorMessage } from "@/lib/api";
import { useT } from "@/lib/useT";
import { competencyName, translateServerMessage } from "@/lib/i18n";

// Competencias que usa el contenido actual; el resultado de cada test se agrupa por ellas.
const COMPETENCIES = ["Vocabulario", "Comprensión lectora", "Gramática", "Conectores"] as const;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

interface QuestionDraft {
  prompt: string;
  competency: string;
  options: string[];
  correctIndex: number | null;
}

const emptyQuestion = (): QuestionDraft => ({
  prompt: "",
  competency: COMPETENCIES[0],
  options: ["", "", ""],
  correctIndex: null,
});

function Segmented<T extends string>({
  values,
  value,
  onChange,
  label,
}: {
  values: readonly T[];
  value: T;
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <View className="flex-row flex-wrap rounded-2xl bg-navy-50 dark:bg-navy-800 p-1 mb-4">
      {values.map((v) => (
        <Pressable
          key={v}
          onPress={() => onChange(v)}
          className={`flex-1 rounded-full py-2 px-2 items-center ${value === v ? "bg-white dark:bg-navy-700" : ""}`}
        >
          <Text className={`font-semibold ${value === v ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>
            {label(v)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// Crea un test semanal de selección múltiple. Se guarda como borrador y se publica desde el listado.
export default function NewAdminTestScreen() {
  const [title, setTitle] = useState("");
  const t = useT();
  const [skill, setSkill] = useState<Skill>("reading");
  const [level, setLevel] = useState<EnglishLevel>("B1");
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(index: number, change: Partial<QuestionDraft>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...change } : q)));
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    const q = questions[qIndex]!;
    updateQuestion(qIndex, { options: q.options.map((o, i) => (i === oIndex ? value : o)) });
  }

  function removeOption(qIndex: number, oIndex: number) {
    const q = questions[qIndex]!;
    const correctIndex =
      q.correctIndex === null || q.correctIndex === oIndex ? null : q.correctIndex > oIndex ? q.correctIndex - 1 : q.correctIndex;
    updateQuestion(qIndex, { options: q.options.filter((_, i) => i !== oIndex), correctIndex });
  }

  async function handleCreate() {
    // Misma validación que el servidor, para mostrar el error sin esperar la respuesta.
    const parsed = CreateWeeklyTestInputSchema.safeParse({
      title,
      skill,
      level,
      questions: questions.map((q) => ({
        prompt: q.prompt,
        competency: q.competency,
        options: q.options,
        correctIndex: q.correctIndex ?? -1,
      })),
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]!;
      const n = issue.path[0] === "questions" && typeof issue.path[1] === "number" ? t("newTest.questionPrefix", { n: issue.path[1] + 1 }) : "";
      setError(issue.path.at(-1) === "correctIndex" ? `${n}${t("newTest.markCorrectError")}` : `${n}${translateServerMessage(issue.message)}`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.admin.createTest(parsed.data);
      router.replace("/(admin)/tests");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-1">{t("newTest.title")}</Text>
      <Text className="text-ink-muted dark:text-ink-mutedDark mb-5">
        {t("newTest.subtitle")}
      </Text>

      <Card className="mb-4">
        <Input label={t("newTest.name")} placeholder={t("newTest.namePlaceholder")} value={title} onChangeText={setTitle} maxLength={80} />

        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">{t("newTest.skill")}</Text>
        <Segmented
          values={["reading", "writing"] as const}
          value={skill}
          onChange={setSkill}
          label={(s) => (s === "reading" ? t("newTest.reading") : t("newTest.writing"))}
        />

        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">{t("newTest.level")}</Text>
        <Segmented values={EnglishLevelSchema.options} value={level} onChange={setLevel} label={(l) => l} />
      </Card>

      {questions.map((q, qi) => (
        <Card key={qi} className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-ink-light dark:text-ink-dark">{t("newTest.question", { n: qi + 1 })}</Text>
            {questions.length > 1 && (
              <Pressable onPress={() => setQuestions((qs) => qs.filter((_, i) => i !== qi))}>
                <Text className="text-red-600 text-sm font-semibold">{t("newTest.remove")}</Text>
              </Pressable>
            )}
          </View>

          <Input
            label={t("newTest.prompt")}
            placeholder={t("newTest.promptPlaceholder")}
            value={q.prompt}
            onChangeText={(v) => updateQuestion(qi, { prompt: v })}
            multiline
          />

          <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">{t("newTest.competency")}</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {COMPETENCIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => updateQuestion(qi, { competency: c })}
                className={`px-3 py-1.5 rounded-full ${q.competency === c ? "bg-navy-700" : "bg-navy-50 dark:bg-navy-800"}`}
              >
                <Text className={`text-sm ${q.competency === c ? "text-white font-semibold" : "text-ink-muted dark:text-ink-mutedDark"}`}>{competencyName(c)}</Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">
            {t("newTest.options")}
          </Text>
          {q.options.map((option, oi) => {
            const correct = q.correctIndex === oi;
            return (
              <View key={oi} className="flex-row items-center gap-2 mb-2">
                <Pressable
                  onPress={() => updateQuestion(qi, { correctIndex: oi })}
                  accessibilityLabel={t("newTest.markCorrect", { n: oi + 1 })}
                  className={`w-7 h-7 rounded-full border-2 items-center justify-center ${
                    correct ? "border-emerald-600 bg-emerald-600" : "border-navy-200 dark:border-navy-600"
                  }`}
                >
                  {correct && <Text className="text-white text-xs font-bold">✓</Text>}
                </Pressable>
                <View className="flex-1 -mb-4">
                  <Input
                    label=""
                    placeholder={t("newTest.option", { n: oi + 1 })}
                    value={option}
                    onChangeText={(v) => updateOption(qi, oi, v)}
                  />
                </View>
                {q.options.length > MIN_OPTIONS && (
                  <Pressable onPress={() => removeOption(qi, oi)} className="px-2">
                    <Text className="text-ink-muted dark:text-ink-mutedDark">✕</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
          {q.options.length < MAX_OPTIONS && (
            <View className="items-start mt-2">
              <Button
                label={t("newTest.addOption")}
                size="sm"
                variant="ghost"
                onPress={() => updateQuestion(qi, { options: [...q.options, ""] })}
              />
            </View>
          )}
        </Card>
      ))}

      <View className="mb-4">
        <Button label={t("newTest.addQuestion")} variant="outline" onPress={() => setQuestions((qs) => [...qs, emptyQuestion()])} />
      </View>

      {error ? <Text className="text-red-600 text-sm mb-3">{error}</Text> : null}
      <Button label={t("newTest.save")} fullWidth loading={saving} onPress={handleCreate} />
    </Screen>
  );
}
