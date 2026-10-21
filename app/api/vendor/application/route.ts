import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getPersistentApplicationsByUserIdAsync,
  getPersistentApplicationByIdAsync,
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

    const rawApplications = await getPersistentApplicationsByUserIdAsync(userId);

    // Enforce strict vendor data isolation:
    // Guarantee that every record strictly belongs to the authenticated Clerk user ID
    const applications = rawApplications.filter(
      (app) => app.userId === userId || (app as unknown as { clerkUserId?: string }).clerkUserId === userId
    );

    let application: VendorApplication | null = null;
    if (requestedId) {
      const normalizedQuery = requestedId.trim().toLowerCase();
      const match = applications.find(
        (app) =>
          app.id?.toLowerCase() === normalizedQuery ||
          app.applicationNumber?.toLowerCase() === normalizedQuery
      );
      if (!match) {
        // Return 404 without revealing private records or confirming existence of other users' apps
        return NextResponse.json(
          { error: "Application not found or unauthorized" },
          { status: 404 }
        );
      }
      application = match;
    } else {
      // Prioritize an active (non-deleted) application; if all are archived, return the latest one
      application = applications.find((app) => !app.isDeleted) || applications[0] || null;
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

    const body = await req.json().catch(() => ({}));

    // Resolve verified Clerk user details directly from the server with resilient fallbacks
    let verifiedEmail = (body.contact?.emailAddress || body.verifiedEmail || "").trim();
    let verifiedName = (body.owner?.ownerName || "").trim();

    try {
      const client = typeof clerkClient === "function" ? await clerkClient() : clerkClient;
      const user = await client.users.getUser(userId);

      if (user) {
        verifiedEmail =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          verifiedEmail;

        verifiedName =
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          user.fullName ||
          verifiedName ||
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
      }
    } catch (clerkErr) {
      console.warn("Clerk user resolution warning during application save:", clerkErr);
    }

    if (!verifiedName) {
      verifiedName = "Registered Vendor";
    }

    const requestedAppNumber = (body.applicationNumber || body.id || "").trim();

    // Check if updating an existing specific application
    let existing: VendorApplication | null = null;
    if (requestedAppNumber) {
      const targetApp = await getPersistentApplicationByIdAsync(requestedAppNumber);
      if (targetApp) {
        // Enforce strict ownership check:
        // A vendor cannot update or overwrite an application belonging to another Clerk user!
        const ownerUserId = targetApp.userId || (targetApp as unknown as { clerkUserId?: string }).clerkUserId;
        if (ownerUserId && ownerUserId !== userId) {
          return NextResponse.json(
            { error: "Forbidden: You do not have permission to update this application." },
            { status: 403 }
          );
        }
        existing = targetApp;
      }
    }

    const submittedBusinessName = (body.business?.businessName || "").trim();
    const submittedBarangay = (body.address?.barangay || "").trim();
    const submittedCategory = (body.business?.category || "").trim();

    // Server-side validation: Required fields must be non-empty; never invent values
    if (!existing) {
      if (!submittedBusinessName) {
        return NextResponse.json(
          { error: "Validation error: Business name is required." },
          { status: 400 }
        );
      }
      if (!submittedBarangay) {
        return NextResponse.json(
          { error: "Validation error: Operating barangay is required." },
          { status: 400 }
        );
      }
      if (!submittedCategory) {
        return NextResponse.json(
          { error: "Validation error: Business category is required." },
          { status: 400 }
        );
      }
    }

    // Prohibit placeholder or fabricated names like "Maria Santos" or "John Doe"
    let candidateOwnerName = (body.owner?.ownerName || "").trim();
    if (
      candidateOwnerName.toLowerCase() === "maria santos" ||
      candidateOwnerName.toLowerCase() === "john doe" ||
      candidateOwnerName.toLowerCase() === "placeholder"
    ) {
      candidateOwnerName = "";
    }
    const finalOwnerName = candidateOwnerName || verifiedName;

    const existingApps = await getPersistentApplicationsByUserIdAsync(userId);

    // Prevent duplicate submissions caused by network retries within 10 seconds for the exact same business name
    const now = new Date().toISOString();
    const reqBizName = submittedBusinessName.toLowerCase();
    if (!existing && reqBizName) {
      const recentDup = existingApps.find((app) => {
        if (!app.submittedAt) return false;
        const appBizName = (app.business?.businessName || "").trim().toLowerCase();
        if (appBizName !== reqBizName) return false;
        const diffMs = Date.now() - new Date(app.submittedAt).getTime();
        return diffMs < 10000; // 10 seconds duplicate guard
      });
      if (recentDup) {
        return NextResponse.json({
          success: true,
          application: recentDup,
          isDuplicateSuppressed: true,
        });
      }
    }

    // If not updating an existing specific record, generate a fresh new application number
    const appNumber = existing?.applicationNumber || generateServerApplicationNumber();

    const applicationToSave: VendorApplication = {
      ...body,
      id: appNumber,
      applicationNumber: appNumber,
      userId,
      verifiedEmail,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deletedReason: null,
      status: existing?.status && existing.status !== "draft" ? existing.status : body.status || "submitted",
      verificationStatus: existing?.verificationStatus || body.verificationStatus || "Pending",
      isVerified: existing?.isVerified ?? Boolean(body.isVerified),
      currentStage: existing?.currentStage ?? body.currentStage ?? 1,
      business: {
        ...(existing?.business || {}),
        ...(body.business || {}),
        businessName: (submittedBusinessName || existing?.business?.businessName || "").trim(),
      },
      owner: {
        ...(existing?.owner || {}),
        ...(body.owner || {}),
        ownerName: finalOwnerName,
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
      payment: {
        ...(existing?.payment || {}),
        ...(body.payment || {}),
        status: existing?.payment?.status || body.payment?.status || "unpaid",
        assessedAmount: existing?.payment?.assessedAmount ?? body.payment?.assessedAmount ?? 0,
        amountPaid: existing?.payment?.amountPaid ?? body.payment?.amountPaid ?? 0,
        currency: "PHP",
        transactionReference:
          (body.payment?.transactionReference && !body.payment.transactionReference.includes("000001"))
            ? body.payment.transactionReference
            : existing?.payment?.transactionReference || `PAY-${appNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}`,
      },
      statusHistory: existing?.statusHistory
        ? [
            ...existing.statusHistory,
            ...(body.statusHistory && Array.isArray(body.statusHistory) ? body.statusHistory : []),
          ]
        : body.statusHistory || [
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
