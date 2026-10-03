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
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-7 w-7 text-[#0B4F9C] animate-spin" />
        <span className="ml-3 text-sm text-gray-500 font-medium">Loading scheme detail from /api/schemes/[id]…</span>
      </div>
    );
  }

  const { scheme, kpis, quarterly, topDistricts } = data;

  const demoPie = [
    { name: "Women", value: Math.round((kpis.womenPct / 100) * kpis.beneficiaries), color: "#06B6D4" },
    { name: "SC/ST", value: Math.round((kpis.scStPct / 100) * kpis.beneficiaries), color: "#8B5CF6" },
    {
      name: "Other",
      value: Math.round(((100 - kpis.womenPct - kpis.scStPct) / 100) * kpis.beneficiaries),
      color: "#475569",
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title={scheme.scheme_name}
        subtitle={`${scheme.scheme_code} · ${scheme.scheme_type.replace(/_/g, " ")} scheme · ${scheme.ministry?.ministry_name ?? "—"}`}
        icon={Building2}
        badge={
          <span
            className="text-xs font-mono font-bold px-2.5 py-1 rounded-full border shadow-xs"
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
            className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </button>
        }
      />

      {/* Description + meta */}
      <Card bodyClassName="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-sm text-gray-700 leading-relaxed">{scheme.description}</p>
          </div>
          <div className="space-y-3 text-xs md:text-sm">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Calendar className="h-4 w-4 text-[#0B4F9C]" /> Launch Date
              </span>
              <span className="text-gray-900 font-mono font-bold">
                {scheme.launch_date ? new Date(scheme.launch_date).toLocaleDateString("en-IN") : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
              <span className="text-gray-500 flex items-center gap-1.5 font-medium">
                <Mail className="h-4 w-4 text-[#0B4F9C]" /> Nodal Ministry
              </span>
              <span className="text-gray-900 font-mono font-bold">{scheme.ministry?.ministry_code ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Ingestion Pipeline</span>
              <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{scheme.is_active ? "ACTIVE · AUTOMATED" : "PAUSED"}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Quarterly Release vs Utilization" subtitle="₹ Crores per fiscal quarter" bodyClassName="p-6">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quarterly}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fill: "#64748B", fontSize: 11 }} stroke="#CBD5E1" />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} stroke="#CBD5E1" />
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
                <Line type="monotone" dataKey="Released" stroke="#0B4F9C" strokeWidth={2.5} dot={{ fill: "#0B4F9C", r: 4 }} />
                <Line type="monotone" dataKey="Utilized" stroke={scheme.color} strokeWidth={2.5} dot={{ fill: scheme.color, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-4 text-xs font-semibold">
            <span className="flex items-center gap-2 text-gray-700"><span className="h-3 w-3 rounded" style={{ background: "#0B4F9C" }} />Released (₹ Cr)</span>
            <span className="flex items-center gap-2 text-gray-700"><span className="h-3 w-3 rounded" style={{ background: scheme.color }} />Utilized (₹ Cr)</span>
          </div>
        </Card>

        <Card title="Beneficiary Demographics" subtitle="Inclusion equity breakdown" bodyClassName="p-6">
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={demoPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {demoPie.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-3">
              {demoPie.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs md:text-sm text-gray-700 font-semibold">
                    <span className="h-3 w-3 rounded" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="text-xs md:text-sm text-gray-900 font-mono font-bold">{fmtNum(d.value)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200 text-xs text-gray-500 leading-relaxed">
                {kpis.womenPct.toFixed(0)}% women · {kpis.scStPct.toFixed(0)}% SC/ST — equity metrics tracked for CAG compliance audit.
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Top districts by allocation */}
      <Card
        title={`Top Districts by ${scheme.scheme_code} Allocation`}
        subtitle="Click any district to drill into block-level convergence metrics"
        actions={
          <button className="h-8 px-3 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-xs font-medium">
            <Download className="h-3.5 w-3.5 text-[#0B4F9C]" />
            Export CSV
          </button>
        }
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  District (LGD)
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Allocated (₹ Cr)
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Released (₹ Cr)
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Utilized (₹ Cr)
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Util %
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Drill
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topDistricts.map((d: any) => (
                <tr key={d.lgdCode} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="text-gray-900 font-bold text-sm">{d.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">LGD {d.lgdCode} · {d.stateName}</div>
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-800 font-medium">{d.allocated.toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-800 font-medium">{d.released.toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-800 font-medium">{d.utilized.toFixed(1)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-bold">
                    <span className={cn(
                      "text-xs font-mono font-bold px-2 py-0.5 rounded border inline-block",
                      d.utilPct >= 70 ? "bg-emerald-50 text-emerald-800 border-emerald-200" : d.utilPct >= 50 ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-red-50 text-red-800 border-red-200"
                    )}>
                      {d.utilPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => openDistrict(d.lgdCode)}
                      className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0B4F9C] text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Open
                      <ChevronRight className="h-3.5 w-3.5" />
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
