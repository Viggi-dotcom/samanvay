/**
 * POST /api/simulator
 * Convergence simulator — what-if scenarios.
 * Input: { fromScheme, toScheme, reallocateCr, targetStateLgd }
 * Output: projected impact on beneficiary coverage + asset completion + anomalies resolved.
 *
 * Mirrors the "Predictive Resource Reallocation Simulator" Could-Have feature from PRD Doc 1.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canExecuteNlQuery } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  // Only executive roles can simulate
  if (!canExecuteNlQuery(claims)) return forbidden("Simulator access requires executive role");

  const body = await req.json();
  const fromSchemeId = body.fromScheme as string;
  const toSchemeId = body.toScheme as string;
  const reallocateCr = Number(body.reallocateCr);
  const targetStateLgd = body.targetStateLgd ? Number(body.targetStateLgd) : null;
  const fy = body.fy ?? "2025-2026";

  if (!fromSchemeId || !toSchemeId || !reallocateCr || reallocateCr <= 0) {
    return Response.json({ error: "Missing required fields: fromScheme, toScheme, reallocateCr (>0)" }, { status: 400 });
  }
  if (fromSchemeId === toSchemeId) {
    return Response.json({ error: "Source and target scheme must differ" }, { status: 400 });
  }
  if (reallocateCr > 1000) {
    return Response.json({ error: "Simulation cap: max ₹1000 Cr per scenario" }, { status: 400 });
  }

  // Get source scheme's underutilized allocations (the funds we'd "free up")
  let geoWhere: any = {};
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoWhere = { lgdCode: claims.assignedLgdCode };
  } else if (targetStateLgd) {
    const geos = await db.lgdGeography.findMany({
      where: { stateLgd: targetStateLgd, level: "DISTRICT" },
      select: { lgdCode: true },
    });
    geoWhere = { lgdCode: { in: geos.map((g) => g.lgdCode) } };
  }

  const fromAllocs = await db.allocation.findMany({
    where: { ...geoWhere, schemeId: fromSchemeId, financialYear: fy },
    include: { geography: true },
  });
  const toAllocs = await db.allocation.findMany({
    where: { ...geoWhere, schemeId: toSchemeId, financialYear: fy },
    include: { geography: true },
  });
  const toBens = await db.beneficiary.findMany({
    where: { ...geoWhere, schemeId: toSchemeId },
  });

  // Identify underutilized funds in source scheme (util < 50%)
  const underutilized = fromAllocs
    .map((a) => ({
      district: a.geography.name,
      lgdCode: a.lgdCode,
      allocated: a.allocatedCr,
      released: a.releasedCr,
      utilized: a.utilizedCr,
      utilPct: a.releasedCr > 0 ? (a.utilizedCr / a.releasedCr) * 100 : 0,
      unusedCr: Math.max(0, a.releasedCr - a.utilizedCr),
    }))
    .filter((d) => d.utilPct < 50 && d.unusedCr > 0)
    .sort((a, b) => b.unusedCr - a.unusedCr);

  // Distribute reallocateCr across target scheme's districts (proportional to existing allocation)
  const totalTargetAllocated = toAllocs.reduce((s, a) => s + a.allocatedCr, 0);

  // Per-unit cost for target scheme (rough estimate):
  // PMAY_G: ₹1.5 lakh per house = ₹0.0015 Cr per unit
  // MGNREGA: ₹200/day × 100 days = ₹20k per person = ₹0.0002 Cr per beneficiary
  // PM_KISAN: ₹6000/year per beneficiary = ₹0.0006 Cr per beneficiary
  const costPerUnitCr: Record<string, number> = {
    "sch-pmayg": 0.0015,
    "sch-mgnrega": 0.0002,
    "sch-pmkisan": 0.0006,
  };
  const unitCost = costPerUnitCr[toSchemeId] ?? 0.001;
  const projectedUnits = Math.floor(reallocateCr / unitCost);

  // Existing baseline for target scheme
  const targetTotalAllocated = toAllocs.reduce((s, a) => s + a.allocatedCr, 0);
  const targetTotalReleased = toAllocs.reduce((s, a) => s + a.releasedCr, 0);
  const targetTotalUtilized = toAllocs.reduce((s, a) => s + a.utilizedCr, 0);
  const targetTotalBeneficiaries = toBens.reduce((s, b) => s + b.beneficiariesTotal, 0);
  const targetTotalAchieved = toBens.reduce((s, b) => s + b.achievedUnits, 0);
  const targetTotalTarget = toBens.reduce((s, b) => s + b.targetUnits, 0);

  // Projected new totals
  const projectedReleased = targetTotalReleased + reallocateCr;
  const projectedUtilized = targetTotalUtilized + reallocateCr * 0.85; // assume 85% utilization of new funds
  const projectedUtilPct = projectedReleased > 0 ? (projectedUtilized / projectedReleased) * 100 : 0;
  const projectedBeneficiaries = targetTotalBeneficiaries + projectedUnits;
  const projectedAchieved = targetTotalAchieved + projectedUnits;
  const projectedAchievementPct = targetTotalTarget > 0 ? (projectedAchieved / (targetTotalTarget + projectedUnits)) * 100 : 0;

  // Anomaly impact: which anomalies might be resolved?
  const targetSchemeAnomalies = await db.anomaly.findMany({
    where: { schemeId: toSchemeId, status: "OPEN" },
  });
  const potentiallyResolved = targetSchemeAnomalies.filter((a) => {
    // Anomalies flagged as UNDERUTILIZATION or STALLING in target scheme's districts
    // could be resolved by additional fund flow
    return a.anomalyType === "UNDERUTILIZATION" || a.anomalyType === "STALLING";
  });

  return Response.json({
    scenario: {
      fromSchemeId,
      toSchemeId,
      reallocateCr,
      targetStateLgd,
      fy,
      simulatedAt: new Date().toISOString(),
      simulatedBy: claims.userId,
    },
    source_scheme: {
      total_allocated: fromAllocs.reduce((s, a) => s + a.allocatedCr, 0),
      total_released: fromAllocs.reduce((s, a) => s + a.releasedCr, 0),
      total_utilized: fromAllocs.reduce((s, a) => s + a.utilizedCr, 0),
      underutilized_districts: underutilized.length,
      unused_cr_available: underutilized.reduce((s, d) => s + d.unusedCr, 0),
      top_underutilized: underutilized.slice(0, 5),
    },
    target_scheme: {
      baseline: {
        allocated: targetTotalAllocated,
        released: targetTotalReleased,
        utilized: targetTotalUtilized,
        utilization_pct: targetTotalReleased > 0 ? (targetTotalUtilized / targetTotalReleased) * 100 : 0,
        beneficiaries: targetTotalBeneficiaries,
        achieved_units: targetTotalAchieved,
        target_units: targetTotalTarget,
        achievement_pct: targetTotalTarget > 0 ? (targetTotalAchieved / targetTotalTarget) * 100 : 0,
      },
      projected: {
        released: projectedReleased,
        utilized: projectedUtilized,
        utilization_pct: projectedUtilPct,
        beneficiaries: projectedBeneficiaries,
        achieved_units: projectedAchieved,
        achievement_pct: projectedAchievementPct,
        additional_units: projectedUnits,
        additional_beneficiaries: projectedUnits,
      },
      delta: {
        utilization_pct: projectedUtilPct - (targetTotalReleased > 0 ? (targetTotalUtilized / targetTotalReleased) * 100 : 0),
        additional_units: projectedUnits,
        additional_beneficiaries: projectedUnits,
      },
    },
    impact: {
      anomalies_potentially_resolved: potentiallyResolved.length,
      affected_anomaly_ids: potentiallyResolved.map((a) => a.id),
      estimated_households_lifted: Math.round(projectedUnits * 4.2), // avg household size
      estimated_districts_impacted: targetStateLgd ? await db.lgdGeography.count({ where: { stateLgd: targetStateLgd, level: "DISTRICT" } }) : 66,
    },
    disclaimer: "Projection assumes 85% utilization of redirected funds and per-unit costs of ₹1.5L/house (PMAY-G), ₹20K/person (MGNREGA), ₹6K/farmer (PM-KISAN). Anomalies flagged as UNDERUTILIZATION or STALLING in target scheme districts are marked as potentially resolvable.",
  });
}
