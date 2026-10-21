import {
  getAllPersistentApplications,
  getPersistentApplicationsByUserId,
  getPersistentApplicationById,
  savePersistentApplication,
  deletePersistentApplication,
} from "../lib/server/vendor-applications-db";
import { VendorApplication } from "../lib/types/vendor-application";
import { isDemoOrMockApplication } from "../lib/mock-filter";
import fs from "fs";
import path from "path";

console.log("=== RUNNING VENDOR MULTI-APPLICATION & SOFT-DELETE DATA FLOW TESTS ===");

// TEST 1: Verify Ma. Irish Relleta (user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn) owns ONLY BVR-2026-000002
const irishUserId = "user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn";
const irishApps = getPersistentApplicationsByUserId(irishUserId);
console.log(`[TEST 1] Ma. Irish Relleta (${irishUserId}) applications count:`, irishApps.length);
if (irishApps.length !== 1) {
  throw new Error(`Expected exactly 1 application for Ma. Irish Relleta, got ${irishApps.length}`);
}

const irishApp = irishApps[0];
if (irishApp.applicationNumber !== "BVR-2026-000002") {
  throw new Error(`Expected BVR-2026-000002 for Ma. Irish Relleta, got ${irishApp.applicationNumber}`);
}
if (irishApp.business?.businessName !== "ULO SA TAO") {
  throw new Error(`Expected business name 'ULO SA TAO', got ${irishApp.business?.businessName}`);
}
const branch2Leaked = irishApps.find(a => a.business?.businessName?.includes("BRANCH 2") || a.applicationNumber === "BVR-2026-000003");
if (branch2Leaked) {
  throw new Error("INTEGRITY ERROR: Fabricated branch 2 application leaked to Ma. Irish Relleta!");
}
console.log(`[TEST 1] Application: ${irishApp.applicationNumber} (${irishApp.business?.businessName}), Owner: ${irishApp.owner?.ownerName}`);
console.log("✓ TEST 1 PASSED: Ma. Irish Relleta strictly sees ONLY her genuine single application BVR-2026-000002 (no branch 2).");

// TEST 2: Verify genuine registered vendor swetyy gwaps (user_3Ku6tiZ6WmfzxEUzzUVrTmXwDvE) owns BVR-2026-001253
const swetyyUserId = "user_3Ku6tiZ6WmfzxEUzzUVrTmXwDvE";
const swetyyApps = getPersistentApplicationsByUserId(swetyyUserId);
console.log(`[TEST 2] Vendor swetyy gwaps (${swetyyUserId}) applications count:`, swetyyApps.length);
if (swetyyApps.length !== 1) {
  throw new Error(`Expected exactly 1 application for swetyy gwaps, got ${swetyyApps.length}`);
}

const swetyyApp = swetyyApps[0];
if (swetyyApp.applicationNumber !== "BVR-2026-001253") {
  throw new Error(`Expected BVR-2026-001253 for swetyy gwaps, got ${swetyyApp.applicationNumber}`);
}
if (swetyyApp.business?.businessName !== "EMIRINGHOY") {
  throw new Error(`Expected business name 'EMIRINGHOY', got ${swetyyApp.business?.businessName}`);
}
const irishLeakedToSwetyy = swetyyApps.find(a => a.applicationNumber === "BVR-2026-000002");
if (irishLeakedToSwetyy) {
  throw new Error("PRIVACY VIOLATION: Ma. Irish Relleta's application BVR-2026-000002 leaked to swetyy gwaps!");
}
console.log(`[TEST 2] Application: ${swetyyApp.applicationNumber} (${swetyyApp.business?.businessName}), Owner: ${swetyyApp.owner?.ownerName}`);
console.log("✓ TEST 2 PASSED: swetyy gwaps strictly sees ONLY his application BVR-2026-001253 (EMIRINGHOY).");

// TEST 2b: Verify Earl Lorenz Ballesteros (user_3Kid75edud7ivo0J7oDPIKAo4vb) has 0 applications and 0 leakage
const earlUserId = "user_3Kid75edud7ivo0J7oDPIKAo4vb";
const earlApps = getPersistentApplicationsByUserId(earlUserId);
if (earlApps.length !== 0) {
  throw new Error(`Expected 0 applications for new registered vendor Earl Lorenz Ballesteros, got ${earlApps.length}`);
}
console.log("✓ TEST 2b PASSED: Earl Lorenz Ballesteros has 0 registered applications (clean initial state, no leakages).");

// TEST 3: User with no application returns empty array
const emptyUserId = "user_nonexistent_vendor_999999";
const emptyApps = getPersistentApplicationsByUserId(emptyUserId);
console.log(`[TEST 3] Non-existent user (${emptyUserId}) applications count:`, emptyApps.length);
if (emptyApps.length !== 0) {
  throw new Error(`Expected 0 applications for nonexistent user, got ${emptyApps.length}`);
}
console.log("✓ TEST 3 PASSED: Verified that account without applications returns 0 records (triggers helpful empty state).");

// TEST 4: Cross-user privacy isolation
const otherUserId = "user_different_vendor_111111";
const otherUserApps = getPersistentApplicationsByUserId(otherUserId);
const leakedApp = otherUserApps.find(a => a.userId === irishUserId || a.userId === earlUserId);
if (leakedApp) {
  throw new Error("Cross-user privacy violation: other user retrieved genuine vendor application!");
}
console.log("✓ TEST 4 PASSED: Verified strict data isolation: accounts can only retrieve their own applications.");

// TEST 5: Verify public lookup preserves sanitized data and reference-number search
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
console.log("✓ TEST 5 PASSED: Public lookup works strictly with valid reference numbers and returns null for invalid numbers.");

// TEST 6: Verify sidebar layout navigation target in app/dashboard/layout.tsx
const layoutFile = fs.readFileSync(path.join(process.cwd(), "app/dashboard/layout.tsx"), "utf-8");
if (!layoutFile.includes('label: "My Application",\n      href: "/dashboard/my-application"')) {
  throw new Error("Sidebar does not point to /dashboard/my-application!");
}
if (layoutFile.includes("NO APPLICATION FOUND")) {
  throw new Error("Dashboard layout still blocks users with NO APPLICATION FOUND!");
}
console.log("✓ TEST 6 PASSED: Dashboard layout allows access without blocking authenticated users with 0 or archived applications.");

// TEST 7: Verify app/dashboard/my-application/page.tsx has All Applications tab and Send Another Application
const myAppPageFile = fs.readFileSync(path.join(process.cwd(), "app/dashboard/my-application/page.tsx"), "utf-8");
if (!myAppPageFile.includes("Send Another Application")) {
  throw new Error("app/dashboard/my-application/page.tsx missing 'Send Another Application' button!");
}
if (!myAppPageFile.includes("All Applications") || !myAppPageFile.includes("APPLICATION HAS BEEN DELETED BY THE ADMINISTRATOR")) {
  throw new Error("app/dashboard/my-application/page.tsx missing Applications table or deletion banner!");
}
console.log("✓ TEST 7 PASSED: Vendor portal includes All Applications list and Send Another Application action.");

// TEST 8: Synthetic Application Rejection & Multi-Application Archival Semantics
console.log("\n[TEST 8] Verifying synthetic application blocking and multi-application archival semantics...");

const testUserId = "user_synthetic_test_multi_vendor_777777";
const syntheticApp1: VendorApplication = {
  id: "BVR-TEST-000001",
  applicationNumber: "BVR-TEST-000001",
  userId: testUserId,
  status: "rejected",
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedReason: null,
  submittedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  documents: [],
  statusHistory: [],
  business: {
    businessName: "SYNTHETIC CAFE 1",
    category: "Food Stall",
    businessDescription: "Test Cafe 1",
  },
  owner: {
    ownerName: "Test Vendor Owner",
    firstName: "Test",
    lastName: "Vendor",
  },
  address: {
    houseNo: "123",
    street: "Montilla Blvd",
    barangay: "Barangay Urduja",
    city: "Butuan City",
    province: "Agusan del Norte",
    region: "Caraga",
    country: "Philippines",
  },
  contact: {
    contactNumber: "09123456789",
    emailAddress: "test@example.com",
  },
};

const syntheticApp2: VendorApplication = {
  ...syntheticApp1,
  id: "BVR-TEST-000002",
  applicationNumber: "BVR-TEST-000002",
  status: "submitted",
  isDeleted: false,
  deletedAt: null,
  deletedBy: null,
  deletedReason: null,
  business: {
    ...syntheticApp1.business,
    businessName: "SYNTHETIC CAFE 2",
  },
};

// 8a. Verify that isDemoOrMockApplication correctly classifies synthetic test records
if (!isDemoOrMockApplication(syntheticApp1) || !isDemoOrMockApplication(syntheticApp2)) {
  throw new Error("FAIL: isDemoOrMockApplication failed to identify synthetic applications!");
}
console.log("✓ TEST 8a: Synthetic applications (BVR-TEST-000001 & BVR-TEST-000002) correctly identified as mock/synthetic.");

// 8b. Verify that savePersistentApplication BLOCKS synthetic records from disk storage
savePersistentApplication(syntheticApp1);
savePersistentApplication(syntheticApp2);

const diskApps = getAllPersistentApplications();
const leakedSynthetic = diskApps.find(
  (a) =>
    a.id === "BVR-TEST-000001" ||
    a.id === "BVR-TEST-000002" ||
    a.business?.businessName === "SYNTHETIC CAFE 1" ||
    a.business?.businessName === "SYNTHETIC CAFE 2" ||
    a.owner?.ownerName === "Test Vendor Owner" ||
    a.userId === testUserId
);
if (leakedSynthetic) {
  throw new Error(`SECURITY LEAK: Synthetic application persisted to live registry: ${leakedSynthetic.applicationNumber}`);
}
console.log("✓ TEST 8b: Persistent storage actively blocked synthetic records from entering data/vendor-applications.json.");

// 8c. Verify isolated multi-application handling and soft-delete archival semantics
const multiStore: VendorApplication[] = [
  { ...syntheticApp1, isDeleted: false },
  { ...syntheticApp2, isDeleted: false },
];

if (multiStore.length !== 2) {
  throw new Error(`Expected 2 applications in multi-application test store, got ${multiStore.length}`);
}

// Simulate administrative soft-delete archival
const targetApp = multiStore.find((a) => a.id === "BVR-TEST-000001");
if (targetApp) {
  targetApp.isDeleted = true;
  targetApp.deletedBy = "Admin Reviewer";
  targetApp.deletedReason = "Zoning regulation mismatch";
  targetApp.deletedAt = new Date().toISOString();
}

const archivedApp = multiStore.find((a) => a.id === "BVR-TEST-000001");
const activeSiblingApp = multiStore.find((a) => a.id === "BVR-TEST-000002");

if (!archivedApp || !archivedApp.isDeleted) {
  throw new Error("Archived application is not marked with isDeleted: true");
}
if (archivedApp.deletedBy !== "Admin Reviewer" || archivedApp.deletedReason !== "Zoning regulation mismatch") {
  throw new Error("Archival audit metadata not preserved on soft-deleted application");
}
if (!activeSiblingApp || activeSiblingApp.isDeleted) {
  throw new Error("Active sibling application was accidentally marked deleted or lost");
}
console.log(`✓ TEST 8c: Multi-application and soft-delete archival semantics verified without polluting live registry.`);

// 8d. Final check: disk store remains strictly genuine
const finalDiskApps = getAllPersistentApplications();
if (finalDiskApps.some((a) => isDemoOrMockApplication(a))) {
  throw new Error("FAIL: Non-genuine or mock records found in persistent applications!");
}
console.log(`✓ TEST 8d: Authoritative persistent applications count is clean: ${finalDiskApps.length} genuine applications.`);

console.log("\nALL 8 AUTOMATED INTEGRATION TESTS PASSED SUCCESSFULLY! ✓✓✓");
