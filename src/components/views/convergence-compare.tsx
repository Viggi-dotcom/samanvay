"use client";

import { useMemo } from "react";
import {
  GitCompare,
  IndianRupee,
  Users,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useApp, PageHeader, Card } from "@/components/app-shell";
import {
  SCHEMES,
  ALLOCATIONS,
  BENEFICIARIES,
  aggregateKpis,
  fmtCr,
  fmtNum,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export function ConvergenceCompareView() {
  const filters = useApp((s) => s.filters);

  const perScheme = useMemo(
    () =>
      SCHEMES.map((s) => {
        const k = aggregateKpis({
          schemeId: s.scheme_id,
          stateLgd: filters.stateLgd,
          districtLgd: filters.districtLgd,
          fy: filters.fy,
        });
        return {
          scheme: s,
          released: k.released,
          allocated: k.allocated,
          utilized: k.utilized,
          utilizationPct: k.utilizationPct,
          beneficiaries: k.beneficiaries,
          womenPct: k.womenPct,
          scStPct: k.scStPct,
          targetUnits: k.targetUnits,
          achievedUnits: k.activeWorks,
          achievementPct: k.achievementPct,
        };
      }),
    [filters]
  );

  const chartData = perScheme.map((p) => ({
    name: p.scheme.scheme_code,
    Released: Number(p.released.toFixed(1)),
    Utilized: Number(p.utilized.toFixed(1)),
    Allocated: Number(p.allocated.toFixed(1)),
    color: p.scheme.color,
  }));

  // Beneficiary demographic distribution per scheme
  const demoData = perScheme.map((p) => ({
    name: p.scheme.scheme_code,
    Women: Number(((p.womenPct / 100) * p.beneficiaries).toFixed(0)),
    SC_ST: Number(((p.scStPct / 100) * p.beneficiaries).toFixed(0)),
    Other: Number(
      (((100 - p.womenPct - p.scStPct) / 100) * p.beneficiaries).toFixed(0)
    ),
    color: p.scheme.color,
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scheme Comparison Workbench"
        subtitle="Side-by-side multi-scheme metric comparison · release velocity, utilization, and beneficiary demographics."
        icon={GitCompare}
      />

      {/* Side-by-side scheme cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {perScheme.map((p) => (
          <Card
            key={p.scheme.scheme_id}
            bodyClassName="p-0"
            className="overflow-hidden"
          >
            {/* Scheme header */}
            <div
              className="h-1.5"
              style={{ background: p.scheme.color }}
            />
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-mono text-tertiary uppercase">
                    {p.scheme.scheme_type.replace(/_/g, " ")}
                  </div>
                  <h3 className="text-sm font-semibold text-white mt-0.5">
                    {p.scheme.scheme_code}
                  </h3>
                  <div className="text-[11px] text-secondary-muted mt-0.5 line-clamp-1">
                    {p.scheme.scheme_name}
                  </div>
                </div>
                <div
                  className="h-9 w-9 rounded-md flex items-center justify-center text-xs font-mono font-bold"
                  style={{
                    background: p.scheme.color + "20",
                    color: p.scheme.color,
                    border: `1px solid ${p.scheme.color}40`,
                  }}
                >
                  {p.scheme.scheme_code.slice(0, 2)}
                </div>
              </div>

              <div className="space-y-2.5">
                <CompareRow
                  icon={IndianRupee}
                  label="Allocated → Released → Utilized"
                  value={`${fmtCr(p.allocated)} → ${fmtCr(p.released)} → ${fmtCr(p.utilized)}`}
                />
                <div className="rounded-md bg-app border border-subtle p-2.5">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-tertiary">Utilization</span>
                    <span
                      className={cn(
                        "font-mono font-bold",
                        p.utilizationPct >= 70
                          ? "text-emerald-400"
                          : p.utilizationPct >= 50
                            ? "text-amber-300"
                            : "text-red-300"
                      )}
                    >
                      {p.utilizationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-surface-hover">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(p.utilizationPct, 100)}%`,
                        background: p.scheme.color,
                      }}
                    />
                  </div>
                </div>
                <CompareRow
                  icon={Users}
                  label="Beneficiaries"
                  value={fmtNum(p.beneficiaries)}
                  sub={`Women ${p.womenPct.toFixed(0)}% · SC/ST ${p.scStPct.toFixed(0)}%`}
                />
                <CompareRow
                  icon={Target}
                  label="Target vs Achieved"
                  value={`${fmtNum(p.achievedUnits)} / ${fmtNum(p.targetUnits)}`}
                  sub={`${p.achievementPct.toFixed(1)}% milestone completion`}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart: financial flows */}
      <Card
        title="Financial Flow Comparison"
        subtitle="Allocated · Released · Utilized across schemes"
        bodyClassName="p-4"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                stroke="#374151"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                stroke="#374151"
                label={{
                  value: "₹ Cr",
                  angle: -90,
                  position: "insideLeft",
                  fill: "#6B7280",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                cursor={{ fill: "#1F293780" }}
              />
              <Bar dataKey="Allocated" fill="#4B5563" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Released" fill="#06B6D4" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Utilized" fill="#2563EB" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <Legend color="#4B5563" label="Allocated" />
          <Legend color="#06B6D4" label="Released" />
          <Legend color="#2563EB" label="Utilized" />
        </div>
      </Card>

      {/* Chart: beneficiary demographics */}
      <Card
        title="Beneficiary Demographic Distribution"
        subtitle="Inclusion metrics across schemes"
        bodyClassName="p-4"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoData} barGap={2}>
              <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                stroke="#374151"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                stroke="#374151"
              />
              <Tooltip
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 6,
                  fontSize: 11,
                }}
                cursor={{ fill: "#1F293780" }}
              />
              <Bar dataKey="Women" stackId="a" fill="#06B6D4" />
              <Bar dataKey="SC_ST" stackId="a" fill="#8B5CF6" />
              <Bar dataKey="Other" stackId="a" fill="#374151" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px]">
          <Legend color="#06B6D4" label="Women" />
          <Legend color="#8B5CF6" label="SC / ST" />
          <Legend color="#374151" label="Other beneficiaries" />
        </div>
      </Card>

      {/* Methodology */}
      <Card
        title="Methodology & Convergence Logic"
        bodyClassName="p-4 text-xs text-secondary-muted leading-relaxed space-y-2"
      >
        <p>
          <span className="text-white font-medium">Release velocity ratio</span> is computed as
          <code className="font-mono text-cyan-300 px-1"> released_cr / allocated_cr</code>,
          quantifying the central treasury disbursement speed for each scheme.
          Ratios &lt; 0.7 indicate pipeline friction warranting nodal ministry escalation.
        </p>
        <p>
          <span className="text-white font-medium">Convergence gap score</span> measures the
          standard deviation between MGNREGA utilization and PMAY-G completion across LGD
          blocks — values &gt; 30 are flagged in the matrix view as divergence requiring
          Block Development Officer audit.
        </p>
        <p>
          All comparisons are scoped to the active fiscal year and the selected LGD
          jurisdiction. When a District Magistrate session is active, comparisons auto-narrow
          to their assigned district per PostgreSQL Row-Level Security policy
          <code className="font-mono text-cyan-300 px-1">p_dm_read_local_geography</code>.
        </p>
      </Card>
    </div>
  );
}

function CompareRow({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-tertiary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-tertiary">
          {label}
        </div>
        <div className="text-xs text-white font-mono">{value}</div>
        {sub && <div className="text-[10px] text-tertiary mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-tertiary">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}
