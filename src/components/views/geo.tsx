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
    <div className="space-y-7">
      <PageHeader
        title="National Geographic Intelligence"
        subtitle="Pan-India cross-state implementation metrics · choropleth anchored on canonical LGD state codes"
        icon={Globe2}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            {states.length} STATES
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <Card
            title="National Macro Choropleth"
            subtitle="Click any state polygon to drill down into district-level metrics"
            actions={
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <Layers className="h-4 w-4 text-[#0B4F9C]" />
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
              height={580}
            />
          </Card>
        </div>

        <div className="xl:col-span-4">
          <Card
            title="State Leaderboard"
            subtitle="Ranked by budget utilization rate"
            bodyClassName="p-0 max-h-[620px] overflow-y-auto"
          >
            <div className="divide-y divide-gray-200">
              {stateRows.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
                  Loading states…
                </div>
              ) : (
                stateRows.map((r, i) => (
                  <button
                    key={r.lgd_code}
                    onClick={() => openState(r.lgd_code)}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3.5 group cursor-pointer"
                  >
                    <span className="text-xs font-mono font-bold text-gray-400 w-6 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-[#0B4F9C] transition-colors truncate">{r.entity_name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">LGD {r.lgd_code}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block",
                        r.metrics.util >= 70 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : r.metrics.util >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"
                      )}>
                        {r.metrics.util.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-1">{fmtCr(r.metrics.released)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#0B4F9C] group-hover:translate-x-0.5 transition-all" />
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
    <div className="space-y-7">
      <PageHeader
        title={`${state?.name ?? "State"} — District Drilldown`}
        subtitle={`State LGD ${stateLgd} · ${districts.length} districts · spatial distribution of cross-scheme metrics`}
        icon={MapPin}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            STATE_LGD_{stateLgd}
          </span>
        }
        actions={
          <button
            onClick={() => setView("geo-national")}
            className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to National
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading || !kpisData ? (
          <div className="col-span-full h-24 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-[#0B4F9C] animate-spin" />
            <span className="ml-3 text-sm text-gray-500 font-medium">Aggregating KPIs…</span>
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
        subtitle="Click any district tile to drill into block-level convergence metrics"
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
          height={580}
        />
      </Card>

      <Card
        title="District Metric Ranking"
        subtitle="Sorted ascending by utilization (lowest performers prioritized for intervention)"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">District (LGD)</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Released (₹ Cr)</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Utilized (₹ Cr)</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Utilization %</th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[...districts].sort((a, b) => a.metrics.util - b.metrics.util).map((d) => (
                <tr key={d.lgd_code} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-gray-900 font-bold text-sm">{d.entity_name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">LGD {d.lgd_code}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-800 font-medium">{d.metrics.released.toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-800 font-medium">{d.metrics.utilized.toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold">
                    <span className={cn(
                      "text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block",
                      d.metrics.util >= 70 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : d.metrics.util >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"
                    )}>
                      {d.metrics.util.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        setFilter("districtLgd", d.lgd_code);
                        openDistrict(d.lgd_code);
                      }}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0B4F9C] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      Drill
                      <ArrowRight className="h-3.5 w-3.5" />
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
    <div className="space-y-7">
      <PageHeader
        title={`District LGD ${distLgd ?? "?"} — Block Convergence Canvas`}
        subtitle="District-scoped view · localized cross-scheme convergence layers"
        icon={Building2}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            DISTRICT_LGD_{distLgd}
          </span>
        }
        actions={
          <button
            onClick={() => setView("geo-state")}
            className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading || !kpisData ? (
          <div className="col-span-full h-24 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-[#0B4F9C] animate-spin" />
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
      <Card title="Scheme-Level Performance" subtitle="Breakdown of key metrics across schemes in this district" bodyClassName="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {(schemesData?.schemes ?? []).map((p) => (
            <button
              key={p.scheme_id}
              onClick={() => openScheme(p.scheme_id)}
              className="text-left p-5 hover:bg-gray-50/80 transition-colors group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: p.color }} />
                  <span className="text-base font-bold text-gray-900 group-hover:text-[#0B4F9C] transition-colors">{p.scheme_code}</span>
                </div>
                <span className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5 rounded border",
                  p.metrics.utilizationPct >= 70 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : p.metrics.utilizationPct >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"
                )}>
                  {p.metrics.utilizationPct.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Alloc</div>
                  <div className="text-gray-900 font-mono font-bold text-sm mt-0.5">{fmtCr(p.metrics.allocated)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Release</div>
                  <div className="text-gray-900 font-mono font-bold text-sm mt-0.5">{fmtCr(p.metrics.released)}</div>
                </div>
                <div>
                  <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Util</div>
                  <div className="text-gray-900 font-mono font-bold text-sm mt-0.5">{fmtCr(p.metrics.utilized)}</div>
                </div>
              </div>
              <div className="h-1.5 mt-4 rounded-full overflow-hidden bg-gray-100">
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(p.metrics.utilizationPct, 100)}%`, background: p.color }} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      <Card title="Anomalies in this District" subtitle="Auto-detected by sp_detect_governance_anomalies()" bodyClassName="p-0">
        {anomalies.length === 0 ? (
          <div className="p-10 text-center">
            <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">No anomalies detected for this district.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {anomalies.map((a) => (
              <div key={a.anomaly_id} className="px-5 py-4 hover:bg-gray-50/60 transition-colors">
                <div className="flex items-start justify-between gap-4 mb-1">
                  <div>
                    <div className="text-xs font-mono text-gray-500">{a.anomaly_id} · {a.anomaly_type.replace(/_/g, " ")}</div>
                    <div className="text-sm font-bold text-gray-900 mt-1 leading-snug">{a.description}</div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className="text-xs font-mono text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Z={a.z_score.toFixed(2)}</span>
                    <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded border bg-red-50 text-red-800 border-red-200">
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
