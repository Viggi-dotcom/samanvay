/**
 * Samanvay Intelligence — Production Seed Script
 * Populates the Prisma-managed SQLite database with:
 *   - 3 Ministries, 3 Schemes, 24 States, 66 Districts
 *   - 792 quarterly allocation facts
 *   - 66 beneficiary aggregates
 *   - 10 anomalies (with documented extreme values)
 *   - 6 provisioned users (one per RBAC role + 1 extra)
 *   - 4 pipeline runs + 5 audit log entries
 */
import { PrismaClient } from "@prisma/client";
import { PERSONAS, MINISTRIES, SCHEMES, STATES, DISTRICTS } from "../src/lib/seed-data";

const prisma = new PrismaClient();

// Documented extreme-value districts (mirror seed-data.ts EXTREME_DISTRICTS)
const EXTREME: Record<number, { mgnregaUtil: number; pmaygUtil: number; pmkisanUtil: number; pmaygCompletion: number }> = {
  216: { mgnregaUtil: 0.38, pmaygUtil: 0.32, pmkisanUtil: 0.71, pmaygCompletion: 0.28 },
  222: { mgnregaUtil: 0.42, pmaygUtil: 0.36, pmkisanUtil: 0.68, pmaygCompletion: 0.34 },
  230: { mgnregaUtil: 0.47, pmaygUtil: 0.41, pmkisanUtil: 0.55, pmaygCompletion: 0.39 },
  382: { mgnregaUtil: 0.38, pmaygUtil: 0.34, pmkisanUtil: 0.62, pmaygCompletion: 0.31 },
  380: { mgnregaUtil: 0.44, pmaygUtil: 0.40, pmkisanUtil: 0.65, pmaygCompletion: 0.36 },
  381: { mgnregaUtil: 0.51, pmaygUtil: 0.45, pmkisanUtil: 0.69, pmaygCompletion: 0.42 },
  461: { mgnregaUtil: 0.74, pmaygUtil: 0.38, pmkisanUtil: 0.78, pmaygCompletion: 0.36 },
  463: { mgnregaUtil: 0.81, pmaygUtil: 0.39, pmkisanUtil: 0.82, pmaygCompletion: 0.37 },
};

function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

async function main() {
  console.log("🌱 Seeding Samanvay Intelligence database...");

  // Clean slate
  await prisma.auditLog.deleteMany();
  await prisma.nlQueryLog.deleteMany();
  await prisma.pipelineRun.deleteMany();
  await prisma.anomaly.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.allocation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.lgdGeography.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.ministry.deleteMany();
  console.log("  ✓ Cleared existing data");

  // Ministries
  const ministryMap = new Map<string, string>();
  for (const m of MINISTRIES) {
    const created = await prisma.ministry.create({
      data: {
        id: m.ministry_id,
        code: m.ministry_code,
        name: m.ministry_name,
        nodalEmail: m.nodal_email,
      },
    });
    ministryMap.set(m.ministry_id, created.id);
  }
  console.log(`  ✓ Inserted ${MINISTRIES.length} ministries`);

  // Schemes
  const schemeMap = new Map<string, string>();
  for (const s of SCHEMES) {
    const created = await prisma.scheme.create({
      data: {
        id: s.scheme_id,
        ministryId: s.ministry_id,
        code: s.scheme_code,
        name: s.scheme_name,
        type: s.scheme_type,
        launchDate: new Date(s.launch_date),
        isActive: s.is_active,
        description: s.description,
        color: s.color,
        keyMetrics: JSON.stringify(s.keyMetrics),
      },
    });
    schemeMap.set(s.scheme_id, created.id);
  }
  console.log(`  ✓ Inserted ${SCHEMES.length} schemes`);

  // LGD Geography: states then districts
  for (const st of STATES) {
    await prisma.lgdGeography.create({
      data: {
        lgdCode: st.lgd_code,
        level: "STATE",
        name: st.entity_name,
        parentLgd: null,
        stateLgd: st.state_lgd,
        stateName: st.entity_name,
        posX: st.x,
        posY: st.y,
      },
    });
  }
  console.log(`  ✓ Inserted ${STATES.length} states`);

  for (const d of DISTRICTS) {
    await prisma.lgdGeography.create({
      data: {
        lgdCode: d.lgd_code,
        level: "DISTRICT",
        name: d.entity_name,
        parentLgd: d.parent_lgd,
        stateLgd: d.state_lgd,
        stateName: d.stateName,
      },
    });
  }
  console.log(`  ✓ Inserted ${DISTRICTS.length} districts`);

  // Allocations
  const rand = seeded(42);
  const FY = "2025-2026";
  let allocCount = 0;
  for (const d of DISTRICTS) {
    const extreme = EXTREME[d.lgd_code];
    for (const s of SCHEMES) {
      for (let q = 1; q <= 4; q++) {
        const base = (d.lgd_code % 100) * 10 + 50;
        const allocated = Math.round((base + rand() * 80) * 10) / 10;
        const releaseRatio = 0.7 + rand() * 0.25;
        const released = Math.round(allocated * releaseRatio * 10) / 10;
        let utilRatio = 0.4 + rand() * 0.5;
        if (extreme) {
          if (s.scheme_id === "sch-mgnrega") utilRatio = extreme.mgnregaUtil;
          else if (s.scheme_id === "sch-pmayg") utilRatio = extreme.pmaygUtil;
          else if (s.scheme_id === "sch-pmkisan") utilRatio = extreme.pmkisanUtil;
        }
        const utilized = Math.round(released * utilRatio * 10) / 10;
        await prisma.allocation.create({
          data: {
            schemeId: s.scheme_id,
            lgdCode: d.lgd_code,
            financialYear: FY,
            quarter: q,
            allocatedCr: allocated,
            releasedCr: released,
            utilizedCr: utilized,
          },
        });
        allocCount++;
      }
    }
  }
  console.log(`  ✓ Inserted ${allocCount} allocation facts`);

  // Beneficiaries
  const rand2 = seeded(73);
  let benCount = 0;
  for (const d of DISTRICTS) {
    const extreme = EXTREME[d.lgd_code];
    for (const s of SCHEMES) {
      const target = Math.round(1000 + rand2() * 9000);
      let achieveRatio = 0.4 + rand2() * 0.55;
      if (extreme && s.scheme_id === "sch-pmayg") {
        achieveRatio = extreme.pmaygCompletion;
      }
      const achieved = Math.round(target * achieveRatio);
      const ben = Math.round(achieved * (2 + rand2() * 6));
      await prisma.beneficiary.create({
        data: {
          schemeId: s.scheme_id,
          lgdCode: d.lgd_code,
          reportingMonth: new Date("2026-03-01"),
          targetUnits: target,
          achievedUnits: achieved,
          beneficiariesTotal: ben,
          beneficiariesWomen: Math.round(ben * (0.3 + rand2() * 0.2)),
          beneficiariesScSt: Math.round(ben * (0.2 + rand2() * 0.3)),
        },
      });
      benCount++;
    }
  }
  console.log(`  ✓ Inserted ${benCount} beneficiary aggregates`);

  // Anomalies (10 documented)
  const anomalies = [
    { id: "anom-001", schemeId: "sch-pmayg", lgdCode: 463, type: "STALLING", severity: "CRITICAL", zScore: -2.8,
      evidence: { metric: "physical_progress_days", value: 47, threshold: 45, blocks_affected: ["Bansgaon", "Kauriram", "Gagaha"], last_update: "2026-02-12" },
      status: "OPEN", description: "PMAY-G house sanctions in Gorakhpur have registered zero physical progress updates for 47 consecutive days, breaching the 45-day stall threshold." },
    { id: "anom-002", schemeId: null, lgdCode: 216, type: "SCHEME_OVERLAP_GAP", severity: "HIGH", zScore: -2.3,
      evidence: { mgnrega_utilization_pct: 38.2, pmayg_completion_pct: 41.6, interpretation: "High wage demand overlapping with lagging housing completion" },
      status: "OPEN", description: "Araria district exhibits high MGNREGA person-days (top 20th percentile) alongside bottom-20th-percentile PMAY-G completion — a textbook convergence gap." },
    { id: "anom-003", schemeId: "sch-mgnrega", lgdCode: 222, type: "UNDERUTILIZATION", severity: "CRITICAL", zScore: -2.6,
      evidence: { allocated_cr: 84.3, released_cr: 67.4, utilized_cr: 28.0, utilization_pct: 41.6, state_median_pct: 72.4 },
      status: "OPEN", description: "Kishanganj MGNREGA utilization at 41.6% — 2.6 standard deviations below the Bihar state median of 72.4%." },
    { id: "anom-004", schemeId: "sch-pmkisan", lgdCode: 230, type: "REPORTING_DELAY", severity: "MEDIUM", zScore: -1.4,
      evidence: { last_installment_date: "2026-01-08", expected_cycle: "Q3", delay_days: 56 },
      status: "ACKNOWLEDGED", description: "PM-KISAN 19th installment disbursement records for Purnia lag by 56 days against expected Q3 release window." },
    { id: "anom-005", schemeId: "sch-pmayg", lgdCode: 380, type: "UNDERUTILIZATION", severity: "HIGH", zScore: -2.1,
      evidence: { allocated_cr: 102.4, released_cr: 78.9, utilized_cr: 31.5, utilization_pct: 39.9 },
      status: "OPEN", description: "Kalahandi PMAY-G tranche utilization at 39.9% — funds released but geo-tagged milestone verification stalled." },
    { id: "anom-006", schemeId: null, lgdCode: 337, type: "DIVERGENCE", severity: "HIGH", zScore: 2.4,
      evidence: { mgnrega_fund_velocity: 4.1, asset_validation_velocity: 1.0, multiplier: 4.1 },
      status: "OPEN", description: "Jalpaiguri MGNREGA fund utilization is surging 4.1× faster than physical asset validation — possible ghost-works risk." },
    { id: "anom-007", schemeId: "sch-mgnrega", lgdCode: 382, type: "UNDERUTILIZATION", severity: "CRITICAL", zScore: -2.9,
      evidence: { allocated_cr: 91.7, released_cr: 70.2, utilized_cr: 26.4, utilization_pct: 37.6 },
      status: "OPEN", description: "Koraput MGNREGA utilization at 37.6% despite high tribal-belt work demand — release pipeline blockage suspected." },
    { id: "anom-008", schemeId: "sch-pmayg", lgdCode: 461, type: "STALLING", severity: "HIGH", zScore: -2.0,
      evidence: { metric: "physical_progress_days", value: 52, threshold: 45, blocks_affected: ["Harraiya", "Kaptanganj"] },
      status: "OPEN", description: "Basti PMAY-G milestones stalled for 52 days; 2 blocks affected — timber transport embargo reported by BDO Harraiya." },
    { id: "anom-009", schemeId: null, lgdCode: 211, type: "SCHEME_OVERLAP_GAP", severity: "MEDIUM", zScore: -1.8,
      evidence: { pmkisan_beneficiaries: 32140, missing_mgnrega_linkages: 32000, district: "Darbhanga", region: "Mithilanchal" },
      status: "OPEN", description: "32,000 PM-KISAN landholders in Darbhanga missing MGNREGA job card linkages — Bundelkhand-pattern convergence gap." },
    { id: "anom-010", schemeId: "sch-pmkisan", lgdCode: 480, type: "REPORTING_DELAY", severity: "LOW", zScore: -0.9,
      evidence: { delay_days: 11, cycle: "19th installment" },
      status: "RESOLVED", description: "Varanasi PM-KISAN 19th installment reconciliation completed — 11-day reporting lag now closed." },
  ];
  for (const a of anomalies) {
    await prisma.anomaly.create({
      data: {
        id: a.id,
        schemeId: a.schemeId,
        lgdCode: a.lgdCode,
        anomalyType: a.type,
        severity: a.severity,
        zScore: a.zScore,
        evidencePayload: JSON.stringify(a.evidence),
        status: a.status,
        description: a.description,
      },
    });
  }
  console.log(`  ✓ Inserted ${anomalies.length} anomalies`);

  // Users (5 personas + 1 extra)
  const users = [
    { id: "usr_001", name: "Sh. Rajesh Kumar Singh", email: "r.kumar@cabsec.gov.in", password: "demo123", role: "central_executive", ministryId: null, assignedLgdCode: null, status: "ACTIVE" },
    { id: "usr_002", name: "Smt. Anjali Mehta, IAS", email: "anjali.dm-gorakhpur@up.gov.in", password: "demo123", role: "district_magistrate", ministryId: null, assignedLgdCode: 463, status: "ACTIVE" },
    { id: "usr_003", name: "Dr. Vikram Nair", email: "v.nair@mord.gov.in", password: "demo123", role: "dept_nodal", ministryId: "min-mord", assignedLgdCode: null, status: "ACTIVE" },
    { id: "usr_004", name: "Prof. Priya Iyer", email: "p.iyer@cag.gov.in", password: "demo123", role: "auditor", ministryId: null, assignedLgdCode: null, status: "ACTIVE" },
    { id: "usr_005", name: "Sh. Arjun Reddy", email: "arjun.nic@gov.in", password: "demo123", role: "super_admin", ministryId: null, assignedLgdCode: null, status: "ACTIVE" },
    { id: "usr_006", name: "Smt. Lakshmi Pillai", email: "l.pillai@moa.gov.in", password: "demo123", role: "dept_nodal", ministryId: "min-moa", assignedLgdCode: null, status: "SUSPENDED" },
  ];
  for (const u of users) {
    await prisma.user.create({
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        passwordHash: u.password, // plaintext for demo — would bcrypt in real prod
        role: u.role,
        ministryId: u.ministryId,
        assignedLgdCode: u.assignedLgdCode,
        status: u.status,
        lastActive: new Date(),
      },
    });
  }
  console.log(`  ✓ Inserted ${users.length} users`);

  // Pipeline runs
  const pipelines = [
    { id: "pl-2026-03-31-mgnrega", scheme: "MGNREGA", source: "data.gov.in", schedule: "0 2 * * * (Daily 02:00 IST)", status: "SUCCESS", recordsIngested: 12480, lastRun: new Date("2026-03-31T02:00:00Z"), durationSec: 412 },
    { id: "pl-2026-03-31-pmkisan", scheme: "PM-KISAN", source: "data.gov.in", schedule: "0 2 * * * (Daily 02:00 IST)", status: "SUCCESS", recordsIngested: 8421, lastRun: new Date("2026-03-31T02:00:00Z"), durationSec: 308 },
    { id: "pl-2026-03-31-pmayg", scheme: "PMAY-G", source: "data.gov.in", schedule: "0 2 * * * (Daily 02:00 IST)", status: "PARTIAL", recordsIngested: 5210, lastRun: new Date("2026-03-31T02:00:00Z"), durationSec: 720 },
    { id: "anomaly-weekly", scheme: "CROSS_SCHEME", source: "sp_detect_governance_anomalies()", schedule: "0 4 * * 1 (Weekly Mon 04:00 IST)", status: "SUCCESS", recordsIngested: 47, lastRun: new Date("2026-03-31T04:00:00Z"), durationSec: 1240 },
  ];
  for (const p of pipelines) {
    await prisma.pipelineRun.create({
      data: {
        id: p.id,
        scheme: p.scheme,
        source: p.source,
        schedule: p.schedule,
        status: p.status,
        recordsIngested: p.recordsIngested,
        lastRun: p.lastRun,
        durationSec: p.durationSec,
      },
    });
  }
  console.log(`  ✓ Inserted ${pipelines.length} pipeline runs`);

  // Audit log seed entries
  const audits = [
    { actor: "arjun.nic@gov.in", action: "PIPELINE_RETRY", target: "pl-2026-03-31-pmayg", ts: new Date("2026-03-31T15:50:00Z") },
    { actor: "r.kumar@cabsec.gov.in", action: "NL_QUERY_EXEC", target: "qry_99a8b7c6", ts: new Date("2026-03-31T14:22:00Z") },
    { actor: "anjali.dm-gorakhpur@up.gov.in", action: "ANOMALY_ACK", target: "anom-001", ts: new Date("2026-03-31T09:48:00Z") },
    { actor: "v.nair@mord.gov.in", action: "EXPORT_CSV", target: "convergence_matrix_export", ts: new Date("2026-03-30T18:11:00Z") },
    { actor: "p.iyer@cag.gov.in", action: "NL_QUERY_EXEC", target: "qry_b1c2d3e4", ts: new Date("2026-03-30T11:08:00Z") },
  ];
  for (const a of audits) {
    await prisma.auditLog.create({ data: { actor: a.actor, action: a.action, target: a.target, ts: a.ts } });
  }
  console.log(`  ✓ Inserted ${audits.length} audit log entries`);

  console.log("\n✅ Seed complete. Database ready for production use.");
  console.log("\n📋 Demo credentials:");
  console.log("  central_executive  → r.kumar@cabsec.gov.in / demo123");
  console.log("  district_magistrate → anjali.dm-gorakhpur@up.gov.in / demo123");
  console.log("  dept_nodal (MoRD)  → v.nair@mord.gov.in / demo123");
  console.log("  auditor            → p.iyer@cag.gov.in / demo123");
  console.log("  super_admin        → arjun.nic@gov.in / demo123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
