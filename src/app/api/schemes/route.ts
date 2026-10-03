/**
 * GET /api/schemes
 * Returns scheme catalog with aggregated metrics scoped to caller's RLS.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const stateLgd = url.searchParams.get("stateLgd");
  const districtLgd = url.searchParams.get("districtLgd");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  // Build geo filter
  let geoCodes: number[] | null = null;
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoCodes = [claims.assignedLgdCode];
  } else if (districtLgd) {
    geoCodes = [Number(districtLgd)];
  } else if (stateLgd) {
    const geos = await db.lgdGeography.findMany({
      where: { stateLgd: Number(stateLgd) },
      select: { lgdCode: true },
    });
    geoCodes = geos.map((g) => g.lgdCode);
  }

  // dept_nodal: only own ministry schemes
  let schemeWhere: any = { isActive: true };
  if (claims.role === "dept_nodal" && claims.assignedMinistryId) {
    schemeWhere.ministryId = claims.assignedMinistryId;
  }

  const schemes = await db.scheme.findMany({
    where: schemeWhere,
    include: { ministry: true },
    orderBy: { code: "asc" },
  });

  const result = [];
  for (const s of schemes) {
    const allocs = await db.allocation.findMany({
      where: {
        schemeId: s.id,
        lgdCode: geoCodes ? { in: geoCodes } : undefined,
        financialYear: fy,
      },
    });
    const allocated = allocs.reduce((sum, a) => sum + a.allocatedCr, 0);
    const released = allocs.reduce((sum, a) => sum + a.releasedCr, 0);
    const utilized = allocs.reduce((sum, a) => sum + a.utilizedCr, 0);

    const bens = await db.beneficiary.findMany({
      where: {
        schemeId: s.id,
        lgdCode: geoCodes ? { in: geoCodes } : undefined,
      },
    });
    const beneficiaries = bens.reduce((sum, b) => sum + b.beneficiariesTotal, 0);

    result.push({
      scheme_id: s.id,
      ministry_id: s.ministryId,
      scheme_code: s.code,
      scheme_name: s.name,
      scheme_type: s.type,
      launch_date: s.launchDate?.toISOString().slice(0, 10),
      is_active: s.isActive,
      description: s.description,
      color: s.color,
      keyMetrics: JSON.parse(s.keyMetrics),
      ministry: {
        ministry_id: s.ministry.id,
        ministry_code: s.ministry.code,
        ministry_name: s.ministry.name,
        nodal_email: s.ministry.nodalEmail,
      },
      metrics: {
        allocated,
        released,
        utilized,
        utilizationPct: released > 0 ? (utilized / released) * 100 : 0,
        beneficiaries,
      },
    });
  }

  return Response.json({ schemes: result });
}
