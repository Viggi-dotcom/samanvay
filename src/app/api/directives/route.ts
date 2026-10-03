import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canExecuteNlQuery } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const stateLgd = url.searchParams.get("stateLgd");
  const districtLgd = url.searchParams.get("districtLgd");

  let where: any = {};
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    where.targetDistrictLgd = claims.assignedLgdCode;
  } else {
    if (districtLgd) where.targetDistrictLgd = Number(districtLgd);
    else if (stateLgd) where.targetStateLgd = Number(stateLgd);
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const directives = await db.interventionDirective.findMany({
    where,
    orderBy: { issuedAt: "desc" },
  });

  const parsed = directives.map((d) => ({
    ...d,
    directives: JSON.parse(d.directives),
  }));

  const stats = {
    total: directives.length,
    critical: directives.filter((d) => d.priority === "CRITICAL").length,
    issued: directives.filter((d) => d.status === "ISSUED").length,
    inProgress: directives.filter((d) => d.status === "IN_PROGRESS").length,
    complianceReceived: directives.filter((d) => d.status === "COMPLIANCE_RECEIVED" || d.status === "CLOSED").length,
  };

  return Response.json({ directives: parsed, stats });
}

export async function POST(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  // Any non-auditor executive role can issue or propose directives
  if (claims.role === "auditor") {
    return forbidden("Auditors have read-only access to directives");
  }

  const body = await req.json();
  const {
    title,
    targetStateLgd,
    stateName,
    targetDistrictLgd,
    districtName,
    targetMinistries,
    participatingOfficers,
    triggerAnomalyId,
    evidenceSummary,
    directives,
    priority = "HIGH",
    deadlineDays = 30,
  } = body;

  if (!title || !targetStateLgd || !evidenceSummary || !directives) {
    return Response.json({ error: "Missing required fields for directive" }, { status: 400 });
  }

  const refNumber = `OM/CABSEC/CONV/2026/${Math.floor(100 + Math.random() * 900)}`;

  const created = await db.interventionDirective.create({
    data: {
      refNumber,
      title,
      targetStateLgd: Number(targetStateLgd),
      stateName,
      targetDistrictLgd: targetDistrictLgd ? Number(targetDistrictLgd) : null,
      districtName: districtName ?? null,
      targetMinistries: targetMinistries ?? "Ministry of Rural Development, Ministry of Agriculture & Farmers Welfare",
      participatingOfficers: participatingOfficers ?? `${claims.name} (${claims.role})`,
      triggerAnomalyId: triggerAnomalyId ?? null,
      evidenceSummary,
      directives: typeof directives === "string" ? directives : JSON.stringify(directives),
      status: "ISSUED",
      priority,
      issuedByRole: claims.role,
      issuedByEmail: claims.email,
      deadlineDays: Number(deadlineDays),
    },
  });

  // Audit trail
  await db.auditLog.create({
    data: {
      userId: claims.userId,
      actor: claims.email,
      action: "DIRECTIVE_ISSUED",
      target: refNumber,
    },
  });

  return Response.json({ success: true, directive: created }, { status: 201 });
}
