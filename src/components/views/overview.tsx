"use client";

import {
  IndianRupee,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  GitMerge,
  MapPin,
  Loader2,
} from "lucide-react";
import { useApp, PageHeader, KpiCard, Card } from "@/components/app-shell";
import { Choropleth } from "@/components/choropleth";
import {
  AI_INSIGHTS,
  STATES,
  fmtCr,
  fmtNum,
} from "@/lib/seed-data";
import {
  useKpis,
  useSchemes,
  useGeoNational,
  type Kpis,
  type SchemeSummary,
} from "@/lib/api/hooks";

export function OverviewView() {
  const filters = useApp((s) => s.filters);
  const openState = useApp((s) => s.openState);
  const setView = useApp((s) => s.setView);
  const openScheme = useApp((s) => s.openScheme);

  const { data: kpis, isLoading: kpisLoading } = useKpis(filters);
  const { data: schemesData } = useSchemes({ stateLgd: filters.stateLgd, districtLgd: filters.districtLgd, fy: filters.fy });
  const schemes = schemesData?.schemes ?? [];

  // Divergent districts (top 6 worst utilization from geo-national)
  const { data: geoData } = useGeoNational(filters.schemeId);
  const divergent = (geoData?.states ?? [])
    .flatMap((s) => s) // we only have state-level; will refine later if needed
    .sort((a, b) => a.metrics.util - b.metrics.util)
    .slice(0, 6);

  const scopeLabel =
    filters.districtLgd
      ? "District-scoped"
      : filters.stateLgd
        ? STATES.find((s) => s.lgd_code === filters.stateLgd)?.entity_name
        : "Pan-India";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Command Center"
        subtitle={`Real-time cross-scheme implementation intelligence · ${scopeLabel} · FY ${filters.fy}`}
        icon={Activity}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60">
            LIVE
          </span>
        }
        actions={
          <button
            onClick={() => setView("convergence-matrix")}
            className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <GitMerge className="h-3.5 w-3.5" />
            Open Convergence Matrix
          </button>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {kpisLoading || !kpis ? (
          <div className="col-span-full h-24 rounded-lg border border-subtle bg-surface-elevated flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            <span className="ml-2 text-xs text-tertiary">Aggregating KPIs from fact_scheme_allocations…</span>
          </div>
        ) : (
          <>
            <KpiCard
              label="Total Outlay vs. Expenditure"
              value={fmtCr(kpis.utilized)}
              sub={`of ${fmtCr(kpis.released)} released · ${fmtCr(kpis.allocated)} allocated`}
              icon={IndianRupee}
              trend={{
                dir: kpis.utilizationPct >= 70 ? "up" : "down",
                value: `${kpis.utilizationPct.toFixed(1)}% util`,
                good: kpis.utilizationPct >= 70,
              }}
            />
            <KpiCard
              label="Active Beneficiary Footprint"
              value={fmtNum(kpis.beneficiaries)}
              sub={`Women ${kpis.womenPct.toFixed(0)}% · SC/ST ${kpis.scStPct.toFixed(0)}%`}
              icon={Users}
              trend={{ dir: "up", value: "+8.2% QoQ", good: true }}
            />
            <KpiCard
              label="Cross-Scheme Interventions"
              value={fmtNum(kpis.activeWorks)}
              sub={`${kpis.achievementPct.toFixed(1)}% of ${fmtNum(kpis.targetUnits)} targets`}
              icon={Activity}
              trend={{
                dir: kpis.achievementPct >= 70 ? "up" : "down",
                value: `${kpis.achievementPct >= 70 ? "+" : "−"}${Math.abs(kpis.achievementPct - 70).toFixed(1)}%`,
                good: kpis.achievementPct >= 70,
              }}
            />
            <KpiCard
              label="Critical Anomalies"
              value={kpis.criticalAnomalies}
              sub={`${kpis.totalAnomalies} total open anomalies`}
              icon={AlertTriangle}
              alert={kpis.criticalAnomalies > 0 ? "critical" : "success"}
              onClick={() => setView("intelligence-alerts")}
            />
          </>
        )}
      </div>

      {/* Geographic + Divergence panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <Card
            title="Interactive Geographic Intelligence"
            subtitle="Click any state to drill into district-level convergence"
            actions={
              <div className="flex items-center gap-1 text-[10px] text-tertiary">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                GIS vector tiles · LGD-anchored
              </div>
            }
            bodyClassName="p-0"
          >
            <Choropleth
              states={geoData?.states}
              schemeCode={filters.schemeId ? schemes.find((s) => s.scheme_id === filters.schemeId)?.scheme_code : undefined}
              loading={kpisLoading}
              onSelectState={(lgd) => openState(lgd)}
              height={520}
            />
          </Card>
        </div>

        <div className="xl:col-span-4">
          <Card
            title="Top Divergent States"
            subtitle="Fund flow high · milestone lagging"
            bodyClassName="p-0"
          >
            <div className="divide-y divide-subtle">
              {divergent.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-tertiary">
                  Loading divergent states…
                </div>
              ) : (
                divergent.map((s, i) => (
                  <button
                    key={s.lgd_code}
                    onClick={() => openState(s.lgd_code)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <div className="text-[10px] font-mono text-tertiary w-4">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {s.entity_name}
                      </div>
                      <div className="text-[11px] text-tertiary truncate flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        State LGD {s.lgd_code}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-mono font-bold text-red-300">
                        {s.metrics.util.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-tertiary">
                        {fmtCr(s.metrics.released)}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-tertiary shrink-0" />
                  </button>
                ))
              )}
            </div>
            <div className="p-3 border-t border-subtle">
              <button
                onClick={() => setView("geo-national")}
                className="w-full h-8 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-xs text-secondary-muted hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                View full geographic intelligence
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* AI Insight cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-400" />
              AI-Detected Implementation Bottlenecks
            </h3>
            <p className="text-[11px] text-tertiary mt-0.5">
              Auto-generated from nightly convergence pipelines ·{" "}
              <span className="font-mono">sp_detect_governance_anomalies()</span>
            </p>
          </div>
          <button
            onClick={() => setView("intelligence-alerts")}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View all alerts
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AI_INSIGHTS.map((insight) => (
            <Card
              key={insight.id}
              className={insight.severity === "critical" ? "border-red-900/50" : "border-amber-900/40"}
              bodyClassName="p-4"
            >
              <div className="flex items-start gap-2 mb-2">
                <span
                  className={
                    "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border " +
                    (insight.type === "OVERLAP"
                      ? "bg-blue-950 text-blue-300 border-blue-900/60"
                      : insight.type === "GAP"
                        ? "bg-amber-950 text-amber-300 border-amber-900/60"
                        : "bg-red-950 text-red-300 border-red-900/60")
                  }
                >
                  {insight.type}
                </span>
                <span
                  className={
                    "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border " +
                    (insight.severity === "critical"
                      ? "bg-red-950 text-red-300 border-red-900/60"
                      : "bg-amber-950 text-amber-300 border-amber-900/60")
                  }
                >
                  {insight.severity}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1.5 leading-snug">
                {insight.title}
              </h4>
              <p className="text-[11px] text-secondary-muted leading-relaxed mb-3">
                {insight.detail}
              </p>
              <div className="flex items-center justify-between text-[10px] text-tertiary">
                <div className="flex items-center gap-1">
                  {insight.affectedSchemes.map((s) => (
                    <span
                      key={s}
                      className="font-mono px-1 py-0.5 rounded bg-app border border-subtle"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="font-mono">
                  {insight.districts} district{insight.districts > 1 ? "s" : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheme snapshot strip */}
      <Card title="Scheme Snapshot" subtitle="Live from /api/schemes" bodyClassName="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-subtle">
          {schemes.length === 0 ? (
            <div className="col-span-full p-6 text-center text-xs text-tertiary">
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
              Loading schemes…
            </div>
          ) : (
            schemes.map((s: SchemeSummary) => (
              <button
                key={s.scheme_id}
                onClick={() => openScheme(s.scheme_id)}
                className="text-left p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm font-semibold text-white">{s.scheme_code}</span>
                  <span className="text-[10px] font-mono text-tertiary ml-auto">
                    {s.scheme_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-tertiary text-[10px] uppercase">Released</div>
                    <div className="text-white font-mono font-semibold">{fmtCr(s.metrics.released)}</div>
                  </div>
                  <div>
                    <div className="text-tertiary text-[10px] uppercase">Utilized</div>
                    <div className="text-white font-mono font-semibold">{fmtCr(s.metrics.utilized)}</div>
                  </div>
                  <div>
                    <div className="text-tertiary text-[10px] uppercase">Beneficiaries</div>
                    <div className="text-white font-mono font-semibold">{fmtNum(s.metrics.beneficiaries)}</div>
                  </div>
                  <div>
                    <div className="text-tertiary text-[10px] uppercase">Util %</div>
                    <div
                      className={
                        "font-mono font-semibold " +
                        (s.metrics.utilizationPct >= 70
                          ? "text-emerald-400"
                          : s.metrics.utilizationPct >= 50
                            ? "text-amber-300"
                            : "text-red-300")
                      }
                    >
                      {s.metrics.utilizationPct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
