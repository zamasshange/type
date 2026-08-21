import type { AppState, TestResult } from "./types";
import { streakFromResults } from "./stats";
import { todayKey } from "./daily";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  check: (state: AppState) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first",
    name: "First steps",
    description: "Complete your first test",
    check: (s) => s.results.length >= 1,
  },
  {
    id: "wpm60",
    name: "Getting fast",
    description: "Hit 60 WPM",
    check: (s) => s.results.some((r) => r.wpm >= 60),
  },
  {
    id: "wpm100",
    name: "Century",
    description: "Hit 100 WPM",
    check: (s) => s.results.some((r) => r.wpm >= 100),
  },
  {
    id: "wpm150",
    name: "Machine",
    description: "Hit 150 WPM",
    check: (s) => s.results.some((r) => r.wpm >= 150),
  },
  {
    id: "acc100",
    name: "Flawless",
    description: "Finish a test at 100% accuracy",
    check: (s) => s.results.some((r) => r.accuracy >= 100 && r.timeMs >= 5000),
  },
  {
    id: "tests10",
    name: "Warming up",
    description: "Finish 10 tests",
    check: (s) => s.results.length >= 10,
  },
  {
    id: "tests50",
    name: "Regular",
    description: "Finish 50 tests",
    check: (s) => s.results.length >= 50,
  },
  {
    id: "tests100",
    name: "Addicted",
    description: "Finish 100 tests",
    check: (s) => s.results.length >= 100,
  },
  {
    id: "streak7",
    name: "Week warrior",
    description: "Maintain a 7-day streak",
    check: (s) => streakFromResults(s.results) >= 7,
  },
  {
    id: "streak30",
    name: "Unstoppable",
    description: "Maintain a 30-day streak",
    check: (s) => streakFromResults(s.results) >= 30,
  },
  {
    id: "daily",
    name: "Daily bread",
    description: "Complete today's challenge",
    check: (s) => s.dailyCompleted === todayKey() || s.results.some((r) => r.isDaily),
  },
  {
    id: "quote",
    name: "Bookworm",
    description: "Complete a quote",
    check: (s) => s.results.some((r) => r.config.mode === "quote"),
  },
  {
    id: "time120",
    name: "Marathon",
    description: "Finish a 120 second test",
    check: (s) => s.results.some((r) => r.config.mode === "time" && r.config.time === 120),
  },
  {
    id: "night",
    name: "Night owl",
    description: "Complete a test between midnight and 5am",
    check: (s) =>
      s.results.some((r) => {
        const h = new Date(r.timestamp).getHours();
        return h < 5;
      }),
  },
  {
    id: "pb3",
    name: "Record breaker",
    description: "Set 3 personal bests",
    check: (s) => Object.keys(s.pbs).length >= 3,
  },
];

export function unlockAchievements(state: AppState) {
  const earned = new Set(state.achievements);
  for (const a of ACHIEVEMENTS) {
    if (!earned.has(a.id) && a.check(state)) earned.add(a.id);
  }
  return [...earned];
}

export function newlyUnlocked(prev: string[], next: string[]) {
  return ACHIEVEMENTS.filter((a) => next.includes(a.id) && !prev.includes(a.id));
}

export function topResult(results: TestResult[]) {
  return results.reduce<TestResult | null>((best, r) => {
    if (!best || r.wpm > best.wpm) return r;
    return best;
  }, null);
}
