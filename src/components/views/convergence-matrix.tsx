"use client";

import {
  GitMerge,
  Download,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import { useApp, PageHeader, Card } from "@/components/app-shell";
import { useConvergenceMatrix, type ConvergenceRow } from "@/lib/api/hooks";
import { fmtCr } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

export function ConvergenceMatrixView() {
  const filters = useApp((s) => s.filters);
  const openDistrict = useApp((s) => s.openDistrict);
  const setView = useApp((s) => s.setView);
  const { data, isLoading } = useConvergenceMatrix(filters.stateLgd);
  const rows = data?.rows ?? [];
  const summary = data?.summary;

  function colorForUtil(v: number) {
    if (v < 40) return "#7F1D1D";
    if (v < 55) return "#B45309";
    if (v < 70) return "#A16207";
    if (v < 85) return "#15803D";
    return "#14532D";
  }
  function textColor(v: number) {
    return v >= 70 ? "#86EFAC" : v >= 50 ? "#FDE68A" : "#FCA5A5";
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Convergence & Overlap Matrix"
        subtitle="Cross-scheme overlap and gap analysis: identifies districts with high wage demand overlapping lagging asset completion."
        icon={GitMerge}
        actions={
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-xs text-secondary-muted hover:text-white flex items-center gap-1.5 transition-colors">
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setView("convergence-compare")}
              className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              Side-by-side Compare
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card bodyClassName="p-3">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">Districts Analyzed</div>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-tertiary mt-2" /> : (
            <div className="text-xl font-bold text-white font-mono mt-1">{summary?.total ?? 0}</div>
          )}
        </Card>
        <Card bodyClassName="p-3" className="border-red-900/50">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">High-Overlap Districts</div>
          <div className="text-xl font-bold text-red-300 font-mono mt-1">{summary?.overlap_high ?? 0}</div>
          <div className="text-[10px] text-tertiary mt-0.5">≥70% MGNREGA + &lt;40% PMAY-G</div>
        </Card>
        <Card bodyClassName="p-3" className="border-amber-900/40">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">Gap Districts</div>
          <div className="text-xl font-bold text-amber-300 font-mono mt-1">{summary?.gap ?? 0}</div>
          <div className="text-[10px] text-tertiary mt-0.5">Both schemes underperforming</div>
        </Card>
        <Card bodyClassName="p-3" className="border-emerald-900/40">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">Stable Districts</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">{summary?.stable ?? 0}</div>
          <div className="text-[10px] text-tertiary mt-0.5">≥70% on both metrics</div>
        </Card>
      </div>

      {/* Matrix table */}
      <Card
        title="Bivariate Convergence Matrix"
        subtitle="MGNREGA fund utilization × PMAY-G milestone completion · sorted by deviation"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium sticky left-0 bg-app z-10">District (LGD)</th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">State</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">MGNREGA Util%</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">PM-KISAN Util%</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">PMAY-G Completion%</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Deviation Score</th>
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Convergence Flag</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-tertiary text-xs">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Loading convergence matrix from /api/convergence…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-tertiary text-xs">No districts in scope.</td></tr>
              ) : (
                rows.map((r: ConvergenceRow) => (
                  <tr key={r.lgd_code} className="border-b border-subtle hover:bg-surface-hover transition-colors">
                    <td className="px-3 py-2.5 sticky left-0 bg-surface-elevated z-10">
                      <div className="text-white font-medium">{r.entity_name}</div>
                      <div className="text-[10px] text-tertiary font-mono">LGD {r.lgd_code}</div>
                    </td>
                    <td className="px-3 py-2.5 text-secondary-muted">{r.state_name}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span style={{ color: textColor(r.mgnrega_util) }}>{r.mgnrega_util.toFixed(1)}%</span>
                      <div className="h-1 mt-1 rounded-full overflow-hidden" style={{ background: "#1F2937" }}>
                        <div className="h-full" style={{ width: `${r.mgnrega_util}%`, background: colorForUtil(r.mgnrega_util) }} />
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span style={{ color: textColor(r.pmkisan_util) }}>{r.pmkisan_util.toFixed(1)}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span style={{ color: textColor(r.pmayg_completion) }}>{r.pmayg_completion.toFixed(1)}%</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-300">{r.deviation_score.toFixed(1)}</td>
                    <td className="px-3 py-2.5 text-center">
                      <ConvergenceFlag flag={r.flag} />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => openDistrict(r.lgd_code)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                      >
                        Drill
                        <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explanation footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card bodyClassName="p-4" className="border-red-900/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-white">OVERLAP_HIGH</span>
          </div>
          <p className="text-[11px] text-secondary-muted leading-relaxed">
            District exhibits ≥70% MGNREGA fund utilization (high wage disbursement) alongside ≤40% PMAY-G milestone completion — administrative blocks where high labor demand is not translating to durable asset creation.
          </p>
        </Card>
        <Card bodyClassName="p-4" className="border-amber-900/40">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-semibold text-white">GAP</span>
          </div>
          <p className="text-[11px] text-secondary-muted leading-relaxed">
            Both schemes underperforming (&lt;40% on both axes) — typically indicates systemic administrative capacity deficit or reporting failures at the Block Development Officer level.
          </p>
        </Card>
        <Card bodyClassName="p-4" className="border-emerald-900/40">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold text-white">STABLE</span>
          </div>
          <p className="text-[11px] text-secondary-muted leading-relaxed">
            Both schemes ≥70% — well-converged districts suitable as reference benchmarks for cross-state best-practice replication studies.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ConvergenceFlag({ flag }: { flag: string }) {
  const map: Record<string, string> = {
    OVERLAP_HIGH: "bg-red-950 text-red-300 border-red-900/60",
    GAP: "bg-amber-950 text-amber-300 border-amber-900/60",
    MIXED: "bg-slate-800 text-slate-300 border-slate-700",
    STABLE: "bg-emerald-950 text-emerald-400 border-emerald-900/60",
  };
  return (
    <span className={cn("text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border", map[flag])}>
      {flag.replace(/_/g, " ")}
    </span>
  );
}
