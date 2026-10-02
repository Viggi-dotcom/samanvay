"use client";

import { useState } from "react";
import { Shield, Lock, Building2, ChevronRight, Globe2 } from "lucide-react";
import { PERSONAS, type Persona } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LoginScreen() {
  const login = useApp((s) => s.login);
  const [selected, setSelected] = useState<Persona | null>(PERSONAS[0]);

  return (
    <div className="min-h-screen bg-app flex flex-col lg:flex-row">
      {/* Left: Brand panel */}
      <div className="lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 30%, #2563EB 0, transparent 40%), radial-gradient(circle at 80% 70%, #06B6D4 0, transparent 40%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              Samanvay Intelligence
            </div>
            <div className="text-xs text-secondary-muted">
              AI-Powered Governance Intelligence Platform
            </div>
          </div>
        </div>

        <div className="relative z-10 my-12 lg:my-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-xs text-cyan-300 mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Anchored on canonical LGD codes · India
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-white mb-4">
            Cross-scheme convergence
            <br />
            intelligence for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              governance
            </span>{" "}
            outcomes
          </h1>
          <p className="text-secondary-muted text-base max-w-md leading-relaxed">
            Integrates MGNREGA, PM-KISAN and PMAY-G implementation data with
            anomaly detection, traceable NL-to-SQL querying, and row-level
            security scoped to your LGD jurisdiction.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: Building2, label: "3 Schemes", sub: "MGNREGA · PM-KISAN · PMAY-G" },
              { icon: Globe2, label: "742 LGD Districts", sub: "Canonical spatial anchor" },
              { icon: Lock, label: "JWT-scoped RLS", sub: "Role + LGD claims enforced" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-subtle bg-surface-elevated p-3"
              >
                <s.icon className="h-4 w-4 text-cyan-400 mb-2" />
                <div className="text-xs font-semibold text-white">{s.label}</div>
                <div className="text-[10px] text-secondary-muted leading-tight mt-0.5">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-tertiary">
          Government of India · Restricted access. All actions logged under
          CAG-compliant audit trail.
        </div>
      </div>

      {/* Right: Role picker / auth */}
      <div className="lg:w-1/2 bg-surface-elevated border-l border-subtle flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-cyan-400 mb-2">
              Multi-factor Government SSO
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Select persona to simulate session
            </h2>
            <p className="text-sm text-secondary-muted">
              In production, login flows through ID.gov.in + Supabase GoTrue
              with RBAC JWT claims. Choose a role below to preview the
              role-scoped experience.
            </p>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {PERSONAS.map((p) => (
              <button
                key={p.role}
                onClick={() => setSelected(p)}
                className={cn(
                  "w-full text-left rounded-lg border p-3 transition-all",
                  selected?.role === p.role
                    ? "border-blue-500 bg-blue-950/30 ring-1 ring-blue-500"
                    : "border-subtle bg-app hover:border-blue-600/50 hover:bg-surface-hover"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-xs font-mono font-semibold",
                      selected?.role === p.role
                        ? "bg-blue-600 text-white"
                        : "bg-surface-hover text-secondary-muted"
                    )}
                  >
                    {p.role.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        {p.label}
                      </span>
                      {p.assignedLgdCode && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800/50">
                          LGD {p.assignedLgdCode}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-secondary-muted mt-0.5">
                      {p.targetUser}
                    </div>
                    <div className="text-[11px] text-tertiary mt-1 line-clamp-1">
                      {p.dataAccessScope}
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      selected?.role === p.role
                        ? "text-blue-400"
                        : "text-tertiary"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => selected && login(selected)}
            disabled={!selected}
            className="mt-6 w-full h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            Authenticate &amp; Enter Platform
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-4 flex items-center justify-between text-[11px] text-tertiary">
            <span>Session secured by Supabase Auth · GoTrue RBAC JWT</span>
            <span className="font-mono">v0.9.0-mvp</span>
          </div>
        </div>
      </div>
    </div>
  );
}
