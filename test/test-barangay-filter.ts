import assert from "assert";
import {
  BUTUAN_BARANGAYS,
  BARANGAY_OPTIONS,
  isBarangayMatch,
  canonicalBarangayKey,
} from "../lib/barangays";
import { BARANGAY_OPTIONS as RE_EXPORTED_OPTIONS } from "../lib/admin-applications-data";
import { getAllPersistentApplications } from "../lib/server/vendor-applications-db";

console.log("=== RUNNING BUTUAN CITY OFFICIAL BARANGAY FILTER TESTS ===");

// ─── TEST 1: Exactly 86 Official Barangays & Unique Options ──────────────────
console.log(`[TEST 1] BUTUAN_BARANGAYS count: ${BUTUAN_BARANGAYS.length}`);
assert.strictEqual(BUTUAN_BARANGAYS.length, 86, "Must contain exactly 86 official barangays of Butuan City");

const uniqueSet = new Set(BUTUAN_BARANGAYS);
assert.strictEqual(uniqueSet.size, 86, "Every barangay in BUTUAN_BARANGAYS must be unique");

assert.strictEqual(BARANGAY_OPTIONS.length, 87, "BARANGAY_OPTIONS must have 87 options (All Barangays + 86)");
assert.strictEqual(BARANGAY_OPTIONS[0], "All Barangays", "First option must be 'All Barangays'");
assert.strictEqual(RE_EXPORTED_OPTIONS.length, 87, "Re-exported options must match");

// Verify alphabetical order of the 86 barangays
for (let i = 0; i < BUTUAN_BARANGAYS.length - 1; i++) {
  const current = BUTUAN_BARANGAYS[i];
  const next = BUTUAN_BARANGAYS[i + 1];
  assert(
    current.localeCompare(next) <= 0,
    `Barangays must be sorted alphabetically: "${current}" should come before "${next}"`
  );
}
console.log("✓ TEST 1 PASSED: Exactly 86 official barangays present once and sorted alphabetically.");

// ─── TEST 2: Official Spelling, Accents, and Suffixes ────────────────────────
const keyChecklist = [
  "Ampayon",
  "Bancasi",
  "Libertad",
  "San Vicente",
  "Agusan Pequeño",
  "Santo Niño",
  "Holy Redeemer Pob.",
  "Urduja Pob.",
  "Baan KM 3",
  "Lapu-lapu Pob.",
  "Nong-nong",
];

keyChecklist.forEach((name) => {
  assert(
    BUTUAN_BARANGAYS.includes(name as any),
    `Official barangay "${name}" must be present with exact spelling/accents/suffixes`
  );
});
console.log("✓ TEST 2 PASSED: Verified official spelling, accents (Pequeño, Niño), and Pob. suffixes.");

// ─── TEST 3: Barangay Matching & Legacy Naming Variation Normalization ──────
// 3a. Exact matches
assert.strictEqual(isBarangayMatch("Ampayon", "Ampayon"), true, "Exact match for Ampayon");
assert.strictEqual(isBarangayMatch("Bancasi", "Bancasi"), true, "Exact match for Bancasi");
assert.strictEqual(isBarangayMatch("Libertad", "Libertad"), true, "Exact match for Libertad");
assert.strictEqual(isBarangayMatch("San Vicente", "San Vicente"), true, "Exact match for San Vicente");

// 3b. "All Barangays" default restores all
assert.strictEqual(isBarangayMatch("Ampayon", "All Barangays"), true, "All Barangays matches any record");
assert.strictEqual(isBarangayMatch(null, "All Barangays"), true, "All Barangays matches null barangay");
assert.strictEqual(isBarangayMatch(undefined, "All Barangays"), true, "All Barangays matches undefined barangay");

// 3c. Missing or unrecognized barangay handling
assert.strictEqual(isBarangayMatch("", "Ampayon"), false, "Empty string does not match specific barangay");
assert.strictEqual(isBarangayMatch("   ", "Ampayon"), false, "Whitespace does not match specific barangay");
assert.strictEqual(isBarangayMatch(null, "Ampayon"), false, "Null does not match specific barangay");
assert.strictEqual(isBarangayMatch(undefined, "Ampayon"), false, "Undefined does not match specific barangay");

// 3d. Legacy prefix variations ("Barangay X", "Brgy. X")
assert.strictEqual(isBarangayMatch("Barangay Urduja", "Urduja Pob."), true, "'Barangay Urduja' matches 'Urduja Pob.'");
assert.strictEqual(isBarangayMatch("Brgy. Urduja", "Urduja Pob."), true, "'Brgy. Urduja' matches 'Urduja Pob.'");
assert.strictEqual(isBarangayMatch("Urduja", "Urduja Pob."), true, "'Urduja' matches 'Urduja Pob.'");
assert.strictEqual(isBarangayMatch("Barangay Libertad", "Libertad"), true, "'Barangay Libertad' matches 'Libertad'");
assert.strictEqual(isBarangayMatch("Brgy Ampayon", "Ampayon"), true, "'Brgy Ampayon' matches 'Ampayon'");

// 3e. Poblacion suffix variations ("Holy Redeemer" vs "Holy Redeemer Pob.")
assert.strictEqual(isBarangayMatch("Holy Redeemer", "Holy Redeemer Pob."), true, "'Holy Redeemer' matches 'Holy Redeemer Pob.'");
assert.strictEqual(isBarangayMatch("Holy Redeemer Pob.", "Holy Redeemer Pob."), true, "Exact 'Holy Redeemer Pob.' matches");
assert.strictEqual(isBarangayMatch("Agao", "Agao Pob."), true, "'Agao' matches 'Agao Pob.'");

// 3f. Accent and case insensitivity
assert.strictEqual(isBarangayMatch("Agusan Pequeno", "Agusan Pequeño"), true, "Unaccented 'Pequeno' matches 'Pequeño'");
assert.strictEqual(isBarangayMatch("SANTO NINO", "Santo Niño"), true, "Uppercase unaccented 'SANTO NINO' matches 'Santo Niño'");
assert.strictEqual(isBarangayMatch("ampayon", "Ampayon"), true, "Lowercase 'ampayon' matches 'Ampayon'");

// 3g. Non-matching barangays must NOT match
assert.strictEqual(isBarangayMatch("Bancasi", "Ampayon"), false, "Bancasi must NOT match Ampayon");
assert.strictEqual(isBarangayMatch("Libertad", "San Vicente"), false, "Libertad must NOT match San Vicente");
assert.strictEqual(isBarangayMatch("Holy Redeemer Pob.", "Urduja Pob."), false, "Holy Redeemer must NOT match Urduja");

console.log("✓ TEST 3 PASSED: Robust matching handles legacy variations without false positives.");

// ─── TEST 4: Filtering Across Real Canonical Application Records ─────────────
const apps = getAllPersistentApplications();
console.log(`[TEST 4] Total persistent applications in registry: ${apps.length}`);

// Test application BVR-2026-000002 (saved barangay: "Holy Redeemer Pob.", status: "approved", isDeleted: false)
const holyRedeemerMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Holy Redeemer Pob."));
console.log(`[TEST 4] Active Holy Redeemer applications: ${holyRedeemerMatches.length}`);
assert.strictEqual(holyRedeemerMatches.length, 1, "Expected 1 active Holy Redeemer record");
assert.strictEqual(holyRedeemerMatches[0].applicationNumber, "BVR-2026-000002");

// Test active application BVR-2026-001253 in Ambago
const ambagoMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Ambago"));
console.log(`[TEST 4] Active Ambago applications: ${ambagoMatches.length}`);
assert.strictEqual(ambagoMatches.length, 1, "Expected 1 active Ambago record");
assert.strictEqual(ambagoMatches[0].applicationNumber, "BVR-2026-001253");

// Test archived applications in Dagohoy (BVR-2026-001249 & BVR-2026-001250, isDeleted: true)
const archivedDagohoyMatches = apps.filter((a) => Boolean(a.isDeleted) && isBarangayMatch(a.address?.barangay, "Dagohoy"));
console.log(`[TEST 4] Archived Dagohoy applications: ${archivedDagohoyMatches.length}`);
assert.strictEqual(archivedDagohoyMatches.length, 2, "Expected 2 archived Dagohoy records");

// Active Urduja should be 0
const activeUrdujaMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Urduja Pob."));
assert.strictEqual(activeUrdujaMatches.length, 0, "Active Urduja must be 0");

// Other barangays in active state should return 0
const ampayonActiveMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Ampayon"));
assert.strictEqual(ampayonActiveMatches.length, 0, "Ampayon active records should be 0");

const bancasiActiveMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Bancasi"));
assert.strictEqual(bancasiActiveMatches.length, 0, "Bancasi active records should be 0");

const libertadActiveMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "Libertad"));
assert.strictEqual(libertadActiveMatches.length, 0, "Libertad active records should be 0");

const sanVicenteActiveMatches = apps.filter((a) => !a.isDeleted && isBarangayMatch(a.address?.barangay, "San Vicente"));
assert.strictEqual(sanVicenteActiveMatches.length, 0, "San Vicente active records should be 0");

console.log("✓ TEST 4 PASSED: Filter accurately segregates active and archived applications by barangay.");

// ─── TEST 5: Combined Filters (Barangay + Status + Payment + Search) ──────────
// Combined 1: Holy Redeemer + Approved + Verified + Search "ULO"
const combined1 = apps.filter((app) => {
  const matchesSearch = (app.business?.businessName || "").toLowerCase().includes("ulo");
  const matchesStatus = !app.isDeleted && app.status.toLowerCase() === "approved";
  const matchesBarangay = isBarangayMatch(app.address?.barangay, "Holy Redeemer Pob.");
  const matchesPayment = app.payment?.status?.toLowerCase() === "verified";
  return matchesSearch && matchesStatus && matchesBarangay && matchesPayment;
});
assert.strictEqual(combined1.length, 1, "Combined filter should return exactly 1 record");
assert.strictEqual(combined1[0].applicationNumber, "BVR-2026-000002");

// Combined 2: Holy Redeemer + Search "Nonexistent"
const combined2 = apps.filter((app) => {
  const matchesSearch = (app.business?.businessName || "").toLowerCase().includes("nonexistent");
  const matchesBarangay = isBarangayMatch(app.address?.barangay, "Holy Redeemer Pob.");
  return matchesSearch && matchesBarangay;
});
assert.strictEqual(combined2.length, 0, "Search mismatch must return 0");

// Combined 3: Dagohoy + Archived + Search "KAPE"
const combined3 = apps.filter((app) => {
  const matchesSearch = (app.business?.businessName || "").toLowerCase().includes("kape");
  const matchesStatus = Boolean(app.isDeleted);
  const matchesBarangay = isBarangayMatch(app.address?.barangay, "Dagohoy");
  return matchesSearch && matchesStatus && matchesBarangay;
});
assert.strictEqual(combined3.length, 1, "Combined archived Dagohoy + 'KAPE' should return 1 record");

console.log("✓ TEST 5 PASSED: Multi-filter combinations (Barangay + Status + Payment + Search) operate seamlessly.");

console.log("\nALL BUTUAN CITY BARANGAY FILTER TESTS PASSED SUCCESSFULLY! ✓✓✓");
