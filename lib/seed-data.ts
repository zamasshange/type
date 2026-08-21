import { hashString, mulberry32 } from "./generate";
import { todayKey } from "./daily";
import type { BoardMode } from "./modes";
import { clean, type DbResult, type DbUser } from "./cloud-types";

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

const MODES: BoardMode[] = ["time-15", "time-60", "words-25", "words-50", "daily"];

export function buildSeed() {
  const users: DbUser[] = [];
  const results: DbResult[] = [];
  for (const [name, country] of SEED) {
    const rng = mulberry32(hashString(`seed-${name}-${country}`));
    const id = `seed-${name}-${country}`;
    users.push({
      id,
      username: name,
      countryCode: country,
      token: `seed-${id}`,
      createdAt: Date.now() - Math.floor(rng() * 8.64e7 * 40),
      rating: Math.round(980 + rng() * 700),
      kind: "seed",
    });
    for (const mode of MODES) {
      const scale = mode === "time-15" ? 1.08 : mode === "time-60" ? 0.97 : 1;
      const wpm = Math.round((68 + rng() * 55) * scale * 10) / 10;
      const rowId = `${id}-${mode}`;
      results.push(
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
      );
    }
  }
  return { users, results };
}
