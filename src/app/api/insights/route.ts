/**
 * GET /api/insights
 * Returns nightly AI-detected insights:
 *   - Z-score scatter data (utilization_pct vs anomaly_count per district)
 *   - Quadrant classifications (efficient/divergent/stalled/critical)
 *   - Top insights (auto-generated narrative)
 *
 * Mirrors Workflow B from Document 5 (sp_detect_governance_anomalies).
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized } from "@/lib/api/session";

export async function GET(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();

  const url = req.nextUrl;
  const fy = url.searchParams.get("fy") ?? "2025-2026";
  const schemeId = url.searchParams.get("schemeId");

  // Build geo scope
  let geoWhere: any = { level: "DISTRICT" };
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    geoWhere = { level: "DISTRICT", lgdCode: claims.assignedLgdCode };
  }

  const districts = await db.lgdGeography.findMany({ where: geoWhere, orderBy: { name: "asc" } });

  // Compute per-district scatter point: utilization_pct vs anomaly_count
  const points: any[] = [];
  for (const d of districts) {
    const allocs = await db.allocation.findMany({
      where: {
        lgdCode: d.lgdCode,
        financialYear: fy,
        schemeId: schemeId || undefined,
      },
    });
    const released = allocs.reduce((s, a) => s + a.releasedCr, 0);
    const utilized = allocs.reduce((s, a) => s + a.utilizedCr, 0);
    const allocated = allocs.reduce((s, a) => s + a.allocatedCr, 0);
    const utilPct = released > 0 ? (utilized / released) * 100 : 0;

    const anomalies = await db.anomaly.findMany({
      where: { lgdCode: d.lgdCode, status: "OPEN" },
    });
    const anomalyCount = anomalies.length;
    const criticalCount = anomalies.filter((a) => a.severity === "CRITICAL").length;

    // Z-score: how far is utilPct from the cohort mean?
    points.push({
      lgd_code: d.lgdCode,
      district_name: d.name,
      state_name: d.stateName,
      state_lgd: d.stateLgd,
      released,
      utilized,
      allocated,
      util_pct: utilPct,
      anomaly_count: anomalyCount,
      critical_count: criticalCount,
    });
  }

  // Compute z-scores for utilization
  if (points.length > 0) {
    const mean = points.reduce((s, p) => s + p.util_pct, 0) / points.length;
    const variance = points.reduce((s, p) => s + Math.pow(p.util_pct - mean, 2), 0) / points.length;
    const std = Math.sqrt(variance);
    for (const p of points) {
      p.z_score = std > 0 ? (p.util_pct - mean) / std : 0;
      // Quadrant classification
      // X-axis: util_pct (low util = right of plot if inverted; we'll plot low util on LEFT)
      // Y-axis: anomaly_count
      let quadrant: string;
      if (p.util_pct < 50 && p.anomaly_count >= 2) quadrant = "CRITICAL";
      else if (p.util_pct < 50 && p.anomaly_count < 2) quadrant = "UNDERPERFORMING";
      else if (p.util_pct >= 70 && p.anomaly_count === 0) quadrant = "EFFICIENT";
      else if (p.util_pct >= 50 && p.anomaly_count >= 2) quadrant = "DIVERGENT";
      else quadrant = "STABLE";
      p.quadrant = quadrant;
    }
  }

  // Sort by criticality
  const quadrantOrder = { CRITICAL: 0, DIVERGENT: 1, UNDERPERFORMING: 2, STABLE: 3, EFFICIENT: 4 };
  points.sort((a, b) => quadrantOrder[a.quadrant as keyof typeof quadrantOrder] - quadrantOrder[b.quadrant as keyof typeof quadrantOrder]);

  // Generate top insights (auto narrative per quadrant)
  const insights = [];
  const critical = points.filter((p) => p.quadrant === "CRITICAL");
  const efficient = points.filter((p) => p.quadrant === "EFFICIENT");
  const divergent = points.filter((p) => p.quadrant === "DIVERGENT");

  if (critical.length > 0) {
    insights.push({
      id: "ins-critical",
      type: "CRITICAL",
      title: `${critical.length} districts in CRITICAL state`,
      detail: `${critical.slice(0, 3).map((p) => `${p.district_name} (${p.util_pct.toFixed(0)}% util, ${p.anomaly_count} anomalies)`).join(", ")}${critical.length > 3 ? `, +${critical.length - 3} more` : ""}. These districts have low fund utilization AND multiple open anomalies — recommend immediate Block Development Officer audit.`,
      severity: "critical",
      count: critical.length,
    });
  }
  if (divergent.length > 0) {
    insights.push({
      id: "ins-divergent",
      type: "DIVERGENT",
      title: `${divergent.length} districts show DIVERGENT patterns`,
      detail: `${divergent.slice(0, 3).map((p) => `${p.district_name} (${p.util_pct.toFixed(0)}% util, ${p.anomaly_count} anomalies)`).join(", ")}${divergent.length > 3 ? `, +${divergent.length - 3} more` : ""}. Fund flow is acceptable but anomalies indicate reporting or implementation gaps requiring nodal officer review.`,
      severity: "warning",
      count: divergent.length,
    });
  }
  if (efficient.length > 0) {
    insights.push({
      id: "ins-efficient",
      type: "EFFICIENT",
      title: `${efficient.length} districts are EFFICIENT — benchmark candidates`,
      detail: `${efficient.slice(0, 3).map((p) => `${p.district_name} (${p.util_pct.toFixed(0)}% util, 0 anomalies)`).join(", ")}${efficient.length > 3 ? `, +${efficient.length - 3} more` : ""}. These districts demonstrate strong convergence and zero anomalies — suitable as reference benchmarks for cross-state best-practice replication.`,
      severity: "success",
      count: efficient.length,
    });
  }

  return Response.json({
    points,
    insights,
    summary: {
      total: points.length,
      critical: critical.length,
      divergent: divergent.length,
      underperforming: points.filter((p) => p.quadrant === "UNDERPERFORMING").length,
      stable: points.filter((p) => p.quadrant === "STABLE").length,
      efficient: efficient.length,
    },
    scope: { role: claims.role, fy, schemeId, districtLgd: claims.assignedLgdCode },
  });
}
