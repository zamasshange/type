import { getAuth, signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  initializeFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { getDatabase, onValue, ref, update, type Database } from "firebase/database";
import { getFirebaseApp, getFirebaseConfig } from "./firebase";
import { applyRating, clean, uid, type DbResult, type DbUser } from "./cloud-types";
import { modeFromConfig, type BoardMode } from "./modes";
import { todayKey } from "./daily";
import type { TestConfig } from "./types";
import type { ServerCompare } from "./api";
import { nationsCupFrom, userRanksFrom } from "./board-live";

export interface LiveState {
  users: DbUser[];
  results: DbResult[];
  ready: boolean;
  error: string | null;
  backend: "firestore" | "rtdb" | null;
}

type Writer = {
  putUser: (user: DbUser) => Promise<void>;
  patchUser: (id: string, patch: Partial<DbUser>) => Promise<void>;
  putResult: (row: DbResult) => Promise<void>;
};

const listeners = new Set<(state: LiveState) => void>();

let state: LiveState = {
  users: [],
  results: [],
  ready: false,
  error: null,
  backend: null,
};

let startPromise: Promise<void> | null = null;
let writer: Writer | null = null;

function emit(next: Partial<LiveState>) {
  state = { ...state, ...next };
  for (const cb of listeners) cb(state);
}

function rulesHint(message: string) {
  return `Firebase rules are still locked (${message}). Open Firestore → Rules, allow read and write, click Publish. Then Realtime Database → Rules, set .read and .write to true, Publish. Refresh this page.`;
}

function getFs(): Firestore {
  const app = getFirebaseApp();
  try {
    return initializeFirestore(app, { experimentalForceLongPolling: true });
  } catch {
    return getFirestore(app);
  }
}

function getRtdb(): Database {
  const url = getFirebaseConfig().databaseURL;
  if (!url) throw new Error("Realtime Database URL is missing.");
  return getDatabase(getFirebaseApp(), url);
}

async function ensureAuth() {
  try {
    const auth = getAuth(getFirebaseApp());
    if (!auth.currentUser) {
      await Promise.race([
        signInAnonymously(auth),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("auth timeout")), 3000)),
      ]);
    }
  } catch {
    // Anonymous auth may be off; open rules still allow the board.
  }
}

async function startFirestore() {
  await ensureAuth();
  const db = getFs();
  writer = {
    putUser: (user) => setDoc(doc(db, "users", user.id), user),
    patchUser: (id, patch) => updateDoc(doc(db, "users", id), clean(patch as Record<string, unknown>)),
    putResult: (row) => setDoc(doc(db, "results", row.id), clean(row as unknown as Record<string, unknown>)),
  };

  await new Promise<void>((resolve, reject) => {
    let usersReady = false;
    let resultsReady = false;
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(err);
    };
    const check = () => {
      if (!usersReady || !resultsReady || settled) return;
      settled = true;
      window.clearTimeout(timer);
      emit({ ready: true, error: null, backend: "firestore" });
      resolve();
    };
    const timer = window.setTimeout(() => fail(new Error("Firestore timed out.")), 8000);
    onSnapshot(
      collection(db, "users"),
      (snap) => {
        usersReady = true;
        emit({ users: snap.docs.map((d) => d.data() as DbUser) });
        check();
      },
      (err) => fail(err),
    );
    onSnapshot(
      collection(db, "results"),
      (snap) => {
        resultsReady = true;
        emit({ results: snap.docs.map((d) => d.data() as DbResult) });
        check();
      },
      (err) => fail(err),
    );
  });
}

async function startRtdb() {
  const db = getRtdb();
  writer = {
    putUser: (user) => update(ref(db), { [`users/${user.id}`]: user }),
    patchUser: (id, patch) => update(ref(db), { [`users/${id}`]: { ...state.users.find((u) => u.id === id), ...patch } }),
    putResult: (row) => update(ref(db), { [`results/${row.id}`]: clean(row as unknown as Record<string, unknown>) }),
  };

  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("Realtime Database timed out."));
      }
    }, 8000);
    onValue(
      ref(db),
      (snap) => {
        const val = (snap.val() ?? {}) as {
          users?: Record<string, DbUser>;
          results?: Record<string, DbResult>;
        };
        emit({
          users: Object.values(val.users ?? {}),
          results: Object.values(val.results ?? {}),
          ready: true,
          error: null,
          backend: "rtdb",
        });
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          resolve();
        }
      },
      (err) => {
        if (!settled) {
          settled = true;
          window.clearTimeout(timer);
          reject(err);
        }
      },
    );
  });
}

async function startRtdbRest() {
  const base = getFirebaseConfig().databaseURL?.replace(/\/$/, "");
  if (!base) throw new Error("Realtime Database URL is missing.");

  const read = async (path: string) => {
    const url = path ? `${base}/${path}.json` : `${base}/.json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Database HTTP ${res.status}`);
    return res.json();
  };
  const write = async (path: string, body: unknown) => {
    const res = await fetch(`${base}/${path}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Database write HTTP ${res.status}`);
  };

  const pull = async () => {
    const val = (await read("")) as {
      users?: Record<string, DbUser>;
      results?: Record<string, DbResult>;
    } | null;
    emit({
      users: Object.values(val?.users ?? {}),
      results: Object.values(val?.results ?? {}),
      ready: true,
      error: null,
      backend: "rtdb",
    });
  };

  await pull();
  window.setInterval(() => void pull().catch(() => undefined), 2500);
  writer = {
    putUser: (user) => write(`users/${user.id}`, user),
    patchUser: async (id, patch) => {
      const current = state.users.find((u) => u.id === id);
      await write(`users/${id}`, { ...current, ...patch });
    },
    putResult: (row) => write(`results/${row.id}`, clean(row as unknown as Record<string, unknown>)),
  };
}

export function startLive() {
  if (!startPromise) {
    startPromise = (async () => {
      try {
        await startFirestore();
      } catch {
        try {
          await startRtdbRest();
        } catch {
          try {
            await startRtdb();
          } catch (fallback) {
            const message = fallback instanceof Error ? fallback.message : "offline";
            emit({ error: rulesHint(message), ready: false, backend: null });
            startPromise = null;
          }
        }
      }
    })();
  }
  return startPromise;
}

export function subscribeLive(cb: (next: LiveState) => void) {
  listeners.add(cb);
  cb(state);
  void startLive();
  return () => {
    listeners.delete(cb);
  };
}

export function getLiveState() {
  return state;
}

async function waitReady() {
  if (state.ready && writer) return;
  await startLive();
  if (state.ready && writer) return;
  await new Promise<void>((resolve, reject) => {
    const stop = subscribeLive((next) => {
      if (next.ready && writer) {
        stop();
        resolve();
      } else if (next.error) {
        stop();
        reject(new Error(next.error));
      }
    });
  });
}

export async function registerLiveUser(username: string, countryCode: string) {
  await waitReady();
  const name = username.trim().slice(0, 24) || "guest";
  const code = countryCode.toUpperCase();
  const existing = state.users.find((u) => u.kind === "user" && u.username.toLowerCase() === name.toLowerCase());
  if (existing) {
    const user: DbUser = { ...existing, countryCode: code };
    if (existing.countryCode !== code) await writer!.patchUser(existing.id, { countryCode: code });
    emit({ users: state.users.map((u) => (u.id === user.id ? user : u)) });
    return user;
  }
  const user: DbUser = {
    id: uid("usr"),
    username: name,
    countryCode: code,
    token: uid("tok"),
    createdAt: Date.now(),
    rating: 1000,
    kind: "user",
  };
  await writer!.putUser(user);
  emit({ users: [...state.users.filter((u) => u.id !== user.id), user] });
  return user;
}

export async function updateLiveProfile(token: string, patch: { username?: string; countryCode?: string }) {
  await waitReady();
  const found = state.users.find((u) => u.token === token && u.kind === "user");
  if (!found) return;
  const next = {
    username: patch.username ? patch.username.trim().slice(0, 24) || found.username : found.username,
    countryCode: patch.countryCode ? patch.countryCode.toUpperCase() : found.countryCode,
  };
  await writer!.patchUser(found.id, next);
  emit({ users: state.users.map((u) => (u.id === found.id ? { ...u, ...next } : u)) });
}

export async function publishLiveResult(
  token: string,
  body: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    burst: number;
    timeMs: number;
    config: TestConfig;
    isDaily?: boolean;
  },
): Promise<ServerCompare> {
  await waitReady();
  const found = state.users.find((u) => u.token === token && u.kind === "user");
  if (!found) throw new Error("sign in first");
  const user = { ...found };
  const mode = modeFromConfig(body.config, body.isDaily);
  if (!mode) {
    return {
      worldRank: null,
      continentRank: null,
      countryRank: null,
      rating: user.rating,
      delta: 0,
      champWpm: null,
      champName: null,
      nationsRank: null,
    };
  }
  const delta = applyRating(user, body.wpm, body.accuracy);
  const row: DbResult = clean({
    id: uid("res"),
    userId: user.id,
    wpm: Math.round(body.wpm * 10) / 10,
    rawWpm: Math.round((body.rawWpm || body.wpm) * 10) / 10,
    accuracy: Math.round(body.accuracy * 10) / 10,
    consistency: Math.round((body.consistency || 0) * 10) / 10,
    burst: Math.round(body.burst || body.wpm),
    timeMs: Math.max(1, body.timeMs || 1),
    mode,
    timestamp: Date.now(),
    isDaily: mode === "daily",
    dailyKey: mode === "daily" ? todayKey() : undefined,
  });
  await writer!.putResult(row);
  await writer!.patchUser(user.id, { rating: user.rating });
  const users = state.users.map((u) => (u.id === user.id ? user : u));
  const results = [...state.results, row];
  emit({ users, results });
  const ranks = userRanksFrom(users, results, user.id, user.countryCode, mode);
  const nation = nationsCupFrom(users, results, mode).find((n) => n.code === user.countryCode);
  return {
    rating: user.rating,
    delta,
    worldRank: ranks.worldRank,
    continentRank: ranks.continentRank,
    countryRank: ranks.countryRank,
    champWpm: ranks.champWpm,
    champName: ranks.champName,
    nationsRank: nation?.rank ?? null,
  };
}

export function summaryFromLive(
  users: DbUser[],
  results: DbResult[],
  userId: string | undefined,
  countryCode: string,
  mode: BoardMode,
) {
  const ranks = userRanksFrom(users, results, userId ?? "__none__", countryCode, mode);
  const nation = nationsCupFrom(users, results, mode).find((n) => n.code === countryCode);
  const user = users.find((u) => u.id === userId);
  return {
    worldRank: userId ? ranks.worldRank : null,
    continentRank: userId ? ranks.continentRank : null,
    countryRank: userId ? ranks.countryRank : null,
    champWpm: ranks.champWpm,
    champName: ranks.champName,
    nationsRank: nation?.rank ?? null,
    nationAvg: nation?.avgWpm ?? null,
    rating: user?.rating ?? 1000,
  };
}
