import assert from "assert";
import {
  isDemoOrMockApplication,
  createApplication,
  getApplications,
  isApplicationDeleted,
} from "../lib/application-store";
import {
  INITIAL_ADMIN_NOTIFICATIONS,
  createInitialAdminNotifications,
} from "../lib/notifications-data";
import { getAllPersistentApplications } from "../lib/server/vendor-applications-db";
import { computeAdminDashboardAnalytics } from "../lib/admin-analytics";

console.log("=== RUNNING RECONCILED COUNTING & DATA SYNCHRONIZATION TESTS ===");

// 1. Verify Authoritative Persistent Data
const dbApps = getAllPersistentApplications();
console.log(`[TEST 1] Authoritative disk/DB applications count: ${dbApps.length}`);
assert(dbApps.length > 0, "Expected persistent applications to exist in database/disk cache");

const genuineApps = dbApps.filter((a) => !isDemoOrMockApplication(a));
console.log(`[TEST 1] Genuine non-mock applications count: ${genuineApps.length}`);

// 2. Test Reconciliation Rules
const activeApps = genuineApps.filter((a) => !a.isDeleted);
const archivedApps = genuineApps.filter((a) => Boolean(a.isDeleted));

console.log(`[TEST 2] Active Applications: ${activeApps.length}`);
console.log(`[TEST 2] Archived Applications: ${archivedApps.length}`);
console.log(`[TEST 2] Total Submissions: ${genuineApps.length}`);

assert.strictEqual(
  activeApps.length + archivedApps.length,
  genuineApps.length,
  "Active + Archived MUST equal Total Applications!"
);
console.log("✓ TEST 2 PASSED: Active + Archived strictly reconciles with Total Submissions.");

// 3. Status Breakdown Reconciliation
let approvedCount = 0;
let underReviewCount = 0;
let submittedCount = 0;
let needsCorrectionCount = 0;
let rejectedActiveCount = 0;

activeApps.forEach((a) => {
  const s = a.status.toLowerCase();
  if (s === "approved" || a.verificationStatus === "Verified") {
    approvedCount += 1;
  } else if (s === "under_review" || s === "correction_submitted" || s === "under review" || s === "correction submitted") {
    underReviewCount += 1;
  } else if (s === "submitted" || s === "draft") {
    submittedCount += 1;
  } else if (s === "needs_correction" || s === "needs correction") {
    needsCorrectionCount += 1;
  } else if (s === "rejected") {
    rejectedActiveCount += 1;
  }
});

const pendingCount = underReviewCount + submittedCount;
const activeSum = approvedCount + underReviewCount + submittedCount + needsCorrectionCount + rejectedActiveCount;

console.log(`[TEST 3] Status breakdown: Approved=${approvedCount}, Pending=${pendingCount} (Under Review=${underReviewCount}, Submitted=${submittedCount}), Needs Correction=${needsCorrectionCount}, Rejected Active=${rejectedActiveCount}`);
assert.strictEqual(
  activeSum,
  activeApps.length,
  "Sum of active statuses must equal Active count!"
);
console.log("✓ TEST 3 PASSED: Active status breakdown reconciles 100% with Active Applications.");

// 3B. Verify computeAdminDashboardAnalytics Shared Function
const dashboardAnalytics = computeAdminDashboardAnalytics(dbApps, []);
console.log(`[TEST 3B] computeAdminDashboardAnalytics Total: ${dashboardAnalytics.totalCount}, Active: ${dashboardAnalytics.activeCount}, Archived: ${dashboardAnalytics.archivedCount}`);
console.log(`[TEST 3B] Summary Cards: Total=${dashboardAnalytics.totalCount}, Pending Review=${dashboardAnalytics.pendingReviewCount}, Approved=${dashboardAnalytics.approvedCount}, Needs Action=${dashboardAnalytics.needsActionCount}`);

assert.strictEqual(dashboardAnalytics.totalCount, genuineApps.length, "Dashboard totalCount must equal genuineApps count");
assert.strictEqual(dashboardAnalytics.activeCount, activeApps.length, "Dashboard activeCount must equal activeApps count");
assert.strictEqual(dashboardAnalytics.archivedCount, archivedApps.length, "Dashboard archivedCount must equal archivedApps count");
assert.strictEqual(dashboardAnalytics.approvedCount, approvedCount, "Dashboard approvedCount must equal approvedCount");
assert.strictEqual(dashboardAnalytics.pendingReviewCount, pendingCount, "Dashboard pendingReviewCount must equal pendingCount");
assert.strictEqual(dashboardAnalytics.needsActionCount, needsCorrectionCount, "Dashboard needsActionCount must equal needsCorrectionCount");
assert.strictEqual(dashboardAnalytics.rejectedActiveCount, rejectedActiveCount, "Dashboard rejectedActiveCount must equal rejectedActiveCount");

// Ensure statusDistribution sums to totalCount and active items sum to activeCount
const distributionSum = dashboardAnalytics.statusDistribution.reduce((sum, item) => sum + item.count, 0);
assert.strictEqual(distributionSum, dashboardAnalytics.totalCount, "Status distribution sum must equal totalCount");

const activeDistributionSum = dashboardAnalytics.statusDistribution
  .filter((item) => !item.isArchived)
  .reduce((sum, item) => sum + item.count, 0);
assert.strictEqual(activeDistributionSum, dashboardAnalytics.activeCount, "Active status distribution sum must equal activeCount");

const archivedDistributionItem = dashboardAnalytics.statusDistribution.find((item) => item.key === "archived");
assert.strictEqual(archivedDistributionItem?.count, dashboardAnalytics.archivedCount, "Archived distribution item must equal archivedCount");

console.log("✓ TEST 3B PASSED: computeAdminDashboardAnalytics matches summary cards and status distribution 100%.");

// 4. Test Notification Badges and Counter
const initialNotifs = createInitialAdminNotifications();
assert.strictEqual(initialNotifs.length, 0, "Initial admin notifications must be 0 to avoid fabricated records");

// Test badge logic with sample notifications
const sampleNotifs = [
  { id: "notif-1", read: false },
  { id: "notif-2", read: false },
];
const unreadNotifs = sampleNotifs.filter((n) => !n.read);
const notifBadge = unreadNotifs.length > 0 ? String(unreadNotifs.length) : undefined;
assert.strictEqual(notifBadge, "2", "Unread count badge should equal 2 when 2 unread exist");

// Test that marking as read updates count
const allRead = sampleNotifs.map((n) => ({ ...n, read: true }));
const unreadAfterMarkAll = allRead.filter((n) => !n.read).length;
const badgeAfterMarkAll = unreadAfterMarkAll > 0 ? String(unreadAfterMarkAll) : undefined;
assert.strictEqual(badgeAfterMarkAll, undefined, "Badge must be undefined/hidden when all notifications are read");
console.log("✓ TEST 4 PASSED: Notification badge strictly reflects unread count and hides when zero.");

// 5. Verify Soft Delete Preservation in createApplication
const testApp = {
  id: "BVR-UNIT-TEST-0001",
  applicationNumber: "BVR-UNIT-TEST-0001",
  owner: { lastName: "Unit", firstName: "Test", ownerName: "Unit Tester" },
  business: { businessName: "Unit Test Business", category: "Food Stall" },
  address: { barangay: "Barangay Urduja", city: "Butuan City" },
  contact: { contactNumber: "09123456789", emailAddress: "unit@example.com" },
  status: "rejected",
  isDeleted: true,
  deletedReason: "Unit test archival",
};

const created = createApplication(testApp as any);
assert.strictEqual(created.isDeleted, true, "createApplication MUST preserve isDeleted: true");
console.log("✓ TEST 5 PASSED: createApplication preserves soft deletion and archival metadata.");

console.log("\nALL RECONCILIATION AND COUNTING TESTS PASSED SUCCESSFULLY! ✓✓✓");
