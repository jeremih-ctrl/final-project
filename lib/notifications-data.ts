/**
 * Notifications Data Model & Reactive Store
 *
 * Provides shared notification types, storage persistence, and reactive hooks
 * for both admin-side and vendor-side notification portals.
 * UI-only and mock-state based. No backend or database is used.
 */

"use client";

import { useSyncExternalStore, useMemo, useCallback } from "react";

export type NotificationCategory =
  | "application"
  | "correction"
  | "document"
  | "approval"
  | "rejection"
  | "system";

export type AdminNotificationType =
  | "new-application"
  | "correction-submitted"
  | "correction-requested"
  | "application-approved"
  | "application-rejected"
  | "document-uploaded"
  | "document-verified"
  | "document-replacement"
  | "system";

export type VendorNotificationType =
  | "application-submitted"
  | "correction-requested"
  | "correction-submitted"
  | "application-approved"
  | "application-rejected"
  | "document-received"
  | "document-verified"
  | "document-replacement"
  | "system";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  fullMessage?: string;
  applicationId?: string;
  applicationNumber: string;
  vendorName: string;
  status: string;
  read: boolean;
  createdAt: string;
  href?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority?: "high" | "normal";
  timeAgo?: string;
}

export interface VendorNotification {
  id: string;
  type: VendorNotificationType;
  title: string;
  message: string;
  fullMessage?: string;
  applicationId?: string;
  applicationNumber: string;
  vendorName?: string;
  vendorId?: string;
  status: string;
  remarks?: string;
  read: boolean;
  createdAt: string;
  href?: string;
  actionLabel?: string;
  actionUrl?: string;
  priority?: "high" | "normal";
  timeAgo?: string;
}

export const ADMIN_NOTIFICATIONS_STORAGE_KEY = "bvr_admin_notifications_v1";
export const VENDOR_NOTIFICATIONS_STORAGE_KEY = "bvr_vendor_notifications_v1";
export const ADMIN_NOTIFICATIONS_UPDATED_EVENT = "bvr_admin_notifications_updated";
export const VENDOR_NOTIFICATIONS_UPDATED_EVENT = "bvr_vendor_notifications_updated";

/** Helper to categorize notification types */
export function getCategoryForType(type: string): NotificationCategory {
  switch (type) {
    case "new-application":
    case "application-submitted":
      return "application";
    case "correction-submitted":
    case "correction-requested":
      return "correction";
    case "document-uploaded":
    case "document-received":
    case "document-verified":
    case "document-replacement":
      return "document";
    case "application-approved":
      return "approval";
    case "application-rejected":
      return "rejection";
    default:
      return "system";
  }
}

/**
 * Safely parses various date formats (ISO-8601, unix ms, Date instances, or strings with bullets)
 * Returns a valid Date or null if missing or invalid.
 */
export function parseDateSafely(
  dateInput?: string | Date | number | null
): Date | null {
  if (dateInput === null || dateInput === undefined || dateInput === "") {
    return null;
  }
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === "number") {
    if (isNaN(dateInput) || dateInput <= 0) return null;
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Standard Date parsing (ISO-8601 strings, UTC/GMT)
    const directDate = new Date(trimmed);
    if (!isNaN(directDate.getTime())) {
      return directDate;
    }

    // Handles formatted strings containing bullets like "Oct 10, 2026 • 4:30 PM"
    const cleaned = trimmed.replace(/[•·|]/g, " ").replace(/\s+/g, " ").trim();
    const cleanedDate = new Date(cleaned);
    if (!isNaN(cleanedDate.getTime())) {
      return cleanedDate;
    }
  }
  return null;
}

/**
 * Calculates an independent relative time string for each notification.
 * Output examples: "Just now", "5 minutes ago", "2 hours ago", "Yesterday", "3 days ago", "2 weeks ago".
 * Safely displays "Date unavailable" if the timestamp is missing or unparseable.
 */
export function formatRelativeTime(
  dateInput?: string | Date | number | null,
  nowInput: number = Date.now()
): string {
  const date = parseDateSafely(dateInput);
  if (!date) {
    return "Date unavailable";
  }

  const time = date.getTime();
  const diffInMs = nowInput - time;

  // Immediate or future timestamps
  if (diffInMs < 0 || diffInMs < 60 * 1000) {
    return "Just now";
  }

  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  }

  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}

/** Realistic initial admin notifications */
export function createInitialAdminNotifications(
  refTime: number = Date.now()
): AdminNotification[] {
  return [
    {
      id: "adm-notif-1",
      type: "new-application",
      title: "New Vendor Application Submitted",
      message:
        "A new vendor registration application has been submitted and is ready for review.",
      fullMessage:
        "A new vendor registration has been submitted by Juan Dela Cruz for Juan's Food Stall in Baan KM 3. Queued for evaluation.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Submitted",
      read: false,
      createdAt: new Date(refTime - 5 * 60 * 1000).toISOString(),
      actionLabel: "Review Application",
      actionUrl: "/admin/applications/BVR-2026-001248",
      href: "/admin/applications/BVR-2026-001248",
      priority: "high",
    },
    {
      id: "adm-notif-2",
      type: "correction-submitted",
      title: "Application Resubmitted for Review",
      message: "The vendor has submitted the requested corrections for review.",
      fullMessage:
        "Vendor Juan Dela Cruz submitted corrected street address and replacement PhilSys ID for application BVR-2026-001248.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Under Review",
      read: false,
      createdAt: new Date(refTime - 18 * 60 * 1000).toISOString(),
      actionLabel: "Review Application",
      actionUrl: "/admin/applications/BVR-2026-001248",
      href: "/admin/applications/BVR-2026-001248",
      priority: "high",
    },
    {
      id: "adm-notif-3",
      type: "document-uploaded",
      title: "Government ID Submitted for Verification",
      message:
        "A government ID has been submitted and is ready for verification.",
      fullMessage:
        "Uploaded credential philsys_national_id.jpg attached to BVR-2026-001248 is queued for document validity inspection.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Under Review",
      read: true,
      createdAt: new Date(refTime - 3 * 60 * 60 * 1000).toISOString(),
      actionLabel: "Review Documents",
      actionUrl: "/admin/documents",
      href: "/admin/documents",
      priority: "normal",
    },
    {
      id: "adm-notif-4",
      type: "new-application",
      title: "New Vendor Application Submitted",
      message:
        "A new vendor registration application has been submitted and is ready for review.",
      fullMessage:
        "A new vendor registration has been submitted by Maria Santos for Maria's Sari-Sari Store.",
      applicationNumber: "BVR-2026-001247",
      vendorName: "Maria's Sari-Sari Store",
      status: "Approved",
      read: true,
      createdAt: new Date(refTime - 25 * 60 * 60 * 1000).toISOString(),
      actionLabel: "Review Application",
      actionUrl: "/admin/applications/BVR-2026-001247",
      href: "/admin/applications/BVR-2026-001247",
      priority: "normal",
    },
    {
      id: "adm-notif-5",
      type: "new-application",
      title: "New Vendor Application Submitted",
      message:
        "A new vendor registration application has been submitted and is ready for review.",
      fullMessage:
        "A new vendor registration has been submitted by Pedro Penduko for Pedro BBQ.",
      applicationNumber: "BVR-2026-001246",
      vendorName: "Pedro BBQ",
      status: "Needs Correction",
      read: true,
      createdAt: new Date(refTime - 49 * 60 * 60 * 1000).toISOString(),
      actionLabel: "Review Application",
      actionUrl: "/admin/applications/BVR-2026-001246",
      href: "/admin/applications/BVR-2026-001246",
      priority: "normal",
    },
  ];
}

/** Realistic initial vendor notifications */
export function createInitialVendorNotifications(
  refTime: number = Date.now()
): VendorNotification[] {
  return [
    {
      id: "v-notif-1",
      type: "correction-requested",
      title: "Action Required: Application Correction",
      message:
        "Your vendor registration application requires corrections before it can be approved.",
      fullMessage:
        "An administrator has reviewed application BVR-2026-001248 and requested corrections. Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
      remarks:
        "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Needs Correction",
      read: false,
      createdAt: new Date(refTime - 15 * 60 * 1000).toISOString(),
      actionLabel: "Review Application",
      actionUrl: "/dashboard/my-application/correction",
      href: "/dashboard/my-application/correction",
      priority: "high",
    },
    {
      id: "v-notif-2",
      type: "document-replacement",
      title: "Government ID Replacement Required",
      message:
        "The submitted government ID could not be verified. Please provide a valid replacement document.",
      fullMessage:
        "The submitted government ID image for application BVR-2026-001248 was blurry or unreadable. Please upload a clear photo of your ID.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Needs Correction",
      read: false,
      createdAt: new Date(refTime - 3 * 60 * 60 * 1000).toISOString(),
      actionLabel: "Update Documents",
      actionUrl: "/dashboard/my-application/correction",
      href: "/dashboard/my-application/correction",
      priority: "high",
    },
    {
      id: "v-notif-3",
      type: "application-submitted",
      title: "Application Submitted",
      message:
        "Your vendor registration application BVR-2026-001248 has been received by the City Government of Butuan Licensing Office.",
      fullMessage:
        "Your vendor registration application BVR-2026-001248 has been received and entered the administrative queue.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Submitted",
      read: true,
      createdAt: new Date(refTime - 25 * 60 * 60 * 1000).toISOString(),
      actionLabel: "View Application Status",
      actionUrl: "/application-status",
      href: "/application-status",
      priority: "normal",
    },
    {
      id: "v-notif-4",
      type: "system",
      title: "Welcome to Butuan Vendor Portal",
      message:
        "Welcome to the official online vendor registration portal of Butuan City, Agusan del Norte.",
      fullMessage:
        "Welcome to the official vendor registry of Butuan City. Your vendor account has been initialized.",
      applicationNumber: "BVR-2026-001248",
      vendorName: "Juan's Food Stall",
      status: "Active",
      read: true,
      createdAt: new Date(refTime - 49 * 60 * 60 * 1000).toISOString(),
      actionLabel: "Go to Dashboard",
      actionUrl: "/dashboard",
      href: "/dashboard",
      priority: "normal",
    },
  ];
}

export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] =
  createInitialAdminNotifications();

export const INITIAL_VENDOR_NOTIFICATIONS: VendorNotification[] =
  createInitialVendorNotifications();

export const VENDOR_PRESET_TEMPLATES: Record<string, VendorNotification> = {
  submitted: INITIAL_VENDOR_NOTIFICATIONS[2],
  "correction-requested": INITIAL_VENDOR_NOTIFICATIONS[0],
  "correction-submitted": {
    id: "v-preset-corr-sub",
    type: "correction-submitted",
    title: "Application Resubmitted for Review",
    message: "Your application corrections have been submitted for review.",
    fullMessage:
      "Your application corrections have been received. Administrative review has resumed.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    status: "Under Review",
    read: false,
    createdAt: new Date().toISOString(),
    actionLabel: "View Application",
    actionUrl: "/dashboard/my-application",
    href: "/dashboard/my-application",
    priority: "normal",
  },
  approved: {
    id: "v-preset-approved",
    type: "application-approved",
    title: "Vendor Registration Approved",
    message:
      "Your vendor registration application has been approved by the City Government of Butuan.",
    fullMessage:
      "Congratulations! Your vendor registration application BVR-2026-001248 has been approved. Official Vendor ID BUT-V-001248 issued.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    vendorId: "BUT-V-001248",
    status: "Approved",
    read: false,
    createdAt: new Date().toISOString(),
    actionLabel: "View Application",
    actionUrl: "/dashboard/my-application",
    href: "/dashboard/my-application",
    priority: "high",
  },
  rejected: {
    id: "v-preset-rejected",
    type: "application-rejected",
    title: "Vendor Registration Application Rejected",
    message:
      "Your vendor registration application has been reviewed and rejected.",
    fullMessage:
      "Your application was not approved during administrative review. Remarks: Outside municipal zoning.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    status: "Rejected",
    read: false,
    createdAt: new Date().toISOString(),
    actionLabel: "View Application",
    actionUrl: "/dashboard/my-application",
    href: "/dashboard/my-application",
    priority: "high",
  },
};

// ─── Admin Notifications Store Operations ─────────────────────────────────────

let adminCache: AdminNotification[] | null = null;
let lastAdminRaw: string | null = null;

export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === "undefined") {
    return INITIAL_ADMIN_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(ADMIN_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        ADMIN_NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_ADMIN_NOTIFICATIONS)
      );
      adminCache = INITIAL_ADMIN_NOTIFICATIONS;
      lastAdminRaw = JSON.stringify(INITIAL_ADMIN_NOTIFICATIONS);
      return adminCache;
    }
    if (raw === lastAdminRaw && adminCache !== null) {
      return adminCache;
    }
    const parsed = JSON.parse(raw);
    adminCache = Array.isArray(parsed) ? parsed : INITIAL_ADMIN_NOTIFICATIONS;
    lastAdminRaw = raw;
    return adminCache;
  } catch {
    return INITIAL_ADMIN_NOTIFICATIONS;
  }
}

export function saveAdminNotifications(list: AdminNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    adminCache = list;
    lastAdminRaw = JSON.stringify(list);
    localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, lastAdminRaw);
    window.dispatchEvent(
      new CustomEvent(ADMIN_NOTIFICATIONS_UPDATED_EVENT, { detail: list })
    );
  } catch (err) {
    console.error("Failed to save admin notifications:", err);
  }
}

export function addAdminNotification(
  notif: Omit<AdminNotification, "id" | "createdAt" | "read"> &
    Partial<Pick<AdminNotification, "id" | "createdAt" | "read">>
): AdminNotification {
  const current = getAdminNotifications();
  const newItem: AdminNotification = {
    id: notif.id || `adm-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: notif.createdAt || new Date().toISOString(),
    read: notif.read ?? false,
    href: notif.href || notif.actionUrl,
    actionUrl: notif.actionUrl || notif.href,
    ...notif,
  };
  const updated = [newItem, ...current];
  saveAdminNotifications(updated);
  return newItem;
}

export function markAdminNotificationAsRead(id: string): void {
  const current = getAdminNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveAdminNotifications(updated);
}

export function markAllAdminNotificationsAsRead(): void {
  const current = getAdminNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveAdminNotifications(updated);
}

export function resetAdminNotifications(): void {
  const fresh = createInitialAdminNotifications(Date.now());
  saveAdminNotifications(fresh);
}

// ─── Vendor Notifications Store Operations ────────────────────────────────────

let vendorCache: VendorNotification[] | null = null;
let lastVendorRaw: string | null = null;

export function getAllVendorNotifications(): VendorNotification[] {
  if (typeof window === "undefined") {
    return INITIAL_VENDOR_NOTIFICATIONS;
  }
  try {
    const raw = localStorage.getItem(VENDOR_NOTIFICATIONS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(
        VENDOR_NOTIFICATIONS_STORAGE_KEY,
        JSON.stringify(INITIAL_VENDOR_NOTIFICATIONS)
      );
      vendorCache = INITIAL_VENDOR_NOTIFICATIONS;
      lastVendorRaw = JSON.stringify(INITIAL_VENDOR_NOTIFICATIONS);
      return vendorCache;
    }
    if (raw === lastVendorRaw && vendorCache !== null) {
      return vendorCache;
    }
    const parsed = JSON.parse(raw);
    vendorCache = Array.isArray(parsed) ? parsed : INITIAL_VENDOR_NOTIFICATIONS;
    lastVendorRaw = raw;
    return vendorCache;
  } catch {
    return INITIAL_VENDOR_NOTIFICATIONS;
  }
}

export function getVendorNotifications(
  applicationNumber?: string
): VendorNotification[] {
  const all = getAllVendorNotifications();
  if (applicationNumber) {
    return all.filter(
      (n) => !n.applicationNumber || n.applicationNumber === applicationNumber
    );
  }
  return all;
}

export function saveVendorNotifications(list: VendorNotification[]): void {
  if (typeof window === "undefined") return;
  try {
    vendorCache = list;
    lastVendorRaw = JSON.stringify(list);
    localStorage.setItem(VENDOR_NOTIFICATIONS_STORAGE_KEY, lastVendorRaw);
    window.dispatchEvent(
      new CustomEvent(VENDOR_NOTIFICATIONS_UPDATED_EVENT, { detail: list })
    );
  } catch (err) {
    console.error("Failed to save vendor notifications:", err);
  }
}

export function addVendorNotification(
  notif: Omit<VendorNotification, "id" | "createdAt" | "read"> &
    Partial<Pick<VendorNotification, "id" | "createdAt" | "read">>
): VendorNotification {
  const current = getAllVendorNotifications();
  const newItem: VendorNotification = {
    id: notif.id || `v-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: notif.createdAt || new Date().toISOString(),
    read: notif.read ?? false,
    href: notif.href || notif.actionUrl,
    actionUrl: notif.actionUrl || notif.href,
    ...notif,
  };
  const updated = [newItem, ...current];
  saveVendorNotifications(updated);
  return newItem;
}

export function markVendorNotificationAsRead(id: string): void {
  const current = getAllVendorNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveVendorNotifications(updated);
}

export function markAllVendorNotificationsAsRead(): void {
  const current = getAllVendorNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveVendorNotifications(updated);
}

export function resetVendorNotifications(): void {
  const fresh = createInitialVendorNotifications(Date.now());
  saveVendorNotifications(fresh);
}

// ─── React Hooks ──────────────────────────────────────────────────────────────

function subscribeAdmin(callback: () => void): () => void {
  const handler = () => {
    adminCache = null;
    callback();
  };
  window.addEventListener(ADMIN_NOTIFICATIONS_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(ADMIN_NOTIFICATIONS_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getAdminSnapshot(): AdminNotification[] {
  return getAdminNotifications();
}

function getAdminServerSnapshot(): AdminNotification[] {
  return INITIAL_ADMIN_NOTIFICATIONS;
}

export function useAdminNotifications() {
  const notifications = useSyncExternalStore(
    subscribeAdmin,
    getAdminSnapshot,
    getAdminServerSnapshot
  );

  const markAsRead = useCallback((id: string) => {
    markAdminNotificationAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllAdminNotificationsAsRead();
  }, []);

  const reset = useCallback(() => {
    resetAdminNotifications();
  }, []);

  const add = useCallback((notif: Parameters<typeof addAdminNotification>[0]) => {
    return addAdminNotification(notif);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reset,
    addNotification: add,
  };
}

function subscribeVendor(callback: () => void): () => void {
  const handler = () => {
    vendorCache = null;
    callback();
  };
  window.addEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(VENDOR_NOTIFICATIONS_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

function getVendorSnapshot(): VendorNotification[] {
  return getAllVendorNotifications();
}

function getVendorServerSnapshot(): VendorNotification[] {
  return INITIAL_VENDOR_NOTIFICATIONS;
}

export function useVendorNotifications(appNumber?: string) {
  const allNotifications = useSyncExternalStore(
    subscribeVendor,
    getVendorSnapshot,
    getVendorServerSnapshot
  );

  const notifications = useMemo(() => {
    if (!appNumber) return allNotifications;
    return allNotifications.filter(
      (n) => !n.applicationNumber || n.applicationNumber === appNumber
    );
  }, [allNotifications, appNumber]);

  const markAsRead = useCallback((id: string) => {
    markVendorNotificationAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    markAllVendorNotificationsAsRead();
  }, []);

  const reset = useCallback(() => {
    resetVendorNotifications();
  }, []);

  const add = useCallback((notif: Parameters<typeof addVendorNotification>[0]) => {
    return addVendorNotification(notif);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reset,
    addNotification: add,
  };
}
