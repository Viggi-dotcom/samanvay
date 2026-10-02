/**
 * GET /api/admin/audit
 * Returns audit log entries (Super Admin only).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canAccessAdmin } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const url = req.nextUrl;
  const limit = Number(url.searchParams.get("limit") ?? 50);

  const logs = await db.auditLog.findMany({
    take: limit,
    orderBy: { ts: "desc" },
    include: { user: true },
  });

  return Response.json({
    logs: logs.map((l) => ({
      id: l.id,
      ts: l.ts.toISOString(),
      actor: l.actor,
      action: l.action,
      target: l.target,
      user_name: l.user?.name ?? null,
      user_email: l.user?.email ?? null,
    })),
  });
}
