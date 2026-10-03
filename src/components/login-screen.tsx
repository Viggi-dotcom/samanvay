"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Building2, ChevronRight, Globe2, Loader2, AlertCircle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useApp } from "@/lib/store";
import { AshokaEmblem, SovereignTricolorRibbon } from "./ashoka-emblem";
import { cn } from "@/lib/utils";

const DEMO_USERS = [
  { email: "r.kumar@cabsec.gov.in", label: "Cabinet Secretary", org: "Cabinet Secretariat, Government of India", scope: "Pan-India, All Ministries", role: "central_executive", badge: "CABSEC" },
  { email: "v.nair@mord.gov.in", label: "Joint Secretary / Nodal Officer", org: "Ministry of Rural Development (MoRD)", scope: "Ministry-Scoped (MoRD)", role: "dept_nodal", badge: "MoRD" },
  { email: "anjali.dm-gorakhpur@up.gov.in", label: "District Magistrate", org: "District Administration, Gorakhpur (UP)", scope: "District-Specific (LGD 463)", role: "district_magistrate", badge: "UP-LGD" },
  { email: "p.iyer@cag.gov.in", label: "Principal Auditor", org: "Comptroller and Auditor General of India (CAG)", scope: "National Audit & Evaluation", role: "auditor", badge: "CAG" },
  { email: "arjun.nic@gov.in", label: "System Administrator", org: "National Informatics Centre (NIC)", scope: "Platform Administration", role: "super_admin", badge: "NIC" },
];

export function LoginScreen() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setView = useApp((s) => s.setView);
  const [selectedEmail, setSelectedEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        setError("Invalid credentials. Please select a designated official and try again.");
      } else if (result?.ok) {
        router.refresh();
        setTimeout(() => router.refresh(), 200);
      } else {
        setError("Unable to authenticate with Government Single Sign-On.");
      }
    } catch (err: any) {
      setLoading(false);
      setError("Network connectivity error: " + (err?.message ?? "unknown"));
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-900 flex flex-col antialiased">
      <SovereignTricolorRibbon height="h-2" />

      {/* Top Government Masthead */}
      <div className="bg-white border-b border-gray-200 py-3.5 px-6 lg:px-12 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <AshokaEmblem size="sm" variant="navy" showMotto={true} />
          <div>
            <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">
              भारत सरकार · Government of India
            </div>
            <div className="text-base font-bold text-gray-900 tracking-tight leading-tight">
              मंत्रिमण्डल सचिवालय · CABINET SECRETARIAT
            </div>
            <div className="text-xs text-[#0B4F9C] font-semibold">
              समन्वय (SAMANVAY) — National Governance Convergence Platform
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-gray-500">
          <ShieldCheck className="h-4 w-4 text-[#0B4F9C]" />
          <span>National Single Sign-On (MeriPehchaan Protocol)</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-6 lg:p-10 items-center justify-center gap-10">
        {/* Left: Official Overview Information */}
        <div className="lg:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#0B4F9C]">
            <span className="h-2 w-2 rounded-full bg-[#0B4F9C]" />
            Official Monitoring & Convergence Portal
          </div>

          <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight leading-snug">
            Cross-Scheme Governance Convergence & Implementation Analytics
          </h1>

          <p className="text-sm text-gray-600 leading-relaxed">
            Integrating implementation data across Centrally Sponsored Schemes
            (MGNREGA, PM-KISAN, PMAY-G) anchored on standard Local Government Directory (LGD) codes
            for unified outcomes tracking, gap detection, and inter-ministerial synergy.
          </p>

          <div className="grid grid-cols-3 gap-3.5 pt-2">
            {[
              { icon: Building2, label: "3 Flagship Schemes", sub: "MGNREGA · PM-KISAN · PMAY-G" },
              { icon: Globe2, label: "24 States & UTs", sub: "66 LGD Districts" },
              { icon: ShieldCheck, label: "Role-Based Access", sub: "Jurisdiction-Scoped" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-3.5 shadow-xs">
                <s.icon className="h-4 w-4 text-[#0B4F9C] mb-1.5" />
                <div className="text-xs font-bold text-gray-900">{s.label}</div>
                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
            For authorized official use only. System access is monitored by the National Informatics Centre (NIC).
          </div>
        </div>

        {/* Right: Clean White Government Sign In Card */}
        <div className="lg:w-1/2 w-full max-w-md bg-white rounded-xl border border-gray-200 p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <h2 className="text-lg font-bold text-gray-900 mb-1">
                Official Sign-In
              </h2>
              <p className="text-xs text-gray-500">
                Select your designated official profile below to proceed.
              </p>
            </div>

            {/* Official Persona List */}
            <div className="mb-4">
              <label className="text-[11px] uppercase tracking-wider text-gray-500 font-bold mb-1.5 block">
                Designated Official Profiles
              </label>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {DEMO_USERS.map((u) => {
                  const isSelected = selectedEmail === u.email;
                  return (
                    <button
                      key={u.email}
                      type="button"
                      onClick={() => setSelectedEmail(u.email)}
                      className={cn(
                        "w-full text-left rounded-lg border p-2.5 transition-all flex items-start gap-2.5 cursor-pointer",
                        isSelected
                          ? "border-[#0B4F9C] bg-blue-50/60 ring-1 ring-[#0B4F9C]"
                          : "border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 shrink-0 rounded flex items-center justify-center text-[10px] font-bold font-mono",
                          isSelected
                            ? "bg-[#0B4F9C] text-white"
                            : "bg-gray-100 text-gray-700"
                        )}
                      >
                        {u.badge}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={cn("text-xs font-bold text-gray-900", isSelected && "text-[#0B4F9C]")}>
                            {u.label}
                          </span>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-[#0B4F9C] shrink-0" />}
                        </div>
                        <div className="text-[11px] text-gray-600 truncate">{u.org}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Password input */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                  Security Passcode
                </label>
                <span className="text-[10px] text-gray-500">
                  Demo Passcode: <code className="font-mono text-[#0B4F9C] font-bold">demo123</code>
                </span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-[#0B4F9C] focus:ring-1 focus:ring-[#0B4F9C] font-mono"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-2.5 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <div className="text-xs text-red-700">{error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10.5 rounded-lg bg-[#0B4F9C] hover:bg-[#093E7A] text-white text-xs uppercase tracking-wider font-bold transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In to Portal
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-4 text-center text-[10px] text-gray-500 font-medium">
              Government of India · Protected by National Informatics Centre
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
