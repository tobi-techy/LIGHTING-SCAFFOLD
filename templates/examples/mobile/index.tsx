import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  const examples = [
    { route: "/passkey-login", title: "Passkey Login", desc: "WebAuthn authentication" },
    { route: "/gasless-transfer", title: "Gasless Transfer", desc: "Send SOL without gas" },
    { route: "/biometric-onboard", title: "Biometric Onboarding", desc: "Secure wallet setup" },
  ];

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-center">Welcome</Text>
      <Text className="text-gray-500 text-center mt-2 mb-8">LazorKit SDK Examples</Text>

      {examples.map((ex) => (
        <TouchableOpacity
          key={ex.route}
          className="border border-gray-200 p-4 rounded-xl mb-3"
          onPress={() => router.push(ex.route)}
        >
          <Text className="font-semibold">{ex.title}</Text>
          <Text className="text-sm text-gray-500">{ex.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
