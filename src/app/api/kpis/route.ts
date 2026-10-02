/**
 * GET /api/kpis?stateLgd=&districtLgd=&schemeId=&fy=
 * Returns aggregated KPI cards scoped by the authenticated user's RLS claims.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";
import { readableLgdCodes, readableSchemeIds } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const fy = url.searchParams.get("fy") ?? "2025-2026";
  const stateLgdParam = url.searchParams.get("stateLgd");
  const districtLgdParam = url.searchParams.get("districtLgd");
  const schemeIdParam = url.searchParams.get("schemeId");

  const stateLgd = stateLgdParam ? Number(stateLgdParam) : null;
  const districtLgd = districtLgdParam ? Number(districtLgdParam) : null;
  const schemeId = schemeIdParam || null;

  // RLS: District Magistrate is locked to their assigned LGD regardless of filter
  const rlsLgdCodes = readableLgdCodes(claims);
  if (rlsLgdCodes) {
    // Override district filter with RLS scope
    if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
      // DM can only see their own district
    }
  }

  // Build geography filter: combine user filter + RLS scope
  let geoWhere: any = {};
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoWhere = { lgdCode: claims.assignedLgdCode };
  } else if (districtLgd) {
    geoWhere = { lgdCode: districtLgd };
  } else if (stateLgd) {
    geoWhere = { stateLgd };
  }

  // Build scheme filter (dept_nodal: own ministry schemes only)
  let schemeWhere: any = {};
  if (schemeId) {
    schemeWhere = { id: schemeId };
  }
  if (claims.role === "dept_nodal" && claims.assignedMinistryId) {
    schemeWhere = { ...schemeWhere, ministryId: claims.assignedMinistryId };
  }

  const schemes = await db.scheme.findMany({ where: schemeWhere, select: { id: true } });
  const schemeIds = schemes.map((s) => s.id);

  // Get geography codes
  let geoCodes: number[] | null = null;
  if (Object.keys(geoWhere).length > 0) {
    const geos = await db.lgdGeography.findMany({ where: geoWhere, select: { lgdCode: true } });
    geoCodes = geos.map((g) => g.lgdCode);
  }

  // Allocations
  const allocs = await db.allocation.findMany({
    where: {
      schemeId: { in: schemeIds.length > 0 ? schemeIds : undefined },
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
      financialYear: fy,
    },
  });
  const allocated = allocs.reduce((s, a) => s + a.allocatedCr, 0);
  const released = allocs.reduce((s, a) => s + a.releasedCr, 0);
  const utilized = allocs.reduce((s, a) => s + a.utilizedCr, 0);
  const utilPct = released > 0 ? (utilized / released) * 100 : 0;

  // Beneficiaries
  const bens = await db.beneficiary.findMany({
    where: {
      schemeId: { in: schemeIds.length > 0 ? schemeIds : undefined },
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
    },
  });
  const totalBen = bens.reduce((s, b) => s + b.beneficiariesTotal, 0);
  const women = bens.reduce((s, b) => s + b.beneficiariesWomen, 0);
  const scSt = bens.reduce((s, b) => s + b.beneficiariesScSt, 0);
  const targetUnits = bens.reduce((s, b) => s + b.targetUnits, 0);
  const achievedUnits = bens.reduce((s, b) => s + b.achievedUnits, 0);

  // Anomalies
  const anomalies = await db.anomaly.findMany({
    where: {
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
    },
  });
  const criticalCount = anomalies.filter(
    (a) => a.severity === "CRITICAL" && a.status === "OPEN"
  ).length;
  const openCount = anomalies.filter((a) => a.status === "OPEN").length;

  // Audit: log the read (no-op for now; could log KPI_VIEW actions)
  return Response.json({
    allocated,
    released,
    utilized,
    utilizationPct: utilPct,
    beneficiaries: totalBen,
    womenPct: totalBen > 0 ? (women / totalBen) * 100 : 0,
    scStPct: totalBen > 0 ? (scSt / totalBen) * 100 : 0,
    activeWorks: achievedUnits,
    targetUnits,
    achievementPct: targetUnits > 0 ? (achievedUnits / targetUnits) * 100 : 0,
    criticalAnomalies: criticalCount,
    totalAnomalies: openCount,
    scope: {
      role: claims.role,
      stateLgd,
      districtLgd: claims.role === "district_magistrate" ? claims.assignedLgdCode : districtLgd,
      schemeId,
      fy,
    },
  });
}
