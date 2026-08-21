import { COUNTRIES, getCountry } from "./countries";
import { todayKey } from "./daily";
import type { BoardMode } from "./modes";
import type { DbResult, DbUser } from "./cloud-types";
import type { BoardRow, FeedItem, NationRow } from "./api";

export function bestsForMode(users: DbUser[], results: DbResult[], mode: BoardMode) {
  const byId = new Map(users.map((u) => [u.id, u]));
  const map = new Map<string, DbResult>();
  for (const row of results) {
    if (row.mode !== mode) continue;
    if (mode === "daily" && row.dailyKey !== todayKey()) continue;
    const prev = map.get(row.userId);
    if (!prev || row.wpm > prev.wpm || (row.wpm === prev.wpm && row.accuracy > prev.accuracy)) {
      map.set(row.userId, row);
    }
  }
  return [...map.values()]
    .map((row) => {
      const user = byId.get(row.userId);
      if (!user) return null;
      return { row, user };
    })
    .filter((x): x is { row: DbResult; user: DbUser } => Boolean(x))
    .sort((a, b) => b.row.wpm - a.row.wpm || b.row.accuracy - a.row.accuracy);
}

export function rankedBoardFrom(
  users: DbUser[],
  results: DbResult[],
  mode: BoardMode,
  scope: "world" | "continent" | "country",
  countryCode: string,
): BoardRow[] {
  const country = getCountry(countryCode);
  let rows = bestsForMode(users, results, mode);
  if (scope === "country") rows = rows.filter((x) => x.user.countryCode === countryCode);
  if (scope === "continent") {
    rows = rows.filter((x) => getCountry(x.user.countryCode).continent === country.continent);
  }
  return rows.slice(0, 50).map((x, i) => ({
    rank: i + 1,
    id: x.user.id,
    name: x.user.username,
    countryCode: x.user.countryCode,
    rating: x.user.rating,
    wpm: x.row.wpm,
    accuracy: x.row.accuracy,
    timestamp: x.row.timestamp,
    kind: x.user.kind,
  }));
}

export function nationsCupFrom(users: DbUser[], results: DbResult[], mode: BoardMode = "time-60"): NationRow[] {
  const bests = bestsForMode(users, results, mode);
  const byCountry = new Map<string, number[]>();
  for (const { row, user } of bests) {
    const list = byCountry.get(user.countryCode) ?? [];
    list.push(row.wpm);
    byCountry.set(user.countryCode, list);
  }
  return COUNTRIES.map((c) => {
    const scores = (byCountry.get(c.code) ?? []).sort((a, b) => b - a).slice(0, 5);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      code: c.code,
      name: c.name,
      continent: c.continent,
      testers: scores.length,
      avgWpm: Math.round(avg * 10) / 10,
    };
  })
    .filter((c) => c.testers > 0)
    .sort((a, b) => b.avgWpm - a.avgWpm)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export function recentFeedFrom(users: DbUser[], results: DbResult[], limit = 12): FeedItem[] {
  const byId = new Map(users.map((u) => [u.id, u]));
  return [...results]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit)
    .map((row) => {
      const user = byId.get(row.userId);
      if (!user) return null;
      return {
        id: row.id,
        name: user.username,
        countryCode: user.countryCode,
        wpm: row.wpm,
        accuracy: row.accuracy,
        mode: row.mode,
        timestamp: row.timestamp,
        kind: user.kind,
      };
    })
    .filter((x): x is FeedItem => Boolean(x));
}

export function userRanksFrom(users: DbUser[], results: DbResult[], userId: string, countryCode: string, mode: BoardMode) {
  const world = bestsForMode(users, results, mode);
  const country = getCountry(countryCode);
  const worldRank = world.findIndex((x) => x.user.id === userId) + 1;
  const continentRank =
    world
      .filter((x) => getCountry(x.user.countryCode).continent === country.continent)
      .findIndex((x) => x.user.id === userId) + 1;
  const countryRank =
    world.filter((x) => x.user.countryCode === countryCode).findIndex((x) => x.user.id === userId) + 1;
  const champ = world.find((x) => x.user.countryCode === countryCode);
  return {
    worldRank: worldRank || null,
    continentRank: continentRank || null,
    countryRank: countryRank || null,
    champWpm: champ?.row.wpm ?? null,
    champName: champ?.user.username ?? null,
  };
}
