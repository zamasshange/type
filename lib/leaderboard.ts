import { COUNTRIES, getCountry, type Continent } from "./countries";
import { hashString, mulberry32 } from "./generate";
import type { LeaderboardScope, TestResult } from "./types";
import { todayKey } from "./daily";

export type BoardMode = "time-15" | "time-60" | "words-25" | "words-50" | "daily";

export interface BoardEntry {
  id: string;
  name: string;
  countryCode: string;
  wpm: number;
  accuracy: number;
  timestamp: number;
  you?: boolean;
}

const NAMES = [
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
  ["tundra", "CA"],
  ["lagoon", "ID"],
  ["sahara", "TN"],
  ["aurora", "FI"],
  ["marble", "GR"],
  ["amber", "RO"],
  ["onyx", "AE"],
  ["ivory", "GH"],
  ["stream", "UY"],
  ["peak", "CL"],
  ["grove", "MY"],
  ["dune", "SA"],
  ["reef", "AU"],
  ["flint", "DE"],
  ["haze", "FR"],
  ["bloom", "NL"],
  ["ridge", "CH"],
  ["comet", "KR"],
  ["wisp", "IE"],
  ["falcon", "US"],
  ["lynx", "SE"],
  ["otter", "GB"],
  ["crane", "CN"],
  ["ibis", "EG"],
  ["jaguar", "BR"],
  ["puma", "PE"],
  ["koala", "AU"],
  ["gecko", "ID"],
  ["heron", "VN"],
  ["osprey", "CA"],
  ["tern", "NZ"],
  ["viper", "IN"],
  ["orca", "NO"],
  ["bison", "US"],
  ["elk", "FI"],
  ["mink", "PL"],
  ["dove", "IT"],
  ["wren", "GB"],
  ["lark", "FR"],
];

function modeSeed(mode: BoardMode) {
  if (mode === "time-15") return 1.08;
  if (mode === "time-60") return 0.96;
  if (mode === "words-25") return 1.02;
  if (mode === "words-50") return 0.98;
  return 0.94;
}

export function seededBoard(mode: BoardMode): BoardEntry[] {
  const day = todayKey();
  return NAMES.map(([name, country], i) => {
    const rng = mulberry32(hashString(`${name}-${mode}-${day}`));
    const base = 72 + (NAMES.length - i) * 1.35 + rng() * 18;
    const wpm = Math.round(base * modeSeed(mode) * 10) / 10;
    const accuracy = Math.round((92 + rng() * 7.5) * 10) / 10;
    return {
      id: `bot-${name}-${country}`,
      name,
      countryCode: country,
      wpm,
      accuracy: Math.min(100, accuracy),
      timestamp: Date.now() - Math.floor(rng() * 86400000),
    };
  }).sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy);
}

export function resultToEntry(result: TestResult, username: string, countryCode: string): BoardEntry {
  return {
    id: "you",
    name: username,
    countryCode,
    wpm: result.wpm,
    accuracy: result.accuracy,
    timestamp: result.timestamp,
    you: true,
  };
}

export function modeFromResult(result: TestResult): BoardMode | null {
  const { mode, time, words } = result.config;
  if (result.isDaily || mode === "daily") return "daily";
  if (mode === "time" && time === 15) return "time-15";
  if (mode === "time" && time === 60) return "time-60";
  if (mode === "words" && words === 25) return "words-25";
  if (mode === "words" && words === 50) return "words-50";
  return null;
}

export function bestForMode(results: TestResult[], mode: BoardMode) {
  const matches = results.filter((r) => modeFromResult(r) === mode);
  if (!matches.length) return null;
  return matches.reduce((a, b) => (b.wpm > a.wpm ? b : a));
}

export function mergeBoard(
  mode: BoardMode,
  results: TestResult[],
  username: string,
  countryCode: string,
  scope: LeaderboardScope,
): BoardEntry[] {
  const bots = seededBoard(mode);
  const you = bestForMode(results, mode);
  let entries = bots;
  if (you) {
    entries = [resultToEntry(you, username, countryCode), ...bots.filter((b) => b.id !== "you")];
  }

  const country = getCountry(countryCode);
  if (scope === "country") {
    entries = entries.filter((e) => e.countryCode === countryCode);
  } else if (scope === "continent") {
    entries = entries.filter((e) => getCountry(e.countryCode).continent === country.continent);
  }

  return entries.sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy).slice(0, 50);
}

export function continents(): Continent[] {
  return ["Africa", "Asia", "Europe", "North America", "Oceania", "South America"];
}

export const BOARD_MODES: { id: BoardMode; label: string }[] = [
  { id: "time-15", label: "time 15" },
  { id: "time-60", label: "time 60" },
  { id: "words-25", label: "words 25" },
  { id: "words-50", label: "words 50" },
  { id: "daily", label: "daily" },
];

export { COUNTRIES };
