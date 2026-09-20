import { Image, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "@/store/useAppStore";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const dark = useAppStore((s) => s.theme === "dark");

  return (
    <View className={`flex-1 ${dark ? "bg-navy-900" : "bg-navy-700"}`}>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
            }}
          >
            {/* Contenedor principal: Dos columnas en web/desktop */}
            <View className="w-full max-w-5xl flex-col md:flex-row items-center justify-center gap-10 md:gap-14">
              
              {/* LADO IZQUIERDO: Círculo grande con el logo completo */}
              <View className="items-center justify-center">
                <View className="w-56 h-56 md:w-72 md:h-72 rounded-full overflow-hidden bg-[#FFB71A] items-center justify-center p-6 shadow-2xl">
                  <Image
                    source={require("../assets/images/duoc-logo.jpg")}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* LADO DERECHO: Títulos centrados arriba y Formulario abajo */}
              <View className="w-full max-w-md flex-col">
                
                {/* Textos centrados */}
                <View className="mb-6 items-center text-center">
                  <Text className="text-white text-3xl font-extrabold text-center">
                    {title}
                  </Text>
                  <Text className="text-navy-100 text-base text-center mt-2">
                    {subtitle}
                  </Text>
                </View>

                {/* Tarjeta blanca con los inputs y botones */}
                <View
                  className={`rounded-2xl p-8 shadow-xl ${
                    dark ? "bg-surface-cardDark" : "bg-white"
                  }`}
                >
                  {children}
                </View>

              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}