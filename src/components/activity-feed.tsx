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

const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  NL_QUERY_EXEC: { icon: Brain, color: "#0B4F9C", label: "Query Execution" },
  ANOMALY_ACK: { icon: AlertTriangle, color: "#D97706", label: "Anomaly Acknowledged" },
  ANOMALY_RESOLVE: { icon: AlertTriangle, color: "#16A34A", label: "Anomaly Resolved" },
  EXPORT_CSV: { icon: Download, color: "#6B21A8", label: "Report Exported" },
  PIPELINE_RETRY: { icon: RefreshCw, color: "#E65100", label: "Data Sync Retry" },
  USER_PROVISION: { icon: UserPlus, color: "#0B4F9C", label: "User Provisioned" },
  USER_SUSPEND: { icon: UserPlus, color: "#DC2626", label: "User Suspended" },
  USER_UPDATE: { icon: User, color: "#0B4F9C", label: "Profile Updated" },
  LOGIN: { icon: LogIn, color: "#16A34A", label: "Official Logged In" },
  LOGOUT: { icon: LogOut, color: "#64748B", label: "Session Ended" },
};

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const { data, isLoading } = useActivityFeed(limit);
  const logs = data?.logs ?? [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-xs overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-[#0B4F9C]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Implementation Audit Stream
          </h3>
        </div>
        <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 px-2 py-0.2 rounded font-medium">
          Live Verification
        </span>
      </div>
      <div className="max-h-84 overflow-y-auto divide-y divide-gray-100">
        {isLoading && logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-gray-500">
            Loading recent audit logs…
          </div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-gray-500">
            No activity recorded.
          </div>
        ) : (
          logs.map((log) => {
            const meta = ACTION_META[log.action] ?? { icon: Terminal, color: "#64748B", label: log.action };
            const Icon = meta.icon;
            return (
              <div key={log.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div
                  className="h-7 w-7 shrink-0 rounded flex items-center justify-center shadow-xs"
                  style={{ background: meta.color + "15", color: meta.color }}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-900 truncate">
                      {log.actor?.name ?? "Designated Official"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono font-medium">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-600 truncate mt-0.5">
                    {meta.label} · <span className="font-mono text-[10px] text-gray-500 font-medium">{log.entityType}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
