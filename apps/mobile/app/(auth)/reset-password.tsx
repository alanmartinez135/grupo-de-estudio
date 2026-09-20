import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

export default function ResetPasswordScreen() {
  const resetPassword = useAppStore((s) => s.resetPassword);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const error = confirm && password !== confirm ? "Las contraseñas no coinciden." : "";

  function handleSubmit() {
    resetPassword(password);
    setDone(true);
    setTimeout(() => router.replace("/(auth)/login"), 1200);
  }

  if (done) {
    return (
      <AuthShell title="Contraseña actualizada" subtitle="">
        <View className="items-center py-4">
          <Text className="text-3xl mb-3">✅</Text>
          <Text className="text-center text-ink-light dark:text-ink-dark">Ya puedes iniciar sesión con tu nueva contraseña.</Text>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Ingresa y confirma tu nueva contraseña">
      <Input label="Nueva contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      <Input label="Confirmar contraseña" secureTextEntry value={confirm} onChangeText={setConfirm} error={error} />
      <Button label="Guardar contraseña" onPress={handleSubmit} fullWidth disabled={!password || password !== confirm} />
    </AuthShell>
  );
}
