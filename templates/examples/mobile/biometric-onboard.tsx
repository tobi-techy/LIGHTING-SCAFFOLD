import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import { connectPasskey } from "../lib/lazorkit";
import { useStore } from "../lib/store";

export default function BiometricOnboard() {
  const router = useRouter();
  const { wallet, setWallet } = useStore();
  const [step, setStep] = useState<"welcome" | "biometric" | "connecting" | "done">("welcome");
  const [error, setError] = useState<string | null>(null);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      setError("Biometric authentication not available");
      return;
    }

    const result = await LocalAuthentication.authenticateAsync({ promptMessage: "Verify your identity" });

    if (result.success) {
      setStep("connecting");
      await handleConnect();
    } else {
      setError("Authentication failed");
    }
  };

  const handleConnect = async () => {
    try {
      const redirectUrl = Linking.createURL("auth");
      const result = await connectPasskey(redirectUrl);
      if (result) {
        setWallet(result);
        setStep("done");
      } else {
        setError("Connection cancelled");
        setStep("biometric");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setStep("biometric");
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      {step === "welcome" && (
        <>
          <Text className="text-3xl font-bold text-center">Welcome</Text>
          <Text className="text-gray-500 text-center mt-2 mb-8">Secure your wallet with biometrics</Text>
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl" onPress={() => setStep("biometric")}>
            <Text className="text-white text-center font-semibold">Get Started</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "biometric" && (
        <>
          <Text className="text-3xl font-bold text-center">🔐</Text>
          <Text className="text-xl font-bold text-center mt-4">Enable Biometrics</Text>
          <Text className="text-gray-500 text-center mt-2 mb-8">Use Face ID or Touch ID to secure your wallet</Text>
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl" onPress={checkBiometrics}>
            <Text className="text-white text-center font-semibold">Authenticate</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "connecting" && (
        <View className="items-center">
          <ActivityIndicator size="large" color="#0066FF" />
          <Text className="text-gray-500 mt-4">Creating your wallet...</Text>
        </View>
      )}

      {step === "done" && wallet && (
        <>
          <Text className="text-4xl text-center">✓</Text>
          <Text className="text-xl font-bold text-center mt-4">You're all set!</Text>
          <View className="bg-gray-100 p-4 rounded-xl mt-6">
            <Text className="text-sm text-gray-500">Your wallet</Text>
            <Text className="font-mono">{wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}</Text>
          </View>
          <TouchableOpacity className="bg-blue-600 p-4 rounded-xl mt-6" onPress={() => router.replace("/")}>
            <Text className="text-white text-center font-semibold">Continue to App</Text>
          </TouchableOpacity>
        </>
      )}

      {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}

      {step !== "done" && step !== "connecting" && (
        <TouchableOpacity className="mt-8" onPress={() => router.back()}>
          <Text className="text-blue-600 text-center">← Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
