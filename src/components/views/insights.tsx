"use client";

import {
  Brain,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  Target,
  Loader2,
  Zap,
} from "lucide-react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useApp, PageHeader, Card, KpiCard } from "@/components/app-shell";
import { useInsights, type InsightPoint } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const QUADRANT_COLORS: Record<string, string> = {
  CRITICAL: "#EF4444",
  DIVERGENT: "#F59E0B",
  UNDERPERFORMING: "#A16207",
  STABLE: "#6B7280",
  EFFICIENT: "#10B981",
};

const QUADRANTS = ["CRITICAL", "DIVERGENT", "UNDERPERFORMING", "STABLE", "EFFICIENT"] as const;

export function InsightsView() {
  const filters = useApp((s) => s.filters);
  const openDistrict = useApp((s) => s.openDistrict);
  const { data, isLoading } = useInsights(filters.schemeId, filters.stateLgd);
  const points = data?.points ?? [];
  const insights = data?.insights ?? [];
  const summary = data?.summary;

  // Group points by quadrant (no useMemo — recomputed on each render is fine for this size)
  const byQuadrant = new Map<string, InsightPoint[]>();
  for (const q of QUADRANTS) byQuadrant.set(q, []);
  for (const p of points) {
    const arr = byQuadrant.get(p.quadrant) ?? [];
    arr.push(p);
    byQuadrant.set(p.quadrant, arr);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Insight Engine"
        subtitle="Nightly anomaly detection · Z-score scatter analysis · quadrant classification of all districts."
        icon={Brain}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-900/60 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" />
            NIGHTLY
          </span>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {isLoading ? (
          <div className="col-span-full h-16 rounded-lg border border-subtle bg-surface-elevated flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            <span className="ml-2 text-xs text-tertiary">Computing Z-scores across all districts…</span>
          </div>
        ) : (
          <>
            <KpiCard label="Critical" value={summary?.critical ?? 0} icon={AlertOctagon} alert="critical" />
            <KpiCard label="Divergent" value={summary?.divergent ?? 0} icon={TrendingDown} alert="warning" />
            <KpiCard label="Underperforming" value={summary?.underperforming ?? 0} icon={TrendingDown} alert="warning" />
            <KpiCard label="Stable" value={summary?.stable ?? 0} icon={Target} />
            <KpiCard label="Efficient" value={summary?.efficient ?? 0} icon={TrendingUp} alert="success" />
          </>
        )}
      </div>

      {/* Z-score scatter plot */}
      <Card
        title="District Quadrant Analysis"
        subtitle="X-axis: Utilization % · Y-axis: Open Anomaly Count · Bubble size: Critical anomaly count"
        bodyClassName="p-4"
      >
        <div className="h-96">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 30 }}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="util_pct"
                  name="Utilization %"
                  domain={[0, 100]}
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  stroke="#374151"
                  label={{ value: "Utilization %", position: "insideBottom", offset: -25, fill: "#9CA3AF", fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="anomaly_count"
                  name="Anomaly Count"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  stroke="#374151"
                  label={{ value: "Open Anomalies", angle: -90, position: "insideLeft", fill: "#9CA3AF", fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="critical_count" range={[40, 400]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#374151" }}
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as InsightPoint;
                    return (
                      <div className="rounded-md bg-surface-elevated border border-blue-700/50 shadow-xl px-3 py-2">
                        <div className="text-xs font-semibold text-white">{p.district_name}</div>
                        <div className="text-[10px] text-tertiary font-mono">{p.state_name} · LGD {p.lgd_code}</div>
                        <div className="text-[11px] text-cyan-300 mt-1">Util: {p.util_pct.toFixed(1)}%</div>
                        <div className="text-[11px] text-amber-300">Anomalies: {p.anomaly_count}</div>
                        <div className="text-[11px] text-purple-300">Z-score: {p.z_score.toFixed(2)}</div>
                        <div className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded font-mono" style={{ background: QUADRANT_COLORS[p.quadrant] + "30", color: QUADRANT_COLORS[p.quadrant] }}>
                          {p.quadrant}
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLines />
                {QUADRANTS.map((q) => {
                  const qData = byQuadrant.get(q) ?? [];
                  if (qData.length === 0) return null;
                  return (
                    <Scatter key={q} name={q} data={qData} fill={QUADRANT_COLORS[q]} fillOpacity={0.7} />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex items-center gap-3 mt-3 flex-wrap text-[10px]">
          {QUADRANTS.map((q) => (
            <span key={q} className="flex items-center gap-1.5 text-secondary-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: QUADRANT_COLORS[q] }} />
              {q}
            </span>
          ))}
        </div>
      </Card>

      {/* Auto-generated insight cards */}
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            Auto-Generated Insights
          </h3>
          <p className="text-[11px] text-tertiary mt-0.5">Computed by sp_detect_governance_anomalies() nightly pipeline</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {insights.length === 0 ? (
            <div className="col-span-full text-center text-xs text-tertiary py-8">No insights generated for current filters.</div>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={
                  insight.severity === "critical" ? "border-red-900/50" :
                  insight.severity === "warning" ? "border-amber-900/40" :
                  "border-emerald-900/40"
                }
                bodyClassName="p-4"
              >
                <div className="flex items-start gap-2 mb-2">
                  <span
                    className={cn(
                      "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border",
                      insight.severity === "critical" ? "bg-red-950 text-red-300 border-red-900/60" :
                      insight.severity === "warning" ? "bg-amber-950 text-amber-300 border-amber-900/60" :
                      "bg-emerald-950 text-emerald-400 border-emerald-900/60"
                    )}
                  >
                    {insight.type}
                  </span>
                  <span className="text-[10px] font-mono text-tertiary ml-auto">{insight.count} districts</span>
                </div>
                <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">{insight.title}</h4>
                <p className="text-[11px] text-secondary-muted leading-relaxed">{insight.detail}</p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* District ranking table */}
      <Card title="District Quadrant Classification" subtitle="Click any district to drill into block-level view" bodyClassName="p-0">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0">
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">District (LGD)</th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">State</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Util %</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Anomalies</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Z-score</th>
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Quadrant</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p: InsightPoint) => (
                <tr key={p.lgd_code} className="border-b border-subtle hover:bg-surface-hover">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{p.district_name}</div>
                    <div className="text-[10px] text-tertiary font-mono">LGD {p.lgd_code}</div>
                  </td>
                  <td className="px-3 py-2.5 text-secondary-muted">{p.state_name}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={p.util_pct >= 70 ? "text-emerald-400" : p.util_pct >= 50 ? "text-amber-300" : "text-red-300"}>
                      {p.util_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={p.critical_count > 0 ? "text-red-300" : "text-secondary-muted"}>{p.anomaly_count}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-purple-300">{p.z_score.toFixed(2)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border"
                      style={{
                        background: QUADRANT_COLORS[p.quadrant] + "30",
                        color: QUADRANT_COLORS[p.quadrant],
                        borderColor: QUADRANT_COLORS[p.quadrant] + "60",
                      }}
                    >
                      {p.quadrant}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => openDistrict(p.lgd_code)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300"
                    >
                      Drill →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ReferenceLines() {
  return (
    <>
      {/* Vertical reference line at util=50% */}
      <line x1={50} y1={0} x2={50} y2={400} stroke="#374151" strokeDasharray="4 4" strokeWidth={0.5} />
      <line x1={70} y1={0} x2={70} y2={400} stroke="#374151" strokeDasharray="4 4" strokeWidth={0.5} />
      <line x1={0} y1={1} x2={100} y2={1} stroke="#374151" strokeDasharray="4 4" strokeWidth={0.5} />
      <line x1={0} y1={2} x2={100} y2={2} stroke="#374151" strokeDasharray="4 4" strokeWidth={0.5} />
    </>
  );
}
