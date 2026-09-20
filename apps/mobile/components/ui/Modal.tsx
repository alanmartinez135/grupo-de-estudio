import { Modal as RNModal, Pressable, Text, View } from "react-native";
import { useAppStore } from "@/store/useAppStore";

export function Modal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const dark = useAppStore((s) => s.theme === "dark");
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/50 items-center justify-center px-5" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl p-6 ${dark ? "bg-surface-cardDark" : "bg-white"}`}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className={`text-lg font-bold ${dark ? "text-ink-dark" : "text-ink-light"}`}>{title}</Text>
            <Pressable onPress={onClose} className="w-8 h-8 rounded-full items-center justify-center bg-navy-50 dark:bg-navy-800">
              <Text className="text-navy-700 dark:text-ink-dark font-semibold">✕</Text>
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
