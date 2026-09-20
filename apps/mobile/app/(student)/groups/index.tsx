import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";

export default function GroupsScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const groups = useAppStore((s) => s.groups);
  const createGroup = useAppStore((s) => s.createGroup);
  const joinGroup = useAppStore((s) => s.joinGroup);

  const myGroups = groups.filter((g) => g.memberIds.includes(authUser?.id ?? ""));

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    const group = createGroup(name, description);
    setCreateOpen(false);
    setName("");
    setDescription("");
    router.push(`/(student)/groups/${group.id}`);
  }

  function handleJoin() {
    const result = joinGroup(code);
    if (!result.ok) return setJoinError(result.message);
    setJoinOpen(false);
    setCode("");
    setJoinError("");
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Grupos de estudio</Text>
        <Button label="+ Crear" size="sm" onPress={() => setCreateOpen(true)} />
      </View>

      {myGroups.length === 0 ? (
        <Card className="items-center py-10">
          <Text className="text-4xl mb-3">📚</Text>
          <Text className="text-center font-semibold text-ink-light dark:text-ink-dark mb-1">Aún no perteneces a ningún grupo</Text>
          <Text className="text-center text-ink-muted dark:text-ink-mutedDark mb-5">
            Crea un grupo nuevo o únete con un código de invitación para empezar a estudiar en equipo.
          </Text>
          <View className="flex-row gap-3">
            <Button label="Crear grupo" onPress={() => setCreateOpen(true)} />
            <Button label="Unirme con código" variant="outline" onPress={() => setJoinOpen(true)} />
          </View>
        </Card>
      ) : (
        <>
          <View className="gap-3">
            {myGroups.map((g) => (
              <Card key={g.id}>
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-base font-bold text-ink-light dark:text-ink-dark flex-1 pr-2">{g.name}</Text>
                  <Badge label={g.level} tone="gold" />
                </View>
                <Text className="text-ink-muted dark:text-ink-mutedDark mb-3" numberOfLines={2}>{g.description}</Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{g.memberIds.length} integrantes · {g.code}</Text>
                  <Button label="Ver grupo" size="sm" variant="outline" onPress={() => router.push(`/(student)/groups/${g.id}`)} />
                </View>
              </Card>
            ))}
          </View>
          <View className="flex-row gap-3 mt-4">
            <Button label="Unirme a otro grupo" variant="outline" onPress={() => setJoinOpen(true)} />
          </View>
        </>
      )}

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="Crear grupo">
        <Input label="Nombre del grupo" placeholder="Ej: English Warriors" value={name} onChangeText={setName} />
        <Input label="Descripción (opcional)" placeholder="¿De qué se trata este grupo?" value={description} onChangeText={setDescription} />
        <Button label="Crear grupo" onPress={handleCreate} fullWidth disabled={!name.trim()} />
      </Modal>

      <Modal visible={joinOpen} onClose={() => setJoinOpen(false)} title="Unirse a grupo">
        <Input
          label="Código de invitación"
          placeholder="DUOC-0000"
          autoCapitalize="characters"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setJoinError("");
          }}
          error={joinError}
        />
        <Button label="Unirme" onPress={handleJoin} fullWidth disabled={!code.trim()} />
      </Modal>
    </Screen>
  );
}
