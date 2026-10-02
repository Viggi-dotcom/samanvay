"use client";
/**
 * API hooks — typed wrappers around TanStack Query
 * hitting our authenticated API routes.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ---------- Types (mirror server responses) ----------

export interface Kpis {
  allocated: number;
  released: number;
  utilized: number;
  utilizationPct: number;
  beneficiaries: number;
  womenPct: number;
  scStPct: number;
  activeWorks: number;
  targetUnits: number;
  achievementPct: number;
  criticalAnomalies: number;
  totalAnomalies: number;
  scope: {
    role: string;
    stateLgd: number | null;
    districtLgd: number | null;
    schemeId: string | null;
    fy: string;
  };
}

export interface SchemeSummary {
  scheme_id: string;
  scheme_code: string;
  scheme_name: string;
  scheme_type: string;
  launch_date: string | null;
  is_active: boolean;
  description: string;
  color: string;
  keyMetrics: { label: string; key: string }[];
  ministry: {
    ministry_id: string;
    ministry_code: string;
    ministry_name: string;
    nodal_email: string;
  };
  metrics: {
    allocated: number;
    released: number;
    utilized: number;
    utilizationPct: number;
    beneficiaries: number;
  };
}

export interface Anomaly {
  anomaly_id: string;
  scheme_id: string | null;
  scheme_code: string | null;
  scheme_color: string | null;
  lgd_code: number;
  district_name: string;
  state_name: string;
  anomaly_type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  z_score: number;
  evidence_payload: Record<string, unknown>;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  description: string;
  created_at: string;
}

export interface GeoState {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  pos_x: number | null;
  pos_y: number | null;
  metrics: { released: number; utilized: number; allocated: number; util: number };
}

export interface GeoDistrict {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  state_name: string;
  metrics: { released: number; utilized: number; allocated: number; util: number };
}

export interface NlQueryResponse {
  query_id: string;
  execution_time_ms: number;
  synthesized_response: string;
  generated_sql: string;
  rationale?: string;
  evidence_provenance: {
    source_tables: string[];
    data_freshness: string;
    citations: { row_index: number; values: Record<string, unknown>; source_id: string }[];
    row_count: number;
  };
  visualization_recommendation: { type: string; x_axis: string; y_axis: string };
  rows: Record<string, unknown>[];
  role: string;
  scope: string;
}

export interface PipelineRun {
  id: string;
  scheme: string;
  source: string;
  schedule: string;
  status: string;
  recordsIngested: number;
  lastRun: string;
  durationSec: number;
}

export interface ProvisionedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  ministry: string;
  ministry_id: string | null;
  lgd_scope: string;
  last_active: string | null;
  status: string;
}

export interface AuditLogEntry {
  id: string;
  ts: string;
  actor: string;
  action: string;
  target: string;
  user_name: string | null;
  user_email: string | null;
}

// ---------- Filter serialization ----------

function filterParams(filters: {
  stateLgd?: number | null;
  districtLgd?: number | null;
  schemeId?: string | null;
  fy?: string;
}): string {
  const p = new URLSearchParams();
  if (filters.stateLgd) p.set("stateLgd", String(filters.stateLgd));
  if (filters.districtLgd) p.set("districtLgd", String(filters.districtLgd));
  if (filters.schemeId) p.set("schemeId", filters.schemeId);
  if (filters.fy) p.set("fy", filters.fy);
  return p.toString();
}

// ---------- Hooks ----------

export function useKpis(filters: {
  stateLgd?: number | null;
  districtLgd?: number | null;
  schemeId?: string | null;
  fy?: string;
}) {
  return useQuery<Kpis>({
    queryKey: ["kpis", filters],
    queryFn: async () => {
      const res = await fetch(`/api/kpis?${filterParams(filters)}`);
      if (!res.ok) throw new Error(`KPIs ${res.status}`);
      return res.json();
    },
  });
}

export function useSchemes(filters: {
  stateLgd?: number | null;
  districtLgd?: number | null;
  fy?: string;
}) {
  return useQuery<{ schemes: SchemeSummary[] }>({
    queryKey: ["schemes", filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.stateLgd) p.set("stateLgd", String(filters.stateLgd));
      if (filters.districtLgd) p.set("districtLgd", String(filters.districtLgd));
      if (filters.fy) p.set("fy", filters.fy);
      const res = await fetch(`/api/schemes?${p.toString()}`);
      if (!res.ok) throw new Error(`Schemes ${res.status}`);
      return res.json();
    },
  });
}

export function useSchemeDetail(
  schemeId: string | null,
  filters: { stateLgd?: number | null; districtLgd?: number | null; fy?: string }
) {
  return useQuery({
    queryKey: ["scheme", schemeId, filters],
    enabled: !!schemeId,
    queryFn: async () => {
      if (!schemeId) return null;
      const p = new URLSearchParams();
      if (filters.stateLgd) p.set("stateLgd", String(filters.stateLgd));
      if (filters.districtLgd) p.set("districtLgd", String(filters.districtLgd));
      if (filters.fy) p.set("fy", filters.fy);
      const res = await fetch(`/api/schemes/${schemeId}?${p.toString()}`);
      if (!res.ok) throw new Error(`Scheme detail ${res.status}`);
      return res.json();
    },
  });
}

export function useAnomalies(filters: {
  status?: string;
  severity?: string;
  stateLgd?: number | null;
  districtLgd?: number | null;
}) {
  return useQuery<{ anomalies: Anomaly[] }>({
    queryKey: ["anomalies", filters],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.status && filters.status !== "ALL") p.set("status", filters.status);
      if (filters.severity && filters.severity !== "ALL") p.set("severity", filters.severity);
      if (filters.stateLgd) p.set("stateLgd", String(filters.stateLgd));
      if (filters.districtLgd) p.set("districtLgd", String(filters.districtLgd));
      const res = await fetch(`/api/anomalies?${p.toString()}`);
      if (!res.ok) throw new Error(`Anomalies ${res.status}`);
      return res.json();
    },
  });
}

export function useUpdateAnomaly() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ anomalyId, status }: { anomalyId: string; status: "ACKNOWLEDGED" | "RESOLVED" }) => {
      const res = await fetch(`/api/anomalies/${anomalyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Update ${res.status}`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["anomalies"] });
      qc.invalidateQueries({ queryKey: ["kpis"] });
    },
  });
}

export function useGeoNational(schemeId?: string | null) {
  const p = new URLSearchParams({ level: "national" });
  if (schemeId) p.set("schemeId", schemeId);
  return useQuery<{ level: string; states: GeoState[] }>({
    queryKey: ["geo", "national", schemeId ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/geo?${p.toString()}`);
      if (!res.ok) throw new Error(`Geo ${res.status}`);
      return res.json();
    },
  });
}

export function useGeoState(stateLgd: number | null, schemeId?: string | null) {
  return useQuery({
    queryKey: ["geo", "state", stateLgd, schemeId ?? "all"],
    enabled: !!stateLgd,
    queryFn: async () => {
      if (!stateLgd) return null;
      const p = new URLSearchParams({ level: "state", stateLgd: String(stateLgd) });
      if (schemeId) p.set("schemeId", schemeId);
      const res = await fetch(`/api/geo?${p.toString()}`);
      if (!res.ok) throw new Error(`Geo state ${res.status}`);
      return res.json();
    },
  });
}

export interface ConvergenceRow {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  state_name: string;
  mgnrega_util: number;
  mgnrega_released: number;
  mgnrega_allocated: number;
  pmkisan_util: number;
  pmayg_util: number;
  pmayg_completion: number;
  flag: "OVERLAP_HIGH" | "GAP" | "MIXED" | "STABLE";
  deviation_score: number;
}

export function useConvergenceMatrix(stateLgd?: number | null) {
  return useQuery<{ rows: ConvergenceRow[]; summary: Record<string, number>; scope: Record<string, unknown> }>({
    queryKey: ["convergence", stateLgd ?? "all"],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (stateLgd) p.set("stateLgd", String(stateLgd));
      const res = await fetch(`/api/convergence?${p.toString()}`);
      if (!res.ok) throw new Error(`Convergence ${res.status}`);
      return res.json();
    },
  });
}

export function useGeoDistricts(stateLgd?: number | null, schemeId?: string | null) {
  return useQuery<{ districts: GeoDistrict[] }>({
    queryKey: ["geo", "districts", stateLgd ?? "all", schemeId ?? "all"],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (stateLgd) p.set("stateLgd", String(stateLgd));
      if (schemeId) p.set("schemeId", schemeId);
      const res = await fetch(`/api/geo/districts?${p.toString()}`);
      if (!res.ok) throw new Error(`Geo districts ${res.status}`);
      return res.json();
    },
  });
}

export function useNlQuery() {
  return useMutation({
    mutationFn: async ({ prompt, current_filters }: { prompt: string; current_filters: Record<string, unknown> }) => {
      const res = await fetch("/api/intelligence/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, current_filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.reason ?? `HTTP ${res.status}`);
      return data as NlQueryResponse;
    },
  });
}

export function usePipelines() {
  return useQuery<{ pipelines: PipelineRun[] }>({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pipelines");
      if (!res.ok) throw new Error(`Pipelines ${res.status}`);
      return res.json();
    },
  });
}

export function useProvisionedUsers() {
  return useQuery<{ users: ProvisionedUser[] }>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error(`Users ${res.status}`);
      return res.json();
    },
  });
}

export function useProvisionUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; email: string; role: string; ministryId?: string; assignedLgdCode?: number; password: string }) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Suspend ${res.status}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useAuditLog(limit = 50) {
  return useQuery<{ logs: AuditLogEntry[] }>({
    queryKey: ["audit", limit],
    queryFn: async () => {
      const res = await fetch(`/api/admin/audit?limit=${limit}`);
      if (!res.ok) throw new Error(`Audit ${res.status}`);
      return res.json();
    },
  });
}
