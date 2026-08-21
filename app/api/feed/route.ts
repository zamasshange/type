import { recentFeed } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ feed: await recentFeed(16) });
}
