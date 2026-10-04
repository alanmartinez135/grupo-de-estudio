import { Text, TextInput, TextInputProps, View } from "react-native";
import { useAppStore } from "@/store/useAppStore";

interface InputProps extends TextInputProps {
  label: string;
  error?: string;
}

export function Input({ label, error, ...rest }: InputProps) {
  const dark = useAppStore((s) => s.theme === "dark");
  return (
    <View className="mb-4">
      {label ? (
        <Text className={`mb-1.5 text-sm font-medium ${dark ? "text-ink-mutedDark" : "text-ink-muted"}`}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={dark ? "#5B6B85" : "#9AA8C2"}
        className={`rounded-xl2 px-4 py-3 text-base border ${
          error
            ? "border-red-500"
            : dark
            ? "border-navy-600 bg-surface-cardDark text-ink-dark"
            : "border-navy-100 bg-white text-ink-light"
        }`}
        {...rest}
      />
      {error ? <Text className="mt-1 text-xs text-red-500">{error}</Text> : null}
    </View>
  );
}
