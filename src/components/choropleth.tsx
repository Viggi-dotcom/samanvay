"use client";

import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { STATES } from "@/lib/seed-data";

export interface GeoStateData {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  pos_x: number | null;
  pos_y: number | null;
  metrics: { released: number; utilized: number; allocated: number; util: number };
}

export interface GeoDistrictData {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  state_name: string;
  metrics: { released: number; utilized: number; allocated: number; util: number };
}

interface ChoroplethProps {
  states?: GeoStateData[] | null;
  districts?: GeoDistrictData[] | null;
  selectedStateLgd?: number | null;
  selectedDistrictLgd?: number | null;
  schemeCode?: string | null;
  onSelectState?: (lgd: number) => void;
  onSelectDistrict?: (lgd: number) => void;
  height?: number;
  loading?: boolean;
}

// India bounds (rough): lon 68-97, lat 8-37
const INDIA_BOUNDS = { minLon: 67, maxLon: 98, minLat: 6, maxLat: 37.5 };
const VIEW_W = 800;
const VIEW_H = 680;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - INDIA_BOUNDS.minLon) / (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon)) * VIEW_W;
  // Invert Y because SVG y grows downward
  const y = VIEW_H - ((lat - INDIA_BOUNDS.minLat) / (INDIA_BOUNDS.maxLat - INDIA_BOUNDS.minLat)) * VIEW_H;
  return [x, y];
}

function ringToPath(coords: number[][]): string {
  return coords
    .map((c, i) => {
      const [x, y] = project(c[0], c[1]);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ") + " Z";
}

function polygonToPath(coords: number[][][][]): string {
  // MultiPolygon: array of polygons, each polygon = array of rings
  return coords.map((polygon) => polygon.map((ring) => ringToPath(ring)).join(" ")).join(" ");
}

function geometryToPath(geom: any): string {
  if (!geom) return "";
  if (geom.type === "Polygon") {
    return polygonToPath([geom.coordinates]);
  }
  if (geom.type === "MultiPolygon") {
    return polygonToPath(geom.coordinates);
  }
  return "";
}

function colorFor(v: number) {
  if (v < 40) return "#7F1D1D";
  if (v < 55) return "#B45309";
  if (v < 70) return "#A16207";
  if (v < 85) return "#15803D";
  return "#14532D";
}

interface IndiaFeature {
  type: string;
  properties: { name: string; lgd_code: number };
  geometry: any;
  path: string;
}

export function Choropleth({
  states,
  districts,
  selectedStateLgd,
  selectedDistrictLgd,
  schemeCode,
  onSelectState,
  onSelectDistrict,
  height = 520,
  loading,
}: ChoroplethProps) {
  const [hover, setHover] = useState<{
    name: string;
    value: string;
    lgd: number;
    x: number;
    y: number;
  } | null>(null);

  // Load India GeoJSON statically (public/geo/india-states.geojson)
  const [geoJson, setGeoJson] = useState<any>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/india-states.geojson")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (!cancelled) setGeoJson(data);
      })
      .catch((e) => {
        if (!cancelled) setGeoError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Build features with computed SVG paths
  const features: IndiaFeature[] = useMemo(() => {
    if (!geoJson?.features) return [];
    return geoJson.features.map((f: any) => ({
      type: f.type,
      properties: f.properties,
      geometry: f.geometry,
      path: geometryToPath(f.geometry),
    }));
  }, [geoJson]);

  // ----- National: India shape polygons -----
  if (!selectedStateLgd) {
    const stateData = states ?? [];
    const stateMap = new Map(stateData.map((s) => [s.lgd_code, s]));

    return (
      <div className="relative w-full" style={{ height }}>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="bg-glow" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#111827" stopOpacity="1" />
              <stop offset="100%" stopColor="#0B0F19" stopOpacity="1" />
            </radialGradient>
            <filter id="state-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#bg-glow)" />

          {/* Subtle grid */}
          <g opacity="0.04" stroke="#374151" strokeWidth="0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={VIEW_H} />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2={VIEW_W} y2={i * 50} />
            ))}
          </g>

          <text x="20" y="28" fill="#9CA3AF" fontSize="11" fontFamily="monospace">
            INDIA · {features.length || 0} STATES/UTs
          </text>
          <text x="20" y="46" fill="#6B7280" fontSize="9" fontFamily="monospace">
            {schemeCode ? `SCHEME FILTER: ${schemeCode}` : "ALL SCHEMES · FY 2025-2026"}
          </text>

          {loading && !geoJson && (
            <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="#6B7280" fontSize="11" fontFamily="monospace">
              loading India boundary…
            </text>
          )}

          {geoError && (
            <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="#EF4444" fontSize="10" fontFamily="monospace">
              geojson error: {geoError}
            </text>
          )}

          {/* India state polygons */}
          {features.map((f) => {
            const data = stateMap.get(f.properties.lgd_code);
            const v = data?.metrics.util ?? 0;
            const fill = data ? colorFor(v) : "#1F2937";
            const isHover = hover?.lgd === f.properties.lgd_code;
            return (
              <g key={`${f.properties.lgd_code}-${f.properties.name}`}>
                <path
                  d={f.path}
                  fill={fill}
                  fillOpacity={isHover ? 0.95 : 0.65}
                  stroke={isHover ? "#06B6D4" : "#0B0F19"}
                  strokeWidth={isHover ? 1.5 : 0.5}
                  className="cursor-pointer transition-all"
                  filter="url(#state-shadow)"
                  onMouseEnter={() => {
                    const bounds = computeBounds(f.geometry);
                    const cx = bounds ? (bounds.minX + bounds.maxX) / 2 : VIEW_W / 2;
                    const cy = bounds ? bounds.minY : VIEW_H / 2;
                    setHover({
                      name: f.properties.name,
                      value: data
                        ? `${v.toFixed(1)}% util · ₹${data.metrics.released.toFixed(0)} Cr released`
                        : "no data ingested",
                      lgd: f.properties.lgd_code,
                      x: cx,
                      y: cy,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectState?.(f.properties.lgd_code)}
                />
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(580, 590)">
            <rect x="0" y="0" width="200" height="80" fill="#111827" stroke="#374151" rx="6" />
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
              <g key={i} transform={`translate(10, ${24 + i * 11})`}>
                <rect width="10" height="7" fill={b.c} rx="1" />
                <text x="16" y="7" fill="#9CA3AF" fontSize="9">{b.l}</text>
              </g>
            ))}
          </g>
        </svg>

        {hover && (
          <div
            className="absolute pointer-events-none z-20 rounded-md bg-surface-elevated border border-blue-700/50 shadow-xl px-3 py-2"
            style={{
              left: `${(hover.x / VIEW_W) * 100}%`,
              top: `${(hover.y / VIEW_H) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div className="text-xs font-semibold text-white">{hover.name}</div>
            <div className="text-[10px] text-cyan-300 font-mono mt-0.5">LGD {hover.lgd}</div>
            <div className="text-[11px] text-secondary-muted mt-1">{hover.value}</div>
          </div>
        )}
      </div>
    );
  }

  // ----- State drilldown: district tiles -----
  const distData = districts ?? [];
  const stateName = STATES.find((s) => s.lgd_code === selectedStateLgd)?.entity_name;
  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect width={VIEW_W} height={VIEW_H} fill="#0B0F19" />
        <g opacity="0.06" stroke="#374151" strokeWidth="0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={VIEW_H} />
          ))}
        </g>
        <text x="20" y="30" fill="#9CA3AF" fontSize="11" fontFamily="monospace">
          {stateName?.toUpperCase()} · DISTRICT DRILLDOWN
        </text>
        <text x="20" y="48" fill="#6B7280" fontSize="9" fontFamily="monospace">
          {distData.length} LGD DISTRICTS · {schemeCode ?? "ALL SCHEMES"}
        </text>

        {loading && (
          <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="#6B7280" fontSize="11" fontFamily="monospace">
            loading districts…
          </text>
        )}

        {(() => {
          const cols = Math.min(5, Math.ceil(Math.sqrt(distData.length || 1)));
          const startX = 60;
          const startY = 80;
          const tileW = 130;
          const tileH = 90;
          const gap = 14;
          return distData.map((d, i) => {
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * (tileW + gap);
            const y = startY + row * (tileH + gap);
            const v = d.metrics.util;
            const fill = colorFor(v);
            const isHover = hover?.lgd === d.lgd_code;
            const isSelected = selectedDistrictLgd === d.lgd_code;
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
                      value: `${v.toFixed(1)}% util · ₹${d.metrics.released.toFixed(0)} Cr released`,
                      lgd: d.lgd_code,
                      x: x + tileW / 2,
                      y,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectDistrict?.(d.lgd_code)}
                />
                <text x={x + tileW / 2} y={y + 24} textAnchor="middle" fontSize="10" fill="#F9FAFB" fontWeight="600" pointerEvents="none">
                  {d.entity_name.length > 16 ? d.entity_name.slice(0, 14) + "…" : d.entity_name}
                </text>
                <text x={x + tileW / 2} y={y + 44} textAnchor="middle" fontSize="18" fill="#F9FAFB" fontFamily="monospace" fontWeight="700" pointerEvents="none">
                  {v.toFixed(0)}%
                </text>
                <text x={x + tileW / 2} y={y + 62} textAnchor="middle" fontSize="8" fill="#9CA3AF" fontFamily="monospace" pointerEvents="none">
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
            left: `${(hover.x / VIEW_W) * 100}%`,
            top: `${(hover.y / VIEW_H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="text-xs font-semibold text-white">{hover.name}</div>
          <div className="text-[10px] text-cyan-300 font-mono mt-0.5">LGD {hover.lgd}</div>
          <div className="text-[11px] text-secondary-muted mt-1">{hover.value}</div>
        </div>
      )}
    </div>
  );
}

// Compute bounding box of a geometry in SVG coordinates
function computeBounds(geom: any): { minX: number; maxX: number; minY: number; maxY: number } | null {
  if (!geom) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const walk = (coords: any) => {
    if (typeof coords[0] === "number") {
      const [x, y] = project(coords[0], coords[1]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      for (const c of coords) walk(c);
    }
  };
  if (geom.type === "Polygon") walk(geom.coordinates);
  else if (geom.type === "MultiPolygon") walk(geom.coordinates);
  if (minX === Infinity) return null;
  return { minX, maxX, minY, maxY };
}
