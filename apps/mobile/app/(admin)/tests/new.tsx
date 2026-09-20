import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import type { Skill } from "@/data/mockData";

export default function NewAdminTestScreen() {
  const addAdminTest = useAppStore((s) => s.addAdminTest);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"inicial" | "semanal">("semanal");
  const [skill, setSkill] = useState<Skill>("reading");
  const [questions, setQuestions] = useState<string[]>([""]);

  function updateQuestion(index: number, value: string) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? value : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, ""]);
  }

  function handleCreate() {
    addAdminTest({
      title,
      type,
      skill,
      questionCount: questions.filter((q) => q.trim()).length || 1,
      status: "borrador",
    });
    router.replace("/(admin)/tests");
  }

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-5">Crear evaluación</Text>

      <Card className="mb-4">
        <Input label="Título de la evaluación" placeholder="Ej: Phrasal Verbs básicos" value={title} onChangeText={setTitle} />

        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">Tipo de test</Text>
        <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1 mb-4">
          {(["inicial", "semanal"] as const).map((t) => (
            <Pressable key={t} onPress={() => setType(t)} className={`flex-1 rounded-full py-2 items-center ${type === t ? "bg-white dark:bg-navy-700" : ""}`}>
              <Text className={`font-semibold ${type === t ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>
                {t === "inicial" ? "Test Inicial (largo)" : "Test Semanal (corto)"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">Habilidad evaluada</Text>
        <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1">
          {(["reading", "writing"] as const).map((s) => (
            <Pressable key={s} onPress={() => setSkill(s)} className={`flex-1 rounded-full py-2 items-center ${skill === s ? "bg-white dark:bg-navy-700" : ""}`}>
              <Text className={`font-semibold ${skill === s ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>
                {s === "reading" ? "Lectura (Reading)" : "Escritura (Writing)"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card className="mb-4">
        <Text className="font-bold text-ink-light dark:text-ink-dark mb-3">Preguntas</Text>
        {questions.map((q, i) => (
          <Input key={i} label={`Pregunta ${i + 1}`} placeholder="Escribe el enunciado..." value={q} onChangeText={(v) => updateQuestion(i, v)} />
        ))}
        <Button label="+ Agregar pregunta" variant="outline" onPress={addQuestion} />
      </Card>

      <Button label="Guardar evaluación" fullWidth disabled={!title.trim()} onPress={handleCreate} />
    </Screen>
  );
}
