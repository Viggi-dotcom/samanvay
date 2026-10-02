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
    <div className="space-y-5">
      <PageHeader
        title="Anomaly Detection Engine"
        subtitle="Automated Z-score analysis flagging fund-utilization divergence, scheme overlap gaps, and stalled milestones."
        icon={AlertTriangle}
        badge={
          stats.critical > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-900/60 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              {stats.critical} CRITICAL
            </span>
          )
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card bodyClassName="p-3">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Total Detected
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {stats.total}
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-red-900/50">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Critical (Open)
          </div>
          <div className="text-xl font-bold text-red-300 font-mono mt-1">
            {stats.critical}
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-amber-900/40">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Open
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono mt-1">
            {stats.open}
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-emerald-900/40">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Resolved
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {stats.resolved}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[11px] text-tertiary">
          <Filter className="h-3 w-3" />
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
      <div className="space-y-2">
        {isLoading ? (
          <Card bodyClassName="p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="ml-2 text-xs text-tertiary">Loading anomalies from /api/anomalies…</span>
            </div>
          </Card>
        ) : anomalies.length === 0 ? (
          <Card bodyClassName="p-8">
            <div className="flex flex-col items-center text-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm text-white font-medium">No anomalies match these filters.</p>
              <p className="text-xs text-tertiary mt-1">
                Try resetting filters or broadening your LGD scope.
              </p>
            </div>
          </Card>
        ) : (
          anomalies.map((a) => {
            const isOpen = expanded === a.anomaly_id;

            return (
              <Card key={a.anomaly_id} bodyClassName="p-0" className={cn(
                a.severity === "CRITICAL" && a.status === "OPEN" && "border-red-900/50",
                a.severity === "HIGH" && a.status === "OPEN" && "border-amber-900/40"
              )}>
                <button
                  onClick={() => setExpanded(isOpen ? null : a.anomaly_id)}
                  className="w-full text-left p-4 hover:bg-surface-hover transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "h-8 w-8 shrink-0 rounded-md flex items-center justify-center",
                        a.severity === "CRITICAL"
                          ? "bg-red-950 text-red-400"
                          : a.severity === "HIGH"
                            ? "bg-amber-950 text-amber-400"
                            : a.severity === "MEDIUM"
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-800 text-slate-400"
                      )}
                    >
                      {a.anomaly_type === "STALLING" ? (
                        <Clock className="h-4 w-4" />
                      ) : a.anomaly_type === "SCHEME_OVERLAP_GAP" ? (
                        <Bug className="h-4 w-4" />
                      ) : (
                        <Activity className="h-4 w-4" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <SeverityBadge severity={a.severity} />
                        <StatusPill status={a.status} />
                        <span className="text-[10px] font-mono text-tertiary">
                          {a.anomaly_type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300">
                          Z={a.z_score.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-white leading-snug">
                        {a.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-tertiary">
                        <span className="font-mono">{a.anomaly_id}</span>
                        <span>·</span>
                        <span>{a.district_name}, {a.state_name}</span>
                        <span>·</span>
                        <span className="font-mono">LGD {a.lgd_code}</span>
                        {a.scheme_code && (
                          <>
                            <span>·</span>
                            <span
                              className="font-mono px-1.5 py-0.5 rounded"
                              style={{
                                background: (a.scheme_color ?? "#374151") + "20",
                                color: a.scheme_color ?? "#9CA3AF",
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
                      <ChevronDown className="h-4 w-4 text-tertiary shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-tertiary shrink-0" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-subtle pt-3">
                    <div className="text-[10px] uppercase tracking-wider text-tertiary mb-2">
                      Evidence Payload · JSONB · evidence_payload column
                    </div>
                    <pre className="rounded-md bg-app border border-subtle p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed">
{JSON.stringify(a.evidence_payload, null, 2)}
                    </pre>

                    {/* Action row */}
                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      <div className="text-[11px] text-tertiary">
                        Resolution lifecycle enforced by{" "}
                        <code className="font-mono text-cyan-300">
                          p_update_anomalies_scope
                        </code>{" "}
                        — DMs may only ACK/RESOLVE within their LGD jurisdiction.
                      </div>
                      <div className="flex items-center gap-2">
                        {a.status === "OPEN" && (
                          <button
                            onClick={() => updateMutation.mutate(
                              { anomalyId: a.anomaly_id, status: "ACKNOWLEDGED" },
                              { onSuccess: () => toast.success(`Anomaly ${a.anomaly_id} acknowledged`), onError: (err) => toast.error(`Failed: ${err.message}`) }
                            )}
                            disabled={updateMutation.isPending}
                            className="h-8 px-3 rounded-md bg-amber-950 text-amber-300 border border-amber-900/60 hover:bg-amber-900/30 text-xs font-medium transition-colors disabled:opacity-50"
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
                            className="h-8 px-3 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-900/60 hover:bg-emerald-900/30 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3 w-3" />
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
    <div className="flex items-center gap-1 rounded-md bg-surface-elevated border border-subtle p-0.5">
      <span className="text-[10px] text-tertiary px-1.5 uppercase tracking-wider">
        {label}
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "h-6 px-2 rounded text-[10px] font-mono uppercase transition-colors",
            value === opt
              ? "bg-blue-600 text-white"
              : "text-secondary-muted hover:text-white"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
