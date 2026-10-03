"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Search,
  ChevronDown,
  LogOut,
  Globe2,
  MapPin,
  Bell,
  Menu,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { AshokaEmblem } from "./ashoka-emblem";
import { STATES, DISTRICTS } from "@/lib/seed-data";
import { useSchemes } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  central_executive: "Cabinet Secretary",
  dept_nodal: "Joint Secretary / Nodal Officer",
  district_magistrate: "District Magistrate",
  auditor: "Principal Auditor (CAG)",
  super_admin: "System Administrator (NIC)",
};

const ROLE_SCOPES: Record<string, string> = {
  central_executive: "Pan-India, All Ministries",
  dept_nodal: "Ministry of Rural Development",
  district_magistrate: "District Gorakhpur (UP)",
  auditor: "Comptroller & Auditor General",
  super_admin: "National Informatics Centre",
};

export function Header({ onMenu }: { onMenu?: () => void }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const filters = useApp((s) => s.filters);
  const setFilter = useApp((s) => s.setFilter);
  const resetFilters = useApp((s) => s.resetFilters);
  const setView = useApp((s) => s.setView);
  const { data: schemesData } = useSchemes({
    stateLgd: filters.stateLgd,
    districtLgd: filters.districtLgd,
    fy: filters.fy,
  });
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
    <header className="h-18 bg-white border-b border-gray-200 flex items-center justify-between gap-4 px-5 lg:px-8 sticky top-0 z-30 shadow-xs">
      {/* Mobile menu & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-700 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <AshokaEmblem size="sm" variant="navy" showMotto={true} />
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold leading-none">
              भारत सरकार · Government of India
            </div>
            <div className="text-sm font-bold text-gray-900 tracking-tight mt-0.5 leading-none">
              समन्वय <span className="font-normal text-gray-500">|</span> SAMANVAY
            </div>
            <div className="text-[9px] text-[#0B4F9C] font-medium leading-none mt-1">
              National Governance Convergence Portal
            </div>
          </div>
        </div>
      </div>

      {/* Global Search bar */}
      <div className="hidden lg:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search schemes, states, convergence indicators..."
            className="w-full h-9.5 pl-9 pr-4 rounded-lg bg-gray-50 border border-gray-300 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C] focus:bg-white focus:ring-1 focus:ring-[#0B4F9C] transition-all"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setView("intelligence-query");
              }
            }}
          />
        </div>
      </div>

      {/* Government Dropdowns & User Profile */}
      <div className="flex items-center gap-2.5">
        {/* State selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setStateOpen((v) => !v);
              setSchemeOpen(false);
              setUserOpen(false);
            }}
            className="h-9 px-3 rounded-lg bg-white border border-gray-300 hover:border-[#0B4F9C] text-xs font-medium text-gray-800 flex items-center gap-2 transition-all shadow-xs"
          >
            <MapPin className="h-3.5 w-3.5 text-[#0B4F9C] shrink-0" />
            <span className="max-w-[120px] truncate">{stateName}</span>
            {districtName && (
              <span className="text-gray-500">/ {districtName}</span>
            )}
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </button>
          {stateOpen && (
            <div className="absolute right-0 mt-1.5 w-68 rounded-lg bg-white border border-gray-200 shadow-lg z-40 max-h-80 overflow-y-auto p-1">
              <button
                onClick={() => {
                  setFilter("stateLgd", null);
                  setFilter("districtLgd", null);
                  setStateOpen(false);
                }}
                className="w-full px-3 py-2 rounded text-left text-xs font-medium hover:bg-gray-50 text-gray-900 flex items-center gap-2 border-b border-gray-100"
              >
                <Globe2 className="h-3.5 w-3.5 text-[#0B4F9C]" />
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
                    "w-full px-3 py-2 rounded text-left text-xs hover:bg-gray-50 flex items-center justify-between transition-colors",
                    filters.stateLgd === s.lgd_code
                      ? "text-[#0B4F9C] bg-blue-50 font-bold"
                      : "text-gray-700"
                  )}
                >
                  <span>{s.entity_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scheme selector */}
        <div className="relative hidden md:block">
          <button
            onClick={() => {
              setSchemeOpen((v) => !v);
              setStateOpen(false);
              setUserOpen(false);
            }}
            className="h-9 px-3 rounded-lg bg-white border border-gray-300 hover:border-[#0B4F9C] text-xs font-medium text-gray-800 flex items-center gap-2 transition-all shadow-xs"
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                background: filters.schemeId
                  ? schemes.find((s) => s.scheme_id === filters.schemeId)?.color
                  : "#64748B",
              }}
            />
            <span className="max-w-[110px] truncate">{schemeName}</span>
            <ChevronDown className="h-3 w-3 text-gray-500" />
          </button>
          {schemeOpen && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-lg bg-white border border-gray-200 shadow-lg z-40 p-1">
              <button
                onClick={() => {
                  setFilter("schemeId", null);
                  setSchemeOpen(false);
                }}
                className="w-full px-3 py-2 rounded text-left text-xs font-medium hover:bg-gray-50 text-gray-900 border-b border-gray-100"
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
                    "w-full px-3 py-2 rounded text-left text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors",
                    filters.schemeId === s.scheme_id
                      ? "text-[#0B4F9C] bg-blue-50 font-bold"
                      : "text-gray-700"
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="flex-1 font-medium">{s.scheme_code}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Financial Year chip */}
        <div className="hidden sm:flex h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700 items-center gap-1.5">
          <span className="text-gray-500">FY</span>
          <span className="font-semibold text-gray-900">{filters.fy}</span>
        </div>

        {/* Reset Filter */}
        {(filters.stateLgd || filters.schemeId || filters.districtLgd) && (
          <button
            onClick={resetFilters}
            className="h-9 px-2.5 rounded-lg bg-gray-50 border border-gray-200 hover:border-red-400 text-xs font-medium text-gray-600 hover:text-red-600 transition-colors"
          >
            Clear Filters
          </button>
        )}

        {/* Notifications */}
        <button
          onClick={() => setView("intelligence-alerts")}
          className="relative h-9 w-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Alerts"
          title="Implementation Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-600 ring-2 ring-white" />
        </button>

        {/* Official User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setUserOpen((v) => !v);
              setStateOpen(false);
              setSchemeOpen(false);
            }}
            className="h-9 pl-2 pr-2.5 rounded-lg bg-white border border-gray-300 hover:border-[#0B4F9C] flex items-center gap-2 transition-colors shadow-xs"
          >
            <div className="h-6 w-6 rounded bg-[#0B4F9C] text-white flex items-center justify-center text-[10px] font-bold">
              {(user?.name ?? "U").slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-gray-900 leading-tight">
                {user?.name ?? "Government Official"}
              </div>
              <div className="text-[10px] text-gray-500 leading-none">
                {ROLE_LABELS[user?.role ?? ""] ?? "Authorized User"}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-1.5 w-76 rounded-lg bg-white border border-gray-200 shadow-xl z-40 p-4">
              <div className="pb-3 border-b border-gray-100">
                <div className="text-sm font-bold text-gray-900">
                  {user?.name ?? "Official User"}
                </div>
                <div className="text-xs text-gray-500">{user?.email}</div>
                <div className="text-xs text-[#0B4F9C] font-semibold mt-1">
                  {ROLE_LABELS[user?.role ?? ""] ?? user?.role}
                </div>
              </div>

              <div className="py-2.5 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Jurisdiction</span>
                  <span className="font-medium text-gray-800">
                    {ROLE_SCOPES[user?.role ?? ""] ?? "National"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-2 w-full h-8.5 rounded bg-gray-50 hover:bg-red-50 hover:text-red-700 border border-gray-200 hover:border-red-200 text-xs font-semibold text-gray-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
