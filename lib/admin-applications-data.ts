export type ApplicationStatus =
  | "Submitted"
  | "Under Review"
  | "Needs Correction"
  | "Correction Submitted"
  | "Approved"
  | "Rejected";

export interface AddressInfo {
  houseNumber: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  country: string;
}

export interface GovernmentIdInfo {
  submitted: boolean;
  filename: string;
  idType: string;
  uploadedAt: string;
  status: "Submitted" | "Verified" | "Replacement Requested";
}

export interface ActivityItem {
  id: string;
  title: string;
  date: string;
  description: string;
  type: "submission" | "review" | "correction" | "approval" | "rejection";
}

export type AdminPaymentStatus =
  | "Unpaid"
  | "Awaiting Cashier Payment"
  | "Pending Verification"
  | "Verified"
  | "Rejected"
  | "Pending"
  | "Paid"
  | "Failed"
  | "Cancelled"
  | "Refunded";

export interface AdminApplication {
  id: string;
  businessName: string;
  owner: string;
  barangay: string;
  submitted: string;
  status: ApplicationStatus;
  businessDescription: string;
  contactNumber: string;
  email: string;
  address: AddressInfo;
  governmentId?: GovernmentIdInfo;
  remarks?: string;
  vendorId?: string;
  activityTimeline: ActivityItem[];
  // Fee assessment & payment information
  paymentStatus?: AdminPaymentStatus;
  assessedAmount?: number;
  amountPaid?: number;
  transactionReference?: string;
  paymentDate?: string | null;
  paymentMethod?: string;
  receiptUrl?: string;
  receiptFilename?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  receiptUploadedAt?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  deletedReason?: string | null;
}

export { BARANGAY_OPTIONS } from "./barangays";
export type { ButuanBarangay, BarangayOption } from "./barangays";

export const STATUS_OPTIONS = [
  "All",
  "Submitted",
  "Under Review",
  "Needs Correction",
  "Correction Submitted",
  "Approved",
  "Rejected",
  "Archived / Deleted",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "All",
  "Unpaid",
  "Awaiting Cashier Payment",
  "Pending Verification",
  "Verified",
  "Rejected",
  "Paid",
  "Pending",
] as const;

export const MOCK_APPLICATIONS: AdminApplication[] = [];

export function getApplicationById(id: string): AdminApplication | null {
  const found = MOCK_APPLICATIONS.find(
    (app) => app.id.toLowerCase() === id.toLowerCase()
  );
  return found || null;
}

export {
  useDeletedApplicationIds,
  getDeletedApplicationIds,
  isApplicationDeleted,
  deleteAdminApplicationRecord,
  resetDeletedAdminApplications,
} from "./application-store";
