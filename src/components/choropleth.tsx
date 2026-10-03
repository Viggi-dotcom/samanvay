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

// India bounds: lon 68-97, lat 8-37
const INDIA_BOUNDS = { minLon: 67, maxLon: 98, minLat: 6, maxLat: 37.5 };
const VIEW_W = 800;
const VIEW_H = 680;

function project(lon: number, lat: number): [number, number] {
  const x = ((lon - INDIA_BOUNDS.minLon) / (INDIA_BOUNDS.maxLon - INDIA_BOUNDS.minLon)) * VIEW_W;
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
  if (v < 40) return "#EF4444";
  if (v < 55) return "#F97316";
  if (v < 70) return "#EAB308";
  if (v < 85) return "#22C55E";
  return "#15803D";
}

interface IndiaFeature {
  type: string;
  properties: {
    name: string;
    lgd_code: number;
    [k: string]: any;
  };
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
  height = 540,
  loading,
}: ChoroplethProps) {
  const [hover, setHover] = useState<{
    name: string;
    value: string;
    lgd: number;
    x: number;
    y: number;
  } | null>(null);

  const [geoJson, setGeoJson] = useState<any>(null);

  useEffect(() => {
    fetch("/geo/india-states.geojson")
      .then((r) => r.json())
      .then((d) => setGeoJson(d))
      .catch((err) => console.error("Failed to load India GeoJSON:", err));
  }, []);

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
      <div className="relative w-full bg-[#F8FAFC]" style={{ height }}>
        <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <filter id="state-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodColor="#000000" floodOpacity="0.08" />
            </filter>
          </defs>
          <rect width={VIEW_W} height={VIEW_H} fill="#F8FAFC" />

          {/* Clean government grid */}
          <g opacity="0.4" stroke="#E2E8F0" strokeWidth="0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={VIEW_H} />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h${i}`} x1="0" y1={i * 50} x2={VIEW_W} y2={i * 50} />
            ))}
          </g>

          <text x="20" y="28" fill="#475569" fontSize="11" fontWeight="700">
            PAN-INDIA SPATIAL COVERAGE
          </text>
          <text x="20" y="44" fill="#64748B" fontSize="10">
            {schemeCode ? `Scheme Filter: ${schemeCode}` : "All Centrally Sponsored Schemes"}
          </text>

          {loading && !geoJson && (
            <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="#64748B" fontSize="11">
              Loading boundary data…
            </text>
          )}

          {/* Render state paths */}
          {features.map((f, idx) => {
            const data = stateMap.get(f.properties.lgd_code);
            const v = data?.metrics?.util ?? 0;
            const fill = data ? colorFor(v) : "#E2E8F0";
            const isHover = hover?.lgd === f.properties.lgd_code;

            return (
              <g key={`${f.properties.lgd_code || f.properties.name || "feat"}-${idx}`}>
                <path
                  d={f.path}
                  fill={fill}
                  fillOpacity={isHover ? 0.95 : 0.8}
                  stroke={isHover ? "#0B4F9C" : "#FFFFFF"}
                  strokeWidth={isHover ? 1.8 : 0.75}
                  className="cursor-pointer transition-all"
                  filter="url(#state-shadow)"
                  onMouseEnter={() => {
                    const bounds = computeBounds(f.geometry);
                    const cx = bounds ? (bounds.minX + bounds.maxX) / 2 : VIEW_W / 2;
                    const cy = bounds ? bounds.minY : VIEW_H / 2;
                    setHover({
                      name: f.properties.name,
                      value: data
                        ? `${v.toFixed(1)}% Utilization · ₹${data.metrics.released.toFixed(0)} Cr Released`
                        : "No Data",
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

          {/* Official Clean White Legend */}
          <g transform="translate(580, 560)">
            <rect x="0" y="0" width="200" height="100" fill="#FFFFFF" stroke="#E2E8F0" rx="6" />
            <text x="12" y="16" fill="#1E293B" fontSize="10" fontWeight="700">
              UTILIZATION SCALE
            </text>
            {[
              { c: "#EF4444", l: "< 40% (Critical Lag)" },
              { c: "#F97316", l: "40 - 55% (Low Velocity)" },
              { c: "#EAB308", l: "55 - 70% (Moderate)" },
              { c: "#22C55E", l: "70 - 85% (Optimal)" },
              { c: "#15803D", l: "> 85% (High Saturation)" },
            ].map((b, i) => (
              <g key={i} transform={`translate(12, ${26 + i * 14})`}>
                <rect width="10" height="9" fill={b.c} rx="1" />
                <text x="16" y="8" fill="#475569" fontSize="9">{b.l}</text>
              </g>
            ))}
          </g>
        </svg>

        {hover && (
          <div
            className="absolute pointer-events-none z-20 rounded-lg bg-white border border-gray-300 shadow-md px-3 py-2 text-left"
            style={{
              left: `${(hover.x / VIEW_W) * 100}%`,
              top: `${(hover.y / VIEW_H) * 100}%`,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div className="text-xs font-bold text-gray-900">{hover.name}</div>
            <div className="text-[10px] text-[#0B4F9C] font-semibold mt-0.5">LGD Code: {hover.lgd}</div>
            <div className="text-[11px] text-gray-600 mt-1">{hover.value}</div>
          </div>
        )}
      </div>
    );
  }

  // ----- State drilldown: district tiles -----
  const distData = districts ?? [];
  const stateName = STATES.find((s) => s.lgd_code === selectedStateLgd)?.entity_name;
  return (
    <div className="relative w-full bg-[#F8FAFC]" style={{ height }}>
      <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <rect width={VIEW_W} height={VIEW_H} fill="#F8FAFC" />
        <g opacity="0.4" stroke="#E2E8F0" strokeWidth="0.5">
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2={VIEW_H} />
          ))}
        </g>
        <text x="20" y="30" fill="#1E293B" fontSize="12" fontWeight="700">
          {stateName?.toUpperCase()} · DISTRICT-LEVEL MONITORING
        </text>
        <text x="20" y="48" fill="#64748B" fontSize="10">
          {distData.length} LGD Districts Ingested · {schemeCode ?? "All Centrally Sponsored Schemes"}
        </text>

        {loading && (
          <text x={VIEW_W / 2} y={VIEW_H / 2} textAnchor="middle" fill="#64748B" fontSize="11">
            Loading district data…
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
              <g key={`${d.lgd_code}-${i}`}>
                <rect
                  x={x}
                  y={y}
                  width={tileW}
                  height={tileH}
                  rx="6"
                  fill={fill}
                  fillOpacity={isHover || isSelected ? 0.95 : 0.8}
                  stroke={isSelected ? "#0B4F9C" : isHover ? "#0B4F9C" : "#FFFFFF"}
                  strokeWidth={isSelected ? 2.5 : isHover ? 1.5 : 1}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHover({
                      name: d.entity_name,
                      value: `${v.toFixed(1)}% Utilization · ₹${d.metrics.released.toFixed(0)} Cr Released`,
                      lgd: d.lgd_code,
                      x: x + tileW / 2,
                      y,
                    })
                  }
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectDistrict?.(d.lgd_code)}
                />
                <text x={x + tileW / 2} y={y + 24} textAnchor="middle" fontSize="10" fill="#FFFFFF" fontWeight="700" pointerEvents="none">
                  {d.entity_name.length > 16 ? d.entity_name.slice(0, 14) + "…" : d.entity_name}
                </text>
                <text x={x + tileW / 2} y={y + 46} textAnchor="middle" fontSize="18" fill="#FFFFFF" fontWeight="800" pointerEvents="none">
                  {v.toFixed(0)}%
                </text>
                <text x={x + tileW / 2} y={y + 64} textAnchor="middle" fontSize="9" fill="#FFFFFF" opacity="0.9" pointerEvents="none">
                  LGD {d.lgd_code}
                </text>
              </g>
            );
          });
        })()}
      </svg>

      {hover && (
        <div
          className="absolute pointer-events-none z-20 rounded-lg bg-white border border-gray-300 shadow-md px-3 py-2 text-left"
          style={{
            left: `${(hover.x / VIEW_W) * 100}%`,
            top: `${(hover.y / VIEW_H) * 100}%`,
            transform: "translate(-50%, -110%)",
          }}
        >
          <div className="text-xs font-bold text-gray-900">{hover.name}</div>
          <div className="text-[10px] text-[#0B4F9C] font-semibold mt-0.5">District LGD: {hover.lgd}</div>
          <div className="text-[11px] text-gray-600 mt-1">{hover.value}</div>
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
