import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getAllPersistentApplicationsAsync,
  savePersistentApplicationAsync,
} from "@/lib/server/vendor-applications-db";
import { dbAddAuditLog } from "@/lib/supabase/server";

async function verifyAdminRole(): Promise<{ isAdmin: boolean; errorResponse?: NextResponse; user?: any }> {
  const { userId } = await auth();
  if (!userId) {
    return {
      isAdmin: false,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
  const user = await client.users.getUser(userId);

  if (user.publicMetadata?.role !== "admin") {
    return {
      isAdmin: false,
      errorResponse: NextResponse.json(
        { error: "Forbidden: Administrator privileges required" },
        { status: 403 }
      ),
    };
  }

  return { isAdmin: true, user };
}

export async function GET() {
  try {
    const authCheck = await verifyAdminRole();
    if (!authCheck.isAdmin && authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const applications = await getAllPersistentApplicationsAsync();
    return NextResponse.json({ success: true, applications });
  } catch (error) {
    console.error("Admin applications API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve applications" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authCheck = await verifyAdminRole();
    if (!authCheck.isAdmin && authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const body = await req.json();
    if (!body || !body.id) {
      return NextResponse.json(
        { error: "Valid application data is required." },
        { status: 400 }
      );
    }

    const saved = await savePersistentApplicationAsync(body);

    if (authCheck.user) {
      await dbAddAuditLog(
        authCheck.user.id,
        authCheck.user.fullName || "Administrator",
        "admin",
        saved.applicationNumber,
        "Admin Saved Application",
        { status: saved.status }
      );
    }

    return NextResponse.json({ success: true, application: saved });
  } catch (error) {
    console.error("Admin save application API error:", error);
    return NextResponse.json(
      { error: "Failed to save application" },
      { status: 500 }
    );
  }
}
