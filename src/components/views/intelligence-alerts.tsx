"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronRight,
  Bug,
  Activity,
  Loader2,
} from "lucide-react";
import { useApp, PageHeader, Card, SeverityBadge, StatusPill } from "@/components/app-shell";
import { useAnomalies, useUpdateAnomaly } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FilterStatus = "ALL" | "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
type FilterSeverity = "ALL" | "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export function IntelligenceAlertsView() {
  const filters = useApp((s) => s.filters);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [sevFilter, setSevFilter] = useState<FilterSeverity>("ALL");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading } = useAnomalies({
    status: statusFilter,
    severity: sevFilter,
    stateLgd: filters.stateLgd,
    districtLgd: filters.districtLgd,
  });
  const anomalies = data?.anomalies ?? [];

  const updateMutation = useUpdateAnomaly();

  const stats = {
    total: anomalies.length,
    critical: anomalies.filter((a) => a.severity === "CRITICAL" && a.status === "OPEN").length,
    open: anomalies.filter((a) => a.status === "OPEN").length,
    resolved: anomalies.filter((a) => a.status === "RESOLVED").length,
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title="Anomaly Detection Engine"
        subtitle="Automated Z-score analysis flagging fund-utilization divergence, scheme overlap gaps, and stalled milestones."
        icon={AlertTriangle}
        badge={
          stats.critical > 0 ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-red-950 text-red-300 border border-red-800/80 flex items-center gap-1.5 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {stats.critical} CRITICAL ANOMALIES
            </span>
          ) : undefined
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card bodyClassName="p-5" className="border border-slate-200 bg-white shadow-xs border-l-4 border-l-[#0B4F9C]">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500">
            Total Detected
          </div>
          <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">
            {stats.total}
          </div>
        </Card>
        <Card bodyClassName="p-5" className="border border-red-200 bg-white shadow-xs border-l-4 border-l-red-600">
          <div className="text-xs uppercase font-bold tracking-wider text-red-700">
            Critical (Open)
          </div>
          <div className="text-3xl font-extrabold text-red-700 font-mono mt-1">
            {stats.critical}
          </div>
        </Card>
        <Card bodyClassName="p-5" className="border border-amber-200 bg-white shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs uppercase font-bold tracking-wider text-amber-700">
            Open
          </div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono mt-1">
            {stats.open}
          </div>
        </Card>
        <Card bodyClassName="p-5" className="border border-emerald-200 bg-white shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">
            Resolved
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">
            {stats.resolved}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold uppercase tracking-wider">
          <Filter className="h-4 w-4 text-[#0B4F9C]" />
          Filter:
        </div>
        <FilterTabs
          label="Status"
          value={statusFilter}
          options={["ALL", "OPEN", "ACKNOWLEDGED", "RESOLVED"]}
          onChange={(v) => setStatusFilter(v as FilterStatus)}
        />
        <FilterTabs
          label="Severity"
          value={sevFilter}
          options={["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"]}
          onChange={(v) => setSevFilter(v as FilterSeverity)}
        />
      </div>

      {/* Alert list */}
      <div className="space-y-3.5">
        {isLoading ? (
          <Card bodyClassName="p-12">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-[#0B4F9C] animate-spin" />
              <span className="ml-3 text-sm text-slate-600 font-medium">Loading anomalies from /api/anomalies…</span>
            </div>
          </Card>
        ) : anomalies.length === 0 ? (
          <Card bodyClassName="p-12">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mb-3" />
              <p className="text-base text-slate-900 font-bold">No anomalies match these filters.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Try resetting filters or broadening your LGD administrative scope.
              </p>
            </div>
          </Card>
        ) : (
          anomalies.map((a) => {
            const isOpen = expanded === a.anomaly_id;

            return (
              <Card
                key={a.anomaly_id}
                bodyClassName="p-0"
                className={cn(
                  "transition-all shadow-xs bg-white border border-slate-200 overflow-hidden",
                  a.severity === "CRITICAL"
                    ? "border-l-4 border-l-red-600"
                    : a.severity === "HIGH"
                      ? "border-l-4 border-l-amber-500"
                      : "border-l-4 border-l-blue-500"
                )}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : a.anomaly_id)}
                  className="w-full text-left p-5 md:p-6 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-xs",
                        a.severity === "CRITICAL"
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : a.severity === "HIGH"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                      )}
                    >
                      {a.anomaly_type === "STALLING" ? (
                        <Clock className="h-5 w-5" />
                      ) : a.anomaly_type === "SCHEME_OVERLAP_GAP" ? (
                        <Bug className="h-5 w-5" />
                      ) : (
                        <Activity className="h-5 w-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <SeverityBadge severity={a.severity} />
                        <StatusPill status={a.status} />
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {a.anomaly_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Z={a.z_score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900 leading-snug">
                        {a.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 flex-wrap">
                        <span className="font-mono font-bold text-slate-700">{a.anomaly_id}</span>
                        <span>·</span>
                        <span className="font-medium text-slate-700">{a.district_name}, {a.state_name}</span>
                        <span>·</span>
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">LGD {a.lgd_code}</span>
                        {a.scheme_code && (
                          <>
                            <span>·</span>
                            <span
                              className="font-mono px-2 py-0.5 rounded-md font-bold text-[11px]"
                              style={{
                                background: "#EFF6FF",
                                color: "#0B4F9C",
                                border: "1px solid #BFDBFE",
                              }}
                            >
                              {a.scheme_code}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{new Date(a.created_at).toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-gray-500 shrink-0 mt-1" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500 shrink-0 mt-1" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 border-t border-slate-200 pt-4 bg-slate-50/70">
                    <div className="text-xs uppercase font-bold tracking-wider text-slate-600 mb-2">
                      Evidence Payload · JSONB · evidence_payload column
                    </div>
                    <pre className="rounded-xl bg-[#0B1120] border border-slate-700 p-4 text-xs font-mono text-[#38BDF8] overflow-x-auto leading-relaxed shadow-inner">
{JSON.stringify(a.evidence_payload, null, 2)}
                    </pre>

                    {/* Action row */}
                    <div className="flex items-center justify-between mt-4 gap-3 flex-wrap">
                      <div className="text-xs text-slate-600 leading-relaxed">
                        Resolution lifecycle enforced by{" "}
                        <code className="font-mono text-[#0B4F9C] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                          p_update_anomalies_scope
                        </code>{" "}
                        — DMs may only ACK/RESOLVE within their LGD jurisdiction.
                      </div>
                      <div className="flex items-center gap-2.5">
                        {a.status === "OPEN" && (
                          <button
                            onClick={() => updateMutation.mutate(
                              { anomalyId: a.anomaly_id, status: "ACKNOWLEDGED" },
                              { onSuccess: () => toast.success(`Anomaly ${a.anomaly_id} acknowledged`), onError: (err) => toast.error(`Failed: ${err.message}`) }
                            )}
                            disabled={updateMutation.isPending}
                            className="h-9 px-4 rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            Acknowledge
                          </button>
                        )}
                        {a.status !== "RESOLVED" && (
                          <button
                            onClick={() => updateMutation.mutate(
                              { anomalyId: a.anomaly_id, status: "RESOLVED" },
                              { onSuccess: () => toast.success(`Anomaly ${a.anomaly_id} resolved`), onError: (err) => toast.error(`Failed: ${err.message}`) }
                            )}
                            disabled={updateMutation.isPending}
                            className="h-9 px-4 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function FilterTabs({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-xs">
      <span className="text-xs text-slate-500 px-2 font-bold uppercase tracking-wider">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "h-7 px-3 rounded-lg text-xs font-mono uppercase font-bold transition-all cursor-pointer",
            value === opt
              ? "bg-[#0B4F9C] text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
