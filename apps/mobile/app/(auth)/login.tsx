import { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");
    const result = await login(correo, password);
    setLoading(false);
    if (!result.ok) return setError(result.message);
    router.replace("/");
  }

  return (
    <AuthShell title="Iniciar sesión" subtitle="Ingresa con tu correo institucional Duoc UC">
      <Input label="Correo institucional" placeholder="nombre.apellido@duocuc.cl" autoCapitalize="none" keyboardType="email-address" value={correo} onChangeText={setCorreo} />
      <Input label="Contraseña" placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} error={error} />
      <Link href="/(auth)/forgot-password" className="mb-5">
        <Text className="text-navy-700 dark:text-gold-500 text-sm font-semibold">Olvidé mi contraseña</Text>
      </Link>
      <Button label="Ingresar" onPress={handleLogin} loading={loading} disabled={!correo || !password} fullWidth />
      <View className="flex-row justify-center mt-5">
        <Text className="text-ink-muted dark:text-ink-mutedDark">¿No tienes cuenta? </Text>
        <Link href="/(auth)/register">
          <Text className="text-navy-700 dark:text-gold-500 font-semibold">Regístrate</Text>
        </Link>
      </View>
    </AuthShell>
  );
}
