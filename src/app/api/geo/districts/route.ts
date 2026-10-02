/**
 * GET /api/geo/districts?stateLgd=&schemeId=&fy=
 * Returns all districts within a state (or all states if no state filter)
 * with per-district utilization metrics for the choropleth tile view.
 *
 * RLS: DM is locked to their assigned district.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const stateLgdParam = url.searchParams.get("stateLgd");
  const schemeId = url.searchParams.get("schemeId");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  let geoWhere: any = { level: "DISTRICT" };
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoWhere = { level: "DISTRICT", lgdCode: claims.assignedLgdCode };
  } else if (stateLgdParam) {
    geoWhere = { level: "DISTRICT", stateLgd: Number(stateLgdParam) };
  }

  const districts = await db.lgdGeography.findMany({
    where: geoWhere,
    orderBy: { name: "asc" },
  });

  const result = [];
  for (const d of districts) {
    const allocs = await db.allocation.findMany({
      where: {
        lgdCode: d.lgdCode,
        schemeId: schemeId || undefined,
        financialYear: fy,
      },
    });
    const released = allocs.reduce((s, a) => s + a.releasedCr, 0);
    const utilized = allocs.reduce((s, a) => s + a.utilizedCr, 0);
    const allocated = allocs.reduce((s, a) => s + a.allocatedCr, 0);
    result.push({
      lgd_code: d.lgdCode,
      entity_name: d.name,
      state_lgd: d.stateLgd,
      state_name: d.stateName,
      metrics: {
        released,
        utilized,
        allocated,
        util: released > 0 ? (utilized / released) * 100 : 0,
      },
    });
  }

  return Response.json({ districts: result });
}
