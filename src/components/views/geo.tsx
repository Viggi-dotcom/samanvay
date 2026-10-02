"use client";

import {
  Globe2,
  MapPin,
  Building2,
  ArrowLeft,
  ArrowRight,
  Users,
  IndianRupee,
  Layers,
  Activity,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useApp, PageHeader, Card, KpiCard } from "@/components/app-shell";
import { Choropleth } from "@/components/choropleth";
import {
  useKpis,
  useSchemes,
  useGeoNational,
  useGeoState,
  useGeoDistricts,
  useAnomalies,
} from "@/lib/api/hooks";
import { STATES, fmtCr, fmtNum } from "@/lib/seed-data";
import { cn } from "@/lib/utils";

export function GeoNationalView() {
  const filters = useApp((s) => s.filters);
  const openState = useApp((s) => s.openState);
  const setView = useApp((s) => s.setView);
  const setFilter = useApp((s) => s.setFilter);
  const { data, isLoading } = useGeoNational(filters.schemeId);
  const states = data?.states ?? [];

  const stateRows = [...states].sort((a, b) => b.metrics.util - a.metrics.util);

  return (
    <div className="space-y-5">
      <PageHeader
        title="National Geographic Intelligence"
        subtitle="Pan-India cross-state implementation metrics · choropleth anchored on canonical LGD state codes"
        icon={Globe2}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            {states.length} STATES
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8">
          <Card
            title="National Macro Choropleth"
            subtitle="Click any state polygon to drill down into district-level metrics"
            actions={
              <div className="flex items-center gap-1 text-[10px] text-tertiary">
                <Layers className="h-3 w-3" />
                Vector tile layer · Mapbox GL JS
              </div>
            }
            bodyClassName="p-0"
          >
            <Choropleth
              states={states}
              schemeCode={filters.schemeId}
              loading={isLoading}
              onSelectState={(lgd) => {
                setFilter("stateLgd", lgd);
                openState(lgd);
              }}
              height={560}
            />
          </Card>
        </div>

        <div className="xl:col-span-4">
          <Card
            title="State Leaderboard"
            subtitle="Ranked by utilization rate"
            bodyClassName="p-0 max-h-[600px] overflow-y-auto"
          >
            <div className="divide-y divide-subtle">
              {stateRows.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-tertiary">
                  <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                  Loading states…
                </div>
              ) : (
                stateRows.map((r, i) => (
                  <button
                    key={r.lgd_code}
                    onClick={() => openState(r.lgd_code)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                  >
                    <span className="text-[10px] font-mono text-tertiary w-5 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{r.entity_name}</div>
                      <div className="text-[10px] text-tertiary font-mono">LGD {r.lgd_code}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-sm font-mono font-bold",
                        r.metrics.util >= 70 ? "text-emerald-400" : r.metrics.util >= 50 ? "text-amber-300" : "text-red-300"
                      )}>
                        {r.metrics.util.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-tertiary">{fmtCr(r.metrics.released)}</div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-tertiary" />
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function GeoStateView() {
  const selectedStateLgd = useApp((s) => s.selectedStateLgd);
  const openDistrict = useApp((s) => s.openDistrict);
  const setView = useApp((s) => s.setView);
  const filters = useApp((s) => s.filters);
  const setFilter = useApp((s) => s.setFilter);

  const stateLgd = selectedStateLgd ?? filters.stateLgd;
  const { data: kpisData, isLoading: kpisLoading } = useKpis({ ...filters, stateLgd });
  const { data: stateData } = useGeoState(stateLgd, filters.schemeId);
  const { data: distData, isLoading: distLoading } = useGeoDistricts(stateLgd, filters.schemeId);
  const state = stateData?.state;
  const districts = distData?.districts ?? [];

  const { data: anomData } = useAnomalies({ stateLgd });
  const anomalies = anomData?.anomalies ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${state?.name ?? "State"} — District Drilldown`}
        subtitle={`State LGD ${stateLgd} · ${districts.length} districts · spatial distribution of cross-scheme metrics`}
        icon={MapPin}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            STATE_LGD_{stateLgd}
          </span>
        }
        actions={
          <button
            onClick={() => setView("geo-national")}
            className="h-9 px-3 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-xs text-secondary-muted hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to National
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpisLoading || !kpisData ? (
          <div className="col-span-full h-16 rounded-lg border border-subtle bg-surface-elevated flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
            <span className="ml-2 text-xs text-tertiary">Aggregating KPIs…</span>
          </div>
        ) : (
          <>
            <KpiCard label="Released" value={fmtCr(kpisData.released)} icon={IndianRupee} />
            <KpiCard
              label="Utilization %"
              value={`${kpisData.utilizationPct.toFixed(1)}%`}
              icon={Activity}
              trend={{ dir: kpisData.utilizationPct >= 70 ? "up" : "down", value: `state avg`, good: kpisData.utilizationPct >= 70 }}
            />
            <KpiCard label="Beneficiaries" value={fmtNum(kpisData.beneficiaries)} icon={Users} />
            <KpiCard
              label="Open Anomalies"
              value={anomalies.filter((a) => a.status === "OPEN").length}
              icon={AlertTriangle}
              alert={anomalies.some((a) => a.severity === "CRITICAL") ? "critical" : undefined}
              onClick={() => setView("intelligence-alerts")}
            />
          </>
        )}
      </div>

      <Card
        title="District-Level Spatial Distribution"
        subtitle="Click any district tile to drill into block-level convergence"
        bodyClassName="p-0"
      >
        <Choropleth
          districts={districts}
          selectedStateLgd={stateLgd}
          schemeCode={filters.schemeId}
          loading={distLoading}
          onSelectDistrict={(lgd) => {
            setFilter("districtLgd", lgd);
            openDistrict(lgd);
          }}
          height={560}
        />
      </Card>

      <Card
        title="District Metric Ranking"
        subtitle="Sorted ascending by utilization (lowest performers first)"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">District (LGD)</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Released (₹ Cr)</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Utilized (₹ Cr)</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Utilization %</th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...districts].sort((a, b) => a.metrics.util - b.metrics.util).map((d) => (
                <tr key={d.lgd_code} className="border-b border-subtle hover:bg-surface-hover">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{d.entity_name}</div>
                    <div className="text-[10px] text-tertiary font-mono">LGD {d.lgd_code}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.metrics.released.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.metrics.utilized.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={cn(
                      d.metrics.util >= 70 ? "text-emerald-400" : d.metrics.util >= 50 ? "text-amber-300" : "text-red-300"
                    )}>
                      {d.metrics.util.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => {
                        setFilter("districtLgd", d.lgd_code);
                        openDistrict(d.lgd_code);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      Drill
                      <ArrowRight className="h-3 w-3" />
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

export function GeoDistrictView() {
  const selectedDistrictLgd = useApp((s) => s.selectedDistrictLgd);
  const filters = useApp((s) => s.filters);
  const setView = useApp((s) => s.setView);
  const openScheme = useApp((s) => s.openScheme);

  const distLgd = selectedDistrictLgd ?? filters.districtLgd;
  const { data: kpisData, isLoading: kpisLoading } = useKpis({ ...filters, districtLgd: distLgd });
  const { data: schemesData } = useSchemes({ districtLgd: distLgd ?? undefined, fy: filters.fy });
  const { data: anomData } = useAnomalies({ districtLgd: distLgd });
  const anomalies = anomData?.anomalies ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        title={`District LGD ${distLgd ?? "?"} — Block Convergence Canvas`}
        subtitle="District-scoped view · localized cross-scheme convergence layers"
        icon={Building2}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            DISTRICT_LGD_{distLgd}
          </span>
        }
        actions={
          <button
            onClick={() => setView("geo-state")}
            className="h-9 px-3 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-xs text-secondary-muted hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpisLoading || !kpisData ? (
          <div className="col-span-full h-16 rounded-lg border border-subtle bg-surface-elevated flex items-center justify-center">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          </div>
        ) : (
          <>
            <KpiCard label="Released" value={fmtCr(kpisData.released)} icon={IndianRupee} />
            <KpiCard label="Utilization %" value={`${kpisData.utilizationPct.toFixed(1)}%`} icon={Activity} />
            <KpiCard label="Beneficiaries" value={fmtNum(kpisData.beneficiaries)} icon={Users} />
            <KpiCard
              label="Open Anomalies"
              value={anomalies.filter((a) => a.status === "OPEN").length}
              icon={AlertTriangle}
              alert={anomalies.some((a) => a.severity === "CRITICAL") ? "critical" : undefined}
              onClick={() => setView("intelligence-alerts")}
            />
          </>
        )}
      </div>

      {/* Per-scheme breakdown */}
      <Card title="Scheme-Level Performance" bodyClassName="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-subtle">
          {(schemesData?.schemes ?? []).map((p) => (
            <button
              key={p.scheme_id}
              onClick={() => openScheme(p.scheme_id)}
              className="text-left p-4 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                  <span className="text-sm font-semibold text-white">{p.scheme_code}</span>
                </div>
                <span className={cn(
                  "text-sm font-mono font-bold",
                  p.metrics.utilizationPct >= 70 ? "text-emerald-400" : p.metrics.utilizationPct >= 50 ? "text-amber-300" : "text-red-300"
                )}>
                  {p.metrics.utilizationPct.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Alloc</div>
                  <div className="text-white font-mono">{fmtCr(p.metrics.allocated)}</div>
                </div>
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Release</div>
                  <div className="text-white font-mono">{fmtCr(p.metrics.released)}</div>
                </div>
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Util</div>
                  <div className="text-white font-mono">{fmtCr(p.metrics.utilized)}</div>
                </div>
              </div>
              <div className="h-1 mt-3 rounded-full overflow-hidden bg-surface-hover">
                <div className="h-full" style={{ width: `${Math.min(p.metrics.utilizationPct, 100)}%`, background: p.color }} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Anomalies in this District" subtitle="Auto-detected by sp_detect_governance_anomalies()" bodyClassName="p-0">
        {anomalies.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-tertiary mx-auto mb-2" />
            <p className="text-sm text-secondary-muted">No anomalies detected for this district.</p>
          </div>
        ) : (
          <div className="divide-y divide-subtle">
            {anomalies.map((a) => (
              <div key={a.anomaly_id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <div className="text-xs font-mono text-tertiary">{a.anomaly_id} · {a.anomaly_type.replace(/_/g, " ")}</div>
                    <div className="text-sm text-white mt-0.5">{a.description}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-amber-300">Z={a.z_score.toFixed(2)}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-red-950 text-red-300 border-red-900/60">
                      {a.severity}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
