/**
 * GET  /api/admin/users  — list all provisioned users
 * POST /api/admin/users  — create a new user
 * PATCH/DELETE /api/admin/users/[id]
 *
 * Super Admin only.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canAccessAdmin } from "@/lib/rbac";

export async function GET() {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const users = await db.user.findMany({
    include: { ministry: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      ministry: u.ministry?.name ?? "—",
      ministry_id: u.ministryId,
      lgd_scope:
        u.role === "district_magistrate" && u.assignedLgdCode
          ? `DISTRICT_${u.assignedLgdCode}`
          : u.role === "dept_nodal"
            ? "Ministry-Scoped"
            : u.role === "super_admin"
              ? "Global System"
              : u.role === "auditor"
                ? "Anonymized Pan-India"
                : "Pan-India",
      last_active: u.lastActive?.toISOString() ?? null,
      status: u.status,
    })),
  });
}

export async function POST(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const body = await req.json();
  const { name, email, role, ministryId, assignedLgdCode, password } = body;

  if (!name || !email || !role || !password) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return Response.json({ error: "Email already provisioned" }, { status: 409 });
  }

  const user = await db.user.create({
    data: {
      name,
      email: email.toLowerCase(),
      passwordHash: password, // plaintext demo — bcrypt in real prod
      role,
      ministryId: ministryId || null,
      assignedLgdCode: assignedLgdCode || null,
      status: "ACTIVE",
    },
  });

  // Audit
  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.userId,
      action: "USER_PROVISION",
      target: user.id,
    },
  });

  return Response.json({ user: { id: user.id, email: user.email, role: user.role } }, { status: 201 });
}
