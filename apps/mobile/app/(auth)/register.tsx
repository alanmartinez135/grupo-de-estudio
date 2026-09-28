import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Link, router } from "expo-router";
import type { EnglishLevel, Jornada } from "@grupo-estudio/types";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

const LEVELS: EnglishLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
const JORNADAS: { value: Jornada; label: string }[] = [
  { value: "diurna", label: "Diurna" },
  { value: "vespertina", label: "Vespertina" },
];

export default function RegisterScreen() {
  const register = useAppStore((s) => s.register);
  const [name, setName] = useState("");
  const [career, setCareer] = useState("");
  const [jornada, setJornada] = useState<Jornada>("diurna");
  const [englishLevel, setEnglishLevel] = useState<EnglishLevel>("A1");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRegister() {
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = register({ correo, password, name, career, jornada, englishLevel });
      setLoading(false);
      if (!result.ok) return setError(result.message);
      router.replace("/");
    }, 400);
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Regístrate con tu correo institucional Duoc UC">
      <Input label="Nombre completo" placeholder="Ej: Javiera Acuña" value={name} onChangeText={setName} />
      <Input label="Carrera" placeholder="Ej: Desarrollo de Software" value={career} onChangeText={setCareer} />

      <Text className="mb-1.5 text-sm font-medium text-ink-muted dark:text-ink-mutedDark">Jornada</Text>
      <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1 mb-4">
        {JORNADAS.map((j) => (
          <Pressable
            key={j.value}
            onPress={() => setJornada(j.value)}
            className={`flex-1 rounded-full py-2 items-center ${jornada === j.value ? "bg-white dark:bg-navy-700" : ""}`}
          >
            <Text className={`font-semibold ${jornada === j.value ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>
              {j.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text className="mb-1.5 text-sm font-medium text-ink-muted dark:text-ink-mutedDark">Tu nivel de inglés (autoevaluado)</Text>
      <View className="flex-row flex-wrap gap-2 mb-4">
        {LEVELS.map((l) => (
          <Pressable
            key={l}
            onPress={() => setEnglishLevel(l)}
            className={`px-4 py-2 rounded-full ${englishLevel === l ? "bg-navy-700" : "bg-navy-50 dark:bg-navy-800"}`}
          >
            <Text className={`text-sm font-semibold ${englishLevel === l ? "text-white" : "text-ink-muted dark:text-ink-mutedDark"}`}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <Input
        label="Correo institucional"
        placeholder="nombre.apellido@duocuc.cl"
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
        error={error}
      />
      <Input label="Contraseña" placeholder="Crea una contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <Button
        label="Registrarme"
        onPress={handleRegister}
        loading={loading}
        fullWidth
        disabled={!name.trim() || !career.trim() || !correo || !password}
      />
      <View className="flex-row justify-center mt-5">
        <Text className="text-ink-muted dark:text-ink-mutedDark">¿Ya tienes cuenta? </Text>
        <Link href="/(auth)/login">
          <Text className="text-navy-700 dark:text-gold-500 font-semibold">Inicia sesión</Text>
        </Link>
      </View>
    </AuthShell>
  );
}
