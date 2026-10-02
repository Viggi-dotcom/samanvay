"use client";

import { useMemo } from "react";
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
} from "lucide-react";
import { useApp, PageHeader, Card, KpiCard } from "@/components/app-shell";
import { Choropleth } from "@/components/choropleth";
import {
  STATES,
  DISTRICTS,
  ALLOCATIONS,
  BENEFICIARIES,
  ANOMALIES,
  SCHEMES,
  aggregateKpis,
  fmtCr,
  fmtNum,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export function GeoNationalView() {
  const filters = useApp((s) => s.filters);
  const openState = useApp((s) => s.openState);
  const setView = useApp((s) => s.setView);
  const setFilter = useApp((s) => s.setFilter);

  const stateRows = useMemo(() => {
    return STATES.map((s) => {
      const dists = DISTRICTS.filter((d) => d.state_lgd === s.lgd_code);
      const k = aggregateKpis({
        stateLgd: s.lgd_code,
        schemeId: filters.schemeId,
        fy: filters.fy,
      });
      return { state: s, districtCount: dists.length, ...k };
    })
      .filter((r) => r.districtCount > 0)
      .sort((a, b) => b.utilizationPct - a.utilizationPct);
  }, [filters]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="National Geographic Intelligence"
        subtitle="Pan-India cross-state implementation metrics · choropleth anchored on canonical LGD state codes"
        icon={Globe2}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            28 STATES
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
              schemeId={filters.schemeId}
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
              {stateRows.map((r, i) => (
                <button
                  key={r.state.lgd_code}
                  onClick={() => openState(r.state.lgd_code)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors flex items-center gap-3"
                >
                  <span className="text-[10px] font-mono text-tertiary w-5 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">
                      {r.state.entity_name}
                    </div>
                    <div className="text-[10px] text-tertiary font-mono">
                      LGD {r.state.lgd_code} · {r.districtCount} districts
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={cn(
                        "text-sm font-mono font-bold",
                        r.utilizationPct >= 70
                          ? "text-emerald-400"
                          : r.utilizationPct >= 50
                            ? "text-amber-300"
                            : "text-red-300"
                      )}
                    >
                      {r.utilizationPct.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-tertiary">
                      {fmtCr(r.released)}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-tertiary" />
                </button>
              ))}
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
  const state = STATES.find((s) => s.lgd_code === stateLgd);
  const kpis = aggregateKpis({ stateLgd, schemeId: filters.schemeId, fy: filters.fy });

  const districts = DISTRICTS.filter((d) => d.state_lgd === stateLgd);
  const districtRows = districts
    .map((d) => {
      const a = ALLOCATIONS.filter(
        (x) => x.lgd_code === d.lgd_code && (!filters.schemeId || x.scheme_id === filters.schemeId)
      );
      const released = a.reduce((s, x) => s + x.released_cr, 0);
      const utilized = a.reduce((s, x) => s + x.utilized_cr, 0);
      return {
        ...d,
        released,
        utilized,
        utilPct: released > 0 ? (utilized / released) * 100 : 0,
      };
    })
    .sort((a, b) => a.utilPct - b.utilPct);

  const anomalies = ANOMALIES.filter((a) =>
    districts.some((d) => d.lgd_code === a.lgd_code)
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${state?.entity_name ?? "State"} — District Drilldown`}
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
        <KpiCard label="Released" value={fmtCr(kpis.released)} icon={IndianRupee} />
        <KpiCard
          label="Utilization %"
          value={`${kpis.utilizationPct.toFixed(1)}%`}
          icon={Activity}
          trend={{ dir: kpis.utilizationPct >= 70 ? "up" : "down", value: `state avg`, good: kpis.utilizationPct >= 70 }}
        />
        <KpiCard label="Beneficiaries" value={fmtNum(kpis.beneficiaries)} icon={Users} />
        <KpiCard
          label="Open Anomalies"
          value={anomalies.filter((a) => a.status === "OPEN").length}
          icon={AlertTriangle}
          alert={anomalies.some((a) => a.severity === "CRITICAL") ? "critical" : undefined}
          onClick={() => setView("intelligence-alerts")}
        />
      </div>

      <Card
        title="District-Level Spatial Distribution"
        subtitle="Click any district tile to drill into block-level convergence"
        bodyClassName="p-0"
      >
        <Choropleth
          stateLgd={stateLgd}
          schemeId={filters.schemeId}
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
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  District (LGD)
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Released (₹ Cr)
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Utilized (₹ Cr)
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Utilization %
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {districtRows.map((d) => (
                <tr key={d.lgd_code} className="border-b border-subtle hover:bg-surface-hover">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{d.entity_name}</div>
                    <div className="text-[10px] text-tertiary font-mono">LGD {d.lgd_code}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">
                    {d.released.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">
                    {d.utilized.toFixed(1)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={cn(
                      d.utilPct >= 70 ? "text-emerald-400" : d.utilPct >= 50 ? "text-amber-300" : "text-red-300"
                    )}>
                      {d.utilPct.toFixed(1)}%
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
  const district = DISTRICTS.find((d) => d.lgd_code === distLgd);
  const state = STATES.find((s) => s.lgd_code === district?.state_lgd);

  const kpis = aggregateKpis({ districtLgd: distLgd, schemeId: filters.schemeId, fy: filters.fy });
  const anomalies = ANOMALIES.filter((a) => a.lgd_code === distLgd);

  const perScheme = SCHEMES.map((s) => {
    const a = ALLOCATIONS.filter(
      (x) => x.lgd_code === distLgd && x.scheme_id === s.scheme_id
    );
    const released = a.reduce((acc, x) => acc + x.released_cr, 0);
    const utilized = a.reduce((acc, x) => acc + x.utilized_cr, 0);
    const allocated = a.reduce((acc, x) => acc + x.allocated_cr, 0);
    return {
      scheme: s,
      allocated,
      released,
      utilized,
      utilPct: released > 0 ? (utilized / released) * 100 : 0,
    };
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${district?.entity_name ?? "District"} — Block Convergence Canvas`}
        subtitle={`District LGD ${distLgd} · ${state?.entity_name} · localized cross-scheme convergence layers`}
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
            Back to {state?.entity_name}
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Released" value={fmtCr(kpis.released)} icon={IndianRupee} />
        <KpiCard
          label="Utilization %"
          value={`${kpis.utilizationPct.toFixed(1)}%`}
          icon={Activity}
        />
        <KpiCard label="Beneficiaries" value={fmtNum(kpis.beneficiaries)} icon={Users} />
        <KpiCard
          label="Open Anomalies"
          value={anomalies.filter((a) => a.status === "OPEN").length}
          icon={AlertTriangle}
          alert={anomalies.some((a) => a.severity === "CRITICAL") ? "critical" : undefined}
          onClick={() => setView("intelligence-alerts")}
        />
      </div>

      {/* Per-scheme breakdown */}
      <Card title="Scheme-Level Performance" subtitle={`In ${district?.entity_name}`} bodyClassName="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-subtle">
          {perScheme.map((p) => (
            <button
              key={p.scheme.scheme_id}
              onClick={() => openScheme(p.scheme.scheme_id)}
              className="text-left p-4 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: p.scheme.color }} />
                  <span className="text-sm font-semibold text-white">
                    {p.scheme.scheme_code}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-mono font-bold",
                    p.utilPct >= 70 ? "text-emerald-400" : p.utilPct >= 50 ? "text-amber-300" : "text-red-300"
                  )}
                >
                  {p.utilPct.toFixed(1)}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Alloc</div>
                  <div className="text-white font-mono">{fmtCr(p.allocated)}</div>
                </div>
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Release</div>
                  <div className="text-white font-mono">{fmtCr(p.released)}</div>
                </div>
                <div>
                  <div className="text-tertiary text-[10px] uppercase">Util</div>
                  <div className="text-white font-mono">{fmtCr(p.utilized)}</div>
                </div>
              </div>
              <div className="h-1 mt-3 rounded-full overflow-hidden bg-surface-hover">
                <div className="h-full" style={{ width: `${Math.min(p.utilPct, 100)}%`, background: p.scheme.color }} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* District anomalies */}
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
                    <div className="text-xs font-mono text-tertiary">
                      {a.anomaly_id} · {a.anomaly_type.replace(/_/g, " ")}
                    </div>
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
