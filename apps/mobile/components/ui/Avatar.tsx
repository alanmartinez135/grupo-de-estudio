import { Text, View } from "react-native";

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Avatar({ name, color = "#0B2A4A", size = 40 }: { name: string; color?: string; size?: number }) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.38 }} className="font-bold text-white">
        {initials(name)}
      </Text>
    </View>
  );
}
