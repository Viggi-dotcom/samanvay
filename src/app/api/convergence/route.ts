/**
 * GET /api/convergence?stateLgd=&schemeId=
 * Returns the full bivariate convergence matrix in a single payload:
 * per-district MGNREGA util % × PMAY-G completion %, with computed flags.
 *
 * RLS: District Magistrates get only their own district row;
 *      Dept Nodal gets all districts (their ministry filter is applied
 *      on the client side since the matrix is cross-scheme).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

type CellFlag = "OVERLAP_HIGH" | "GAP" | "MIXED" | "STABLE";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const stateLgdParam = url.searchParams.get("stateLgd");
  const fy = url.searchParams.get("fy") ?? "2025-2026";

  // Determine geography scope
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

  const rows = [];
  for (const d of districts) {
    const allocs = await db.allocation.findMany({
      where: { lgdCode: d.lgdCode, financialYear: fy },
    });
    const mgnregaA = allocs.filter((a) => a.schemeId === "sch-mgnrega");
    const pmkisanA = allocs.filter((a) => a.schemeId === "sch-pmkisan");
    const pmaygA = allocs.filter((a) => a.schemeId === "sch-pmayg");

    const mgnregaReleased = mgnregaA.reduce((s, a) => s + a.releasedCr, 0);
    const mgnregaUtilized = mgnregaA.reduce((s, a) => s + a.utilizedCr, 0);
    const mgnregaAllocated = mgnregaA.reduce((s, a) => s + a.allocatedCr, 0);
    const mgnregaUtil = mgnregaReleased > 0 ? (mgnregaUtilized / mgnregaReleased) * 100 : 0;

    const pmkisanReleased = pmkisanA.reduce((s, a) => s + a.releasedCr, 0);
    const pmkisanUtil = pmkisanReleased > 0
      ? (pmkisanA.reduce((s, a) => s + a.utilizedCr, 0) / pmkisanReleased) * 100
      : 0;

    const pmaygReleased = pmaygA.reduce((s, a) => s + a.releasedCr, 0);
    const pmaygUtil = pmaygReleased > 0
      ? (pmaygA.reduce((s, a) => s + a.utilizedCr, 0) / pmaygReleased) * 100
      : 0;

    // PMAY-G completion = achieved / target
    const pmaygBen = await db.beneficiary.findFirst({
      where: { lgdCode: d.lgdCode, schemeId: "sch-pmayg" },
    });
    const pmaygCompletion = pmaygBen && pmaygBen.targetUnits > 0
      ? (pmaygBen.achievedUnits / pmaygBen.targetUnits) * 100
      : 0;

    let flag: CellFlag = "STABLE";
    if (mgnregaUtil >= 70 && pmaygCompletion < 40) flag = "OVERLAP_HIGH";
    else if (mgnregaUtil < 40 && pmaygCompletion < 40) flag = "GAP";
    else if (mgnregaUtil >= 70 && pmaygCompletion >= 70) flag = "STABLE";
    else flag = "MIXED";

    const deviationScore = Math.abs(mgnregaUtil - pmaygCompletion);

    rows.push({
      lgd_code: d.lgdCode,
      entity_name: d.name,
      state_lgd: d.stateLgd,
      state_name: d.stateName,
      mgnrega_util: mgnregaUtil,
      mgnrega_released: mgnregaReleased,
      mgnrega_allocated: mgnregaAllocated,
      pmkisan_util: pmkisanUtil,
      pmayg_util: pmaygUtil,
      pmayg_completion: pmaygCompletion,
      flag,
      deviation_score: deviationScore,
    });
  }

  rows.sort((a, b) => b.deviation_score - a.deviation_score);

  return Response.json({
    rows,
    summary: {
      total: rows.length,
      overlap_high: rows.filter((r) => r.flag === "OVERLAP_HIGH").length,
      gap: rows.filter((r) => r.flag === "GAP").length,
      stable: rows.filter((r) => r.flag === "STABLE").length,
      mixed: rows.filter((r) => r.flag === "MIXED").length,
    },
    scope: {
      role: claims.role,
      stateLgd: stateLgdParam ? Number(stateLgdParam) : null,
      districtLgd: claims.role === "district_magistrate" ? claims.assignedLgdCode : null,
      fy,
    },
  });
}
