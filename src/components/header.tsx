"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  Mic,
  ChevronDown,
  LogOut,
  Globe2,
  MapPin,
  Bell,
  Menu,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { STATES, DISTRICTS, SCHEMES } from "@/lib/seed-data";
import { useSchemes } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  central_executive: "Central Executive",
  dept_nodal: "Dept Nodal Officer",
  district_magistrate: "District Magistrate",
  auditor: "Auditor",
  super_admin: "Super Admin",
};

const ROLE_SCOPES: Record<string, string> = {
  central_executive: "Pan-India, Cross-Ministry",
  dept_nodal: "Ministry-Scoped",
  district_magistrate: "District-Specific (LGD 463)",
  auditor: "Anonymized Pan-India",
  super_admin: "Global System-wide",
};

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const filters = useApp((s) => s.filters);
  const setFilter = useApp((s) => s.setFilter);
  const resetFilters = useApp((s) => s.resetFilters);
  const setView = useApp((s) => s.setView);
  const { data: schemesData } = useSchemes({ stateLgd: filters.stateLgd, districtLgd: filters.districtLgd, fy: filters.fy });
  const schemes = schemesData?.schemes ?? [];

  const stateName =
    STATES.find((s) => s.lgd_code === filters.stateLgd)?.entity_name ?? "All India";
  const districtName = filters.districtLgd
    ? DISTRICTS.find((d) => d.lgd_code === filters.districtLgd)?.entity_name
    : null;
  const schemeName = filters.schemeId
    ? schemes.find((s) => s.scheme_id === filters.schemeId)?.scheme_code
    : "All Schemes";

  const [stateOpen, setStateOpen] = useState(false);
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  return (
    <header className="h-14 bg-app border-b border-subtle flex items-center gap-3 px-4 lg:px-6 sticky top-0 z-30">
      {/* Mobile menu */}
      <button
        onClick={onMenu}
        className="lg:hidden h-9 w-9 rounded-md hover:bg-surface-hover flex items-center justify-center text-secondary-muted"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Brand mark on mobile */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="h-7 w-7 rounded bg-gradient-to-br from-blue-600 to-cyan-500" />
        <span className="text-sm font-semibold text-white">Samanvay</span>
      </div>

      {/* Global NL Search bar - center */}
      <div className="hidden lg:flex flex-1 max-w-xl mx-auto">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input
            type="text"
            placeholder="Ask a cross-scheme question... (e.g. Bihar MGNREGA utilization < 50%)"
            className="w-full h-9 pl-10 pr-16 rounded-md bg-surface-elevated border border-subtle text-sm text-white placeholder:text-tertiary focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setView("intelligence-query");
              }
            }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden xl:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-app border border-subtle text-tertiary">
              ⌘K
            </kbd>
            <button
              className="h-7 w-7 rounded-md hover:bg-surface-hover flex items-center justify-center text-tertiary"
              aria-label="Voice input"
            >
              <Mic className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 lg:hidden" />

      {/* Filter chips */}
      <div className="hidden md:flex items-center gap-2">
        {/* State selector */}
        <div className="relative">
          <button
            onClick={() => {
              setStateOpen((v) => !v);
              setSchemeOpen(false);
              setUserOpen(false);
            }}
            className="h-9 px-3 rounded-md bg-surface-elevated border border-subtle hover:border-blue-600/50 text-xs text-white flex items-center gap-1.5 transition-colors"
          >
            <MapPin className="h-3.5 w-3.5 text-cyan-400" />
            <span className="max-w-[120px] truncate">{stateName}</span>
            {districtName && (
              <span className="text-tertiary">/ {districtName}</span>
            )}
            <ChevronDown className="h-3 w-3 text-tertiary" />
          </button>
          {stateOpen && (
            <div className="absolute right-0 mt-1 w-64 rounded-md bg-surface-elevated border border-subtle shadow-xl z-40 max-h-80 overflow-y-auto">
              <button
                onClick={() => {
                  setFilter("stateLgd", null);
                  setFilter("districtLgd", null);
                  setStateOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-surface-hover text-white flex items-center gap-2 border-b border-subtle"
              >
                <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
                All India (Pan-National)
              </button>
              {STATES.map((s) => (
                <button
                  key={s.lgd_code}
                  onClick={() => {
                    setFilter("stateLgd", s.lgd_code);
                    setFilter("districtLgd", null);
                    setStateOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs hover:bg-surface-hover flex items-center justify-between",
                    filters.stateLgd === s.lgd_code
                      ? "text-cyan-300 bg-blue-950/30"
                      : "text-secondary-muted"
                  )}
                >
                  <span>{s.entity_name}</span>
                  <span className="font-mono text-[10px] text-tertiary">
                    {s.lgd_code}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scheme selector */}
        <div className="relative">
          <button
            onClick={() => {
              setSchemeOpen((v) => !v);
              setStateOpen(false);
              setUserOpen(false);
            }}
            className="h-9 px-3 rounded-md bg-surface-elevated border border-subtle hover:border-blue-600/50 text-xs text-white flex items-center gap-1.5 transition-colors"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: filters.schemeId
                  ? schemes.find((s) => s.scheme_id === filters.schemeId)?.color
                  : "#9CA3AF",
              }}
            />
            <span className="max-w-[100px] truncate">{schemeName}</span>
            <ChevronDown className="h-3 w-3 text-tertiary" />
          </button>
          {schemeOpen && (
            <div className="absolute right-0 mt-1 w-56 rounded-md bg-surface-elevated border border-subtle shadow-xl z-40">
              <button
                onClick={() => {
                  setFilter("schemeId", null);
                  setSchemeOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-surface-hover text-white border-b border-subtle"
              >
                All Schemes
              </button>
              {schemes.map((s) => (
                <button
                  key={s.scheme_id}
                  onClick={() => {
                    setFilter("schemeId", s.scheme_id);
                    setSchemeOpen(false);
                  }}
                  className={cn(
                    "w-full px-3 py-2 text-left text-xs hover:bg-surface-hover flex items-center gap-2",
                    filters.schemeId === s.scheme_id
                      ? "text-cyan-300 bg-blue-950/30"
                      : "text-secondary-muted"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1">{s.scheme_code}</span>
                  <span className="font-mono text-[10px] text-tertiary">
                    {s.scheme_type.split("_")[0]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FY selector */}
        <div className="h-9 px-3 rounded-md bg-surface-elevated border border-subtle text-xs text-white flex items-center gap-1.5">
          <span className="text-tertiary">FY</span>
          <span className="font-mono">{filters.fy}</span>
        </div>

        {/* Reset */}
        {(filters.stateLgd || filters.schemeId || filters.districtLgd) && (
          <button
            onClick={resetFilters}
            className="h-9 px-2.5 rounded-md bg-surface-elevated border border-subtle hover:border-red-700/50 text-xs text-secondary-muted hover:text-red-300 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Notifications */}
      <button
        onClick={() => setView("intelligence-alerts")}
        className="relative h-9 w-9 rounded-md hover:bg-surface-hover flex items-center justify-center text-secondary-muted"
        aria-label="Alerts"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
      </button>

      {/* User */}
      <div className="relative">
        <button
          onClick={() => {
            setUserOpen((v) => !v);
            setStateOpen(false);
            setSchemeOpen(false);
          }}
          className="h-9 pl-1.5 pr-2 rounded-md hover:bg-surface-hover flex items-center gap-2"
        >
          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-[10px] font-semibold text-white">
            {(user?.name ?? "U").slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-medium text-white leading-none">
              {user?.name ?? "Unknown"}
            </div>
            <div className="text-[9px] text-tertiary mt-0.5 font-mono uppercase">
              {user?.role?.replace(/_/g, " ")}
            </div>
          </div>
          <ChevronDown className="h-3 w-3 text-tertiary" />
        </button>
        {userOpen && (
          <div className="absolute right-0 mt-1 w-72 rounded-md bg-surface-elevated border border-subtle shadow-xl z-40 p-3">
            <div className="flex items-center gap-3 pb-3 border-b border-subtle">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white">
                {(user?.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">
                  {user?.name}
                </div>
                <div className="text-[11px] text-tertiary truncate">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="py-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-tertiary">Role</span>
                <span className="text-white font-medium">
                  {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-tertiary">Access Scope</span>
                <span className="text-secondary-muted text-right max-w-[170px]">
                  {ROLE_SCOPES[user?.role ?? ""] ?? "—"}
                </span>
              </div>
              {user?.assignedLgdCode && (
                <div className="flex justify-between">
                  <span className="text-tertiary">Assigned LGD</span>
                  <span className="font-mono text-cyan-300">
                    {user.assignedLgdCode}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 w-full h-8 rounded-md bg-app hover:bg-surface-hover border border-subtle text-xs text-red-300 flex items-center justify-center gap-1.5"
            >
              <LogOut className="h-3 w-3" />
              Sign out of session
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
