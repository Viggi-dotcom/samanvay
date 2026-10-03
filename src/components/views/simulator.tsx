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
    <div className="space-y-7">
      <PageHeader
        title="Convergence Simulator"
        subtitle="Predictive resource reallocation — what-if scenarios forecasting impact of redirecting underutilized funds across schemes."
        icon={FlaskConical}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 flex items-center gap-1.5 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#0B4F9C]" />
            WHAT-IF ENGINE
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card title="Scenario Configuration" subtitle="Define the cross-scheme reallocation parameters" bodyClassName="p-6">
          <form onSubmit={run} className="space-y-5">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-600 mb-1.5 block">Source scheme (reallocate FROM)</label>
              <select
                value={form.fromScheme}
                onChange={(e) => setForm({ ...form, fromScheme: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#0B4F9C] cursor-pointer"
              >
                {schemes.map((s) => (
                  <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_code}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-center">
              <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
                <ArrowRight className="h-4.5 w-4.5 text-[#0B4F9C]" />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-600 mb-1.5 block">Target scheme (reallocate TO)</label>
              <select
                value={form.toScheme}
                onChange={(e) => setForm({ ...form, toScheme: e.target.value })}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-semibold focus:outline-none focus:border-[#0B4F9C] cursor-pointer"
              >
                {schemes.map((s) => (
                  <option key={s.scheme_id} value={s.scheme_id}>{s.scheme_code}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-600 mb-1.5 block">Amount to reallocate (₹ Cr)</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={form.reallocateCr}
                onChange={(e) => setForm({ ...form, reallocateCr: Number(e.target.value) })}
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-[#0B4F9C] font-bold"
              />
              <div className="text-xs text-slate-500 mt-1 font-mono">Max ₹1,000 Cr per simulation run</div>
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-slate-600 mb-1.5 block">Target State LGD (optional)</label>
              <input
                type="number"
                value={form.targetStateLgd}
                onChange={(e) => setForm({ ...form, targetStateLgd: e.target.value })}
                placeholder="e.g. 10 for Bihar, 27 for UP"
                className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-[#0B4F9C]"
              />
            </div>
            <button
              type="submit"
              disabled={simulator.isPending}
              className="w-full h-11 rounded-xl bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {simulator.isPending ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  Simulating...
                </>
              ) : (
                <>
                  <FlaskConical className="h-4.5 w-4.5 text-white" />
                  Run Simulation
                </>
              )}
            </button>
          </form>
        </Card>

        {/* Results */}
        <div className="lg:col-span-2 space-y-6">
          {!result && !simulator.isPending && (
            <Card bodyClassName="p-14">
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-5 shadow-xs">
                  <FlaskConical className="h-8 w-8 text-[#0B4F9C]" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Run a what-if scenario</h3>
                <p className="text-xs md:text-sm text-slate-600 max-w-md leading-relaxed">
                  Configure a reallocation scenario on the left. The simulator will identify underutilized funds in the source scheme, project the impact on the target scheme's beneficiaries and asset completion, and estimate which anomalies might be resolved.
                </p>
              </div>
            </Card>
          )}

          {result && (
            <>
              {/* Impact KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <Card title="Baseline vs Projected Impact" subtitle={`${result.scenario.reallocateCr} Cr redirected from ${schemes.find(s => s.scheme_id === result.scenario.fromSchemeId)?.scheme_code} → ${schemes.find(s => s.scheme_id === result.scenario.toSchemeId)?.scheme_code}`} bodyClassName="p-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={6}>
                      <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#475569", fontSize: 11 }} stroke="#CBD5E1" />
                      <YAxis tick={{ fill: "#475569", fontSize: 11 }} stroke="#CBD5E1" />
                      <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 12, fontSize: 12, color: "#0F172A" }} cursor={{ fill: "#F1F5F9" }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Baseline" fill="#64748B" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Projected" fill="#0B4F9C" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Source scheme unused funds */}
              <Card title="Source Scheme: Underutilized Funds" subtitle={`${result.source_scheme.underutilized_districts} districts with util < 50%`} bodyClassName="p-0">
                <div className="divide-y divide-slate-200 bg-white">
                  {result.source_scheme.top_underutilized.map((d, i) => (
                    <div key={`${d.lgdCode}-${d.district}-${i}`} className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-900">{d.district}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">LGD {d.lgdCode} · {d.utilPct.toFixed(1)}% utilization</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-mono font-bold text-amber-700">₹{d.unusedCr.toFixed(1)} Cr</div>
                        <div className="text-xs text-slate-500 font-mono">underutilized</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Impact summary */}
              <Card title="Estimated Socio-Economic Impact" bodyClassName="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 shadow-xs">
                    <div className="text-slate-500 text-xs uppercase font-bold">Households Lifted</div>
                    <div className="text-slate-900 font-mono text-xl font-extrabold mt-1">{fmtNum(result.impact.estimated_households_lifted)}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 shadow-xs">
                    <div className="text-slate-500 text-xs uppercase font-bold">Districts Impacted</div>
                    <div className="text-slate-900 font-mono text-xl font-extrabold mt-1">{result.impact.estimated_districts_impacted}</div>
                  </div>
                </div>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 leading-relaxed font-medium">{result.disclaimer}</div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
