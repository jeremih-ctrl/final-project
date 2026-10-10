/**
 * Vendor Application State & Centralized Application Store
 *
 * Provides the shared, canonical application model connecting the Vendor Portal
 * and Admin Portal. Both portals read and write to this single source of truth.
 *
 * Stored in localStorage and synchronized via window events and storage listeners.
 */

"use client";

import { useSyncExternalStore, useCallback } from "react";
import {
  INITIAL_VENDOR_NOTIFICATIONS,
  VendorNotification,
} from "./notifications-data";

// ─── Status Types ─────────────────────────────────────────────────────────────

export type VendorAppStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "needs-correction"
  | "correction-submitted"
  | "approved"
  | "rejected";

export type AdminApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Needs Correction"
  | "Correction Submitted"
  | "Approved"
  | "Rejected";

// ─── Data Models ──────────────────────────────────────────────────────────────

export interface ActivityEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  dotColor?: "emerald" | "amber" | "orange" | "blue" | "rose" | "slate";
  type?: "submission" | "review" | "correction" | "approval" | "rejection";
}

export interface CorrectionField {
  field: string;
  label: string;
  reason: string;
}

export interface SharedApplicationDocument {
  id: string;
  filename: string;
  idType: string;
  uploadedAt: string;
  status: "Submitted" | "Verified" | "Replacement Requested" | "Accepted";
  submitted: boolean;
  fileSize?: string;
}

export interface SharedVendorInfo {
  id: string; // "BUT-V-001248"
  name: string; // "Juan Dela Cruz"
  businessName: string; // "Juan's Food Stall"
  email: string; // "juan@email.com"
  phone: string; // "09XXXXXXXXX"
}

export interface SharedBusinessInfo {
  name?: string;
  businessName?: string;
  category: string;
  address: string;
  barangay: string;
  description?: string;
  houseNumber: string;
  street: string;
  city: string;
  province: string;
  region: string;
  country: string;
}

export interface SharedApplication {
  // Canonical identifiers
  id: string; // "BVR-2026-001248"
  applicationNumber: string; // alias for id
  vendorId: string; // "BUT-V-001248"

  // Nested information model (Requirement 2)
  vendor: SharedVendorInfo;
  business: SharedBusinessInfo;

  // Status (stored canonically in kebab-case)
  status: VendorAppStatus;
  adminStatus: AdminApplicationStatus;

  // Verification & Stage models
  verificationStatus?: "Verified" | "Pending" | "Not Verified";
  isVerified?: boolean;
  currentStage?: number;

  // Timestamps
  submittedAt: string;
  submittedDate: string;
  updatedAt: string;
  lastUpdatedText: string;

  // Documents
  documents: SharedApplicationDocument[];
  governmentIdDoc?: SharedApplicationDocument;
  governmentIdStatus?: "Submitted" | "Verified" | "Needs Replacement";

  // Remarks & Corrections
  adminRemarks: string;
  administratorRemarks: string; // alias
  correctionItems: CorrectionField[];
  correctionFields: CorrectionField[]; // alias
  correctionDate: string | null;

  // Activity Log
  activity: ActivityEntry[];

  // Backwards-compatible flat fields
  businessName: string;
  ownerName: string;
  contactNumber: string;
  email: string;
  barangay: string;
  houseNumber: string;
  street: string;
  city: string;
  province: string;
  region: string;
  country: string;
}

/** Legacy interface alias for backwards compatibility */
export type VendorApplicationState = SharedApplication;

// ─── Canonical Initial Application Data ───────────────────────────────────────

export const INITIAL_APPLICATION: SharedApplication = {
  id: "BVR-2026-001248",
  applicationNumber: "BVR-2026-001248",
  vendorId: "BUT-V-001248",

  vendor: {
    id: "BUT-V-001248",
    name: "Maria Santos",
    businessName: "Montilla Street Produce & Snacks",
    email: "maria.santos@email.com",
    phone: "09181234567",
  },

  business: {
    name: "Montilla Street Produce & Snacks",
    businessName: "Montilla Street Produce & Snacks",
    category: "Produce & Snacks / Market Stall",
    address: "Montilla Boulevard, Barangay Urduja, Butuan City",
    barangay: "Barangay Urduja",
    description: "Produce, local snacks, and fresh goods in Butuan City.",
    houseNumber: "123",
    street: "Montilla Boulevard",
    city: "Butuan City",
    province: "Agusan del Norte",
    region: "Caraga",
    country: "Philippines",
  },

  status: "under-review",
  adminStatus: "Under Review",
  verificationStatus: "Pending",
  isVerified: false,
  currentStage: 2,

  submittedAt: "October 6, 2026 • 9:30 AM",
  submittedDate: "October 6, 2026",
  updatedAt: "October 6, 2026 • 9:30 AM",
  lastUpdatedText: "Submitted Oct 6, 2026 • 9:30 AM",

  documents: [
    {
      id: "DOC-2026-BVR-001248",
      filename: "government-id.pdf",
      idType: "Philippine National ID (PhilSys)",
      uploadedAt: "October 6, 2026",
      status: "Replacement Requested",
      submitted: true,
      fileSize: "2.4 MB",
    },
  ],

  governmentIdDoc: {
    id: "DOC-2026-BVR-001248",
    filename: "government-id.pdf",
    idType: "Philippine National ID (PhilSys)",
    uploadedAt: "October 6, 2026",
    status: "Replacement Requested",
    submitted: true,
    fileSize: "2.4 MB",
  },
  governmentIdStatus: "Submitted",

  adminRemarks:
    "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
  administratorRemarks:
    "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",

  correctionDate: "October 6, 2026 • 2:45 PM",
  correctionItems: [
    {
      field: "street",
      label: "Street / Business Address",
      reason: "Please provide the complete street address (e.g., include Ave., St., Road).",
    },
    {
      field: "governmentId",
      label: "Government ID",
      reason: "Please upload a clearer copy of your government ID (the submitted image was unreadable).",
    },
  ],
  correctionFields: [
    {
      field: "street",
      label: "Street / Business Address",
      reason: "Please provide the complete street address (e.g., include Ave., St., Road).",
    },
    {
      field: "governmentId",
      label: "Government ID",
      reason: "Please upload a clearer copy of your government ID (the submitted image was unreadable).",
    },
  ],

  activity: [
    {
      id: "act-3",
      title: "Correction Requested",
      description:
        "Administrator requested corrections to business address and government ID.",
      date: "Oct 6, 2026 • 2:45 PM",
      dotColor: "orange",
      type: "correction",
    },
    {
      id: "act-2",
      title: "Application Submitted",
      description: "Your vendor registration was successfully submitted.",
      date: "Oct 6, 2026 • 9:30 AM",
      dotColor: "emerald",
      type: "submission",
    },
    {
      id: "act-1",
      title: "Application Created",
      description: "Initial application draft created.",
      date: "Oct 6, 2026 • 9:15 AM",
      dotColor: "slate",
      type: "submission",
    },
  ],

  // Flat field aliases
  businessName: "Montilla Street Produce & Snacks",
  ownerName: "Maria Santos",
  contactNumber: "09181234567",
  email: "maria.santos@email.com",
  barangay: "Barangay Urduja",
  houseNumber: "123",
  street: "Montilla Boulevard",
  city: "Butuan City",
  province: "Agusan del Norte",
  region: "Caraga",
  country: "Philippines",
};

/** Alias for existing code expecting MOCK_VENDOR_APPLICATION */
export const MOCK_VENDOR_APPLICATION: SharedApplication = INITIAL_APPLICATION;

/** Demo states for mock switchers */
export const DEMO_STATES: { label: string; status: VendorAppStatus; buttonClass: string }[] = [
  { label: "Draft", status: "draft", buttonClass: "bg-slate-600 text-white" },
  { label: "Submitted", status: "submitted", buttonClass: "bg-blue-600 text-white" },
  { label: "Under Review", status: "under-review", buttonClass: "bg-amber-600 text-white" },
  { label: "Needs Correction", status: "needs-correction", buttonClass: "bg-orange-600 text-white" },
  {
    label: "Correction Submitted",
    status: "correction-submitted",
    buttonClass: "bg-blue-700 text-white",
  },
  { label: "Approved", status: "approved", buttonClass: "bg-emerald-600 text-white" },
  { label: "Rejected", status: "rejected", buttonClass: "bg-slate-800 text-white" },
];

// ─── Status Normalization Helpers ─────────────────────────────────────────────

export function normalizeStatus(status: string): VendorAppStatus {
  if (!status) return "under-review";
  const s = status.toLowerCase().trim().replace(/_/g, "-").replace(/\s+/g, "-");
  switch (s) {
    case "draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "under-review":
    case "underreview":
      return "under-review";
    case "needs-correction":
    case "needscorrection":
    case "correction-requested":
      return "needs-correction";
    case "correction-submitted":
    case "correctionsubmitted":
      return "correction-submitted";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    default:
      return "under-review";
  }
}

export function statusToAdminLabel(status: string): AdminApplicationStatus {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under-review":
      return "Under Review";
    case "needs-correction":
      return "Needs Correction";
    case "correction-submitted":
      return "Correction Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

export function statusToVendorLabel(status: string): string {
  const norm = normalizeStatus(status);
  switch (norm) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Submitted";
    case "under-review":
      return "Under Review";
    case "needs-correction":
      return "Needs Correction";
    case "correction-submitted":
      return "Correction Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
  }
}

// ─── LocalStorage & Centralized Synchronization ───────────────────────────────

export const SHARED_APP_STORAGE_KEY = "butuan_vendor_application_bvr_2026_001248";
export const SHARED_APP_STATUS_KEY = "bvr_shared_app_state";
export const APP_UPDATED_EVENT = "bvr_application_state_updated";
export const VENDOR_NOTIFICATIONS_KEY = "bvr_vendor_notifications_v1";

/** Format current time nicely for activity and update stamps */
function formatCurrentTimestamp(): string {
  const d = new Date();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
}

/** Sync notification to vendor notifications list upon status change */
function recordStatusNotification(
  newStatus: VendorAppStatus,
  remarks: string
) {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(VENDOR_NOTIFICATIONS_KEY);
    let list: VendorNotification[] = raw ? JSON.parse(raw) : [...INITIAL_VENDOR_NOTIFICATIONS];

    const timestamp = new Date().toISOString();
    let newNotif: VendorNotification | null = null;

    if (newStatus === "needs-correction") {
      newNotif = {
        id: `v-notif-${Date.now()}`,
        type: "correction-requested",
        title: "Correction Required",
        message: "Your application requires corrections.",
        fullMessage: remarks
          ? `An administrator requested corrections: "${remarks}"`
          : "An administrator requested corrections to your application.",
        applicationNumber: "BVR-2026-001248",
        status: "Needs Correction",
        remarks: remarks || "Please update your application details.",
        read: false,
        createdAt: timestamp,
        timeAgo: "Just now",
        actionLabel: "Review & Correct Application",
        actionUrl: "/dashboard/my-application/correction",
        priority: "high",
      };
    } else if (newStatus === "approved") {
      newNotif = {
        id: `v-notif-${Date.now()}`,
        type: "application-approved",
        title: "Application Approved",
        message: "Your vendor application has been approved.",
        fullMessage:
          "Congratulations! Your vendor registration application BVR-2026-001248 has been approved by the City Government of Butuan. Official Vendor ID BUT-V-001248 has been issued.",
        applicationNumber: "BVR-2026-001248",
        vendorId: "BUT-V-001248",
        status: "Approved",
        read: false,
        createdAt: timestamp,
        timeAgo: "Just now",
        actionLabel: "View Application Status",
        actionUrl: "/application-status",
        priority: "high",
      };
    } else if (newStatus === "rejected") {
      newNotif = {
        id: `v-notif-${Date.now()}`,
        type: "application-rejected",
        title: "Application Rejected",
        message: "Your vendor registration application was not approved.",
        fullMessage: remarks
          ? `Application rejected. Reason: "${remarks}"`
          : "Your vendor registration was rejected during administrative evaluation.",
        applicationNumber: "BVR-2026-001248",
        status: "Rejected",
        remarks: remarks,
        read: false,
        createdAt: timestamp,
        timeAgo: "Just now",
        actionLabel: "View Application Status",
        actionUrl: "/application-status",
        priority: "high",
      };
    } else if (newStatus === "correction-submitted") {
      newNotif = {
        id: `v-notif-${Date.now()}`,
        type: "correction-submitted",
        title: "Corrections Submitted",
        message: "Your corrections have been submitted successfully and are under review.",
        fullMessage:
          "Your corrections for application BVR-2026-001248 were received. The administrative evaluation has resumed.",
        applicationNumber: "BVR-2026-001248",
        status: "Correction Submitted",
        read: false,
        createdAt: timestamp,
        timeAgo: "Just now",
        actionLabel: "Track Application",
        actionUrl: "/application-status",
        priority: "normal",
      };
    } else if (newStatus === "submitted") {
      newNotif = {
        id: `v-notif-${Date.now()}`,
        type: "application-submitted",
        title: "Application Submitted",
        message: "Your vendor registration application was received.",
        fullMessage:
          "Application BVR-2026-001248 has been submitted and entered the administrative queue.",
        applicationNumber: "BVR-2026-001248",
        status: "Submitted",
        read: false,
        createdAt: timestamp,
        timeAgo: "Just now",
        actionLabel: "Track Application",
        actionUrl: "/application-status",
        priority: "normal",
      };
    }

    if (newNotif) {
      list = [newNotif, ...list];
      localStorage.setItem(VENDOR_NOTIFICATIONS_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent("bvr_notifications_updated", { detail: list }));
    }
  } catch (err) {
    console.error("Failed to record status notification:", err);
  }
}

/** Retrieve the current shared application from localStorage or initial state */
export function getSharedApplication(): SharedApplication {
  if (typeof window === "undefined") {
    return INITIAL_APPLICATION;
  }

  try {
    const raw = localStorage.getItem(SHARED_APP_STORAGE_KEY);
    let parsed: Partial<SharedApplication> | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as Partial<SharedApplication>;
      } catch {
        parsed = null;
      }
    }

    // Also check lightweight status state if available
    const rawStatus = localStorage.getItem(SHARED_APP_STATUS_KEY);
    let statusState: {
      status?: AdminApplicationStatus;
      verificationStatus?: "Verified" | "Not Verified" | "Pending";
      isVerified?: boolean;
      currentStage?: number;
    } | null = null;
    if (rawStatus) {
      try {
        statusState = JSON.parse(rawStatus) as {
          status?: AdminApplicationStatus;
          verificationStatus?: "Verified" | "Not Verified" | "Pending";
          isVerified?: boolean;
          currentStage?: number;
        };
      } catch {
        statusState = null;
      }
    }

    if (!parsed && !statusState) {
      // First-time initialize
      localStorage.setItem(SHARED_APP_STORAGE_KEY, JSON.stringify(INITIAL_APPLICATION));
      localStorage.setItem(
        SHARED_APP_STATUS_KEY,
        JSON.stringify({
          status: INITIAL_APPLICATION.adminStatus,
          verificationStatus: INITIAL_APPLICATION.verificationStatus,
          isVerified: INITIAL_APPLICATION.isVerified,
          currentStage: INITIAL_APPLICATION.currentStage,
        })
      );
      return INITIAL_APPLICATION;
    }

    const effectiveStatusRaw = statusState?.status || parsed?.status || INITIAL_APPLICATION.status;
    const normalized = normalizeStatus(effectiveStatusRaw);
    const adminLabel = statusToAdminLabel(normalized);

    let isVerified = statusState?.isVerified ?? parsed?.isVerified ?? false;
    let verificationStatus: "Verified" | "Pending" | "Not Verified" =
      statusState?.verificationStatus ?? parsed?.verificationStatus ?? "Pending";
    let currentStage: number = statusState?.currentStage ?? parsed?.currentStage ?? 2;

    if (normalized === "approved") {
      isVerified = true;
      verificationStatus = "Verified";
      currentStage = 4;
    } else if (normalized === "rejected") {
      isVerified = false;
      verificationStatus = "Not Verified";
      currentStage = 2;
    } else if (normalized === "needs-correction") {
      isVerified = false;
      verificationStatus = "Pending";
      currentStage = 2;
    } else if (normalized === "draft" || normalized === "submitted") {
      isVerified = false;
      verificationStatus = "Pending";
      currentStage = 1;
    } else {
      isVerified = false;
      verificationStatus = "Pending";
      currentStage = 2;
    }

    return {
      ...INITIAL_APPLICATION,
      ...(parsed || {}),
      vendor: {
        ...INITIAL_APPLICATION.vendor,
        ...(parsed?.vendor || {}),
      },
      business: {
        ...INITIAL_APPLICATION.business,
        ...(parsed?.business || {}),
      },
      status: normalized,
      adminStatus: adminLabel,
      verificationStatus,
      isVerified,
      currentStage,
    };
  } catch (err) {
    console.error("Failed to parse shared application from storage:", err);
    return INITIAL_APPLICATION;
  }
}

/** Save updated application into localStorage and notify all listeners */
export function saveSharedApplication(updated: SharedApplication): SharedApplication {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(SHARED_APP_STORAGE_KEY, JSON.stringify(updated));
      localStorage.setItem(
        SHARED_APP_STATUS_KEY,
        JSON.stringify({
          status: updated.adminStatus,
          verificationStatus: updated.verificationStatus,
          isVerified: updated.isVerified,
          currentStage: updated.currentStage,
        })
      );
      window.dispatchEvent(
        new CustomEvent<SharedApplication>(APP_UPDATED_EVENT, { detail: updated })
      );
    } catch (err) {
      console.error("Failed to save shared application:", err);
    }
  }
  return updated;
}

/** Update the application status, update timestamp, create activity log, and notify */
export function setApplicationStatus(
  newStatusRaw: string,
  options?: { adminRemarks?: string }
): SharedApplication {
  const current = getSharedApplication();
  const normalized = normalizeStatus(newStatusRaw);
  const adminLabel = statusToAdminLabel(normalized);
  const nowStamp = formatCurrentTimestamp();

  const remarks =
    options?.adminRemarks !== undefined
      ? options.adminRemarks
      : current.adminRemarks;

  let verificationStatus: "Verified" | "Pending" | "Not Verified" = "Pending";
  let isVerified = false;
  let currentStage = 2;

  if (normalized === "approved") {
    verificationStatus = "Verified";
    isVerified = true;
    currentStage = 4;
  } else if (normalized === "rejected") {
    verificationStatus = "Not Verified";
    isVerified = false;
    currentStage = 2;
  } else if (normalized === "needs-correction") {
    verificationStatus = "Pending";
    isVerified = false;
    currentStage = 2;
  } else if (normalized === "draft" || normalized === "submitted") {
    verificationStatus = "Pending";
    isVerified = false;
    currentStage = 1;
  } else {
    verificationStatus = "Pending";
    isVerified = false;
    currentStage = 2;
  }

  // Create an activity entry
  let activityTitle = `Status updated to ${adminLabel}`;
  let activityDesc = `Application status changed to ${adminLabel}.`;
  let activityType: ActivityEntry["type"] = "review";
  let dotColor: ActivityEntry["dotColor"] = "blue";

  if (normalized === "approved") {
    activityTitle = "Application Approved & Verified";
    activityDesc = "Administrator approved the vendor application. Identity and business verified.";
    activityType = "approval";
    dotColor = "emerald";
  } else if (normalized === "needs-correction") {
    activityTitle = "Correction Requested";
    activityDesc = remarks
      ? `Administrator remarks: "${remarks}"`
      : "Administrator requested corrections.";
    activityType = "correction";
    dotColor = "orange";
  } else if (normalized === "rejected") {
    activityTitle = "Application Rejected";
    activityDesc = remarks
      ? `Administrator reason: "${remarks}"`
      : "Application was rejected during administrative review.";
    activityType = "rejection";
    dotColor = "rose";
  } else if (normalized === "correction-submitted") {
    activityTitle = "Corrections Submitted";
    activityDesc = "Vendor submitted corrected application materials.";
    activityType = "review";
    dotColor = "blue";
  }

  const newActivityItem: ActivityEntry = {
    id: `act-${Date.now()}`,
    title: activityTitle,
    description: activityDesc,
    date: nowStamp,
    dotColor,
    type: activityType,
  };

  const updated: SharedApplication = {
    ...current,
    status: normalized,
    adminStatus: adminLabel,
    verificationStatus,
    isVerified,
    currentStage,
    updatedAt: nowStamp,
    lastUpdatedText: `Updated ${nowStamp}`,
    adminRemarks: remarks,
    administratorRemarks: remarks,
    vendorId: "BUT-V-001248",
    vendor: {
      ...current.vendor,
      id: "BUT-V-001248",
    },
    activity: [newActivityItem, ...(current.activity || [])],
  };

  saveSharedApplication(updated);
  recordStatusNotification(normalized, remarks);
  return updated;
}

/** Update administrator remarks without necessarily changing status */
export function setApplicationRemarks(remarks: string): SharedApplication {
  const current = getSharedApplication();
  const nowStamp = formatCurrentTimestamp();

  const updated: SharedApplication = {
    ...current,
    adminRemarks: remarks,
    administratorRemarks: remarks,
    updatedAt: nowStamp,
    lastUpdatedText: `Remarks updated ${nowStamp}`,
  };

  saveSharedApplication(updated);
  return updated;
}

/** Reset shared application back to default initial state */
export function resetSharedApplication(): SharedApplication {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SHARED_APP_STORAGE_KEY);
    localStorage.removeItem(SHARED_APP_STATUS_KEY);
    lastRaw = null;
    cachedSnapshot = { ...INITIAL_APPLICATION };
  }
  return saveSharedApplication({ ...INITIAL_APPLICATION });
}

// ─── External Store Subscription for useSyncExternalStore ───────────────────

let cachedSnapshot: SharedApplication = INITIAL_APPLICATION;
let lastRaw: string | null = null;

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handleEvent = () => {
    lastRaw = null; // invalidate cache
    callback();
  };
  window.addEventListener(APP_UPDATED_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);
  return () => {
    window.removeEventListener(APP_UPDATED_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
  };
}

function getSnapshot(): SharedApplication {
  if (typeof window === "undefined") {
    return INITIAL_APPLICATION;
  }
  try {
    const raw = localStorage.getItem(SHARED_APP_STORAGE_KEY);
    if (raw === lastRaw && cachedSnapshot !== null) {
      return cachedSnapshot;
    }
    lastRaw = raw;
    cachedSnapshot = getSharedApplication();
    return cachedSnapshot;
  } catch {
    return INITIAL_APPLICATION;
  }
}

function getServerSnapshot(): SharedApplication {
  return INITIAL_APPLICATION;
}

// ─── React Hook: useSharedApplication ─────────────────────────────────────────

export function useSharedApplication() {
  const app = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateStatus = useCallback(
    (newStatus: string, options?: { adminRemarks?: string }) => {
      return setApplicationStatus(newStatus, options);
    },
    []
  );

  const updateRemarks = useCallback((remarks: string) => {
    return setApplicationRemarks(remarks);
  }, []);

  const resetDemo = useCallback(() => {
    return resetSharedApplication();
  }, []);

  return {
    application: app,
    status: app.status,
    adminStatus: app.adminStatus,
    verificationStatus: app.verificationStatus,
    isVerified: app.isVerified,
    currentStage: app.currentStage,
    adminRemarks: app.adminRemarks,
    vendorId: app.vendorId,
    updateStatus,
    updateRemarks,
    resetDemo,
  };
}
