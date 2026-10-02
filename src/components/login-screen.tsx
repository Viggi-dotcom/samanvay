"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Lock, Building2, ChevronRight, Globe2, Loader2, AlertCircle } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

const DEMO_USERS = [
  { email: "r.kumar@cabsec.gov.in", label: "Central Executive Secretary", org: "Cabinet Secretariat, NITI Aayog", scope: "Pan-India, Cross-Ministry", role: "central_executive" },
  { email: "v.nair@mord.gov.in", label: "Department Nodal Officer (MoRD)", org: "Joint Secretary / Director", scope: "Ministry-Scoped (MoRD)", role: "dept_nodal" },
  { email: "anjali.dm-gorakhpur@up.gov.in", label: "District Magistrate — Gorakhpur", org: "District Collector, LGD 463", scope: "District-Specific", role: "district_magistrate" },
  { email: "p.iyer@cag.gov.in", label: "Auditor / Research Analyst", org: "CAG, Independent Researchers", scope: "Anonymized Pan-India", role: "auditor" },
  { email: "arjun.nic@gov.in", label: "Super Admin (NIC)", org: "Platform Engineering / NIC Admin", scope: "Global System-wide", role: "super_admin" },
];

export function LoginScreen() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setView = useApp((s) => s.setView);
  const [selectedEmail, setSelectedEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If session becomes available, force refresh + push to overview
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.refresh();
      setView("overview");
    }
  }, [status, session, router, setView]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: selectedEmail,
        password,
        redirect: false,
      });
      setLoading(false);
      if (result?.error) {
        setError("Authentication failed — check credentials and try again. (Demo password: demo123)");
      } else if (result?.ok) {
        // Force a hard refresh so useSession picks up the new cookie
        // (especially important for cross-origin preview scenarios)
        router.refresh();
        // Fallback: if router.refresh doesn't immediately update useSession,
        // a soft reload guarantees the session is loaded
        setTimeout(() => router.refresh(), 200);
      } else {
        setError("Unexpected response from auth provider.");
      }
    } catch (err: any) {
      setLoading(false);
      setError("Network error: " + (err?.message ?? "unknown"));
    }
  }

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
            Production-grade platform integrating MGNREGA, PM-KISAN and PMAY-G
            implementation data with anomaly detection, traceable NL-to-SQL
            querying, and Row-Level Security scoped to your LGD jurisdiction.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: Building2, label: "3 Schemes", sub: "MGNREGA · PM-KISAN · PMAY-G" },
              { icon: Globe2, label: "24 States", sub: "66 LGD districts ingested" },
              { icon: Lock, label: "JWT-scoped RLS", sub: "Server-side enforced" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-subtle bg-surface-elevated p-3">
                <s.icon className="h-4 w-4 text-cyan-400 mb-2" />
                <div className="text-xs font-semibold text-white">{s.label}</div>
                <div className="text-[10px] text-secondary-muted leading-tight mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[11px] text-tertiary">
          Government of India · Restricted access. All actions logged under
          CAG-compliant audit trail.
        </div>
      </div>

      {/* Right: Auth form */}
      <div className="lg:w-1/2 bg-surface-elevated border-l border-subtle flex items-center justify-center p-6 lg:p-12">
        <form onSubmit={handleSubmit} className="w-full max-w-xl">
          <div className="mb-6">
            <div className="text-xs uppercase tracking-widest text-cyan-400 mb-2">
              Multi-factor Government SSO
            </div>
            <h2 className="text-xl font-semibold text-white mb-1">
              Sign in to your session
            </h2>
            <p className="text-sm text-secondary-muted">
              Authenticated via NextAuth credentials provider → JWT with role +
              LGD claims. Pick a demo user below.
            </p>
          </div>

          {/* Demo user picker */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5 block">
              Select demo persona
            </label>
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => setSelectedEmail(u.email)}
                  className={cn(
                    "w-full text-left rounded-lg border p-2.5 transition-all",
                    selectedEmail === u.email
                      ? "border-blue-500 bg-blue-950/30 ring-1 ring-blue-500"
                      : "border-subtle bg-app hover:border-blue-600/50 hover:bg-surface-hover"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={cn(
                      "h-8 w-8 shrink-0 rounded-md flex items-center justify-center text-[10px] font-mono font-semibold",
                      selectedEmail === u.email ? "bg-blue-600 text-white" : "bg-surface-hover text-secondary-muted"
                    )}>
                      {u.role.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{u.label}</div>
                      <div className="text-[11px] text-secondary-muted">{u.org}</div>
                      <div className="text-[10px] text-tertiary font-mono mt-0.5">{u.email}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="text-[10px] uppercase tracking-wider text-tertiary mb-1.5 block">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-md bg-app border border-subtle text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
              autoComplete="current-password"
            />
            <div className="text-[10px] text-tertiary mt-1">Demo password: <code className="font-mono">demo123</code></div>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-950/40 border border-red-900/60 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Sign in via Government SSO
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="mt-4 flex items-center justify-between text-[11px] text-tertiary">
            <span>Session secured by NextAuth · JWT 8h · RLS server-side</span>
            <span className="font-mono">v1.0.0-prod</span>
          </div>
        </form>
      </div>
    </div>
  );
}

