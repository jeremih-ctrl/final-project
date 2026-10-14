import {
  getAllPersistentApplications,
  getPersistentApplicationByUserId,
  getPersistentApplicationsByUserId,
  getPersistentApplicationById,
  savePersistentApplication,
} from "../lib/server/vendor-applications-db";
import fs from "fs";
import path from "path";

console.log("=== RUNNING VENDOR APPLICATION NAVIGATION & DATA FLOW TESTS ===");

// TEST 1: Retrieve applications for existing vendor user
const existingUserId = "user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn";
const userApps = getPersistentApplicationsByUserId(existingUserId);
console.log(`[TEST 1] Existing user (${existingUserId}) applications count:`, userApps.length);
if (userApps.length !== 1) {
  throw new Error(`Expected 1 application for existing user, got ${userApps.length}`);
}
const primaryApp = userApps[0];
if (primaryApp.applicationNumber !== "BVR-2026-000002") {
  throw new Error(`Expected application number BVR-2026-000002, got ${primaryApp.applicationNumber}`);
}
if (primaryApp.business?.businessName !== "ULO SA TAO") {
  throw new Error(`Expected business name ULO SA TAO, got ${primaryApp.business?.businessName}`);
}
if (primaryApp.owner?.ownerName !== "Ma. Irish Relleta") {
  throw new Error(`Expected owner name Ma. Irish Relleta, got ${primaryApp.owner?.ownerName}`);
}
if (primaryApp.status !== "approved" || primaryApp.payment?.status !== "verified") {
  throw new Error(`Expected approved/verified status, got status=${primaryApp.status}, payment=${primaryApp.payment?.status}`);
}
console.log("✓ TEST 1 PASSED: Successfully retrieved genuine application for authenticated vendor user.");

// TEST 2: User with no application returns empty array
const emptyUserId = "user_nonexistent_vendor_999999";
const emptyApps = getPersistentApplicationsByUserId(emptyUserId);
console.log(`[TEST 2] Non-existent user (${emptyUserId}) applications count:`, emptyApps.length);
if (emptyApps.length !== 0) {
  throw new Error(`Expected 0 applications for nonexistent user, got ${emptyApps.length}`);
}
console.log("✓ TEST 2 PASSED: Verified that account without application returns 0 records (triggers helpful empty state).");

// TEST 3: Cross-user privacy isolation
const otherUserId = "user_different_vendor_111111";
const otherUserApps = getPersistentApplicationsByUserId(otherUserId);
const leakedApp = otherUserApps.find(a => a.userId === existingUserId);
if (leakedApp) {
  throw new Error("Cross-user privacy violation: other user retrieved existing user's application!");
}
console.log("✓ TEST 3 PASSED: Verified strict data isolation: accounts can only retrieve their own applications.");

// TEST 4: Verify public lookup preserves sanitized data and reference-number search
const publicLookupApp = getPersistentApplicationById("BVR-2026-000002");
if (!publicLookupApp) {
  throw new Error("Public lookup failed for valid application reference BVR-2026-000002");
}
if (publicLookupApp.business?.businessName !== "ULO SA TAO") {
  throw new Error("Public lookup returned incorrect business name");
}
const notFoundApp = getPersistentApplicationById("BVR-INVALID-999999");
if (notFoundApp !== null) {
  throw new Error("Public lookup should return null for invalid application reference");
}
console.log("✓ TEST 4 PASSED: Public lookup works strictly with valid reference numbers and returns null for invalid numbers.");

// TEST 5: Verify sidebar layout navigation target in app/dashboard/layout.tsx
const layoutFile = fs.readFileSync(path.join(process.cwd(), "app/dashboard/layout.tsx"), "utf-8");
if (layoutFile.includes('label: "My Application",\n      href: "/application-status"')) {
  throw new Error("Sidebar still points to /application-status!");
}
if (!layoutFile.includes('label: "My Application",\n      href: "/dashboard/my-application"')) {
  throw new Error("Sidebar does not point to /dashboard/my-application!");
}
if (layoutFile.includes('label: "My Application",\n      href: "/dashboard/my-application",\n      icon: FileText,\n      active: pathname.startsWith("/dashboard/my-application"),\n      isExternal: true')) {
  throw new Error("Sidebar My Application should not have isExternal: true!");
}
console.log("✓ TEST 5 PASSED: Sidebar My Application target is correctly configured to /dashboard/my-application without external link icon.");

// TEST 6: Verify app/dashboard/my-application/page.tsx does NOT redirect to /application-status
const myAppPageFile = fs.readFileSync(path.join(process.cwd(), "app/dashboard/my-application/page.tsx"), "utf-8");
if (myAppPageFile.includes('redirect("/application-status")')) {
  throw new Error("app/dashboard/my-application/page.tsx still contains redirect to /application-status!");
}
if (!myAppPageFile.includes("VendorMyApplicationPage") || !myAppPageFile.includes("/api/vendor/application")) {
  throw new Error("app/dashboard/my-application/page.tsx does not fetch /api/vendor/application or export VendorMyApplicationPage!");
}
console.log("✓ TEST 6 PASSED: app/dashboard/my-application/page.tsx renders authenticated application details directly.");

// TEST 7: Verify Multi-Application support with a simulated second application
const originalCount = getAllPersistentApplications().length;
const testSecondApp = {
  ...primaryApp,
  id: "BVR-2026-000003",
  applicationNumber: "BVR-2026-000003",
  userId: existingUserId,
  business: {
    ...primaryApp.business,
    businessName: "ULO SA TAO - BRANCH 2",
  },
  status: "submitted" as const,
};
savePersistentApplication(testSecondApp as any);

const multiApps = getPersistentApplicationsByUserId(existingUserId);
console.log(`[TEST 7] Multi-application user now has ${multiApps.length} applications.`);
if (multiApps.length !== 2) {
  throw new Error(`Expected 2 applications for multi-app vendor, got ${multiApps.length}`);
}
const branchApp = multiApps.find(a => a.id === "BVR-2026-000003");
if (!branchApp || branchApp.business.businessName !== "ULO SA TAO - BRANCH 2") {
  throw new Error("Second application data mismatch");
}

// Clean up second test application to preserve exact original data
const appsFile = path.join(process.cwd(), "data/vendor-applications.json");
const allApps = JSON.parse(fs.readFileSync(appsFile, "utf-8"));
const cleaned = allApps.filter((a: any) => a.id !== "BVR-2026-000003");
fs.writeFileSync(appsFile, JSON.stringify(cleaned, null, 2), "utf-8");
console.log(`[TEST 7] Restored persistent storage count to ${cleaned.length} records.`);
if (cleaned.length !== originalCount) {
  throw new Error("Failed to restore original applications count");
}
console.log("✓ TEST 7 PASSED: Multi-application vendor data query verified and original storage cleanly restored.");

console.log("\nALL 7 AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY! ✓✓✓");
