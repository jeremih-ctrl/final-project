import {
  dbGetVendorApplications,
  dbGetApplicationByNumber,
  dbGetAllApplications,
  dbSyncProfile,
  dbGetProfile,
  dbAddAuditLog,
  dbCreateNotification,
  dbGetNotifications,
} from "../lib/supabase/server";

async function runTests() {
  console.log("=== TESTING SUPABASE BACKEND INTEGRATION ===");

  // Test 1: Get existing vendor application
  console.log("\n[TEST 1] Retrieving application for user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn...");
  const userApps = await dbGetVendorApplications("user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn");
  console.log(`Found ${userApps.length} applications.`);
  const targetApp = userApps.find((a) => a.applicationNumber === "BVR-2026-000002");
  if (!targetApp) {
    throw new Error(`Test 1 Failed: BVR-2026-000002 not found in ${JSON.stringify(userApps)}`);
  }
  console.log("✓ TEST 1 PASSED: Successfully retrieved genuine vendor application from Supabase.");

  // Test 2: Get application by number
  console.log("\n[TEST 2] Retrieving application by number BVR-2026-000002...");
  const appByNum = await dbGetApplicationByNumber("BVR-2026-000002");
  if (!appByNum || appByNum.business.businessName !== "ULO SA TAO") {
    throw new Error(`Test 2 Failed: Business name mismatch: ${JSON.stringify(appByNum)}`);
  }
  console.log(`✓ TEST 2 PASSED: Retrieved application '${appByNum.business.businessName}', status: ${appByNum.status}.`);

  // Test 3: Admin get all applications
  console.log("\n[TEST 3] Retrieving all applications for admin portal...");
  const allApps = await dbGetAllApplications();
  console.log(`Total applications in Supabase: ${allApps.length}`);
  if (allApps.length === 0) {
    throw new Error("Test 3 Failed: Expected at least 1 application.");
  }
  console.log("✓ TEST 3 PASSED: Admin retrieval successfully returned all records.");

  // Test 4: Profile synchronization
  console.log("\n[TEST 4] Testing profile synchronization...");
  await dbSyncProfile(
    "user_test_sync_12345",
    "Test Sync Vendor",
    "test.sync@butuan.gov.ph",
    "09123456789",
    "vendor"
  );
  const fetchedProfile = (await dbGetProfile("user_test_sync_12345")) as Record<string, unknown>;
  if (!fetchedProfile || fetchedProfile.email !== "test.sync@butuan.gov.ph") {
    throw new Error(`Test 4 Failed: Profile not synced properly: ${JSON.stringify(fetchedProfile)}`);
  }
  console.log("✓ TEST 4 PASSED: User profile synced and retrieved correctly.");

  // Test 5: Audit log
  console.log("\n[TEST 5] Testing audit log creation...");
  const auditRes = await dbAddAuditLog(
    "user_test_sync_12345",
    "Test Admin",
    "admin",
    "BVR-2026-000002",
    "Admin Inspection Completed",
    { notes: "Test audit verification" }
  );
  if (!auditRes) {
    throw new Error("Test 5 Failed: Audit log writing returned false.");
  }
  console.log("✓ TEST 5 PASSED: Audit log recorded successfully.");

  // Test 6: Notifications
  console.log("\n[TEST 6] Testing notification creation and retrieval...");
  await dbCreateNotification(
    "user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn",
    "BVR-2026-000002",
    "Test Notice: Business Permit Ready",
    "Your permit is ready for download.",
    "approval",
    "approval",
    "high"
  );
  const notifs = await dbGetNotifications("user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn");
  const foundNotif = notifs.find((n) => n.title === "Test Notice: Business Permit Ready");
  if (!foundNotif) {
    throw new Error("Test 6 Failed: Notification not found in recipient feed.");
  }
  console.log("✓ TEST 6 PASSED: Notification created and retrieved from Supabase feed.");

  console.log("\nALL SUPABASE TESTS PASSED PERFECTLY! ✓✓✓");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
