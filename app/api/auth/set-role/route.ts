import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dbSyncProfile } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { role } = body;

    // Security Guard: Administrator role CANNOT be assigned or requested by clients
    if (role === "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrator role cannot be assigned via client request." },
        { status: 403 }
      );
    }

    if (role !== "vendor") {
      return NextResponse.json(
        { error: "Invalid role specified. Only 'vendor' role is assignable." },
        { status: 400 }
      );
    }

    const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
    const user = await client.users.getUser(userId);

    // Existing admins must never have their role overwritten
    if (user.publicMetadata?.role === "admin") {
      return NextResponse.json(
        { error: "Forbidden: Administrator accounts cannot be modified." },
        { status: 403 }
      );
    }

    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: "vendor",
      },
    });

    // Synchronize to Supabase profiles
    try {
      const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.fullName || "Vendor";
      await dbSyncProfile(userId, name, email, undefined, "vendor");
    } catch (dbErr) {
      console.warn("Could not sync role to Supabase profile:", dbErr);
    }

    return NextResponse.json({ success: true, role: "vendor" });
  } catch (error) {
    console.error("Error updating Clerk user role:", error);
    return NextResponse.json(
      { error: "Failed to update role in Clerk" },
      { status: 500 }
    );
  }
}
