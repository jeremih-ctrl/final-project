import { VendorApplication } from "./types/vendor-application";
import { isDemoOrMockApplication } from "./mock-filter";

export interface PublicOverviewStatistics {
  totalRegisteredVendors: number;
  applicationsReceived: number;
  acceptedApplications: number;
  acceptanceRate: number;
  acceptanceRateFormatted: string;
  averageApprovalTimeFormatted: string | null;
  averageApprovalTimeHours: number | null;
  qualifyingApprovalRecordsCount: number;
}

/**
 * Computes official public statistics for the Public Home Page overview widget.
 * 
 * Rules:
 * - Excludes demo, mock, and placeholder application records.
 * - Deduplicates by canonical application number or ID.
 * - Excludes soft-deleted / archived records from active statistics.
 * - Total Registered Vendors: counts distinct registered vendor accounts / owners.
 *   Multiple applications belonging to the same vendor are counted as 1 vendor.
 * - Applications Received: counts genuine active submitted applications.
 * - Accepted Applications: counts applications with approved or verified status only.
 *   Pending, rejected, deleted, or merely submitted applications are excluded.
 * - Acceptance Rate: calculated as (Accepted Applications / Applications Received) * 100.
 *   Returns 0.0% when the denominator is 0.
 * - Average Approval Time: calculated as the elapsed time between application submission
 *   and recorded approval or decision timestamp. Returns null if no qualifying records exist.
 */
export function computePublicOverviewStatistics(
  rawApplications: VendorApplication[]
): PublicOverviewStatistics {
  // 1. Filter out demo, mock, and invalid placeholder records
  const genuineList = rawApplications.filter((app) => !isDemoOrMockApplication(app));

  // 2. Deduplicate applications by canonical applicationNumber or id
  const seenIds = new Set<string>();
  const deduplicated: VendorApplication[] = [];
  for (const app of genuineList) {
    const key = (app.applicationNumber || app.id || "").trim().toLowerCase();
    if (key && !seenIds.has(key)) {
      seenIds.add(key);
      deduplicated.push(app);
    }
  }

  // 3. Separate Active from Soft-deleted / Archived records
  const isAppDeleted = (app: VendorApplication): boolean => {
    return Boolean(app.isDeleted);
  };

  const activeApps = deduplicated.filter((a) => !isAppDeleted(a));

  // 4. Metric 1: Total Registered Vendors (unique vendor accounts / owners)
  // Ensure multiple applications from the same vendor do NOT inflate the vendor count
  const vendorKeys = new Set<string>();
  activeApps.forEach((app) => {
    const key = (
      app.userId ||
      app.contact?.emailAddress ||
      app.owner?.ownerName ||
      app.vendorId ||
      app.id
    )
      .trim()
      .toLowerCase();
    if (key) vendorKeys.add(key);
  });
  const totalRegisteredVendors = vendorKeys.size;

  // 5. Metric 2: Applications Received (genuine active submissions)
  const applicationsReceived = activeApps.length;

  // 6. Metric 3: Accepted (Approved) Applications
  // Strictly approved or verified records; exclude pending, rejected, deleted, or merely submitted
  const acceptedApps = activeApps.filter(
    (app) =>
      app.status?.toLowerCase() === "approved" ||
      app.verificationStatus === "Verified"
  );
  const acceptedApplications = acceptedApps.length;

  // 7. Metric 4: Acceptance Rate
  // Documented consistent denominator: applicationsReceived
  const acceptanceRate =
    applicationsReceived > 0
      ? (acceptedApplications / applicationsReceived) * 100
      : 0;
  const acceptanceRateFormatted = `${acceptanceRate.toFixed(1)}%`;

  // 8. Metric 5: Average Approval Time
  // Elapsed time between application submission and recorded approval or decision timestamp
  const durationsMs: number[] = [];

  acceptedApps.forEach((app) => {
    const subTime = app.submittedAt ? new Date(app.submittedAt).getTime() : NaN;
    if (isNaN(subTime)) return;

    let appTime = NaN;
    if (app.statusHistory && app.statusHistory.length > 0) {
      const historyItem = app.statusHistory.find(
        (h) =>
          (h.newStatus?.toLowerCase() === "approved" ||
            h.action?.toLowerCase().includes("approved")) &&
          h.timestamp
      );
      if (historyItem?.timestamp) {
        appTime = new Date(historyItem.timestamp).getTime();
      }
    }

    const certIssuedAt = (app as unknown as { certificate?: { issuedAt?: string } }).certificate?.issuedAt;
    if (isNaN(appTime) && certIssuedAt) {
      appTime = new Date(certIssuedAt).getTime();
    }

    if (isNaN(appTime) && app.updatedAt) {
      appTime = new Date(app.updatedAt).getTime();
    }

    if (!isNaN(appTime) && appTime >= subTime) {
      durationsMs.push(appTime - subTime);
    }
  });

  let averageApprovalTimeFormatted: string | null = null;
  let averageApprovalTimeHours: number | null = null;

  if (durationsMs.length > 0) {
    const avgMs = durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length;
    averageApprovalTimeHours = Number((avgMs / (60 * 60 * 1000)).toFixed(2));

    if (avgMs < 60 * 1000) {
      averageApprovalTimeFormatted = "< 1 min";
    } else if (avgMs < 60 * 60 * 1000) {
      averageApprovalTimeFormatted = `${Math.max(1, Math.round(avgMs / (60 * 1000)))} mins`;
    } else if (avgMs < 24 * 60 * 60 * 1000) {
      averageApprovalTimeFormatted = `${(avgMs / (60 * 60 * 1000)).toFixed(1)} hrs`;
    } else {
      averageApprovalTimeFormatted = `${(avgMs / (24 * 60 * 60 * 1000)).toFixed(1)} days`;
    }
  }

  return {
    totalRegisteredVendors,
    applicationsReceived,
    acceptedApplications,
    acceptanceRate,
    acceptanceRateFormatted,
    averageApprovalTimeFormatted,
    averageApprovalTimeHours,
    qualifyingApprovalRecordsCount: durationsMs.length,
  };
}
