/**
 * Shared Vendor Application Data Model
 * 
 * Central TypeScript model shared between the Vendor Portal and Admin Portal.
 * Designed for client-side state and localStorage persistence without external backends.
 */

// ─── 2. Application Status ────────────────────────────────────────────────────

export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_correction"
  | "correction_submitted"
  | "approved"
  | "rejected";

// ─── 3. Business Information ──────────────────────────────────────────────────

export interface BusinessInformation {
  /** Registered trade or business name (e.g. "Juan's Food Stall") */
  businessName: string;
  /** Detailed description of vendor business operations and products */
  businessDescription?: string;
  /** Optional business category (e.g. "Food & Refreshment", "Dry Goods") */
  category?: string;
}

// ─── 4. Owner Information ─────────────────────────────────────────────────────

export interface OwnerInformation {
  /** Full legal name of the business proprietor */
  ownerName: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
}

// ─── 5. Contact & Address Information ─────────────────────────────────────────

export interface ContactInformation {
  /** Philippine mobile number (e.g. "09171234567") */
  contactNumber: string;
  /** Primary contact email address */
  emailAddress: string;
}

export interface AddressInformation {
  /** Stall, building, or house number */
  houseNo: string;
  /** Street name or avenue */
  street: string;
  /** Registered Butuan City barangay */
  barangay: string;
  /** City jurisdiction (default: "Butuan City") */
  city?: string;
  /** Province jurisdiction (default: "Agusan del Norte") */
  province?: string;
  /** Region jurisdiction (default: "Caraga") */
  region?: string;
  /** Country jurisdiction (default: "Philippines") */
  country?: string;
}

// ─── 6. Document Information ──────────────────────────────────────────────────

export interface DocumentInformation {
  /** Unique document identifier */
  id?: string;
  /** Government ID classification (e.g. "PhilSys ID", "Driver's License", "Passport", "UMID") */
  idType?: string;
  /** Identifier number from the uploaded credential */
  idNumber?: string;
  /** Uploaded document file name (e.g. "philsys_sample.jpg") */
  idFileName?: string;
  /** Normalized filename alias */
  filename?: string;
  /** Size of the uploaded file (e.g. "1.2 MB") */
  fileSize?: string;
  /** Timestamp when document was attached/uploaded */
  uploadedAt?: string;
  /** Document review evaluation status */
  status?:
    | "Submitted"
    | "Verified"
    | "Replacement Requested"
    | "Accepted"
    | "Under Review"
    | "Needs Replacement";
  /** Whether identity verification was skipped during registration */
  isSkippedId?: boolean;
}

// ─── 7. Admin Information & Status History ────────────────────────────────────

export interface StatusHistoryEntry {
  /** Unique history entry identifier */
  id?: string;
  /** Preceding application status before transition, or null for initial creation */
  previousStatus: ApplicationStatus | null;
  /** New application status following transition */
  newStatus: ApplicationStatus;
  /** ISO date string or formatted timestamp of the transition */
  timestamp: string;
  /** Optional administrative remark, feedback, or justification */
  remark?: string;
  /** Actor responsible for the change (e.g. "Admin", "Vendor", "System") */
  actionBy?: string;
  /** Human-readable action label (e.g. "Status changed to Needs Correction") */
  action?: string;
}

// ─── 1-8. Canonical Vendor Application Model ──────────────────────────────────

export interface VendorApplication {
  // 1. Application identity
  /** Primary application key (e.g. "BVR-2026-001248") */
  id: string;
  /** Official municipal application reference number */
  applicationNumber: string;
  /** Official Vendor ID issued upon municipal accreditation (e.g. "BUT-V-001248") */
  vendorId?: string;

  // 2. Application status
  /** Current lifecycle status */
  status: ApplicationStatus;

  // 3. Business information
  business: BusinessInformation;

  // 4. Owner information
  owner: OwnerInformation;

  // 5. Contact / address information
  contact: ContactInformation;
  address: AddressInformation;

  // 6. Documents
  documents: DocumentInformation[];

  // 7. Admin information
  /** Current administrator remarks visible to vendor when correction or review is required */
  adminRemarks?: string;
  /** Chronological audit log of all status transitions and actions */
  statusHistory: StatusHistoryEntry[];

  // 8. Timestamps
  /** Timestamp when application was officially submitted, or null if draft */
  submittedAt: string | null;
  /** Timestamp of the most recent modification */
  updatedAt: string;
  /** Timestamp of application record creation */
  createdAt?: string;
}
