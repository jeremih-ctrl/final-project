import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getPersistentApplicationByIdAsync,
  updatePersistentApplicationAsync,
  deletePersistentApplication,
} from "@/lib/server/vendor-applications-db";
import { dbAddAuditLog, dbCreateNotification } from "@/lib/supabase/server";

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

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRole();
    if (!authCheck.isAdmin && authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await props.params;
    const application = await getPersistentApplicationByIdAsync(id);
    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error("Error retrieving application:", error);
    return NextResponse.json(
      { error: "Failed to retrieve application" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRole();
    if (!authCheck.isAdmin && authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await props.params;
    const updates = await req.json();

    const updated = await updatePersistentApplicationAsync(id, {
      ...updates,
      actionBy: authCheck.user?.fullName || "Administrator",
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Record audit log
    if (authCheck.user) {
      await dbAddAuditLog(
        authCheck.user.id,
        authCheck.user.fullName || "Administrator",
        "admin",
        updated.applicationNumber,
        updates.action || `Admin updated status to ${updated.status}`,
        {
          newStatus: updated.status,
          verificationStatus: updated.verificationStatus,
          paymentStatus: updated.paymentStatus,
          remarks: updates.adminRemarks || updates.remarks,
        }
      );

      // Notify vendor if status changed or corrections requested
      if (updated.userId) {
        if (updated.status === "needs_correction") {
          await dbCreateNotification(
            updated.userId,
            updated.applicationNumber,
            "Action Required: Application Correction",
            updates.adminRemarks || "An administrator has requested corrections on your application.",
            "correction-requested",
            "correction",
            "high",
            "Review Application",
            "/dashboard/my-application/correction"
          );
        } else if (updated.status === "approved") {
          await dbCreateNotification(
            updated.userId,
            updated.applicationNumber,
            "Vendor Registration Approved",
            `Congratulations! Your vendor registration ${updated.applicationNumber} has been officially approved.`,
            "application-approved",
            "approval",
            "high",
            "View Certificate",
            "/dashboard/my-application"
          );
        }
      }
    }

    return NextResponse.json({ success: true, application: updated });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await verifyAdminRole();
    if (!authCheck.isAdmin && authCheck.errorResponse) {
      return authCheck.errorResponse;
    }

    const { id } = await props.params;
    const success = deletePersistentApplication(id);

    if (!success) {
      return NextResponse.json(
        { error: "Application not found or could not be deleted" },
        { status: 404 }
      );
    }

    if (authCheck.user) {
      await dbAddAuditLog(
        authCheck.user.id,
        authCheck.user.fullName || "Administrator",
        "admin",
        id,
        "Admin Deleted Application Record"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}
