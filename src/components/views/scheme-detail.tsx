"use client";

import { useMemo } from "react";
import {
  Building2,
  ArrowLeft,
  Calendar,
  Mail,
  IndianRupee,
  Users,
  Target,
  Activity,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useApp, PageHeader, Card, KpiCard } from "@/components/app-shell";
import {
  SCHEMES,
  MINISTRIES,
  DISTRICTS,
  STATES,
  ALLOCATIONS,
  BENEFICIARIES,
  ANOMALIES,
  aggregateKpis,
  fmtCr,
  fmtNum,
} from "@/lib/data";

export function SchemeDetailView() {
  const schemeId = useApp((s) => s.selectedSchemeId);
  const filters = useApp((s) => s.filters);
  const setView = useApp((s) => s.setView);
  const openDistrict = useApp((s) => s.openDistrict);

  const scheme = SCHEMES.find((s) => s.scheme_id === schemeId);
  const ministry = MINISTRIES.find((m) => m.ministry_id === scheme?.ministry_id);
  const k = aggregateKpis({
    schemeId,
    stateLgd: filters.stateLgd,
    districtLgd: filters.districtLgd,
    fy: filters.fy,
  });

  // Top districts by allocation for this scheme
  const districtRows = useMemo(() => {
    return DISTRICTS.filter(
      (d) => !filters.stateLgd || d.state_lgd === filters.stateLgd
    )
      .map((d) => {
        const a = ALLOCATIONS.filter(
          (x) => x.lgd_code === d.lgd_code && x.scheme_id === schemeId
        );
        const released = a.reduce((s, x) => s + x.released_cr, 0);
        const utilized = a.reduce((s, x) => s + x.utilized_cr, 0);
        const allocated = a.reduce((s, x) => s + x.allocated_cr, 0);
        const b = BENEFICIARIES.find(
          (x) => x.lgd_code === d.lgd_code && x.scheme_id === schemeId
        );
        const utilPct = released > 0 ? (utilized / released) * 100 : 0;
        return {
          ...d,
          released,
          utilized,
          allocated,
          beneficiaries: b?.beneficiaries_total ?? 0,
          women: b?.beneficiaries_women ?? 0,
          scSt: b?.beneficiaries_sc_st ?? 0,
          target: b?.target_units ?? 0,
          achieved: b?.achieved_units ?? 0,
          utilPct,
        };
      })
      .sort((a, b) => b.released - a.released)
      .slice(0, 10);
  }, [schemeId, filters.stateLgd]);

  // Quarterly trend
  const quarterly = useMemo(() => {
    return [1, 2, 3, 4].map((q) => {
      const a = ALLOCATIONS.filter(
        (x) =>
          x.scheme_id === schemeId &&
          x.quarter === q &&
          (!filters.stateLgd ||
            DISTRICTS.find((d) => d.lgd_code === x.lgd_code)?.state_lgd ===
              filters.stateLgd)
      );
      return {
        quarter: `Q${q}`,
        Released: Number(a.reduce((s, x) => s + x.released_cr, 0).toFixed(1)),
        Utilized: Number(a.reduce((s, x) => s + x.utilized_cr, 0).toFixed(1)),
      };
    });
  }, [schemeId, filters.stateLgd]);

  // Beneficiary pie
  const demoPie = [
    { name: "Women", value: Math.round((k.womenPct / 100) * k.beneficiaries), color: "#06B6D4" },
    { name: "SC/ST", value: Math.round((k.scStPct / 100) * k.beneficiaries), color: "#8B5CF6" },
    {
      name: "Other",
      value: Math.round(((100 - k.womenPct - k.scStPct) / 100) * k.beneficiaries),
      color: "#374151",
    },
  ];

  if (!scheme) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-secondary-muted">No scheme selected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={scheme.scheme_name}
        subtitle={`${scheme.scheme_code} · ${scheme.scheme_type.replace(/_/g, " ")} scheme · ${ministry?.ministry_name}`}
        icon={Building2}
        badge={
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded border"
            style={{
              background: scheme.color + "20",
              color: scheme.color,
              borderColor: scheme.color + "60",
            }}
          >
            {scheme.scheme_code}
          </span>
        }
        actions={
          <button
            onClick={() => setView("schemes-directory")}
            className="h-9 px-3 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-xs text-secondary-muted hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Directory
          </button>
        }
      />

      {/* Description + meta */}
      <Card bodyClassName="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <p className="text-xs text-secondary-muted leading-relaxed">
              {scheme.description}
            </p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <span className="text-tertiary flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Launch
              </span>
              <span className="text-white font-mono">
                {new Date(scheme.launch_date).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <span className="text-tertiary flex items-center gap-1">
                <Mail className="h-3 w-3" /> Nodal
              </span>
              <span className="text-white font-mono text-[10px]">{ministry?.ministry_code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tertiary">Active</span>
              <span className="text-emerald-400 font-mono">
                {scheme.is_active ? "true" : "false"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Allocated" value={fmtCr(k.released + (k.released * 0.2))} icon={IndianRupee} />
        <KpiCard label="Released" value={fmtCr(k.released)} icon={IndianRupee} />
        <KpiCard
          label="Utilization %"
          value={`${k.utilizationPct.toFixed(1)}%`}
          icon={Activity}
          trend={{ dir: k.utilizationPct >= 70 ? "up" : "down", value: `target ≥70%`, good: k.utilizationPct >= 70 }}
        />
        <KpiCard label="Beneficiaries" value={fmtNum(k.beneficiaries)} icon={Users} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Quarterly Release vs Utilization" subtitle="₹ Crores per fiscal quarter" bodyClassName="p-4">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterly}>
                <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: "#9CA3AF", fontSize: 11 }} stroke="#374151" />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} stroke="#374151" />
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                />
                <Line type="monotone" dataKey="Released" stroke="#06B6D4" strokeWidth={2} dot={{ fill: "#06B6D4", r: 3 }} />
                <Line type="monotone" dataKey="Utilized" stroke={scheme.color} strokeWidth={2} dot={{ fill: scheme.color, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px]">
            <span className="flex items-center gap-1.5 text-tertiary"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: "#06B6D4" }} />Released (₹ Cr)</span>
            <span className="flex items-center gap-1.5 text-tertiary"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: scheme.color }} />Utilized (₹ Cr)</span>
          </div>
        </Card>

        <Card title="Beneficiary Demographics" subtitle="Inclusion breakdown" bodyClassName="p-4">
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={demoPie} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {demoPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {demoPie.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-secondary-muted">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-xs text-white font-mono">{fmtNum(d.value)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-subtle text-[11px] text-tertiary">
                {k.womenPct.toFixed(0)}% women · {k.scStPct.toFixed(0)}% SC/ST — equity metrics tracked for CAG audit.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top districts by allocation */}
      <Card
        title={`Top Districts by ${scheme.scheme_code} Allocation`}
        subtitle="Click any district to drill into block-level convergence"
        actions={
          <button className="h-8 px-2.5 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-[11px] text-secondary-muted flex items-center gap-1.5">
            <Download className="h-3 w-3" />
            Export
          </button>
        }
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
                  Allocated
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Released
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Utilized
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Util %
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Beneficiaries
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Drill
                </th>
              </tr>
            </thead>
            <tbody>
              {districtRows.map((d) => (
                <tr key={d.lgd_code} className="border-b border-subtle hover:bg-surface-hover">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{d.entity_name}</div>
                    <div className="text-[10px] text-tertiary font-mono">LGD {d.lgd_code} · {d.stateName}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.allocated.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.released.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.utilized.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={d.utilPct >= 70 ? "text-emerald-400" : d.utilPct >= 50 ? "text-amber-300" : "text-red-300"}>
                      {d.utilPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{fmtNum(d.beneficiaries)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => openDistrict(d.lgd_code)}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1"
                    >
                      Open
                      <ChevronRight className="h-3 w-3" />
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
