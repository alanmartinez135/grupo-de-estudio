import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import type { EnglishLevel } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { MAX_GROUP_MEMBERS } from "@/data/mockData";

const LEVELS: EnglishLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function GroupsScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const groups = useAppStore((s) => s.groups);
  const createGroup = useAppStore((s) => s.createGroup);
  const joinGroup = useAppStore((s) => s.joinGroup);
  const joinGroupById = useAppStore((s) => s.joinGroupById);

  const myGroups = groups.filter((g) => g.memberIds.includes(authUser?.id ?? ""));
  const openGroups = groups.filter((g) => !g.memberIds.includes(authUser?.id ?? "") && g.memberIds.length < MAX_GROUP_MEMBERS);

  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<EnglishLevel>(authUser?.englishLevel ?? "A1");
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [feedError, setFeedError] = useState("");

  function handleCreate() {
    if (!name.trim()) return;
    const group = createGroup(name, description, level);
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

  function handleJoinFromFeed(groupId: string) {
    const result = joinGroupById(groupId);
    setFeedError(result.ok ? "" : result.message);
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
            Crea un grupo nuevo, únete desde la lista de grupos abiertos o usa un código de invitación.
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
                  <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{g.memberIds.length}/{MAX_GROUP_MEMBERS} integrantes · {g.code}</Text>
                  <Button label="Ver grupo" size="sm" variant="outline" onPress={() => router.push(`/(student)/groups/${g.id}`)} />
                </View>
              </Card>
            ))}
          </View>
          <View className="flex-row gap-3 mt-4">
            <Button label="Unirme con código" variant="outline" onPress={() => setJoinOpen(true)} />
          </View>
        </>
      )}

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mt-8 mb-3">Grupos abiertos</Text>
      {feedError ? <Text className="text-xs text-red-500 mb-2">{feedError}</Text> : null}
      {openGroups.length === 0 ? (
        <Card>
          <Text className="text-ink-muted dark:text-ink-mutedDark">No hay grupos con cupo disponible por ahora.</Text>
        </Card>
      ) : (
        <View className="gap-3">
          {openGroups.map((g) => (
            <Card key={g.id}>
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-base font-bold text-ink-light dark:text-ink-dark flex-1 pr-2">{g.name}</Text>
                <Badge label={g.level} tone="gold" />
              </View>
              <Text className="text-ink-muted dark:text-ink-mutedDark mb-3" numberOfLines={2}>{g.description}</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{g.memberIds.length}/{MAX_GROUP_MEMBERS} integrantes</Text>
                <Button label="Unirme" size="sm" onPress={() => handleJoinFromFeed(g.id)} />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="Crear grupo">
        <Input label="Nombre del grupo" placeholder="Ej: English Warriors" value={name} onChangeText={setName} />
        <Input label="Descripción (opcional)" placeholder="¿De qué se trata este grupo?" value={description} onChangeText={setDescription} />
        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">Nivel del grupo</Text>
        <View className="flex-row flex-wrap gap-2 mb-5">
          {LEVELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLevel(l)}
              className={`px-4 py-2 rounded-full ${level === l ? "bg-navy-700" : "bg-navy-50 dark:bg-navy-800"}`}
            >
              <Text className={`text-sm font-semibold ${level === l ? "text-white" : "text-ink-muted dark:text-ink-mutedDark"}`}>{l}</Text>
            </Pressable>
          ))}
        </View>
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
