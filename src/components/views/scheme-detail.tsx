"use client";

import {
  Building2,
  ArrowLeft,
  Calendar,
  Mail,
  IndianRupee,
  Users,
  Activity,
  Download,
  ChevronRight,
  Loader2,
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
import { useSchemeDetail } from "@/lib/api/hooks";
import { fmtCr, fmtNum } from "@/lib/seed-data";

export function SchemeDetailView() {
  const schemeId = useApp((s) => s.selectedSchemeId);
  const filters = useApp((s) => s.filters);
  const setView = useApp((s) => s.setView);
  const openDistrict = useApp((s) => s.openDistrict);

  const { data, isLoading } = useSchemeDetail(schemeId, {
    stateLgd: filters.stateLgd,
    districtLgd: filters.districtLgd,
    fy: filters.fy,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
        <span className="ml-3 text-sm text-tertiary">Loading scheme detail from /api/schemes/[id]…</span>
      </div>
    );
  }

  const { scheme, kpis, quarterly, topDistricts } = data;

  // Beneficiary pie
  const demoPie = [
    { name: "Women", value: Math.round((kpis.womenPct / 100) * kpis.beneficiaries), color: "#06B6D4" },
    { name: "SC/ST", value: Math.round((kpis.scStPct / 100) * kpis.beneficiaries), color: "#8B5CF6" },
    {
      name: "Other",
      value: Math.round(((100 - kpis.womenPct - kpis.scStPct) / 100) * kpis.beneficiaries),
      color: "#374151",
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title={scheme.scheme_name}
        subtitle={`${scheme.scheme_code} · ${scheme.scheme_type.replace(/_/g, " ")} scheme · ${scheme.ministry?.ministry_name ?? "—"}`}
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
            <p className="text-xs text-secondary-muted leading-relaxed">{scheme.description}</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <span className="text-tertiary flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Launch
              </span>
              <span className="text-white font-mono">
                {scheme.launch_date ? new Date(scheme.launch_date).toLocaleDateString("en-IN") : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-subtle pb-2">
              <span className="text-tertiary flex items-center gap-1">
                <Mail className="h-3 w-3" /> Nodal
              </span>
              <span className="text-white font-mono text-[10px]">{scheme.ministry?.ministry_code ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-tertiary">Active</span>
              <span className="text-emerald-400 font-mono">{scheme.is_active ? "true" : "false"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Allocated" value={fmtCr(kpis.allocated)} icon={IndianRupee} />
        <KpiCard label="Released" value={fmtCr(kpis.released)} icon={IndianRupee} />
        <KpiCard
          label="Utilization %"
          value={`${kpis.utilizationPct.toFixed(1)}%`}
          icon={Activity}
          trend={{ dir: kpis.utilizationPct >= 70 ? "up" : "down", value: `target ≥70%`, good: kpis.utilizationPct >= 70 }}
        />
        <KpiCard label="Beneficiaries" value={fmtNum(kpis.beneficiaries)} icon={Users} />
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
                {kpis.womenPct.toFixed(0)}% women · {kpis.scStPct.toFixed(0)}% SC/ST — equity metrics tracked for CAG audit.
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
                  Drill
                </th>
              </tr>
            </thead>
            <tbody>
              {topDistricts.map((d: any) => (
                <tr key={d.lgdCode} className="border-b border-subtle hover:bg-surface-hover">
                  <td className="px-3 py-2.5">
                    <div className="text-white font-medium">{d.name}</div>
                    <div className="text-[10px] text-tertiary font-mono">LGD {d.lgdCode} · {d.stateName}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.allocated.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.released.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">{d.utilized.toFixed(1)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    <span className={d.utilPct >= 70 ? "text-emerald-400" : d.utilPct >= 50 ? "text-amber-300" : "text-red-300"}>
                      {d.utilPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      onClick={() => openDistrict(d.lgdCode)}
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
