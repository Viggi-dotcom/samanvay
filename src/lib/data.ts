/**
 * Samanvay Intelligence — Mock Domain Data
 * Mirrors the canonical PostgreSQL schema from the PRD:
 *   dim_ministries, dim_schemes, dim_lgd_geography,
 *   fact_scheme_allocations, fact_scheme_beneficiaries_agg, fact_detected_anomalies
 */

export type Role =
  | "super_admin"
  | "central_executive"
  | "dept_nodal"
  | "district_magistrate"
  | "auditor";

export interface Persona {
  role: Role;
  label: string;
  targetUser: string;
  dataAccessScope: string;
  permissions: string;
  assignedMinistryId?: string;
  assignedLgdCode?: number;
}

export const PERSONAS: Persona[] = [
  {
    role: "central_executive",
    label: "Central Executive Secretary",
    targetUser: "Cabinet Secretariat, NITI Aayog",
    dataAccessScope: "Pan-India, Cross-Ministry",
    permissions:
      "Read-only aggregate + drill-down across all schemes, NLP query workbench, automated convergence reports, cross-scheme correlation exports.",
  },
  {
    role: "dept_nodal",
    label: "Department Nodal Officer",
    targetUser: "Joint Secretary / Director (MoRD)",
    dataAccessScope: "Ministry-Specific (Deep) + Cross-Ministry (Aggregated)",
    permissions:
      "Full access to own ministry's granular data; read-only macro indicators for other ministries; set threshold alerts for scheme milestones.",
    assignedMinistryId: "min-mord",
  },
  {
    role: "district_magistrate",
    label: "District Magistrate (DM / DC)",
    targetUser: "District Collector, Gorakhpur (LGD 463)",
    dataAccessScope: "District-Specific (down to Gram Panchayat)",
    permissions:
      "Granular cross-scheme view within assigned district LGD code; field intervention tracking, flagging reporting discrepancies, assigning field audits.",
    assignedLgdCode: 463,
  },
  {
    role: "auditor",
    label: "Auditor / Research Analyst",
    targetUser: "CAG, Independent Researchers",
    dataAccessScope: "Anonymized Pan-India",
    permissions:
      "Read-only access to analytical views, execution of NL-to-SQL queries with citation verification, export of anomaly audit trails. PII completely masked.",
  },
  {
    role: "super_admin",
    label: "Super Admin (NIC)",
    targetUser: "Platform Engineering / NIC Admin",
    dataAccessScope: "Global System-wide",
    permissions:
      "Schema migrations, API token management, pipeline scheduling, audit log inspection, user provisioning.",
  },
];

// ---------- Dimensions ----------

export interface Ministry {
  ministry_id: string;
  ministry_code: string;
  ministry_name: string;
  nodal_email: string;
}

export const MINISTRIES: Ministry[] = [
  {
    ministry_id: "min-mord",
    ministry_code: "GOI_MORD",
    ministry_name: "Ministry of Rural Development",
    nodal_email: "nodal-mord@gov.in",
  },
  {
    ministry_id: "min-moa",
    ministry_code: "GOI_MOA",
    ministry_name: "Ministry of Agriculture & Farmers Welfare",
    nodal_email: "nodal-moa@gov.in",
  },
  {
    ministry_id: "min-mohua",
    ministry_code: "GOI_MOHUA",
    ministry_name: "Ministry of Housing & Urban Affairs",
    nodal_email: "nodal-mohua@gov.in",
  },
];

export interface Scheme {
  scheme_id: string;
  ministry_id: string;
  scheme_code: string;
  scheme_name: string;
  scheme_type: "CORE_OF_CORE" | "CORE_SCHEME" | "CENTRAL_SECTOR";
  launch_date: string;
  is_active: boolean;
  description: string;
  color: string;
  keyMetrics: { label: string; key: string }[];
}

export const SCHEMES: Scheme[] = [
  {
    scheme_id: "sch-mgnrega",
    ministry_id: "min-mord",
    scheme_code: "MGNREGA",
    scheme_name: "Mahatma Gandhi National Rural Employment Guarantee Act",
    scheme_type: "CORE_OF_CORE",
    launch_date: "2006-02-02",
    is_active: true,
    description:
      "Demand-driven wage employment guaranteeing 100 days of unskilled work per rural household per financial year. Anchored on LGD block and Gram Panchayat codes.",
    color: "#2563EB",
    keyMetrics: [
      { label: "Person-days Generated", key: "person_days" },
      { label: "Active Works", key: "active_works" },
      { label: "Wage Expenditure", key: "wage_exp_cr" },
      { label: "Households Provided Work", key: "households" },
    ],
  },
  {
    scheme_id: "sch-pmkisan",
    ministry_id: "min-moa",
    scheme_code: "PM_KISAN",
    scheme_name: "Pradhan Mantri Kisan Samman Nidhi",
    scheme_type: "CENTRAL_SECTOR",
    launch_date: "2019-02-24",
    is_active: true,
    description:
      "Direct Benefit Transfer income support of ₹6,000/year to landholding farmer families, paid in three equal installments. Landholder verification through PM-KISAN registry.",
    color: "#06B6D4",
    keyMetrics: [
      { label: "Beneficiaries Verified", key: "verified_beneficiaries" },
      { label: "DBT Disbursed", key: "dbt_disbursed_cr" },
      { label: "Installment Release Cycle", key: "installment_cycle" },
      { label: "Pending Verifications", key: "pending_verifications" },
    ],
  },
  {
    scheme_id: "sch-pmayg",
    ministry_id: "min-mord",
    scheme_code: "PMAY_G",
    scheme_name: "Pradhan Mantri Awas Yojana — Gramin",
    scheme_type: "CORE_SCHEME",
    launch_date: "2016-04-01",
    is_active: true,
    description:
      "Rural housing scheme providing pucca houses with geo-tagged construction milestones and tranche-linked financial releases tied to AwaasSoft registration.",
    color: "#8B5CF6",
    keyMetrics: [
      { label: "Houses Sanctioned", key: "houses_sanctioned" },
      { label: "Houses Completed", key: "houses_completed" },
      { label: "Geo-tagged Milestones", key: "geo_tagged" },
      { label: "Tranche Releases", key: "tranche_releases_cr" },
    ],
  },
];

// ---------- Geography (LGD) ----------

export interface LgdEntity {
  lgd_code: number;
  entity_level: "STATE" | "DISTRICT" | "BLOCK";
  entity_name: string;
  parent_lgd: number | null;
  state_lgd: number;
  // choropleth helper coordinates (simplified SVG positions)
  x: number;
  y: number;
}

export const STATES: LgdEntity[] = [
  { lgd_code: 27, entity_level: "STATE", entity_name: "Uttar Pradesh", parent_lgd: null, state_lgd: 27, x: 470, y: 220 },
  { lgd_code: 10, entity_level: "STATE", entity_name: "Bihar", parent_lgd: null, state_lgd: 10, x: 580, y: 290 },
  { lgd_code: 9, entity_level: "STATE", entity_name: "Odisha", parent_lgd: null, state_lgd: 9, x: 580, y: 410 },
  { lgd_code: 22, entity_level: "STATE", entity_name: "Chhattisgarh", parent_lgd: null, state_lgd: 22, x: 490, y: 410 },
  { lgd_code: 20, entity_level: "STATE", entity_name: "Jharkhand", parent_lgd: null, state_lgd: 20, x: 560, y: 350 },
  { lgd_code: 23, entity_level: "STATE", entity_name: "Madhya Pradesh", parent_lgd: null, state_lgd: 23, x: 390, y: 330 },
  { lgd_code: 24, entity_level: "STATE", entity_name: "Rajasthan", parent_lgd: null, state_lgd: 24, x: 290, y: 240 },
  { lgd_code: 7, entity_level: "STATE", entity_name: "Maharashtra", parent_lgd: null, state_lgd: 7, x: 350, y: 420 },
  { lgd_code: 16, entity_level: "STATE", entity_name: "West Bengal", parent_lgd: null, state_lgd: 16, x: 660, y: 340 },
  { lgd_code: 36, entity_level: "STATE", entity_name: "Telangana", parent_lgd: null, state_lgd: 36, x: 440, y: 480 },
  { lgd_code: 28, entity_level: "STATE", entity_name: "Andhra Pradesh", parent_lgd: null, state_lgd: 28, x: 490, y: 510 },
  { lgd_code: 33, entity_level: "STATE", entity_name: "Tamil Nadu", parent_lgd: null, state_lgd: 33, x: 470, y: 570 },
  { lgd_code: 29, entity_level: "STATE", entity_name: "Karnataka", parent_lgd: null, state_lgd: 29, x: 390, y: 520 },
  { lgd_code: 32, entity_level: "STATE", entity_name: "Kerala", parent_lgd: null, state_lgd: 32, x: 430, y: 600 },
  { lgd_code: 21, entity_level: "STATE", entity_name: "Odisha (Coastal)", parent_lgd: null, state_lgd: 21, x: 600, y: 430 },
  { lgd_code: 1, entity_level: "STATE", entity_name: "Jammu & Kashmir", parent_lgd: null, state_lgd: 1, x: 320, y: 110 },
  { lgd_code: 2, entity_level: "STATE", entity_name: "Himachal Pradesh", parent_lgd: null, state_lgd: 2, x: 380, y: 150 },
  { lgd_code: 5, entity_level: "STATE", entity_name: "Uttarakhand", parent_lgd: null, state_lgd: 5, x: 420, y: 190 },
  { lgd_code: 6, entity_level: "STATE", entity_name: "Haryana", parent_lgd: null, state_lgd: 6, x: 410, y: 220 },
  { lgd_code: 8, entity_level: "STATE", entity_name: "Delhi (NCT)", parent_lgd: null, state_lgd: 8, x: 440, y: 240 },
  { lgd_code: 3, entity_level: "STATE", entity_name: "Punjab", parent_lgd: null, state_lgd: 3, x: 380, y: 200 },
  { lgd_code: 30, entity_level: "STATE", entity_name: "Goa", parent_lgd: null, state_lgd: 30, x: 360, y: 470 },
  { lgd_code: 31, entity_level: "STATE", entity_name: "Gujarat", parent_lgd: null, state_lgd: 31, x: 250, y: 340 },
  { lgd_code: 34, entity_level: "STATE", entity_name: "Assam", parent_lgd: null, state_lgd: 34, x: 720, y: 230 },
  { lgd_code: 4, entity_level: "STATE", entity_name: "Chandigarh", parent_lgd: null, state_lgd: 4, x: 410, y: 200 },
];

export interface District {
  lgd_code: number;
  entity_name: string;
  state_lgd: number;
  parent_lgd: number;
  stateName: string;
}

export const DISTRICTS: District[] = [
  // Uttar Pradesh (27)
  { lgd_code: 463, entity_name: "Gorakhpur", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 461, entity_name: "Basti", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 466, entity_name: "Deoria", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 467, entity_name: "Kushi Nagar", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 470, entity_name: "Maharajganj", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 471, entity_name: "Sant Kabir Nagar", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 474, entity_name: "Azamgarh", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 480, entity_name: "Varanasi", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 484, entity_name: "Jaunpur", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 489, entity_name: "Prayagraj", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 497, entity_name: "Lucknow", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 501, entity_name: "Kanpur Nagar", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 505, entity_name: "Agra", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 509, entity_name: "Mathura", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 515, entity_name: "Bareilly", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  { lgd_code: 521, entity_name: "Moradabad", state_lgd: 27, parent_lgd: 27, stateName: "Uttar Pradesh" },
  // Bihar (10)
  { lgd_code: 216, entity_name: "Araria", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 222, entity_name: "Kishanganj", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 230, entity_name: "Purnia", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 209, entity_name: "Katihar", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 215, entity_name: "Supaul", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 212, entity_name: "Muzaffarpur", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 224, entity_name: "Patna", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 232, entity_name: "Gaya", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 218, entity_name: "Bhagalpur", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  { lgd_code: 211, entity_name: "Darbhanga", state_lgd: 10, parent_lgd: 10, stateName: "Bihar" },
  // Odisha (9)
  { lgd_code: 369, entity_name: "Mayurbhanj", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 370, entity_name: "Sundargarh", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 371, entity_name: "Sambalpur", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 374, entity_name: "Cuttack", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 376, entity_name: "Khordha", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 378, entity_name: "Ganjam", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 380, entity_name: "Kalahandi", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 381, entity_name: "Rayagada", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  { lgd_code: 382, entity_name: "Koraput", state_lgd: 9, parent_lgd: 9, stateName: "Odisha" },
  // Madhya Pradesh (23)
  { lgd_code: 444, entity_name: "Bhopal", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 447, entity_name: "Indore", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 451, entity_name: "Jabalpur", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 458, entity_name: "Gwalior", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 481, entity_name: "Rewa", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 482, entity_name: "Sagar", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 483, entity_name: "Dhar", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  { lgd_code: 468, entity_name: "Chhindwara", state_lgd: 23, parent_lgd: 23, stateName: "Madhya Pradesh" },
  // Rajasthan (24)
  { lgd_code: 532, entity_name: "Jaipur", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 534, entity_name: "Jodhpur", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 537, entity_name: "Udaipur", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 540, entity_name: "Kota", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 543, entity_name: "Ajmer", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 546, entity_name: "Bikaner", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 549, entity_name: "Alwar", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  { lgd_code: 552, entity_name: "Bharatpur", state_lgd: 24, parent_lgd: 24, stateName: "Rajasthan" },
  // Maharashtra (7)
  { lgd_code: 518, entity_name: "Mumbai", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 519, entity_name: "Pune", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 522, entity_name: "Nagpur", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 525, entity_name: "Nashik", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 527, entity_name: "Aurangabad", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 530, entity_name: "Solapur", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  { lgd_code: 533, entity_name: "Thane", state_lgd: 7, parent_lgd: 7, stateName: "Maharashtra" },
  // West Bengal (16)
  { lgd_code: 322, entity_name: "Kolkata", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 324, entity_name: "Howrah", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 326, entity_name: "North 24 Parganas", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 329, entity_name: "Purba Medinipur", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 331, entity_name: "Murshidabad", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 334, entity_name: "Nadia", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 337, entity_name: "Jalpaiguri", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
  { lgd_code: 339, entity_name: "Darjeeling", state_lgd: 16, parent_lgd: 16, stateName: "West Bengal" },
];

// ---------- Facts ----------

export interface AllocationFact {
  scheme_id: string;
  lgd_code: number;
  financial_year: string;
  quarter: number;
  allocated_cr: number;
  released_cr: number;
  utilized_cr: number;
}

export interface BeneficiaryFact {
  scheme_id: string;
  lgd_code: number;
  reporting_month: string;
  target_units: number;
  achieved_units: number;
  beneficiaries_total: number;
  beneficiaries_women: number;
  beneficiaries_sc_st: number;
}

export interface AnomalyFact {
  anomaly_id: string;
  scheme_id: string | null;
  lgd_code: number;
  anomaly_type:
    | "UNDERUTILIZATION"
    | "SCHEME_OVERLAP_GAP"
    | "STALLING"
    | "REPORTING_DELAY"
    | "DIVERGENCE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  z_score: number;
  evidence_payload: Record<string, unknown>;
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  created_at: string;
  description: string;
}

// Deterministic pseudo-random generator for stable mock data
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const FY = "2025-2026";

// Documented extreme-value districts — these reflect the anomaly records
// (Araria, Kishanganj, Purnia in Bihar; Koraput, Kalahandi, Rayagada in Odisha;
// Basti in UP). For these we force LOW utilization on MGNREGA and PMAY-G so
// the Convergence Matrix will correctly flag OVERLAP_HIGH / GAP / STALLING.
const EXTREME_DISTRICTS: Record<
  number,
  { mgnregaUtil: number; pmaygUtil: number; pmkisanUtil: number; pmaygCompletion: number }
> = {
  216: { mgnregaUtil: 0.38, pmaygUtil: 0.32, pmkisanUtil: 0.71, pmaygCompletion: 0.28 }, // Araria
  222: { mgnregaUtil: 0.42, pmaygUtil: 0.36, pmkisanUtil: 0.68, pmaygCompletion: 0.34 }, // Kishanganj
  230: { mgnregaUtil: 0.47, pmaygUtil: 0.41, pmkisanUtil: 0.55, pmaygCompletion: 0.39 }, // Purnia
  382: { mgnregaUtil: 0.38, pmaygUtil: 0.34, pmkisanUtil: 0.62, pmaygCompletion: 0.31 }, // Koraput
  380: { mgnregaUtil: 0.44, pmaygUtil: 0.40, pmkisanUtil: 0.65, pmaygCompletion: 0.36 }, // Kalahandi
  381: { mgnregaUtil: 0.51, pmaygUtil: 0.45, pmkisanUtil: 0.69, pmaygCompletion: 0.42 }, // Rayagada
  461: { mgnregaUtil: 0.74, pmaygUtil: 0.38, pmkisanUtil: 0.78, pmaygCompletion: 0.36 }, // Basti (overlap high)
  463: { mgnregaUtil: 0.81, pmaygUtil: 0.39, pmkisanUtil: 0.82, pmaygCompletion: 0.37 }, // Gorakhpur (overlap high)
};

// Build allocation facts for every district x scheme x quarter
export function buildAllocations(): AllocationFact[] {
  const rand = seeded(42);
  const out: AllocationFact[] = [];
  for (const d of DISTRICTS) {
    const extreme = EXTREME_DISTRICTS[d.lgd_code];
    for (const s of SCHEMES) {
      for (let q = 1; q <= 4; q++) {
        const base = (d.lgd_code % 100) * 10 + 50;
        const allocated = Math.round((base + rand() * 80) * 10) / 10;
        const releaseRatio = 0.7 + rand() * 0.25;
        const released = Math.round(allocated * releaseRatio * 10) / 10;
        let utilRatio = 0.4 + rand() * 0.5;
        if (extreme) {
          if (s.scheme_id === "sch-mgnrega") utilRatio = extreme.mgnregaUtil;
          else if (s.scheme_id === "sch-pmayg") utilRatio = extreme.pmaygUtil;
          else if (s.scheme_id === "sch-pmkisan") utilRatio = extreme.pmkisanUtil;
        }
        const utilized = Math.round(released * utilRatio * 10) / 10;
        out.push({
          scheme_id: s.scheme_id,
          lgd_code: d.lgd_code,
          financial_year: FY,
          quarter: q,
          allocated_cr: allocated,
          released_cr: released,
          utilized_cr: utilized,
        });
      }
    }
  }
  return out;
}

export const ALLOCATIONS = buildAllocations();

export function buildBeneficiaries(): BeneficiaryFact[] {
  const rand = seeded(73);
  const out: BeneficiaryFact[] = [];
  for (const d of DISTRICTS) {
    const extreme = EXTREME_DISTRICTS[d.lgd_code];
    for (const s of SCHEMES) {
      const target = Math.round(1000 + rand() * 9000);
      let achieveRatio = 0.4 + rand() * 0.55;
      if (extreme && s.scheme_id === "sch-pmayg") {
        achieveRatio = extreme.pmaygCompletion;
      }
      const achieved = Math.round(target * achieveRatio);
      const ben = Math.round(achieved * (2 + rand() * 6));
      out.push({
        scheme_id: s.scheme_id,
        lgd_code: d.lgd_code,
        reporting_month: "2026-03-01",
        target_units: target,
        achieved_units: achieved,
        beneficiaries_total: ben,
        beneficiaries_women: Math.round(ben * (0.3 + rand() * 0.2)),
        beneficiaries_sc_st: Math.round(ben * (0.2 + rand() * 0.3)),
      });
    }
  }
  return out;
}

export const BENEFICIARIES = buildBeneficiaries();

export const ANOMALIES: AnomalyFact[] = [
  {
    anomaly_id: "anom-001",
    scheme_id: "sch-pmayg",
    lgd_code: 463,
    anomaly_type: "STALLING",
    severity: "CRITICAL",
    z_score: -2.8,
    evidence_payload: {
      metric: "physical_progress_days",
      value: 47,
      threshold: 45,
      blocks_affected: ["Bansgaon", "Kauriram", "Gagaha"],
      last_update: "2026-02-12",
    },
    status: "OPEN",
    created_at: "2026-03-25T08:14:00Z",
    description:
      "PMAY-G house sanctions in Gorakhpur have registered zero physical progress updates for 47 consecutive days, breaching the 45-day stall threshold.",
  },
  {
    anomaly_id: "anom-002",
    scheme_id: null,
    lgd_code: 216,
    anomaly_type: "SCHEME_OVERLAP_GAP",
    severity: "HIGH",
    z_score: -2.3,
    evidence_payload: {
      mgnrega_utilization_pct: 38.2,
      pmayg_completion_pct: 41.6,
      interpretation: "High wage demand overlapping with lagging housing completion",
    },
    status: "OPEN",
    created_at: "2026-03-24T04:00:00Z",
    description:
      "Araria district exhibits high MGNREGA person-days (top 20th percentile) alongside bottom-20th-percentile PMAY-G completion — a textbook convergence gap.",
  },
  {
    anomaly_id: "anom-003",
    scheme_id: "sch-mgnrega",
    lgd_code: 222,
    anomaly_type: "UNDERUTILIZATION",
    severity: "CRITICAL",
    z_score: -2.6,
    evidence_payload: {
      allocated_cr: 84.3,
      released_cr: 67.4,
      utilized_cr: 28.0,
      utilization_pct: 41.6,
      state_median_pct: 72.4,
    },
    status: "OPEN",
    created_at: "2026-03-24T04:00:00Z",
    description:
      "Kishanganj MGNREGA utilization at 41.6% — 2.6 standard deviations below the Bihar state median of 72.4%.",
  },
  {
    anomaly_id: "anom-004",
    scheme_id: "sch-pmkisan",
    lgd_code: 230,
    anomaly_type: "REPORTING_DELAY",
    severity: "MEDIUM",
    z_score: -1.4,
    evidence_payload: {
      last_installment_date: "2026-01-08",
      expected_cycle: "Q3",
      delay_days: 56,
    },
    status: "ACKNOWLEDGED",
    created_at: "2026-03-22T11:00:00Z",
    description:
      "PM-KISAN 19th installment disbursement records for Purnia lag by 56 days against expected Q3 release window.",
  },
  {
    anomaly_id: "anom-005",
    scheme_id: "sch-pmayg",
    lgd_code: 380,
    anomaly_type: "UNDERUTILIZATION",
    severity: "HIGH",
    z_score: -2.1,
    evidence_payload: {
      allocated_cr: 102.4,
      released_cr: 78.9,
      utilized_cr: 31.5,
      utilization_pct: 39.9,
    },
    status: "OPEN",
    created_at: "2026-03-24T04:00:00Z",
    description:
      "Kalahandi PMAY-G tranche utilization at 39.9% — funds released but geo-tagged milestone verification stalled.",
  },
  {
    anomaly_id: "anom-006",
    scheme_id: null,
    lgd_code: 337,
    anomaly_type: "DIVERGENCE",
    severity: "HIGH",
    z_score: 2.4,
    evidence_payload: {
      mgnrega_fund_velocity: 4.1,
      asset_validation_velocity: 1.0,
      multiplier: 4.1,
    },
    status: "OPEN",
    created_at: "2026-03-23T18:20:00Z",
    description:
      "Jalpaiguri MGNREGA fund utilization is surging 4.1× faster than physical asset validation — possible ghost-works risk.",
  },
  {
    anomaly_id: "anom-007",
    scheme_id: "sch-mgnrega",
    lgd_code: 382,
    anomaly_type: "UNDERUTILIZATION",
    severity: "CRITICAL",
    z_score: -2.9,
    evidence_payload: {
      allocated_cr: 91.7,
      released_cr: 70.2,
      utilized_cr: 26.4,
      utilization_pct: 37.6,
    },
    status: "OPEN",
    created_at: "2026-03-24T04:00:00Z",
    description:
      "Koraput MGNREGA utilization at 37.6% despite high tribal-belt work demand — release pipeline blockage suspected.",
  },
  {
    anomaly_id: "anom-008",
    scheme_id: "sch-pmayg",
    lgd_code: 461,
    anomaly_type: "STALLING",
    severity: "HIGH",
    z_score: -2.0,
    evidence_payload: {
      metric: "physical_progress_days",
      value: 52,
      threshold: 45,
      blocks_affected: ["Harraiya", "Kaptanganj"],
    },
    status: "OPEN",
    created_at: "2026-03-23T10:00:00Z",
    description:
      "Basti PMAY-G milestones stalled for 52 days; 2 blocks affected — timber transport embargo reported by BDO Harraiya.",
  },
  {
    anomaly_id: "anom-009",
    scheme_id: null,
    lgd_code: 211,
    anomaly_type: "SCHEME_OVERLAP_GAP",
    severity: "MEDIUM",
    z_score: -1.8,
    evidence_payload: {
      pmkisan_beneficiaries: 32140,
      missing_mgnrega_linkages: 32000,
      district: "Darbhanga",
      region: "Mithilanchal",
    },
    status: "OPEN",
    created_at: "2026-03-22T16:45:00Z",
    description:
      "32,000 PM-KISAN landholders in Darbhanga missing MGNREGA job card linkages — Bundelkhand-pattern convergence gap.",
  },
  {
    anomaly_id: "anom-010",
    scheme_id: "sch-pmkisan",
    lgd_code: 480,
    anomaly_type: "REPORTING_DELAY",
    severity: "LOW",
    z_score: -0.9,
    evidence_payload: { delay_days: 11, cycle: "19th installment" },
    status: "RESOLVED",
    created_at: "2026-03-10T09:00:00Z",
    description:
      "Varanasi PM-KISAN 19th installment reconciliation completed — 11-day reporting lag now closed.",
  },
];

// ---------- Aggregate KPIs ----------

export function aggregateKpis(filters: {
  stateLgd?: number | null;
  districtLgd?: number | null;
  schemeId?: string | null;
  fy?: string;
}) {
  const allocs = ALLOCATIONS.filter(
    (a) =>
      (!filters.schemeId || a.scheme_id === filters.schemeId) &&
      (!filters.districtLgd || a.lgd_code === filters.districtLgd) &&
      (!filters.stateLgd ||
        DISTRICTS.find((d) => d.lgd_code === a.lgd_code)?.state_lgd ===
          filters.stateLgd)
  );
  const allocated = allocs.reduce((s, a) => s + a.allocated_cr, 0);
  const released = allocs.reduce((s, a) => s + a.released_cr, 0);
  const utilized = allocs.reduce((s, a) => s + a.utilized_cr, 0);
  const utilPct = released > 0 ? (utilized / released) * 100 : 0;

  const beneficiaries = BENEFICIARIES.filter(
    (b) =>
      (!filters.schemeId || b.scheme_id === filters.schemeId) &&
      (!filters.districtLgd || b.lgd_code === filters.districtLgd) &&
      (!filters.stateLgd ||
        DISTRICTS.find((d) => d.lgd_code === b.lgd_code)?.state_lgd ===
          filters.stateLgd)
  );
  const totalBeneficiaries = beneficiaries.reduce(
    (s, b) => s + b.beneficiaries_total,
    0
  );
  const women = beneficiaries.reduce((s, b) => s + b.beneficiaries_women, 0);
  const scSt = beneficiaries.reduce((s, b) => s + b.beneficiaries_sc_st, 0);
  const targetUnits = beneficiaries.reduce((s, b) => s + b.target_units, 0);
  const achievedUnits = beneficiaries.reduce((s, b) => s + b.achieved_units, 0);

  const anomalies = ANOMALIES.filter(
    (a) =>
      (!filters.districtLgd || a.lgd_code === filters.districtLgd) &&
      (!filters.stateLgd ||
        DISTRICTS.find((d) => d.lgd_code === a.lgd_code)?.state_lgd ===
          filters.stateLgd)
  );
  const criticalCount = anomalies.filter(
    (a) => a.severity === "CRITICAL" && a.status === "OPEN"
  ).length;

  return {
    allocated,
    released,
    utilized,
    utilizationPct: utilPct,
    beneficiaries: totalBeneficiaries,
    womenPct: totalBeneficiaries > 0 ? (women / totalBeneficiaries) * 100 : 0,
    scStPct: totalBeneficiaries > 0 ? (scSt / totalBeneficiaries) * 100 : 0,
    activeWorks: achievedUnits,
    targetUnits,
    achievementPct: targetUnits > 0 ? (achievedUnits / targetUnits) * 100 : 0,
    criticalAnomalies: criticalCount,
    totalAnomalies: anomalies.filter((a) => a.status === "OPEN").length,
  };
}

// ---------- NL Query mock orchestrator ----------

export interface NlQuerySample {
  id: string;
  prompt: string;
  category: string;
}

export const NL_PRESETS: NlQuerySample[] = [
  {
    id: "preset-1",
    prompt:
      "Show districts in Bihar where MGNREGA fund utilization is under 50% despite high person-day demand",
    category: "Underutilization",
  },
  {
    id: "preset-2",
    prompt:
      "Compare PMAY-G vs MGNREGA in tribal districts of Odisha for FY 2025-26",
    category: "Convergence",
  },
  {
    id: "preset-3",
    prompt: "Which blocks in Gorakhpur have stalled PMAY-G construction over 45 days?",
    category: "Stalling",
  },
  {
    id: "preset-4",
    prompt:
      "List districts where PM-KISAN disbursement exceeds 90% but asset creation is below state median",
    category: "Divergence",
  },
  {
    id: "preset-5",
    prompt: "Top 10 districts by MGNREGA person-days generated in Q3 FY 2025-26",
    category: "Ranking",
  },
];

export interface NlQueryResponse {
  query_id: string;
  execution_time_ms: number;
  synthesized_response: string;
  generated_sql: string;
  evidence_provenance: {
    source_tables: string[];
    data_freshness: string;
    citations: {
      district_lgd: number;
      district_name: string;
      utilization_rate: string;
      source_id: string;
    }[];
  };
  visualization_recommendation: {
    type: "bar_horizontal" | "bar_vertical" | "line" | "heatmap";
    x_axis: string;
    y_axis: string;
  };
  rows: Record<string, string | number>[];
}

export function mockOrchestrate(prompt: string): NlQueryResponse {
  const p = prompt.toLowerCase();
  if (p.includes("bihar") || p.includes("underutil")) {
    return {
      query_id: `qry_${Date.now().toString(36)}`,
      execution_time_ms: 142,
      synthesized_response:
        "Identified 3 districts in Bihar (Araria, Kishanganj, Purnia) exhibiting severe fund utilization lags (<50%) despite generating over 2.5 million person-days of labor demand in FY 2025-26. Araria leads with 38.2% utilization — the lowest decile statewide.",
      generated_sql: `SELECT g.entity_name AS district_name,
       a.allocated_cr,
       a.released_cr,
       ROUND((a.utilized_cr / NULLIF(a.released_cr, 0)) * 100, 2) AS utilization_rate,
       b.achieved_units AS person_days
FROM fact_scheme_allocations a
JOIN dim_lgd_geography g ON a.lgd_code = g.lgd_code
JOIN fact_scheme_beneficiaries_agg b
  ON a.scheme_id = b.scheme_id AND a.lgd_code = b.lgd_code
WHERE g.state_lgd = 10
  AND a.scheme_id = 'sch-mgnrega'
  AND a.financial_year = '2025-2026'
  AND (a.utilized_cr / NULLIF(a.released_cr, 0)) < 0.50
ORDER BY utilization_rate ASC
LIMIT 100;`,
      evidence_provenance: {
        source_tables: [
          "fact_scheme_allocations",
          "fact_scheme_beneficiaries_agg",
          "dim_lgd_geography",
        ],
        data_freshness: "2026-03-31T20:30:00Z",
        citations: [
          { district_lgd: 216, district_name: "Araria", utilization_rate: "38.2%", source_id: "alloc_row_9812" },
          { district_lgd: 222, district_name: "Kishanganj", utilization_rate: "41.6%", source_id: "alloc_row_9815" },
          { district_lgd: 230, district_name: "Purnia", utilization_rate: "46.9%", source_id: "alloc_row_9821" },
        ],
      },
      visualization_recommendation: {
        type: "bar_horizontal",
        x_axis: "utilization_rate",
        y_axis: "district_name",
      },
      rows: [
        { district: "Araria", utilization_rate: 38.2, allocated_cr: 84.3, person_days: 942000 },
        { district: "Kishanganj", utilization_rate: 41.6, allocated_cr: 78.5, person_days: 718000 },
        { district: "Purnia", utilization_rate: 46.9, allocated_cr: 91.2, person_days: 886000 },
      ],
    };
  }
  if (p.includes("pmay") || p.includes("gorakhpur") || p.includes("stall")) {
    return {
      query_id: `qry_${Date.now().toString(36)}`,
      execution_time_ms: 96,
      synthesized_response:
        "PMAY-G construction has stalled in 3 blocks within Gorakhpur district: Bansgaon (47 days), Kauriram (51 days), and Gagaha (49 days). 1,420 sanctioned houses are affected with ₹18.4 Cr in released funds awaiting milestone verification.",
      generated_sql: `SELECT g.entity_name AS district_name,
       b.entity_name AS block_name,
       COUNT(*) AS sanctioned_houses,
       MAX(p.last_update) AS last_progress_date,
       DATE_PART('day', NOW() - MAX(p.last_update)) AS days_stalled
FROM pmay_g_progress p
JOIN dim_lgd_geography g ON p.district_lgd = g.lgd_code
JOIN dim_lgd_geography b ON p.block_lgd = b.lgd_code
WHERE p.district_lgd = 463
  AND DATE_PART('day', NOW() - p.last_update) > 45
GROUP BY g.entity_name, b.entity_name
ORDER BY days_stalled DESC
LIMIT 100;`,
      evidence_provenance: {
        source_tables: ["pmay_g_progress", "dim_lgd_geography"],
        data_freshness: "2026-03-31T20:30:00Z",
        citations: [
          { district_lgd: 463, district_name: "Gorakhpur", utilization_rate: "47d stall", source_id: "pmay_row_4218" },
        ],
      },
      visualization_recommendation: {
        type: "bar_vertical",
        x_axis: "block_name",
        y_axis: "days_stalled",
      },
      rows: [
        { block: "Kauriram", days_stalled: 51, sanctioned_houses: 480 },
        { block: "Gagaha", days_stalled: 49, sanctioned_houses: 412 },
        { block: "Bansgaon", days_stalled: 47, sanctioned_houses: 528 },
      ],
    };
  }
  // default: ranking
  return {
    query_id: `qry_${Date.now().toString(36)}`,
    execution_time_ms: 178,
    synthesized_response:
      "Top districts by MGNREGA person-days generated in Q3 FY 2025-26 are led by Mayurbhanj (1.4M person-days) followed by Sundargarh (1.2M) and Koraput (1.1M). These districts correspond to tribal-belt regions with high work demand and historically robust panchayat-level execution.",
    generated_sql: `SELECT g.entity_name AS district_name,
       g.state_lgd,
       SUM(b.achieved_units) AS person_days,
       SUM(b.beneficiaries_sc_st) AS tribal_beneficiaries
FROM fact_scheme_beneficiaries_agg b
JOIN dim_lgd_geography g ON b.lgd_code = g.lgd_code
WHERE b.scheme_id = 'sch-mgnrega'
  AND b.reporting_month BETWEEN '2026-01-01' AND '2026-03-31'
GROUP BY g.entity_name, g.state_lgd
ORDER BY person_days DESC
LIMIT 10;`,
    evidence_provenance: {
      source_tables: ["fact_scheme_beneficiaries_agg", "dim_lgd_geography"],
      data_freshness: "2026-03-31T20:30:00Z",
      citations: [
        { district_lgd: 369, district_name: "Mayurbhanj", utilization_rate: "1.4M PD", source_id: "ben_row_3210" },
        { district_lgd: 370, district_name: "Sundargarh", utilization_rate: "1.2M PD", source_id: "ben_row_3214" },
        { district_lgd: 382, district_name: "Koraput", utilization_rate: "1.1M PD", source_id: "ben_row_3222" },
      ],
    },
    visualization_recommendation: {
      type: "bar_horizontal",
      x_axis: "person_days",
      y_axis: "district_name",
    },
    rows: [
      { district: "Mayurbhanj", person_days: 1420000, tribal_beneficiaries: 48000 },
      { district: "Sundargarh", person_days: 1210000, tribal_beneficiaries: 38000 },
      { district: "Koraput", person_days: 1100000, tribal_beneficiaries: 42000 },
      { district: "Rayagada", person_days: 920000, tribal_beneficiaries: 31000 },
      { district: "Kalahandi", person_days: 880000, tribal_beneficiaries: 29000 },
    ],
  };
}

// ---------- AI Insight Cards ----------

export const AI_INSIGHTS = [
  {
    id: "insight-1",
    type: "OVERLAP" as const,
    title: "PMAY-G construction delayed in 14 blocks",
    detail:
      "Timber transport embargo across Bansgaon, Kauriram and 12 adjacent blocks has stalled 1,420 sanctioned houses — overlap with high MGNREGA wage disbursement in the same LGD blocks.",
    severity: "warning" as const,
    affectedSchemes: ["PMAY-G", "MGNREGA"],
    districts: 14,
  },
  {
    id: "insight-2",
    type: "GAP" as const,
    title: "32,000 PM-KISAN landholders missing MGNREGA linkages",
    detail:
      "Bundelkhand-pattern convergence gap detected: PM-KISAN beneficiaries in Darbhanga region lack MGNREGA job card linkages despite agricultural off-season work demand.",
    severity: "warning" as const,
    affectedSchemes: ["PM-KISAN", "MGNREGA"],
    districts: 3,
  },
  {
    id: "insight-3",
    type: "VELOCITY" as const,
    title: "MGNREGA fund utilization surging 4× faster than asset validation",
    detail:
      "Jalpaiguri district fund flow velocity (4.1×) far exceeds physical asset verification (1.0×) — potential ghost-works risk requiring Block Development Officer audit.",
    severity: "critical" as const,
    affectedSchemes: ["MGNREGA"],
    districts: 1,
  },
];

// ---------- Audit Query History ----------

export const QUERY_HISTORY = [
  {
    id: "qry_99a8b7c6",
    prompt:
      "Which districts in Bihar show fund utilization under 50% for MGNREGA despite high demand?",
    timestamp: "2026-03-31 14:22",
    latency_ms: 142,
    role: "central_executive",
  },
  {
    id: "qry_b1c2d3e4",
    prompt: "Compare PMAY-G vs MGNREGA in tribal districts of Odisha for FY 2025-26",
    timestamp: "2026-03-30 11:08",
    latency_ms: 188,
    role: "auditor",
  },
  {
    id: "qry_e5f6a7b8",
    prompt: "Top 10 districts by MGNREGA person-days generated in Q3 FY 2025-26",
    timestamp: "2026-03-29 16:45",
    latency_ms: 178,
    role: "central_executive",
  },
];

// ---------- Admin data ----------

export const PIPELINE_RUNS = [
  {
    id: "pl-2026-03-31-mgnrega",
    scheme: "MGNREGA",
    source: "data.gov.in",
    schedule: "0 2 * * * (Daily 02:00 IST)",
    status: "SUCCESS" as const,
    recordsIngested: 12480,
    lastRun: "2026-03-31 02:00",
    durationSec: 412,
  },
  {
    id: "pl-2026-03-31-pmkisan",
    scheme: "PM-KISAN",
    source: "data.gov.in",
    schedule: "0 2 * * * (Daily 02:00 IST)",
    status: "SUCCESS" as const,
    recordsIngested: 8421,
    lastRun: "2026-03-31 02:00",
    durationSec: 308,
  },
  {
    id: "pl-2026-03-31-pmayg",
    scheme: "PMAY-G",
    source: "data.gov.in",
    schedule: "0 2 * * * (Daily 02:00 IST)",
    status: "PARTIAL" as const,
    recordsIngested: 5210,
    lastRun: "2026-03-31 02:00",
    durationSec: 720,
  },
  {
    id: "anomaly-weekly",
    scheme: "CROSS_SCHEME",
    source: "sp_detect_governance_anomalies()",
    schedule: "0 4 * * 1 (Weekly Mon 04:00 IST)",
    status: "SUCCESS" as const,
    recordsIngested: 47,
    lastRun: "2026-03-31 04:00",
    durationSec: 1240,
  },
];

export const PROVISIONED_USERS = [
  {
    id: "usr_001",
    name: "Sh. Rajesh Kumar Singh",
    email: "r.kumar@cabsec.gov.in",
    role: "central_executive",
    ministry: "Cabinet Secretariat",
    lgdScope: "Pan-India",
    lastActive: "2026-03-31 14:22",
    status: "ACTIVE",
  },
  {
    id: "usr_002",
    name: "Smt. Anjali Mehta, IAS",
    email: "anjali.dm-gorakhpur@up.gov.in",
    role: "district_magistrate",
    ministry: "Government of UP",
    lgdScope: "DISTRICT_463 (Gorakhpur)",
    lastActive: "2026-03-31 09:48",
    status: "ACTIVE",
  },
  {
    id: "usr_003",
    name: "Dr. Vikram Nair",
    email: "v.nair@mord.gov.in",
    role: "dept_nodal",
    ministry: "Ministry of Rural Development",
    lgdScope: "Ministry-Scoped (MoRD)",
    lastActive: "2026-03-30 18:11",
    status: "ACTIVE",
  },
  {
    id: "usr_004",
    name: "Prof. Priya Iyer",
    email: "p.iyer@cag.gov.in",
    role: "auditor",
    ministry: "Comptroller & Auditor General",
    lgdScope: "Anonymized Pan-India",
    lastActive: "2026-03-29 11:32",
    status: "ACTIVE",
  },
  {
    id: "usr_005",
    name: "Sh. Arjun Reddy",
    email: "arjun.nic@gov.in",
    role: "super_admin",
    ministry: "NIC Platform Engineering",
    lgdScope: "Global System",
    lastActive: "2026-03-31 15:50",
    status: "ACTIVE",
  },
  {
    id: "usr_006",
    name: "Smt. Lakshmi Pillai",
    email: "l.pillai@moa.gov.in",
    role: "dept_nodal",
    ministry: "Ministry of Agriculture",
    lgdScope: "Ministry-Scoped (MoA)",
    lastActive: "2026-03-28 10:14",
    status: "SUSPENDED",
  },
];

export const AUDIT_LOG = [
  { id: "log-1", ts: "2026-03-31 15:50", actor: "arjun.nic", action: "PIPELINE_RETRY", target: "pl-2026-03-31-pmayg" },
  { id: "log-2", ts: "2026-03-31 14:22", actor: "r.kumar@cabsec", action: "NL_QUERY_EXEC", target: "qry_99a8b7c6" },
  { id: "log-3", ts: "2026-03-31 09:48", actor: "anjali.dm-gkp", action: "ANOMALY_ACK", target: "anom-001" },
  { id: "log-4", ts: "2026-03-30 18:11", actor: "v.nair@mord", action: "EXPORT_CSV", target: "convergence_matrix_export" },
  { id: "log-5", ts: "2026-03-30 11:08", actor: "p.iyer@cag", action: "NL_QUERY_EXEC", target: "qry_b1c2d3e4" },
];

export function fmtCr(n: number): string {
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(2)}K Cr`;
  return `₹ ${n.toFixed(1)} Cr`;
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
