import {
  getPersistentApplicationsByUserId,
  getPersistentApplicationById,
  getAllPersistentApplications,
} from "../lib/server/vendor-applications-db";

console.log("=== RUNNING VENDOR DATA-ISOLATION & PRIVACY SECURITY AUDIT ===");

const irishUserId = "user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn";
const swetyyUserId = "user_3Ku6tiZ6WmfzxEUzzUVrTmXwDvE";
const earlUserId = "user_3Kid75edud7ivo0J7oDPIKAo4vb";

// 1. Audit all persistent applications in the system
const allApps = getAllPersistentApplications();
console.log(`[AUDIT] Total persistent applications in system: ${allApps.length}`);

// Ensure BVR-2026-000002 belongs strictly to Ma. Irish Relleta
const app2 = allApps.find(a => a.applicationNumber === "BVR-2026-000002" || a.id === "BVR-2026-000002");
if (!app2) {
  throw new Error("Application BVR-2026-000002 is missing from storage!");
}
if (app2.userId !== irishUserId) {
  throw new Error(`BVR-2026-000002 ownership mismatch: expected ${irishUserId}, got ${app2.userId}`);
}
console.log(`✓ BVR-2026-000002 is verified to be owned by Ma. Irish Relleta (${app2.userId})`);

// Ensure BVR-2026-001253 belongs strictly to swetyy gwaps
const app1253 = allApps.find(a => a.applicationNumber === "BVR-2026-001253" || a.id === "BVR-2026-001253");
if (!app1253) {
  throw new Error("Application BVR-2026-001253 is missing from storage!");
}
if (app1253.userId !== swetyyUserId) {
  throw new Error(`BVR-2026-001253 ownership mismatch: expected ${swetyyUserId}, got ${app1253.userId}`);
}
console.log(`✓ BVR-2026-001253 is verified to be owned by swetyy gwaps (${app1253.userId})`);

// 2. Test querying as Ma. Irish
const irishRecords = getPersistentApplicationsByUserId(irishUserId);
console.log(`[TEST] Ma. Irish query returned ${irishRecords.length} record(s):`);
irishRecords.forEach(a => console.log(`  - Ref: ${a.applicationNumber}, Business: ${a.business?.businessName}, Owner: ${a.owner?.ownerName}`));
if (irishRecords.some(a => a.applicationNumber === "BVR-2026-001253")) {
  throw new Error("FAIL: Ma. Irish's query returned swetyy's application BVR-2026-001253!");
}
if (irishRecords.length !== 1 || irishRecords[0].applicationNumber !== "BVR-2026-000002") {
  throw new Error("FAIL: Ma. Irish's query did not return only BVR-2026-000002!");
}
console.log("✓ PASSED: Ma. Irish query returns ONLY her application BVR-2026-000002.");

// 3. Test querying as swetyy gwaps
const swetyyRecords = getPersistentApplicationsByUserId(swetyyUserId);
console.log(`[TEST] swetyy gwaps query returned ${swetyyRecords.length} record(s):`);
swetyyRecords.forEach(a => console.log(`  - Ref: ${a.applicationNumber}, Business: ${a.business?.businessName}, Owner: ${a.owner?.ownerName}`));
if (swetyyRecords.some(a => a.applicationNumber === "BVR-2026-000002")) {
  throw new Error("FAIL: swetyy's query returned Ma. Irish's application BVR-2026-000002!");
}
if (swetyyRecords.length !== 1 || swetyyRecords[0].applicationNumber !== "BVR-2026-001253") {
  throw new Error("FAIL: swetyy's query did not return only BVR-2026-001253!");
}
console.log("✓ PASSED: swetyy gwaps query returns ONLY his application BVR-2026-001253.");

// 4. Test ownership lookup logic simulating API route
function simulateApiGet(callerUserId: string, requestedAppNumber?: string) {
  const userApps = getPersistentApplicationsByUserId(callerUserId);
  if (requestedAppNumber) {
    const match = userApps.find(
      a => a.id?.toLowerCase() === requestedAppNumber.toLowerCase() ||
           a.applicationNumber?.toLowerCase() === requestedAppNumber.toLowerCase()
    );
    if (!match) {
      return { status: 404, error: "Application not found or unauthorized" };
    }
    return { status: 200, application: match };
  }
  return { status: 200, application: userApps[0] || null, applications: userApps };
}

// 4a. Ma. Irish queries without parameter -> gets BVR-2026-000002
const r1 = simulateApiGet(irishUserId);
if (r1.status !== 200 || r1.application?.applicationNumber !== "BVR-2026-000002") {
  throw new Error("FAIL: Default GET for Ma. Irish did not return BVR-2026-000002");
}

// 4b. Ma. Irish queries BVR-2026-001253 (swetyy's application) -> must return 404
const r2 = simulateApiGet(irishUserId, "BVR-2026-001253");
if (r2.status !== 404) {
  throw new Error(`FAIL: Cross-access attempt did not return 404! Returned status: ${r2.status}`);
}
console.log("✓ PASSED: Ma. Irish cannot access BVR-2026-001253 via URL parameter (returns 404).");

// 4c. swetyy gwaps queries BVR-2026-000002 (Irish's application) -> must return 404
const r3 = simulateApiGet(swetyyUserId, "BVR-2026-000002");
if (r3.status !== 404) {
  throw new Error(`FAIL: Cross-access attempt did not return 404! Returned status: ${r3.status}`);
}
console.log("✓ PASSED: swetyy gwaps cannot access BVR-2026-000002 via URL parameter (returns 404).");

// 4d. Unauthenticated or random user querying either -> must return 404
const r4 = simulateApiGet("user_random_stranger_123456", "BVR-2026-000002");
if (r4.status !== 404) {
  throw new Error("FAIL: Stranger was able to query BVR-2026-000002");
}
console.log("✓ PASSED: Unauthenticated/unauthorized users cannot access applications via URL parameter.");

console.log("\nALL PRIVACY & DATA-ISOLATION SECURITY AUDIT TESTS PASSED! ✓✓✓");
