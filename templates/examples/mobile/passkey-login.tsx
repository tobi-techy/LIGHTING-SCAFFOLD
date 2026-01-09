import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { connectPasskey } from "../lib/lazorkit";
import { useStore } from "../lib/store";

export default function PasskeyLogin() {
  const router = useRouter();
  const { wallet, setWallet } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = Linking.createURL("auth");
      const result = await connectPasskey(redirectUrl);
      if (result) setWallet(result);
      else setError("Connection cancelled");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-center">Passkey Login</Text>
      <Text className="text-base text-gray-500 text-center mt-2 mb-8">Connect with biometric authentication</Text>

      {wallet ? (
        <View className="bg-gray-100 p-5 rounded-xl">
          <Text className="text-sm text-gray-500">Connected Wallet</Text>
          <Text className="text-base font-semibold font-mono">{wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}</Text>
          <TouchableOpacity className="border border-gray-300 p-3 rounded-lg mt-4" onPress={() => setWallet(null)}>
            <Text className="text-center text-gray-600">Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={handleConnect} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-base font-semibold">Connect with Passkey</Text>}
        </TouchableOpacity>
      )}

      {error && <Text className="text-red-500 text-center mt-4">{error}</Text>}

      <TouchableOpacity className="mt-8 items-center" onPress={() => router.back()}>
        <Text className="text-blue-600 text-base">← Back</Text>
      </TouchableOpacity>
    </View>
  );
}
