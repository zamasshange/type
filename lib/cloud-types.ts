import type { BoardMode } from "./modes";
import type { Gender } from "./types";

export interface DbUser {
  id: string;
  username: string;
  countryCode: string;
  gender?: Gender;
  token: string;
  createdAt: number;
  rating: number;
  kind: "user" | "seed";
}

export interface DbResult {
  id: string;
  userId: string;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  burst: number;
  timeMs: number;
  mode: BoardMode;
  timestamp: number;
  isDaily: boolean;
  dailyKey?: string;
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export function applyRating(user: DbUser, wpm: number, accuracy: number) {
  const performance = wpm + (accuracy - 96) * 0.4;
  const delta = Math.round(Math.max(-16, Math.min(18, (performance - 72) * 0.32)));
  user.rating = Math.max(100, Math.min(3200, user.rating + delta));
  return delta;
}
