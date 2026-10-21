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
  | "payment-submitted"
  | "correction-submitted"
  | "correction-requested"
  | "application-approved"
  | "application-rejected"
  | "document-uploaded"
  | "document-verified"
  | "document-replacement"
  | "payment-verified"
  | "payment-rejected"
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
  | "payment-verified"
  | "payment-rejected"
  | "application-status-updated"
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
    case "payment-submitted":
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

/** Initial admin notifications: strictly empty to avoid fabricated records */
export function createInitialAdminNotifications(): AdminNotification[] {
  return [];
}

/** Initial vendor notifications: strictly empty to avoid fabricated records */
export function createInitialVendorNotifications(): VendorNotification[] {
  return [];
}

export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] = [];

export const INITIAL_VENDOR_NOTIFICATIONS: VendorNotification[] = [];

export const VENDOR_PRESET_TEMPLATES: Record<string, VendorNotification> = {
  submitted: {
    id: "v-preset-submitted",
    type: "application-submitted",
    title: "Application Submitted",
    message:
      "Your vendor registration application has been received by the City Government of Butuan Licensing Office.",
    fullMessage:
      "Your vendor registration application has been received and entered the administrative queue.",
    applicationNumber: "",
    vendorName: "",
    status: "Submitted",
    read: true,
    createdAt: new Date().toISOString(),
    actionLabel: "View Application Status",
    actionUrl: "/application-status",
    href: "/application-status",
    priority: "normal",
  },
  "correction-requested": {
    id: "v-preset-corr-req",
    type: "correction-requested",
    title: "Action Required: Application Correction",
    message:
      "Your vendor registration application requires corrections before it can be approved.",
    fullMessage:
      "An administrator has reviewed your application and requested corrections. Please provide the required information.",
    remarks:
      "Please review the administrator remarks and submit requested corrections.",
    applicationNumber: "",
    vendorName: "",
    status: "Needs Correction",
    read: false,
    createdAt: new Date().toISOString(),
    actionLabel: "Review Application",
    actionUrl: "/dashboard/my-application/correction",
    href: "/dashboard/my-application/correction",
    priority: "high",
  },
  "correction-submitted": {
    id: "v-preset-corr-sub",
    type: "correction-submitted",
    title: "Application Resubmitted for Review",
    message: "Your application corrections have been submitted for review.",
    fullMessage:
      "Your application corrections have been received. Administrative review has resumed.",
    applicationNumber: "",
    vendorName: "",
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
      "Congratulations! Your vendor registration application has been approved.",
    applicationNumber: "",
    vendorName: "",
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
      "Your application was not approved during administrative review.",
    applicationNumber: "",
    vendorName: "",
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
    const valid = Array.isArray(parsed)
      ? parsed.filter((n: AdminNotification) => {
          const appNum = (n.applicationNumber || "").toLowerCase();
          const name = (n.vendorName || "").toLowerCase();
          const msg = (n.fullMessage || n.message || "").toLowerCase();
          if (
            appNum.includes("001248") ||
            appNum.includes("001247") ||
            appNum.includes("001246") ||
            appNum.includes("000003") ||
            appNum.includes("bvr-test-") ||
            appNum.includes("001251") ||
            appNum.includes("001252")
          ) {
            return false;
          }
          if (name.includes("santos") || name.includes("juan") || name.includes("pedro") || name.includes("synthetic")) {
            return false;
          }
          if (msg.includes("maria santos") || msg.includes("juan dela cruz") || msg.includes("pedro")) {
            return false;
          }
          return true;
        })
      : [];
    adminCache = valid;
    lastAdminRaw = JSON.stringify(valid);
    localStorage.setItem(ADMIN_NOTIFICATIONS_STORAGE_KEY, lastAdminRaw);
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
  const fresh = createInitialAdminNotifications();
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
    const valid = Array.isArray(parsed)
      ? parsed.filter((n: VendorNotification) => {
          const appNum = (n.applicationNumber || "").toLowerCase();
          const name = (n.vendorName || "").toLowerCase();
          const msg = (n.fullMessage || n.message || "").toLowerCase();
          if (
            appNum.includes("001248") ||
            appNum.includes("001247") ||
            appNum.includes("001246") ||
            appNum.includes("000003") ||
            appNum.includes("bvr-test-") ||
            appNum.includes("001251") ||
            appNum.includes("001252")
          ) {
            return false;
          }
          if (name.includes("santos") || name.includes("juan") || name.includes("pedro") || name.includes("synthetic")) {
            return false;
          }
          if (msg.includes("maria santos") || msg.includes("juan dela cruz") || msg.includes("pedro")) {
            return false;
          }
          return true;
        })
      : [];
    vendorCache = valid;
    lastVendorRaw = JSON.stringify(valid);
    localStorage.setItem(VENDOR_NOTIFICATIONS_STORAGE_KEY, lastVendorRaw);
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
  const fresh = createInitialVendorNotifications();
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
