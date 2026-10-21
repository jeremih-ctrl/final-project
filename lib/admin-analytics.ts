import { VendorApplication } from "./types/vendor-application";
import { isDemoOrMockApplication } from "./application-store";

export interface StatusDistributionItem {
  key: "submitted" | "underReview" | "needsCorrection" | "approved" | "rejected" | "archived";
  label: string;
  count: number;
  pct: string;
  numericPct: number;
  dotClass: string;
  bgClass: string;
  isArchived: boolean;
}

export interface AdminDashboardAnalytics {
  totalCount: number;
  activeCount: number;
  archivedCount: number;
  pendingReviewCount: number;
  approvedCount: number;
  needsActionCount: number;
  rejectedActiveCount: number;
  submittedCount: number;
  underReviewCount: number;
  statusDistribution: StatusDistributionItem[];
  deduplicatedApplications: VendorApplication[];
}

/**
 * Normalizes application status string into a consistent lowercased slug.
 */
export function normalizeApplicationStatus(rawStatus?: string | null): string {
  if (!rawStatus) return "submitted";
  return rawStatus.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

/**
 * Derives canonical admin analytics and status distribution from raw store records.
 *
 * Rules:
 * - Total Applications: all registered records retained in registry (Active + Archived), excluding permanently deleted records.
 * - Active Applications: records not soft-deleted or marked as deleted.
 * - Archived Applications: records marked as isDeleted or in deleted set.
 * - Pending Review: active applications awaiting admin review/decision (Submitted + Under Review / Correction Submitted).
 * - Approved Vendors: active applications with approved status or verified.
 * - Needs Action: active applications requiring correction or resubmission.
 * - Reconciles 100% between summary cards and the Application Status Overview chart/legend.
 */
export function computeAdminDashboardAnalytics(
  storedApplications: VendorApplication[],
  deletedApplicationIds: string[] = []
): AdminDashboardAnalytics {
  const deletedSet = new Set(
    deletedApplicationIds.map((id) => id.trim().toLowerCase())
  );

  const isAppDeleted = (app: VendorApplication): boolean => {
    const normId = (app.id || "").trim().toLowerCase();
    const normAppNum = (app.applicationNumber || "").trim().toLowerCase();
    return (
      Boolean(app.isDeleted) ||
      (normId ? deletedSet.has(normId) : false) ||
      (normAppNum ? deletedSet.has(normAppNum) : false)
    );
  };

  // 1. Filter out demo/mock placeholder applications
  const genuineStored = storedApplications.filter(
    (app) => !isDemoOrMockApplication(app)
  );

  // 2. Deduplicate by canonical application number or ID
  const seenIds = new Set<string>();
  const deduplicated: VendorApplication[] = [];
  for (const app of genuineStored) {
    const key = (app.applicationNumber || app.id || "").trim().toLowerCase();
    if (key && !seenIds.has(key)) {
      seenIds.add(key);
      deduplicated.push(app);
    }
  }

  // 3. Separate Active and Archived records
  const activeApps = deduplicated.filter((a) => !isAppDeleted(a));
  const archivedApps = deduplicated.filter((a) => isAppDeleted(a));

  const totalCount = deduplicated.length;
  const activeCount = activeApps.length;
  const archivedCount = archivedApps.length;

  // 4. Categorize active applications according to canonical status definitions
  let approvedCount = 0;
  let underReviewCount = 0;
  let submittedCount = 0;
  let needsActionCount = 0;
  let rejectedActiveCount = 0;

  for (const app of activeApps) {
    const s = normalizeApplicationStatus(app.status);
    if (s === "approved" || app.verificationStatus === "Verified") {
      approvedCount += 1;
    } else if (s === "under_review" || s === "correction_submitted") {
      underReviewCount += 1;
    } else if (s === "needs_correction") {
      needsActionCount += 1;
    } else if (s === "rejected") {
      rejectedActiveCount += 1;
    } else if (s === "submitted" || s === "draft") {
      submittedCount += 1;
    } else {
      // Unrecognized active statuses default to submitted
      submittedCount += 1;
    }
  }

  // Pending Review represents active applications awaiting administrator review
  const pendingReviewCount = underReviewCount + submittedCount;

  // Helper for percentage formatting
  const calcPct = (count: number): string =>
    totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : "0.0";

  const calcNumericPct = (count: number): number =>
    totalCount > 0 ? (count / totalCount) * 100 : 0;

  // 5. Ordered canonical status distribution categories:
  // Submitted, Under Review, Needs Correction, Approved, Rejected, Archived
  const statusDistribution: StatusDistributionItem[] = [
    {
      key: "submitted",
      label: "Submitted",
      count: submittedCount,
      pct: calcPct(submittedCount),
      numericPct: calcNumericPct(submittedCount),
      dotClass: "bg-blue-500",
      bgClass: "bg-blue-500",
      isArchived: false,
    },
    {
      key: "underReview",
      label: "Under Review",
      count: underReviewCount,
      pct: calcPct(underReviewCount),
      numericPct: calcNumericPct(underReviewCount),
      dotClass: "bg-amber-500",
      bgClass: "bg-amber-500",
      isArchived: false,
    },
    {
      key: "needsCorrection",
      label: "Needs Correction",
      count: needsActionCount,
      pct: calcPct(needsActionCount),
      numericPct: calcNumericPct(needsActionCount),
      dotClass: "bg-rose-500",
      bgClass: "bg-rose-500",
      isArchived: false,
    },
    {
      key: "approved",
      label: "Approved",
      count: approvedCount,
      pct: calcPct(approvedCount),
      numericPct: calcNumericPct(approvedCount),
      dotClass: "bg-emerald-500",
      bgClass: "bg-emerald-500",
      isArchived: false,
    },
    {
      key: "rejected",
      label: "Rejected",
      count: rejectedActiveCount,
      pct: calcPct(rejectedActiveCount),
      numericPct: calcNumericPct(rejectedActiveCount),
      dotClass: "bg-slate-400",
      bgClass: "bg-slate-400",
      isArchived: false,
    },
    {
      key: "archived",
      label: "Archived",
      count: archivedCount,
      pct: calcPct(archivedCount),
      numericPct: calcNumericPct(archivedCount),
      dotClass: "bg-slate-700",
      bgClass: "bg-slate-700",
      isArchived: true,
    },
  ];

  return {
    totalCount,
    activeCount,
    archivedCount,
    pendingReviewCount,
    approvedCount,
    needsActionCount,
    rejectedActiveCount,
    submittedCount,
    underReviewCount,
    statusDistribution,
    deduplicatedApplications: deduplicated,
  };
}
