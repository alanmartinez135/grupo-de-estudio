import { View, ViewProps } from "react-native";
import { useAppStore } from "@/store/useAppStore";

export function Card({ children, className = "", ...rest }: ViewProps & { className?: string }) {
  const dark = useAppStore((s) => s.theme === "dark");
  return (
    <View
      className={`rounded-2xl p-4 ${dark ? "bg-surface-cardDark" : "bg-surface-card"} ${className}`}
      style={{
        shadowColor: "#0B2A4A",
        shadowOpacity: dark ? 0 : 0.06,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: dark ? 0 : 2,
      }}
      {...rest}
    >
      {children}
    </View>
  );
}
