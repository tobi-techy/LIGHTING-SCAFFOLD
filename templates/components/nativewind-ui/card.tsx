import { View, Text, ViewProps, TextProps } from "react-native";

export function Card({ style, ...props }: ViewProps) {
  return <View style={[{ borderRadius: 12, backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, padding: 16 }, style]} {...props} />;
}

export function CardHeader({ style, ...props }: ViewProps) {
  return <View style={[{ marginBottom: 12 }, style]} {...props} />;
}

export function CardTitle({ style, ...props }: TextProps) {
  return <Text style={[{ fontSize: 20, fontWeight: "600" }, style]} {...props} />;
}

export function CardContent(props: ViewProps) {
  return <View {...props} />;
}
