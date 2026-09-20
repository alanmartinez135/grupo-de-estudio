import { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function RegisterScreen() {
  const register = useAppStore((s) => s.register);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleRegister() {
    setLoading(true);
    setError("");
    setTimeout(() => {
      const result = register(correo, password);
      setLoading(false);
      if (!result.ok) return setError(result.message);
      router.replace("/");
    }, 400);
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Regístrate con tu correo institucional Duoc UC">
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
      <Button label="Registrarme" onPress={handleRegister} loading={loading} fullWidth disabled={!correo || !password} />
      <View className="flex-row justify-center mt-5">
        <Text className="text-ink-muted dark:text-ink-mutedDark">¿Ya tienes cuenta? </Text>
        <Link href="/(auth)/login">
          <Text className="text-navy-700 dark:text-gold-500 font-semibold">Inicia sesión</Text>
        </Link>
      </View>
    </AuthShell>
  );
}
