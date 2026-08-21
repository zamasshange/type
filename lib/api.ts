import type { BoardMode } from "./modes";

export interface ServerCompare {
  worldRank: number | null;
  continentRank: number | null;
  countryRank: number | null;
  rating: number;
  delta: number;
  champWpm: number | null;
  champName: string | null;
  nationsRank: number | null;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error || "request failed");
  }
  return res.json() as Promise<T>;
}

export function authHeader(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface BoardRow {
  rank: number;
  id: string;
  name: string;
  countryCode: string;
  rating: number;
  wpm: number;
  accuracy: number;
  timestamp: number;
  kind: "user" | "seed";
}

export interface NationRow {
  rank: number;
  code: string;
  name: string;
  continent: string;
  testers: number;
  avgWpm: number;
}

export interface FeedItem {
  id: string;
  name: string;
  countryCode: string;
  wpm: number;
  accuracy: number;
  mode: BoardMode;
  timestamp: number;
  kind: "user" | "seed";
}

export interface Summary {
  worldRank: number | null;
  continentRank: number | null;
  countryRank: number | null;
  champWpm: number | null;
  champName: string | null;
  nationsRank: number | null;
  nationAvg: number | null;
  rating: number;
}
