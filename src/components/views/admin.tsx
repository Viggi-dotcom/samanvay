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
    <div className="space-y-5">
      <PageHeader
        title="ETL & Pipeline Controls"
        subtitle="n8n ingestion scheduler · LGD harmonization status · data freshness audit"
        icon={Database}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60">
            n8n · RAILWAY
          </span>
        }
        actions={
          <button
            onClick={() => toast.info("Manual trigger would dispatch n8n webhook in production")}
            className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Trigger Manual Run
          </button>
        }
      />

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card bodyClassName="p-3">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Pipeline Runs
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-tertiary mt-2" />
          ) : (
            <div className="text-xl font-bold text-white font-mono mt-1">{pipelines.length}</div>
          )}
        </Card>
        <Card bodyClassName="p-3" className="border-emerald-900/40">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Records Ingested
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {fmtNum(totalRecords)}
          </div>
        </Card>
        <Card bodyClassName="p-3" className="border-amber-900/40">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Partial Runs
          </div>
          <div className="text-xl font-bold text-amber-300 font-mono mt-1">{partialCount}</div>
        </Card>
        <Card bodyClassName="p-3">
          <div className="text-[10px] uppercase tracking-wider text-tertiary">
            Avg Duration
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">{avgDuration} s</div>
        </Card>
      </div>

      {/* Pipeline runs table */}
      <Card
        title="Pipeline Run History"
        subtitle="Daily 02:00 IST ingestion + weekly Monday 04:00 IST anomaly detection"
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Pipeline
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Scheme / Source
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Schedule (Cron)
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Records
                </th>
                <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Duration
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Last Run
                </th>
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {pipelines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-tertiary text-xs">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading pipeline runs from /api/admin/pipelines…
                  </td>
                </tr>
              ) : (
                pipelines.map((r) => (
                  <tr key={r.id} className="border-b border-subtle hover:bg-surface-hover">
                    <td className="px-3 py-2.5">
                      <div className="text-white font-medium font-mono text-[11px]">{r.id}</div>
                    </td>
                    <td className="px-3 py-2.5 text-secondary-muted">
                      <div className="text-white">{r.scheme}</div>
                      <div className="text-[10px] text-tertiary">{r.source}</div>
                    </td>
                    <td className="px-3 py-2.5 text-tertiary font-mono text-[10px]">{r.schedule}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-cyan-300">
                      {r.recordsIngested.toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-secondary-muted">
                      {r.durationSec}s
                    </td>
                    <td className="px-3 py-2.5 text-tertiary font-mono text-[10px]">
                      {new Date(r.lastRun).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-2.5 text-center">
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
        subtitle="Workflow A · n8n pipeline architecture"
        bodyClassName="p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center">
          {[
            { label: "Ingest", sub: "HTTP Request nodes", icon: RefreshCw, color: "#06B6D4" },
            { label: "Stage", sub: "staging_unstructured_imports", icon: Database, color: "#8B5CF6" },
            { label: "Harmonize", sub: "fn_harmonize_lgd_entities()", icon: Cpu, color: "#2563EB" },
            { label: "Verify", sub: "Levenshtein ≤ 2 fallback", icon: CheckCircle2, color: "#06B6D4" },
            { label: "Upsert", sub: "ON CONFLICT DO UPDATE", icon: Activity, color: "#10B981" },
          ].map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex-1 rounded-md bg-app border border-subtle p-3 text-center">
                <step.icon className="h-5 w-5 mx-auto mb-2" style={{ color: step.color }} />
                <div className="text-xs font-semibold text-white">
                  {i + 1}. {step.label}
                </div>
                <div className="text-[10px] text-tertiary font-mono mt-0.5">
                  {step.sub}
                </div>
              </div>
              {i < 4 && (
                <div className="hidden md:block w-4 h-px bg-subtle mx-1" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-tertiary leading-relaxed">
          Records that fail LGD entity resolution are flagged with{" "}
          <code className="font-mono text-amber-300">lgd_code = 999999</code>{" "}
          and queued for human review at the next Block Development Officer
          triage window.
        </div>
      </Card>

      {/* Audit log */}
      <Card
        title="Audit Log"
        subtitle="CAG-compliant immutable action trail · persisted in audit_log table"
        actions={<History className="h-4 w-4 text-tertiary" />}
        bodyClassName="p-0"
      >
        <div className="divide-y divide-subtle max-h-72 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="px-4 py-6 text-center text-tertiary text-xs">
              <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
              Loading audit log from /api/admin/audit…
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-hover">
                <Terminal className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="text-[10px] font-mono text-tertiary w-32 shrink-0">
                  {new Date(log.ts).toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-white font-mono">
                  {log.user_email ?? log.actor}
                </span>
                <span className="text-[10px] text-amber-300 font-mono">
                  {log.action}
                </span>
                <span className="text-[10px] text-tertiary font-mono ml-auto truncate">
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
    <div className="space-y-5">
      <PageHeader
        title="User Provisioning"
        subtitle="RBAC role assignment · LGD scope binding · JWT claim management"
        icon={Users}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-900/60">
            NEXTAUTH · JWT
          </span>
        }
        actions={
          <button
            onClick={() => setShowProvisionForm((v) => !v)}
            className="h-9 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            {showProvisionForm ? "Close Form" : "Provision New User"}
          </button>
        }
      />

      {/* Provision form */}
      {showProvisionForm && (
        <Card title="Provision New User" subtitle="POST /api/admin/users · audit-logged" bodyClassName="p-4">
          <form onSubmit={handleProvision} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white focus:outline-none focus:border-blue-500"
                placeholder="Sh. New Officer"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Email</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="new.officer@gov.in"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="central_executive">central_executive</option>
                <option value="dept_nodal">dept_nodal</option>
                <option value="district_magistrate">district_magistrate</option>
                <option value="auditor">auditor</option>
                <option value="super_admin">super_admin</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Ministry ID (optional)</label>
              <input
                value={form.ministryId}
                onChange={(e) => setForm({ ...form, ministryId: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="min-mord"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Assigned LGD (DM only)</label>
              <input
                value={form.assignedLgdCode}
                onChange={(e) => setForm({ ...form, assignedLgdCode: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="463"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-tertiary block mb-1">Password</label>
              <input
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full h-9 px-3 rounded-md bg-app border border-subtle text-sm text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2 mt-2">
              <button
                type="submit"
                disabled={provisionMutation.isPending}
                className="h-9 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
              >
                {provisionMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowProvisionForm(false)}
                className="h-9 px-3 rounded-md bg-app border border-subtle hover:border-red-700/50 text-xs text-secondary-muted hover:text-red-300 flex items-center gap-1.5"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card title="Provisioned Users" subtitle={`${users.length} accounts · live from /api/admin/users`} bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  User
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Role
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Ministry / Org
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  LGD Scope
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Last Active
                </th>
                <th className="text-center px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tertiary text-xs">
                    <Loader2 className="h-4 w-4 animate-spin inline-block mr-2" />
                    Loading users from /api/admin/users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-tertiary text-xs">
                    No users provisioned.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-subtle hover:bg-surface-hover">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
                          {u.name.split(" ").slice(0, 2).map((n) => n[0]).join("")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate">
                            {u.name}
                          </div>
                          <div className="text-[10px] text-tertiary font-mono">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border",
                          u.role === "super_admin"
                            ? "bg-purple-950 text-purple-300 border-purple-900/60"
                            : u.role === "central_executive"
                              ? "bg-blue-950 text-blue-300 border-blue-900/60"
                              : u.role === "district_magistrate"
                                ? "bg-amber-950 text-amber-300 border-amber-900/60"
                                : u.role === "auditor"
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-900/60"
                                  : "bg-slate-800 text-slate-300 border-slate-700"
                        )}
                      >
                        {u.role.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-secondary-muted">
                      {u.ministry}
                    </td>
                    <td className="px-3 py-2.5 text-cyan-300 font-mono text-[10px]">
                      {u.lgd_scope}
                    </td>
                    <td className="px-3 py-2.5 text-tertiary font-mono text-[10px]">
                      {u.last_active ? new Date(u.last_active).toLocaleString("en-IN") : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
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
                            className="text-[10px] text-red-300 hover:text-red-200 underline"
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
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-subtle bg-app">
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Role
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Read Scope
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  Write Scope
                </th>
                <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-wider text-tertiary font-medium">
                  RLS Policy
                </th>
              </tr>
            </thead>
            <tbody className="text-secondary-muted">
              <tr className="border-b border-subtle">
                <td className="px-3 py-2.5 text-white font-mono text-[10px]">super_admin</td>
                <td className="px-3 py-2.5">Global system-wide</td>
                <td className="px-3 py-2.5">Schema + user provisioning</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-cyan-300">All tables · all rows</td>
              </tr>
              <tr className="border-b border-subtle">
                <td className="px-3 py-2.5 text-white font-mono text-[10px]">central_executive</td>
                <td className="px-3 py-2.5">Pan-India, cross-ministry</td>
                <td className="px-3 py-2.5 text-tertiary">None (read-only)</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-cyan-300">p_central_read_all_*</td>
              </tr>
              <tr className="border-b border-subtle">
                <td className="px-3 py-2.5 text-white font-mono text-[10px]">dept_nodal</td>
                <td className="px-3 py-2.5">Ministry-specific (deep) + cross-ministry (aggregated)</td>
                <td className="px-3 py-2.5">Threshold alerts for own scheme</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-cyan-300">p_dept_nodal_read_own_scheme_*</td>
              </tr>
              <tr className="border-b border-subtle">
                <td className="px-3 py-2.5 text-white font-mono text-[10px]">district_magistrate</td>
                <td className="px-3 py-2.5">District-specific (down to GP)</td>
                <td className="px-3 py-2.5">ACK / RESOLVE anomalies in own LGD</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-cyan-300">p_dm_read_local_geography + p_update_anomalies_scope</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 text-white font-mono text-[10px]">auditor</td>
                <td className="px-3 py-2.5">Anonymized Pan-India</td>
                <td className="px-3 py-2.5 text-tertiary">None (PII masked)</td>
                <td className="px-3 py-2.5 font-mono text-[10px] text-cyan-300">p_central_read_all_* (PII redacted)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
