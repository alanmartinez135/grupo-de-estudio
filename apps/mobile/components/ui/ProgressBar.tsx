import { Text, View } from "react-native";

export function ProgressBar({ label, value, tone = "navy" }: { label: string; value: number; tone?: "navy" | "gold" }) {
  const barColor = tone === "gold" ? "bg-gold-500" : "bg-navy-700";
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-sm font-medium text-ink-light dark:text-ink-dark">{label}</Text>
        <Text className="text-sm font-semibold text-ink-light dark:text-ink-dark">{value}%</Text>
      </View>
      <View className="h-2.5 w-full rounded-full bg-navy-50 dark:bg-navy-800 overflow-hidden">
        <View className={`h-full rounded-full ${barColor}`} style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}
