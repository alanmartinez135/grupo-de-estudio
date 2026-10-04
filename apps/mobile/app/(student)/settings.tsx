import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/ui/Screen";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { useT } from "@/lib/useT";

export default function SettingsScreen() {
  const authUser = useAppStore((s) => s.authUser);
  const t = useT();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const logout = useAppStore((s) => s.logout);
  const deleteAccount = useAppStore((s) => s.deleteAccount);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleLogout() {
    await logout();
    router.replace("/(auth)/login");
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    const result = await deleteAccount();
    setDeleting(false);
    if (!result.ok) return setDeleteError(result.message);
    setConfirmOpen(false);
    router.replace("/(auth)/login");
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setDeleteError("");
  }

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink-light dark:text-ink-dark mb-6">{t("settings.title")}</Text>

      <Card className="items-center mb-5 py-6">
        <Avatar name={authUser?.name ?? ""} color={authUser?.avatarColor} size={72} />
        <Text className="text-lg font-bold text-ink-light dark:text-ink-dark mt-3">{authUser?.name}</Text>
        <Text className="text-ink-muted dark:text-ink-mutedDark">{authUser?.correo}</Text>
        <Pressable className="mt-3 bg-navy-50 dark:bg-navy-800 rounded-full px-4 py-2">
          <Text className="text-navy-700 dark:text-gold-500 text-sm font-semibold">{t("settings.changePhoto")}</Text>
        </Pressable>
      </Card>

      <Card className="mb-5">
        <Text className="font-bold text-ink-light dark:text-ink-dark mb-4">{t("settings.preferences")}</Text>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-ink-light dark:text-ink-dark">{t("settings.darkMode")}</Text>
          <Switch value={theme === "dark"} onValueChange={toggleTheme} trackColor={{ true: "#FFC72C" }} />
        </View>

        <Text className="text-ink-light dark:text-ink-dark mb-2">{t("settings.language")}</Text>
        <View className="flex-row rounded-full bg-navy-50 dark:bg-navy-800 p-1">
          <Pressable onPress={() => setLanguage("es")} className={`flex-1 rounded-full py-2 items-center ${language === "es" ? "bg-white dark:bg-navy-700" : ""}`}>
            <Text className={`font-semibold ${language === "es" ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>Español</Text>
          </Pressable>
          <Pressable onPress={() => setLanguage("en")} className={`flex-1 rounded-full py-2 items-center ${language === "en" ? "bg-white dark:bg-navy-700" : ""}`}>
            <Text className={`font-semibold ${language === "en" ? "text-navy-700 dark:text-gold-500" : "text-ink-muted dark:text-ink-mutedDark"}`}>English</Text>
          </Pressable>
        </View>
      </Card>

      <Button label={t("settings.logout")} variant="outline" onPress={handleLogout} fullWidth />

      <Card className="mt-6 border border-red-200 dark:border-red-900">
        <Text className="font-bold text-red-600 mb-1">{t("settings.danger")}</Text>
        <Text className="text-ink-muted dark:text-ink-mutedDark mb-4">{t("settings.dangerBody")}</Text>
        <Button label={t("settings.deleteAccount")} variant="danger" onPress={() => setConfirmOpen(true)} fullWidth />
      </Card>

      <Modal visible={confirmOpen} onClose={closeConfirm} title={t("settings.confirmTitle")}>
        <Text className="text-ink-light dark:text-ink-dark mb-5">
          {t("settings.confirmBody")}
        </Text>
        {deleteError ? <Text className="text-red-600 text-sm mb-4">{deleteError}</Text> : null}
        <View className="flex-row gap-3">
          <Button label={t("common.cancel")} variant="outline" onPress={closeConfirm} fullWidth />
          <Button label={t("common.delete")} variant="danger" onPress={handleDelete} loading={deleting} fullWidth />
        </View>
      </Modal>
    </Screen>
  );
}
