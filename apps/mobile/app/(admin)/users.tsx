import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/ui/Avatar";
import { useAppStore, } from "@/store/useAppStore";
import type { Role } from "@/data/mockData";

export default function AdminUsersScreen() {
  const users = useAppStore((s) => s.users);
  const updateUserRole = useAppStore((s) => s.updateUserRole);
  const removeUser = useAppStore((s) => s.removeUser);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const filtered = users.filter((u) => {
    const matchesQuery = u.name.toLowerCase().includes(query.toLowerCase()) || u.correo.toLowerCase().includes(query.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <Screen>
      <View className="flex-row items-center justify-between mb-5">
        <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark">Gestión de usuarios</Text>
        <Button label="+ Crear" size="sm" onPress={() => setCreateOpen(true)} />
      </View>

      <Input label="Buscar por nombre o correo" placeholder="Buscar..." value={query} onChangeText={setQuery} />

      <View className="flex-row gap-2 mb-4 -mt-1">
        {(["all", "student", "admin"] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-full ${roleFilter === r ? "bg-navy-700" : "bg-navy-50 dark:bg-navy-800"}`}
          >
            <Text className={`text-sm font-semibold ${roleFilter === r ? "text-white" : "text-ink-muted dark:text-ink-mutedDark"}`}>
              {r === "all" ? "Todos" : r === "admin" ? "Administradores" : "Alumnos"}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="gap-2.5">
        {filtered.map((u) => (
          <Card key={u.id} className="flex-row items-center gap-3">
            <Avatar name={u.name} color={u.avatarColor} />
            <View className="flex-1">
              <Text className="font-semibold text-ink-light dark:text-ink-dark">{u.name}</Text>
              <Text className="text-xs text-ink-muted dark:text-ink-mutedDark">{u.correo}</Text>
            </View>
            <Pressable
              onPress={() => updateUserRole(u.id, u.role === "admin" ? "student" : "admin")}
            >
              <Badge label={u.role === "admin" ? "Admin" : "Alumno"} tone={u.role === "admin" ? "gold" : "navy"} />
            </Pressable>
            <Pressable onPress={() => setConfirmDelete(u.id)} className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950 items-center justify-center">
              <Text className="text-red-600">🗑</Text>
            </Pressable>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card><Text className="text-ink-muted dark:text-ink-mutedDark text-center">Sin resultados.</Text></Card>
        )}
      </View>
      <Text className="text-xs text-ink-muted dark:text-ink-mutedDark mt-3 text-center">
        Toca la etiqueta de rol para cambiarla entre Alumno / Administrador.
      </Text>

      <Modal visible={createOpen} onClose={() => setCreateOpen(false)} title="Crear usuario">
        <Input label="Nombre completo" value={newName} onChangeText={setNewName} />
        <Input label="Correo institucional" autoCapitalize="none" value={newEmail} onChangeText={setNewEmail} />
        <Button
          label="Crear usuario"
          fullWidth
          disabled={!newName.trim() || !newEmail.trim()}
          onPress={() => {
            setCreateOpen(false);
            setNewName("");
            setNewEmail("");
          }}
        />
      </Modal>

      <Modal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="¿Eliminar usuario?">
        <Text className="text-ink-light dark:text-ink-dark mb-5">Esta acción eliminará al usuario del sistema de forma permanente.</Text>
        <View className="flex-row gap-3">
          <Button label="Cancelar" variant="outline" fullWidth onPress={() => setConfirmDelete(null)} />
          <Button
            label="Eliminar"
            variant="danger"
            fullWidth
            onPress={() => {
              if (confirmDelete) removeUser(confirmDelete);
              setConfirmDelete(null);
            }}
          />
        </View>
      </Modal>
    </Screen>
  );
}
