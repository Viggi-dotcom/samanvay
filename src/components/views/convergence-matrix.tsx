"use client";

import { useMemo, useState } from "react";
import {
  GitMerge,
  Download,
  TrendingUp,
  TrendingDown,
  AlertOctagon,
  MapPin,
  ArrowUpRight,
} from "lucide-react";
import { useApp, PageHeader, Card } from "@/components/app-shell";
import {
  DISTRICTS,
  STATES,
  ALLOCATIONS,
  BENEFICIARIES,
  SCHEMES,
  ANOMALIES,
} from "@/lib/data";

export function ConvergenceMatrixView() {
  const filters = useApp((s) => s.filters);
  const openDistrict = useApp((s) => s.openDistrict);
  const setView = useApp((s) => s.setView);

  type CellFlag = "OVERLAP_HIGH" | "GAP" | "MIXED" | "STABLE";
  interface Row {
    district: (typeof DISTRICTS)[number];
    state: string;
    mgnregaUtil: number;
    pmkisanUtil: number;
    pmaygUtil: number;
    mgnregaBen: number;
    pmkisanBen: number;
    pmaygTarget: number;
    pmaygAchieved: number;
    flag: CellFlag;
    deviationScore: number;
  }

  const rows = useMemo<Row[]>(() => {
    const dists = DISTRICTS.filter(
      (d) => !filters.stateLgd || d.state_lgd === filters.stateLgd
    );
    return dists
      .map((d) => {
        const stateName =
          STATES.find((s) => s.lgd_code === d.state_lgd)?.entity_name ?? "";
        function util(schemeId: string) {
          const a = ALLOCATIONS.filter(
            (x) => x.lgd_code === d.lgd_code && x.scheme_id === schemeId
          );
          const released = a.reduce((s, x) => s + x.released_cr, 0);
          const utilized = a.reduce((s, x) => s + x.utilized_cr, 0);
          return released > 0 ? (utilized / released) * 100 : 0;
        }
        const mgnregaUtil = util("sch-mgnrega");
        const pmkisanUtil = util("sch-pmkisan");
        const pmaygUtil = util("sch-pmayg");
        const mgnregaBen =
          BENEFICIARIES.find(
            (b) => b.lgd_code === d.lgd_code && b.scheme_id === "sch-mgnrega"
          )?.beneficiaries_total ?? 0;
        const pmkisanBen =
          BENEFICIARIES.find(
            (b) => b.lgd_code === d.lgd_code && b.scheme_id === "sch-pmkisan"
          )?.beneficiaries_total ?? 0;
        const pmayg =
          BENEFICIARIES.find(
            (b) => b.lgd_code === d.lgd_code && b.scheme_id === "sch-pmayg"
          ) ?? null;

        // bivariate: high MGNREGA demand (high util) + low PMAY-G completion
        const pmaygCompletion =
          pmayg && pmayg.target_units > 0
            ? (pmayg.achieved_units / pmayg.target_units) * 100
            : 0;
        let flag: CellFlag = "STABLE";
        if (mgnregaUtil >= 70 && pmaygCompletion < 40) flag = "OVERLAP_HIGH";
        else if (mgnregaUtil < 40 && pmaygCompletion < 40) flag = "GAP";
        else if (mgnregaUtil >= 70 && pmaygCompletion >= 70) flag = "STABLE";
        else flag = "MIXED";

        const deviationScore = Math.abs(mgnregaUtil - pmaygCompletion);

        return {
          district: d,
          state: stateName,
          mgnregaUtil,
          pmkisanUtil,
          pmaygUtil,
          mgnregaBen,
          pmkisanBen,
          pmaygTarget: pmayg?.target_units ?? 0,
          pmaygAchieved: pmayg?.achieved_units ?? 0,
          flag,
          deviationScore,
        };
      })
      .sort((a, b) => b.deviationScore - a.deviationScore);
  }, [filters.stateLgd]);

  const overlapCount = rows.filter((r) => r.flag === "OVERLAP_HIGH").length;
  const gapCount = rows.filter((r) => r.flag === "GAP").length;

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
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">
            Districts Analyzed
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {rows.length}
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-red-900/50">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">
            High-Overlap Districts
          </div>
          <div className="text-xl font-bold text-red-300 font-mono mt-1">
            {overlapCount}
          </div>
          <div className="text-[10px] text-tertiary mt-0.5">
            ≥80% MGNREGA + ≤40% PMAY-G
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-amber-900/40">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">
            Gap Districts
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono mt-1">
            {gapCount}
          </div>
          <div className="text-[10px] text-tertiary mt-0.5">
            Both schemes underperforming
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-emerald-900/40">
          <div className="text-[10px] uppercase tracking-wider text-secondary-muted">
            Stable Districts
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {rows.filter((r) => r.flag === "STABLE").length}
          </div>
          <div className="text-[10px] text-tertiary mt-0.5">
            ≥70% on both metrics
          </div>
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
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium sticky left-0 bg-app z-10">
                  District (LGD)
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  State
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  MGNREGA Util%
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  PM-KISAN Util%
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  PMAY-G Completion%
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Deviation Score
                </th>
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Convergence Flag
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.district.lgd_code}
                  className="border-b border-subtle hover:bg-surface-hover transition-colors"
                >
                  <td className="px-3 py-2.5 sticky left-0 bg-surface-elevated z-10">
                    <div className="text-white font-medium">
                      {r.district.entity_name}
                    </div>
                    <div className="text-[10px] text-tertiary font-mono">
                      LGD {r.district.lgd_code}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-secondary-muted">
                    {r.state}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span style={{ color: textColor(r.mgnregaUtil) }}>
                      {r.mgnregaUtil.toFixed(1)}%
                    </span>
                    <div
                      className="h-1 mt-1 rounded-full overflow-hidden"
                      style={{ background: "#1F2937" }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${r.mgnregaUtil}%`,
                          background: colorForUtil(r.mgnregaUtil),
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span style={{ color: textColor(r.pmkisanUtil) }}>
                      {r.pmkisanUtil.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span style={{ color: textColor(r.pmaygUtil) }}>
                      {r.pmaygUtil.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-amber-300">
                    {r.deviationScore.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <ConvergenceFlag flag={r.flag} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => openDistrict(r.district.lgd_code)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      Drill
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Explanation footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card bodyClassName="p-4" className="border-red-900/40">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="h-4 w-4 text-red-400" />
            <span className="text-xs font-semibold text-white">
              OVERLAP_HIGH
            </span>
          </div>
          <p className="text-[11px] text-secondary-muted leading-relaxed">
            District exhibits ≥80% MGNREGA fund utilization (high wage disbursement) alongside ≤40% PMAY-G milestone completion — indicating administrative blocks where high labor demand is not translating to durable asset creation.
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
    <span
      className={
        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border " +
        map[flag]
      }
    >
      {flag.replace(/_/g, " ")}
    </span>
  );
}
