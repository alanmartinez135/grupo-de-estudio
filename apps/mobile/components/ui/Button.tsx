import { ActivityIndicator, Pressable, Text } from "react-native";
import { useAppStore } from "@/store/useAppStore";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: "px-4 py-2",
  md: "px-5 py-3",
  lg: "px-6 py-4",
};

const textSizeClasses: Record<Size, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-base",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  fullWidth,
}: ButtonProps) {
  const theme = useAppStore((s) => s.theme);
  const dark = theme === "dark";

  const variantClasses: Record<Variant, string> = {
    primary: "bg-navy-700 active:bg-navy-800",
    secondary: "bg-gold-500 active:bg-gold-600",
    outline: dark ? "bg-transparent border-2 border-navy-100" : "bg-transparent border-2 border-navy-700",
    ghost: "bg-transparent",
    danger: "bg-red-600 active:bg-red-700",
  };

  const textClasses: Record<Variant, string> = {
    primary: "text-white",
    secondary: "text-navy-800",
    outline: dark ? "text-navy-50" : "text-navy-700",
    ghost: dark ? "text-navy-50" : "text-navy-700",
    danger: "text-white",
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`rounded-full items-center justify-center flex-row ${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? "w-full" : ""
      } ${disabled ? "opacity-50" : ""}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" || variant === "danger" ? "#fff" : "#0B2A4A"} />
      ) : (
        <Text className={`font-semibold ${textSizeClasses[size]} ${textClasses[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
