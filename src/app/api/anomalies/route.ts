/**
 * GET /api/anomalies?status=&severity=&stateLgd=&districtLgd=
 * Returns anomalies scoped to caller's RLS.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const status = url.searchParams.get("status"); // ALL | OPEN | ACKNOWLEDGED | RESOLVED
  const severity = url.searchParams.get("severity"); // ALL | CRITICAL | HIGH | MEDIUM | LOW
  const stateLgd = url.searchParams.get("stateLgd");
  const districtLgdParam = url.searchParams.get("districtLgd");

  // Build geography filter — DM is locked to their LGD
  let geoCodes: number[] | null = null;
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoCodes = [claims.assignedLgdCode];
  } else if (districtLgdParam) {
    geoCodes = [Number(districtLgdParam)];
  } else if (stateLgd) {
    const geos = await db.lgdGeography.findMany({
      where: { stateLgd: Number(stateLgd) },
      select: { lgdCode: true },
    });
    geoCodes = geos.map((g) => g.lgdCode);
  }

  const where: any = {};
  if (geoCodes) where.lgdCode = { in: geoCodes };
  if (status && status !== "ALL") where.status = status;
  if (severity && severity !== "ALL") where.severity = severity;

  const anomalies = await db.anomaly.findMany({
    where,
    include: {
      geography: true,
      scheme: true,
    },
    orderBy: [
      { severity: "asc" }, // CRITICAL first (alphabetical-ish, we'll sort properly)
      { createdAt: "desc" },
    ],
  });

  // Sort by severity: CRITICAL > HIGH > MEDIUM > LOW
  const sevOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...anomalies].sort(
    (a, b) => sevOrder[a.severity as keyof typeof sevOrder] - sevOrder[b.severity as keyof typeof sevOrder]
  );

  return Response.json({
    anomalies: sorted.map((a) => ({
      anomaly_id: a.id,
      scheme_id: a.schemeId,
      scheme_code: a.scheme?.code ?? null,
      scheme_color: a.scheme?.color ?? null,
      lgd_code: a.lgdCode,
      district_name: a.geography?.name ?? "",
      state_name: a.geography?.stateName ?? "",
      anomaly_type: a.anomalyType,
      severity: a.severity,
      z_score: a.zScore,
      evidence_payload: JSON.parse(a.evidencePayload),
      status: a.status,
      description: a.description,
      created_at: a.createdAt.toISOString(),
    })),
  });
}
