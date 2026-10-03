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
    if (v < 40) return "#DC2626";
    if (v < 55) return "#D97706";
    if (v < 70) return "#EAB308";
    if (v < 85) return "#16A34A";
    return "#15803D";
  }

  function textColor(v: number) {
    return v >= 70 ? "#15803D" : v >= 50 ? "#B45309" : "#B91C1C";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Convergence & Overlap Matrix"
        subtitle="Cross-scheme overlap and gap analysis: identifies districts with high wage demand overlapping lagging asset completion."
        icon={GitMerge}
        actions={
          <div className="flex items-center gap-2.5">
            <button className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer">
              <Download className="h-4 w-4 text-[#0B4F9C]" />
              Export CSV
            </button>
            <button
              onClick={() => setView("convergence-compare")}
              className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              Side-by-Side Compare
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      {/* Stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bodyClassName="p-4.5">
          <div className="text-xs uppercase font-semibold tracking-wider text-gray-500">Districts Analyzed</div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-2" /> : (
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 font-mono mt-1">{summary?.total ?? 0}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">Multi-state LGD scope</div>
        </Card>
        <Card bodyClassName="p-4.5" className="border-red-200 bg-red-50/20">
          <div className="text-xs uppercase font-semibold tracking-wider text-red-700">High-Overlap Districts</div>
          <div className="text-2xl lg:text-3xl font-bold text-red-700 font-mono mt-1">{summary?.overlap_high ?? 0}</div>
          <div className="text-xs text-red-600/80 mt-1">≥70% MGNREGA + &lt;40% PMAY-G</div>
        </Card>
        <Card bodyClassName="p-4.5" className="border-amber-200 bg-amber-50/20">
          <div className="text-xs uppercase font-semibold tracking-wider text-amber-700">Gap Districts</div>
          <div className="text-2xl lg:text-3xl font-bold text-amber-700 font-mono mt-1">{summary?.gap ?? 0}</div>
          <div className="text-xs text-amber-600/80 mt-1">Both schemes underperforming</div>
        </Card>
        <Card bodyClassName="p-4.5" className="border-green-200 bg-green-50/20">
          <div className="text-xs uppercase font-semibold tracking-wider text-green-700">Stable Districts</div>
          <div className="text-2xl lg:text-3xl font-bold text-green-700 font-mono mt-1">{summary?.stable ?? 0}</div>
          <div className="text-xs text-green-600/80 mt-1">≥70% on both metrics</div>
        </Card>
      </div>

      {/* Matrix table */}
      <Card
        title="Bivariate Convergence Matrix"
        subtitle="MGNREGA fund utilization × PMAY-G milestone completion · sorted by deviation score"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold sticky left-0 bg-gray-50 z-10">District (LGD)</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">State</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">MGNREGA Util%</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">PM-KISAN Util%</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">PMAY-G Completion%</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Deviation Score</th>
                <th className="text-center px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Convergence Flag</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
                  Loading convergence matrix data…
                </td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-gray-500 text-sm">
                  No districts match the current filters.
                </td></tr>
              ) : (
                rows.map((r: ConvergenceRow) => (
                  <tr key={r.lgd_code} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5 sticky left-0 bg-white z-10">
                      <div className="font-semibold text-gray-900">{r.district_name}</div>
                      <div className="text-[11px] font-mono text-gray-500">LGD {r.lgd_code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">{r.state_name}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span style={{ color: textColor(r.mgnrega_util) }}>{r.mgnrega_util.toFixed(1)}%</span>
                      <div className="h-1.5 mt-1 rounded-full overflow-hidden bg-gray-100">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.mgnrega_util)}%`, background: colorForUtil(r.mgnrega_util) }} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span style={{ color: textColor(r.pmkisan_util) }}>{r.pmkisan_util.toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span style={{ color: textColor(r.pmayg_completion) }}>{r.pmayg_completion.toFixed(1)}%</span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-amber-700">{r.deviation_score.toFixed(1)}</td>
                    <td className="px-5 py-3.5 text-center">
                      <ConvergenceFlag flag={r.flag} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => openDistrict(r.lgd_code)}
                        className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0B4F9C] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card bodyClassName="p-4" className="border-red-200 bg-white">
          <div className="flex items-center gap-2 mb-1.5">
            <AlertOctagon className="h-4.5 w-4.5 text-red-600" />
            <span className="text-sm font-bold text-red-700">OVERLAP_HIGH</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            District exhibits ≥70% MGNREGA fund utilization alongside ≤40% PMAY-G completion — high labor allocation not converting to completed housing assets.
          </p>
        </Card>
        <Card bodyClassName="p-4" className="border-amber-200 bg-white">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingDown className="h-4.5 w-4.5 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">GAP</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Both schemes lagging (&lt;40% on both axes) — indicates systemic delivery or coverage bottlenecks requiring joint saturation camps.
          </p>
        </Card>
        <Card bodyClassName="p-4" className="border-green-200 bg-white">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="h-4.5 w-4.5 text-green-600" />
            <span className="text-sm font-bold text-green-700">STABLE</span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Both schemes ≥70% — high-performing districts achieving synchronized welfare delivery and physical milestones.
          </p>
        </Card>
      </div>
    </div>
  );
}

function ConvergenceFlag({ flag }: { flag: string }) {
  const map: Record<string, string> = {
    OVERLAP_HIGH: "bg-red-50 text-red-700 border-red-200",
    GAP: "bg-amber-50 text-amber-700 border-amber-200",
    MIXED: "bg-gray-100 text-gray-700 border-gray-200",
    STABLE: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span className={cn("text-xs font-semibold uppercase px-2 py-0.5 rounded border", map[flag] ?? "bg-gray-100 text-gray-700 border-gray-200")}>
      {flag.replace(/_/g, " ")}
    </span>
  );
}
