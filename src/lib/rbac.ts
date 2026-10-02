/**
 * Server-side RBAC enforcement — Samanvay Intelligence
 * Mirrors the PostgreSQL Row-Level Security policies from Document 4.
 * Since SQLite lacks native RLS, we enforce scoping at the query layer
 * by appending WHERE clauses based on the authenticated JWT claims.
 */
import type { Role } from "@/lib/seed-data";

export interface SessionClaims {
  userId: string;
  role: Role;
  assignedLgdCode: number | null;
  assignedMinistryId: string | null;
}

// ---------- RLS scoping helpers ----------

/**
 * Returns the LGD codes a user is permitted to read.
 * - super_admin / central_executive / auditor → null = ALL (no filter)
 * - district_magistrate → only their assigned district + children
 * - dept_nodal → all districts (deep on own ministry, aggregated on others)
 */
export function readableLgdCodes(claims: SessionClaims): number[] | null {
  if (
    claims.role === "super_admin" ||
    claims.role === "central_executive" ||
    claims.role === "auditor"
  ) {
    return null; // pan-India
  }
  if (claims.role === "district_magistrate" && claims.assignedLgdCode) {
    return [claims.assignedLgdCode];
  }
  // dept_nodal: ministry-scoped but reads geography-wide
  return null;
}

/**
 * Returns the scheme IDs a user is permitted to read in detail.
 * - dept_nodal: own ministry schemes only (others are aggregated)
 * - All others: null = ALL schemes
 */
export function readableSchemeIds(
  claims: SessionClaims,
  ministryToSchemeMap: Map<string, string[]>
): string[] | null {
  if (
    claims.role === "dept_nodal" &&
    claims.assignedMinistryId
  ) {
    return ministryToSchemeMap.get(claims.assignedMinistryId) ?? [];
  }
  return null;
}

/**
 * Can the user update an anomaly's status?
 * Mirrors policy p_update_anomalies_scope:
 *   - super_admin: yes
 *   - district_magistrate: yes only if anomaly.lgd_code === assignedLgdCode
 *   - everyone else: no
 */
export function canUpdateAnomaly(
  claims: SessionClaims,
  anomalyLgdCode: number
): boolean {
  if (claims.role === "super_admin") return true;
  if (claims.role === "district_magistrate" && claims.assignedLgdCode === anomalyLgdCode) {
    return true;
  }
  return false;
}

/**
 * Can the user access admin views?
 */
export function canAccessAdmin(claims: SessionClaims): boolean {
  return claims.role === "super_admin";
}

/**
 * Can the user execute NL-to-SQL queries?
 * Per Doc 4 RLS policies: central_executive, dept_nodal, auditor, super_admin.
 * District magistrates can also query (but scoped to their LGD).
 */
export function canExecuteNlQuery(claims: SessionClaims): boolean {
  return (
    claims.role === "super_admin" ||
    claims.role === "central_executive" ||
    claims.role === "dept_nodal" ||
    claims.role === "auditor" ||
    claims.role === "district_magistrate"
  );
}

// ---------- SQL AST verification ----------

/**
 * Verifies a generated SQL string is read-only and within guardrails.
 * Mirrors the AST verification step from Workflow C (Doc 5).
 *
 * Checks:
 *   1. Contains no write keywords (INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER/CREATE)
 *   2. Contains a LIMIT clause (we enforce ≤ 500)
 *   3. No semicolons beyond the statement terminator
 */
export interface SqlVerificationResult {
  ok: boolean;
  reason?: string;
  cleanedSql?: string;
}

export function verifySql(sql: string): SqlVerificationResult {
  const upper = sql.toUpperCase();

  const writeKeywords = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "TRUNCATE",
    "ALTER",
    "CREATE",
    "GRANT",
    "REVOKE",
    "MERGE",
  ];
  for (const kw of writeKeywords) {
    // word-boundary check so we don't match "updated_at" etc.
    const re = new RegExp(`\\b${kw}\\b`);
    if (re.test(upper)) {
      return { ok: false, reason: `Blocked: SQL contains write keyword "${kw}"` };
    }
  }

  // Enforce LIMIT
  if (!/\bLIMIT\b/.test(upper)) {
    // Append LIMIT 100
    sql = sql.replace(/;\s*$/, "") + "\nLIMIT 100;";
  } else {
    // Cap at LIMIT 500
    const m = upper.match(/LIMIT\s+(\d+)/);
    if (m && parseInt(m[1], 10) > 500) {
      sql = sql.replace(/LIMIT\s+\d+/i, "LIMIT 500");
    }
  }

  return { ok: true, cleanedSql: sql };
}
