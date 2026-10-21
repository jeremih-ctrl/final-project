import assert from "assert";
import { getAllPersistentApplicationsAsync } from "../lib/server/vendor-applications-db";
import { computeAdminDashboardAnalytics } from "../lib/admin-analytics";
import {
  computePublicOverviewStatistics,
  PublicOverviewStatistics,
} from "../lib/public-analytics";
import { getPublicOverviewStatisticsAsync } from "../lib/server/public-overview-stats";
import { VendorApplication } from "../lib/types/vendor-application";

async function runVerification() {
  console.log("============================================================");
  console.log("RUNNING VERIFICATION FOR HOME PAGE PUBLIC LIVE ANALYTICS");
  console.log("============================================================");

  // 1. Authoritative Records Comparison
  console.log("\n[TEST 1] Comparing overview statistics with authoritative records...");
  const rawApps = await getAllPersistentApplicationsAsync();
  const adminAnalytics = computeAdminDashboardAnalytics(rawApps, []);
  const publicStats = await getPublicOverviewStatisticsAsync();

  console.log(`- Authoritative Raw Applications in DB/Disk: ${rawApps.length}`);
  console.log(`- Admin Analytics Active: ${adminAnalytics.activeCount}, Approved: ${adminAnalytics.approvedCount}, Archived: ${adminAnalytics.archivedCount}`);
  console.log(`- Public Overview: Vendors=${publicStats.totalRegisteredVendors}, Received=${publicStats.applicationsReceived}, Accepted=${publicStats.acceptedApplications}, Rate=${publicStats.acceptanceRateFormatted}, Avg Time=${publicStats.averageApprovalTimeFormatted}`);

  // Reconciled checks:
  assert.strictEqual(
    publicStats.acceptedApplications,
    adminAnalytics.approvedCount,
    "Accepted applications must match Admin Dashboard approvedCount!"
  );
  assert.strictEqual(
    publicStats.applicationsReceived,
    adminAnalytics.activeCount,
    "Active Applications Received must match Admin Dashboard activeCount!"
  );
  assert.strictEqual(
    publicStats.totalRegisteredVendors,
    2,
    "Expected 2 unique vendors for the current active applications (Ma. Irish Relleta & swetyy gwaps)."
  );
  console.log("✓ TEST 1 PASSED: Public overview statistics strictly reconcile with Admin Dashboard analytics.");

  // 2. Multi-application Vendor Independence Test
  console.log("\n[TEST 2] Verifying that multiple applications from 1 vendor do not inflate vendor count...");
  const syntheticVendor: any[] = [
    {
      id: "APP-VND-01",
      applicationNumber: "APP-VND-01",
      userId: "user_multi_app_vendor_42",
      status: "approved",
      verificationStatus: "Verified",
      business: { businessName: "First Branch Eatery", category: "Food" },
      owner: { ownerName: "Test Multi Owner" },
      contact: { emailAddress: "multi@example.com", contactNumber: "09123456789" },
      submittedAt: "2026-10-10T08:00:00Z",
      updatedAt: "2026-10-10T12:00:00Z", // 4 hours
      isDeleted: false,
    },
    {
      id: "APP-VND-02",
      applicationNumber: "APP-VND-02",
      userId: "user_multi_app_vendor_42", // SAME VENDOR!
      status: "submitted",
      verificationStatus: "Pending",
      business: { businessName: "Second Branch Goods", category: "Dry Goods" },
      owner: { ownerName: "Test Multi Owner" },
      contact: { emailAddress: "multi@example.com", contactNumber: "09123456789" },
      submittedAt: "2026-10-11T08:00:00Z",
      isDeleted: false,
    },
    {
      id: "APP-VND-03",
      applicationNumber: "APP-VND-03",
      userId: "user_multi_app_vendor_42", // SAME VENDOR 3RD APPLICATION!
      status: "approved",
      verificationStatus: "Verified",
      business: { businessName: "Third Branch Services", category: "Services" },
      owner: { ownerName: "Test Multi Owner" },
      contact: { emailAddress: "multi@example.com", contactNumber: "09123456789" },
      submittedAt: "2026-10-12T08:00:00Z",
      updatedAt: "2026-10-12T10:00:00Z", // 2 hours
      isDeleted: false,
    },
  ];

  const multiStats = computePublicOverviewStatistics(syntheticVendor);
  assert.strictEqual(multiStats.totalRegisteredVendors, 1, "3 applications for 1 vendor MUST yield exactly 1 vendor!");
  assert.strictEqual(multiStats.applicationsReceived, 3, "Applications Received must be 3");
  assert.strictEqual(multiStats.acceptedApplications, 2, "Accepted Applications must be 2");
  assert.strictEqual(multiStats.acceptanceRateFormatted, "66.7%", "Acceptance rate must be 2/3 = 66.7%");
  // Average approval time: (4h + 2h) / 2 = 3.0 hrs
  assert.strictEqual(multiStats.averageApprovalTimeFormatted, "3.0 hrs", "Average approval time must be (4h+2h)/2 = 3.0 hrs");
  console.log("✓ TEST 2 PASSED: 3 applications under 1 vendor count as 1 vendor, 3 applications, 66.7% rate, and 3.0 hrs approval.");

  // 3. Status Handling: Pending, Rejected, Deleted, Archived
  console.log("\n[TEST 3] Verifying status filtering (pending, rejected, deleted, archived)...");
  const mixedStatusList: any[] = [
    {
      id: "APP-ACT-01",
      applicationNumber: "APP-ACT-01",
      userId: "user_vnd_1",
      status: "approved",
      verificationStatus: "Verified",
      business: { businessName: "Stall 1", category: "Food" },
      owner: { ownerName: "Vendor 1" },
      contact: { emailAddress: "v1@test.com", contactNumber: "09111111111" },
      submittedAt: "2026-10-01T08:00:00Z",
      updatedAt: "2026-10-01T09:00:00Z", // 1 hour
      isDeleted: false,
    },
    {
      id: "APP-REJ-01",
      applicationNumber: "APP-REJ-01",
      userId: "user_vnd_2",
      status: "rejected",
      verificationStatus: "Not Verified",
      business: { businessName: "Stall 2", category: "Food" },
      owner: { ownerName: "Vendor 2" },
      contact: { emailAddress: "v2@test.com", contactNumber: "09222222222" },
      submittedAt: "2026-10-02T08:00:00Z",
      isDeleted: false,
    },
    {
      id: "APP-DEL-01",
      applicationNumber: "APP-DEL-01",
      userId: "user_vnd_3",
      status: "approved", // Was approved but later archived/deleted by admin
      verificationStatus: "Verified",
      business: { businessName: "Stall 3", category: "Food" },
      owner: { ownerName: "Vendor 3" },
      contact: { emailAddress: "v3@test.com", contactNumber: "09333333333" },
      submittedAt: "2026-10-03T08:00:00Z",
      isDeleted: true, // SOFT-DELETED / ARCHIVED!
    },
  ];

  const mixedStats = computePublicOverviewStatistics(mixedStatusList);
  assert.strictEqual(mixedStats.applicationsReceived, 2, "Soft-deleted application must be excluded from active received");
  assert.strictEqual(mixedStats.acceptedApplications, 1, "Only active approved applications must be counted as accepted");
  assert.strictEqual(mixedStats.totalRegisteredVendors, 2, "Only active vendors must be counted in registered vendors");
  assert.strictEqual(mixedStats.acceptanceRateFormatted, "50.0%", "Acceptance rate must be 1 / 2 = 50.0%");
  console.log("✓ TEST 3 PASSED: Deleted and rejected applications handled correctly without corrupting acceptance counts.");

  // 4. Public API Endpoint Security and Privacy Audit
  console.log("\n[TEST 4] Testing public API endpoint privacy and security...");
  const apiRes = await fetch("http://localhost:3000/api/public/overview");
  assert.strictEqual(apiRes.status, 200, "Expected HTTP 200 from /api/public/overview");
  const apiJson = await apiRes.json();
  assert.strictEqual(apiJson.success, true);
  assert.ok(apiJson.stats, "Stats payload must be present");

  // Privacy Audit: check keys in response
  const rawBodyText = JSON.stringify(apiJson);
  const sensitivePatterns = [
    "miprelleta12@gmail.com",
    "Ma. Irish Relleta",
    "09761547673",
    "BVR-2026-000002",
    "user_3Kd0oEGh4eXYQXgVNWbZc4CKPkn",
    "CTO-OR-2026-0002",
    "bvr_prod_sec",
    "eyJhbGciOi",
  ];

  for (const pattern of sensitivePatterns) {
    if (rawBodyText.includes(pattern)) {
      throw new Error(`SECURITY VIOLATION: Sensitive data leaked in public API response: ${pattern}`);
    }
  }
  console.log("✓ TEST 4 PASSED: Public API endpoint returned 200 OK with zero PII or credentials leaked.");

  // 5. Zero-State and Empty Handling
  console.log("\n[TEST 5] Testing zero data handling...");
  const zeroStats = computePublicOverviewStatistics([]);
  assert.strictEqual(zeroStats.totalRegisteredVendors, 0);
  assert.strictEqual(zeroStats.applicationsReceived, 0);
  assert.strictEqual(zeroStats.acceptedApplications, 0);
  assert.strictEqual(zeroStats.acceptanceRate, 0);
  assert.strictEqual(zeroStats.acceptanceRateFormatted, "0.0%");
  assert.strictEqual(zeroStats.averageApprovalTimeFormatted, null);
  console.log("✓ TEST 5 PASSED: Clean zero-state handled without NaN or dividing by zero.");

  // 6. Verify Public Home Page HTTP Response
  console.log("\n[TEST 6] Testing public home page HTTP response (unauthenticated)...");
  const homeRes = await fetch("http://localhost:3000/");
  assert.strictEqual(homeRes.status, 200, "Public home page must return 200 OK");
  const homeHtml = await homeRes.text();
  assert.ok(homeHtml.includes("BUTUAN LGU IMPACT"), "Page must contain BUTUAN LGU IMPACT");
  assert.ok(homeHtml.includes("Vendor Registration Overview"), "Page must contain Vendor Registration Overview");
  assert.ok(homeHtml.includes("Public Statistics"), "Page must contain Public Statistics badge");
  assert.ok(homeHtml.includes("Total Registered Vendors"), "Page must contain Total Registered Vendors card");
  assert.ok(homeHtml.includes("Applications Received"), "Page must contain Applications Received card");
  assert.ok(homeHtml.includes("Accepted Applications"), "Page must contain Accepted Applications card");
  assert.ok(homeHtml.includes("Acceptance Rate"), "Page must contain Acceptance Rate card");
  assert.ok(homeHtml.includes("Average Approval Time"), "Page must contain Average Approval Time banner");
  console.log("✓ TEST 6 PASSED: Public home page renders all 5 metrics and headers cleanly for unauthenticated visitors.");

  console.log("\n============================================================");
  console.log("ALL PUBLIC OVERVIEW & LIVE ANALYTICS TESTS PASSED! ✓✓✓");
  console.log("============================================================");
}

runVerification().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
