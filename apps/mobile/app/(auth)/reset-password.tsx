import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function ResetPasswordScreen() {
  const resetPassword = useAppStore((s) => s.resetPassword);
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const error = confirm && password !== confirm ? t("reset.mismatch") : "";

  function handleSubmit() {
    resetPassword(password);
    setDone(true);
    setTimeout(() => router.replace("/(auth)/login"), 1200);
  }

  if (done) {
    return (
      <AuthShell title={t("reset.doneTitle")} subtitle="">
        <View className="items-center py-4">
          <Text className="text-3xl mb-3">✅</Text>
          <Text className="text-center text-ink-light dark:text-ink-dark">{t("reset.doneBody")}</Text>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("reset.title")} subtitle={t("reset.subtitle")}>
      <Input label={t("reset.new")} secureTextEntry value={password} onChangeText={setPassword} />
      <Input label={t("reset.confirm")} secureTextEntry value={confirm} onChangeText={setConfirm} error={error} />
      <Button label={t("reset.submit")} onPress={handleSubmit} fullWidth disabled={!password || password !== confirm} />
    </AuthShell>
  );
}
