/**
 * GET /api/schemes/[schemeId]
 * Returns detailed scheme drilldown: allocations per district, beneficiary demographics, quarterly trend.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ schemeId: string }> }
) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const { schemeId } = await params;
  const url = req.nextUrl;
  const stateLgd = url.searchParams.get("stateLgd");
  const districtLgd = url.searchParams.get("districtLgd");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  const scheme = await db.scheme.findUnique({
    where: { id: schemeId },
    include: { ministry: true },
  });
  if (!scheme) {
    return Response.json({ error: "Scheme not found" }, { status: 404 });
  }

  // Geography filter
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

  const allocs = await db.allocation.findMany({
    where: {
      schemeId,
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
      financialYear: fy,
    },
    include: { geography: true },
  });

  const allocated = allocs.reduce((s, a) => s + a.allocatedCr, 0);
  const released = allocs.reduce((s, a) => s + a.releasedCr, 0);
  const utilized = allocs.reduce((s, a) => s + a.utilizedCr, 0);

  // Quarterly trend
  const quarterly = [1, 2, 3, 4].map((q) => {
    const qa = allocs.filter((a) => a.quarter === q);
    return {
      quarter: `Q${q}`,
      Released: Number(qa.reduce((s, a) => s + a.releasedCr, 0).toFixed(1)),
      Utilized: Number(qa.reduce((s, a) => s + a.utilizedCr, 0).toFixed(1)),
    };
  });

  // Beneficiaries
  const bens = await db.beneficiary.findMany({
    where: {
      schemeId,
      lgdCode: geoCodes ? { in: geoCodes } : undefined,
    },
  });
  const totalBen = bens.reduce((s, b) => s + b.beneficiariesTotal, 0);
  const women = bens.reduce((s, b) => s + b.beneficiariesWomen, 0);
  const scSt = bens.reduce((s, b) => s + b.beneficiariesScSt, 0);

  // Top 10 districts by allocation
  const districtAgg = new Map<number, { released: number; utilized: number; allocated: number }>();
  for (const a of allocs) {
    const cur = districtAgg.get(a.lgdCode) ?? { released: 0, utilized: 0, allocated: 0 };
    cur.released += a.releasedCr;
    cur.utilized += a.utilizedCr;
    cur.allocated += a.allocatedCr;
    districtAgg.set(a.lgdCode, cur);
  }
  const topDistricts = Array.from(districtAgg.entries())
    .map(([lgdCode, agg]) => {
      const geo = allocs.find((a) => a.lgdCode === lgdCode)?.geography;
      return {
        lgdCode,
        name: geo?.name ?? "",
        stateName: geo?.stateName ?? "",
        allocated: Number(agg.allocated.toFixed(1)),
        released: Number(agg.released.toFixed(1)),
        utilized: Number(agg.utilized.toFixed(1)),
        utilPct: agg.released > 0 ? (agg.utilized / agg.released) * 100 : 0,
      };
    })
    .sort((a, b) => b.released - a.released)
    .slice(0, 10);

  return Response.json({
    scheme: {
      scheme_id: scheme.id,
      ministry_id: scheme.ministryId,
      scheme_code: scheme.code,
      scheme_name: scheme.name,
      scheme_type: scheme.type,
      launch_date: scheme.launchDate?.toISOString().slice(0, 10),
      is_active: scheme.isActive,
      description: scheme.description,
      color: scheme.color,
      keyMetrics: JSON.parse(scheme.keyMetrics),
      ministry: {
        ministry_id: scheme.ministry.id,
        ministry_code: scheme.ministry.code,
        ministry_name: scheme.ministry.name,
        nodal_email: scheme.ministry.nodalEmail,
      },
    },
    kpis: {
      allocated,
      released,
      utilized,
      utilizationPct: released > 0 ? (utilized / released) * 100 : 0,
      beneficiaries: totalBen,
      womenPct: totalBen > 0 ? (women / totalBen) * 100 : 0,
      scStPct: totalBen > 0 ? (scSt / totalBen) * 100 : 0,
    },
    quarterly,
    topDistricts,
  });
}
