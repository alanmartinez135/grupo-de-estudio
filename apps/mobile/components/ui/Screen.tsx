import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const dark = useAppStore((s) => s.theme === "dark");
  const Wrapper = scroll ? ScrollView : View;
  return (
    <SafeAreaView className={`flex-1 ${dark ? "bg-surface-dark" : "bg-surface-light"}`} edges={["bottom", "left", "right"]}>
      <Wrapper className="flex-1" contentContainerStyle={scroll ? { padding: 20, paddingBottom: 40 } : undefined} style={!scroll ? { padding: 20 } : undefined}>
        {children}
      </Wrapper>
    </SafeAreaView>
  );
}
