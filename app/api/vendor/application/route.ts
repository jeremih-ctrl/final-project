import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getPersistentApplicationsByUserIdAsync,
  savePersistentApplicationAsync,
  generateServerApplicationNumber,
} from "@/lib/server/vendor-applications-db";
import { dbSyncProfile, dbAddAuditLog } from "@/lib/supabase/server";
import { VendorApplication } from "@/lib/types/vendor-application";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedId =
      searchParams.get("appNumber") ||
      searchParams.get("id") ||
      searchParams.get("ref");

    const applications = await getPersistentApplicationsByUserIdAsync(userId);

    let application: VendorApplication | null = null;
    if (requestedId) {
      const normalizedQuery = requestedId.trim().toLowerCase();
      const match = applications.find(
        (app) =>
          app.id?.toLowerCase() === normalizedQuery ||
          app.applicationNumber?.toLowerCase() === normalizedQuery
      );
      if (!match) {
        return NextResponse.json(
          { error: "Application not found or unauthorized" },
          { status: 404 }
        );
      }
      application = match;
    } else {
      application = applications[0] || null;
    }

    return NextResponse.json({ success: true, application, applications });
  } catch (error) {
    console.error("Error fetching vendor application:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in with Google to submit your application." },
        { status: 401 }
      );
    }

    // Resolve verified Clerk user details directly from the server
    const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
    const user = await client.users.getUser(userId);

    const verifiedEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";

    const verifiedName =
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.fullName ||
      "Registered Vendor";

    // Synchronize user profile into Supabase
    try {
      await dbSyncProfile(
        userId,
        verifiedName,
        verifiedEmail,
        user.phoneNumbers?.[0]?.phoneNumber || undefined,
        user.publicMetadata?.role === "admin" ? "admin" : "vendor"
      );
    } catch (profileErr) {
      console.warn("Could not sync profile to Supabase:", profileErr);
    }

    // Role-based security check:
    // If the authenticated user is an administrator, NEVER overwrite their role!
    // If they do not have the admin role, safely assign the "vendor" role in Clerk.
    if (user.publicMetadata?.role !== "admin") {
      try {
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            role: "vendor",
          },
        });
      } catch (roleErr) {
        console.error("Failed to update user publicMetadata role in Clerk:", roleErr);
      }
    }

    const body = await req.json().catch(() => ({}));

    // Check if an existing application already exists for this vendor to prevent duplicates
    const existingApps = await getPersistentApplicationsByUserIdAsync(userId);
    const existing = existingApps[0] || null;

    const now = new Date().toISOString();
    const appNumber =
      existing?.applicationNumber ||
      body.applicationNumber ||
      generateServerApplicationNumber();

    const applicationToSave: VendorApplication = {
      ...body,
      id: appNumber,
      applicationNumber: appNumber,
      userId,
      verifiedEmail,
      status: existing?.status && existing.status !== "draft" ? existing.status : body.status || "submitted",
      verificationStatus: existing?.verificationStatus || body.verificationStatus || "Pending",
      isVerified: existing?.isVerified ?? Boolean(body.isVerified),
      currentStage: existing?.currentStage ?? body.currentStage ?? 1,
      business: {
        ...(existing?.business || {}),
        ...(body.business || {}),
        businessName: (body.business?.businessName || existing?.business?.businessName || "").trim(),
      },
      owner: {
        ...(existing?.owner || {}),
        ...(body.owner || {}),
        ownerName: (body.owner?.ownerName || verifiedName).trim(),
      },
      contact: {
        ...(existing?.contact || {}),
        ...(body.contact || {}),
        emailAddress: verifiedEmail, // Authoritative verified email from Clerk
        contactNumber: (body.contact?.contactNumber || existing?.contact?.contactNumber || "").trim(),
      },
      address: {
        ...(existing?.address || {}),
        ...(body.address || {}),
      },
      documents: body.documents || existing?.documents || [],
      payment: body.payment || existing?.payment || {
        status: "unpaid",
        assessedAmount: 0,
        amountPaid: 0,
        currency: "PHP",
      },
      statusHistory: body.statusHistory || existing?.statusHistory || [
        {
          id: `hist-${Date.now()}`,
          previousStatus: null,
          newStatus: body.status || "submitted",
          timestamp: now,
          action: "Application Submitted",
          actionBy: "Vendor",
        },
      ],
      submittedAt: existing?.submittedAt || body.submittedAt || now,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };

    const savedApp = await savePersistentApplicationAsync(applicationToSave);

    // Record audit log entry in Supabase
    try {
      await dbAddAuditLog(
        userId,
        verifiedName,
        "vendor",
        appNumber,
        existing ? "Application Updated" : "Application Submitted",
        {
          businessName: applicationToSave.business.businessName,
          status: applicationToSave.status,
          paymentMethod: applicationToSave.payment?.paymentMethod,
        }
      );
    } catch (auditErr) {
      console.warn("Could not write audit log:", auditErr);
    }

    return NextResponse.json({
      success: true,
      application: savedApp,
    });
  } catch (error) {
    console.error("Error saving persistent vendor application:", error);
    return NextResponse.json(
      { error: "Failed to persist application. Please try again." },
      { status: 500 }
    );
  }
}
