"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { SovereignTricolorRibbon } from "./ashoka-emblem";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

// Re-export for convenience — single import line per view
export { useApp } from "@/lib/store";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F6F9] text-gray-900 antialiased">
      {/* National Tricolor Stripe */}
      <SovereignTricolorRibbon height="h-1.5" />

      <div className="flex-1 flex min-h-0">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block sticky top-0 h-[calc(100vh-6px)]">
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50 shadow-2xl">
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </div>
          </>
        )}

        <div className="flex-1 min-w-0 flex flex-col min-h-screen">
          <Header onMenu={() => setMobileOpen(true)} />
          <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-[1680px] mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Reusable primitives for official government presentation -----

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
      <div className="flex items-start gap-3.5 min-w-0">
        {Icon && (
          <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shadow-xs">
            <Icon className="h-5 w-5 text-[#0B4F9C]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-600 mt-1 max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="shrink-0 flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
  alert,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
  trend?: { dir: "up" | "down"; value: string; good?: boolean };
  alert?: "critical" | "warning" | "success";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "text-left rounded-lg border bg-white p-4.5 transition-all shadow-xs relative overflow-hidden group",
        onClick && "hover:border-[#0B4F9C] hover:shadow-sm cursor-pointer",
        alert === "critical" && "border-red-300 bg-red-50/30",
        alert === "warning" && "border-amber-300 bg-amber-50/30",
        alert === "success" && "border-green-300 bg-green-50/30",
        !alert && "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
          {label}
        </span>
        {Icon && (
          <div className="h-8 w-8 rounded bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-[#0B4F9C]" />
          </div>
        )}
      </div>
      <div className="text-2xl lg:text-3xl font-bold text-gray-900 font-mono tracking-tight my-1">
        {value}
      </div>
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        {sub && <span className="text-xs text-gray-500 truncate">{sub}</span>}
        {trend && (
          <span
            className={cn(
              "text-xs font-mono font-medium px-2 py-0.5 rounded shrink-0 flex items-center gap-1",
              trend.good ?? trend.dir === "up"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            )}
          >
            {trend.dir === "up" ? "↑" : "↓"} {trend.value}
          </span>
        )}
      </div>
    </button>
  );
}

export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white shadow-xs overflow-hidden",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-gray-200 bg-gray-50/70">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-bold text-gray-900 truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}

export function SeverityBadge({
  severity,
}: {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  const map = {
    LOW: "bg-gray-100 text-gray-700 border-gray-200",
    MEDIUM: "bg-amber-50 text-amber-800 border-amber-200",
    HIGH: "bg-orange-50 text-orange-800 border-orange-200",
    CRITICAL: "bg-red-50 text-red-800 border-red-200 font-bold",
  };
  return (
    <span
      className={cn(
        "text-xs font-mono uppercase px-2 py-0.5 rounded border font-medium",
        map[severity]
      )}
    >
      {severity}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-red-50 text-red-700 border-red-200",
    ACKNOWLEDGED: "bg-amber-50 text-amber-700 border-amber-200",
    RESOLVED: "bg-green-50 text-green-700 border-green-200",
    SUCCESS: "bg-green-50 text-green-700 border-green-200",
    PARTIAL: "bg-amber-50 text-amber-700 border-amber-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    ACTIVE: "bg-green-50 text-green-700 border-green-200",
    SUSPENDED: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={cn(
        "text-xs font-mono uppercase px-2 py-0.5 rounded border font-medium",
        map[status] ?? "bg-gray-100 text-gray-700 border-gray-200"
      )}
    >
      {status}
    </span>
  );
}
