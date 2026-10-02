/**
 * PATCH /api/anomalies/[anomalyId]
 * Updates anomaly status (ACKNOWLEDGED / RESOLVED).
 * RLS: only super_admin or the DM whose assignedLgdCode matches can update.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canUpdateAnomaly } from "@/lib/rbac";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ anomalyId: string }> }
) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const { anomalyId } = await params;
  const body = await req.json();
  const newStatus = body.status as "ACKNOWLEDGED" | "RESOLVED";

  if (!["ACKNOWLEDGED", "RESOLVED"].includes(newStatus)) {
    return Response.json(
      { error: "Invalid status — only ACKNOWLEDGED or RESOLVED are permitted" },
      { status: 400 }
    );
  }

  const anomaly = await db.anomaly.findUnique({ where: { id: anomalyId } });
  if (!anomaly) {
    return Response.json({ error: "Anomaly not found" }, { status: 404 });
  }

  if (!canUpdateAnomaly(claims, anomaly.lgdCode)) {
    return forbidden(
      "Anomaly updates are limited to super_admin or the District Magistrate assigned to this LGD"
    );
  }

  const updated = await db.anomaly.update({
    where: { id: anomalyId },
    data: { status: newStatus },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.userId,
      action: "ANOMALY_ACK",
      target: anomalyId,
    },
  });

  return Response.json({
    anomaly_id: updated.id,
    status: updated.status,
    updated_at: updated.updatedAt.toISOString(),
  });
}
