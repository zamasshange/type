import { NextRequest } from "next/server";
import { nationsCup } from "@/lib/server/db";
import type { BoardMode } from "@/lib/modes";
import { BOARD_MODES } from "@/lib/modes";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const mode = (req.nextUrl.searchParams.get("mode") ?? "time-60") as BoardMode;
  if (!BOARD_MODES.some((m) => m.id === mode)) {
    return Response.json({ error: "bad mode" }, { status: 400 });
  }
  return Response.json({ nations: await nationsCup(mode) });
}
