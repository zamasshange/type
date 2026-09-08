import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

// Public Firebase web config (safe in client bundles). Env vars override when set.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCfXCLa1rW4-ty-yySidh_O19gR8YPp0II",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "typesite-886c0.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "typesite-886c0",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "typesite-886c0.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "855089161060",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:855089161060:web:3ce04891f3bc765c605071",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-HBKNF8B866",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://typesite-886c0-default-rtdb.firebaseio.com",
};

export function getFirebaseConfig() {
  return firebaseConfig;
}

export function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

export function getFirebaseApp(): FirebaseApp {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase env vars are missing. Add them to .env.local and restart npm run dev.");
  }
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}
