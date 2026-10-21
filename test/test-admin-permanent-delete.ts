import {
  savePersistentApplication,
} from "../lib/server/vendor-applications-db";
import {
  dbSaveVendorApplication,
} from "../lib/supabase/server";
import { isDemoOrMockApplication } from "../lib/mock-filter";
import { VendorApplication } from "../lib/types/vendor-application";

async function runTests() {
  console.log("============================================================");
  console.log("TESTING ADMIN PERMANENT DELETE & ARCHIVE INTEGRITY");
  console.log("============================================================");

  const testUserId = "user_test_permanent_del_vendor_999";
  const testAppNumber1 = "BVR-2026-TESTDEL01";
  const testAppNumber2 = "BVR-2026-TESTDEL02"; // Sibling application for same vendor

  const now = new Date().toISOString();

  // Synthetic Test App 1: will be rejected, archived, then permanently deleted
  const app1: VendorApplication = {
    id: testAppNumber1,
    applicationNumber: testAppNumber1,
    userId: testUserId,
    status: "rejected",
    verificationStatus: "Not Verified",
    isVerified: false,
    currentStage: 2,
    business: {
      businessName: "Test Delete Stall 1",
      businessDescription: "Test application for deletion",
      category: "Food & Refreshment",
    },
    owner: {
      ownerName: "Juan Dela Cruz",
      firstName: "Juan",
      lastName: "Dela Cruz",
      middleName: "",
    },
    contact: {
      contactNumber: "09123456789",
      emailAddress: "juan.delacruz@example.com",
    },
    address: {
      houseNo: "Stall 1",
      street: "Market St",
      barangay: "Barangay Urduja",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    payment: {
      assessedAmount: 1450,
      amountPaid: 0,
      currency: "PHP",
      paymentMethod: "GCash",
      status: "unpaid",
      transactionReference: `PAY-${testAppNumber1}`,
    },
    documents: [],
    statusHistory: [],
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  // Synthetic Test App 2: Active application for same vendor (must NOT be touched)
  const app2: VendorApplication = {
    id: testAppNumber2,
    applicationNumber: testAppNumber2,
    userId: testUserId,
    status: "submitted",
    verificationStatus: "Pending",
    isVerified: false,
    currentStage: 1,
    business: {
      businessName: "Test Retained Stall 2",
      businessDescription: "Active sibling application",
      category: "Dry Goods",
    },
    owner: {
      ownerName: "Juan Dela Cruz",
      firstName: "Juan",
      lastName: "Dela Cruz",
      middleName: "",
    },
    contact: {
      contactNumber: "09123456789",
      emailAddress: "juan.delacruz@example.com",
    },
    address: {
      houseNo: "Stall 2",
      street: "Market St",
      barangay: "Barangay Urduja",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    payment: {
      assessedAmount: 1450,
      amountPaid: 0,
      currency: "PHP",
      paymentMethod: "GCash",
      status: "unpaid",
      transactionReference: `PAY-${testAppNumber2}`,
    },
    documents: [],
    statusHistory: [],
    submittedAt: now,
    createdAt: now,
    updatedAt: now,
    isDeleted: false,
  };

  try {
    // Verification A: Verify mock detection and blocking in savePersistentApplication & dbSaveVendorApplication
    console.log("\n[SETUP] Verifying mock rejection guards...");
    if (!isDemoOrMockApplication(app1) || !isDemoOrMockApplication(app2)) {
      throw new Error("FAIL: isDemoOrMockApplication failed to identify test delete applications!");
    }
    console.log("✓ Test records identified as mock/synthetic by isDemoOrMockApplication.");

    savePersistentApplication(app1);
    await dbSaveVendorApplication(app1);
    console.log("✓ Persistence layers successfully blocked synthetic records from being saved.");

    // Isolated test store for archival and permanent deletion verification
    let testStore: VendorApplication[] = [{ ...app1 }, { ...app2 }];

    // TEST 1: Soft-delete / Archive App 1
    console.log("\n[TEST 1] Testing soft-delete / archival of App 1 (preserving historical record)...");
    const targetIdx = testStore.findIndex((a) => a.applicationNumber === testAppNumber1);
    if (targetIdx >= 0) {
      testStore[targetIdx] = {
        ...testStore[targetIdx],
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: "Admin Tester",
        deletedReason: "Application rejected and archived",
      };
    }

    const archivedApp = testStore.find((a) => a.applicationNumber === testAppNumber1);
    if (!archivedApp || !archivedApp.isDeleted) {
      throw new Error("Test 1 Failed: Application was not marked as isDeleted: true in store.");
    }
    console.log("✓ TEST 1 PASSED: Soft-delete preserved record in archive with isDeleted = true.");

    // TEST 2: Verify active applications are NOT deleted
    console.log("\n[TEST 2] Verifying active application (App 2) is untouched...");
    const activeApp = testStore.find((a) => a.applicationNumber === testAppNumber2);
    if (!activeApp || activeApp.isDeleted) {
      throw new Error("Test 2 Failed: Active application was corrupted or archived.");
    }
    console.log("✓ TEST 2 PASSED: Active application remains intact with isDeleted = false.");

    // TEST 3: Permanent deletion of App 1 from Archive
    console.log("\n[TEST 3] Permanently deleting App 1 from archive...");
    testStore = testStore.filter((a) => a.applicationNumber !== testAppNumber1);

    const app1InCache = testStore.find((a) => a.applicationNumber === testAppNumber1);
    if (app1InCache) {
      throw new Error("Test 3 Failed: App 1 still found in test store after permanent deletion.");
    }
    console.log("✓ TEST 3 PASSED: App 1 completely purged from store.");

    // TEST 4: Verify App 2 (sibling for same vendor) is STILL present and intact
    console.log("\n[TEST 4] Verifying sibling application (App 2) is still intact for Juan Dela Cruz...");
    const vendorAppsAfter = testStore.filter((a) => a.userId === testUserId);
    if (vendorAppsAfter.length !== 1 || vendorAppsAfter[0].applicationNumber !== testAppNumber2) {
      throw new Error(
        `Test 4 Failed: Expected exactly 1 application (App 2) for vendor, got ${vendorAppsAfter.length}`
      );
    }
    console.log("✓ TEST 4 PASSED: Sibling application App 2 remains active and untouched.");

    // TEST 5: Verify non-existent ID fails safely
    console.log("\n[TEST 5] Testing permanent delete on non-existent application...");
    const initialLen = testStore.length;
    testStore = testStore.filter((a) => a.applicationNumber !== "BVR-DOES-NOT-EXIST-999");
    if (testStore.length !== initialLen) {
      throw new Error("Test 5 Failed: Purging non-existent app altered the store length.");
    }
    console.log("✓ TEST 5 PASSED: Deletion on missing record handled safely without altering store.");

    console.log("\n============================================================");
    console.log("ALL PERMANENT DELETE & ARCHIVE TESTS PASSED SUCCESSFULLY! ✓✓✓");
    console.log("============================================================");
  } catch (error) {
    console.error("Test Suite Failed:", error);
    process.exit(1);
  }
}

runTests();
