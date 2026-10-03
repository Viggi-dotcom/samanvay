"use client";

import { useState } from "react";
import {
  Database,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  RefreshCw,
  Terminal,
  History,
  Cpu,
  Loader2,
  X,
} from "lucide-react";
import {
  useApp,
  PageHeader,
  Card,
  StatusPill,
} from "@/components/app-shell";
import {
  usePipelines,
  useProvisionedUsers,
  useSuspendUser,
  useProvisionUser,
  useAuditLog,
} from "@/lib/api/hooks";
import { fmtNum } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function AdminPipelinesView() {
  const { data, isLoading } = usePipelines();
  const pipelines = data?.pipelines ?? [];
  const { data: auditData } = useAuditLog(20);
  const auditLogs = auditData?.logs ?? [];

  const totalRecords = pipelines.reduce((s, r) => s + r.recordsIngested, 0);
  const partialCount = pipelines.filter((r) => r.status === "PARTIAL").length;
  const avgDuration = pipelines.length > 0
    ? Math.round(pipelines.reduce((s, r) => s + r.durationSec, 0) / pipelines.length)
    : 0;

  return (
    <div className="space-y-7">
      <PageHeader
        title="ETL & Pipeline Controls"
        subtitle="n8n ingestion scheduler · LGD harmonization status · data freshness audit"
        icon={Database}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs">
            n8n · RAILWAY
          </span>
        }
        actions={
          <button
            onClick={() => toast.info("Manual trigger dispatched to n8n orchestration webhook")}
            className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Trigger Manual Run
          </button>
        }
      />

      {/* Pipeline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card bodyClassName="p-4.5">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-500">
            Pipeline Runs
          </div>
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 mt-2" />
          ) : (
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 font-mono mt-1">{pipelines.length}</div>
          )}
          <div className="text-xs text-gray-500 mt-1 font-mono">Automated cron runs</div>
        </Card>
        <Card bodyClassName="p-4.5">
          <div className="text-xs uppercase font-bold tracking-wider text-emerald-700">
            Records Ingested
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-emerald-700 font-mono mt-1">
            {fmtNum(totalRecords)}
          </div>
          <div className="text-xs text-gray-500 mt-1 font-mono">Harmonized into Postgres</div>
        </Card>
        <Card bodyClassName="p-4.5">
          <div className="text-xs uppercase font-bold tracking-wider text-amber-700">
            Partial Runs
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-amber-700 font-mono mt-1">{partialCount}</div>
          <div className="text-xs text-gray-500 mt-1 font-mono">LGD fallback resolution</div>
        </Card>
        <Card bodyClassName="p-4.5">
          <div className="text-xs uppercase font-bold tracking-wider text-gray-500">
            Avg Duration
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-gray-900 font-mono mt-1">{avgDuration} s</div>
          <div className="text-xs text-gray-500 mt-1 font-mono">Per ETL execution cycle</div>
        </Card>
      </div>

      {/* Pipeline runs table */}
      <Card
        title="Pipeline Run History"
        subtitle="Daily 02:00 IST ingestion + weekly Monday 04:00 IST anomaly detection"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Pipeline
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Scheme / Source
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Schedule (Cron)
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Records
                </th>
                <th className="text-right px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Duration
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Last Run
                </th>
                <th className="text-center px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pipelines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
                    Loading pipeline runs from /api/admin/pipelines…
                  </td>
                </tr>
              ) : (
                pipelines.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="text-gray-900 font-bold font-mono text-xs">{r.id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-gray-900 font-bold text-sm">{r.scheme}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{r.source}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[#0B4F9C] font-mono text-xs font-semibold">{r.schedule}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-900 font-bold">
                      {r.recordsIngested.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-700 font-medium">
                      {r.durationSec}s
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                      {new Date(r.lastRun).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusPill status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Architecture diagram */}
      <Card
        title="Ingestion & LGD Harmonization Workflow"
        subtitle="Workflow A · n8n pipeline architecture & data integrity guardrails"
        bodyClassName="p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          {[
            { label: "Ingest", sub: "HTTP Request nodes", icon: RefreshCw, color: "#0B4F9C" },
            { label: "Stage", sub: "staging_unstructured_imports", icon: Database, color: "#7C3AED" },
            { label: "Harmonize", sub: "fn_harmonize_lgd_entities()", icon: Cpu, color: "#0B4F9C" },
            { label: "Verify", sub: "Levenshtein ≤ 2 fallback", icon: CheckCircle2, color: "#059669" },
            { label: "Upsert", sub: "ON CONFLICT DO UPDATE", icon: Activity, color: "#16A34A" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex-1 rounded-lg bg-gray-50 border border-gray-200 p-4 text-center shadow-xs">
                <step.icon className="h-6 w-6 mx-auto mb-2" style={{ color: step.color }} />
                <div className="text-sm font-bold text-gray-900">
                  {i + 1}. {step.label}
                </div>
                <div className="text-[11px] text-gray-500 font-mono mt-0.5 truncate">
                  {step.sub}
                </div>
              </div>
              {i < 4 && (
                <div className="hidden md:block w-3 h-0.5 bg-gray-300 mx-1" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600 leading-relaxed font-mono">
          Records that fail LGD entity resolution are flagged with{" "}
          <code className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold">lgd_code = 999999</code>{" "}
          and queued for human review at the next Block Development Officer triage window.
        </div>
      </Card>

      {/* Audit log */}
      <Card
        title="Audit Log"
        subtitle="CAG-compliant immutable action trail · persisted in audit_log table"
        actions={<History className="h-4 w-4 text-gray-500" />}
        bodyClassName="p-0"
      >
        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-500 text-sm">
              <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
              Loading audit log from /api/admin/audit…
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50/80 transition-colors">
                <Terminal className="h-4 w-4 text-[#0B4F9C] shrink-0" />
                <span className="text-xs font-mono text-gray-500 w-36 shrink-0">
                  {new Date(log.ts).toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-gray-900 font-mono font-bold">
                  {log.user_email ?? log.actor}
                </span>
                <span className="text-[11px] text-amber-800 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {log.action}
                </span>
                <span className="text-xs text-gray-600 font-mono ml-auto truncate">
                  → {log.target}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export function AdminUsersView() {
  const { data, isLoading } = useProvisionedUsers();
  const users = data?.users ?? [];
  const provisionMutation = useProvisionUser();
  const suspendMutation = useSuspendUser();
  const [showProvisionForm, setShowProvisionForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "central_executive",
    ministryId: "",
    assignedLgdCode: "",
    password: "demo123",
  });

  function handleProvision(e: React.FormEvent) {
    e.preventDefault();
    provisionMutation.mutate(
      {
        name: form.name,
        email: form.email,
        role: form.role,
        password: form.password,
        ministryId: form.ministryId || undefined,
        assignedLgdCode: form.assignedLgdCode ? Number(form.assignedLgdCode) : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`Provisioned ${form.email}`);
          setShowProvisionForm(false);
          setForm({ ...form, name: "", email: "" });
        },
        onError: (err: any) => toast.error(`Failed: ${err.message}`),
      }
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="User Provisioning"
        subtitle="RBAC role assignment · LGD scope binding · JWT claim management"
        icon={Users}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 shadow-xs">
            NEXTAUTH · JWT
          </span>
        }
        actions={
          <button
            onClick={() => setShowProvisionForm((v) => !v)}
            className="h-9 px-3.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Users className="h-4 w-4" />
            {showProvisionForm ? "Close Form" : "Provision New User"}
          </button>
        }
      />

      {/* Provision form */}
      {showProvisionForm && (
        <Card title="Provision New User" subtitle="POST /api/admin/users · audit-logged" bodyClassName="p-6 md:p-8">
          <form onSubmit={handleProvision} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
                placeholder="Sh. New Officer"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
                placeholder="new.officer@gov.in"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-medium focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
              >
                <option value="central_executive">central_executive</option>
                <option value="dept_nodal">dept_nodal</option>
                <option value="district_magistrate">district_magistrate</option>
                <option value="auditor">auditor</option>
                <option value="super_admin">super_admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Ministry ID (optional)</label>
              <input
                value={form.ministryId}
                onChange={(e) => setForm({ ...form, ministryId: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
                placeholder="min-mord"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Assigned LGD (DM only)</label>
              <input
                value={form.assignedLgdCode}
                onChange={(e) => setForm({ ...form, assignedLgdCode: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
                placeholder="463"
              />
            </div>
            <div>
              <label className="text-xs uppercase font-bold tracking-wider text-gray-600 block mb-1.5">Password</label>
              <input
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-10 px-3.5 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 font-mono focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] shadow-xs"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3 mt-3">
              <button
                type="submit"
                disabled={provisionMutation.isPending}
                className="h-9 px-4 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs font-bold disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {provisionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowProvisionForm(false)}
                className="h-9 px-3.5 rounded-lg bg-white border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Provisioned Users" subtitle={`${users.length} accounts · live from /api/admin/users`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  User
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Ministry / Org
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  LGD Scope
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Last Active
                </th>
                <th className="text-center px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin inline-block mr-2 text-[#0B4F9C]" />
                    Loading users from /api/admin/users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-500 text-sm">
                    No users provisioned.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-[#0B4F9C] flex items-center justify-center text-xs font-bold shrink-0 border border-blue-200">
                          {u.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-gray-900 font-bold text-sm truncate">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "text-xs font-mono uppercase px-2.5 py-0.5 rounded border font-semibold",
                          u.role === "super_admin"
                            ? "bg-purple-50 text-purple-800 border-purple-200"
                            : u.role === "central_executive"
                              ? "bg-blue-50 text-blue-800 border-blue-200"
                              : u.role === "district_magistrate"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : u.role === "auditor"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                        )}
                      >
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium">
                      {u.ministry}
                    </td>
                    <td className="px-5 py-3.5 text-[#0B4F9C] font-mono text-xs font-bold">
                      {u.lgd_scope}
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                      {u.last_active ? new Date(u.last_active).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <StatusPill status={u.status} />
                        {u.status === "ACTIVE" && (
                          <button
                            onClick={() => {
                              if (confirm(`Suspend ${u.email}? They will be unable to log in.`)) {
                                suspendMutation.mutate(u.id, {
                                  onSuccess: () => toast.success(`Suspended ${u.email}`),
                                  onError: (err: any) => toast.error(`Failed: ${err.message}`),
                                });
                              }
                            }}
                            disabled={suspendMutation.isPending}
                            className="text-xs text-red-600 hover:text-red-700 underline font-semibold cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* RBAC matrix reference */}
      <Card title="RBAC Permission Matrix" subtitle="PostgreSQL Row-Level Security policies" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Role
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Read Scope
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  Write Scope
                </th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-gray-600 font-bold">
                  RLS Policy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-mono text-xs font-bold">super_admin</td>
                <td className="px-5 py-3.5">Global system-wide</td>
                <td className="px-5 py-3.5">Schema + user provisioning</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#0B4F9C] font-semibold">All tables · all rows</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-mono text-xs font-bold">central_executive</td>
                <td className="px-5 py-3.5">Pan-India, cross-ministry</td>
                <td className="px-5 py-3.5 text-gray-400 font-medium">None (read-only)</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#0B4F9C] font-semibold">p_central_read_all_*</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-mono text-xs font-bold">dept_nodal</td>
                <td className="px-5 py-3.5">Ministry-specific (deep) + cross-ministry (aggregated)</td>
                <td className="px-5 py-3.5">Threshold alerts for own scheme</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#0B4F9C] font-semibold">p_dept_nodal_read_own_scheme_*</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-mono text-xs font-bold">district_magistrate</td>
                <td className="px-5 py-3.5">District-specific (down to GP)</td>
                <td className="px-5 py-3.5">ACK / RESOLVE anomalies in own LGD</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#0B4F9C] font-semibold">p_dm_read_local_geography + p_update_anomalies_scope</td>
              </tr>
              <tr className="hover:bg-gray-50/80 transition-colors">
                <td className="px-5 py-3.5 text-gray-900 font-mono text-xs font-bold">auditor</td>
                <td className="px-5 py-3.5">Anonymized Pan-India</td>
                <td className="px-5 py-3.5 text-gray-400 font-medium">None (PII masked)</td>
                <td className="px-5 py-3.5 font-mono text-xs text-[#0B4F9C] font-semibold">p_central_read_all_* (PII redacted)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
