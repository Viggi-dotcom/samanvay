"use client";

import {
  Radio,
  Terminal,
  User,
  LogIn,
  LogOut,
  Download,
  RefreshCw,
  Brain,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import { useActivityFeed } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

const ACTION_META: Record<string, { icon: React.ElementType; color: string }> = {
  NL_QUERY_EXEC: { icon: Brain, color: "#06B6D4" },
  ANOMALY_ACK: { icon: AlertTriangle, color: "#F59E0B" },
  ANOMALY_RESOLVE: { icon: AlertTriangle, color: "#10B981" },
  EXPORT_CSV: { icon: Download, color: "#8B5CF6" },
  PIPELINE_RETRY: { icon: RefreshCw, color: "#F59E0B" },
  USER_PROVISION: { icon: UserPlus, color: "#06B6D4" },
  USER_SUSPEND: { icon: UserPlus, color: "#EF4444" },
  USER_UPDATE: { icon: User, color: "#06B6D4" },
  LOGIN: { icon: LogIn, color: "#10B981" },
  LOGOUT: { icon: LogOut, color: "#6B7280" },
};

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useActivityFeed(limit);
  const logs = data?.logs ?? [];

  return (
    <div className="rounded-lg border border-subtle bg-surface-elevated overflow-hidden">
      <div className="px-4 py-3 border-b border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
        </div>
        <span className="text-[10px] font-mono text-tertiary">polling /api/feed · 5s</span>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-subtle">
        {isLoading && logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-tertiary">Loading live feed…</div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-tertiary">No activity yet.</div>
        ) : (
          logs.map((log) => {
            const meta = ACTION_META[log.action] ?? { icon: Terminal, color: "#9CA3AF" };
            const Icon = meta.icon;
            return (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-hover transition-colors">
                <div
                  className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center"
                  style={{ background: meta.color + "20", color: meta.color }}
                >
                  <Icon className="h-3 w-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white font-medium truncate">
                    {log.actor_email ?? log.actor}
                    {log.actor_role && (
                      <span className={cn(
                        "ml-1.5 text-[9px] font-mono uppercase px-1 py-0.5 rounded",
                        log.actor_role === "super_admin" ? "bg-purple-950 text-purple-300" :
                        log.actor_role === "central_executive" ? "bg-blue-950 text-blue-300" :
                        log.actor_role === "district_magistrate" ? "bg-amber-950 text-amber-300" :
                        log.actor_role === "auditor" ? "bg-emerald-950 text-emerald-300" :
                        "bg-slate-800 text-slate-300"
                      )}>
                        {log.actor_role.replace(/_/g, " ").slice(0, 3)}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-tertiary font-mono truncate">
                    <span style={{ color: meta.color }}>{log.action}</span> → {log.target}
                  </div>
                </div>
                <div className="text-[10px] text-tertiary font-mono shrink-0">
                  {timeAgo(log.ts)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
