import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { signAndSendTransaction, sponsorTransaction } from "../lib/lazorkit";
import { useStore } from "../lib/store";

export default function GaslessTransfer() {
  const router = useRouter();
  const { wallet } = useStore();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTransfer = async () => {
    if (!wallet || !recipient || !amount) return;
    setLoading(true);
    setResult(null);

    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      const sponsoredTx = await sponsorTransaction(tx);
      const signature = await signAndSendTransaction(sponsoredTx, wallet, Linking.createURL("callback"));

      setResult(signature ? { success: true, message: `Sent! ${signature.slice(0, 16)}...` } : { success: false, message: "Cancelled" });
    } catch (e) {
      setResult({ success: false, message: e instanceof Error ? e.message : "Failed" });
    } finally {
      setLoading(false);
    }
  };

  if (!wallet) {
    return (
      <View className="flex-1 justify-center p-5">
        <Text className="text-xl font-bold text-center mb-4">Connect wallet first</Text>
        <TouchableOpacity className="bg-blue-600 p-4 rounded-xl" onPress={() => router.push("/passkey-login")}>
          <Text className="text-white text-center font-semibold">Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center p-5 bg-white">
      <Text className="text-3xl font-bold text-center">Gasless Transfer</Text>
      <Text className="text-gray-500 text-center mt-2 mb-6">Send SOL without paying gas</Text>

      <TextInput className="border border-gray-300 rounded-lg p-3 mb-3" placeholder="Recipient address" value={recipient} onChangeText={setRecipient} />
      <TextInput className="border border-gray-300 rounded-lg p-3 mb-4" placeholder="Amount (SOL)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

      <TouchableOpacity className="bg-blue-600 p-4 rounded-xl items-center" onPress={handleTransfer} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-semibold">Send (Gasless)</Text>}
      </TouchableOpacity>

      {result && <Text className={`text-center mt-4 ${result.success ? "text-green-600" : "text-red-500"}`}>{result.message}</Text>}

      <TouchableOpacity className="mt-8" onPress={() => router.back()}>
        <Text className="text-blue-600 text-center">← Back</Text>
      </TouchableOpacity>
    </View>
  );
}
