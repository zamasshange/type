import { NextRequest } from "next/server";
import {
  addResult,
  applyRating,
  findUserByToken,
  nationsCup,
  uid,
  updateUser,
  userRanks,
} from "@/lib/server/db";
import { modeFromConfig } from "@/lib/modes";
import { todayKey } from "@/lib/daily";
import type { TestConfig } from "@/lib/types";

export const runtime = "nodejs";

function tokenOf(req: NextRequest) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  const user = await findUserByToken(tokenOf(req));
  if (!user) return Response.json({ error: "sign in first" }, { status: 401 });

  const body = (await req.json()) as {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    consistency: number;
    burst: number;
    timeMs: number;
    config: TestConfig;
    isDaily?: boolean;
  };

  const wpm = Number(body.wpm);
  const accuracy = Number(body.accuracy);
  if (!Number.isFinite(wpm) || wpm < 0 || wpm > 400) {
    return Response.json({ error: "invalid wpm" }, { status: 400 });
  }
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) {
    return Response.json({ error: "invalid accuracy" }, { status: 400 });
  }

  const mode = modeFromConfig(body.config, body.isDaily);
  if (!mode) {
    return Response.json({
      skipped: true,
      reason: "mode is not ranked (try a timed or words test, or daily)",
    });
  }

  const delta = applyRating(user, wpm, accuracy);
  await addResult({
    id: uid("res"),
    userId: user.id,
    wpm: Math.round(wpm * 10) / 10,
    rawWpm: Math.round(Number(body.rawWpm || wpm) * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    consistency: Math.round(Number(body.consistency || 0) * 10) / 10,
    burst: Math.round(Number(body.burst || wpm)),
    timeMs: Math.max(1, Number(body.timeMs) || 1),
    mode,
    timestamp: Date.now(),
    isDaily: mode === "daily",
    dailyKey: mode === "daily" ? todayKey() : undefined,
  });
  await updateUser(user.id, { rating: user.rating });

  const ranks = await userRanks(user.id, user.countryCode, mode);
  const nations = await nationsCup(mode);
  const nation = nations.find((n) => n.code === user.countryCode);

  return Response.json({
    rating: user.rating,
    delta,
    worldRank: ranks.worldRank,
    continentRank: ranks.continentRank,
    countryRank: ranks.countryRank,
    champWpm: ranks.champWpm,
    champName: ranks.champName,
    nationsRank: nation?.rank ?? null,
  });
}
