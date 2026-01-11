import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Types
export interface User {
  walletAddress: string;
  createdAt: Date;
}

export interface SwapRecord {
  walletAddress: string;
  fromToken: string;
  toToken: string;
  fromAmount: string;
  toAmount: string;
  signature: string;
  createdAt: Date;
}

// User Management
export async function createOrGetUser(walletAddress: string) {
  const userRef = doc(db, "users", walletAddress);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) return { id: userSnap.id, ...userSnap.data() };

  await setDoc(userRef, { walletAddress, createdAt: serverTimestamp() });
  return { id: walletAddress, walletAddress, createdAt: new Date() };
}

// Swap History
export async function saveSwap(swap: Omit<SwapRecord, "createdAt">) {
  const docRef = await addDoc(collection(db, "swaps"), {
    ...swap,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...swap };
}

export async function getSwapHistory(walletAddress: string, maxResults = 20) {
  const q = query(
    collection(db, "swaps"),
    where("walletAddress", "==", walletAddress),
    orderBy("createdAt", "desc"),
    limit(maxResults)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Message Signatures (for verification records)
export async function saveSignature(walletAddress: string, message: string, signature: string) {
  const docRef = await addDoc(collection(db, "signatures"), {
    walletAddress,
    message,
    signature,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id };
}

/*
Firestore Security Rules - Add to firestore.rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{walletAddress} {
      allow read, write: if true; // Adjust based on your auth
    }
    match /swaps/{swapId} {
      allow read, write: if true;
    }
    match /signatures/{sigId} {
      allow read, write: if true;
    }
  }
}

Firestore Indexes - Add to firestore.indexes.json:
{
  "indexes": [
    {
      "collectionGroup": "swaps",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "walletAddress", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
*/
