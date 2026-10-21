/**
 * Complete official list of the 86 Barangays of Butuan City, Agusan del Norte, Philippines.
 * Sourced from the official Philippine Statistics Authority (PSA)
 * Philippine Standard Geographic Code (PSGC) listing for Butuan City (1630400000).
 * Sorted alphabetically, preserving official spelling, accents, and "Pob." suffixes.
 */
export const BUTUAN_BARANGAYS = [
  "Agao Pob.",
  "Agusan Pequeño",
  "Ambago",
  "Amparo",
  "Ampayon",
  "Anticala",
  "Antongalon",
  "Aupagan",
  "Baan KM 3",
  "Baan Riverside Pob.",
  "Babag",
  "Bading Pob.",
  "Bancasi",
  "Banza",
  "Baobaoan",
  "Basag",
  "Bayanihan Pob.",
  "Bilay",
  "Bit-os",
  "Bitan-agan",
  "Bobon",
  "Bonbon",
  "Bugabus",
  "Bugsukan",
  "Buhangin Pob.",
  "Cabcabon",
  "Camayahan",
  "Dagohoy Pob.",
  "Dankias",
  "De Oro",
  "Diego Silang Pob.",
  "Don Francisco",
  "Doongan",
  "Dulag",
  "Dumalagan",
  "Florida",
  "Golden Ribbon Pob.",
  "Holy Redeemer Pob.",
  "Humabon Pob.",
  "Imadejas Pob.",
  "Jose Rizal Pob.",
  "Kinamlutan",
  "Lapu-lapu Pob.",
  "Lemon",
  "Leon Kilat Pob.",
  "Libertad",
  "Limaha Pob.",
  "Los Angeles",
  "Lumbocan",
  "Maguinda",
  "Mahay",
  "Mahogany Pob.",
  "Maibu",
  "Mandamo",
  "Manila de Bugabus",
  "Maon Pob.",
  "Masao",
  "Maug",
  "New Society Village Pob.",
  "Nong-nong",
  "Obrero Pob.",
  "Ong Yiu Pob.",
  "Pagatpatan",
  "Pangabugan",
  "Pianing",
  "Pigdaulan",
  "Pinamanculan",
  "Port Poyohon Pob.",
  "Rajah Soliman Pob.",
  "Salvacion",
  "San Ignacio Pob.",
  "San Mateo",
  "San Vicente",
  "Santo Niño",
  "Sikatuna Pob.",
  "Silongan Pob.",
  "Sumile",
  "Sumilihon",
  "Tagabaca",
  "Taguibo",
  "Taligaman",
  "Tandang Sora Pob.",
  "Tiniwisan",
  "Tungao",
  "Urduja Pob.",
  "Villa Kananga",
] as const;

export type ButuanBarangay = (typeof BUTUAN_BARANGAYS)[number];

/**
 * Filter options for dropdowns with "All Barangays" as default option,
 * followed by all 86 official barangays sorted alphabetically.
 */
export const BARANGAY_OPTIONS = [
  "All Barangays",
  ...BUTUAN_BARANGAYS,
] as const;

export type BarangayOption = (typeof BARANGAY_OPTIONS)[number];

/**
 * Normalizes a barangay string into a canonical representation for robust matching:
 * - Trims and lowercases
 * - Removes leading "Barangay " or "Brgy. " or "Brgy "
 * - Removes trailing " Pob.", " Pob", " Poblacion", " (Pob.)"
 * - Normalizes accents (e.g. ñ -> n)
 * - Normalizes known colloquial aliases (e.g. Fort Poyohon -> Port Poyohon)
 * - Removes non-alphanumeric characters (spaces, hyphens, periods)
 */
export function canonicalBarangayKey(name?: string | null): string {
  if (!name) return "";
  let s = name.trim().toLowerCase();
  // Strip common prefixes
  s = s.replace(/^(barangay|brgy\.?)\s+/i, "");
  // Strip common poblacion suffixes
  s = s.replace(/\s+(\(?pob\.?|\(?poblacion\)?)$/i, "");
  // Strip accents (NFD decomposition)
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Handle known historical/colloquial aliases
  if (s.startsWith("fort poyohon") || s.startsWith("fortpoyohon")) {
    s = s.replace(/^fort\s*poyohon/i, "portpoyohon");
  }
  // Strip all non-alphanumeric characters
  return s.replace(/[^a-z0-9]/g, "");
}

/**
 * Checks whether an application's saved barangay matches a selected filter option.
 * Correctly matches exact official names as well as common legacy naming variations
 * (e.g., "Barangay Urduja" matches "Urduja Pob.", "Holy Redeemer" matches "Holy Redeemer Pob.").
 * Safely handles missing/empty barangays by returning false unless "All Barangays" is selected.
 */
export function isBarangayMatch(
  appBarangay: string | undefined | null,
  selectedBarangay: string
): boolean {
  if (!selectedBarangay || selectedBarangay === "All Barangays" || selectedBarangay === "All") {
    return true;
  }
  if (!appBarangay || !appBarangay.trim()) {
    return false;
  }

  // 1. Direct case-insensitive match (with normalized whitespace)
  const normApp = appBarangay.trim().replace(/\s+/g, " ").toLowerCase();
  const normSel = selectedBarangay.trim().replace(/\s+/g, " ").toLowerCase();
  if (normApp === normSel) {
    return true;
  }

  // 2. Canonical key comparison (strips prefixes, Poblacion suffixes, punctuation, accents)
  const appKey = canonicalBarangayKey(appBarangay);
  const selKey = canonicalBarangayKey(selectedBarangay);

  return Boolean(appKey && selKey && appKey === selKey);
}
