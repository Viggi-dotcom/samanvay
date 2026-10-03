"use client";

import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  GitMerge,
  Globe2,
  Building2,
  Brain,
  AlertTriangle,
  Users,
  Database,
  ChevronRight,
  FlaskConical,
  Sparkles,
  FileText,
} from "lucide-react";
import { useApp, type ViewId } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/seed-data";

interface NavItem {
  id: ViewId;
  label: string;
  icon: React.ElementType;
  group: string;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { id: "overview", label: "Executive Dashboard", icon: LayoutDashboard, group: "National Analytics" },
  { id: "insights", label: "Scheme Intelligence", icon: Sparkles, group: "National Analytics" },
  { id: "convergence-matrix", label: "Convergence Matrix", icon: GitMerge, group: "National Analytics" },
  { id: "convergence-compare", label: "Scheme Comparison", icon: GitMerge, group: "National Analytics" },
  { id: "simulator", label: "Resource Simulator", icon: FlaskConical, group: "Planning & Policy" },
  { id: "directives", label: "Action Directives", icon: FileText, group: "Planning & Policy" },
  { id: "geo-national", label: "Geographical Coverage", icon: Globe2, group: "Geographic View" },
  { id: "schemes-directory", label: "Schemes Directory", icon: Building2, group: "Scheme Monitoring" },
  { id: "intelligence-query", label: "Natural Language Query", icon: Brain, group: "Decision Support" },
  { id: "intelligence-alerts", label: "Implementation Alerts", icon: AlertTriangle, group: "Decision Support" },
  { id: "admin-pipelines", label: "Data Pipelines", icon: Database, group: "System Administration", roles: ["super_admin"] },
  { id: "admin-users", label: "User Management", icon: Users, group: "System Administration", roles: ["super_admin"] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const view = useApp((s) => s.view);
  const setView = useApp((s) => s.setView);
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as Role | undefined;
  const alertsCount = 7;

  const filtered = NAV.filter(
    (n) => !n.roles || (role && n.roles.includes(role))
  );

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
    <aside className="w-[270px] shrink-0 bg-white border-r border-gray-200 flex flex-col h-full shadow-xs">
      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {groups.map((g) => (
          <div key={g.name} className="space-y-1">
            <div className="px-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
              {g.name}
            </div>
            <div className="space-y-0.5 pt-0.5">
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
                      "w-full flex items-center gap-2.5 px-3 h-9.5 rounded text-xs font-medium transition-all text-left",
                      active
                        ? "bg-blue-50 text-[#0B4F9C] font-semibold border-l-3 border-[#0B4F9C]"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-3 border-transparent"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active ? "text-[#0B4F9C]" : "text-gray-500"
                      )}
                    />
                    <span className="flex-1 truncate">
                      {item.label}
                    </span>
                    {item.id === "intelligence-alerts" && alertsCount > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 border border-red-200">
                        {alertsCount}
                      </span>
                    )}
                    {active && (
                      <ChevronRight className="h-3.5 w-3.5 text-[#0B4F9C] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Official Government Footer */}
      <div className="p-3.5 border-t border-gray-200 bg-gray-50 text-[11px] text-gray-600 space-y-0.5">
        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-600" />
          Cabinet Secretariat, GoI
        </div>
        <div className="text-[10px] text-gray-500">
          Powered by National Informatics Centre (NIC)
        </div>
      </div>
    </aside>
  );
}
