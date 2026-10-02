/**
 * PATCH  /api/admin/users/[userId]  — update role / scope / status
 * DELETE /api/admin/users/[userId]  — deprovision (suspend)
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canAccessAdmin } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const { userId } = await params;
  const body = await req.json();
  const allowed = ["role", "ministryId", "assignedLgdCode", "status", "name"];
  const data: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) data[k] = body[k];
  }

  const updated = await db.user.update({ where: { id: userId }, data });
  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.userId,
      action: "USER_UPDATE",
      target: userId,
    },
  });
  return Response.json({ user: { id: updated.id, email: updated.email, role: updated.role, status: updated.status } });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const { userId } = await params;
  await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.userId,
      action: "USER_SUSPEND",
      target: userId,
    },
  });
  return Response.json({ ok: true });
}
