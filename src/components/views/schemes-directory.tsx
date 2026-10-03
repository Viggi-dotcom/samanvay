"use client";

import {
  Building2,
  ArrowRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Mail,
  Loader2,
} from "lucide-react";
import { useApp, PageHeader, Card } from "@/components/app-shell";
import { useSchemes } from "@/lib/api/hooks";
import { fmtCr, fmtNum } from "@/lib/seed-data";

export function SchemesDirectoryView() {
  const openScheme = useApp((s) => s.openScheme);
  const filters = useApp((s) => s.filters);
  const { data, isLoading } = useSchemes({ stateLgd: filters.stateLgd, districtLgd: filters.districtLgd, fy: filters.fy });
  const schemes = data?.schemes ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Scheme Directory"
        subtitle="Comprehensive catalog of centrally sponsored and central sector schemes ingested into the platform"
        icon={Building2}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            {schemes.length} ACTIVE SCHEMES
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full p-12 text-center rounded-lg border border-gray-200 bg-white">
            <Loader2 className="h-6 w-6 text-[#0B4F9C] animate-spin inline-block" />
            <span className="ml-3 text-sm text-gray-600 font-medium">Loading schemes from /api/schemes…</span>
          </div>
        ) : (
          schemes.map((s) => {
            const k = s.metrics;
            return (
              <Card key={s.scheme_id} bodyClassName="p-0" className="overflow-hidden shadow-xs border-gray-200 bg-white">
                <div className="h-1.5" style={{ background: s.color }} />
                <div className="p-5 md:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                        <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-gray-500">
                          {s.scheme_code} · {s.scheme_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                        {s.scheme_name}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        Launched {new Date(s.launch_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      </div>
                    </div>
                    <div
                      className="h-11 w-11 rounded-lg flex items-center justify-center text-sm font-mono font-bold shrink-0 shadow-xs"
                      style={{
                        background: s.color + "15",
                        color: s.color,
                        border: `1px solid ${s.color}40`,
                      }}
                    >
                      {s.scheme_code.slice(0, 2)}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-4">
                    {s.description}
                  </p>

                  {/* Ministry */}
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3.5 mb-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                          Nodal Ministry
                        </div>
                        <div className="text-xs md:text-sm font-bold text-gray-900 mt-0.5">
                          {s.ministry?.ministry_name ?? "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#0B4F9C] flex items-center gap-1.5 justify-end font-bold">
                          <Mail className="h-3.5 w-3.5" />
                          {s.ministry?.ministry_code ?? "—"}
                        </div>
                        <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                          {s.ministry?.nodal_email ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Key metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                    <Metric label="Allocated" value={fmtCr(k.released + (k.released * 0.2))} />
                    <Metric label="Released" value={fmtCr(k.released)} />
                    <Metric label="Utilized" value={fmtCr(k.utilized)} />
                    <Metric label="Beneficiaries" value={fmtNum(k.beneficiaries)} />
                  </div>

                  {/* Util bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-500 font-medium">Utilization rate</span>
                      <span
                        className={
                          "font-mono font-bold text-xs px-2 py-0.5 rounded border " +
                          (k.utilizationPct >= 70
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : k.utilizationPct >= 50
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-red-50 text-red-800 border-red-200")
                        }
                      >
                        {k.utilizationPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(k.utilizationPct, 100)}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Status & action */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-1.5">
                      {s.is_active ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-semibold">Active ingestion</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-600" />
                          <span className="text-xs text-red-700 font-semibold">Inactive</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => openScheme(s.scheme_id)}
                      className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      Open scheme detail
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5 shadow-xs">
      <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold truncate">
        {label}
      </div>
      <div className="text-xs md:text-sm text-gray-900 font-mono font-bold mt-0.5 truncate">
        {value}
      </div>
    </div>
  );
}
