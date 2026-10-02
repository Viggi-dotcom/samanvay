"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
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
    <div className="min-h-screen flex bg-app">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/60 z-40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="lg:hidden fixed left-0 top-0 bottom-0 z-50">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-screen">
        <Header onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

// Reusable primitives -----

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
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="h-9 w-9 shrink-0 rounded-md bg-surface-elevated border border-subtle flex items-center justify-center">
            <Icon className="h-4 w-4 text-cyan-400" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl lg:text-2xl font-semibold text-white tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-sm text-secondary-muted mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
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
        "text-left rounded-lg border bg-surface-elevated p-4 transition-all",
        onClick && "hover:border-blue-600/50 hover:bg-surface-hover cursor-pointer",
        alert === "critical" && "border-red-900/50",
        alert === "warning" && "border-amber-900/50",
        alert === "success" && "border-emerald-900/50",
        !alert && "border-subtle"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-wider text-secondary-muted font-medium">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-tertiary shrink-0" />}
      </div>
      <div className="text-2xl font-bold text-white text-mono tracking-tight">
        {value}
      </div>
      <div className="flex items-center justify-between mt-1.5 gap-2">
        {sub && <span className="text-[11px] text-tertiary truncate">{sub}</span>}
        {trend && (
          <span
            className={cn(
              "text-[11px] font-mono px-1.5 py-0.5 rounded shrink-0",
              trend.good ?? trend.dir === "up"
                ? "bg-emerald-950 text-emerald-400"
                : "bg-red-950 text-red-300"
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
        "rounded-lg border border-subtle bg-surface-elevated",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-subtle">
          <div className="min-w-0">
            {title && (
              <h3 className="text-sm font-semibold text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-tertiary mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </div>
  );
}

export function SeverityBadge({
  severity,
}: {
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}) {
  const map = {
    LOW: "bg-slate-800 text-slate-300 border-slate-700",
    MEDIUM: "bg-amber-950 text-amber-300 border-amber-900/60",
    HIGH: "bg-orange-950 text-orange-300 border-orange-900/60",
    CRITICAL: "bg-red-950 text-red-300 border-red-900/60",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border",
        map[severity]
      )}
    >
      {severity}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    OPEN: "bg-red-950 text-red-300 border-red-900/60",
    ACKNOWLEDGED: "bg-amber-950 text-amber-300 border-amber-900/60",
    RESOLVED: "bg-emerald-950 text-emerald-400 border-emerald-900/60",
    SUCCESS: "bg-emerald-950 text-emerald-400 border-emerald-900/60",
    PARTIAL: "bg-amber-950 text-amber-300 border-amber-900/60",
    FAILED: "bg-red-950 text-red-300 border-red-900/60",
    ACTIVE: "bg-emerald-950 text-emerald-400 border-emerald-900/60",
    SUSPENDED: "bg-red-950 text-red-300 border-red-900/60",
  };
  return (
    <span
      className={cn(
        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border",
        map[status] ?? "bg-slate-800 text-slate-300 border-slate-700"
      )}
    >
      {status}
    </span>
  );
}
