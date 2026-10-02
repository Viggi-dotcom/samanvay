"use client";

import { useMemo, useState } from "react";
import { STATES, DISTRICTS, ALLOCATIONS, SCHEMES } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ChoroplethProps {
  stateLgd?: number | null; // if null -> show states; if set -> show districts of that state
  districtLgd?: number | null; // if set -> highlight a single district
  schemeId?: string | null;
  metric?: "utilization" | "release" | "allocation" | "beneficiaries" | "convergence";
  onSelectState?: (lgd: number) => void;
  onSelectDistrict?: (lgd: number) => void;
  height?: number;
}

// India choropleth - simplified SVG. Each state is rendered as a polygon
// positioned via x/y anchor + size. Districts are rendered as a grid inside.
export function Choropleth({
  stateLgd,
  districtLgd,
  schemeId,
  metric = "utilization",
  onSelectState,
  onSelectDistrict,
  height = 520,
}: ChoroplethProps) {
  const [hover, setHover] = useState<{
    name: string;
    value: string;
    lgd: number;
    x: number;
    y: number;
  } | null>(null);

  // Aggregate per-state utilization
  const stateMetrics = useMemo(() => {
    const m = new Map<number, { util: number; released: number; allocated: number; ben: number }>();
    for (const st of STATES) {
      const dists = DISTRICTS.filter((d) => d.state_lgd === st.lgd_code);
      if (dists.length === 0) continue;
      const allocs = ALLOCATIONS.filter(
        (a) =>
          (!schemeId || a.scheme_id === schemeId) &&
          dists.some((d) => d.lgd_code === a.lgd_code)
      );
      const released = allocs.reduce((s, a) => s + a.released_cr, 0);
      const utilized = allocs.reduce((s, a) => s + a.utilized_cr, 0);
      const allocated = allocs.reduce((s, a) => s + a.allocated_cr, 0);
      m.set(st.lgd_code, {
        util: released > 0 ? (utilized / released) * 100 : 0,
        released,
        allocated,
        ben: dists.length * 4800,
      });
    }
    return m;
  }, [schemeId]);

  // For state drilldown: districts
  const districtMetrics = useMemo(() => {
    if (!stateLgd) return new Map();
    const m = new Map<number, { util: number; released: number; allocated: number }>();
    const dists = DISTRICTS.filter((d) => d.state_lgd === stateLgd);
    for (const d of dists) {
      const allocs = ALLOCATIONS.filter(
        (a) =>
          a.lgd_code === d.lgd_code &&
          (!schemeId || a.scheme_id === schemeId)
      );
      const released = allocs.reduce((s, a) => s + a.released_cr, 0);
      const utilized = allocs.reduce((s, a) => s + a.utilized_cr, 0);
      const allocated = allocs.reduce((s, a) => s + a.allocated_cr, 0);
      m.set(d.lgd_code, {
        util: released > 0 ? (utilized / released) * 100 : 0,
        released,
        allocated,
      });
    }
    return m;
  }, [stateLgd, schemeId]);

  function colorFor(v: number) {
    // 0..100 with alert gradient
    if (v < 40) return "#7F1D1D"; // critical red
    if (v < 55) return "#B45309"; // amber-dark
    if (v < 70) return "#A16207"; // amber
    if (v < 85) return "#15803D"; // green-dark
    return "#14532D"; // green
  }

  // ----- National: state polygons -----
  if (!stateLgd) {
    return (
      <div className="relative w-full" style={{ height }}>
        <svg
          viewBox="0 0 800 680"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* India outline backdrop */}
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#111827" stopOpacity="1" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="1" />
            </radialGradient>
            <filter id="soft-shadow">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>
          <rect width="800" height="680" fill="url(#bg-glow)" />

          {/* Grid backdrop */}
          <g opacity="0.06" stroke="#374151" strokeWidth="0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="680" />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2="800" y2={i * 50} />
            ))}
          </g>

          {/* Title overlay */}
          <text x="20" y="30" fill="#9CA3AF" fontSize="11" fontFamily="monospace">
            INDIA · 28 STATES · 742 LGD DISTRICTS
          </text>
          <text x="20" y="48" fill="#6B7280" fontSize="9" fontFamily="monospace">
            {schemeId
              ? `SCHEME FILTER: ${SCHEMES.find((s) => s.scheme_id === schemeId)?.scheme_code}`
              : "ALL SCHEMES · FY 2025-2026"}
          </text>

          {/* State shapes */}
          {STATES.map((st) => {
            const m = stateMetrics.get(st.lgd_code);
            if (!m) return null;
            const v = metric === "release" ? m.released : m.util;
            const fill = colorFor(v);
            const isHover = hover?.lgd === st.lgd_code;
            return (
              <g key={st.lgd_code}>
                <polygon
                  points={statePolygon(st.x, st.y, st.lgd_code)}
                  fill={fill}
                  fillOpacity={isHover ? 0.95 : 0.55}
                  stroke={isHover ? "#06B6D4" : "#1F2937"}
                  strokeWidth={isHover ? 2 : 1}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHover({
                      name: st.entity_name,
                      value: `${v.toFixed(1)}% util · ₹${m.released.toFixed(0)} Cr released`,
                      lgd: st.lgd_code,
                      x: st.x,
                      y: st.y,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectState?.(st.lgd_code)}
                />
                <text
                  x={st.x}
                  y={st.y + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#F9FAFB"
                  pointerEvents="none"
                  fontWeight="600"
                >
                  {st.entity_name.length > 14
                    ? st.entity_name.slice(0, 12) + "…"
                    : st.entity_name}
                </text>
                <text
                  x={st.x}
                  y={st.y + 16}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9CA3AF"
                  pointerEvents="none"
                  fontFamily="monospace"
                >
                  {v.toFixed(0)}%
                </text>
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(580, 600)">
            <rect x="0" y="0" width="200" height="68" fill="#111827" stroke="#374151" rx="6" />
            <text x="10" y="14" fill="#9CA3AF" fontSize="9" fontFamily="monospace">
              UTILIZATION BINS
            </text>
            {[
              { c: "#7F1D1D", l: "<40% Critical" },
              { c: "#B45309", l: "40-55% Low" },
              { c: "#A16207", l: "55-70% Mid" },
              { c: "#15803D", l: "70-85% Good" },
              { c: "#14532D", l: ">85% Target" },
            ].map((b, i) => (
              <g key={i} transform={`translate(10, ${22 + i * 9})`}>
                <rect width="10" height="6" fill={b.c} rx="1" />
                <text x="16" y="6" fill="#9CA3AF" fontSize="8">
                  {b.l}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Hover tooltip */}
        {hover && (
          <div
            className="absolute pointer-events-none z-20 rounded-md bg-surface-elevated border border-blue-700/50 shadow-xl px-3 py-2"
            style={{
              left: `${(hover.x / 800) * 100}%`,
              top: `${(hover.y / 680) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div className="text-xs font-semibold text-white">{hover.name}</div>
            <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
              LGD {hover.lgd}
            </div>
            <div className="text-[11px] text-secondary-muted mt-1">
              {hover.value}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----- State drilldown: district grid -----
  const dists = DISTRICTS.filter((d) => d.state_lgd === stateLgd);
  const stateName = STATES.find((s) => s.lgd_code === stateLgd)?.entity_name;
  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 800 680" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect width="800" height="680" fill="#0B0F19" />
        <g opacity="0.06" stroke="#374151" strokeWidth="0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="680" />
          ))}
        </g>
        <text x="20" y="30" fill="#9CA3AF" fontSize="11" fontFamily="monospace">
          {stateName?.toUpperCase()} · DISTRICT DRILLDOWN
        </text>
        <text x="20" y="48" fill="#6B7280" fontSize="9" fontFamily="monospace">
          {dists.length} LGD DISTRICTS · METRIC:{" "}
          {metric === "release" ? "RELEASED (₹ Cr)" : "UTILIZATION %"}
        </text>

        {/* District tiles in a grid */}
        {(() => {
          const cols = Math.min(5, Math.ceil(Math.sqrt(dists.length)));
          const startX = 60;
          const startY = 80;
          const tileW = 130;
          const tileH = 90;
          const gap = 14;
          return dists.map((d, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (tileW + gap);
            const y = startY + row * (tileH + gap);
            const m = districtMetrics.get(d.lgd_code);
            const v = m?.util ?? 0;
            const fill = colorFor(v);
            const isHover = hover?.lgd === d.lgd_code;
            const isSelected = districtLgd === d.lgd_code;
            return (
              <g key={d.lgd_code}>
                <rect
                  x={x}
                  y={y}
                  width={tileW}
                  height={tileH}
                  rx="6"
                  fill={fill}
                  fillOpacity={isHover || isSelected ? 0.95 : 0.5}
                  stroke={isSelected ? "#06B6D4" : isHover ? "#3B82F6" : "#1F2937"}
                  strokeWidth={isSelected ? 2.5 : isHover ? 1.5 : 1}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHover({
                      name: d.entity_name,
                      value: `${v.toFixed(1)}% util · ₹${m?.released.toFixed(0) ?? 0} Cr released`,
                      lgd: d.lgd_code,
                      x: x + tileW / 2,
                      y: y,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectDistrict?.(d.lgd_code)}
                />
                <text
                  x={x + tileW / 2}
                  y={y + 24}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#F9FAFB"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {d.entity_name.length > 16
                    ? d.entity_name.slice(0, 14) + "…"
                    : d.entity_name}
                </text>
                <text
                  x={x + tileW / 2}
                  y={y + 44}
                  textAnchor="middle"
                  fontSize="18"
                  fill="#F9FAFB"
                  fontFamily="monospace"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {v.toFixed(0)}%
                </text>
                <text
                  x={x + tileW / 2}
                  y={y + 62}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#9CA3AF"
                  fontFamily="monospace"
                  pointerEvents="none"
                >
                  LGD {d.lgd_code}
                </text>
              </g>
            );
          });
        })()}
      </svg>

      {hover && (
        <div
          className="absolute pointer-events-none z-20 rounded-md bg-surface-elevated border border-blue-700/50 shadow-xl px-3 py-2"
          style={{
            left: `${(hover.x / 800) * 100}%`,
            top: `${(hover.y / 680) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="text-xs font-semibold text-white">{hover.name}</div>
          <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
            LGD {hover.lgd}
          </div>
          <div className="text-[11px] text-secondary-muted mt-1">{hover.value}</div>
        </div>
      )}
    </div>
  );
}

// Generate a pseudo-polygon shape per state to give visual variety
function statePolygon(cx: number, cy: number, lgd: number): string {
  const seed = lgd % 7;
  const w = 60 + (seed * 6);
  const h = 50 + (seed * 4);
  const skew = (seed - 3) * 4;
  return [
    `${cx - w / 2 + skew},${cy - h / 2}`,
    `${cx + w / 2 - skew},${cy - h / 2 + 6}`,
    `${cx + w / 2},${cy + h / 2 - 8}`,
    `${cx - w / 2 + 4},${cy + h / 2}`,
  ].join(" ");
}
