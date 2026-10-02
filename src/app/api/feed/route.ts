/**
 * GET /api/feed
 * Returns the live activity feed (audit log) for the real-time activity stream.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);

  const logs = await db.auditLog.findMany({
    take: limit,
    orderBy: { ts: "desc" },
    include: { user: true },
  });

  return Response.json({
    logs: logs.map((l) => ({
      id: l.id,
      ts: l.ts.toISOString(),
      actor: l.user?.name ?? l.actor,
      actor_email: l.user?.email ?? l.actor,
      actor_role: l.user?.role ?? null,
      action: l.action,
      target: l.target,
    })),
  });
}
