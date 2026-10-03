"use client";

import { useState } from "react";
import {
  FileText,
  Shield,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Download,
  Printer,
  X,
  Plus,
  Loader2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { useApp, PageHeader, Card, StatusPill, SeverityBadge } from "@/components/app-shell";
import { useDirectives, useCreateDirective, useUpdateDirectiveStatus, type Directive } from "@/lib/api/hooks";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DirectivesView() {
  const filters = useApp((s) => s.filters);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedDirective, setSelectedDirective] = useState<Directive | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);

  const { data, isLoading } = useDirectives({
    status: statusFilter,
    stateLgd: filters.stateLgd,
    districtLgd: filters.districtLgd,
  });

  const updateStatusMutation = useUpdateDirectiveStatus();
  const createDirectiveMutation = useCreateDirective();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const directives = data?.directives ?? [];
  const stats = data?.stats ?? { total: 0, critical: 0, issued: 0, inProgress: 0, complianceReceived: 0 };

  // Form state for drafting new directive
  const [form, setForm] = useState({
    title: "",
    stateName: "Bihar",
    targetStateLgd: 10,
    districtName: "Araria",
    targetDistrictLgd: 216,
    targetMinistries: "Ministry of Rural Development, Ministry of Agriculture & Farmers Welfare",
    evidenceSummary: "",
    action1: "",
    action2: "",
    priority: "HIGH",
    deadlineDays: 30,
  });

  function handleDraftSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.evidenceSummary || !form.action1) {
      toast.error("Please fill in all mandatory directive fields");
      return;
    }

    const actionList = [
      { step: 1, action: form.action1, nodal: "District Magistrate & CDO" },
    ];
    if (form.action2) {
      actionList.push({ step: 2, action: form.action2, nodal: "State Nodal Officer" });
    }

    createDirectiveMutation.mutate(
      {
        title: form.title,
        stateName: form.stateName,
        targetStateLgd: Number(form.targetStateLgd),
        districtName: form.districtName,
        targetDistrictLgd: Number(form.targetDistrictLgd),
        targetMinistries: form.targetMinistries,
        evidenceSummary: form.evidenceSummary,
        directives: actionList,
        priority: form.priority as any,
        deadlineDays: Number(form.deadlineDays),
      },
      {
        onSuccess: () => {
          toast.success("Inter-Ministerial Directive issued & dispatched to PMU!");
          setIsDrafting(false);
          setForm({
            title: "",
            stateName: "Bihar",
            targetStateLgd: 10,
            districtName: "Araria",
            targetDistrictLgd: 216,
            targetMinistries: "Ministry of Rural Development, Ministry of Agriculture & Farmers Welfare",
            evidenceSummary: "",
            action1: "",
            action2: "",
            priority: "HIGH",
            deadlineDays: 30,
          });
        },
        onError: (err: any) => toast.error(`Directive issue failed: ${err.message}`),
      }
    );
  }

  function advanceStatus(d: Directive) {
    const nextStatus =
      d.status === "ISSUED"
        ? "IN_PROGRESS"
        : d.status === "IN_PROGRESS"
          ? "COMPLIANCE_RECEIVED"
          : "CLOSED";

    updateStatusMutation.mutate(
      { id: d.id, status: nextStatus },
      {
        onSuccess: () => toast.success(`Directive updated to ${nextStatus}`),
        onError: (err: any) => toast.error(err.message),
      }
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Inter-Ministerial Action Directives"
        subtitle="Cabinet Secretariat policy intervention engine · binding cross-ministerial orders to resolve convergence gaps."
        icon={Shield}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            CABINET SECRETARIAT PMU
          </span>
        }
        actions={
          role !== "auditor" && (
            <button
              onClick={() => setIsDrafting(true)}
              className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Draft Intervention Directive
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card bodyClassName="p-5" className="border border-slate-200 bg-white shadow-xs border-l-4 border-l-[#0B4F9C]">
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500">Total Directives</div>
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-[#0B4F9C] mt-2" /> : (
            <div className="text-3xl font-extrabold text-slate-900 font-mono mt-1">{stats.total}</div>
          )}
          <div className="text-xs text-slate-500 mt-1">Active across all states</div>
        </Card>
        <Card bodyClassName="p-5" className="border border-red-200 bg-white shadow-xs border-l-4 border-l-red-600">
          <div className="text-xs uppercase font-bold tracking-wider text-red-700">Critical Priority</div>
          <div className="text-3xl font-extrabold text-red-700 font-mono mt-1">{stats.critical}</div>
          <div className="text-xs text-slate-500 mt-1">High financial or physical risk</div>
        </Card>
        <Card bodyClassName="p-5" className="border border-amber-200 bg-white shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs uppercase font-bold tracking-wider text-amber-700">Action In-Progress</div>
          <div className="text-3xl font-extrabold text-amber-700 font-mono mt-1">{stats.inProgress}</div>
          <div className="text-xs text-slate-500 mt-1">District teams mobilised</div>
        </Card>
        <Card bodyClassName="p-5" className="border border-emerald-200 bg-white shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">Compliance Received</div>
          <div className="text-3xl font-extrabold text-emerald-700 font-mono mt-1">{stats.complianceReceived}</div>
          <div className="text-xs text-slate-500 mt-1">Validated by Central PMU</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        {["ALL", "ISSUED", "IN_PROGRESS", "COMPLIANCE_RECEIVED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
              statusFilter === st
                ? "bg-[#0B4F9C] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white"
            )}
          >
            {st.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Directives List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 flex items-center justify-center shadow-xs">
            <Loader2 className="h-6 w-6 text-[#0B4F9C] animate-spin" />
            <span className="ml-3 text-sm text-slate-600 font-medium">Loading directives from /api/directives…</span>
          </div>
        ) : directives.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-xs">
            No directives match the selected filter.
          </div>
        ) : (
          directives.map((d) => (
            <Card key={d.id} bodyClassName="p-6" className="bg-white border border-slate-200 hover:border-blue-400 transition-all shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[#0B4F9C] font-bold">
                      {d.refNumber}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-mono font-bold px-2 py-0.5 rounded-md uppercase border",
                        d.priority === "CRITICAL"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      )}
                    >
                      {d.priority} PRIORITY
                    </span>
                    <StatusPill status={d.status} />
                    <span className="text-xs text-slate-500 font-mono">
                      Target: {d.districtName ? `${d.districtName}, ` : ""}{d.stateName}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">{d.title}</h3>

                  <p className="text-xs md:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {d.evidenceSummary}
                  </p>

                  <div className="flex items-center gap-5 text-xs text-slate-500 font-mono pt-1 flex-wrap">
                    <span>Ministries: <span className="text-slate-900 font-semibold">{d.targetMinistries}</span></span>
                    <span>Signatories: <span className="text-slate-900 font-semibold">{d.participatingOfficers}</span></span>
                    <span>Window: <span className="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{d.deadlineDays} days</span></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                  <button
                    onClick={() => setSelectedDirective(d)}
                    className="h-9.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                  >
                    <FileText className="h-4 w-4 text-[#0B4F9C]" />
                    View Official OM
                  </button>

                  {role !== "auditor" && d.status !== "CLOSED" && (
                    <button
                      onClick={() => advanceStatus(d)}
                      disabled={updateStatusMutation.isPending}
                      className="h-9.5 px-4 rounded-xl bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {d.status === "ISSUED"
                        ? "Mark In-Progress"
                        : d.status === "IN_PROGRESS"
                          ? "Submit Compliance"
                          : "Close Directive"}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Official OM Document Viewer Modal */}
      {selectedDirective && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in zoom-in-95 text-slate-900">
            {/* Header bar */}
            <div className="p-4 border-b border-blue-900 bg-[#0B4F9C] text-white flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <Shield className="h-5 w-5 text-amber-300" />
                <span className="text-xs font-mono font-bold text-white tracking-wide">
                  Government of India · Cabinet Secretariat PMU
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title="Print Office Memorandum"
                >
                  <Printer className="h-4.5 w-4.5 text-white" />
                </button>
                <button
                  onClick={() => setSelectedDirective(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
                >
                  <X className="h-4.5 w-4.5 text-white" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-8 md:p-10 space-y-6 text-slate-900 font-sans leading-relaxed text-xs md:text-sm bg-white">
              <div className="text-center space-y-1.5 border-b border-slate-200 pb-5">
                <div className="text-sm font-extrabold text-amber-600 uppercase tracking-widest">
                  सत्यमेव जयते
                </div>
                <div className="text-base font-bold text-slate-900 uppercase tracking-wider">
                  Cabinet Secretariat · Government of India
                </div>
                <div className="text-xs text-slate-500">
                  Rashtrapati Bhavan, New Delhi — 110004
                </div>
                <div className="text-xs text-[#0B4F9C] font-mono font-bold mt-1">
                  National Governance Convergence Mission · PMU
                </div>
              </div>

              <div className="flex justify-between items-start font-mono text-xs text-slate-600">
                <div>
                  No. <span className="text-slate-900 font-bold">{selectedDirective.refNumber}</span>
                </div>
                <div>
                  Date: <span className="text-slate-900 font-semibold">{new Date(selectedDirective.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              <div className="text-center font-bold text-base text-slate-900 uppercase tracking-wider underline underline-offset-6 decoration-[#0B4F9C]">
                OFFICE MEMORANDUM
              </div>

              <div className="space-y-1.5">
                <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">SUBJECT:</div>
                <div className="text-slate-900 font-bold text-sm leading-snug">
                  {selectedDirective.title}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">1. CONVERGENCE EVIDENCE BASE:</div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs md:text-sm text-slate-800 leading-relaxed">
                  {selectedDirective.evidenceSummary}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">2. ACTIONABLE DIRECTIVES & COMPLIANCE MANDATE:</div>
                <div className="space-y-3 pl-2">
                  {selectedDirective.directives.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="font-mono text-[#0B4F9C] font-bold shrink-0">({String.fromCharCode(97 + idx)})</span>
                      <div className="space-y-1">
                        <div className="text-slate-900 font-semibold">{item.action}</div>
                        <div className="text-xs text-amber-800 font-mono font-medium">
                          Action Agency: {item.nodal}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <div className="text-slate-500 font-bold text-xs uppercase tracking-wider">3. TIME-BOUND TIMELINE:</div>
                <div className="text-slate-700">
                  Compliance affidavit must be uploaded to the Samanvay Platform within{" "}
                  <strong className="text-slate-900 font-bold">{selectedDirective.deadlineDays} calendar days</strong> from the receipt of this Memorandum.
                </div>
              </div>

              <div className="pt-8 border-t border-slate-200 flex justify-between items-end flex-wrap gap-4">
                <div className="text-xs text-slate-500 font-mono">
                  Copy to: All Chief Secretaries & Nodal Ministries
                </div>
                <div className="text-right space-y-0.5 font-mono">
                  <div className="text-slate-900 font-bold text-xs">{selectedDirective.issuedByEmail}</div>
                  <div className="text-xs text-slate-500">Cabinet Secretariat PMU</div>
                  <div className="text-xs text-emerald-700 font-bold">Digitally Verified · GoI Trust Chain</div>
                </div>
              </div>
            </div>

            {/* Footer action */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `GOVERNMENT OF INDIA\nCABINET SECRETARIAT\nRef: ${selectedDirective.refNumber}\nSubject: ${selectedDirective.title}\n\nEvidence: ${selectedDirective.evidenceSummary}`
                  );
                  toast.success("Office Memorandum copied to clipboard");
                }}
                className="h-9.5 px-4 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 cursor-pointer shadow-xs"
              >
                Copy Text
              </button>
              <button
                onClick={() => setSelectedDirective(null)}
                className="h-9.5 px-5 rounded-xl bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-bold cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafting Modal */}
      {isDrafting && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 md:p-8 shadow-2xl space-y-5 animate-in zoom-in-95 text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Plus className="h-5 w-5 text-[#0B4F9C]" />
                <h3 className="text-base font-bold text-slate-900">Draft Inter-Ministerial Directive</h3>
              </div>
              <button onClick={() => setIsDrafting(false)} className="text-gray-500 hover:text-gray-900 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDraftSubmit} className="space-y-4 text-xs md:text-sm">
              <div>
                <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Directive Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Urgent Fund Realignment Directive for Wage & Housing Delivery"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Target State</label>
                  <input
                    type="text"
                    required
                    value={form.stateName}
                    onChange={(e) => setForm({ ...form, stateName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0B4F9C]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Target District (Optional)</label>
                  <input
                    type="text"
                    value={form.districtName}
                    onChange={(e) => setForm({ ...form, districtName: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#0B4F9C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Convergence Evidence Base</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the statistical gap or anomaly triggering this directive..."
                  value={form.evidenceSummary}
                  onChange={(e) => setForm({ ...form, evidenceSummary: e.target.value })}
                  className="w-full p-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C] focus:ring-2 focus:ring-blue-100 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Primary Directive Action (Clause A)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandate joint muster roll reconciliation within 14 days"
                  value={form.action1}
                  onChange={(e) => setForm({ ...form, action1: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C]"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Secondary Directive Action (Clause B)</label>
                <input
                  type="text"
                  placeholder="e.g. Reallocate ₹25 Cr underutilized material funds to rural housing"
                  value={form.action2}
                  onChange={(e) => setForm({ ...form, action2: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full h-10 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5 font-bold uppercase tracking-wider">Deadline (Days)</label>
                  <input
                    type="number"
                    value={form.deadlineDays}
                    onChange={(e) => setForm({ ...form, deadlineDays: Number(e.target.value) })}
                    className="w-full h-10 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsDrafting(false)}
                  className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDirectiveMutation.isPending}
                  className="h-10 px-5 rounded-xl bg-[#0B4F9C] hover:bg-[#093E7A] text-white font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {createDirectiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                  Dispatch Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
