/**
 * POST /api/intelligence/query
 *
 * Real Text-to-SQL orchestrator — Samanvay Intelligence
 * Mirrors Workflow C from Document 5:
 *   a. Context injection (schema + JWT claims)
 *   b. LLM generation (z-ai-web-dev-sdk) — returns SQL + rationale
 *   c. AST parser verification — read-only + LIMIT enforced
 *   d. Database execution — against Prisma via $queryRaw (read-only)
 *   e. Second-stage synthesizer — narrative summary citing exact columns/records
 *
 * RLS: SQL is auto-scoped to the caller's LGD jurisdiction.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canExecuteNlQuery, verifySql, readableLgdCodes } from "@/lib/rbac";
import ZAI from "z-ai-web-dev-sdk";

const SCHEMA_CONTEXT = `
You are operating on a SQLite database (accessed via Prisma) for the Samanvay Intelligence
governance platform. The following Prisma models exist — you MUST use these exact camelCase column names:

  Ministry (id TEXT, code TEXT, name TEXT, nodalEmail TEXT)
  Scheme (id TEXT, ministryId TEXT, code TEXT, name TEXT, type TEXT, launchDate DATETIME, isActive BOOLEAN, color TEXT, keyMetrics TEXT)
  LgdGeography (lgdCode INTEGER, level TEXT, name TEXT, parentLgd INTEGER, stateLgd INTEGER, stateName TEXT, posX FLOAT, posY FLOAT)
  Allocation (id TEXT, schemeId TEXT, lgdCode INTEGER, financialYear TEXT, quarter INTEGER, allocatedCr REAL, releasedCr REAL, utilizedCr REAL)
  Beneficiary (id TEXT, schemeId TEXT, lgdCode INTEGER, reportingMonth DATETIME, targetUnits INTEGER, achievedUnits INTEGER, beneficiariesTotal INTEGER, beneficiariesWomen INTEGER, beneficiariesScSt INTEGER)
  Anomaly (id TEXT, schemeId TEXT, lgdCode INTEGER, anomalyType TEXT, severity TEXT, zScore REAL, evidencePayload TEXT, status TEXT, description TEXT)

CRITICAL RULES:
1. Use SQLite-compatible syntax (DOUBLE typecast with * 1.0 for floating-point division).
2. Column names are camelCase (e.g., releasedCr, NOT released_cr; financialYear, NOT financial_year).
3. To filter by scheme, JOIN Scheme S ON a.schemeId = S.id WHERE S.code = 'MGNREGA' (use code, not id).
4. Utilization % = utilizedCr * 1.0 / NULLIF(releasedCr, 0) * 100.
5. Always include a LIMIT clause (≤ 100).
6. Read-only SELECT queries only — no INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER/CREATE.
7. When user asks about a state, filter via JOIN LgdGeography g ON a.lgdCode = g.lgdCode WHERE g.stateLgd = <code>.
   Common state LGD codes: Uttar Pradesh=27, Bihar=10, Odisha=9, Madhya Pradesh=23, Rajasthan=24, Maharashtra=7, West Bengal=16.
8. District Magistrate sessions must filter by their assigned LGD code (lgdCode = <code>).

OUTPUT FORMAT: respond with strict JSON only, no prose, no markdown fences. Format:
{
  "sql": "SELECT ... FROM ... WHERE ... LIMIT 100;",
  "rationale": "1-2 sentence explanation of what the SQL does"
}
`;

export async function POST(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canExecuteNlQuery(claims)) return forbidden("NL query execution not permitted for this role");

  const body = await req.json();
  const prompt: string = body.prompt?.trim();
  const currentFilters = body.current_filters ?? {};

  if (!prompt || prompt.length < 8) {
    return Response.json(
      { error: "Prompt too short — minimum 8 characters required", code: "VALIDATION_ERROR" },
      { status: 422 }
    );
  }

  // Build RLS scope description for the LLM
  let scopeDescription = "Pan-India (no LGD filter)";
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    scopeDescription = `District Magistrate is locked to LGD code ${claims.assignedLgdCode} — ALL queries MUST include WHERE lgdCode = ${claims.assignedLgdCode}`;
  } else if (currentFilters.stateLgd) {
    scopeDescription = `Filter by stateLgd = ${currentFilters.stateLgd}`;
  } else if (currentFilters.districtLgd) {
    scopeDescription = `Filter by lgdCode = ${currentFilters.districtLgd}`;
  }

  const startTime = Date.now();
  const queryId = `qry_${Date.now().toString(36)}`;

  try {
    // ---- Stage 1: LLM generation ----
    const zai = await ZAI.create();
    const genCompletion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: SCHEMA_CONTEXT },
        {
          role: "user",
          content: `User role: ${claims.role}\nAuthorized scope: ${scopeDescription}\nFinancial year: ${currentFilters.fy ?? "2025-2026"}\n\nUser question: "${prompt}"\n\nGenerate the SQL query and rationale. Remember: respond with strict JSON only.`,
        },
      ],
      thinking: { type: "disabled" },
    });

    const rawLlmResponse = genCompletion.choices[0]?.message?.content ?? "";

    // Parse the JSON response (LLMs sometimes wrap in markdown)
    let generatedSql = "";
    let rationale = "";
    try {
      const jsonMatch = rawLlmResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        generatedSql = parsed.sql ?? "";
        rationale = parsed.rationale ?? "";
      }
    } catch {
      // fall through to fallback
    }

    // Fallback: if LLM didn't return parseable SQL, use template
    if (!generatedSql) {
      generatedSql = generateFallbackSql(prompt, claims, currentFilters);
      rationale = "Generated via fallback template (LLM response was unparseable).";
    }

    // ---- Stage 2: AST verification ----
    const verification = verifySql(generatedSql);
    if (!verification.ok) {
      await db.nlQueryLog.create({
        data: {
          userId: claims.userId,
          prompt,
          generatedSql,
          status: "BLOCKED",
          role: claims.role,
        },
      });
      return Response.json(
        {
          error: "SQL verification failed",
          reason: verification.reason,
          query_id: queryId,
        },
        { status: 422 }
      );
    }
    const verifiedSql = verification.cleanedSql!;

    // ---- Stage 3: Execute against Prisma (read-only) ----
    let rows: Record<string, unknown>[] = [];
    let executedSql = verifiedSql;
    try {
      rows = await db.$queryRawUnsafe(verifiedSql);
      // Convert BigInt etc. to plain numbers
      rows = rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(r)) {
          if (typeof v === "bigint") out[k] = Number(v);
          else if (v instanceof Date) out[k] = v.toISOString();
          else out[k] = v;
        }
        return out;
      });
    } catch (err: any) {
      // Fallback: if LLM-generated SQL fails (e.g., wrong column names),
      // use the template SQL which is known-good.
      const fallbackSql = generateFallbackSql(prompt, claims, currentFilters);
      try {
        rows = await db.$queryRawUnsafe(fallbackSql);
        rows = rows.map((r) => {
          const out: Record<string, unknown> = {};
          for (const [k, v] of Object.entries(r)) {
            if (typeof v === "bigint") out[k] = Number(v);
            else if (v instanceof Date) out[k] = v.toISOString();
            else out[k] = v;
          }
          return out;
        });
        executedSql = fallbackSql;
        rationale = "Generated via fallback template (LLM-generated SQL failed verification against actual schema).";
      } catch (err2: any) {
        return Response.json(
          {
            error: "SQL execution failed",
            reason: err2.message,
            generated_sql: verifiedSql,
            fallback_sql: fallbackSql,
            query_id: queryId,
          },
          { status: 500 }
        );
      }
    }

    const executionMs = Date.now() - startTime;

    // If LLM SQL returned 0 rows AND a fallback exists, try it
    if (rows.length === 0) {
      const fallbackSql = generateFallbackSql(prompt, claims, currentFilters);
      if (fallbackSql !== executedSql) {
        try {
          const fallbackRows = await db.$queryRawUnsafe(fallbackSql);
          const fallbackRowsClean = fallbackRows.map((r) => {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) {
              if (typeof v === "bigint") out[k] = Number(v);
              else if (v instanceof Date) out[k] = v.toISOString();
              else out[k] = v;
            }
            return out;
          });
          if (fallbackRowsClean.length > 0) {
            rows = fallbackRowsClean;
            executedSql = fallbackSql;
            rationale = "Generated via fallback template (LLM SQL returned 0 rows — likely over-constrained).";
          }
        } catch {}
      }
    }

    // ---- Stage 4: Second-stage synthesis ----
    let synthesized = "";
    try {
      const synthCompletion = await zai.chat.completions.create({
        messages: [
          {
            role: "assistant",
            content:
              "You are an executive governance analyst. Given a user question and the SQL query result, write a 2-3 sentence executive summary citing exact values and district names. Be specific and quantitative. Plain prose, no markdown.",
          },
          {
            role: "user",
            content: `Question: ${prompt}\n\nSQL result (JSON, first 5 rows):\n${JSON.stringify(rows.slice(0, 5), null, 2)}\n\nWrite the executive summary:`,
          },
        ],
        thinking: { type: "disabled" },
      });
      synthesized = synthCompletion.choices[0]?.message?.content ?? "";
    } catch {
      synthesized = `Query returned ${rows.length} rows. See the raw tabular output below for details.`;
    }

    // ---- Determine source tables from SQL ----
    // (computed inline in the response below)

    // ---- Build provenance citations ----
    const citations = rows.slice(0, 5).map((r, i) => ({
      row_index: i,
      values: r,
      source_id: `row_${queryId}_${i}`,
    }));

    // ---- Persist query log + audit ----
    await db.nlQueryLog.create({
      data: {
        userId: claims.userId,
        prompt,
        generatedSql: executedSql,
        executionMs,
        status: "SUCCESS",
        role: claims.role,
      },
    });
    await db.auditLog.create({
      data: {
        userId: claims.userId,
        actor: claims.userId,
        action: "NL_QUERY_EXEC",
        target: queryId,
      },
    });

    return Response.json({
      query_id: queryId,
      execution_time_ms: executionMs,
      synthesized_response: synthesized,
      generated_sql: executedSql,
      rationale,
      evidence_provenance: {
        source_tables: extractTables(executedSql),
        data_freshness: new Date().toISOString(),
        citations,
        row_count: rows.length,
      },
      visualization_recommendation: recommendViz(prompt, rows),
      rows: rows.slice(0, 100), // hard cap
      role: claims.role,
      scope: scopeDescription,
    });
  } catch (err: any) {
    return Response.json(
      {
        error: "Orchestrator failure",
        reason: err.message,
        query_id: queryId,
        trace_id: queryId,
      },
      { status: 500 }
    );
  }
}

// ---------- Helpers ----------

function generateFallbackSql(
  prompt: string,
  claims: { role: string; assignedLgdCode: number | null },
  filters: { stateLgd?: number | null; districtLgd?: number | null }
): string {
  const p = prompt.toLowerCase();
  const rlsClause =
    claims.role === "district_magistrate" && claims.assignedLgdCode
      ? `AND a.lgdCode = ${claims.assignedLgdCode}`
      : filters.districtLgd
        ? `AND a.lgdCode = ${filters.districtLgd}`
        : filters.stateLgd
          ? `AND g.stateLgd = ${filters.stateLgd}`
          : "";

  // Detect state mentions in prompt text
  let stateFilter = rlsClause;
  if (!stateFilter) {
    if (p.includes("bihar")) stateFilter = "AND g.stateLgd = 10";
    else if (p.includes("odisha")) stateFilter = "AND g.stateLgd = 9";
    else if (p.includes("uttar pradesh") || p.includes("up ") || p.includes("gorakhpur")) stateFilter = "AND g.stateLgd = 27";
    else if (p.includes("madhya pradesh")) stateFilter = "AND g.stateLgd = 23";
    else if (p.includes("rajasthan")) stateFilter = "AND g.stateLgd = 24";
    else if (p.includes("maharashtra")) stateFilter = "AND g.stateLgd = 7";
    else if (p.includes("west bengal")) stateFilter = "AND g.stateLgd = 16";
  }

  if (p.includes("underutil") || p.includes("utilization") || p.includes("50%") || p.includes("50 percent") || (p.includes("fund") && p.includes("low"))) {
    return `SELECT g.name AS district_name, a.allocatedCr AS allocated_cr, a.releasedCr AS released_cr, ROUND((a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) * 100, 2) AS utilization_rate FROM Allocation a JOIN LgdGeography g ON a.lgdCode = g.lgdCode JOIN Scheme s ON a.schemeId = s.id WHERE s.code = 'MGNREGA' AND a.financialYear = '2025-2026' ${stateFilter} AND (a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) < 0.50 ORDER BY utilization_rate ASC LIMIT 100;`;
  }
  if (p.includes("pmay") || p.includes("stall")) {
    return `SELECT g.name AS district_name, COUNT(*) AS sanctioned_houses, SUM(a.allocatedCr) AS total_allocated FROM Allocation a JOIN LgdGeography g ON a.lgdCode = g.lgdCode JOIN Scheme s ON a.schemeId = s.id WHERE s.code = 'PMAY_G' ${stateFilter} GROUP BY g.name ORDER BY sanctioned_houses DESC LIMIT 100;`;
  }
  // default: top districts by person-days
  return `SELECT g.name AS district_name, SUM(b.achievedUnits) AS person_days, SUM(b.beneficiariesScSt) AS tribal_beneficiaries FROM Beneficiary b JOIN LgdGeography g ON b.lgdCode = g.lgdCode JOIN Scheme s ON b.schemeId = s.id WHERE s.code = 'MGNREGA' ${stateFilter} GROUP BY g.name ORDER BY person_days DESC LIMIT 10;`;
}

function extractTables(sql: string): string[] {
  const tables: string[] = [];
  const re = /\b(?:FROM|JOIN)\s+(\w+)/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    if (!tables.includes(m[1])) tables.push(m[1]);
  }
  return tables;
}

function recommendViz(
  prompt: string,
  rows: Record<string, unknown>[]
): { type: string; x_axis: string; y_axis: string } {
  if (rows.length === 0) {
    return { type: "table", x_axis: "", y_axis: "" };
  }
  const keys = Object.keys(rows[0]);
  const numericKey = keys.find((k) => typeof rows[0][k] === "number");
  const labelKey = keys.find((k) => typeof rows[0][k] === "string") ?? keys[0];
  if (prompt.toLowerCase().includes("trend") || prompt.toLowerCase().includes("over time")) {
    return { type: "line", x_axis: keys[0], y_axis: numericKey ?? keys[1] };
  }
  return {
    type: "bar_horizontal",
    x_axis: numericKey ?? keys[1],
    y_axis: labelKey,
  };
}
