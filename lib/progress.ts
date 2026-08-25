import type { DbResult } from "./cloud-types";
import type { BoardMode } from "./modes";
import { isPb, pbKey } from "./stats";
import {
  DEFAULT_CONFIG,
  DEFAULT_SETTINGS,
  type AppState,
  type Settings,
  type TestConfig,
  type TestResult,
  type TimeDuration,
  type WordCount,
} from "./types";

export interface CloudProgress {
  results: TestResult[];
  pbs: Record<string, TestResult>;
  missedWords: string[];
  achievements: string[];
  dailyCompleted: string | null;
  settings?: Settings;
  updatedAt: number;
}

export function slimResult(row: TestResult): TestResult {
  return {
    ...row,
    wpmHistory: [],
    missedWords: (row.missedWords ?? []).slice(0, 12),
    slowWords: [],
  };
}

export function packProgress(state: AppState): CloudProgress {
  const packed: CloudProgress = {
    results: state.results.slice(0, 200).map(slimResult),
    pbs: Object.fromEntries(Object.entries(state.pbs).map(([key, row]) => [key, slimResult(row)])),
    missedWords: state.missedWords.slice(0, 200),
    achievements: [...state.achievements],
    dailyCompleted: state.dailyCompleted,
    settings: state.settings,
    updatedAt: Date.now(),
  };
  return JSON.parse(JSON.stringify(packed)) as CloudProgress;
}

export function mergeResultLists(a: TestResult[], b: TestResult[]) {
  const map = new Map<string, TestResult>();
  for (const row of [...a, ...b]) {
    const prev = map.get(row.id);
    if (!prev) {
      map.set(row.id, row);
      continue;
    }
    const prevChart = prev.wpmHistory?.length ?? 0;
    const nextChart = row.wpmHistory?.length ?? 0;
    map.set(row.id, nextChart > prevChart ? row : prev);
  }
  return [...map.values()].sort((x, y) => y.timestamp - x.timestamp).slice(0, 500);
}

function pbsFromResults(results: TestResult[], extra: Record<string, TestResult>) {
  const pbs: Record<string, TestResult> = { ...extra };
  for (const row of [...results].sort((a, b) => a.timestamp - b.timestamp)) {
    const key = pbKey(row.config);
    if (isPb(row, pbs[key])) pbs[key] = { ...row, isPb: true };
  }
  return pbs;
}

export function mergeProgress(local: AppState, cloud: CloudProgress | null) {
  if (!cloud) {
    return {
      results: local.results,
      pbs: local.pbs,
      missedWords: local.missedWords,
      achievements: local.achievements,
      dailyCompleted: local.dailyCompleted,
      settings: local.settings,
    };
  }
  const results = mergeResultLists(Array.isArray(cloud.results) ? cloud.results : [], local.results);
  const pbs = pbsFromResults(results, { ...(cloud.pbs ?? {}), ...local.pbs });
  const missedWords = [...new Set([...(cloud.missedWords ?? []), ...local.missedWords])].slice(0, 200);
  const achievements = [...new Set([...(cloud.achievements ?? []), ...local.achievements])];
  const dates = [cloud.dailyCompleted, local.dailyCompleted].filter((d): d is string => Boolean(d));
  dates.sort();
  return {
    results,
    pbs,
    missedWords,
    achievements,
    dailyCompleted: dates.at(-1) ?? null,
    settings: local.settings.theme ? local.settings : (cloud.settings ?? DEFAULT_SETTINGS),
  };
}

function configFromMode(mode: BoardMode, isDaily: boolean): TestConfig {
  if (isDaily || mode === "daily") return { ...DEFAULT_CONFIG, mode: "daily" };
  if (mode.startsWith("time-")) {
    const time = Number(mode.slice(5)) as TimeDuration;
    return { ...DEFAULT_CONFIG, mode: "time", time };
  }
  if (mode.startsWith("words-")) {
    const words = Number(mode.slice(6)) as WordCount;
    return { ...DEFAULT_CONFIG, mode: "words", words };
  }
  return { ...DEFAULT_CONFIG };
}

export function resultsFromBoard(userId: string, rows: DbResult[]): TestResult[] {
  return rows
    .filter((row) => row.userId === userId)
    .map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      wpm: row.wpm,
      rawWpm: row.rawWpm,
      accuracy: row.accuracy,
      consistency: row.consistency,
      burst: row.burst,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      missedChars: 0,
      timeMs: row.timeMs,
      config: configFromMode(row.mode, row.isDaily),
      wpmHistory: [],
      missedWords: [],
      slowWords: [],
      isDaily: row.isDaily,
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}
