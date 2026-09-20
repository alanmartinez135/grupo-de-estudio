import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";

export default function AdminTestsScreen() {
  const tests = useAppStore((s) => s.adminTests);
  const removeAdminTest = useAppStore((s) => s.removeAdminTest);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Evaluaciones</Text>
        <Button label="+ Crear test" size="sm" onPress={() => router.push("/(admin)/tests/new")} />
      </View>

      <View className="gap-2.5">
        {tests.map((t) => (
          <Card key={t.id}>
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-3">
                <Text className="font-semibold text-ink-light dark:text-ink-dark mb-2">{t.title}</Text>
                <View className="flex-row flex-wrap gap-2">
                  <Badge label={t.type === "inicial" ? "Test Inicial" : "Test Semanal"} tone="navy" />
                  <Badge label={t.skill === "reading" ? "Lectura" : "Escritura"} tone="gold" />
                  <Badge label={`${t.questionCount} preguntas`} tone="neutral" />
                  <Badge label={t.status === "publicado" ? "Publicado" : "Borrador"} tone={t.status === "publicado" ? "success" : "neutral"} />
                </View>
              </View>
              <Pressable onPress={() => setConfirmDelete(t.id)} className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center">
                <Text className="text-red-600">🗑</Text>
              </Pressable>
            </View>
          </Card>
        ))}
      </View>

      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="¿Eliminar evaluación?">
        <Text className="text-ink-light dark:text-ink-dark mb-5">Esta acción eliminará la evaluación de forma permanente.</Text>
        <View className="flex-row gap-3">
          <Button label="Cancelar" variant="outline" fullWidth onPress={() => setConfirmDelete(null)} />
          <Button
            label="Eliminar"
            variant="danger"
            fullWidth
            onPress={() => {
              if (confirmDelete) removeAdminTest(confirmDelete);
              setConfirmDelete(null);
            }}
          />
        </View>
      </Modal>
    </Screen>
  );
}
