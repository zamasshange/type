import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore/lite";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore/lite";
import { getFirebaseConfig } from "@/lib/firebase";
import { applyRating, clean, uid, type DbResult, type DbUser } from "@/lib/cloud-types";
import {
  nationsCupFrom,
  rankedBoardFrom,
  recentFeedFrom,
  userRanksFrom,
} from "@/lib/board-live";
import type { BoardMode } from "@/lib/modes";

export type { DbResult, DbUser };
export { applyRating, uid };

function getDb() {
  const cfg = getFirebaseConfig();
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return getFirestore(app);
}

async function allUsers(): Promise<DbUser[]> {
  const snap = await getDocs(collection(getDb(), "users"));
  return snap.docs.map((d) => d.data() as DbUser);
}

async function allResults(): Promise<DbResult[]> {
  const snap = await getDocs(collection(getDb(), "results"));
  return snap.docs.map((d) => d.data() as DbResult);
}

export async function findUserByToken(token: string | null) {
  if (!token) return null;
  const snap = await getDocs(query(collection(getDb(), "users"), where("token", "==", token)));
  return snap.docs.map((d) => d.data() as DbUser).find((u) => u.kind === "user") ?? null;
}

export async function usernameTaken(username: string) {
  if (username === "guest") return false;
  const snap = await getDocs(query(collection(getDb(), "users"), where("username", "==", username)));
  return snap.docs.some((d) => (d.data() as DbUser).kind === "user");
}

export async function createUser(user: DbUser) {
  await setDoc(doc(getDb(), "users", user.id), user);
}

export async function updateUser(id: string, patch: Partial<DbUser>) {
  await updateDoc(doc(getDb(), "users", id), clean(patch as Record<string, unknown>));
}

export async function addResult(row: DbResult) {
  await setDoc(doc(getDb(), "results", row.id), clean(row as unknown as Record<string, unknown>));
}

export async function rankedBoard(
  mode: BoardMode,
  scope: "world" | "continent" | "country",
  countryCode: string,
) {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  return rankedBoardFrom(users, results, mode, scope, countryCode);
}

export async function nationsCup(mode: BoardMode = "time-60") {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  return nationsCupFrom(users, results, mode);
}

export async function recentFeed(limit = 12) {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  return recentFeedFrom(users, results, limit);
}

export async function userRanks(userId: string, countryCode: string, mode: BoardMode) {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  return userRanksFrom(users, results, userId, countryCode, mode);
}
