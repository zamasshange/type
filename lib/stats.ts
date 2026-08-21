import type { TestConfig, TestResult, WpmPoint } from "./types";

export function pbKey(config: TestConfig) {
  const extras = [
    config.punctuation ? "punc" : "",
    config.numbers ? "num" : "",
  ]
    .filter(Boolean)
    .join("-");
  const suffix = extras ? `-${extras}` : "";
  if (config.mode === "time") return `time-${config.time}${suffix}`;
  if (config.mode === "words") return `words-${config.words}${suffix}`;
  if (config.mode === "quote") return `quote${suffix}`;
  if (config.mode === "daily") return "daily";
  if (config.mode === "practice") return `practice${suffix}`;
  return `zen${suffix}`;
}

export function formatPbLabel(key: string) {
  return key.replace(/-/g, " ");
}

export function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stddev(values: number[]) {
  if (values.length < 2) return 0;
  const m = mean(values);
  const v = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
  return Math.sqrt(v);
}

export function consistencyFromSeries(history: WpmPoint[]) {
  const samples = history.map((p) => p.wpm).filter((w) => w > 0);
  if (samples.length < 2) return 100;
  const m = mean(samples);
  if (m === 0) return 100;
  return Math.max(0, Math.min(100, 100 - (stddev(samples) / m) * 100));
}

export interface CharTotals {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  spaces: number;
}

export function tallyChars(
  words: string[],
  typed: string[],
  submittedCount: number,
): CharTotals {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  let lastTyped = -1;
  for (let i = typed.length - 1; i >= 0; i--) {
    if (typed[i]?.length) {
      lastTyped = i;
      break;
    }
  }
  const limit = Math.max(submittedCount, lastTyped + 1);

  for (let i = 0; i < words.length && i < limit; i++) {
    const w = words[i];
    const t = typed[i] ?? "";
    if (!t && i >= submittedCount) continue;
    const n = Math.min(w.length, t.length);
    for (let j = 0; j < n; j++) {
      if (t[j] === w[j]) correct += 1;
      else incorrect += 1;
    }
    if (t.length > w.length) extra += t.length - w.length;
    if (i < submittedCount && t.length < w.length) missed += w.length - t.length;
  }

  return { correct, incorrect, extra, missed, spaces: submittedCount };
}

export function wpmFromChars(correctish: number, elapsedMs: number) {
  const minutes = elapsedMs / 60000;
  if (minutes <= 0) return 0;
  return (correctish / 5) / minutes;
}

export function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export function computeLive(
  words: string[],
  typed: string[],
  submittedCount: number,
  elapsedMs: number,
) {
  const t = tallyChars(words, typed, submittedCount);
  const net = wpmFromChars(t.correct + t.spaces, elapsedMs);
  const raw = wpmFromChars(t.correct + t.incorrect + t.extra + t.spaces, elapsedMs);
  const denom = t.correct + t.incorrect + t.extra;
  const acc = denom === 0 ? 100 : (t.correct / denom) * 100;
  return { wpm: round1(net), raw: round1(raw), acc: round1(acc), ...t };
}

export function missedAndSlow(words: string[], typed: string[], submittedCount: number) {
  const missed: string[] = [];
  const slow: string[] = [];
  for (let i = 0; i < submittedCount; i++) {
    const original = words[i].replace(/[^a-zA-Z']/g, "").toLowerCase();
    if (!original) continue;
    const t = typed[i] ?? "";
    if (t !== words[i]) missed.push(original);
  }
  return { missed, slow };
}

export function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isPb(result: TestResult, existing?: TestResult) {
  if (result.config.mode === "zen") return false;
  if (!existing) return result.wpm > 0;
  if (result.wpm !== existing.wpm) return result.wpm > existing.wpm;
  return result.accuracy > existing.accuracy;
}

export function streakFromResults(results: TestResult[]) {
  if (!results.length) return 0;
  const days = new Set(
    results.map((r) => new Date(r.timestamp).toISOString().slice(0, 10)),
  );
  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  let streak = 0;
  const cursor = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  if (!days.has(iso(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (days.has(iso(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function activityMap(results: TestResult[], days = 119) {
  const map = new Map<string, number>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of results) {
    const key = new Date(r.timestamp).toISOString().slice(0, 10);
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}
