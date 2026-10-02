"use client";

import { useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Brain,
  Sparkles,
  Play,
  Clock,
  Shield,
  Database,
  Code2,
  Table2,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Zap,
  Terminal,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useApp, PageHeader, Card } from "@/components/app-shell";
import { NL_PRESETS } from "@/lib/seed-data";
import { type NlQueryResponse } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

type State = "empty" | "loading" | "streaming" | "success" | "error";

interface StreamState {
  status: string | null;
  streamingSql: string;
  streamingSynth: string;
  rows: Record<string, unknown>[];
  done: NlQueryResponse | null;
}

export function IntelligenceQueryView() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "central_executive";
  const filters = useApp((s) => s.filters);
  const [prompt, setPrompt] = useState("");
  const [strictness, setStrictness] = useState(70);
  const [state, setState] = useState<State>("empty");
  const [stream, setStream] = useState<StreamState>({
    status: null,
    streamingSql: "",
    streamingSynth: "",
    rows: [],
    done: null,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sql" | "schema" | "data">("sql");
  const abortRef = useRef<AbortController | null>(null);

  const submit = useCallback(async () => {
    if (prompt.trim().length < 8) {
      setState("error");
      setErrorMsg("Prompt must be at least 8 characters.");
      return;
    }
    setState("loading");
    setErrorMsg(null);
    setStream({ status: null, streamingSql: "", streamingSynth: "", rows: [], done: null });

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/intelligence/query-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          current_filters: {
            stateLgd: filters.stateLgd,
            districtLgd: filters.districtLgd,
            schemeId: filters.schemeId,
            fy: filters.fy,
          },
        }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP ${res.status}`);
      }

      setState("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const evt of events) {
          const lines = evt.split("\n");
          let eventType = "";
          let dataStr = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr += line.slice(6);
          }
          if (eventType && dataStr) {
            try {
              const data = JSON.parse(dataStr);
              handleEvent(eventType, data, setStream, setState, setActiveTab, setErrorMsg);
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setErrorMsg(err.message ?? "Stream failed");
        setState("error");
      }
    }
  }, [prompt, filters]);

  function applyPreset(p: string) {
    setPrompt(p);
    setState("empty");
    setErrorMsg(null);
    setStream({ status: null, streamingSql: "", streamingSynth: "", rows: [], done: null });
  }

  const response = stream.done;
  const chartData = (stream.rows.length > 0 ? stream.rows : response?.rows ?? []).map((r) => {
    const obj: Record<string, string | number> = {};
    Object.entries(r).forEach(([k, v]) => {
      obj[k] = typeof v === "number" ? v : (v as string);
    });
    return obj;
  });
  const chartKeys =
    chartData.length > 0
      ? Object.keys(chartData[0]).filter((k) => typeof chartData[0][k] === "number")
      : [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Natural Language Query Workbench"
        subtitle="Schema-aware LLM agent · streaming SQL generation · AST-verified · evidence-provenance tabs."
        icon={Brain}
        badge={
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
            <Zap className="h-2.5 w-2.5" />
            STREAMING
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left rail */}
        <div className="xl:col-span-5 space-y-4">
          <Card title="Query Composer" subtitle="NL-to-SQL · streaming · AST-verified · enforced LIMIT 100">
            {/* Presets */}
            <div className="mb-3">
              <div className="text-[10px] uppercase tracking-wider text-tertiary mb-2">Preset prompts</div>
              <div className="flex flex-wrap gap-1.5">
                {NL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.prompt)}
                    className="text-[10px] px-2 py-1 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-secondary-muted hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                    {p.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder="Ask a cross-scheme governance question..."
                rows={5}
                className="w-full p-3 rounded-md bg-app border border-subtle text-sm text-white placeholder:text-tertiary focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none font-mono text-[12px] leading-relaxed"
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-tertiary font-mono">{prompt.length} chars</div>
            </div>

            {/* Schema hints */}
            <div className="mt-2 flex flex-wrap gap-1">
              {["Allocation", "LgdGeography", "Beneficiary", "Scheme"].map((t) => (
                <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/40 text-cyan-300 border border-blue-900/40">{t}</span>
              ))}
            </div>

            {/* Strictness */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] uppercase tracking-wider text-tertiary">Confidence strictness</span>
                <span className="text-[10px] font-mono text-cyan-300">{strictness}%</span>
              </div>
              <input type="range" min={0} max={100} value={strictness} onChange={(e) => setStrictness(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>

            <button
              onClick={submit}
              disabled={state === "loading" || state === "streaming" || prompt.length < 8}
              className="mt-3 w-full h-10 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {state === "loading" || state === "streaming" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {stream.status ?? "Orchestrating..."}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Generate Insight (Streamed)
                </>
              )}
            </button>
            <div className="text-[10px] text-tertiary mt-1.5 text-center">⌘ + Enter to submit · AST verification enforced pre-execution</div>
          </Card>

          {/* Live status indicator */}
          {(state === "streaming" || state === "loading") && stream.status && (
            <Card bodyClassName="p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300 font-mono">{stream.status}</span>
              </div>
            </Card>
          )}

          {/* Preset history */}
          <Card title="Recent Audit Queries" subtitle="CAG-compliant log · persisted in audit_log table" bodyClassName="p-0">
            <div className="divide-y divide-subtle max-h-72 overflow-y-auto">
              {NL_PRESETS.slice(0, 3).map((q) => (
                <button key={q.id} onClick={() => applyPreset(q.prompt)} className="w-full text-left px-4 py-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 text-tertiary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white line-clamp-2 leading-snug">{q.prompt}</p>
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-tertiary">
                        <span className="uppercase">{q.category}</span>
                        <span>·</span>
                        <span className="text-cyan-400">preset</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Right workspace */}
        <div className="xl:col-span-7">
          <Card
            title="Dynamic Intelligence Response Canvas"
            subtitle={`Verified against schema · scoped to ${role.replace(/_/g, " ").toLowerCase()} role`}
            actions={
              state === "success" && response ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/60 flex items-center gap-1">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  HTTP 200 · {response.execution_time_ms}ms
                </span>
              ) : state === "streaming" ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-900/60 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  STREAMING
                </span>
              ) : null
            }
            bodyClassName="p-0"
          >
            {/* Empty state */}
            {state === "empty" && (
              <div className="p-12 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-blue-950/30 border border-blue-900/40 flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-cyan-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">Streaming query workbench ready</h3>
                <p className="text-xs text-tertiary max-w-md">
                  Compose a question or pick a preset. The orchestrator streams the SQL token-by-token,
                  executes it against the database, then streams the synthesized narrative.
                </p>
                <div className="mt-4 flex items-center gap-2 text-[10px] text-tertiary">
                  <Shield className="h-3 w-3" />
                  <span>Read-only · AST-verified · LIMIT 100 enforced</span>
                </div>
              </div>
            )}

            {/* Loading initial */}
            {state === "loading" && (
              <div className="p-6 space-y-3">
                <div className="h-4 w-3/4 shimmer rounded" />
                <div className="h-3 w-full shimmer rounded" />
                <div className="h-3 w-5/6 shimmer rounded" />
                <div className="mt-4 h-48 w-full shimmer rounded" />
              </div>
            )}

            {/* Streaming + Success */}
            {(state === "streaming" || state === "success") && (
              <div>
                {/* Streaming SQL preview (when streaming) */}
                {state === "streaming" && stream.streamingSql && !stream.done && (
                  <div className="p-4 border-b border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] uppercase tracking-wider text-tertiary">Streaming SQL Generation</span>
                    </div>
                    <pre className="rounded-md bg-app border border-subtle p-3 text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed min-h-[80px]">
                      {stream.streamingSql}
                      <span className="animate-pulse">▊</span>
                    </pre>
                  </div>
                )}

                {/* Synthesized answer */}
                {(stream.streamingSynth || response) && (
                  <div className="p-4 border-b border-subtle">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] uppercase tracking-wider text-tertiary">AI Synthesized Answer</span>
                      {response && (
                        <span className="text-[10px] font-mono text-tertiary ml-auto">query_id: {response.query_id}</span>
                      )}
                    </div>
                    <p className="text-sm text-white leading-relaxed">
                      {stream.streamingSynth}
                      {state === "streaming" && !response?.synthesized_response && (
                        <span className="animate-pulse">▊</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Chart */}
                {chartData.length > 0 && chartKeys.length > 0 && (
                  <div className="p-4 border-b border-subtle">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[10px] uppercase tracking-wider text-tertiary">
                        Recommended Visualization · {response?.visualization_recommendation.type.replace(/_/g, " ") ?? "bar"}
                      </span>
                    </div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" barSize={24}>
                          <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 10 }} stroke="#374151" />
                          <YAxis type="category" dataKey={Object.keys(chartData[0])[0]} tick={{ fill: "#9CA3AF", fontSize: 10 }} stroke="#374151" width={90} />
                          <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 6, fontSize: 11 }} cursor={{ fill: "#1F293780" }} />
                          {chartKeys.map((k, i) => (
                            <Bar key={k} dataKey={k} radius={[3, 3, 0, 0]}>
                              {chartData.map((_, idx) => (
                                <Cell key={idx} fill={i === 0 ? "#2563EB" : "#06B6D4"} />
                              ))}
                            </Bar>
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Provenance tabs */}
                {response && (
                  <>
                    <div className="border-b border-subtle">
                      <div className="flex items-center px-2 pt-2">
                        {[
                          { id: "sql" as const, label: "Generated SQL Query", icon: Code2 },
                          { id: "schema" as const, label: "Source Tables & Joins", icon: Database },
                          { id: "data" as const, label: "Raw Tabular Output", icon: Table2 },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                              "h-9 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5",
                              activeTab === tab.id ? "border-blue-500 text-white" : "border-transparent text-tertiary hover:text-secondary-muted"
                            )}
                          >
                            <tab.icon className="h-3.5 w-3.5" />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-4">
                      {activeTab === "sql" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-tertiary">Read-only PostgreSQL · verified by AST parser</span>
                            <span className="text-[10px] font-mono text-cyan-400">exec: {response.execution_time_ms}ms · LIMIT 100</span>
                          </div>
                          <div className="rounded-md overflow-hidden border border-subtle">
                            <SyntaxHighlighter language="sql" style={vscDarkPlus} customStyle={{ background: "#0B0F19", padding: "12px", fontSize: "11px", margin: 0 }} showLineNumbers>
                              {response.generated_sql}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )}
                      {activeTab === "schema" && (
                        <div>
                          <div className="text-[10px] uppercase tracking-wider text-tertiary mb-2">Schema breadcrumb chain</div>
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            {response.evidence_provenance.source_tables.map((t, i) => (
                              <div key={t} className="flex items-center gap-2">
                                <span className="text-xs font-mono px-2 py-1 rounded bg-blue-950/40 text-cyan-300 border border-blue-900/40">{t}</span>
                                {i < response.evidence_provenance.source_tables.length - 1 && <span className="text-tertiary">⋈</span>}
                              </div>
                            ))}
                          </div>
                          <div className="text-[10px] uppercase tracking-wider text-tertiary mb-2">Citation records</div>
                          <div className="space-y-2">
                            {response.evidence_provenance.citations.map((c) => (
                              <div key={c.source_id} className="rounded-md bg-app border border-subtle p-2.5 flex items-center justify-between">
                                <div>
                                  <div className="text-xs text-white font-medium">{String(c.values.district_name ?? c.values[Object.keys(c.values)[0]] ?? "—")}</div>
                                  <div className="text-[10px] font-mono text-tertiary">{c.source_id}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-cyan-300">{JSON.stringify(Object.values(c.values).slice(1, 3))}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeTab === "data" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-wider text-tertiary">Paginated · sortable · {response.rows.length} rows</span>
                            <button className="h-7 px-2 rounded-md bg-app border border-subtle hover:border-blue-600/50 text-[10px] text-secondary-muted flex items-center gap-1">
                              <Download className="h-3 w-3" /> CSV
                            </button>
                          </div>
                          <div className="overflow-x-auto rounded-md border border-subtle">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-app border-b border-subtle">
                                  {Object.keys(response.rows[0] ?? {}).map((k) => (
                                    <th key={k} className="text-left px-3 py-2 text-[10px] uppercase tracking-wider text-tertiary font-medium">{k.replace(/_/g, " ")}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {response.rows.map((r, i) => (
                                  <tr key={i} className="border-b border-subtle">
                                    {Object.entries(r).map(([k, v]) => (
                                      <td key={k} className={cn("px-3 py-2", typeof v === "number" ? "text-right font-mono text-cyan-300" : "text-secondary-muted")}>
                                        {typeof v === "number" ? v.toLocaleString("en-IN") : String(v)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Error */}
            {state === "error" && (
              <div className="p-6">
                <div className="rounded-md bg-red-950/40 border border-red-900/60 p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-red-300">Orchestrator error</div>
                    <p className="text-xs text-red-300/80 mt-1">{errorMsg ?? "Unknown error."}</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function handleEvent(
  eventType: string,
  data: any,
  setStream: React.Dispatch<React.SetStateAction<StreamState>>,
  setState: (s: State) => void,
  setActiveTab: (t: "sql" | "schema" | "data") => void,
  setErrorMsg: (e: string | null) => void
) {
  switch (eventType) {
    case "status":
      setStream((s) => ({ ...s, status: data.message }));
      break;
    case "sql_token":
      setStream((s) => ({ ...s, streamingSql: s.streamingSql + data.token }));
      break;
    case "sql_complete":
      setActiveTab("sql");
      break;
    case "rows":
      setStream((s) => ({ ...s, rows: data.rows }));
      break;
    case "synth_token":
      setStream((s) => ({ ...s, streamingSynth: s.streamingSynth + data.token }));
      break;
    case "done":
      setStream((s) => ({ ...s, done: data, status: null }));
      setState("success");
      break;
    case "error":
      setErrorMsg(data.reason ?? "Orchestrator failure");
      setState("error");
      break;
  }
}
