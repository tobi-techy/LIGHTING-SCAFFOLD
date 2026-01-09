import { Pressable, Text, PressableProps, TextStyle, ViewStyle } from "react-native";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: "default" | "outline" | "ghost";
}

export function Button({ title, variant = "default", style, ...props }: ButtonProps) {
  const baseStyle: ViewStyle = { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, alignItems: "center" };
  const variants: Record<string, ViewStyle> = {
    default: { backgroundColor: "#6366f1" },
    outline: { borderWidth: 1, borderColor: "#6366f1" },
    ghost: {},
  };
  const textVariants: Record<string, TextStyle> = {
    default: { color: "#fff" },
    outline: { color: "#6366f1" },
    ghost: { color: "#6366f1" },
  };
  return (
    <Pressable style={[baseStyle, variants[variant], style as ViewStyle]} {...props}>
      <Text style={[{ fontWeight: "600" }, textVariants[variant]]}>{title}</Text>
    </Pressable>
  );
}
