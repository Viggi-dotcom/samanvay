/**
 * Samanvay Intelligence — Global App Store
 * Manages auth state, current view (client-side routing), and global filters.
 */
import { create } from "zustand";
import type { Persona, Role } from "@/lib/data";

export type ViewId =
  | "overview"
  | "convergence-matrix"
  | "convergence-compare"
  | "geo-national"
  | "geo-state"
  | "geo-district"
  | "schemes-directory"
  | "scheme-detail"
  | "intelligence-query"
  | "intelligence-alerts"
  | "admin-pipelines"
  | "admin-users";

export interface ActiveFilters {
  stateLgd: number | null;
  districtLgd: number | null;
  schemeId: string | null;
  fy: string;
  quarter: number | null;
}

interface AppState {
  // auth
  isAuthenticated: boolean;
  persona: Persona | null;
  role: Role | null;

  // navigation
  view: ViewId;
  selectedSchemeId: string | null;
  selectedStateLgd: number | null;
  selectedDistrictLgd: number | null;

  // global filters
  filters: ActiveFilters;

  // actions
  login: (persona: Persona) => void;
  logout: () => void;
  setView: (v: ViewId) => void;
  openScheme: (schemeId: string) => void;
  openState: (stateLgd: number) => void;
  openDistrict: (distLgd: number) => void;
  setFilter: <K extends keyof ActiveFilters>(
    key: K,
    value: ActiveFilters[K]
  ) => void;
  resetFilters: () => void;
}

const DEFAULT_FILTERS: ActiveFilters = {
  stateLgd: null,
  districtLgd: null,
  schemeId: null,
  fy: "2025-2026",
  quarter: null,
};

export const useApp = create<AppState>((set) => ({
  isAuthenticated: false,
  persona: null,
  role: null,

  view: "overview",
  selectedSchemeId: null,
  selectedStateLgd: null,
  selectedDistrictLgd: null,

  filters: DEFAULT_FILTERS,

  login: (persona) =>
    set({
      isAuthenticated: true,
      persona,
      role: persona.role,
      view: "overview",
      // District Magistrate sees only their district by default
      filters: persona.assignedLgdCode
        ? {
            ...DEFAULT_FILTERS,
            districtLgd: persona.assignedLgdCode,
            stateLgd: 27, // Gorakhpur -> UP
          }
        : persona.assignedMinistryId
          ? { ...DEFAULT_FILTERS }
          : DEFAULT_FILTERS,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      persona: null,
      role: null,
      view: "overview",
      filters: DEFAULT_FILTERS,
    }),

  setView: (v) => set({ view: v }),

  openScheme: (schemeId) =>
    set({ view: "scheme-detail", selectedSchemeId: schemeId }),

  openState: (stateLgd) =>
    set({ view: "geo-state", selectedStateLgd: stateLgd }),

  openDistrict: (distLgd) =>
    set({ view: "geo-district", selectedDistrictLgd: distLgd }),

  setFilter: (key, value) =>
    set((s) => ({
      filters: { ...s.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
