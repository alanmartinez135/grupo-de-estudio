import { Text, View } from "react-native";

type Tone = "gold" | "navy" | "success" | "danger" | "neutral";

const toneClasses: Record<Tone, string> = {
  gold: "bg-gold-500/20 text-gold-600",
  navy: "bg-navy-700/10 text-navy-700",
  success: "bg-emerald-500/15 text-emerald-600",
  danger: "bg-red-500/15 text-red-600",
  neutral: "bg-ink-muted/15 text-ink-muted",
};

export function Badge({ label, tone = "navy" }: { label: string; tone?: Tone }) {
  const [bg, text] = toneClasses[tone].split(" ");
  return (
    <View className={`self-start rounded-full px-3 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${text}`}>{label}</Text>
    </View>
  );
}
