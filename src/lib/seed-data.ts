/**
 * Samanvay Intelligence — Seed Source Data
 * Pure data export (no runtime logic) used by both:
 *   - scripts/seed.ts (server-side DB seeding)
 *   - src/lib/data.ts (client-side fallback / type definitions)
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

export interface LgdEntity {
  lgd_code: number;
  entity_level: "STATE" | "DISTRICT" | "BLOCK";
  entity_name: string;
  parent_lgd: number | null;
  state_lgd: number;
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

// ---------- NL Query presets ----------

export interface NlQuerySample {
  id: string;
  prompt: string;
  category: string;
}

export const NL_PRESETS: NlQuerySample[] = [
  { id: "preset-1", prompt: "Show districts in Bihar where MGNREGA fund utilization is under 50% despite high person-day demand", category: "Underutilization" },
  { id: "preset-2", prompt: "Compare PMAY-G vs MGNREGA in tribal districts of Odisha for FY 2025-26", category: "Convergence" },
  { id: "preset-3", prompt: "Which blocks in Gorakhpur have stalled PMAY-G construction over 45 days?", category: "Stalling" },
  { id: "preset-4", prompt: "List districts where PM-KISAN disbursement exceeds 90% but asset creation is below state median", category: "Divergence" },
  { id: "preset-5", prompt: "Top 10 districts by MGNREGA person-days generated in Q3 FY 2025-26", category: "Ranking" },
];

// ---------- AI Insight Cards (static nightly-pipeline output) ----------

export const AI_INSIGHTS = [
  {
    id: "insight-1",
    type: "OVERLAP" as const,
    title: "PMAY-G construction delayed in 14 blocks",
    detail: "Timber transport embargo across Bansgaon, Kauriram and 12 adjacent blocks has stalled 1,420 sanctioned houses — overlap with high MGNREGA wage disbursement in the same LGD blocks.",
    severity: "warning" as const,
    affectedSchemes: ["PMAY-G", "MGNREGA"],
    districts: 14,
  },
  {
    id: "insight-2",
    type: "GAP" as const,
    title: "32,000 PM-KISAN landholders missing MGNREGA linkages",
    detail: "Bundelkhand-pattern convergence gap detected: PM-KISAN beneficiaries in Darbhanga region lack MGNREGA job card linkages despite agricultural off-season work demand.",
    severity: "warning" as const,
    affectedSchemes: ["PM-KISAN", "MGNREGA"],
    districts: 3,
  },
  {
    id: "insight-3",
    type: "VELOCITY" as const,
    title: "MGNREGA fund utilization surging 4× faster than asset validation",
    detail: "Jalpaiguri district fund flow velocity (4.1×) far exceeds physical asset verification (1.0×) — potential ghost-works risk requiring Block Development Officer audit.",
    severity: "critical" as const,
    affectedSchemes: ["MGNREGA"],
    districts: 1,
  },
];

// ---------- Formatters ----------

export function fmtCr(n: number): string {
  if (n >= 1000) return `₹ ${(n / 1000).toFixed(2)}K Cr`;
  return `₹ ${n.toFixed(1)} Cr`;
}

export function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}
