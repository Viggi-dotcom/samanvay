/**
 * GET /api/geo?level=national|state|district&stateLgd=&schemeId=
 * Returns choropleth data: per-LGD utilization metrics for map rendering.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const level = url.searchParams.get("level") ?? "national";
  const stateLgdParam = url.searchParams.get("stateLgd");
  const schemeId = url.searchParams.get("schemeId");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  if (level === "national") {
    // Per-state aggregates
    const states = await db.lgdGeography.findMany({
      where: { level: "STATE" },
      orderBy: { name: "asc" },
    });
    const result = [];
    for (const s of states) {
      const districts = await db.lgdGeography.findMany({
        where: { stateLgd: s.lgdCode, level: "DISTRICT" },
        select: { lgdCode: true },
      });
      if (districts.length === 0) continue;
      const lgdCodes = districts.map((d) => d.lgdCode);

      const allocs = await db.allocation.findMany({
        where: {
          lgdCode: { in: lgdCodes },
          schemeId: schemeId || undefined,
          financialYear: fy,
        },
      });
      const released = allocs.reduce((sum, a) => sum + a.releasedCr, 0);
      const utilized = allocs.reduce((sum, a) => sum + a.utilizedCr, 0);
      const allocated = allocs.reduce((sum, a) => sum + a.allocatedCr, 0);
      const util = released > 0 ? (utilized / released) * 100 : 0;

      result.push({
        lgd_code: s.lgdCode,
        entity_name: s.name,
        state_lgd: s.stateLgd,
        pos_x: s.posX,
        pos_y: s.posY,
        metrics: { released, utilized, allocated, util },
      });
    }
    return Response.json({ level: "national", states: result });
  }

  if (level === "state") {
    const stateLgd = stateLgdParam ? Number(stateLgdParam) : null;
    if (!stateLgd) {
      return Response.json({ error: "stateLgd parameter required" }, { status: 400 });
    }
    // RLS: DM cannot view other states' drilldown
    if (
      claims.role === "district_magistrate" &&
      claims.assignedLgdCode
    ) {
      const dmDistrict = await db.lgdGeography.findUnique({
        where: { lgdCode: claims.assignedLgdCode },
      });
      if (dmDistrict?.stateLgd !== stateLgd) {
        return Response.json({ error: "Forbidden — outside your assigned LGD scope" }, { status: 403 });
      }
    }

    const state = await db.lgdGeography.findUnique({ where: { lgdCode: stateLgd } });
    if (!state) return Response.json({ error: "State not found" }, { status: 404 });

    const districts = await db.lgdGeography.findMany({
      where: { stateLgd, level: "DISTRICT" },
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
    return Response.json({ level: "state", state, districts: result });
  }

  return Response.json({ error: "Unsupported level" }, { status: 400 });
}
