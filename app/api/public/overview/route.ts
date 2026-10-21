import { NextResponse } from "next/server";
import { getPublicOverviewStatisticsAsync } from "@/lib/server/public-overview-stats";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public Read-Only Aggregate Statistics API Route
 * 
 * Accessible to any public visitor (authenticated or unauthenticated, incognito).
 * Exposes ONLY non-identifiable, mathematical aggregate totals.
 * No personal data, vendor identities, documents, or secrets are exposed.
 */
export async function GET() {
  try {
    const stats = await getPublicOverviewStatisticsAsync();
    return NextResponse.json(
      {
        success: true,
        stats,
      },
      {
        headers: {
          "Cache-Control": "public, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Public overview API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load public overview statistics.",
      },
      { status: 500 }
    );
  }
}
