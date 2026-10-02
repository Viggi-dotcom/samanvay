"use client";

import { useState } from "react";
import {
  FlaskConical,
  ArrowRight,
  Loader2,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { useApp, PageHeader, Card, KpiCard } from "@/components/app-shell";
import { useSchemes, useSimulator, type SimulationResult } from "@/lib/api/hooks";
import { fmtCr, fmtNum } from "@/lib/seed-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SimulatorView() {
  const filters = useApp((s) => s.filters);
  const { data: schemesData } = useSchemes({ stateLgd: filters.stateLgd, districtLgd: filters.districtLgd, fy: filters.fy });
  const schemes = schemesData?.schemes ?? [];
  const simulator = useSimulator();
  const [form, setForm] = useState({
    fromScheme: "sch-mgnrega",
    toScheme: "sch-pmayg",
    reallocateCr: 100,
    targetStateLgd: filters.stateLgd ?? "",
  });
  const [result, setResult] = useState<SimulationResult | null>(null);

  function run(e: React.FormEvent) {
    e.preventDefault();
    if (form.fromScheme === form.toScheme) {
      toast.error("Source and target scheme must differ");
      return;
    }
    simulator.mutate(
      {
        fromScheme: form.fromScheme,
        toScheme: form.toScheme,
        reallocateCr: Number(form.reallocateCr),
        targetStateLgd: form.targetStateLgd ? Number(form.targetStateLgd) : null,
      },
      {
        onSuccess: (data) => {
          setResult(data);
          toast.success(`Simulation complete — ${data.impact.anomalies_potentially_resolved} anomalies potentially resolvable`);
        },
        onError: (err: any) => toast.error(`Simulation failed: ${err.message}`),
      }
    );
  }

  const chartData = result ? [
    {
      name: "Released (₹ Cr)",
      Baseline: Number(result.target_scheme.baseline.released.toFixed(1)),
      Projected: Number(result.target_scheme.projected.released.toFixed(1)),
    },
    {
      name: "Utilized (₹ Cr)",
      Baseline: Number(result.target_scheme.baseline.utilized.toFixed(1)),
      Projected: Number(result.target_scheme.projected.utilized.toFixed(1)),
    },
    {
      name: "Beneficiaries",
      Baseline: result.target_scheme.baseline.beneficiaries,
      Projected: result.target_scheme.projected.beneficiaries,
    },
    {
      name: "Achieved Units",
      Baseline: result.target_scheme.baseline.achieved_units,
      Projected: result.target_scheme.projected.achieved_units,
    },
  ] : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Convergence Simulator"
        subtitle="Predictive resource reallocation — what-if scenarios forecasting impact of redirecting underutilized funds across schemes."
        icon={FlaskConical}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-900/60 flex items-center gap-1">
            <Sparkles className="h-2.5 w-2.5" />
            WHAT-IF
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <Card title="Scenario Configuration" subtitle="Define the reallocation parameters" bodyClassName="p-4">
          <form onSubmit={run} className="space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1 block">Source scheme (reallocate FROM)</label>
              <select
                value={form.fromScheme}
                onChange={(e) => setForm({ ...form, fromScheme: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {schemes.map((s) => (
                  <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_code}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-center">
              <ArrowRight className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1 block">Target scheme (reallocate TO)</label>
              <select
                value={form.toScheme}
                onChange={(e) => setForm({ ...form, toScheme: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {schemes.map((s) => (
                  <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1 block">Amount to reallocate (₹ Cr)</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.reallocateCr}
                onChange={(e) => setForm({ ...form, reallocateCr: Number(e.target.value) })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
              <div className="text-[10px] text-tertiary mt-1">Max ₹1000 Cr per scenario</div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1 block">Target state (optional)</label>
              <input
                type="number"
                value={form.targetStateLgd}
                onChange={(e) => setForm({ ...form, targetStateLgd: e.target.value })}
                placeholder="e.g. 10 for Bihar"
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={simulator.isPending}
              className="w-full h-10 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {simulator.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4 w-4" />
                  Run Simulation
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {!result && !simulator.isPending && (
            <Card bodyClassName="p-12">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-purple-950/30 border border-purple-900/40 flex items-center justify-center mb-4">
                  <FlaskConical className="h-8 w-8 text-purple-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Run a what-if scenario</h3>
                <p className="text-xs text-tertiary max-w-md">
                  Configure a reallocation scenario on the left. The simulator will identify underutilized funds in the source scheme, project the impact on the target scheme's beneficiaries and asset completion, and estimate which anomalies might be resolved.
                </p>
              </div>
            </Card>
          )}

          {result && (
            <>
              {/* Impact KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard
                  label="Additional Beneficiaries"
                  value={fmtNum(result.target_scheme.delta.additional_beneficiaries)}
                  icon={Users}
                  trend={{ dir: "up", value: `+${fmtNum(result.target_scheme.projected.additional_beneficiaries)}`, good: true }}
                />
                <KpiCard
                  label="Additional Units"
                  value={fmtNum(result.target_scheme.delta.additional_units)}
                  icon={TrendingUp}
                  trend={{ dir: "up", value: `+${result.target_scheme.projected.additional_units}`, good: true }}
                />
                <KpiCard
                  label="Utilization Δ"
                  value={`${result.target_scheme.delta.utilization_pct >= 0 ? "+" : ""}${result.target_scheme.delta.utilization_pct.toFixed(1)}%`}
                  icon={result.target_scheme.delta.utilization_pct >= 0 ? TrendingUp : TrendingDown}
                  trend={{ dir: result.target_scheme.delta.utilization_pct >= 0 ? "up" : "down", value: `Δ ${result.target_scheme.delta.utilization_pct.toFixed(1)}pp`, good: result.target_scheme.delta.utilization_pct >= 0 }}
                />
                <KpiCard
                  label="Anomalies Resolvable"
                  value={result.impact.anomalies_potentially_resolved}
                  icon={CheckCircle2}
                  alert="success"
                />
              </div>

              {/* Comparison chart */}
              <Card title="Baseline vs Projected Impact" subtitle={`${result.scenario.reallocateCr} Cr redirected from ${schemes.find(s => s.scheme_id === result.scenario.fromSchemeId)?.scheme_code} → ${schemes.find(s => s.scheme_id === result.scenario.toSchemeId)?.scheme_code}`} bodyClassName="p-4">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 10 }} stroke="#374151" />
                      <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} stroke="#374151" />
                      <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }} cursor={{ fill: "#1F293780" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Baseline" fill="#6B7280" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Projected" fill="#A855F7" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Source scheme unused funds */}
              <Card title="Source Scheme: Underutilized Funds" subtitle={`${result.source_scheme.underutilized_districts} districts with util < 50%`} bodyClassName="p-0">
                <div className="divide-y divide-subtle">
                  {result.source_scheme.top_underutilized.map((d) => (
                    <div key={d.lgdCode} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{d.district}</div>
                        <div className="text-[10px] text-tertiary font-mono">LGD {d.lgdCode} · {d.utilPct.toFixed(1)}% utilization</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-amber-300">₹{d.unusedCr.toFixed(1)} Cr</div>
                        <div className="text-[10px] text-tertiary">unused</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Impact summary */}
              <Card title="Estimated Impact" bodyClassName="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md bg-app border border-subtle p-3">
                    <div className="text-tertiary text-[10px] uppercase">Households Lifted</div>
                    <div className="text-white font-mono text-lg mt-1">{fmtNum(result.impact.estimated_households_lifted)}</div>
                  </div>
                  <div className="rounded-md bg-app border border-subtle p-3">
                    <div className="text-tertiary text-[10px] uppercase">Districts Impacted</div>
                    <div className="text-white font-mono text-lg mt-1">{result.impact.estimated_districts_impacted}</div>
                  </div>
                </div>
                <div className="rounded-md bg-amber-950/30 border border-amber-900/40 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-200/80 leading-relaxed">{result.disclaimer}</div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
