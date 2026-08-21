import type { TestConfig } from "./types";

export type BoardMode = "time-15" | "time-60" | "words-25" | "words-50" | "daily";

export const BOARD_MODES: { id: BoardMode; label: string }[] = [
  { id: "time-15", label: "time 15" },
  { id: "time-60", label: "time 60" },
  { id: "words-25", label: "words 25" },
  { id: "words-50", label: "words 50" },
  { id: "daily", label: "daily" },
];

export function modeFromConfig(config: TestConfig, isDaily?: boolean): BoardMode | null {
  if (isDaily || config.mode === "daily") return "daily";
  if (config.mode === "time" && config.time === 15) return "time-15";
  if (config.mode === "time" && config.time === 60) return "time-60";
  if (config.mode === "words" && config.words === 25) return "words-25";
  if (config.mode === "words" && config.words === 50) return "words-50";
  return null;
}

export function rankTitle(rating: number) {
  if (rating >= 1700) return "master";
  if (rating >= 1450) return "platinum";
  if (rating >= 1250) return "gold";
  if (rating >= 1100) return "silver";
  return "bronze";
}
