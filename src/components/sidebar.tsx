"use client";

import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  GitMerge,
  Globe2,
  Building2,
  Brain,
  AlertTriangle,
  Settings,
  Users,
  Database,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useApp, type ViewId } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/seed-data";

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ElementType;
  group: string;
  roles?: Role[]; // if set, restrict
}

const NAV: NavItem[] = [
  { id: "overview", label: "Executive Command Center", icon: LayoutDashboard, group: "Intelligence" },
  { id: "convergence-matrix", label: "Convergence Matrix", icon: GitMerge, group: "Intelligence" },
  { id: "convergence-compare", label: "Scheme Comparison", icon: GitMerge, group: "Intelligence" },
  { id: "geo-national", label: "National Geo View", icon: Globe2, group: "Geographic" },
  { id: "schemes-directory", label: "Scheme Directory", icon: Building2, group: "Schemes" },
  { id: "intelligence-query", label: "NL Query Workbench", icon: Brain, group: "AI Reasoning" },
  { id: "intelligence-alerts", label: "Anomaly Alerts", icon: AlertTriangle, group: "AI Reasoning" },
  { id: "admin-pipelines", label: "ETL Pipelines", icon: Database, group: "Admin", roles: ["super_admin"] },
  { id: "admin-users", label: "User Provisioning", icon: Users, group: "Admin", roles: ["super_admin"] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as Role | undefined;
  const alertsCount = 7; // surfaced from /api/anomalies in production

  const filtered = NAV.filter(
    (n) => !n.roles || (role && n.roles.includes(role))
  );

  // group nav items
  const groups: { name: string; items: NavItem[] }[] = [];
  for (const item of filtered) {
    let g = groups.find((x) => x.name === item.group);
    if (!g) {
      g = { name: item.group, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }

  return (
    <aside className="w-[260px] shrink-0 bg-app border-r border-subtle flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 h-14 flex items-center gap-2.5 border-b border-subtle">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white leading-none">
            Samanvay
          </div>
          <div className="text-[10px] text-secondary-muted mt-0.5">
            Governance Intelligence
          </div>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60">
          MVP
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {groups.map((g) => (
          <div key={g.name} className="mb-4">
            <div className="px-4 mb-1.5 text-[10px] uppercase tracking-widest text-tertiary font-semibold">
              {g.name}
            </div>
            <div className="px-2 space-y-0.5">
              {g.items.map((item) => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      onNavigate?.();
                    }}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-md text-sm transition-colors",
                      active
                        ? "bg-blue-950/50 text-white border border-blue-800/40"
                        : "text-secondary-muted hover:bg-surface-hover hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-cyan-400" : "text-tertiary"
                      )}
                    />
                    <span className="flex-1 text-left truncate">
                      {item.label}
                    </span>
                    {item.id === "intelligence-alerts" && alertsCount > 0 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-900/60">
                        {alertsCount}
                      </span>
                    )}
                    {active && (
                      <ChevronRight className="h-3 w-3 text-blue-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: env status */}
      <div className="p-3 border-t border-subtle">
        <div className="rounded-md bg-surface-elevated border border-subtle p-2.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-white">
              Environment: Production
            </span>
          </div>
          <div className="text-[10px] text-tertiary font-mono">
            supabase-prod · n8n-railway · fastapi-orc
          </div>
        </div>
      </div>
    </aside>
  );
}
