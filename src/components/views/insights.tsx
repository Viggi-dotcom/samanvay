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
  UNDERPERFORMING: "#D97706",
  STABLE: "#64748B",
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

  const byQuadrant = new Map<string, InsightPoint[]>();
  for (const q of QUADRANTS) byQuadrant.set(q, []);
  for (const p of points) {
    const arr = byQuadrant.get(p.quadrant) ?? [];
    arr.push(p);
    byQuadrant.set(p.quadrant, arr);
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="AI Insight Engine"
        subtitle="Nightly anomaly detection · Z-score scatter analysis · quadrant classification of all districts."
        icon={Brain}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 shadow-xs">
            <Zap className="h-3.5 w-3.5 text-purple-700" />
            NIGHTLY PIPELINE
          </span>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
        {isLoading ? (
          <div className="col-span-full h-24 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-[#0B4F9C] animate-spin" />
            <span className="ml-3 text-sm text-gray-500 font-medium">Computing Z-scores across all districts…</span>
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
        bodyClassName="p-6"
      >
        <div className="h-[420px]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 30 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="util_pct"
                  name="Utilization %"
                  domain={[0, 100]}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  stroke="#CBD5E1"
                  label={{ value: "Utilization %", position: "insideBottom", offset: -25, fill: "#334155", fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  type="number"
                  dataKey="anomaly_count"
                  name="Anomaly Count"
                  tick={{ fill: "#475569", fontSize: 11 }}
                  stroke="#CBD5E1"
                  label={{ value: "Open Anomalies", angle: -90, position: "insideLeft", fill: "#334155", fontSize: 12, fontWeight: 600 }}
                />
                <ZAxis type="number" dataKey="critical_count" range={[60, 450]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3", stroke: "#94A3B8" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as InsightPoint;
                    return (
                      <div className="rounded-lg bg-white border border-gray-200 shadow-xl p-3.5 space-y-1 z-50">
                        <div className="text-sm font-bold text-gray-900">{p.district_name}</div>
                        <div className="text-xs text-gray-500 font-mono">{p.state_name} · LGD {p.lgd_code}</div>
                        <div className="text-xs text-[#0B4F9C] font-semibold mt-1">Util: {p.util_pct.toFixed(1)}%</div>
                        <div className="text-xs text-amber-800 font-semibold">Anomalies: {p.anomaly_count}</div>
                        <div className="text-xs text-purple-800 font-semibold">Z-score: {p.z_score.toFixed(2)}</div>
                        <div className="text-xs mt-1.5 inline-block px-2.5 py-0.5 rounded font-mono font-bold uppercase shadow-xs border" style={{ background: QUADRANT_COLORS[p.quadrant] + "15", color: QUADRANT_COLORS[p.quadrant], borderColor: QUADRANT_COLORS[p.quadrant] + "40" }}>
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
                    <Scatter key={q} name={q} data={qData} fill={QUADRANT_COLORS[q]} fillOpacity={0.8} />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="flex items-center gap-5 mt-4 flex-wrap text-xs font-semibold">
          {QUADRANTS.map((q) => (
            <span key={q} className="flex items-center gap-2 text-slate-700">
              <span className="h-3 w-3 rounded-full" style={{ background: QUADRANT_COLORS[q] }} />
              {q}
            </span>
          ))}
        </div>
      </Card>

      {/* Auto-generated insight cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="h-4.5 w-4.5 text-[#0B4F9C]" />
            Auto-Generated Insights
          </h3>
          <p className="text-xs text-slate-500 mt-1">Computed by <span className="font-mono text-[#0B4F9C] font-bold">sp_detect_governance_anomalies()</span> nightly pipeline</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {insights.length === 0 ? (
            <div className="col-span-full text-center text-sm text-slate-500 py-10">No insights generated for current filters.</div>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={
                  insight.severity === "critical"
                    ? "bg-white border border-red-200 border-l-4 border-l-red-600 shadow-xs"
                    : insight.severity === "warning"
                      ? "bg-white border border-amber-200 border-l-4 border-l-amber-500 shadow-xs"
                      : "bg-white border border-emerald-200 border-l-4 border-l-emerald-600 shadow-xs"
                }
                bodyClassName="p-5"
              >
                <div className="flex items-start gap-2 mb-3">
                  <span
                    className={cn(
                      "text-xs font-mono uppercase px-2.5 py-1 rounded-md border font-bold",
                      insight.severity === "critical" ? "bg-red-50 text-red-700 border-red-200" :
                      insight.severity === "warning" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}
                  >
                    {insight.type}
                  </span>
                  <span className="text-xs font-mono text-slate-500 ml-auto font-semibold">{insight.count} districts</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2 leading-snug">{insight.title}</h4>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{insight.detail}</p>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* District ranking table */}
      <Card title="District Quadrant Classification" subtitle="Click any district to drill into block-level view" bodyClassName="p-0">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-slate-200 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">District (LGD)</th>
                <th className="text-left px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">State</th>
                <th className="text-right px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">Util %</th>
                <th className="text-right px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">Anomalies</th>
                <th className="text-right px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">Z-score</th>
                <th className="text-center px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">Quadrant</th>
                <th className="text-right px-5 py-3.5 text-xs uppercase tracking-wider text-slate-700 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {points.map((p: InsightPoint) => (
                <tr key={p.lgd_code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="text-slate-900 font-semibold text-sm">{p.district_name}</div>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">LGD {p.lgd_code}</div>
                  </td>
                  <td className="px-5 py-4 text-slate-700 font-medium">{p.state_name}</td>
                  <td className="px-5 py-4 text-right font-mono font-bold">
                    <span className={p.util_pct >= 70 ? "text-emerald-700" : p.util_pct >= 50 ? "text-amber-700" : "text-red-700"}>
                      {p.util_pct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold">
                    <span className={p.critical_count > 0 ? "text-red-700" : "text-slate-700"}>{p.anomaly_count}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold text-indigo-700">{p.z_score.toFixed(2)}</td>
                  <td className="px-5 py-4 text-center">
                    <span
                      className="text-xs font-mono font-bold uppercase px-2.5 py-1 rounded-md border shadow-xs"
                      style={{
                        background: QUADRANT_COLORS[p.quadrant] + "20",
                        color: QUADRANT_COLORS[p.quadrant],
                        borderColor: QUADRANT_COLORS[p.quadrant] + "60",
                      }}
                    >
                      {p.quadrant}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => openDistrict(p.lgd_code)}
                      className="px-3 py-1.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
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
      <line x1={50} y1={0} x2={50} y2={400} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1} />
      <line x1={70} y1={0} x2={70} y2={400} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1} />
      <line x1={0} y1={1} x2={100} y2={1} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1} />
      <line x1={0} y1={2} x2={100} y2={2} stroke="#CBD5E1" strokeDasharray="4 4" strokeWidth={1} />
    </>
  );
}
