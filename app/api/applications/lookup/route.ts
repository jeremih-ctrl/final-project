import { NextResponse } from "next/server";
import { getPersistentApplicationByIdAsync } from "@/lib/server/vendor-applications-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("number") || searchParams.get("id");

    if (!query) {
      return NextResponse.json(
        { error: "Application reference number is required." },
        { status: 400 }
      );
    }

    const application = await getPersistentApplicationByIdAsync(query);
    if (!application) {
      return NextResponse.json(
        { error: "No matching application found with that reference number." },
        { status: 404 }
      );
    }

    // Return sanitized public tracking data (excluding internal Clerk userId)
    const { userId, ...sanitizedApplication } = application;
    return NextResponse.json({
      success: true,
      found: true,
      application: sanitizedApplication,
    });
  } catch (error) {
    console.error("Application lookup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during status lookup." },
      { status: 500 }
    );
  }
}
