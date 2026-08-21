import { NextRequest } from "next/server";
import { rankedBoard } from "@/lib/server/db";
import type { BoardMode } from "@/lib/modes";
import { BOARD_MODES } from "@/lib/modes";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = (searchParams.get("mode") ?? "time-60") as BoardMode;
  const scope = (searchParams.get("scope") ?? "world") as "world" | "continent" | "country";
  const country = (searchParams.get("country") ?? "US").toUpperCase();
  if (!BOARD_MODES.some((m) => m.id === mode)) {
    return Response.json({ error: "bad mode" }, { status: 400 });
  }
  if (!["world", "continent", "country"].includes(scope)) {
    return Response.json({ error: "bad scope" }, { status: 400 });
  }
  return Response.json({ rows: await rankedBoard(mode, scope, country) });
}
