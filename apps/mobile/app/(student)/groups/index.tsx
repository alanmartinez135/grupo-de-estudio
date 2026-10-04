import { useEffect, useState } from "react";
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
import { useT } from "@/lib/useT";

const LEVELS: EnglishLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function GroupsScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const t = useT();
  const groups = useAppStore((s) => s.groups);
  const createGroup = useAppStore((s) => s.createGroup);
  const joinGroup = useAppStore((s) => s.joinGroup);
  const joinGroupById = useAppStore((s) => s.joinGroupById);
  const loadGroups = useAppStore((s) => s.loadGroups);

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
  const [createError, setCreateError] = useState("");
  const [busy, setBusy] = useState(false);

  // Al entrar a la pantalla se piden los grupos actualizados al servidor.
  useEffect(() => {
    loadGroups().then((r) => setFeedError(r.ok ? "" : r.message));
  }, [loadGroups]);

  async function handleCreate() {
    if (!name.trim()) return;
    setBusy(true);
    const result = await createGroup(name, description, level);
    setBusy(false);
    if (!result.ok || !result.group) return setCreateError(result.message);
    setCreateOpen(false);
    setName("");
    setDescription("");
    setCreateError("");
    router.push(`/(student)/groups/${result.group.id}`);
  }

  async function handleJoin() {
    setBusy(true);
    const result = await joinGroup(code);
    setBusy(false);
    if (!result.ok) return setJoinError(result.message);
    setJoinOpen(false);
    setCode("");
    setJoinError("");
  }

  async function handleJoinFromFeed(groupId: string) {
    const result = await joinGroupById(groupId);
    setFeedError(result.ok ? "" : result.message);
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">{t("groups.title")}</Text>
        <Button label={t("groups.create")} size="sm" onPress={() => setCreateOpen(true)} />
      </View>

      {myGroups.length === 0 ? (
        <Card className="items-center py-10">
          <Text className="text-4xl mb-3">📚</Text>
          <Text className="text-center font-semibold text-ink-light dark:text-ink-dark mb-1">{t("groups.emptyTitle")}</Text>
          <Text className="text-center text-ink-muted dark:text-ink-mutedDark mb-5">
            {t("groups.emptyBody")}
          </Text>
          <View className="flex-row gap-3">
            <Button label={t("groups.createGroup")} onPress={() => setCreateOpen(true)} />
            <Button label={t("groups.joinWithCode")} variant="outline" onPress={() => setJoinOpen(true)} />
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
                  <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{t("groups.members", { n: g.memberIds.length, max: MAX_GROUP_MEMBERS })} · {g.code}</Text>
                  <Button label={t("groups.view")} size="sm" variant="outline" onPress={() => router.push(`/(student)/groups/${g.id}`)} />
                </View>
              </Card>
            ))}
          </View>
          <View className="flex-row gap-3 mt-4">
            <Button label={t("groups.joinWithCode")} variant="outline" onPress={() => setJoinOpen(true)} />
          </View>
        </>
      )}

      <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mt-8 mb-3">{t("groups.open")}</Text>
      {feedError ? <Text className="text-xs text-red-500 mb-2">{feedError}</Text> : null}
      {openGroups.length === 0 ? (
        <Card>
          <Text className="text-ink-muted dark:text-ink-mutedDark">{t("groups.noOpen")}</Text>
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
                <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{t("groups.members", { n: g.memberIds.length, max: MAX_GROUP_MEMBERS })}</Text>
                <Button label={t("groups.join")} size="sm" onPress={() => handleJoinFromFeed(g.id)} />
              </View>
            </Card>
          ))}
        </View>
      )}

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title={t("groups.createGroup")}>
        <Input label={t("groups.name")} placeholder={t("groups.namePlaceholder")} value={name} onChangeText={setName} />
        <Input label={t("groups.description")} placeholder={t("groups.descriptionPlaceholder")} value={description} onChangeText={setDescription} />
        <Text className="text-sm font-medium text-ink-muted dark:text-ink-mutedDark mb-1.5">{t("groups.level")}</Text>
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
        {createError ? <Text className="text-xs text-red-500 mb-2">{createError}</Text> : null}
        <Button label={t("groups.createGroup")} onPress={handleCreate} loading={busy} fullWidth disabled={!name.trim()} />
      </Modal>

      <Modal visible={joinOpen} onClose={() => setJoinOpen(false)} title={t("groups.joinTitle")}>
        <Input
          label={t("groups.code")}
          placeholder="DUOC-0000"
          autoCapitalize="characters"
          value={code}
          onChangeText={(v) => {
            setCode(v);
            setJoinError("");
          }}
          error={joinError}
        />
        <Button label={t("groups.join")} onPress={handleJoin} loading={busy} fullWidth disabled={!code.trim()} />
      </Modal>
    </Screen>
  );
}
