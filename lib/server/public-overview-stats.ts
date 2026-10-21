import { getAllPersistentApplicationsAsync } from "@/lib/server/vendor-applications-db";
import {
  computePublicOverviewStatistics,
  PublicOverviewStatistics,
} from "@/lib/public-analytics";

/**
 * Server-side helper to retrieve official public overview statistics
 * directly from the authoritative persistent database/cache.
 */
export async function getPublicOverviewStatisticsAsync(): Promise<PublicOverviewStatistics> {
  const applications = await getAllPersistentApplicationsAsync();
  return computePublicOverviewStatistics(applications);
}
