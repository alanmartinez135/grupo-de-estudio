import { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function ForgotPasswordScreen() {
  const requestPasswordReset = useAppStore((s) => s.requestPasswordReset);
  const t = useT();
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    const result = requestPasswordReset(correo);
    if (!result.ok) return setError(result.message);
    setError("");
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title={t("forgot.sentTitle")} subtitle="">
        <View className="items-center py-2">
          <View className="w-14 h-14 rounded-full bg-navy-50 dark:bg-navy-800 items-center justify-center mb-4">
            <Text className="text-2xl">✉️</Text>
          </View>
          <Text className="text-center text-ink-light dark:text-ink-dark mb-6">
            {t("forgot.sentBody")}
          </Text>
          <Button label={t("forgot.newPassword")} onPress={() => router.push("/(auth)/reset-password")} fullWidth />
          <Link href="/(auth)/login" className="mt-4">
            <Text className="text-navy-700 dark:text-gold-500 font-semibold">{t("common.backToLogin")}</Text>
          </Link>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("forgot.title")} subtitle={t("forgot.subtitle")}>
      <Input
        label={t("common.email")}
        placeholder={t("common.emailPlaceholder")}
        autoCapitalize="none"
        keyboardType="email-address"
        value={correo}
        onChangeText={setCorreo}
        error={error}
      />
      <Button label={t("forgot.submit")} onPress={handleSend} fullWidth />
      <Link href="/(auth)/login" className="mt-5 self-center">
        <Text className="text-navy-700 dark:text-gold-500 font-semibold">{t("common.backToLogin")}</Text>
      </Link>
    </AuthShell>
  );
}
