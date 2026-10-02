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
    <div className="space-y-5">
      <PageHeader
        title="Scheme Directory"
        subtitle="Comprehensive catalog of centrally sponsored and central sector schemes ingested into the platform"
        icon={Building2}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            {schemes.length} ACTIVE SCHEMES
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full p-12 text-center">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin inline-block" />
            <span className="ml-2 text-xs text-tertiary">Loading schemes from /api/schemes…</span>
          </div>
        ) : (
          schemes.map((s) => {
          const k = s.metrics;
          return (
            <Card key={s.scheme_id} bodyClassName="p-0" className="overflow-hidden">
              <div className="h-1" style={{ background: s.color }} />
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-tertiary">
                        {s.scheme_code} · {s.scheme_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white leading-snug">
                      {s.scheme_name}
                    </h3>
                    <div className="text-[11px] text-tertiary mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Launched {new Date(s.launch_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div
                    className="h-12 w-12 rounded-md flex items-center justify-center text-sm font-mono font-bold shrink-0"
                    style={{
                      background: s.color + "20",
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                    }}
                  >
                    {s.scheme_code.slice(0, 2)}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-secondary-muted leading-relaxed mb-4">
                  {s.description}
                </p>

                {/* Ministry */}
                <div className="rounded-md bg-app border border-subtle p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-tertiary">
                        Nodal Ministry
                      </div>
                      <div className="text-xs font-medium text-white mt-0.5">
                        {s.ministry?.ministry_name ?? "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-tertiary flex items-center gap-1 justify-end">
                        <Mail className="h-3 w-3" />
                        {s.ministry?.ministry_code ?? "—"}
                      </div>
                      <div className="text-[10px] text-tertiary font-mono mt-0.5">
                        {s.ministry?.nodal_email ?? "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <Metric label="Allocated" value={fmtCr(k.released + (k.released * 0.2))} />
                  <Metric label="Released" value={fmtCr(k.released)} />
                  <Metric label="Utilized" value={fmtCr(k.utilized)} />
                  <Metric label="Beneficiaries" value={fmtNum(k.beneficiaries)} />
                </div>

                {/* Util bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-tertiary">Utilization rate</span>
                    <span
                      className={
                        "font-mono font-bold " +
                        (k.utilizationPct >= 70
                          ? "text-emerald-400"
                          : k.utilizationPct >= 50
                            ? "text-amber-300"
                            : "text-red-300")
                      }
                    >
                      {k.utilizationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-surface-hover">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(k.utilizationPct, 100)}%`,
                        background: s.color,
                      }}
                    />
                  </div>
                </div>

                {/* Status & action */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {s.is_active ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-[11px] text-emerald-400">Active ingestion</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-[11px] text-red-400">Inactive</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => openScheme(s.scheme_id)}
                    className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    Open scheme detail
                    <ArrowRight className="h-3 w-3" />
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
    <div className="rounded-md bg-app border border-subtle p-2">
      <div className="text-[9px] uppercase tracking-wider text-tertiary">
        {label}
      </div>
      <div className="text-xs text-white font-mono font-semibold mt-0.5">
        {value}
      </div>
    </div>
  );
}
