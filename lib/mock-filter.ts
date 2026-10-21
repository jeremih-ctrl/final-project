import { VendorApplication } from "./types/vendor-application";

export const MOCK_APPLICATION_IDS = new Set([
  "bvr-2026-001248",
  "bvr-2026-001247",
  "bvr-2026-001246",
  "bvr-2026-001245",
  "bvr-2026-001244",
  "bvr-2026-001243",
  "bvr-2026-001242",
  "bvr-2026-001241",
  "bvr-2026-000003",
  "bvr-2026-001251",
  "bvr-2026-001252",
  "bvr-test-000001",
  "bvr-test-000002",
  "bvr-2026-testdel01",
  "bvr-2026-testdel02",
]);

export const MOCK_BUSINESS_NAMES = new Set([
  "montilla street produce & snacks",
  "urduja dry goods & general merchandise",
  "barangay dagohoy carinderia & catering",
  "agusan river fresh fish",
  "golden tara refreshments",
  "butuan balut & penoy express",
  "kadayawan fruit stand",
  "maningning tailoring & repair",
  "maria's sari-sari store",
  "ulo sa tao - branch 2",
  "santos native delicacies",
  "santos souvenirs & crafts",
  "synthetic cafe 1",
  "synthetic cafe 2",
  "test delete stall 1",
  "test retained stall 2",
]);

/**
 * Identify demo, mock, placeholder, synthetic, or invalid/incomplete applications.
 */
export function isDemoOrMockApplication(
  app: Partial<VendorApplication> | null | undefined
): boolean {
  if (!app) return true;

  // 1. Check Application Number or ID
  const id = (app.id || app.applicationNumber || "").trim().toLowerCase();
  if (
    !id ||
    id.startsWith("bvr-test") ||
    id.startsWith("test-") ||
    id.includes("synthetic") ||
    MOCK_APPLICATION_IDS.has(id)
  ) {
    return true;
  }

  // 2. Check Business Name
  const bName = (
    app.business?.businessName ||
    (app as unknown as { businessName?: string })?.businessName ||
    ""
  ).trim().toLowerCase();
  if (
    !bName ||
    bName.startsWith("synthetic") ||
    bName.includes("synthetic cafe") ||
    MOCK_BUSINESS_NAMES.has(bName)
  ) {
    return true;
  }

  // 3. Check Owner Name
  const oName = (
    app.owner?.ownerName ||
    (app as unknown as { ownerName?: string })?.ownerName ||
    ""
  ).trim().toLowerCase();
  if (
    !oName ||
    oName === "maria santos" ||
    oName === "test vendor owner" ||
    oName.startsWith("synthetic")
  ) {
    return true;
  }

  // 4. Check Clerk User ID
  const userId = (
    app.userId ||
    (app as unknown as { clerkUserId?: string })?.clerkUserId ||
    ""
  ).trim().toLowerCase();
  if (
    userId.startsWith("user_synthetic_") ||
    userId.startsWith("user_test_permanent_del_")
  ) {
    return true;
  }

  return false;
}
