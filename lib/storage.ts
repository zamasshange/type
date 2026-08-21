import { DEFAULT_STATE, type AppState, type TestResult } from "./types";
import { isPb, pbKey, streakFromResults } from "./stats";
import { unlockAchievements } from "./achievements";
import { todayKey } from "./daily";

const STORAGE_KEY = "typehaven-v1";

function revive(raw: unknown): AppState {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_STATE);
  const data = raw as Partial<AppState>;
  return {
    profile: { ...DEFAULT_STATE.profile, ...data.profile },
    settings: { ...DEFAULT_STATE.settings, ...data.settings },
    results: Array.isArray(data.results) ? data.results.slice(0, 500) : [],
    pbs: data.pbs && typeof data.pbs === "object" ? data.pbs : {},
    missedWords: Array.isArray(data.missedWords) ? data.missedWords.slice(0, 200) : [],
    achievements: Array.isArray(data.achievements) ? data.achievements : [],
    dailyCompleted: data.dailyCompleted ?? null,
  };
}

export function loadState(): AppState {
  if (typeof window === "undefined") return structuredClone(DEFAULT_STATE);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    return revive(JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULT_STATE);
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function applyResult(state: AppState, result: TestResult): AppState {
  const key = pbKey(result.config);
  const currentPb = state.pbs[key];
  const pb = isPb(result, currentPb);
  const nextResult = { ...result, isPb: pb };
  const results = [nextResult, ...state.results].slice(0, 500);
  const missed = [...nextResult.missedWords, ...state.missedWords]
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 200);
  const pbs = pb ? { ...state.pbs, [key]: nextResult } : state.pbs;
  const achievements = unlockAchievements({
    ...state,
    results,
    pbs,
  });
  return {
    ...state,
    results,
    pbs,
    missedWords: missed,
    achievements,
    dailyCompleted: nextResult.isDaily ? todayKey() : state.dailyCompleted,
  };
}

export { streakFromResults };
