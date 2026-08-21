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

function inScope(user: DbUser, scope: "world" | "continent" | "country", countryCode: string) {
  if (scope === "country") return user.countryCode === countryCode;
  if (scope === "continent") return getCountry(user.countryCode).continent === getCountry(countryCode).continent;
  return true;
}

export function rankedBoardFrom(
  users: DbUser[],
  results: DbResult[],
  mode: BoardMode,
  scope: "world" | "continent" | "country",
  countryCode: string,
): BoardRow[] {
  const realUsers = users.filter((u) => u.kind === "user");
  const realIds = new Set(realUsers.map((u) => u.id));
  const realResults = results.filter((r) => realIds.has(r.userId));
  let rows = bestsForMode(realUsers, realResults, mode).filter((x) => inScope(x.user, scope, countryCode));
  const scored = new Set(rows.map((x) => x.user.id));
  const waiting = realUsers
    .filter((u) => !scored.has(u.id) && inScope(u, scope, countryCode))
    .sort((a, b) => b.rating - a.rating || a.username.localeCompare(b.username));
  const listed: BoardRow[] = rows.map((x, i) => ({
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
  for (const user of waiting) {
    listed.push({
      rank: listed.length + 1,
      id: user.id,
      name: user.username,
      countryCode: user.countryCode,
      rating: user.rating,
      wpm: 0,
      accuracy: 0,
      timestamp: user.createdAt,
      kind: user.kind,
    });
  }
  return listed.slice(0, 50);
}

export function nationsCupFrom(users: DbUser[], results: DbResult[], mode: BoardMode = "time-60"): NationRow[] {
  const realUsers = users.filter((u) => u.kind === "user");
  const realIds = new Set(realUsers.map((u) => u.id));
  const bests = bestsForMode(realUsers, results.filter((r) => realIds.has(r.userId)), mode);
  const byCountry = new Map<string, number[]>();
  for (const { row, user } of bests) {
    const list = byCountry.get(user.countryCode) ?? [];
    list.push(row.wpm);
    byCountry.set(user.countryCode, list);
  }
  const registered = new Map<string, number>();
  for (const user of realUsers) {
    registered.set(user.countryCode, (registered.get(user.countryCode) ?? 0) + 1);
  }
  return COUNTRIES.map((c) => {
    const scores = (byCountry.get(c.code) ?? []).sort((a, b) => b - a).slice(0, 5);
    const testers = Math.max(scores.length, registered.get(c.code) ?? 0);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      code: c.code,
      name: c.name,
      continent: c.continent,
      testers,
      avgWpm: Math.round(avg * 10) / 10,
    };
  })
    .filter((c) => c.testers > 0)
    .sort((a, b) => b.avgWpm - a.avgWpm || b.testers - a.testers)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

export function recentFeedFrom(users: DbUser[], results: DbResult[], limit = 12): FeedItem[] {
  const byId = new Map(users.filter((u) => u.kind === "user").map((u) => [u.id, u]));
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
  const world = rankedBoardFrom(users, results, mode, "world", countryCode);
  const continent = rankedBoardFrom(users, results, mode, "continent", countryCode);
  const national = rankedBoardFrom(users, results, mode, "country", countryCode);
  const champ = world.find((r) => r.countryCode === countryCode && r.wpm > 0);
  const worldRank = world.findIndex((x) => x.id === userId) + 1;
  const continentRank = continent.findIndex((x) => x.id === userId) + 1;
  const countryRank = national.findIndex((x) => x.id === userId) + 1;
  return {
    worldRank: worldRank || null,
    continentRank: continentRank || null,
    countryRank: countryRank || null,
    champWpm: champ?.wpm ?? null,
    champName: champ?.name ?? null,
  };
}
