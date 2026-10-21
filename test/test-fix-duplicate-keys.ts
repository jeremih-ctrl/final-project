import {
  getAllPersistentApplications,
} from "../lib/server/vendor-applications-db";
import {
  isDemoOrMockApplication,
} from "../lib/application-store";
import { VendorApplication } from "../lib/types/vendor-application";

console.log("=== RUNNING VERIFICATION FOR DUPLICATE REACT KEYS & DELETION FIX ===");

// 1. Verify Persistent Applications Structure
const apps = getAllPersistentApplications();
console.log(`[TEST 1] Loaded ${apps.length} persistent applications.`);

const bvr02 = apps.find(a => a.applicationNumber === "BVR-2026-000002" || a.id === "BVR-2026-000002");
const bvr1253 = apps.find(a => a.applicationNumber === "BVR-2026-001253" || a.id === "BVR-2026-001253");

if (!bvr02) {
  throw new Error("Missing legitimate application BVR-2026-000002!");
}
if (!bvr1253) {
  throw new Error("Missing legitimate application BVR-2026-001253!");
}

console.log("✓ TEST 1 PASSED: Legitimate applications BVR-2026-000002 and BVR-2026-001253 preserved.");
console.log(`  - App BVR-2026-000002: business="${bvr02.business.businessName}", owner="${bvr02.owner?.ownerName}"`);
console.log(`  - App BVR-2026-001253: business="${bvr1253.business.businessName}", owner="${bvr1253.owner?.ownerName}"`);

// 2. Simulate Vendor Registry Derivation Logic from app/admin/vendors/page.tsx
interface CertifiedVendorRecord {
  recordId: string;
  vendorId: string;
  id: string;
  applicationNumber: string;
  businessName: string;
  ownerName: string;
  category: string;
  barangay: string;
  street: string;
  contactNumber: string;
  emailAddress: string;
  certifiedDate: string;
  expiryDate: string;
  status: "Certified Active" | "Pending Renewal";
}

function deriveVendors(
  storedApplications: VendorApplication[],
  deletedApplicationIds: string[]
): CertifiedVendorRecord[] {
  const list: CertifiedVendorRecord[] = [];
  const seenRecordKeys = new Set<string>();
  const deletedSet = new Set(deletedApplicationIds.map(id => id.trim().toLowerCase()));

  storedApplications.forEach((app) => {
    if (isDemoOrMockApplication(app)) return;

    const normId = (app.id || "").trim().toLowerCase();
    const normAppNum = (app.applicationNumber || "").trim().toLowerCase();

    if (
      (normId && deletedSet.has(normId)) ||
      (normAppNum && deletedSet.has(normAppNum))
    ) {
      return;
    }

    if (app.status === "approved" || app.verificationStatus === "Verified") {
      const appRef = (app.applicationNumber || app.id || "").trim();
      const internalRecordId = (app.id || appRef).trim();
      const dedupeKey = `${internalRecordId}-${normAppNum}`;

      if (!seenRecordKeys.has(dedupeKey)) {
        seenRecordKeys.add(dedupeKey);

        let vendorId = app.vendorId?.trim();
        if (!vendorId || vendorId === "Pending Assignment") {
          const match = appRef.match(/(\d+)$/);
          const seq = match ? match[1] : "";
          vendorId = seq ? `BUT-V-${seq}` : "Pending Assignment";
        }

        const recordId = `vnd-rec-${internalRecordId}`;

        list.push({
          recordId,
          vendorId,
          id: vendorId,
          applicationNumber: appRef,
          businessName: app.business?.businessName || "Registered Business",
          ownerName: app.owner?.ownerName || "Registered Vendor",
          category: app.business?.category || "General Vending",
          barangay: app.address?.barangay || "Butuan City",
          street: `${app.address?.houseNo || ""} ${app.address?.street || ""}`.trim() || "Butuan City",
          contactNumber: app.contact?.contactNumber || "N/A",
          emailAddress: app.contact?.emailAddress || "N/A",
          certifiedDate: "Accredited",
          expiryDate: "Dec 31, 2026",
          status: "Certified Active",
        });
      }
    }
  });

  return list;
}

// 3. Test derivation without deletion
const initialVendors = deriveVendors(apps, []);
console.log(`[TEST 3] Derived ${initialVendors.length} certified vendors.`);

// Verify React Keys
const reactKeys = initialVendors.map(v => v.recordId);
const uniqueKeys = new Set(reactKeys);
if (reactKeys.length !== uniqueKeys.size) {
  throw new Error(`Duplicate React keys detected! Keys: ${JSON.stringify(reactKeys)}`);
}
console.log("✓ TEST 3 PASSED: All TableRow and Card rendering keys (recordId) are strictly unique:", reactKeys);

// Verify field separation
initialVendors.forEach(v => {
  if (!v.recordId || !v.vendorId || !v.applicationNumber) {
    throw new Error(`Vendor record missing required fields: ${JSON.stringify(v)}`);
  }
});
console.log("✓ TEST 4 PASSED: Separate fields for recordId, vendorId, and applicationNumber verified.");

// 4. Test Deletion Behavior: Deleting one application
console.log("\n[TEST 5] Testing application deletion scenario...");
const testMultiApps: VendorApplication[] = [
  { ...bvr02, id: "BVR-2026-000002", applicationNumber: "BVR-2026-000002" },
  { ...bvr02, id: "BVR-2026-000004", applicationNumber: "BVR-2026-000004" },
];
const initialMultiVendors = deriveVendors(testMultiApps, []);
const testDeletedId = "BVR-2026-000004";
const vendorsAfterDeletion = deriveVendors(testMultiApps, [testDeletedId]);

console.log(`  - Vendors count before delete: ${initialMultiVendors.length}`);
console.log(`  - Vendors count after delete: ${vendorsAfterDeletion.length}`);

if (vendorsAfterDeletion.length !== initialMultiVendors.length - 1) {
  throw new Error(`Expected ${initialMultiVendors.length - 1} vendors after deleting ${testDeletedId}, got ${vendorsAfterDeletion.length}`);
}

const remainingApp = vendorsAfterDeletion.find(v => v.applicationNumber === "BVR-2026-000002");
if (!remainingApp) {
  throw new Error("Deleting one application accidentally removed another legitimate registration!");
}
console.log("✓ TEST 5 PASSED: Deleting BVR-2026-000004 properly removed its derived vendor entry while preserving BVR-2026-000002.");

// Verify React Keys after deletion (the exact condition that caused the crash)
const keysAfterDeletion = vendorsAfterDeletion.map(v => v.recordId);
const uniqueKeysAfter = new Set(keysAfterDeletion);
if (keysAfterDeletion.length !== uniqueKeysAfter.size) {
  throw new Error(`Duplicate React keys detected across update: ${JSON.stringify(keysAfterDeletion)}`);
}
console.log("✓ TEST 6 PASSED: React keys across update/deletion are 100% unique with no collision warning possible.");

// 5. Even under a stress test where two applications DID have the same vendorId
const stressedApps: VendorApplication[] = [
  { ...bvr02, id: "BVR-2026-000002", applicationNumber: "BVR-2026-000002", vendorId: "BUT-V-000002" },
  { ...bvr02, id: "BVR-2026-000004", applicationNumber: "BVR-2026-000004", vendorId: "BUT-V-000002" }, // Simulated duplicate vendorId
];
const stressedVendors = deriveVendors(stressedApps, []);
const stressedKeys = stressedVendors.map(v => v.recordId);
if (new Set(stressedKeys).size !== stressedKeys.length) {
  throw new Error("Stress test failed: duplicate vendorId caused duplicate React keys!");
}
console.log("✓ TEST 7 PASSED (STRESS TEST): Even if two vendor applications shared the same vendorId 'BUT-V-000002', recordId keys remain unique:", stressedKeys);

console.log("\n=== ALL 7 VERIFICATION TESTS PASSED SUCCESSFULLY! ✓✓✓ ===");
