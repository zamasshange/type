import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore/lite";
import { getFirebaseDb } from "@/lib/firebase";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { hashString, mulberry32 } from "@/lib/generate";
import type { BoardMode } from "@/lib/modes";
import { todayKey } from "@/lib/daily";

export interface DbUser {
  id: string;
  username: string;
  countryCode: string;
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

const SEED: [string, string][] = [
  ["nova", "US"],
  ["keyfox", "GB"],
  ["zenith", "DE"],
  ["pixel", "JP"],
  ["lumen", "FR"],
  ["orbit", "KR"],
  ["saffron", "IN"],
  ["ripple", "BR"],
  ["cinder", "CA"],
  ["echo", "AU"],
  ["mira", "SE"],
  ["volt", "NL"],
  ["kestrel", "IE"],
  ["quartz", "PL"],
  ["nimbus", "ES"],
  ["ember", "IT"],
  ["solace", "PT"],
  ["drift", "NO"],
  ["haven", "FI"],
  ["prism", "DK"],
  ["cobalt", "CH"],
  ["willow", "NZ"],
  ["sable", "ZA"],
  ["lotus", "SG"],
  ["cacao", "MX"],
  ["andes", "AR"],
  ["coral", "PH"],
  ["monsoon", "BD"],
  ["cedar", "TR"],
  ["delta", "EG"],
  ["safari", "KE"],
  ["baobab", "NG"],
  ["atlas", "MA"],
  ["orchid", "TH"],
  ["bamboo", "VN"],
  ["silk", "CN"],
  ["fuji", "JP"],
  ["canyon", "US"],
  ["harbor", "GB"],
  ["fjord", "NO"],
  ["pampas", "AR"],
  ["lagoon", "ID"],
  ["aurora", "FI"],
  ["onyx", "AE"],
  ["ivory", "GH"],
  ["peak", "CL"],
  ["grove", "MY"],
  ["reef", "AU"],
  ["comet", "KR"],
  ["falcon", "US"],
  ["viper", "IN"],
  ["jaguar", "BR"],
  ["crane", "CN"],
  ["osprey", "CA"],
];

function clean<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

let seedPromise: Promise<void> | null = null;

async function ensureSeed() {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = getFirebaseDb();
      const marker = await getDoc(doc(db, "meta", "seed"));
      if (marker.exists()) return;

      const jobs: Array<() => Promise<void>> = [];
      const modes: BoardMode[] = ["time-15", "time-60", "words-25", "words-50", "daily"];
      for (const [name, country] of SEED) {
        const rng = mulberry32(hashString(`seed-${name}-${country}`));
        const id = `seed-${name}-${country}`;
        jobs.push(() =>
          setDoc(doc(db, "users", id), {
            id,
            username: name,
            countryCode: country,
            token: `seed-${id}`,
            createdAt: Date.now() - Math.floor(rng() * 8.64e7 * 40),
            rating: Math.round(980 + rng() * 700),
            kind: "seed",
          }),
        );
        for (const mode of modes) {
          const scale = mode === "time-15" ? 1.08 : mode === "time-60" ? 0.97 : 1;
          const wpm = Math.round((68 + rng() * 55) * scale * 10) / 10;
          const rowId = `${id}-${mode}`;
          jobs.push(() =>
            setDoc(
              doc(db, "results", rowId),
              clean({
                id: rowId,
                userId: id,
                wpm,
                rawWpm: Math.round((wpm + 4 + rng() * 6) * 10) / 10,
                accuracy: Math.round((93 + rng() * 6.5) * 10) / 10,
                consistency: Math.round((70 + rng() * 22) * 10) / 10,
                burst: Math.round(wpm + 12 + rng() * 18),
                timeMs: mode.startsWith("time") ? Number(mode.split("-")[1]) * 1000 : 25000,
                mode,
                timestamp: Date.now() - Math.floor(rng() * 8.64e7),
                isDaily: mode === "daily",
                dailyKey: mode === "daily" ? todayKey() : undefined,
              }),
            ),
          );
        }
      }
      jobs.push(() => setDoc(doc(db, "meta", "seed"), { done: true, at: Date.now() }));
      const chunk = 40;
      for (let i = 0; i < jobs.length; i += chunk) {
        await Promise.all(jobs.slice(i, i + chunk).map((run) => run()));
      }
    })().catch((err: unknown) => {
      seedPromise = null;
      const message = err instanceof Error ? err.message : "unknown";
      throw new Error(
        `Cloud Firestore is not ready (${message}). In Firestore → Rules, allow read and write (see firestore.rules), then refresh.`,
      );
    });
  }
  return seedPromise;
}

async function allUsers(): Promise<DbUser[]> {
  await ensureSeed();
  const snap = await getDocs(collection(getFirebaseDb(), "users"));
  return snap.docs.map((d) => d.data() as DbUser);
}

async function allResults(): Promise<DbResult[]> {
  await ensureSeed();
  const snap = await getDocs(collection(getFirebaseDb(), "results"));
  return snap.docs.map((d) => d.data() as DbResult);
}

export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function findUserByToken(token: string | null) {
  if (!token) return null;
  await ensureSeed();
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "users"), where("token", "==", token)),
  );
  return snap.docs.map((d) => d.data() as DbUser).find((u) => u.kind === "user") ?? null;
}

export async function usernameTaken(username: string) {
  if (username === "guest") return false;
  await ensureSeed();
  const snap = await getDocs(
    query(collection(getFirebaseDb(), "users"), where("username", "==", username)),
  );
  return snap.docs.some((d) => (d.data() as DbUser).kind === "user");
}

export async function createUser(user: DbUser) {
  await ensureSeed();
  await setDoc(doc(getFirebaseDb(), "users", user.id), user);
}

export async function updateUser(id: string, patch: Partial<DbUser>) {
  await ensureSeed();
  await updateDoc(doc(getFirebaseDb(), "users", id), clean(patch as Record<string, unknown>));
}

export async function addResult(row: DbResult) {
  await ensureSeed();
  await setDoc(doc(getFirebaseDb(), "results", row.id), clean(row as unknown as Record<string, unknown>));
}

export async function bestsForMode(mode: BoardMode) {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const map = new Map<string, DbResult>();
  for (const row of results) {
    if (row.mode !== mode) continue;
    if (mode === "daily" && row.dailyKey !== todayKey()) continue;
    const prev = map.get(row.userId);
    if (!prev || row.wpm > prev.wpm || (row.wpm === prev.wpm && row.accuracy > prev.accuracy)) {
      map.set(row.userId, row);
    }
  }
  return [...map.values()]
    .map((row) => {
      const user = byId.get(row.userId);
      if (!user) return null;
      return { row, user };
    })
    .filter((x): x is { row: DbResult; user: DbUser } => Boolean(x))
    .sort((a, b) => b.row.wpm - a.row.wpm || b.row.accuracy - a.row.accuracy);
}

export async function rankedBoard(
  mode: BoardMode,
  scope: "world" | "continent" | "country",
  countryCode: string,
) {
  const country = getCountry(countryCode);
  let rows = await bestsForMode(mode);
  if (scope === "country") rows = rows.filter((x) => x.user.countryCode === countryCode);
  if (scope === "continent") {
    rows = rows.filter((x) => getCountry(x.user.countryCode).continent === country.continent);
  }
  return rows.slice(0, 50).map((x, i) => ({
    rank: i + 1,
    id: x.user.id,
    name: x.user.username,
    countryCode: x.user.countryCode,
    rating: x.user.rating,
    wpm: x.row.wpm,
    accuracy: x.row.accuracy,
    timestamp: x.row.timestamp,
    kind: x.user.kind,
  }));
}

export async function nationsCup(mode: BoardMode = "time-60") {
  const bests = await bestsForMode(mode);
  const byCountry = new Map<string, number[]>();
  for (const { row, user } of bests) {
    const list = byCountry.get(user.countryCode) ?? [];
    list.push(row.wpm);
    byCountry.set(user.countryCode, list);
  }
  return COUNTRIES.map((c) => {
    const scores = (byCountry.get(c.code) ?? []).sort((a, b) => b - a).slice(0, 5);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      code: c.code,
      name: c.name,
      continent: c.continent,
      testers: scores.length,
      avgWpm: Math.round(avg * 10) / 10,
    };
  })
    .filter((c) => c.testers > 0)
    .sort((a, b) => b.avgWpm - a.avgWpm)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export async function recentFeed(limit = 12) {
  const [users, results] = await Promise.all([allUsers(), allResults()]);
  const byId = new Map(users.map((u) => [u.id, u]));
  return [...results]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((row) => {
      const user = byId.get(row.userId);
      if (!user) return null;
      return {
        id: row.id,
        name: user.username,
        countryCode: user.countryCode,
        wpm: row.wpm,
        accuracy: row.accuracy,
        mode: row.mode,
        timestamp: row.timestamp,
        kind: user.kind,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

export async function userRanks(userId: string, countryCode: string, mode: BoardMode) {
  const world = await bestsForMode(mode);
  const country = getCountry(countryCode);
  const worldRank = world.findIndex((x) => x.user.id === userId) + 1;
  const continentRank =
    world
      .filter((x) => getCountry(x.user.countryCode).continent === country.continent)
      .findIndex((x) => x.user.id === userId) + 1;
  const countryRank =
    world.filter((x) => x.user.countryCode === countryCode).findIndex((x) => x.user.id === userId) + 1;
  const champ = world.find((x) => x.user.countryCode === countryCode);
  return {
    worldRank: worldRank || null,
    continentRank: continentRank || null,
    countryRank: countryRank || null,
    champWpm: champ?.row.wpm ?? null,
    champName: champ?.user.username ?? null,
  };
}

export function applyRating(user: DbUser, wpm: number, accuracy: number) {
  const performance = wpm + (accuracy - 96) * 0.4;
  const delta = Math.round(Math.max(-16, Math.min(18, (performance - 72) * 0.32)));
  user.rating = Math.max(100, Math.min(3200, user.rating + delta));
  return delta;
}
