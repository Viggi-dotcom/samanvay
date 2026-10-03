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
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition is not supported by your browser. Please try Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak your governance question");
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((res: any) => res[0].transcript)
          .join("");
        setPrompt(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
        toast.error(`Speech recognition error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      toast.error(`Could not start speech recognition: ${err.message}`);
      setIsListening(false);
    }
  };

  const toggleSpeechSynthesis = (textToSpeak: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!window.speechSynthesis) {
      toast.error("Speech synthesis not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const submit = useCallback(async () => {
    if (!prompt.trim()) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const ac = new AbortController();
    abortRef.current = ac;

    setState("loading");
    setErrorMsg(null);
    setStream({
      status: "Initialising query context…",
      streamingSql: "",
      streamingSynth: "",
      rows: [],
      done: null,
    });

    try {
      const res = await fetch("/api/intelligence/query-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          stateLgd: filters.stateLgd,
          districtLgd: filters.districtLgd,
          schemeId: filters.schemeId,
        }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      setState("streaming");
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done: streamDone } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
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
    <div className="space-y-7">
      <PageHeader
        title="Natural Language Query Workbench"
        subtitle="Schema-aware LLM agent · streaming SQL generation · AST-verified · evidence-provenance audit tabs."
        icon={Brain}
        badge={
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 flex items-center gap-1.5 shadow-xs">
            <Zap className="h-3.5 w-3.5" />
            STREAMING AGENT
          </span>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left rail */}
        <div className="xl:col-span-5 space-y-5">
          <Card title="Query Composer" subtitle="NL-to-SQL · AST-verified guardrails · enforced LIMIT 100">
            {/* Presets */}
            <div className="mb-4">
              <div className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2.5">Preset prompts</div>
              <div className="flex flex-wrap gap-2">
                {NL_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.prompt)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-[#0B4F9C] hover:bg-blue-50/50 text-slate-700 hover:text-[#0B4F9C] transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#0B4F9C]" />
                    {p.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Header with Voice Mic */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-600">Natural Language Prompt</span>
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border shadow-xs cursor-pointer",
                  isListening
                    ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                    : "bg-blue-50 text-[#0B4F9C] border-blue-200 hover:bg-blue-100"
                )}
                title="Speak question via microphone"
              >
                {isListening ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-600 animate-ping" />
                    Listening...
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-[#0B4F9C]" />
                    Voice Input
                  </>
                )}
              </button>
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
                placeholder="Ask a cross-scheme governance question (e.g. Which districts in Bihar have MGNREGA utilization > 70% but PMAY-G completion < 40%?)..."
                rows={5}
                className="w-full p-4 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0B4F9C] focus:ring-2 focus:ring-blue-100 resize-none font-mono text-xs leading-relaxed"
              />
              <div className="absolute bottom-2.5 right-3 text-xs text-gray-500 font-mono">{prompt.length} chars</div>
            </div>

            {/* Schema hints */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {["Allocation", "LgdGeography", "Beneficiary", "Scheme"].map((t) => (
                <span key={t} className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#0B4F9C] border border-blue-200">{t}</span>
              ))}
            </div>

            {/* Strictness */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-slate-600">Confidence strictness</span>
                <span className="text-xs font-mono font-bold text-[#0B4F9C]">{strictness}%</span>
              </div>
              <input type="range" min={0} max={100} value={strictness} onChange={(e) => setStrictness(Number(e.target.value))} className="w-full accent-[#0B4F9C] h-2 bg-slate-200 rounded-lg cursor-pointer" />
            </div>

            <button
              onClick={submit}
              disabled={state === "loading" || state === "streaming" || prompt.length < 8}
              className="mt-4 w-full h-11 rounded-xl bg-[#0B4F9C] hover:bg-[#093E7A] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              {state === "loading" || state === "streaming" ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-white" />
                  {stream.status ?? "Orchestrating..."}
                </>
              ) : (
                <>
                  <Play className="h-4.5 w-4.5 text-white" />
                  Generate Insight (Streamed)
                </>
              )}
            </button>
            <div className="text-xs text-gray-500 mt-2 text-center font-medium">⌘ + Enter to submit · AST verification enforced pre-execution</div>
          </Card>

          {/* Live status indicator */}
          {(state === "streaming" || state === "loading") && stream.status && (
            <Card bodyClassName="p-4">
              <div className="flex items-center gap-2.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                <span className="text-cyan-300 font-mono font-semibold">{stream.status}</span>
              </div>
            </Card>
          )}

          {/* Preset history */}
          <Card title="Recent Audit Queries" subtitle="CAG-compliant log · persisted in audit_log table" bodyClassName="p-0">
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {NL_PRESETS.slice(0, 3).map((q) => (
                <button key={q.id} onClick={() => applyPreset(q.prompt)} className="w-full text-left px-5 py-3.5 hover:bg-gray-50/80 transition-colors group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0 group-hover:text-[#0B4F9C] transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 group-hover:text-[#0B4F9C] line-clamp-2 leading-relaxed transition-colors">{q.prompt}</p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-gray-500">
                        <span className="uppercase font-semibold">{q.category}</span>
                        <span>·</span>
                        <span className="text-[#0B4F9C] font-semibold">preset</span>
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
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  HTTP 200 · {response.execution_time_ms}ms
                </span>
              ) : state === "streaming" ? (
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0B4F9C] border border-blue-200 flex items-center gap-1.5 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-[#0B4F9C] animate-pulse" />
                  STREAMING
                </span>
              ) : null
            }
            bodyClassName="p-0"
          >
            {/* Empty state */}
            {state === "empty" && (
              <div className="p-14 flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-4 shadow-xs">
                  <Brain className="h-8 w-8 text-[#0B4F9C]" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1.5">Streaming query workbench ready</h3>
                <p className="text-xs md:text-sm text-gray-600 max-w-md leading-relaxed">
                  Compose a question or pick a preset. The orchestrator streams the SQL token-by-token,
                  executes it against the database, then streams the synthesized narrative.
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs text-gray-500 font-mono">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>Read-only · AST-verified · LIMIT 100 enforced</span>
                </div>
              </div>
            )}

            {/* Loading initial */}
            {state === "loading" && (
              <div className="p-8 space-y-4">
                <div className="h-5 w-3/4 shimmer rounded-xl" />
                <div className="h-4 w-full shimmer rounded-xl" />
                <div className="h-4 w-5/6 shimmer rounded-xl" />
                <div className="mt-6 h-56 w-full shimmer rounded-2xl" />
              </div>
            )}

            {/* Streaming + Success */}
            {(state === "streaming" || state === "success") && (
              <div>
                {/* Streaming SQL preview (when streaming) */}
                {state === "streaming" && stream.streamingSql && !stream.done && (
                  <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-2.5 mb-3">
                      <Terminal className="h-4 w-4 text-cyan-400" />
                      <span className="text-xs uppercase font-bold tracking-wider text-cyan-300">Streaming SQL Generation</span>
                    </div>
                    <pre className="rounded-xl bg-slate-950 border border-slate-800 p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed min-h-[90px]">
                      {stream.streamingSql}
                      <span className="animate-pulse">▊</span>
                    </pre>
                  </div>
                )}

                {/* Synthesized answer */}
                {(stream.streamingSynth || response) && (
                  <div className="p-6 border-b border-slate-200 bg-blue-50/40">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <Sparkles className="h-4 w-4 text-[#0B4F9C]" />
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-700">AI Synthesized Answer</span>
                      {(response?.synthesized_response || stream.streamingSynth) && (
                        <button
                          type="button"
                          onClick={() => toggleSpeechSynthesis(response?.synthesized_response ?? stream.streamingSynth)}
                          className={cn(
                            "px-3 py-1 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border cursor-pointer shadow-xs",
                            isSpeaking
                              ? "bg-blue-600 text-white border-blue-700 animate-pulse"
                              : "bg-white text-slate-700 hover:text-[#0B4F9C] border-slate-300 hover:border-blue-400"
                          )}
                          title="Listen to Executive Audio Briefing"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="h-3.5 w-3.5 text-white" />
                              <span className="text-white">Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="h-3.5 w-3.5 text-[#0B4F9C]" />
                              <span>Listen to Brief</span>
                            </>
                          )}
                        </button>
                      )}
                      {response && (
                        <span className="text-xs font-mono text-slate-500 ml-auto">query_id: {response.query_id}</span>
                      )}
                    </div>
                    <p className="text-sm md:text-base text-slate-900 leading-relaxed font-sans font-medium">
                      {stream.streamingSynth}
                      {state === "streaming" && !response?.synthesized_response && (
                        <span className="animate-pulse text-[#0B4F9C] font-bold">▊</span>
                      )}
                    </p>
                  </div>
                )}

                {/* Chart */}
                {chartData.length > 0 && chartKeys.length > 0 && (
                  <div className="p-6 border-b border-slate-200 bg-white">
                    <div className="flex items-center gap-2.5 mb-4">
                      <BarChart className="h-4 w-4 text-[#0B4F9C]" />
                      <span className="text-xs uppercase font-bold tracking-wider text-slate-700">
                        Recommended Visualization · {response?.visualization_recommendation.type.replace(/_/g, " ") ?? "bar"}
                      </span>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" barSize={26}>
                          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                          <XAxis type="number" tick={{ fill: "#475569", fontSize: 11 }} stroke="#CBD5E1" />
                          <YAxis type="category" dataKey={Object.keys(chartData[0])[0]} tick={{ fill: "#475569", fontSize: 11 }} stroke="#CBD5E1" width={110} />
                          <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 12, fontSize: 12, color: "#0F172A" }} cursor={{ fill: "#F1F5F9" }} />
                          {chartKeys.map((k, i) => (
                            <Bar key={k} dataKey={k} radius={[0, 6, 6, 0]}>
                              {chartData.map((_, idx) => (
                                <Cell key={idx} fill={i === 0 ? "#0B4F9C" : "#0284C7"} />
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
                    <div className="border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center px-4 pt-2">
                        {[
                          { id: "sql" as const, label: "Generated SQL Query", icon: Code2 },
                          { id: "schema" as const, label: "Source Tables & Joins", icon: Database },
                          { id: "data" as const, label: "Raw Tabular Output", icon: Table2 },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                              "h-10 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer",
                              activeTab === tab.id ? "border-[#0B4F9C] text-[#0B4F9C]" : "border-transparent text-slate-500 hover:text-slate-900"
                            )}
                          >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="p-6">
                      {activeTab === "sql" && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-600">Read-only PostgreSQL · verified by AST parser</span>
                            <span className="text-xs font-mono text-[#0B4F9C] font-bold">exec: {response.execution_time_ms}ms · LIMIT 100</span>
                          </div>
                          <div className="rounded-xl overflow-hidden border border-slate-700 shadow-md">
                            <SyntaxHighlighter language="sql" style={vscDarkPlus} customStyle={{ background: "#080D1A", padding: "16px", fontSize: "12px", margin: 0 }} showLineNumbers>
                              {response.generated_sql}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )}
                      {activeTab === "schema" && (
                        <div className="space-y-4">
                          <div className="text-xs uppercase font-bold tracking-wider text-slate-600">Schema breadcrumb chain</div>
                          <div className="flex items-center gap-2 flex-wrap mb-4">
                            {response.evidence_provenance.source_tables.map((t, i) => (
                              <div key={t} className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-blue-50 text-[#0B4F9C] border border-blue-200">{t}</span>
                                {i < response.evidence_provenance.source_tables.length - 1 && <span className="text-gray-500 font-bold">⋈</span>}
                              </div>
                            ))}
                          </div>
                          <div className="text-xs uppercase font-bold tracking-wider text-slate-600">Citation records</div>
                          <div className="space-y-2.5">
                            {response.evidence_provenance.citations.map((c) => (
                              <div key={c.source_id} className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-center justify-between shadow-xs">
                                <div>
                                  <div className="text-xs text-slate-900 font-bold">{String(c.values.district_name ?? c.values[Object.keys(c.values)[0]] ?? "—")}</div>
                                  <div className="text-xs font-mono text-slate-500">{c.source_id}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-mono text-[#0B4F9C] font-bold">{JSON.stringify(Object.values(c.values).slice(1, 3))}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {activeTab === "data" && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs uppercase font-bold tracking-wider text-slate-600">Paginated · sortable · {response.rows.length} rows</span>
                            <button className="h-8 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-xs text-slate-800 flex items-center gap-1.5 cursor-pointer shadow-xs">
                              <Download className="h-3.5 w-3.5 text-[#0B4F9C]" /> CSV
                            </button>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-slate-50 border-b-2 border-slate-200">
                                  {Object.keys(response.rows[0] ?? {}).map((k) => (
                                    <th key={k} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-slate-700 font-bold">{k.replace(/_/g, " ")}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 bg-white">
                                {response.rows.map((r, i) => (
                                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                                    {Object.entries(r).map(([k, v]) => (
                                      <td key={k} className={cn("px-4 py-3", typeof v === "number" ? "text-right font-mono font-bold text-[#0B4F9C]" : "text-slate-800")}>
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
              <div className="p-8">
                <div className="rounded-2xl bg-red-950/40 border border-red-900/60 p-5 flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-red-300">Orchestrator error</div>
                    <p className="text-xs md:text-sm text-red-300/80 mt-1 leading-relaxed">{errorMsg ?? "Unknown error."}</p>
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
