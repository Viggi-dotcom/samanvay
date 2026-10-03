import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const validStatuses = ["DRAFT", "ISSUED", "IN_PROGRESS", "COMPLIANCE_RECEIVED", "CLOSED"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: "Invalid status" }, { status: 400 });
  }

  const existing = await db.interventionDirective.findUnique({ where: { id } });
  if (!existing) {
    return Response.json({ error: "Directive not found" }, { status: 404 });
  }

  // District magistrates can only update directives targeting their district
  if (
    claims.role === "district_magistrate" &&
    existing.targetDistrictLgd !== claims.assignedLgdCode
  ) {
    return forbidden("Not authorized to update directives outside your assigned district");
  }

  const updated = await db.interventionDirective.update({
    where: { id },
    data: { status },
  });

  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.email,
      action: `DIRECTIVE_STATUS_${status}`,
      target: existing.refNumber,
    },
  });

  return Response.json({ success: true, directive: updated });
}
