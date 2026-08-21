import { NextRequest } from "next/server";
import { findUserByToken, nationsCup, userRanks } from "@/lib/server/db";
import type { BoardMode } from "@/lib/modes";

export const runtime = "nodejs";

function tokenOf(req: NextRequest) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function GET(req: NextRequest) {
  const mode = (req.nextUrl.searchParams.get("mode") ?? "time-60") as BoardMode;
  const countryParam = req.nextUrl.searchParams.get("country");
  const user = await findUserByToken(tokenOf(req));
  const country = (countryParam || user?.countryCode || "US").toUpperCase();
  const ranks = await userRanks(user?.id ?? "__none__", country, mode);
  const nations = await nationsCup(mode);
  const nation = nations.find((n) => n.code === country);
  return Response.json({
    worldRank: user ? ranks.worldRank : null,
    continentRank: user ? ranks.continentRank : null,
    countryRank: user ? ranks.countryRank : null,
    champWpm: ranks.champWpm,
    champName: ranks.champName,
    nationsRank: nation?.rank ?? null,
    nationAvg: nation?.avgWpm ?? null,
    rating: user?.rating ?? 1000,
  });
}
