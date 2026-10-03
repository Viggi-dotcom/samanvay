"use client";

import { useState } from "react";
import {
  IndianRupee,
  Users,
  Activity,
  AlertTriangle,
  ArrowRight,
  Zap,
  GitMerge,
  MapPin,
  Loader2,
  FileText,
  Shield,
  Award,
  Presentation,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
} from "lucide-react";
import { useApp, PageHeader, KpiCard, Card } from "@/components/app-shell";
import { AshokaEmblem, AshokaChakra, SovereignTricolorRibbon } from "@/components/ashoka-emblem";
import { Choropleth } from "@/components/choropleth";
import { ActivityFeed } from "@/components/activity-feed";
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
  useExportBrief,
  type Kpis,
  type SchemeSummary,
} from "@/lib/api/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function OverviewView() {
  const filters = useApp((s) => s.filters);
  const openState = useApp((s) => s.openState);
  const setView = useApp((s) => s.setView);
  const openScheme = useApp((s) => s.openScheme);

  const { data: kpis, isLoading: kpisLoading } = useKpis(filters);
  const { data: schemesData } = useSchemes({ stateLgd: filters.stateLgd, districtLgd: filters.districtLgd, fy: filters.fy });
  const schemes = schemesData?.schemes ?? [];
  const briefMutation = useExportBrief();

  const { data: geoData } = useGeoNational(filters.schemeId);
  const divergent = (geoData?.states ?? [])
    .flatMap((s) => s)
    .sort((a, b) => a.metrics.util - b.metrics.util)
    .slice(0, 6);

  const scopeLabel =
    filters.districtLgd
      ? "District-scoped"
      : filters.stateLgd
        ? STATES.find((s) => s.lgd_code === filters.stateLgd)?.entity_name
        : "Pan-India";

  const [showBriefingDeck, setShowBriefingDeck] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  function exportBrief() {
    briefMutation.mutate(
      { stateLgd: filters.stateLgd, schemeId: filters.schemeId },
      {
        onSuccess: () => toast.success("Executive Brief PDF generated successfully"),
        onError: (err: any) => toast.error(`Brief failed: ${err.message}`),
      }
    );
  }

  const scciScore = kpis
    ? Math.min(
        96,
        Math.max(
          48,
          Math.round(
            kpis.utilizationPct * 0.4 +
              kpis.achievementPct * 0.35 +
              ((kpis.womenPct + kpis.scStPct) / 2) * 0.15 +
              Math.max(0, 100 - kpis.criticalAnomalies * 10) * 0.1
          )
        )
      )
    : 78;

  return (
    <div className="space-y-7">
      <PageHeader
        title="National Convergence Dashboard"
        subtitle={`Integrated Implementation Analytics · MGNREGA · PM-KISAN · PMAY-G · ${scopeLabel} · FY ${filters.fy}`}
        icon={Activity}
        badge={
          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
            Active Data Feed
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={exportBrief}
              disabled={briefMutation.isPending}
              className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2 transition-all disabled:opacity-50 shadow-xs cursor-pointer"
            >
              {briefMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-[#0B4F9C]" />}
              Export Cabinet Brief (PDF)
            </button>
            <button
              onClick={() => setView("convergence-matrix")}
              className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <GitMerge className="h-4 w-4" />
              Convergence Matrix
            </button>
          </div>
        }
      />

      {/* Live Inter-Ministerial Intelligence Dispatch Ribbon */}
      <div className="rounded-xl bg-gradient-to-r from-red-50/90 via-amber-50/90 to-blue-50/90 border border-amber-200/90 p-3.5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-3 w-3 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="font-mono font-bold text-red-900 uppercase text-[10px] bg-red-100/90 px-2.5 py-0.5 rounded border border-red-200 shrink-0">
            Priority Cabinet Advisory
          </span>
          <p className="text-gray-800 truncate font-medium">
            <strong className="text-gray-950 font-bold">Gorakhpur & Basti (UP):</strong> 81% MGNREGA wages released but 39% PMAY-G housing completed — 4,200 mason work-days misaligned across Gram Panchayats.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setView("directives")}
            className="text-[11px] font-bold text-[#0B4F9C] hover:text-[#093E7A] bg-white border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            Draft OM <ArrowRight className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowBriefingDeck(true)}
            className="text-[11px] font-bold text-gray-700 hover:text-gray-900 bg-white border border-gray-300 hover:border-gray-400 px-3 py-1.5 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="h-3 w-3 text-amber-600" />
            Briefing Dossier
          </button>
        </div>
      </div>

      {/* Samanvay Composite Convergence Index Banner */}
      {kpis && !kpisLoading && (
        <div className="p-5 rounded-lg bg-white border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="flex items-start md:items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <Award className="h-6 w-6 text-[#0B4F9C]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-bold">
                  Samanvay Convergence Index (SCCI)
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-800 border border-green-200">
                  {scciScore >= 75 ? "Front Runner Tier" : "Performer Tier"}
                </span>
              </div>
              <div className="text-base font-bold text-gray-900 mt-0.5">
                Composite Saturation Health: <span className="font-mono text-[#0B4F9C] text-lg font-bold">{scciScore}</span> / 100
              </div>
              <div className="text-xs text-gray-600 mt-0.5 max-w-2xl leading-relaxed">
                Aggregated across Treasury Outlay (40%), Physical Completion (35%), Demographic Reach (15%), Implementation Health (10%)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setView("directives")}
              className="h-8.5 px-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 text-[#0B4F9C] text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Shield className="h-3.5 w-3.5" />
              Action Directives
            </button>
            <button
              onClick={() => setView("simulator")}
              className="h-8.5 px-3 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 text-amber-600" />
              Resource Simulator
            </button>
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpisLoading || !kpis ? (
          <div className="col-span-full h-24 rounded-lg border border-gray-200 bg-white flex items-center justify-center">
            <Loader2 className="h-5 w-5 text-[#0B4F9C] animate-spin" />
            <span className="ml-3 text-sm text-gray-500 font-medium">Loading implementation metrics...</span>
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
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-8">
          <Card
            title="Interactive Geographic Intelligence"
            subtitle="Click any state polygon to drill down into district-level convergence metrics"
            actions={
              <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0B4F9C] animate-pulse" />
                Real India GeoJSON · LGD-anchored
              </div>
            }
            bodyClassName="p-0"
          >
            <Choropleth
              states={geoData?.states}
              schemeCode={filters.schemeId ? schemes.find((s) => s.scheme_id === filters.schemeId)?.scheme_code : undefined}
              loading={kpisLoading}
              onSelectState={(lgd) => openState(lgd)}
              height={540}
            />
          </Card>
        </div>

        <div className="xl:col-span-4 space-y-6">
          <Card
            title="Top Divergent States"
            subtitle="High fund release · Lagging outcome velocity"
            bodyClassName="p-0"
          >
            <div className="divide-y divide-gray-200">
              {divergent.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-gray-500">Loading divergent states…</div>
              ) : (
                divergent.map((s, i) => (
                  <button
                    key={s.lgd_code}
                    onClick={() => openState(s.lgd_code)}
                    className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3.5 group cursor-pointer"
                  >
                    <div className="text-xs font-mono font-bold text-gray-400 w-5">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 group-hover:text-[#0B4F9C] transition-colors truncate">{s.entity_name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 text-[#0B4F9C]" />State LGD {s.lgd_code}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded inline-block">{s.metrics.util.toFixed(1)}% util</div>
                      <div className="text-xs text-gray-600 font-mono mt-1">{fmtCr(s.metrics.released)}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#0B4F9C] group-hover:translate-x-0.5 transition-all shrink-0" />
                  </button>
                ))
              )}
            </div>
            <div className="p-3.5 border-t border-gray-200 bg-gray-50/70">
              <button
                onClick={() => setView("geo-national")}
                className="w-full h-9 rounded-lg bg-white hover:bg-gray-100 border border-gray-300 text-xs font-semibold text-[#0B4F9C] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                View full geographic intelligence
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </Card>

          {/* Live Activity Feed */}
          <ActivityFeed limit={8} />
        </div>
      </div>

      {/* AI Insight cards */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-amber-600" />
              Convergence Bottlenecks & Gaps
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Automated cross-departmental anomaly and saturation diagnostics
            </p>
          </div>
          <button
            onClick={() => setView("insights")}
            className="text-xs font-semibold text-[#0B4F9C] hover:underline flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            View All Insights
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {AI_INSIGHTS.map((insight) => (
            <Card
              key={insight.id}
              className={insight.severity === "critical" ? "border-red-200 bg-white shadow-xs" : "border-amber-200 bg-white shadow-xs"}
              bodyClassName="p-4"
            >
              <div className="flex items-start gap-2 mb-2.5">
                <span className={"text-[11px] font-semibold uppercase px-2 py-0.5 rounded border " +
                  (insight.type === "OVERLAP" ? "bg-blue-50 text-blue-700 border-blue-200" :
                   insight.type === "GAP" ? "bg-amber-50 text-amber-700 border-amber-200" :
                   "bg-red-50 text-red-700 border-red-200")}>
                  {insight.type}
                </span>
                <span className={"text-[11px] font-semibold uppercase px-2 py-0.5 rounded border " +
                  (insight.severity === "critical" ? "bg-red-50 text-red-700 border-red-200 font-bold" : "bg-amber-50 text-amber-700 border-amber-200")}>
                  {insight.severity}
                </span>
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">{insight.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-3">{insight.detail}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2.5 border-t border-gray-100">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {insight.affectedSchemes.map((s) => (
                    <span key={s} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">{s}</span>
                  ))}
                </div>
                <span className="text-xs text-[#0B4F9C] font-semibold">{insight.districts} district{insight.districts > 1 ? "s" : ""}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Scheme snapshot strip */}
      <Card title="Schemes Snapshot" subtitle="Key financial releases, expenditures, and verified beneficiary coverage" bodyClassName="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {schemes.length === 0 ? (
            <div className="col-span-full p-8 text-center text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
              Loading schemes…
            </div>
          ) : (
            schemes.map((s: SchemeSummary) => (
              <button
                key={s.scheme_id}
                onClick={() => openScheme(s.scheme_id)}
                className="text-left p-5 hover:bg-gray-50/80 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-base font-bold text-gray-900 group-hover:text-[#0B4F9C] transition-colors">{s.scheme_code}</span>
                  <span className="text-[11px] font-mono text-gray-600 ml-auto capitalize bg-gray-100 border border-gray-200 px-2 py-0.5 rounded font-medium">{s.scheme_type.replace(/_/g, " ")}</span>
                </div>
                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  <div className="space-y-0.5">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Released</div>
                    <div className="text-gray-900 font-mono font-bold text-sm">{fmtCr(s.metrics.released)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Utilized</div>
                    <div className="text-gray-900 font-mono font-bold text-sm">{fmtCr(s.metrics.utilized)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Beneficiaries</div>
                    <div className="text-gray-900 font-mono font-bold text-sm">{fmtNum(s.metrics.beneficiaries)}</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">Utilization %</div>
                    <div>
                      <span className={"inline-block font-mono font-bold text-xs px-2 py-0.5 rounded border " +
                        (s.metrics.utilizationPct >= 70 ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
                         s.metrics.utilizationPct >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200")}>
                        {s.metrics.utilizationPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Cabinet Presentation Deck Modal */}
      {showBriefingDeck && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between p-4 md:p-8 animate-in fade-in duration-200">
          <div className="max-w-5xl w-full mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden h-full max-h-[92vh]">
            <SovereignTricolorRibbon height="h-2" />
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-gray-50/80">
              <div className="flex items-center gap-3.5">
                <AshokaEmblem size="sm" variant="navy" showMotto={true} />
                <div>
                  <div className="text-sm md:text-base font-extrabold text-gray-900 tracking-wide uppercase">
                    Cabinet Secretariat · High-Level Briefing Dossier
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-0.5">
                    भारत सरकार · Samanvay Sovereign Convergence Intelligence · FY 2025-2026
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[#0B4F9C] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200 font-bold">
                  Slide {slideIndex + 1} of 4
                </span>
                <button
                  onClick={() => setShowBriefingDeck(false)}
                  className="p-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-300 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer shadow-xs"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {/* Slide Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 flex items-center justify-center bg-gray-50/30">
              {slideIndex === 0 && (
                <div className="max-w-3xl w-full space-y-7 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-xs font-mono text-[#0B4F9C] uppercase tracking-widest font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block">
                      Slide 1 · Strategic Governance Context
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Cross-Ministerial Welfare Convergence at Scale
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Transitioning government oversight from isolated departmental silos into an integrated, LGD-anchored convergence architecture linking wage demand (MGNREGA), farmer direct support (PM-KISAN), and rural housing assets (PMAY-G).
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-xs">
                      <div className="text-[11px] uppercase font-mono text-gray-500 font-bold">Total Outlay Tracked</div>
                      <div className="text-2xl font-extrabold font-mono text-[#0B4F9C]">₹432,000+ Cr</div>
                      <div className="text-xs text-gray-600">Across 3 Central Ministries</div>
                    </div>
                    <div className="p-4.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-xs">
                      <div className="text-[11px] uppercase font-mono text-gray-500 font-bold">LGD Spatial Anchors</div>
                      <div className="text-2xl font-extrabold font-mono text-gray-900">66 Districts</div>
                      <div className="text-xs text-gray-600">24 Harmonized States</div>
                    </div>
                    <div className="p-4.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-xs">
                      <div className="text-[11px] uppercase font-mono text-gray-500 font-bold">Saturation Health (SCCI)</div>
                      <div className="text-2xl font-extrabold font-mono text-emerald-700">{scciScore} / 100</div>
                      <div className="text-xs text-emerald-700 font-bold">Front Runner Band</div>
                    </div>
                    <div className="p-4.5 rounded-xl bg-white border border-gray-200 space-y-1.5 shadow-xs">
                      <div className="text-[11px] uppercase font-mono text-gray-500 font-bold">Active Beneficiaries</div>
                      <div className="text-2xl font-extrabold font-mono text-purple-700">3.86M+ Reach</div>
                      <div className="text-xs text-gray-600">40% Women · 35% SC/ST</div>
                    </div>
                  </div>
                </div>
              )}

              {slideIndex === 1 && (
                <div className="max-w-3xl w-full space-y-7 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-amber-800 uppercase tracking-widest font-bold bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block">
                      Slide 2 · Critical Divergence Diagnostics
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Where Scheme Delivery Breaks Down
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Automated bivariate correlation flagged key districts suffering from high wage expenditure without corresponding physical infrastructure completion.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="p-6 rounded-xl bg-red-50/70 border border-red-200 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-red-950">Gorakhpur & Basti (Uttar Pradesh)</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200 font-bold uppercase">Overlap High</span>
                      </div>
                      <p className="text-xs md:text-sm text-red-900 leading-relaxed">
                        MGNREGA wage utilization is <strong className="font-bold text-gray-900">81%</strong>, yet PMAY-G completion is stalled at <strong className="font-bold text-gray-900">39%</strong>. Over 4,200 rural housing foundations lack masonry labor alignment.
                      </p>
                      <div className="text-xs font-mono text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 font-semibold">
                        → Action Required: Merge AwaasSoft & NREGASoft beneficiary muster rolls.
                      </div>
                    </div>

                    <div className="p-6 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-amber-950">Araria & Kishanganj (Bihar)</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 font-bold uppercase">Dual Gap</span>
                      </div>
                      <p className="text-xs md:text-sm text-amber-900 leading-relaxed">
                        Persistent dual-scheme underutilization with MGNREGA fund utilization at <strong className="font-bold text-gray-900">38%</strong> and PM-KISAN e-KYC saturation at <strong className="font-bold text-gray-900">42%</strong>.
                      </p>
                      <div className="text-xs font-mono text-blue-900 bg-blue-100/70 p-2.5 rounded-lg border border-blue-200 font-semibold">
                        → Action Required: Special Joint Saturation Camp across 218 Gram Panchayats.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {slideIndex === 2 && (
                <div className="max-w-3xl w-full space-y-7 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-[#0B4F9C] uppercase tracking-widest font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200 inline-block">
                      Slide 3 · Cabinet Directives in Motion
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Enforcing Inter-Ministerial Accountability
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      Samanvay transforms passive reporting into binding Government of India Office Memorandums with time-bound compliance affidavits.
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { ref: "OM/CABSEC/CONV/2026/042", title: "MGNREGA Labor Mobilization for Stalled PMAY-G Units", target: "Gorakhpur, UP", deadline: "45 Days", status: "ISSUED" },
                      { ref: "OM/CABSEC/CONV/2026/089", title: "Emergency Liquidity & Saturation Protocol for Araria", target: "Araria, Bihar", deadline: "30 Days", status: "IN_PROGRESS" },
                      { ref: "OM/CABSEC/CONV/2026/115", title: "Tribal Sub-Plan Inter-Scheme Convergence Protocol", target: "Kalahandi, Odisha", deadline: "60 Days", status: "ISSUED" },
                    ].map((om, i) => (
                      <div key={i} className="p-4 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs md:text-sm shadow-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-[#0B4F9C] font-bold">{om.ref}</span>
                            <span className="text-gray-500 font-medium">· {om.target}</span>
                          </div>
                          <div className="text-gray-900 font-bold">{om.title}</div>
                        </div>
                        <div className="text-right font-mono space-y-1">
                          <div className="text-amber-700 font-bold">{om.deadline}</div>
                          <div className="text-[11px] text-gray-500 uppercase font-semibold">{om.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {slideIndex === 3 && (
                <div className="max-w-3xl w-full space-y-7 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <span className="text-xs font-mono text-emerald-800 uppercase tracking-widest font-bold bg-green-50 px-2.5 py-1 rounded border border-green-200 inline-block">
                      Slide 4 · AI Recommendations & Impact
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                      Projected Outcomes from Coordinated Policy Action
                    </h2>
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed">
                      By simulating resource reallocation and inter-scheme labor sharing through the Samanvay Platform:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-2 shadow-xs">
                      <div className="text-emerald-700 font-bold text-xl">+14,800 Houses</div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Completed within 60 days by redirecting underutilized MGNREGA person-days into certified rural masonry.
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-2 shadow-xs">
                      <div className="text-[#0B4F9C] font-bold text-xl">₹380 Cr Friction Saved</div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Eliminating duplicate administrative verification via universal LGD and Aadhaar e-KYC harmonization.
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-2 shadow-xs">
                      <div className="text-purple-700 font-bold text-xl">100% Traceability</div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Every policy decision and anomaly resolution backed by AST-verified SQL and CAG-compliant audit trails.
                      </p>
                    </div>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => {
                        setShowBriefingDeck(false);
                        setView("directives");
                      }}
                      className="px-6 py-2.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white font-bold text-xs transition-all shadow-xs cursor-pointer inline-flex items-center gap-2"
                    >
                      Open Action Directives Console →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-3.5 bg-gray-50/80">
              <button
                onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                disabled={slideIndex === 0}
                className="px-4 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed text-xs text-gray-700 font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous Slide
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setSlideIndex(idx)}
                    className={cn(
                      "h-2 rounded-full transition-all cursor-pointer",
                      slideIndex === idx ? "w-7 bg-[#0B4F9C]" : "w-2 bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>

              <button
                onClick={() => setSlideIndex((i) => Math.min(3, i + 1))}
                disabled={slideIndex === 3}
                className="px-4 py-2 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white border border-[#0B4F9C] disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                Next Slide
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
