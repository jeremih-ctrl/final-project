/**
 * Notifications Data Model & Mock State (Task 10)
 *
 * Provides shared mock notification types and canonical data for both
 * vendor-side and admin-side notification portals.
 * UI-only and mock-state based. No backend or database is used.
 */

export type NotificationType =
  | "application-submitted"
  | "correction-requested"
  | "correction-submitted"
  | "application-approved"
  | "application-rejected"
  | "document-received"
  | "system";

export interface VendorNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  fullMessage: string;
  applicationNumber: string;
  status: string;
  vendorId?: string;
  remarks?: string;
  read: boolean;
  createdAt: string;
  timeAgo: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: "high" | "normal";
}

export interface AdminNotification {
  id: string;
  type:
    | "new-application"
    | "correction-submitted"
    | "correction-requested"
    | "application-approved"
    | "document-uploaded"
    | "system";
  title: string;
  message: string;
  fullMessage: string;
  applicationNumber: string;
  vendorName: string;
  status: string;
  read: boolean;
  createdAt: string;
  timeAgo: string;
  actionLabel?: string;
  actionUrl?: string;
  priority: "high" | "normal";
}

/** Initial Vendor Notifications */
export const INITIAL_VENDOR_NOTIFICATIONS: VendorNotification[] = [
  {
    id: "v-notif-1",
    type: "correction-requested",
    title: "Correction Required",
    message: "An administrator has requested corrections to your vendor application.",
    fullMessage:
      "Your application was reviewed by the city licensing team and requires updates before it can be approved. Please review the remarks, correct the incomplete business address, and upload a readable copy of your government ID.",
    applicationNumber: "BVR-2026-001248",
    status: "Needs Correction",
    remarks:
      "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
    read: false,
    createdAt: "October 6, 2026 • 2:45 PM",
    timeAgo: "15m ago",
    actionLabel: "Review & Correct Application",
    actionUrl: "/dashboard/my-application/correction",
    priority: "high",
  },
  {
    id: "v-notif-2",
    type: "application-submitted",
    title: "Application Submitted",
    message:
      "Your vendor registration application BVR-2026-001248 has been submitted successfully.",
    fullMessage:
      "Your vendor registration application BVR-2026-001248 has been received by the City Government of Butuan Licensing Office. It has entered the administrative review queue.",
    applicationNumber: "BVR-2026-001248",
    status: "Under Review",
    read: false,
    createdAt: "October 6, 2026 • 9:30 AM",
    timeAgo: "5h ago",
    actionLabel: "View Application Status",
    actionUrl: "/application-status",
    priority: "normal",
  },
  {
    id: "v-notif-3",
    type: "document-received",
    title: "Document Received",
    message:
      "Your Government ID (government-id.pdf) has been attached to application BVR-2026-001248.",
    fullMessage:
      "We have logged the attachment of your PhilSys National ID (government-id.pdf) for application BVR-2026-001248. The administrator will inspect the document during review.",
    applicationNumber: "BVR-2026-001248",
    status: "Under Review",
    read: true,
    createdAt: "October 6, 2026 • 9:31 AM",
    timeAgo: "5h ago",
    actionLabel: "View Documents",
    actionUrl: "/dashboard/documents",
    priority: "normal",
  },
  {
    id: "v-notif-4",
    type: "system",
    title: "Welcome to Butuan Vendor Portal",
    message:
      "Welcome to the official vendor registry of Butuan City. Your account record has been initialized.",
    fullMessage:
      "Welcome to the official online vendor registration portal of Butuan City, Agusan del Norte. Use your vendor dashboard to track registrations, respond to compliance notices, and manage your vendor profile.",
    applicationNumber: "BVR-2026-001248",
    status: "Active",
    read: true,
    createdAt: "October 6, 2026 • 9:15 AM",
    timeAgo: "6h ago",
    actionLabel: "Go to Dashboard",
    actionUrl: "/dashboard",
    priority: "normal",
  },
];

/** Presets for Testing Vendor Notification States */
export const VENDOR_PRESET_TEMPLATES: Record<string, VendorNotification> = {
  submitted: {
    id: "v-preset-submitted",
    type: "application-submitted",
    title: "Application Submitted",
    message:
      "Your vendor registration application BVR-2026-001248 has been submitted successfully.",
    fullMessage:
      "Your vendor registration application BVR-2026-001248 has been submitted successfully and is currently under administrative evaluation.",
    applicationNumber: "BVR-2026-001248",
    status: "Under Review",
    read: false,
    createdAt: "October 6, 2026 • 9:30 AM",
    timeAgo: "Just now",
    actionLabel: "Track Application",
    actionUrl: "/application-status",
    priority: "normal",
  },
  "correction-requested": {
    id: "v-preset-corr-req",
    type: "correction-requested",
    title: "Correction Required",
    message: "An administrator has requested corrections to your vendor application.",
    fullMessage:
      "An administrator has reviewed application BVR-2026-001248 and requested corrections. Please update your business street address and upload a clearer copy of your government ID.",
    applicationNumber: "BVR-2026-001248",
    status: "Needs Correction",
    remarks:
      "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
    read: false,
    createdAt: "October 6, 2026 • 2:45 PM",
    timeAgo: "Just now",
    actionLabel: "Review & Correct Application",
    actionUrl: "/dashboard/my-application/correction",
    priority: "high",
  },
  "correction-submitted": {
    id: "v-preset-corr-sub",
    type: "correction-submitted",
    title: "Corrections Submitted",
    message:
      "Your corrections for application BVR-2026-001248 have been submitted successfully.",
    fullMessage:
      "Your application corrections have been received. The administrative review has resumed. You will be notified once a final decision is made.",
    applicationNumber: "BVR-2026-001248",
    status: "Under Review",
    read: false,
    createdAt: "October 6, 2026 • Today",
    timeAgo: "Just now",
    actionLabel: "View Application Status",
    actionUrl: "/application-status",
    priority: "normal",
  },
  approved: {
    id: "v-preset-approved",
    type: "application-approved",
    title: "Application Approved",
    message: "Your vendor registration application has been approved.",
    fullMessage:
      "Congratulations! Your vendor registration application BVR-2026-001248 has been approved by the City Government of Butuan. Official Vendor ID BUT-V-001248 has been issued.",
    applicationNumber: "BVR-2026-001248",
    vendorId: "BUT-V-001248",
    status: "Approved",
    read: false,
    createdAt: "October 6, 2026 • 4:00 PM",
    timeAgo: "Just now",
    actionLabel: "View Vendor Certificate",
    actionUrl: "/application-status",
    priority: "high",
  },
  rejected: {
    id: "v-preset-rejected",
    type: "application-rejected",
    title: "Application Rejected",
    message: "Your vendor registration application was not approved.",
    fullMessage:
      "Your vendor registration application BVR-2026-001248 was not approved during administrative review. Please see administrator remarks for details.",
    applicationNumber: "BVR-2026-001248",
    status: "Rejected",
    remarks:
      "The business location indicated is outside the territorial jurisdiction of Butuan City or failed initial compliance verification.",
    read: false,
    createdAt: "October 6, 2026 • 3:30 PM",
    timeAgo: "Just now",
    actionLabel: "View Rejection Details",
    actionUrl: "/application-status",
    priority: "high",
  },
};

/** Initial Admin Notifications */
export const INITIAL_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "adm-notif-1",
    type: "correction-submitted",
    title: "Vendor Submitted Corrections",
    message: "A vendor has submitted corrections for application BVR-2026-001248.",
    fullMessage:
      "Vendor Juan Dela Cruz (Juan's Food Stall) submitted updated business address details and a replacement government ID document for application BVR-2026-001248. The application is now awaiting re-evaluation.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    status: "Under Review",
    read: false,
    createdAt: "October 6, 2026 • Just now",
    timeAgo: "5m ago",
    actionLabel: "Review Application",
    actionUrl: "/admin/applications/BVR-2026-001248",
    priority: "high",
  },
  {
    id: "adm-notif-2",
    type: "new-application",
    title: "New Vendor Application",
    message: "A new vendor registration application has been submitted.",
    fullMessage:
      "A new vendor registration has been submitted by Juan Dela Cruz for Juan's Food Stall located in Baan KM 3, Butuan City. Initial compliance checks are pending.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    status: "Submitted",
    read: false,
    createdAt: "October 6, 2026 • 9:30 AM",
    timeAgo: "5h ago",
    actionLabel: "Review Application",
    actionUrl: "/admin/applications/BVR-2026-001248",
    priority: "normal",
  },
  {
    id: "adm-notif-3",
    type: "correction-requested",
    title: "Correction Notice Dispatched",
    message:
      "Correction notice was sent to Pedro BBQ (BVR-2026-001246) regarding stall location.",
    fullMessage:
      "Administrator dispatched a correction notice for application BVR-2026-001246. Vendor must clarify stall coordinates in Barangay Ampayon before approval.",
    applicationNumber: "BVR-2026-001246",
    vendorName: "Pedro BBQ",
    status: "Needs Correction",
    read: true,
    createdAt: "October 5, 2026 • 3:15 PM",
    timeAgo: "Yesterday",
    actionLabel: "View Application",
    actionUrl: "/admin/applications/BVR-2026-001246",
    priority: "normal",
  },
  {
    id: "adm-notif-4",
    type: "application-approved",
    title: "Vendor Approved & ID Issued",
    message:
      "Maria's Sari-Sari Store was approved. Vendor ID BUT-V-001247 was issued.",
    fullMessage:
      "Application BVR-2026-001247 was finalized and approved. Official Butuan Vendor ID BUT-V-001247 issued to Maria Santos. Municipal certificate generated.",
    applicationNumber: "BVR-2026-001247",
    vendorName: "Maria's Sari-Sari Store",
    status: "Approved",
    read: true,
    createdAt: "October 5, 2026 • 11:20 AM",
    timeAgo: "Yesterday",
    actionLabel: "View Vendor Profile",
    actionUrl: "/admin/vendors",
    priority: "normal",
  },
  {
    id: "adm-notif-5",
    type: "document-uploaded",
    title: "Document Verification Flag",
    message:
      "PhilSys National ID submitted for BVR-2026-001248 requires manual visual check.",
    fullMessage:
      "System flagged uploaded identity file gov_id_juan.jpg for administrative clarity inspection. Resolution: Requested replacement from vendor.",
    applicationNumber: "BVR-2026-001248",
    vendorName: "Juan's Food Stall",
    status: "Under Review",
    read: true,
    createdAt: "October 6, 2026 • 9:35 AM",
    timeAgo: "5h ago",
    actionLabel: "Inspect Documents",
    actionUrl: "/admin/documents",
    priority: "normal",
  },
];
