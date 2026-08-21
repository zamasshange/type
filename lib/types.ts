export type TestMode = "time" | "words" | "quote" | "zen" | "daily" | "practice";
export type TimeDuration = 15 | 30 | 60 | 120;
export type WordCount = 10 | 25 | 50 | 100;
export type LeaderboardScope = "world" | "continent" | "country";

export interface TestConfig {
  mode: TestMode;
  time: TimeDuration;
  words: WordCount;
  punctuation: boolean;
  numbers: boolean;
}

export interface WpmPoint {
  t: number;
  wpm: number;
  raw: number;
  errors: number;
}

export interface KeyStat {
  hits: number;
  misses: number;
  dwell: number;
}

export interface TestResult {
  id: string;
  timestamp: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  burst: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  timeMs: number;
  config: TestConfig;
  wpmHistory: WpmPoint[];
  missedWords: string[];
  slowWords: string[];
  quoteSource?: string;
  isDaily?: boolean;
  isPb?: boolean;
}

export interface Profile {
  username: string;
  countryCode: string;
  createdAt: number;
  onboarded: boolean;
  userId?: string;
  token?: string;
  rating?: number;
}

export interface Settings {
  theme: string;
  sound: boolean;
  smoothCaret: boolean;
  liveWpm: boolean;
  liveAcc: boolean;
  paceCaret: boolean;
  quickRestart: boolean;
  freedomMode: boolean;
  showTimer: boolean;
}

export interface AppState {
  profile: Profile;
  settings: Settings;
  results: TestResult[];
  pbs: Record<string, TestResult>;
  missedWords: string[];
  achievements: string[];
  dailyCompleted: string | null;
}

export const DEFAULT_CONFIG: TestConfig = {
  mode: "time",
  time: 30,
  words: 25,
  punctuation: false,
  numbers: false,
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "haven",
  sound: false,
  smoothCaret: true,
  liveWpm: false,
  liveAcc: false,
  paceCaret: true,
  quickRestart: true,
  freedomMode: false,
  showTimer: true,
};

export const DEFAULT_PROFILE: Profile = {
  username: "guest",
  countryCode: "US",
  createdAt: 0,
  onboarded: false,
};

export const DEFAULT_STATE: AppState = {
  profile: DEFAULT_PROFILE,
  settings: DEFAULT_SETTINGS,
  results: [],
  pbs: {},
  missedWords: [],
  achievements: [],
  dailyCompleted: null,
};
