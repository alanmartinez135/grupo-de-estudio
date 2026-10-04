import { useState } from "react";
import { Text, View } from "react-native";
import { Link, router } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function LoginScreen() {
  const login = useAppStore((s) => s.login);
  const t = useT();
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
    <AuthShell title={t("login.title")} subtitle={t("login.subtitle")}>
      <Input label={t("common.email")} placeholder={t("common.emailPlaceholder")} autoCapitalize="none" keyboardType="email-address" value={correo} onChangeText={setCorreo} />
      <Input label={t("common.password")} placeholder="••••••••" secureTextEntry value={password} onChangeText={setPassword} error={error} />
      <Link href="/(auth)/forgot-password" className="mb-5">
        <Text className="text-navy-700 dark:text-gold-500 text-sm font-semibold">{t("login.forgot")}</Text>
      </Link>
      <Button label={t("login.submit")} onPress={handleLogin} loading={loading} disabled={!correo || !password} fullWidth />
      <View className="flex-row justify-center mt-5">
        <Text className="text-ink-muted dark:text-ink-mutedDark">{t("login.noAccount")}</Text>
        <Link href="/(auth)/register">
          <Text className="text-navy-700 dark:text-gold-500 font-semibold">{t("login.register")}</Text>
        </Link>
      </View>
    </AuthShell>
  );
}
