import { NextRequest } from "next/server";
import { createUser, findUserByToken, uid, updateUser, usernameTaken } from "@/lib/server/db";

export const runtime = "nodejs";

function tokenOf(req: NextRequest) {
  const h = req.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7) : null;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { username?: string; countryCode?: string };
  const username = (body.username ?? "guest").trim().slice(0, 16) || "guest";
  const countryCode = (body.countryCode ?? "US").toUpperCase();
  const taken = await usernameTaken(username);
  const finalName = taken ? `${username}${Math.floor(Math.random() * 90 + 10)}` : username;
  const user = {
    id: uid("usr"),
    username: finalName,
    countryCode,
    token: uid("tok"),
    createdAt: Date.now(),
    rating: 1000,
    kind: "user" as const,
  };
  await createUser(user);
  return Response.json({
    id: user.id,
    username: user.username,
    countryCode: user.countryCode,
    token: user.token,
    rating: user.rating,
    createdAt: user.createdAt,
  });
}

export async function PATCH(req: NextRequest) {
  const user = await findUserByToken(tokenOf(req));
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json()) as { username?: string; countryCode?: string };
  const patch = {
    username: body.username ? body.username.trim().slice(0, 16) || user.username : user.username,
    countryCode: body.countryCode ? body.countryCode.toUpperCase() : user.countryCode,
  };
  await updateUser(user.id, patch);
  return Response.json({
    id: user.id,
    username: patch.username,
    countryCode: patch.countryCode,
    rating: user.rating,
  });
}
