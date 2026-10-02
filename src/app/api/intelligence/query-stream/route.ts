/**
 * POST /api/intelligence/query-stream
 * Streaming variant of the NL orchestrator.
 * Returns Server-Sent Events: status, sql_token, sql_complete, rows, synth_token, done, error.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getClaims, unauthorized, forbidden } from "@/lib/api/session";
import { canExecuteNlQuery, verifySql } from "@/lib/rbac";
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
6. Read-only SELECT queries only.
7. Common state LGD codes: Uttar Pradesh=9, Bihar=10, Odisha=21, Madhya Pradesh=23, Rajasthan=8, Maharashtra=27, West Bengal=19.

OUTPUT FORMAT: respond with strict JSON only, no prose, no markdown fences. Format:
{"sql": "SELECT ... LIMIT 100;", "rationale": "1-2 sentence explanation"}
`;

export async function POST(req: NextRequest) {
  const claims = await getClaims();
  if (!claims) return unauthorized();
  if (!canExecuteNlQuery(claims)) return forbidden("NL query execution not permitted for this role");

  const body = await req.json();
  const prompt: string = body.prompt?.trim();
  const currentFilters = body.current_filters ?? {};

  if (!prompt || prompt.length < 8) {
    return Response.json({ error: "Prompt too short", code: "VALIDATION_ERROR" }, { status: 422 });
  }

  const encoder = new TextEncoder();
  const startTime = Date.now();
  const queryId = `qry_${Date.now().toString(36)}`;

  let scopeDescription = "Pan-India (no LGD filter)";
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    scopeDescription = `District Magistrate is locked to LGD code ${claims.assignedLgdCode}`;
  } else if (currentFilters.stateLgd) {
    scopeDescription = `Filter by stateLgd = ${currentFilters.stateLgd}`;
  } else if (currentFilters.districtLgd) {
    scopeDescription = `Filter by lgdCode = ${currentFilters.districtLgd}`;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("status", { stage: "generating_sql", message: "Generating SQL via LLM..." });
        const zai = await ZAI.create();
        const genCompletion = await zai.chat.completions.create({
          messages: [
            { role: "assistant", content: SCHEMA_CONTEXT },
            { role: "user", content: `User role: ${claims.role}\nScope: ${scopeDescription}\nQuestion: "${prompt}"\n\nGenerate the SQL query and rationale. Strict JSON only.` },
          ],
          thinking: { type: "disabled" },
        });

        const rawLlmResponse = genCompletion.choices[0]?.message?.content ?? "";
        let generatedSql = "";
        let rationale = "";
        try {
          const jsonMatch = rawLlmResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            generatedSql = parsed.sql ?? "";
            rationale = parsed.rationale ?? "";
          }
        } catch {}
        if (!generatedSql) {
          generatedSql = generateFallbackSql(prompt, claims, currentFilters);
          rationale = "Generated via fallback template.";
        }

        send("status", { stage: "verifying", message: "Verifying SQL via AST parser..." });
        const verification = verifySql(generatedSql);
        if (!verification.ok) {
          send("error", { reason: verification.reason });
          controller.close();
          return;
        }
        const verifiedSql = verification.cleanedSql!;

        // Stream SQL tokens for typewriter effect
        const sqlTokens = verifiedSql.match(/.{1,12}/g) ?? [verifiedSql];
        for (const tok of sqlTokens) {
          send("sql_token", { token: tok });
          await new Promise((r) => setTimeout(r, 8));
        }
        send("sql_complete", { sql: verifiedSql, rationale });

        // Execute
        send("status", { stage: "executing", message: "Executing against Prisma read-replica..." });
        let rows: Record<string, unknown>[] = [];
        let executedSql = verifiedSql;
        try {
          rows = await db.$queryRawUnsafe(verifiedSql);
          rows = rows.map((r) => {
            const out: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(r)) {
              if (typeof v === "bigint") out[k] = Number(v);
              else if (v instanceof Date) out[k] = v.toISOString();
              else out[k] = v;
            }
            return out;
          });
        } catch {
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
            rationale = "Generated via fallback template (LLM SQL failed verification).";
          } catch (err2: any) {
            send("error", { reason: err2.message });
            controller.close();
            return;
          }
        }

        const executionMs = Date.now() - startTime;
        send("rows", { rows: rows.slice(0, 100), row_count: rows.length, execution_ms: executionMs });

        // Stream synthesis
        send("status", { stage: "synthesizing", message: "Synthesizing executive narrative..." });
        try {
          const synthCompletion = await zai.chat.completions.create({
            messages: [
              { role: "assistant", content: "You are an executive governance analyst. Write a 2-3 sentence executive summary citing exact values and district names. Plain prose, no markdown." },
              { role: "user", content: `Question: ${prompt}\n\nSQL result (JSON, first 5 rows):\n${JSON.stringify(rows.slice(0, 5), null, 2)}\n\nWrite the executive summary:` },
            ],
            thinking: { type: "disabled" },
          });
          const synthesized = synthCompletion.choices[0]?.message?.content ?? "";
          const tokens = synthesized.match(/.{1,4}/g) ?? [synthesized];
          for (const tok of tokens) {
            send("synth_token", { token: tok });
            await new Promise((r) => setTimeout(r, 14));
          }
        } catch {
          send("synth_token", { token: `Query returned ${rows.length} rows.` });
        }

        const sourceTables = extractTables(executedSql);
        const citations = rows.slice(0, 5).map((r, i) => ({
          row_index: i,
          values: r,
          source_id: `row_${queryId}_${i}`,
        }));

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

        send("done", {
          query_id: queryId,
          execution_time_ms: executionMs,
          generated_sql: executedSql,
          rationale,
          evidence_provenance: {
            source_tables: sourceTables,
            data_freshness: new Date().toISOString(),
            citations,
            row_count: rows.length,
          },
          visualization_recommendation: recommendViz(prompt, rows),
          role: claims.role,
          scope: scopeDescription,
        });
      } catch (err: any) {
        send("error", { reason: err.message, trace_id: queryId });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function generateFallbackSql(prompt: string, claims: { role: string; assignedLgdCode: number | null }, filters: { stateLgd?: number | null; districtLgd?: number | null }): string {
  const p = prompt.toLowerCase();
  const rlsClause =
    claims.role === "district_magistrate" && claims.assignedLgdCode
      ? `AND a.lgdCode = ${claims.assignedLgdCode}`
      : filters.districtLgd ? `AND a.lgdCode = ${filters.districtLgd}` : filters.stateLgd ? `AND g.stateLgd = ${filters.stateLgd}` : "";
  let stateFilter = rlsClause;
  if (!stateFilter) {
    if (p.includes("bihar")) stateFilter = "AND g.stateLgd = 10";
    else if (p.includes("odisha")) stateFilter = "AND g.stateLgd = 21";
    else if (p.includes("uttar pradesh") || p.includes("gorakhpur")) stateFilter = "AND g.stateLgd = 9";
    else if (p.includes("madhya pradesh")) stateFilter = "AND g.stateLgd = 23";
    else if (p.includes("rajasthan")) stateFilter = "AND g.stateLgd = 8";
    else if (p.includes("maharashtra")) stateFilter = "AND g.stateLgd = 27";
    else if (p.includes("west bengal")) stateFilter = "AND g.stateLgd = 19";
  }

  if (p.includes("underutil") || p.includes("utilization") || p.includes("50%")) {
    return `SELECT g.name AS district_name, a.allocatedCr AS allocated_cr, a.releasedCr AS released_cr, ROUND((a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) * 100, 2) AS utilization_rate FROM Allocation a JOIN LgdGeography g ON a.lgdCode = g.lgdCode JOIN Scheme s ON a.schemeId = s.id WHERE s.code = 'MGNREGA' AND a.financialYear = '2025-2026' ${stateFilter} AND (a.utilizedCr * 1.0 / NULLIF(a.releasedCr, 0)) < 0.50 ORDER BY utilization_rate ASC LIMIT 100;`;
  }
  if (p.includes("pmay") || p.includes("stall")) {
    return `SELECT g.name AS district_name, COUNT(*) AS sanctioned_houses, SUM(a.allocatedCr) AS total_allocated FROM Allocation a JOIN LgdGeography g ON a.lgdCode = g.lgdCode JOIN Scheme s ON a.schemeId = s.id WHERE s.code = 'PMAY_G' ${stateFilter} GROUP BY g.name ORDER BY sanctioned_houses DESC LIMIT 100;`;
  }
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

function recommendViz(prompt: string, rows: Record<string, unknown>[]): { type: string; x_axis: string; y_axis: string } {
  if (rows.length === 0) return { type: "table", x_axis: "", y_axis: "" };
  const keys = Object.keys(rows[0]);
  const numericKey = keys.find((k) => typeof rows[0][k] === "number");
  const labelKey = keys.find((k) => typeof rows[0][k] === "string") ?? keys[0];
  return { type: "bar_horizontal", x_axis: numericKey ?? keys[1], y_axis: labelKey };
}
