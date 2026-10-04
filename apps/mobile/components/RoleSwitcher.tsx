import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useAppStore } from "@/store/useAppStore";

export function RoleSwitcher() {
  const [open, setOpen] = useState(false);
  const activeRole = useAppStore((s) => s.activeRole);
  const setActiveRole = useAppStore((s) => s.setActiveRole);
  const isAdmin = useAppStore((s) => s.authUser?.role === "admin");

  function pick(role: "student" | "admin") {
    setActiveRole(role);
    setOpen(false);
    router.replace(role === "student" ? "/(student)/dashboard" : "/(admin)/users");
  }

  // Solo un administrador puede alternar entre su panel y la vista de alumno.
  if (!isAdmin) return null;

  return (
    <View style={{ position: "absolute", bottom: 24, right: 20, zIndex: 50 }}>
      {open && (
        <View className="mb-3 rounded-2xl bg-navy-800 p-2 w-52 shadow-lg">
          <Text className="text-[11px] font-semibold text-navy-100 px-3 pt-1 pb-2">Cambiar vista</Text>
          <Pressable
            onPress={() => pick("student")}
            className={`rounded-full px-4 py-2.5 mb-1 ${activeRole === "student" ? "bg-gold-500" : "bg-navy-700"}`}
          >
            <Text className={`font-semibold ${activeRole === "student" ? "text-navy-800" : "text-white"}`}>Vista Alumno</Text>
          </Pressable>
          <Pressable
            onPress={() => pick("admin")}
            className={`rounded-full px-4 py-2.5 ${activeRole === "admin" ? "bg-gold-500" : "bg-navy-700"}`}
          >
            <Text className={`font-semibold ${activeRole === "admin" ? "text-navy-800" : "text-white"}`}>Vista Administrador</Text>
          </Pressable>
        </View>
      )}
      <Pressable
        onPress={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full bg-gold-500 items-center justify-center shadow-lg"
      >
        <Text className="text-xl">{open ? "✕" : "⇄"}</Text>
      </Pressable>
    </View>
  );
}
