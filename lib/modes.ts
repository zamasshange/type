import type { TestConfig } from "./types";

export type BoardMode =
  | "time-15"
  | "time-30"
  | "time-60"
  | "time-120"
  | "words-10"
  | "words-25"
  | "words-50"
  | "words-100"
  | "daily";

export const BOARD_MODES: { id: BoardMode; label: string; short: string }[] = [
  { id: "time-15", label: "time 15", short: "15" },
  { id: "time-30", label: "time 30", short: "30" },
  { id: "time-60", label: "time 60", short: "60" },
  { id: "time-120", label: "time 120", short: "120" },
  { id: "words-10", label: "words 10", short: "10w" },
  { id: "words-25", label: "words 25", short: "25w" },
  { id: "words-50", label: "words 50", short: "50w" },
  { id: "words-100", label: "words 100", short: "100w" },
  { id: "daily", label: "daily", short: "daily" },
];

export function modeFromConfig(config: TestConfig, isDaily?: boolean): BoardMode | null {
  if (isDaily || config.mode === "daily") return "daily";
  if (config.mode === "time") {
    if (config.time === 15) return "time-15";
    if (config.time === 30) return "time-30";
    if (config.time === 60) return "time-60";
    if (config.time === 120) return "time-120";
  }
  if (config.mode === "words") {
    if (config.words === 10) return "words-10";
    if (config.words === 25) return "words-25";
    if (config.words === 50) return "words-50";
    if (config.words === 100) return "words-100";
  }
  return null;
}

export function rankTitle(rating: number) {
  if (rating >= 1700) return "master";
  if (rating >= 1450) return "platinum";
  if (rating >= 1250) return "gold";
  if (rating >= 1100) return "silver";
  return "bronze";
}

export function ordinal(n: number) {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? "th" : (["th", "st", "nd", "rd"][v % 10] ?? "th");
  return `${n}${suffix}`;
}
