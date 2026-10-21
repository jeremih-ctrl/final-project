import { VendorApplication } from "@/lib/types/vendor-application";
import { isDemoOrMockApplication } from "@/lib/mock-filter";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://qvsnzleccwaxhymsxrwd.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c256bGVjY3dheGh5bXN4cndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjY2MjUsImV4cCI6MjA5MzQ0MjYyNX0.aRrtERCsRdGVtkndF2A4aq4fbrN5WgEfmx7P_iIuvGM";

const SUPABASE_SERVER_AUTH_SECRET =
  process.env.SUPABASE_SERVER_AUTH_SECRET ||
  "bvr_prod_sec_99a81e3f8472901a88b5024e0b3c6628";

/**
 * Executes a secure RPC call to Supabase PostgreSQL database
 * protected by server-side authorization credentials.
 */
async function callRpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-server-auth": SUPABASE_SERVER_AUTH_SECRET,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(params),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(
      `Supabase RPC [${functionName}] failed (${res.status}): ${errorBody}`
    );
  }

  const data = await res.json();
  return data as T;
}

/**
 * Synchronizes a Clerk authenticated user profile into Supabase.
 */
export async function dbSyncProfile(
  clerkUserId: string,
  fullName: string,
  email: string,
  mobile?: string,
  role: "vendor" | "admin" = "vendor"
) {
  return callRpc("api_sync_profile", {
    p_clerk_user_id: clerkUserId,
    p_full_name: fullName,
    p_email: email,
    p_mobile: mobile || null,
    p_role: role,
  });
}

/**
 * Retrieves a user profile by stable Clerk user ID.
 */
export async function dbGetProfile(clerkUserId: string) {
  return callRpc("api_get_profile", {
    p_clerk_user_id: clerkUserId,
  });
}

/**
 * Retrieves all applications owned by a Clerk user ID.
 */
export async function dbGetVendorApplications(
  clerkUserId: string
): Promise<VendorApplication[]> {
  const res = await callRpc<VendorApplication[]>(
    "api_get_vendor_applications",
    {
      p_clerk_user_id: clerkUserId,
    }
  );
  return Array.isArray(res) ? res : [];
}

/**
 * Retrieves a single application by its Application Number or ID.
 */
export async function dbGetApplicationByNumber(
  appNumberOrId: string
): Promise<VendorApplication | null> {
  if (!appNumberOrId) return null;
  const res = await callRpc<VendorApplication | null>(
    "api_get_application_by_number",
    {
      p_app_number: appNumberOrId,
    }
  );
  return res || null;
}

/**
 * Retrieves all applications for administrative review.
 */
export async function dbGetAllApplications(): Promise<VendorApplication[]> {
  const res = await callRpc<VendorApplication[]>(
    "api_admin_get_all_applications",
    {}
  );
  return Array.isArray(res) ? res : [];
}

/**
 * Saves or updates a vendor application in Supabase.
 */
export async function dbSaveVendorApplication(
  application: VendorApplication
): Promise<VendorApplication> {
  if (isDemoOrMockApplication(application)) {
    console.warn(
      `[DATABASE INTEGRITY] Blocked attempt to save mock/synthetic application to Supabase: ${application.id || application.applicationNumber}`
    );
    return application;
  }

  const res = await callRpc<VendorApplication>(
    "api_save_vendor_application",
    {
      p_payload: application,
    }
  );
  return res;
}

/**
 * Updates an application from the administrative portal (approval, correction, remarks, payment verification).
 */
export async function dbAdminUpdateApplication(
  appNumber: string,
  updates: Partial<VendorApplication> & {
    remarks?: string;
    action?: string;
    actionBy?: string;
  }
): Promise<VendorApplication> {
  const res = await callRpc<VendorApplication>(
    "api_admin_update_application",
    {
      p_app_number: appNumber,
      p_updates: updates,
    }
  );
  return res;
}

/**
 * Records an entry into the immutable administrative audit logs.
 */
export async function dbAddAuditLog(
  actorUserId: string,
  actorName: string,
  actorRole: string,
  appNumber: string,
  action: string,
  details: Record<string, unknown> = {},
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    await callRpc("api_add_audit_log", {
      p_actor_user_id: actorUserId,
      p_actor_name: actorName,
      p_actor_role: actorRole,
      p_app_number: appNumber,
      p_action: action,
      p_details: details,
      p_ip: ipAddress || null,
      p_user_agent: userAgent || null,
    });
    return true;
  } catch (err) {
    console.error("Failed to write audit log to Supabase:", err);
    return false;
  }
}

/**
 * Retrieves notifications for a user or admin.
 */
export async function dbGetNotifications(userId: string) {
  try {
    const res = await callRpc<Record<string, unknown>[]>("api_get_notifications", {
      p_user_id: userId,
    });
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.error("Failed to get notifications from Supabase:", err);
    return [];
  }
}

/**
 * Creates a notification in Supabase.
 */
export async function dbCreateNotification(
  recipientUserId: string,
  appNumber: string,
  title: string,
  message: string,
  type = "system",
  category = "application",
  priority = "normal",
  actionLabel?: string,
  actionUrl?: string
) {
  try {
    return await callRpc("api_create_notification", {
      p_recipient_user_id: recipientUserId,
      p_app_number: appNumber,
      p_title: title,
      p_message: message,
      p_type: type,
      p_category: category,
      p_priority: priority,
      p_action_label: actionLabel || null,
      p_action_url: actionUrl || null,
    });
  } catch (err) {
    console.error("Failed to create notification in Supabase:", err);
    return null;
  }
}

/**
 * Marks a notification as read in Supabase.
 */
export async function dbMarkNotificationRead(notificationId: string): Promise<boolean> {
  try {
    await callRpc("api_mark_notification_read", {
      p_id: notificationId,
    });
    return true;
  } catch (err) {
    console.error("Failed to mark notification read in Supabase:", err);
    return false;
  }
}

/**
 * Soft-deletes / archives a vendor application in Supabase PostgreSQL database
 * preserving historical records, documents, payments, and audit logs.
 */
export async function dbDeleteVendorApplication(
  appNumberOrId: string,
  deletedBy = "Administrator",
  reason = "Archived by Administrator"
): Promise<boolean> {
  if (!appNumberOrId) return false;
  try {
    const res = await callRpc<VendorApplication>("api_admin_delete_application", {
      p_app_number: appNumberOrId,
      p_deleted_by: deletedBy,
      p_reason: reason,
    });
    return Boolean(res);
  } catch (err) {
    console.warn("Supabase dbDeleteVendorApplication error:", err);
    return false;
  }
}

/**
 * Permanently removes a vendor application from Supabase PostgreSQL database.
 * Used when an administrator permanently deletes an archived record.
 * Foreign keys with ON DELETE CASCADE (documents, payments, status history) are removed,
 * while vendor profile and other applications belonging to the vendor remain intact.
 */
export async function dbPermanentDeleteApplication(
  appNumberOrId: string
): Promise<boolean> {
  if (!appNumberOrId) return false;
  try {
    const res = await callRpc<{ success: boolean; error?: string }>(
      "api_admin_permanent_delete_application",
      {
        p_app_number: appNumberOrId,
      }
    );
    return Boolean(res?.success);
  } catch (err) {
    console.warn("Supabase dbPermanentDeleteApplication error:", err);
    return false;
  }
}


