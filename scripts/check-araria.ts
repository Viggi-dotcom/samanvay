import { db } from "@/lib/db";

async function main() {
  const a = await db.allocation.findMany({ where: { lgdCode: 216, schemeId: "sch-mgnrega", financialYear: "2025-2026" } });
  const g = await db.lgdGeography.findUnique({ where: { lgdCode: 216 } });
  console.log("Araria (LGD 216):", g?.name, "stateLgd:", g?.stateLgd);
  console.log("MGNREGA allocations:", a.length);
  for (const x of a) {
    const util = x.releasedCr > 0 ? (x.utilizedCr / x.releasedCr) * 100 : 0;
    console.log(`  Q${x.quarter}: released=${x.releasedCr.toFixed(1)} utilized=${x.utilizedCr.toFixed(1)} util%=${util.toFixed(1)}`);
  }
  // Test the fallback SQL directly
  const fallbackSql = `SELECT g.name AS district_name, a.allocatedCr AS allocated_cr, a.releasedCr AS released_cr, ROUND((a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) * 100, 2) AS utilization_rate FROM Allocation a JOIN LgdGeography g ON a.lgdCode = g.lgdCode JOIN Scheme s ON a.schemeId = s.id WHERE s.code = 'MGNREGA' AND a.financialYear = '2025-2026' AND g.stateLgd = 10 AND (a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) < 0.50 ORDER BY utilization_rate ASC LIMIT 100;`;
  console.log("\nFallback SQL:", fallbackSql.slice(0, 100) + "...");
  const rows = await db.$queryRawUnsafe(fallbackSql);
  console.log("Fallback rows returned:", rows.length);
  for (const r of rows.slice(0, 3)) {
    console.log("  ", JSON.stringify(r));
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await db.$disconnect(); });
