import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import type { Role, User } from "@grupo-estudio/types";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore } from "@/store/useAppStore";
import { api, errorMessage } from "@/lib/api";
import { useT } from "@/lib/useT";

// Las cuentas se crean desde el registro de la app; el administrador gestiona roles y eliminaciones.
export default function AdminUsersScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const t = useT();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await api.admin.users({ q: query, role: roleFilter === "all" ? undefined : roleFilter });
      setUsers(list);
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [query, roleFilter]);

  // La búsqueda se hace en el servidor; se espera un momento a que termine de escribir.
  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  // Al volver a la pantalla se recarga por si otra persona cambió algo.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function toggleRole(user: User) {
    setBusyId(user.id);
    try {
      const updated = await api.admin.setRole(user.id, user.role === "admin" ? "student" : "admin");
      setUsers((list) =>
        roleFilter !== "all" && updated.role !== roleFilter
          ? list.filter((u) => u.id !== updated.id)
          : list.map((u) => (u.id === updated.id ? updated : u)),
      );
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.admin.deleteUser(confirmDelete.id);
      setUsers((list) => list.filter((u) => u.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (e) {
      setDeleteError(errorMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-5">{t("admin.usersTitle")}</Text>

      <Input label={t("admin.search")} placeholder={t("admin.searchPlaceholder")} value={query} onChangeText={setQuery} />

      <View className="flex-row gap-2 mb-4 -mt-1">
        {(["all", "student", "admin"] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-full ${roleFilter === r ? "bg-navy-700" : "bg-navy-50 dark:bg-navy-800"}`}
          >
            <Text className={`text-sm font-semibold ${roleFilter === r ? "text-white" : "text-ink-muted dark:text-ink-mutedDark"}`}>
              {r === "all" ? t("admin.all") : r === "admin" ? t("admin.admins") : t("admin.students")}
            </Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text className="text-red-600 text-sm mb-3">{error}</Text> : null}

      {loading ? (
        <ActivityIndicator className="mt-6" />
      ) : (
        <View className="gap-2.5">
          {users.map((u) => {
            const isMe = u.id === authUser?.id;
            return (
              <Card key={u.id} className="flex-row items-center gap-3">
                <Avatar name={u.name} color={u.role === "admin" ? "#C9A227" : "#2E5B8A"} />
                <View className="flex-1">
                  <Text className="font-semibold text-ink-light dark:text-ink-dark">
                    {u.name}
                    {isMe ? t("admin.you") : ""}
                  </Text>
                  <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">
                    {u.correo} · {u.englishLevel}
                  </Text>
                </View>
                {busyId === u.id ? (
                  <ActivityIndicator />
                ) : (
                  <Pressable disabled={isMe} onPress={() => toggleRole(u)} style={{ opacity: isMe ? 0.6 : 1 }}>
                    <Badge label={u.role === "admin" ? t("role.admin") : t("role.student")} tone={u.role === "admin" ? "gold" : "navy"} />
                  </Pressable>
                )}
                {!isMe && (
                  <Pressable
                    onPress={() => {
                      setDeleteError(null);
                      setConfirmDelete(u);
                    }}
                    className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center"
                  >
                    <Text className="text-red-600">🗑</Text>
                  </Pressable>
                )}
              </Card>
            );
          })}
          {users.length === 0 && (
            <Card>
              <Text className="text-ink-muted dark:text-ink-mutedDark text-center">{t("admin.noResults")}</Text>
            </Card>
          )}
        </View>
      )}
      <Text className="text-xs text-ink-muted dark:text-ink-mutedDark mt-3 text-center">
        {t("admin.usersHint")}
      </Text>

      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} title={t("admin.deleteUserTitle")}>
        <Text className="text-ink-light dark:text-ink-dark mb-5">
          {t("admin.deleteUserBody", { name: confirmDelete?.name ?? "" })}
        </Text>
        {deleteError ? <Text className="text-red-600 text-sm mb-4">{deleteError}</Text> : null}
        <View className="flex-row gap-3">
          <Button label={t("common.cancel")} variant="outline" fullWidth onPress={() => setConfirmDelete(null)} />
          <Button label={t("common.delete")} variant="danger" fullWidth loading={deleting} onPress={handleDelete} />
        </View>
      </Modal>
    </Screen>
  );
}
