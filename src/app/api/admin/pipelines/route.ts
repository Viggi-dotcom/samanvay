/**
 * GET /api/admin/pipelines
 * Returns pipeline run history (Super Admin only).
 */
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canAccessAdmin } from "@/lib/rbac";

export async function GET() {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canAccessAdmin(claims)) return forbidden("Super Admin role required");

  const pipelines = await db.pipelineRun.findMany({ orderBy: { lastRun: "desc" } });

  return Response.json({
    pipelines: pipelines.map((p) => ({
      id: p.id,
      scheme: p.scheme,
      source: p.source,
      schedule: p.schedule,
      status: p.status,
      recordsIngested: p.recordsIngested,
      lastRun: p.lastRun.toISOString(),
      durationSec: p.durationSec,
    })),
  });
}
