"use client";

import { useState, use, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Eye,
  CheckSquare,
  RotateCcw,
  AlertTriangle,
  Info,
  Lock,
  Stamp,
  Award,
  Sparkles,
  Trash2,
  Receipt,
  Wallet,
  Download,
  ExternalLink,
  FileCheck,
  ShieldCheck,
  Landmark,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/demo-auth";
import { useAppRole } from "@/lib/clerk-roles";
import {
  useSharedApplication,
  statusToAdminLabel,
  saveSharedApplication,
} from "@/lib/vendor-application-state";
import {
  useStoredApplications,
  getApplication,
  updateApplication,
  useDeletedApplicationIds,
  undeleteAdminApplicationRecord,
  deleteAdminApplicationRecord,
} from "@/lib/application-store";
import { type AdminApplication } from "@/lib/admin-applications-data";
import { VendorApplication, ApplicationStatus, PaymentInformation } from "@/lib/types/vendor-application";
import {
  addVendorNotification,
} from "@/lib/notifications-data";
import {
  formatPhpCurrency,
  getPaymentStatusBadgeConfig,
} from "@/lib/payment-fee-schedule";

let activityCounter = 1000;
function nextActivityId(): string {
  activityCounter += 1;
  return `act-${activityCounter}`;
}

// Unified Single Mock Application State Interface
export interface ReviewApplicationState {
  applicationNumber: string;
  businessName: string;
  ownerName: string;
  businessDescription: string;
  contactNumber: string;
  email: string;
  address: {
    houseNumber: string;
    street: string;
    barangay: string;
    city: string;
    province: string;
    region: string;
    country: string;
  };
  barangay: string;
  submittedDate: string;
  status:
    | "Submitted"
    | "Under Review"
    | "Needs Correction"
    | "Correction Submitted"
    | "Approved"
    | "Rejected";
  governmentIdStatus: "Submitted" | "Verified" | "Needs Replacement";
  governmentIdDoc: {
    filename: string;
    idType: string;
    uploadedAt: string;
    submitted: boolean;
  };
  remarks: string;
  vendorId: string | null;
  businessCategory?: string;
  isVerified?: boolean;
  checklist: {
    businessInfo: boolean;
    ownerInfo: boolean;
    contactInfo: boolean;
    businessAddress: boolean;
    governmentId: boolean;
  };
  activity: Array<{
    id: string;
    title: string;
    date: string;
    description: string;
    type: "submission" | "review" | "correction" | "approval" | "rejection";
  }>;
  // Fee assessment & payment information
  payment?: PaymentInformation;
  paymentStatus:
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
  receiptNumber?: string;
  assessedAmount: number;
  amountPaid: number;
  paymentMethod: string;
  transactionReference: string;
  paymentDate: string | null;
  receiptUrl?: string;
  receiptFilename?: string;
  receiptFileType?: string;
  receiptFileSize?: number;
  receiptUploadedAt?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

function parseAppStatus(status?: string): ApplicationStatus {
  if (!status) return "submitted";
  const s = status.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "needs_correction") return "needs_correction";
  if (s === "correction_submitted") return "correction_submitted";
  if (s === "under_review") return "under_review";
  if (s === "draft") return "draft";
  return "submitted";
}

function convertMockToVendorApp(mock: AdminApplication): VendorApplication {
  const statusLower: ApplicationStatus = parseAppStatus(mock.status);
  return {
    id: mock.id,
    applicationNumber: mock.id,
    vendorId: mock.vendorId,
    status: statusLower,
    verificationStatus:
      mock.status === "Approved"
        ? "Verified"
        : mock.status === "Rejected"
        ? "Not Verified"
        : "Pending",
    isVerified: mock.status === "Approved",
    currentStage:
      mock.status === "Approved" ? 4 : mock.status === "Submitted" ? 1 : 2,
    business: {
      businessName: mock.businessName,
      businessDescription: mock.businessDescription,
    },
    owner: {
      ownerName: mock.owner,
    },
    contact: {
      contactNumber: mock.contactNumber,
      emailAddress: mock.email,
    },
    address: {
      houseNo: mock.address.houseNumber,
      street: mock.address.street,
      barangay: mock.barangay,
      city: mock.address.city,
      province: mock.address.province,
      region: mock.address.region,
      country: mock.address.country,
    },
    documents: mock.governmentId
      ? [
          {
            id: `doc-${mock.id}`,
            filename: mock.governmentId.filename,
            idType: mock.governmentId.idType,
            uploadedAt: mock.governmentId.uploadedAt,
            status: mock.governmentId.status,
          },
        ]
      : [],
    adminRemarks: mock.remarks,
    statusHistory: (mock.activityTimeline || []).map((item) => ({
      id: item.id,
      previousStatus: null,
      newStatus: statusLower,
      timestamp: item.date,
      action: item.title,
      remark: item.description,
    })),
    submittedAt: mock.submitted,
    updatedAt: mock.submitted,
  };
}

function mapVendorAppToReviewState(
  stored: VendorApplication
): ReviewApplicationState {
  const statusMap: Record<string, ReviewApplicationState["status"]> = {
    draft: "Submitted",
    submitted: "Submitted",
    under_review: "Under Review",
    "under-review": "Under Review",
    needs_correction: "Needs Correction",
    "needs-correction": "Needs Correction",
    correction_submitted: "Correction Submitted",
    "correction-submitted": "Correction Submitted",
    approved: "Approved",
    rejected: "Rejected",
  };

  const statusKey = (stored.status || "submitted").toLowerCase();
  const currentStatus = statusMap[statusKey] || "Submitted";

  const doc = stored.documents?.[0];
  const docStatus: ReviewApplicationState["governmentIdStatus"] =
    doc?.status === "Verified"
      ? "Verified"
      : doc?.status === "Replacement Requested"
      ? "Needs Replacement"
      : "Submitted";

  return {
    applicationNumber: stored.applicationNumber || stored.id,
    businessName: stored.business?.businessName || "Vendor Business",
    ownerName: stored.owner?.ownerName || "Vendor Applicant",
    businessDescription:
      stored.business?.businessDescription ||
      "Local vendor registered online.",
    contactNumber: stored.contact?.contactNumber || "09XXXXXXXXX",
    email: stored.contact?.emailAddress || "vendor@example.com",
    address: {
      houseNumber: stored.address?.houseNo || "",
      street: stored.address?.street || "",
      barangay: stored.address?.barangay || "Barangay Urduja",
      city: stored.address?.city || "Butuan City",
      province: stored.address?.province || "Agusan del Norte",
      region: stored.address?.region || "Caraga",
      country: stored.address?.country || "Philippines",
    },
    barangay: stored.address?.barangay || "Barangay Urduja",
    submittedDate: stored.submittedAt
      ? new Date(stored.submittedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "October 7, 2026",
    status: currentStatus,
    governmentIdStatus: docStatus,
    governmentIdDoc: {
      filename:
        doc?.filename ||
        doc?.idFileName ||
        "government-id.pdf",
      idType: doc?.idType || "Philippine National ID",
      uploadedAt: doc?.uploadedAt
        ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : stored.submittedAt
        ? new Date(stored.submittedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        : "October 7, 2026",
      submitted: Boolean(stored.documents && stored.documents.length > 0),
    },
    remarks: stored.adminRemarks || "",
    vendorId: stored.vendorId || null,
    businessCategory: stored.business?.category || "General Vending",
    isVerified: Boolean(stored.isVerified),
    checklist: {
      businessInfo: false,
      ownerInfo: false,
      contactInfo: false,
      businessAddress: false,
      governmentId: false,
    },
    activity:
      stored.statusHistory && stored.statusHistory.length > 0
        ? stored.statusHistory.map((item, idx) => ({
            id: item.id || `act-${idx}`,
            title: item.action || "Status Update",
            date: item.timestamp
              ? new Date(item.timestamp).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })
              : "Recently",
            description:
              item.remark ||
              `Application status updated to ${item.newStatus}.`,
            type: (item.newStatus === "approved"
              ? "approval"
              : item.newStatus === "rejected"
              ? "rejection"
              : (item.newStatus as string) === "needs_correction" ||
                (item.newStatus as string) === "needs-correction"
              ? "correction"
              : (item.newStatus as string) === "under_review" ||
                (item.newStatus as string) === "under-review"
              ? "review"
              : "submission") as "submission" | "review" | "correction" | "approval" | "rejection",
          }))
        : [
            {
              id: "act-1",
              title: "Application Submitted",
              date: stored.submittedAt
                ? new Date(stored.submittedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "October 7, 2026",
              description: "Vendor submitted registration application.",
              type: "submission",
            },
          ],
    payment: stored.payment,
    paymentStatus: formatAdminPaymentStatus(stored.payment?.status),
    receiptNumber: stored.payment?.receiptNumber || "",
    assessedAmount: stored.payment?.assessedAmount ?? 1450,
    amountPaid: stored.payment?.amountPaid ?? 0,
    paymentMethod: stored.payment?.paymentMethod || "GCash / CTO Cashier",
    transactionReference: stored.payment?.transactionReference || `PAY-${stored.applicationNumber || stored.id}`,
    paymentDate: stored.payment?.paymentDate || null,
    receiptUrl: stored.payment?.receiptUrl,
    receiptFilename: stored.payment?.receiptFilename,
    receiptFileType: stored.payment?.receiptFileType,
    receiptFileSize: stored.payment?.receiptFileSize,
    receiptUploadedAt: stored.payment?.receiptUploadedAt,
    rejectionReason: stored.payment?.rejectionReason,
    verifiedBy: stored.payment?.verifiedBy,
    verifiedAt: stored.payment?.verifiedAt,
  };
}

function formatAdminPaymentStatus(status?: string): ReviewApplicationState["paymentStatus"] {
  if (!status) return "Unpaid";
  const s = status.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (s === "pending_verification") return "Pending Verification";
  if (s === "awaiting_cashier_payment") return "Awaiting Cashier Payment";
  if (s === "verified") return "Verified";
  if (s === "rejected") return "Rejected";
  if (s === "paid") return "Verified";
  if (s === "pending") return "Pending Verification";
  if (s === "unpaid") return "Unpaid";
  if (s === "failed") return "Failed";
  if (s === "cancelled") return "Cancelled";
  if (s === "refunded") return "Refunded";
  return "Unpaid";
}

function createEmptyReviewState(appId: string): ReviewApplicationState {
  return {
    applicationNumber: appId,
    businessName: "",
    ownerName: "",
    businessDescription: "",
    contactNumber: "",
    email: "",
    address: {
      houseNumber: "",
      street: "",
      barangay: "",
      city: "Butuan City",
      province: "Agusan del Norte",
      region: "Caraga",
      country: "Philippines",
    },
    barangay: "",
    submittedDate: "",
    status: "Under Review",
    governmentIdStatus: "Submitted",
    governmentIdDoc: {
      filename: "",
      idType: "",
      uploadedAt: "",
      submitted: false,
    },
    remarks: "",
    vendorId: null,
    businessCategory: "General Vending",
    isVerified: false,
    checklist: {
      businessInfo: false,
      ownerInfo: false,
      contactInfo: false,
      businessAddress: false,
      governmentId: false,
    },
    activity: [],
    paymentStatus: "Unpaid",
    assessedAmount: 1450,
    amountPaid: 0,
    paymentMethod: "Maya / CTO Cashier",
    transactionReference: `PAY-${appId}`,
    paymentDate: null,
  };
}

// Initial state factory function
function createInitialApplicationState(
  appId: string
): ReviewApplicationState | null {
  const stored = typeof window !== "undefined" ? getApplication(appId) : null;
  if (stored) {
    return mapVendorAppToReviewState(stored);
  }
  return null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AdminApplicationReviewPage({ params }: PageProps) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const applicationId = (unwrappedParams?.id || "").trim();

  // Reactive subscription to centralized store
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();

  // Shared Centralized Application Store
  const {
    application: sharedApp,
    updateStatus: updateSharedStatus,
    updateRemarks: updateSharedRemarks,
  } = useSharedApplication();

  // Match application by ID strictly from active store
  const activeApp: VendorApplication | null = useMemo(() => {
    if (!applicationId) return null;
    const norm = applicationId.toLowerCase();
    // 1. Reactive stored applications (from vendorApplications in localStorage)
    const found = storedApplications.find(
      (app) =>
        app.id.toLowerCase() === norm ||
        app.applicationNumber.toLowerCase() === norm
    );
    if (found) return found;

    // 2. Direct read from localStorage
    if (typeof window !== "undefined") {
      const fromStore = getApplication(applicationId);
      if (fromStore) return fromStore;
    }

    return null;
  }, [storedApplications, applicationId]);

  // Is explicitly marked as deleted by an Admin action?
  const isDeleted = useMemo(() => {
    // If the application exists in active localStorage, it is NEVER deleted!
    if (activeApp) return false;
    const norm = applicationId.toLowerCase();
    return deletedApplicationIds.some((id) => id.trim().toLowerCase() === norm);
  }, [activeApp, deletedApplicationIds, applicationId]);

  // If the active application was in deleted list, undelete it immediately
  useEffect(() => {
    if (activeApp) {
      undeleteAdminApplicationRecord(activeApp.id);
    }
  }, [activeApp]);

  // Base review state computed directly from the resolved active application
  const baseReviewState: ReviewApplicationState | null = useMemo(() => {
    if (activeApp) {
      return mapVendorAppToReviewState(activeApp);
    }
    return null;
  }, [activeApp]);

  // Checklist interactive state
  const [checklist, setChecklist] = useState({
    businessInfo: false,
    ownerInfo: false,
    contactInfo: false,
    businessAddress: false,
    governmentId: false,
  });

  const [remarksDraft, setRemarksDraft] = useState<string | null>(null);
  const [localStatusOverride, setLocalStatusOverride] = useState<
    ReviewApplicationState["status"] | null
  >(null);
  const [localDocStatusOverride, setLocalDocStatusOverride] = useState<
    ReviewApplicationState["governmentIdStatus"] | null
  >(null);
  const [localActivityOverride, setLocalActivityOverride] = useState<
    ReviewApplicationState["activity"] | null
  >(null);

  const isSharedTarget =
    Boolean(activeApp && activeApp.id.toLowerCase() === sharedApp.id.toLowerCase());

  const effectiveStatus =
    localStatusOverride ||
    (isSharedTarget
      ? (sharedApp.adminStatus as ReviewApplicationState["status"])
      : (baseReviewState?.status || "Under Review"));

  const resolvedBase = baseReviewState || createEmptyReviewState(applicationId);

  const [localPaymentOverride, setLocalPaymentOverride] = useState<{
    status: ReviewApplicationState["paymentStatus"];
    verifiedBy?: string;
    verifiedAt?: string;
    rejectionReason?: string;
    amountPaid?: number;
    receiptNumber?: string;
  } | null>(null);

  const [verifyPaymentDialogOpen, setVerifyPaymentDialogOpen] = useState(false);
  const [rejectPaymentDialogOpen, setRejectPaymentDialogOpen] = useState(false);
  const [receiptViewerModalOpen, setReceiptViewerModalOpen] = useState(false);
  const [paymentRejectionReason, setPaymentRejectionReason] = useState(
    "Transaction reference could not be verified in municipal records or amount does not match."
  );
  const [confirmedAmountPaidInput, setConfirmedAmountPaidInput] = useState<string>("");
  const [officialReceiptNumberInput, setOfficialReceiptNumberInput] = useState<string>("");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [verifyPaymentError, setVerifyPaymentError] = useState<string | null>(null);

  const { session: adminSession } = useAdminAuth();
  const { user: clerkUser } = useAppRole();

  const currentAdminIdentity = useMemo(() => {
    if (clerkUser?.fullName) return clerkUser.fullName;
    if (clerkUser?.firstName) {
      return `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim();
    }
    if (clerkUser?.primaryEmailAddress?.emailAddress) return clerkUser.primaryEmailAddress.emailAddress;
    if (adminSession?.name) return adminSession.name;
    if (adminSession?.email) return adminSession.email;
    return "Admin (CBPLD Review Officer)";
  }, [clerkUser, adminSession]);

  useEffect(() => {
    if (verifyPaymentDialogOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [verifyPaymentDialogOpen]);

  const appState: ReviewApplicationState = {
    ...resolvedBase,
    status: effectiveStatus,
    remarks:
      remarksDraft !== null
        ? remarksDraft
        : isSharedTarget
        ? sharedApp.adminRemarks
        : resolvedBase.remarks,
    governmentIdStatus:
      localDocStatusOverride || resolvedBase.governmentIdStatus,
    vendorId: resolvedBase.vendorId || (isSharedTarget ? sharedApp.vendorId || null : null),
    checklist,
    activity:
      localActivityOverride ||
      (isSharedTarget && sharedApp.activity
        ? sharedApp.activity.map((a) => ({
            id: a.id,
            title: a.title,
            date: a.date,
            description: a.description,
            type: (a.type || "review") as
              | "submission"
              | "review"
              | "correction"
              | "approval"
              | "rejection",
          }))
        : resolvedBase.activity),
    paymentStatus:
      localPaymentOverride?.status ||
      (isSharedTarget && sharedApp.paymentStatus
        ? formatAdminPaymentStatus(sharedApp.paymentStatus)
        : resolvedBase.paymentStatus),
    receiptNumber:
      localPaymentOverride?.receiptNumber ||
      (isSharedTarget ? sharedApp.payment?.receiptNumber : resolvedBase.receiptNumber) ||
      "",
    amountPaid:
      localPaymentOverride?.amountPaid ??
      (isSharedTarget && sharedApp.payment?.amountPaid !== undefined
        ? sharedApp.payment.amountPaid
        : resolvedBase.amountPaid),
    rejectionReason:
      localPaymentOverride?.rejectionReason ??
      (isSharedTarget ? sharedApp.payment?.rejectionReason : resolvedBase.rejectionReason),
    verifiedBy:
      localPaymentOverride?.verifiedBy ??
      (isSharedTarget ? sharedApp.payment?.verifiedBy : resolvedBase.verifiedBy),
    verifiedAt:
      localPaymentOverride?.verifiedAt ??
      (isSharedTarget ? sharedApp.payment?.verifiedAt : resolvedBase.verifiedAt),
    receiptUrl:
      resolvedBase.receiptUrl ||
      (isSharedTarget ? sharedApp.payment?.receiptUrl : undefined),
    receiptFilename:
      resolvedBase.receiptFilename ||
      (isSharedTarget ? sharedApp.payment?.receiptFilename : undefined),
    receiptFileType:
      resolvedBase.receiptFileType ||
      (isSharedTarget ? sharedApp.payment?.receiptFileType : undefined),
    receiptFileSize:
      resolvedBase.receiptFileSize ||
      (isSharedTarget ? sharedApp.payment?.receiptFileSize : undefined),
    receiptUploadedAt:
      resolvedBase.receiptUploadedAt ||
      (isSharedTarget ? sharedApp.payment?.receiptUploadedAt : undefined),
  };

  const isPaymentVerified =
    appState.paymentStatus === "Verified" ||
    (appState.paymentStatus as string).toLowerCase() === "verified" ||
    (appState.paymentStatus as string).toLowerCase() === "paid";

  // Dialog and form inputs
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docPreviewOpen, setDocPreviewOpen] = useState(false);

  const [correctionInput, setCorrectionInput] = useState(
    "Please provide a clearer business address and replace the submitted government ID image with a readable copy."
  );
  const [rejectionInput, setRejectionInput] = useState(
    "Application does not meet municipal zoning requirements for ambulant vending along this section."
  );

  // Notification / Toast Feedback
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "warning" | "destructive" | "info";
    message: string;
  } | null>(null);

  const showNotification = (
    message: string,
    type: "success" | "warning" | "destructive" | "info" = "success"
  ) => {
    setFeedbackNotice({ message, type });
    setTimeout(() => {
      setFeedbackNotice(null);
    }, 5000);
  };

  // Direct status override handler (Requirement 5 & CRITICAL APPROVAL RULE)
  const handleAdminStatusChange = (newStatus: string) => {
    const adminLabel = statusToAdminLabel(newStatus) as ReviewApplicationState["status"];
    const match = appState.applicationNumber.match(/(\d+)$/);
    const seq = match ? match[1] : "001248";
    const dynamicVendorId = `BUT-V-${seq}`;
    const isNowApproved = newStatus.toLowerCase() === "approved";

    // CRITICAL ENFORCEMENT: An application must NOT be approved until payment is Verified
    if (isNowApproved && !isPaymentVerified) {
      showNotification(
        `Approval Blocked: Payment must be verified by an authorized administrator before this application can be approved. (Current Status: ${appState.paymentStatus})`,
        "destructive"
      );
      return;
    }

    updateApplication(appState.applicationNumber, {
      status: parseAppStatus(newStatus),
      adminRemarks: appState.remarks,
      vendorId: isNowApproved
        ? appState.vendorId || dynamicVendorId
        : appState.vendorId || undefined,
      verificationStatus: isNowApproved
        ? "Verified"
        : newStatus.toLowerCase() === "rejected"
        ? "Not Verified"
        : "Pending",
      isVerified: isNowApproved,
      currentStage: isNowApproved ? 4 : 2,
    });

    if (isSharedTarget) {
      updateSharedStatus(newStatus, { adminRemarks: appState.remarks });
    }

    setLocalStatusOverride(adminLabel);
    showNotification(
      `Status updated to "${adminLabel}" and synchronized to Vendor Portal.`,
      "success"
    );
  };

  // Payment Verification Actions
  const handleVerifyPaymentConfirm = async () => {
    const parsedAmount = Number(confirmedAmountPaidInput);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setVerifyPaymentError("Please enter a valid amount received (₱).");
      return;
    }

    const trimmedOrNumber = officialReceiptNumberInput.trim();
    if (!trimmedOrNumber) {
      setVerifyPaymentError("Official Receipt (OR) Number is required.");
      return;
    }

    setIsVerifyingPayment(true);
    setVerifyPaymentError(null);

    try {
      // Simulate confirmation processing
      await new Promise((resolve) => setTimeout(resolve, 350));

      const nowIso = new Date().toISOString();
      const formattedDate = new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      const amountToConfirm = parsedAmount;
      const reviewerAdmin = currentAdminIdentity;
      const orNumber = trimmedOrNumber;

      const updatedPayment: PaymentInformation = {
        assessedAmount: appState.assessedAmount,
        currency: "PHP",
        paymentMethod: appState.paymentMethod,
        transactionReference: appState.transactionReference,
        feeBreakdown: appState.payment?.feeBreakdown || [],
        assessmentStatus: "assessed",
        receiptNumber: orNumber,
        receiptUrl: appState.receiptUrl || undefined,
        receiptFilename: appState.receiptFilename || `Official-Receipt-${orNumber}.pdf`,
        receiptFileType: "application/pdf",
        receiptFileSize: 245000,
        receiptUploadedAt: nowIso,
        ...(appState.payment || {}),
        status: "verified",
        amountPaid: amountToConfirm,
        paymentDate: appState.paymentDate || formattedDate,
        verifiedBy: reviewerAdmin,
        verifiedAt: nowIso,
        rejectionReason: undefined,
      };

      // Construct the official verified receipt document
      const receiptDoc = {
        id: `doc-receipt-${appState.applicationNumber}`,
        idType: "Vendor Registration Payment Receipt",
        idNumber: orNumber,
        filename: `Vendor-Registration-Payment-Receipt-${orNumber}.pdf`,
        uploadedAt: nowIso,
        status: "Verified" as const,
        isSkippedId: false,
      };

      // Fetch existing documents and append official receipt, preventing duplicates
      const storedApp = getApplication(appState.applicationNumber);
      const existingDocs = storedApp?.documents || [];
      const filteredDocs = existingDocs.filter(
        (d) => d.idType !== "Vendor Registration Payment Receipt" && d.id !== receiptDoc.id
      );
      const updatedDocuments = [...filteredDocs, receiptDoc];

      const verifyActivity = {
        id: nextActivityId(),
        title: "Payment Verified & Official Receipt Recorded",
        date: formattedDate,
        description: `Payment of ${formatPhpCurrency(amountToConfirm)} via ${appState.paymentMethod} verified by ${reviewerAdmin}. Official Receipt #${orNumber} recorded and published to vendor's Documents section.`,
        type: "review" as const,
      };

      updateApplication(appState.applicationNumber, {
        payment: updatedPayment,
        paymentStatus: "verified",
        amountPaid: amountToConfirm,
        documents: updatedDocuments,
      });

      if (isSharedTarget) {
        const existingSharedDocs = sharedApp.documents || [];
        const filteredSharedDocs = existingSharedDocs.filter(
          (d) => d.idType !== "Vendor Registration Payment Receipt" && d.id !== receiptDoc.id
        );
        saveSharedApplication({
          ...sharedApp,
          payment: updatedPayment,
          paymentStatus: "verified",
          amountPaid: amountToConfirm,
          documents: [
            ...filteredSharedDocs,
            {
              id: receiptDoc.id,
              filename: receiptDoc.filename,
              idType: "Vendor Registration Payment Receipt",
              uploadedAt: nowIso,
              status: "Verified",
              submitted: true,
            },
          ],
        });
      }

      addVendorNotification({
        type: "payment-verified",
        title: "Vendor Registration Payment Receipt Available",
        message: `Your payment of ${formatPhpCurrency(amountToConfirm)} has been verified. Official Receipt #${orNumber} is now available in your Documents section.`,
        fullMessage: `Your payment of ${formatPhpCurrency(amountToConfirm)} via ${appState.paymentMethod} has been verified by ${reviewerAdmin}. Official Receipt (OR No. ${orNumber}) has been recorded and delivered directly to your Documents section. Your vendor registration application is continuing under formal administrative evaluation.`,
        applicationNumber: appState.applicationNumber,
        vendorName: appState.businessName,
        status: appState.status,
        actionLabel: "View Receipt in Documents",
        actionUrl: "/dashboard/documents",
        href: "/dashboard/documents",
        priority: "high",
      });

      setLocalPaymentOverride({
        status: "Verified",
        verifiedBy: reviewerAdmin,
        verifiedAt: nowIso,
        amountPaid: amountToConfirm,
        receiptNumber: orNumber,
        rejectionReason: undefined,
      });
      setLocalActivityOverride([verifyActivity, ...appState.activity]);
      setVerifyPaymentDialogOpen(false);
      showNotification("Payment verified successfully and official receipt delivered to vendor Documents section.", "success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Payment verification failed. Please try again.";
      setVerifyPaymentError(errorMsg);
      showNotification(errorMsg, "destructive");
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleRejectPaymentConfirm = () => {
    if (!paymentRejectionReason.trim()) {
      showNotification("Please provide a rejection reason for the payment proof.", "warning");
      return;
    }

    const nowIso = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const reviewerAdmin = currentAdminIdentity;
    const reason = paymentRejectionReason.trim();

    const updatedPayment: PaymentInformation = {
      assessedAmount: appState.assessedAmount,
      currency: "PHP",
      paymentMethod: appState.paymentMethod,
      transactionReference: appState.transactionReference,
      feeBreakdown: appState.payment?.feeBreakdown || [],
      assessmentStatus: "pending_verification",
      receiptUrl: appState.receiptUrl,
      receiptFilename: appState.receiptFilename,
      receiptFileType: appState.receiptFileType,
      receiptFileSize: appState.receiptFileSize,
      receiptUploadedAt: appState.receiptUploadedAt,
      ...(appState.payment || {}),
      status: "rejected",
      amountPaid: 0,
      rejectionReason: reason,
      verifiedBy: reviewerAdmin,
      verifiedAt: nowIso,
    };

    const rejectPaymentActivity = {
      id: nextActivityId(),
      title: "Payment Proof Rejected",
      date: formattedDate,
      description: `Payment proof rejected by ${reviewerAdmin}. Reason: "${reason}". Vendor must resubmit corrected proof.`,
      type: "rejection" as const,
    };

    updateApplication(appState.applicationNumber, {
      payment: updatedPayment,
      paymentStatus: "rejected",
      amountPaid: 0,
    });

    if (isSharedTarget) {
      saveSharedApplication({
        ...sharedApp,
        payment: updatedPayment,
        paymentStatus: "rejected",
        amountPaid: 0,
      });
    }

    addVendorNotification({
      type: "application-status-updated",
      title: "Payment Proof Rejected — Resubmission Required",
      message: `Your proof of payment for application ${appState.applicationNumber} was rejected: "${reason}". Please upload a corrected receipt.`,
      fullMessage: `Your payment receipt for application ${appState.applicationNumber} was reviewed and rejected by ${reviewerAdmin}. Reason: "${reason}". Please log in to your vendor portal or visit the status page to resubmit a valid proof of payment.`,
      applicationNumber: appState.applicationNumber,
      vendorName: appState.businessName,
      status: appState.status,
      actionLabel: "Resubmit Payment Proof",
      actionUrl: "/application-status",
      href: "/application-status",
      priority: "high",
    });

    setLocalPaymentOverride({
      status: "Rejected",
      verifiedBy: reviewerAdmin,
      verifiedAt: nowIso,
      rejectionReason: reason,
      amountPaid: 0,
    });
    setLocalActivityOverride([rejectPaymentActivity, ...appState.activity]);
    setRejectPaymentDialogOpen(false);
    showNotification("Payment proof rejected. Rejection reason has been communicated to the vendor.", "warning");
  };

  // Direct remark save handler
  const handleSaveRemarks = () => {
    const textToSave = appState.remarks;
    updateApplication(appState.applicationNumber, {
      adminRemarks: textToSave,
    });
    if (isSharedTarget) {
      updateSharedRemarks(textToSave);
    }
    setRemarksDraft(null);
    showNotification(
      "Administrator remarks saved and synchronized to Vendor Portal.",
      "success"
    );
  };

  // Checklist calculations
  const totalChecklistItems = 5;
  const checkedCount = Object.values(appState.checklist).filter(Boolean).length;
  const allChecked = checkedCount === totalChecklistItems;

  const isRequiredChecklistComplete =
    appState.checklist.businessInfo &&
    appState.checklist.ownerInfo &&
    appState.checklist.contactInfo &&
    appState.checklist.businessAddress;

  const handleToggleChecklist = (
    key: keyof ReviewApplicationState["checklist"],
    checked: boolean
  ) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleToggleCheckAll = () => {
    const target = !allChecked;
    setChecklist({
      businessInfo: target,
      ownerInfo: target,
      contactInfo: target,
      businessAddress: target,
      governmentId: target,
    });
  };

  const handleCheckRequiredOnly = () => {
    setChecklist((prev) => ({
      ...prev,
      businessInfo: true,
      ownerInfo: true,
      contactInfo: true,
      businessAddress: true,
    }));
  };

  // 2. Approve Behavior
  const handleApproveConfirm = () => {
    // CRITICAL APPROVAL RULE: An application must NOT be approved until payment has been verified
    if (!isPaymentVerified) {
      showNotification(
        `Approval Blocked: Payment must be verified by an authorized administrator before this application can be approved. (Current Payment Status: ${appState.paymentStatus})`,
        "destructive"
      );
      setApproveDialogOpen(false);
      return;
    }

    setChecklist({
      businessInfo: true,
      ownerInfo: true,
      contactInfo: true,
      businessAddress: true,
      governmentId: true,
    });

    const match = appState.applicationNumber.match(/(\d+)$/);
    const seq = match ? match[1] : "001248";
    const assignedVendorId = appState.vendorId || `BUT-V-${seq}`;
    const approvalActivity = {
      id: nextActivityId(),
      title: "Application Approved & Verified",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description:
        "Administrator approved the vendor registration. Vendor identity verified.",
      type: "approval" as const,
    };

    updateApplication(appState.applicationNumber, {
      status: "approved",
      adminRemarks: appState.remarks,
      vendorId: assignedVendorId,
      verificationStatus: "Verified",
      isVerified: true,
      currentStage: 4,
    });

    updateSharedStatus("Approved", { adminRemarks: appState.remarks });

    saveSharedApplication({
      ...sharedApp,
      id: appState.applicationNumber,
      applicationNumber: appState.applicationNumber,
      vendorId: assignedVendorId,
      status: "approved",
      adminStatus: "Approved",
      verificationStatus: "Verified",
      isVerified: true,
      currentStage: 4,
      adminRemarks: appState.remarks,
      administratorRemarks: appState.remarks,
      businessName: appState.businessName,
      ownerName: appState.ownerName,
      contactNumber: appState.contactNumber,
      email: appState.email,
      barangay: appState.barangay,
    });

    addVendorNotification({
      type: "application-approved",
      title: "Vendor Registration Approved",
      message:
        "Your vendor registration application has been approved by the City Government of Butuan.",
      fullMessage: `Your vendor registration application ${appState.applicationNumber} has been approved by the City Government of Butuan. Vendor ID ${assignedVendorId} has been issued.`,
      applicationNumber: appState.applicationNumber,
      vendorName: appState.businessName,
      vendorId: assignedVendorId,
      status: "Approved",
      actionLabel: "View Application",
      actionUrl: "/dashboard",
      href: "/dashboard",
      priority: "high",
    });

    setLocalStatusOverride("Approved");
    setLocalActivityOverride([approvalActivity, ...appState.activity]);
    setApproveDialogOpen(false);
    showNotification("Application approved and synchronized to Vendor Portal.", "success");
  };

  // 3. Request Correction Behavior
  const handleRequestCorrectionConfirm = () => {
    if (!correctionInput.trim()) {
      return;
    }

    const trimmedMsg = correctionInput.trim();
    const correctionActivity = {
      id: nextActivityId(),
      title: "Correction Requested",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description: `Administrator remarks: "${trimmedMsg}"`,
      type: "correction" as const,
    };

    updateSharedStatus("Needs Correction", { adminRemarks: trimmedMsg });

    updateApplication(appState.applicationNumber, {
      status: "needs_correction",
      adminRemarks: trimmedMsg,
      verificationStatus: "Pending",
      isVerified: false,
      currentStage: 2,
    });

    addVendorNotification({
      type: "correction-requested",
      title: "Action Required: Application Correction",
      message:
        "Your vendor registration application requires corrections before it can be approved.",
      fullMessage: `Your vendor registration application ${appState.applicationNumber} requires corrections before it can be approved. Remarks: "${trimmedMsg}"`,
      remarks: trimmedMsg,
      applicationNumber: appState.applicationNumber,
      vendorName: appState.businessName,
      status: "Needs Correction",
      actionLabel: "Review Application",
      actionUrl: "/dashboard/my-application/correction",
      href: "/dashboard/my-application/correction",
      priority: "high",
    });

    setRemarksDraft(null);
    setLocalStatusOverride("Needs Correction");
    setLocalActivityOverride([correctionActivity, ...appState.activity]);
    setCorrectionDialogOpen(false);
    showNotification("Correction request sent and synchronized to Vendor Portal.", "warning");
  };

  // 4. Reject Behavior
  const handleRejectConfirm = () => {
    if (!rejectionInput.trim()) {
      return;
    }

    const trimmedReason = rejectionInput.trim();
    const rejectionActivity = {
      id: nextActivityId(),
      title: "Application Rejected",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description: `Administrator reason: "${trimmedReason}"`,
      type: "rejection" as const,
    };

    updateSharedStatus("Rejected", { adminRemarks: trimmedReason });

    updateApplication(appState.applicationNumber, {
      status: "rejected",
      adminRemarks: trimmedReason,
      verificationStatus: "Not Verified",
      isVerified: false,
      currentStage: 2,
    });

    addVendorNotification({
      type: "application-rejected",
      title: "Vendor Registration Application Rejected",
      message:
        "Your vendor registration application has been reviewed and rejected.",
      fullMessage: `Your vendor registration application ${appState.applicationNumber} has been rejected by the City Government of Butuan. Reason: "${trimmedReason}"`,
      remarks: trimmedReason,
      applicationNumber: appState.applicationNumber,
      vendorName: appState.businessName,
      status: "Rejected",
      actionLabel: "View Application",
      actionUrl: "/dashboard/my-application",
      href: "/dashboard/my-application",
      priority: "high",
    });

    setRemarksDraft(null);
    setLocalStatusOverride("Rejected");
    setLocalActivityOverride([rejectionActivity, ...appState.activity]);
    setRejectDialogOpen(false);
    showNotification("Application rejected and synchronized to Vendor Portal.", "destructive");
  };

  // 5. Government ID Actions
  const handleMarkDocVerified = () => {
    const verifiedActivity = {
      id: nextActivityId(),
      title: "Government ID Verified",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description:
        "Administrator verified the submitted government identification.",
      type: "review" as const,
    };

    updateApplication(appState.applicationNumber, {
      documents: (activeApp?.documents || []).map((doc, idx) =>
        idx === 0 ? { ...doc, status: "Verified" } : doc
      ),
    });

    setLocalDocStatusOverride("Verified");
    setChecklist((prev) => ({ ...prev, governmentId: true }));
    setLocalActivityOverride([verifiedActivity, ...appState.activity]);
    showNotification("Government ID marked as verified.", "success");
  };

  const handleRequestDocReplacement = () => {
    const replacementActivity = {
      id: nextActivityId(),
      title: "Government ID Replacement Requested",
      date: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      description: "Administrator requested a replacement document.",
      type: "correction" as const,
    };

    updateApplication(appState.applicationNumber, {
      documents: (activeApp?.documents || []).map((doc, idx) =>
        idx === 0 ? { ...doc, status: "Replacement Requested" } : doc
      ),
    });

    setLocalDocStatusOverride("Needs Replacement");
    setLocalActivityOverride([replacementActivity, ...appState.activity]);
    showNotification("Government ID replacement requested.", "warning");
  };

  // Delete handler for applications
  const handleDeleteConfirm = () => {
    deleteAdminApplicationRecord(appState.applicationNumber);
    setDeleteDialogOpen(false);
    router.push("/admin/applications");
  };

  // Status Styling Badge
  const getHeaderStatusBadge = () => {
    switch (appState.status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold px-3 py-1">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-700" />
            Approved
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-100 text-amber-950 border-amber-300 text-xs font-bold px-3 py-1">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-700" />
            Under Review
          </Badge>
        );
      case "Needs Correction":
        return (
          <Badge className="bg-rose-100 text-rose-950 border-rose-300 text-xs font-bold px-3 py-1">
            <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-700" />
            Needs Correction
          </Badge>
        );
      case "Correction Submitted":
        return (
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-bold px-3 py-1">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-700" />
            Correction Submitted
          </Badge>
        );
      case "Submitted":
        return (
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-bold px-3 py-1">
            <Clock className="w-3.5 h-3.5 mr-1 text-blue-700" />
            Submitted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-slate-200 text-slate-900 border-slate-400 text-xs font-bold px-3 py-1">
            <XCircle className="w-3.5 h-3.5 mr-1 text-slate-700" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-bold px-3 py-1">
            {appState.status}
          </Badge>
        );
    }
  };

  if (isDeleted) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
          <Link
            href="/admin/applications"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Applications</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700">{applicationId}</span>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application Deleted</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Application <span className="font-mono font-bold text-slate-700">{applicationId}</span> was removed from the active application list.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/admin/applications"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl text-xs font-semibold cursor-pointer"
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!activeApp) {
    return (
      <div className="space-y-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-4 rounded-xl border border-slate-200">
          <Link
            href="/admin/applications"
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Applications</span>
          </Link>
          <span>/</span>
          <span className="font-mono text-slate-700">{applicationId || "Unknown"}</span>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              No application record was found for the specified reference number. Please check the application number and try again.
            </p>
            {applicationId && (
              <p className="font-mono text-xs text-slate-400 mt-1">
                Reference: {applicationId}
              </p>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/admin/applications"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">

      {/* Page Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/applications"
              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Applications</span>
            </Link>
            <span>/</span>
            <span className="font-mono text-slate-700">
              {appState.applicationNumber}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Application Review
            </h1>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
              {appState.applicationNumber}
            </span>
            {getHeaderStatusBadge()}
          </div>
          <p className="text-xs text-slate-500">
            City Government of Butuan — Vendor Licensing & Permitting Division
          </p>
        </div>
      </div>

      {/* 11. Clear User Feedback Notification */}
      {feedbackNotice && (
        <div
          className={cn(
            "p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs",
            feedbackNotice.type === "success" &&
              "bg-emerald-50 border-emerald-200 text-emerald-900",
            feedbackNotice.type === "warning" &&
              "bg-amber-50 border-amber-200 text-amber-900",
            feedbackNotice.type === "destructive" &&
              "bg-rose-50 border-rose-200 text-rose-900",
            feedbackNotice.type === "info" &&
              "bg-blue-50 border-blue-200 text-blue-900"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {feedbackNotice.type === "warning" && (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            {feedbackNotice.type === "destructive" && (
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {feedbackNotice.type === "info" && (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2, 4, 10, 12. Review Header Status Card */}
      <Card
        className={cn(
          "rounded-2xl border transition-all duration-300 shadow-xs overflow-hidden",
          appState.status === "Submitted" &&
            "bg-gradient-to-r from-blue-50/70 via-white to-blue-50/30 border-blue-300/80",
          appState.status === "Correction Submitted" &&
            "bg-gradient-to-r from-blue-50/70 via-white to-blue-50/30 border-blue-300/80",
          appState.status === "Under Review" &&
            "bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 border-amber-300/80",
          appState.status === "Needs Correction" &&
            "bg-gradient-to-r from-rose-50/70 via-white to-rose-50/30 border-rose-300/80",
          appState.status === "Approved" &&
            "bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/40 border-emerald-300/80",
          appState.status === "Rejected" &&
            "bg-gradient-to-r from-slate-100 via-white to-slate-100 border-slate-300"
        )}
      >
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              {/* Status Title Banner */}
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "text-xs uppercase font-extrabold tracking-widest px-2.5 py-1 rounded-md",
                    appState.status === "Submitted" &&
                      "bg-blue-200/80 text-blue-900",
                    appState.status === "Correction Submitted" &&
                      "bg-blue-200/80 text-blue-900",
                    appState.status === "Under Review" &&
                      "bg-amber-200/80 text-amber-900",
                    appState.status === "Needs Correction" &&
                      "bg-rose-200/80 text-rose-950",
                    appState.status === "Approved" &&
                      "bg-emerald-200/80 text-emerald-950",
                    appState.status === "Rejected" &&
                      "bg-slate-300 text-slate-900"
                  )}
                >
                  {appState.status === "Submitted" && "APPLICATION SUBMITTED"}
                  {appState.status === "Correction Submitted" && "CORRECTION SUBMITTED — UNDER REVIEW"}
                  {appState.status === "Under Review" && "APPLICATION UNDER REVIEW"}
                  {appState.status === "Needs Correction" && "NEEDS CORRECTION"}
                  {appState.status === "Approved" && "APPROVED"}
                  {appState.status === "Rejected" && "REJECTED"}
                </span>

                <span className="text-xs text-slate-500 font-medium">
                  Submitted {appState.submittedDate}
                </span>
              </div>

              {/* Application Number */}
              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {appState.applicationNumber}
                  </span>
                  <span className="text-sm font-semibold text-slate-600">
                    — {appState.businessName}
                  </span>
                </div>

                {/* Subtitle / Status Explanation */}
                <div className="pt-1.5">
                  {appState.status === "Submitted" && (
                    <p className="text-xs sm:text-sm text-blue-900/90 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Application submitted by vendor and queued for initial intake.</span>
                    </p>
                  )}

                  {appState.status === "Correction Submitted" && (
                    <p className="text-xs sm:text-sm text-blue-900/90 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                      <span>Vendor submitted requested corrections. Ready for administrative review.</span>
                    </p>
                  )}

                  {appState.status === "Under Review" && (
                    <p className="text-xs sm:text-sm text-amber-900/90 font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>
                        Application is actively awaiting administrative review.
                      </span>
                    </p>
                  )}

                  {appState.status === "Needs Correction" && (
                    <div className="p-3 rounded-xl bg-rose-100/70 border border-rose-200 text-rose-900 text-xs sm:text-sm font-medium space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                        <span>Waiting for the vendor to make corrections.</span>
                      </div>
                      {appState.remarks && (
                        <p className="text-xs text-rose-800 pl-6">
                          <strong>Correction Instructions:</strong> &ldquo;
                          {appState.remarks}&rdquo;
                        </p>
                      )}
                    </div>
                  )}

                  {appState.status === "Approved" && (
                    <div className="p-3 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-950 text-xs sm:text-sm space-y-1">
                      <div className="flex items-center gap-2 font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>Vendor registration approved.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-emerald-900 pt-0.5">
                        <Award className="w-3.5 h-3.5 text-emerald-700" />
                        <span>
                          Vendor ID:{" "}
                          <strong className="font-mono font-extrabold text-emerald-950 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
                            {appState.vendorId || "Pending assignment"}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {appState.status === "Rejected" && (
                    <div className="p-3 rounded-xl bg-slate-200/80 border border-slate-300 text-slate-800 text-xs sm:text-sm font-medium space-y-1">
                      <div className="flex items-center gap-2 font-bold text-slate-900">
                        <XCircle className="w-4 h-4 text-slate-700 shrink-0" />
                        <span>Application Rejected</span>
                      </div>
                      {appState.remarks && (
                        <p className="text-xs text-slate-700 pl-6">
                          <strong>Administrator Remarks:</strong> &ldquo;
                          {appState.remarks}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 10, 12. Top Action Controls synchronized with status */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 lg:pt-0">
              {appState.status === "Under Review" ||
              appState.status === "Submitted" ||
              appState.status === "Correction Submitted" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCorrectionDialogOpen(true)}
                    className="text-xs font-semibold text-amber-900 bg-amber-50/80 border-amber-300 hover:bg-amber-100 cursor-pointer gap-1.5 h-9 rounded-xl shadow-2xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <span>Request Correction</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectDialogOpen(true)}
                    className="text-xs font-semibold text-rose-800 bg-rose-50/80 border-rose-300 hover:bg-rose-100 cursor-pointer gap-1.5 h-9 rounded-xl shadow-2xs"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Reject</span>
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      disabled={!isPaymentVerified}
                      onClick={() => {
                        if (!isPaymentVerified) {
                          showNotification(
                            `Payment verification is required before approval. Current payment status is ${appState.paymentStatus}.`,
                            "destructive"
                          );
                          return;
                        }
                        setApproveDialogOpen(true);
                      }}
                      className={cn(
                        "text-xs font-semibold gap-1.5 h-9 rounded-xl shadow-2xs",
                        isPaymentVerified
                          ? "text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                          : "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200"
                      )}
                      title={
                        isPaymentVerified
                          ? "Approve application"
                          : `Approval blocked: payment status is ${appState.paymentStatus}`
                      }
                    >
                      {isPaymentVerified ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>Approve</span>
                    </Button>
                    {!isPaymentVerified && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold bg-amber-50 text-amber-800 border-amber-300 hidden sm:inline-flex items-center gap-1 py-1"
                        title="Payment must be verified by an administrator before approval"
                      >
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        Payment Unverified
                      </Badge>
                    )}
                  </div>
                </>
              ) : appState.status === "Approved" ? (
                <div className="px-3.5 py-2 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold flex items-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Application Approved</span>
                </div>
              ) : appState.status === "Needs Correction" ? (
                <div className="px-3.5 py-2 rounded-xl bg-rose-100/90 border border-rose-300 text-rose-950 text-xs font-bold flex items-center gap-2 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-700" />
                  <span>Waiting for Vendor Correction</span>
                </div>
              ) : (
                <div className="px-3.5 py-2 rounded-xl bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold flex items-center gap-2 shadow-2xs">
                  <XCircle className="w-4 h-4 text-slate-600" />
                  <span>Application Rejected</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-Column Review Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= MAIN COLUMN (LEFT - 7/12) ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Business Information Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Business Information
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] text-slate-600 bg-slate-50">
                Registered Profile
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Business Name
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appState.businessName}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Owner Name
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{appState.ownerName}</span>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  Business Description
                </span>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 leading-relaxed">
                  &ldquo;{appState.businessDescription}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Vendor Type
                  </span>
                  <span className="font-semibold text-slate-800">
                    {activeApp?.business.category ? "Declared Stall / Stand" : "Market Stall"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Category
                  </span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {activeApp?.business.category || "General Merchandise"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Barangay
                  </span>
                  <span className="font-semibold text-slate-800">{appState.barangay}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Contact Information
                </CardTitle>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Primary Contact
              </span>
            </CardHeader>

            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Contact Number
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {appState.contactNumber}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Email Address
                    </span>
                    <a
                      href={`mailto:${appState.email}`}
                      className="text-xs sm:text-sm font-semibold text-blue-700 hover:underline truncate block"
                    >
                      {appState.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 p-2.5 rounded-xl bg-slate-50/60 border border-slate-200/60">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  Privacy Protected: Vendor contact details are restricted to authorized Butuan City evaluators.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Business Address Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Business Address
                </CardTitle>
              </div>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[11px]">
                Butuan City Local
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    House/Building No.
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appState.address.houseNumber}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Street
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appState.address.street}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Barangay
                  </span>
                  <p className="text-sm font-bold text-blue-900 mt-0.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>{appState.address.barangay}</span>
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    City
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appState.address.city}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Province
                  </span>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {appState.address.province}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Region & Country
                  </span>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {appState.address.region}, {appState.address.country}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Jurisdiction: {appState.address.city || "Butuan City"} Administrative Area
                  </span>
                  <span className="text-blue-800 text-[11px]">
                    Declared vending address: {appState.address.houseNumber ? `${appState.address.houseNumber} ` : ""}{appState.address.street}, Barangay {appState.address.barangay}, {appState.address.city}. Subject to municipal vendor guidelines.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vending Logistics & Field Compliance Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Vending Logistics & Compliance
                  </CardTitle>
                </div>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-600 bg-slate-50">
                {appState.isVerified ? "Location Verified" : "Pending Verification"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Declared Vending Location
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {appState.address.street || "Not specified"}, Brgy. {appState.address.barangay || "Unspecified"}
                  </p>
                  <span className="inline-block text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mt-1">
                    Submitted by Vendor
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Activity & Category
                  </span>
                  <p className="text-sm font-bold text-slate-900">
                    {appState.businessCategory || "General Vending"}
                  </p>
                  <span className="inline-block text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 mt-1">
                    Declared Activity
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Site Inspection Schedule
                  </span>
                  <p className="text-xs text-slate-600 font-medium">
                    No on-site inspection appointment is currently scheduled.
                  </p>
                  <span className="inline-block text-[11px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded mt-1">
                    Awaiting Review Schedule
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Location Verification Status
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {appState.isVerified ? "Verified by City Administrator" : "Not yet verified by City Administrator"}
                  </p>
                  <span className={cn(
                    "inline-block text-[11px] font-medium px-2 py-0.5 rounded mt-1",
                    appState.isVerified ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60" : "text-amber-800 bg-amber-50 border border-amber-200/60"
                  )}>
                    {appState.isVerified ? "Verified" : "Pending Field Inspection"}
                  </span>
                </div>
              </div>

              {appState.remarks && (
                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950 space-y-1">
                  <span className="font-bold block">Logistics & Compliance Notes</span>
                  <p className="text-blue-900 text-xs">{appState.remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Assessment & Payment Details Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Fee Assessment & Payment Verification
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn("text-xs font-semibold", getPaymentStatusBadgeConfig(appState.paymentStatus).badgeClass)}
              >
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", getPaymentStatusBadgeConfig(appState.paymentStatus).dotColor)} />
                {appState.paymentStatus}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block uppercase">
                    Assessed Fee Total
                  </span>
                  <p className="text-base font-mono font-extrabold text-blue-700">
                    {formatPhpCurrency(appState.assessedAmount)}
                  </p>
                  <span className="text-[10px] text-slate-400 block">Per City Tax Ord. No. 132</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block uppercase">
                    Confirmed Amount Paid
                  </span>
                  <p className="text-base font-mono font-extrabold text-slate-900">
                    {formatPhpCurrency(appState.amountPaid)}
                  </p>
                  <span className="text-[10px] text-slate-400 block">
                    {isPaymentVerified ? "Verified with LGU account" : "Awaiting admin confirmation"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block uppercase">
                    Payment Method
                  </span>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {appState.paymentMethod || "Maya / CTO Cashier"}
                  </p>
                  <span className="text-[10px] text-slate-400 block">Selected payment channel</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium block uppercase">
                    Assessment Reference
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-900 truncate">
                    {appState.transactionReference}
                  </p>
                  <span className="text-[10px] text-slate-400 block">CTO Payment Tracking Code</span>
                </div>
              </div>

              {/* Status Specific Alerts */}
              {appState.paymentStatus === "Verified" ? (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-900 block">
                        Payment Verified & Official Receipt Issued
                      </span>
                      <span className="text-[11px] text-emerald-800">
                        Verified by <strong>{appState.verifiedBy || "CBPLD Treasury Officer"}</strong> on{" "}
                        {appState.verifiedAt
                          ? new Date(appState.verifiedAt).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : appState.paymentDate || "Recorded session"}
                        . Confirmed amount: {formatPhpCurrency(appState.amountPaid || appState.assessedAmount)}. Official Receipt (OR No. {appState.receiptNumber || "CTO-OR-2026-VERIFIED"}) has been delivered to the vendor&apos;s Documents section.
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                    Verified
                  </Badge>
                </div>
              ) : appState.paymentStatus === "Rejected" ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-rose-900">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Payment Details Rejected</span>
                    </div>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[11px] font-semibold">
                      Rejected
                    </Badge>
                  </div>
                  <p className="text-[11px] text-rose-900 font-medium leading-relaxed pl-6">
                    <strong>Rejection Reason:</strong> &ldquo;{appState.rejectionReason || "Submitted payment details could not be verified against municipal records."}&rdquo;
                  </p>
                  <span className="text-[10px] text-rose-700 block pl-6">
                    The vendor has been notified and can submit corrected payment details through their portal.
                  </span>
                </div>
              ) : appState.paymentStatus === "Pending Verification" ? (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-900 block">
                        GCash Online Payment — Pending Admin Verification
                      </span>
                      <span className="text-[11px] text-amber-800">
                        Vendor submitted GCash transaction reference #{appState.transactionReference} for {formatPhpCurrency(appState.amountPaid || appState.assessedAmount)}. Please confirm receipt in City Treasury / GCash Merchant account and verify below to issue the official receipt to the vendor.
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                    Pending Verification
                  </Badge>
                </div>
              ) : appState.paymentStatus === "Awaiting Cashier Payment" ? (
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-300 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Landmark className="w-4 h-4 text-sky-700 shrink-0" />
                    <div>
                      <span className="font-bold text-sky-900 block">
                        CTO Cashier Selected — Awaiting In-Person Payment
                      </span>
                      <span className="text-[11px] text-sky-800">
                        Vendor chose to pay at the City Treasurer&apos;s Office Cashier window. When cashier settlement is complete and physical receipt is issued, record the Official Receipt Number and click &ldquo;Verify Payment&rdquo; below to deliver the receipt to the vendor.
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-sky-100 text-sky-900 border-sky-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                    Awaiting Cashier Payment
                  </Badge>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-slate-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Payment Not Yet Settled
                      </span>
                      <span className="text-[11px] text-slate-600">
                        Payment has not been recorded for assessment reference {appState.transactionReference}.
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                    Unpaid
                  </Badge>
                </div>
              )}

              {/* Payment Evidence & Official Receipt Section */}
              <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Payment Evidence &amp; Official Receipt
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Channel: <strong className="text-slate-700">{appState.paymentMethod || "GCash / CTO Cashier"}</strong>
                  </span>
                </div>

                {appState.paymentStatus === "Verified" ? (
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Vendor Registration Payment Receipt
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            OR No: <strong className="text-emerald-700">{appState.receiptNumber || `CTO-OR-2026-${appState.applicationNumber.replace(/[^0-9]/g, "").slice(-4) || "1042"}`}</strong>
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 self-start sm:self-auto text-[11px]">
                        Delivered to Documents
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Amount Confirmed</span>
                        <span className="font-bold font-mono text-slate-900">{formatPhpCurrency(appState.amountPaid || appState.assessedAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Reference Code</span>
                        <span className="font-mono text-slate-800 truncate block">{appState.transactionReference}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Issue Date</span>
                        <span className="text-slate-800">{appState.verifiedAt ? new Date(appState.verifiedAt).toLocaleDateString() : "Current session"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Verified By</span>
                        <span className="text-slate-800 truncate block">{appState.verifiedBy || "CBPLD Treasury"}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Payment Mode</span>
                        <span className="font-semibold text-slate-900 mt-0.5 block">{appState.paymentMethod || "GCash — Pay Online"}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Declared Amount</span>
                        <span className="font-mono font-bold text-slate-900 mt-0.5 block">{formatPhpCurrency(appState.amountPaid || appState.assessedAmount)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Transaction / Tracking Ref</span>
                        <span className="font-mono font-bold text-blue-700 mt-0.5 block truncate">{appState.transactionReference}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        {appState.paymentStatus === "Awaiting Cashier Payment"
                          ? "Vendor will present assessment reference at the CTO Cashier window. Authorized staff confirms receipt of funds and records the OR Number."
                          : "Vendor paid via GCash QR code and declared transaction reference above. Staff validates with municipal accounts and records the OR Number."}
                      </span>
                    </div>

                    {appState.receiptUrl && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-600 font-mono truncate max-w-[200px]">
                          {appState.receiptFilename || "attached-receipt-file"}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setReceiptViewerModalOpen(true)}
                          className="text-xs font-semibold h-7 px-2.5 text-blue-700"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View Attachment
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Itemized Regulatory Fees */}
              {appState.payment?.feeBreakdown && appState.payment.feeBreakdown.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-xs font-bold text-slate-800 block">
                    Itemized Regulatory Fee Assessment:
                  </span>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 overflow-hidden text-xs">
                    {appState.payment.feeBreakdown.map((fee) => (
                      <div key={fee.id} className="p-2.5 px-3 flex items-center justify-between bg-white hover:bg-slate-50/50">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 block">{fee.name}</span>
                          <span className="text-[11px] text-slate-500 block">{fee.description}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          {formatPhpCurrency(fee.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critical Rule Callout */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-950 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>Critical Rule — Payment Verification Precedes Approval:</span>
                </div>
                <p className="text-blue-900/90 leading-relaxed text-[11px]">
                  An application cannot be approved or accepted until payment has been verified by an authorized administrator. Payment verification is strictly separate from permit approval: a verified payment confirms municipal fee settlement, but does not automatically approve the vendor registration.
                </p>
              </div>

              {/* Explicit Admin Action Buttons */}
              <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Admin Payment Review:</span>
                  <span className="ml-1 text-slate-500">
                    {isPaymentVerified
                      ? "Payment is verified. Registration approval can proceed if checklist is complete."
                      : "Review receipt above and verify or reject before deciding on approval."}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setRejectPaymentDialogOpen(true)}
                    className="text-rose-700 border-rose-300 hover:bg-rose-50 hover:text-rose-800 text-xs font-semibold h-9 px-3.5 rounded-xl cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
                    Reject Payment Proof
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    disabled={isPaymentVerified}
                    onClick={() => {
                      setConfirmedAmountPaidInput(
                        String(appState.assessedAmount || appState.amountPaid || 1450)
                      );
                      const fallbackOr =
                        appState.receiptNumber ||
                        appState.payment?.receiptNumber ||
                        `CTO-OR-2026-${appState.applicationNumber.replace(/[^0-9]/g, "").slice(-4) || "1042"}`;
                      setOfficialReceiptNumberInput(fallbackOr);
                      setVerifyPaymentError(null);
                      setVerifyPaymentDialogOpen(true);
                    }}
                    className={cn(
                      "text-xs font-bold h-9 px-4 rounded-xl cursor-pointer shadow-xs text-white",
                      isPaymentVerified
                        ? "bg-slate-300 cursor-not-allowed opacity-75"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    )}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    {isPaymentVerified ? "Payment Verified" : "Verify Payment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Government ID Review Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Government ID Review
                  </CardTitle>
                </div>
              </div>

              <Badge variant="outline" className="text-[11px] text-slate-600 bg-slate-50">
                Optional Document
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {appState.governmentIdDoc.submitted ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        PDF
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 font-mono">
                            {appState.governmentIdDoc.filename}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {appState.governmentIdDoc.idType} • 2.4 MB • Uploaded{" "}
                          {appState.governmentIdDoc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">
                        Status:
                      </span>
                      {appState.governmentIdStatus === "Submitted" && (
                        <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-semibold">
                          Submitted
                        </Badge>
                      )}
                      {appState.governmentIdStatus === "Verified" && (
                        <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-semibold">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {appState.governmentIdStatus === "Needs Replacement" && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Needs Replacement
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Status explanation notice for replacement */}
                  {appState.governmentIdStatus === "Needs Replacement" && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        &ldquo;Administrator requested a replacement document.&rdquo;
                      </span>
                    </div>
                  )}

                  {/* Document Preview Placeholder */}
                  <div className="rounded-xl border border-slate-200 bg-slate-900 p-4 sm:p-6 text-white relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
                      <span className="text-5xl font-extrabold uppercase -rotate-12 text-white tracking-widest text-center leading-none">
                        REPUBLIC OF THE PHILIPPINES
                        <br />
                        BUTUAN CITY LGU
                      </span>
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xs font-bold">
                            PH
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wider text-slate-300 font-bold block">
                              Republika ng Pilipinas
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              Philippine Identification System (PhilSys) Mock Preview
                            </span>
                          </div>
                        </div>

                        <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                          Preview Placeholder
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                        <div className="sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 space-y-1">
                          <User className="w-10 h-10 text-slate-400" />
                          <span className="text-[9px] uppercase font-bold text-slate-500">
                            Cardholder Photo
                          </span>
                        </div>

                        <div className="sm:col-span-3 space-y-1.5 text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                              Vendor Legal Name
                            </span>
                            <span className="font-bold text-white text-sm">
                              {(appState.ownerName || appState.businessName).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                              Business / Trade Name
                            </span>
                            <span className="font-bold text-white text-sm">
                              {appState.businessName.toUpperCase()}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div>
                              <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                                Document Type
                              </span>
                              <span className="font-mono text-amber-300 font-bold text-xs truncate block">
                                {appState.governmentIdDoc.idType}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] uppercase text-slate-400 block font-semibold">
                                Registered Location
                              </span>
                              <span className="text-slate-300 text-xs truncate block">
                                {appState.address.barangay}, {appState.address.city}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Application Ref: {appState.applicationNumber}</span>
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Document Attached
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. Document Action Controls */}
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDocPreviewOpen(true)}
                      className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer gap-1.5 h-8.5 rounded-xl"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleMarkDocVerified}
                      disabled={appState.governmentIdStatus === "Verified"}
                      className="text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 cursor-pointer gap-1.5 h-8.5 rounded-xl shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Verified</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestDocReplacement}
                      disabled={appState.governmentIdStatus === "Needs Replacement"}
                      className="text-xs font-semibold text-amber-800 border-amber-300 hover:bg-amber-50 disabled:opacity-50 cursor-pointer gap-1.5 h-8.5 rounded-xl"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Replacement</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/90 text-center space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <Info className="w-5 h-5 text-amber-700" />
                  </div>
                  <h4 className="text-sm font-bold text-amber-950">
                    No Government ID Submitted
                  </h4>
                  <p className="text-xs text-amber-800 max-w-sm mx-auto">
                    &ldquo;Government ID is optional.&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500 pt-1">
                    Do not mark the application incomplete just because the ID is missing. The application can still be approved without one.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 8. Application Activity Timeline Card (Newest First) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Application Activity
                </CardTitle>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Newest First ({appState.activity.length} Events)
              </span>
            </CardHeader>

            <CardContent className="p-5">
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {appState.activity.map((item, index) => {
                  return (
                    <div key={item.id} className="relative group">
                      <span
                        className={cn(
                          "absolute -left-6 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center -translate-x-1/2",
                          item.type === "approval" &&
                            "border-emerald-500 bg-emerald-50 text-emerald-600",
                          item.type === "rejection" &&
                            "border-rose-500 bg-rose-50 text-rose-600",
                          item.type === "correction" &&
                            "border-amber-500 bg-amber-50 text-amber-600",
                          (item.type === "submission" || item.type === "review") &&
                            "border-blue-500 bg-blue-50 text-blue-600"
                        )}
                      >
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            item.type === "approval" && "bg-emerald-600",
                            item.type === "rejection" && "bg-rose-600",
                            item.type === "correction" && "bg-amber-600",
                            (item.type === "submission" || item.type === "review") &&
                              "bg-blue-600"
                          )}
                        />
                      </span>

                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                            {item.title}
                          </h5>
                          {index === 0 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                              Latest
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.date}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= SIDE COLUMN (RIGHT - 5/12) ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Application Status Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Application Status
              </CardTitle>
              {getHeaderStatusBadge()}
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Current Phase</span>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    {appState.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Application Number</span>
                  <span className="font-mono font-bold text-slate-900">
                    {appState.applicationNumber}
                  </span>
                </div>

                {appState.status === "Approved" && (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                    <span className="text-emerald-700 font-semibold">
                      Vendor ID
                    </span>
                    <span className="font-mono font-extrabold text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded">
                      {appState.vendorId || "Pending assignment"}
                    </span>
                  </div>
                )}
              </div>

              {/* Status explanation messages per Requirements */}
              {appState.status === "Under Review" && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <span className="font-bold block">UNDER REVIEW</span>
                  <p className="text-[11px] text-amber-800">
                    Reviewing vendor business records and validating location against Butuan City zoning registry.
                  </p>
                </div>
              )}

              {appState.status === "Needs Correction" && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                  <span className="font-bold block">NEEDS CORRECTION</span>
                  <p className="text-[11px] text-rose-800 font-medium">
                    &ldquo;Waiting for the vendor to make corrections.&rdquo;
                  </p>
                </div>
              )}

              {appState.status === "Approved" && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                  <span className="font-bold block">APPROVED</span>
                  <p className="text-[11px] text-emerald-800">
                    &ldquo;Vendor registration approved.&rdquo;
                  </p>
                  <p className="text-[11px] font-mono font-bold text-emerald-900">
                    Vendor ID: {appState.vendorId || "Pending assignment"}
                  </p>
                </div>
              )}

              {appState.status === "Rejected" && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-300 text-xs text-slate-800 space-y-1">
                  <span className="font-bold block text-slate-900">REJECTED</span>
                  <p className="text-[11px] text-slate-600">
                    {appState.remarks
                      ? `Reason: ${appState.remarks}`
                      : "The vendor application was rejected during administrative evaluation."}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 6. Review Checklist Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Review Checklist
                </CardTitle>
              </div>

              {/* Dynamic counter: X of 5 items reviewed */}
              <span className="text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                {checkedCount} of {totalChecklistItems} items reviewed
              </span>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3">
                {/* 1. Business Info */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    id="check-business-info"
                    checked={appState.checklist.businessInfo}
                    onCheckedChange={(checked) =>
                      handleToggleChecklist("businessInfo", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                    Business information reviewed
                  </span>
                </label>

                {/* 2. Owner Info */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    id="check-owner-info"
                    checked={appState.checklist.ownerInfo}
                    onCheckedChange={(checked) =>
                      handleToggleChecklist("ownerInfo", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                    Owner information reviewed
                  </span>
                </label>

                {/* 3. Contact Info */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    id="check-contact-info"
                    checked={appState.checklist.contactInfo}
                    onCheckedChange={(checked) =>
                      handleToggleChecklist("contactInfo", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                    Contact information reviewed
                  </span>
                </label>

                {/* 4. Business Address */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    id="check-business-address"
                    checked={appState.checklist.businessAddress}
                    onCheckedChange={(checked) =>
                      handleToggleChecklist("businessAddress", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium">
                    Business address reviewed
                  </span>
                </label>

                {/* 5. Government ID */}
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <Checkbox
                    id="check-government-id"
                    checked={appState.checklist.governmentId}
                    onCheckedChange={(checked) =>
                      handleToggleChecklist("governmentId", Boolean(checked))
                    }
                    className="mt-0.5"
                  />
                  <div>
                    <span className="text-xs sm:text-sm text-slate-700 group-hover:text-slate-900 font-medium block">
                      Government ID reviewed, if provided
                    </span>
                  </div>
                </label>
              </div>

              {/* Requirement 6 Small Note */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="italic text-slate-500">
                  &ldquo;Government ID is optional.&rdquo;
                </span>
                <div className="flex items-center gap-2">
                  {!isRequiredChecklistComplete && (
                    <button
                      type="button"
                      onClick={handleCheckRequiredOnly}
                      className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
                    >
                      Check required
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleCheckAll}
                    className="text-slate-600 hover:text-slate-800 font-semibold cursor-pointer underline"
                  >
                    {allChecked ? "Uncheck all" : "Check all"}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Administrator Remarks Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Administrator Remarks
              </CardTitle>
              <span className="text-[11px] text-slate-400 font-medium">
                Live Synced with Vendor
              </span>
            </CardHeader>

            <CardContent className="p-5 space-y-3">
              <div className="space-y-1.5">
                <Textarea
                  id="admin-remarks"
                  placeholder="Enter remarks or instructions for the vendor..."
                  value={appState.remarks}
                  onChange={(e) => setRemarksDraft(e.target.value.slice(0, 500))}
                  rows={4}
                  className="text-xs sm:text-sm bg-slate-50/60 border-slate-300 focus:bg-white resize-none rounded-xl"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 px-1">
                  <span>Synced to Vendor Dashboard &ldquo;Attention Required&rdquo; section</span>
                  <span className="font-mono font-medium text-slate-500">
                    {appState.remarks.length} / 500 characters
                  </span>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveRemarks}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg cursor-pointer shadow-2xs"
                  >
                    Save Remarks
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 10, 12. Application Actions Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-900">
                Application Actions
              </CardTitle>
              <p className="text-xs text-slate-500">
                Manage and determine application evaluation status.
              </p>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {/* Requirement 5: Admin Action Area with Application Status Dropdown */}
              <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
                <label
                  htmlFor="admin-status-dropdown"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider block"
                >
                  Application Status
                </label>
                <div className="relative">
                  <select
                    id="admin-status-dropdown"
                    value={appState.status}
                    onChange={(e) => handleAdminStatusChange(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Needs Correction">Needs Correction</option>
                    <option value="Correction Submitted">Correction Submitted</option>
                    <option value="Approved" disabled={!isPaymentVerified}>
                      {!isPaymentVerified ? "Approved (Payment Verification Required)" : "Approved"}
                    </option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 pt-0.5">
                  Selecting a status immediately synchronizes Vendor Dashboard &amp; My Application.
                </p>
              </div>

              {/* Status specific indicators and action triggers */}
              {appState.status === "Approved" ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-emerald-950">
                    Application Approved
                  </h4>
                  <p className="text-xs text-emerald-800">
                    &ldquo;Application approved.&rdquo;
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-900 pt-0.5">
                    Vendor ID: {appState.vendorId || `BUT-V-${appState.applicationNumber.replace(/\D/g, "").slice(-6) || "000001"}`}
                  </p>
                </div>
              ) : appState.status === "Needs Correction" ? (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-rose-950">
                    Waiting for Vendor Correction
                  </h4>
                  <p className="text-xs text-rose-800">
                    &ldquo;Waiting for vendor correction.&rdquo;
                  </p>
                </div>
              ) : appState.status === "Rejected" ? (
                <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-center space-y-1.5">
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mx-auto">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-950">
                    Application Rejected
                  </h4>
                  <p className="text-xs text-slate-700">
                    &ldquo;Application rejected.&rdquo;
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <Button
                    type="button"
                    disabled={!isPaymentVerified}
                    onClick={() => {
                      if (!isPaymentVerified) {
                        showNotification(
                          `Approval Blocked: Payment must be verified by an administrator before this application can be approved. (Current: ${appState.paymentStatus})`,
                          "destructive"
                        );
                        return;
                      }
                      setApproveDialogOpen(true);
                    }}
                    className={cn(
                      "w-full h-11 font-bold text-sm cursor-pointer gap-2 rounded-xl shadow-xs",
                      isPaymentVerified
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-slate-200 text-slate-500 cursor-not-allowed hover:bg-slate-200"
                    )}
                    title={
                      isPaymentVerified
                        ? "Approve application"
                        : `Approval blocked: payment status is ${appState.paymentStatus}`
                    }
                  >
                    {!isPaymentVerified ? (
                      <Lock className="w-4 h-4 text-slate-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Approve Application</span>
                  </Button>

                  {!isPaymentVerified && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Approval Locked: Payment Unverified</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Critical Rule: Application approval is blocked until payment proof has been verified by an administrator (Payment Status: <strong>{appState.paymentStatus}</strong>).
                      </p>
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCorrectionDialogOpen(true)}
                    className="w-full h-10 text-amber-900 bg-amber-50/70 border-amber-300 hover:bg-amber-100 font-semibold text-xs sm:text-sm cursor-pointer gap-2 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Request Correction</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRejectDialogOpen(true)}
                    className="w-full h-10 text-rose-800 bg-rose-50/70 border-rose-300 hover:bg-rose-100 font-semibold text-xs sm:text-sm cursor-pointer gap-2 rounded-xl"
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Reject Application</span>
                  </Button>

                  {!isRequiredChecklistComplete && isPaymentVerified && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 text-center font-medium">
                      Notice: Complete the required review checklist before approving.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone Card (Requirement 6 - shown only when status is Rejected) */}
          {appState.status === "Rejected" && (
            <Card className="bg-rose-50/40 border border-rose-300 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="p-5 pb-3 border-b border-rose-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base font-bold text-rose-900">
                    Danger Zone
                  </CardTitle>
                </div>
                <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[11px] font-semibold">
                  Rejected Application
                </Badge>
              </CardHeader>

              <CardContent className="p-5 space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Delete Rejected Application
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Permanently delete this rejected application from the records. Once deleted, this application will be removed from the current application list and cannot be undone.
                  </p>
                </div>

                <div className="pt-1">
                  <Button
                    type="button"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="w-full h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm cursor-pointer gap-2 rounded-xl shadow-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Application</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ================= 7. APPROVE CONFIRMATION DIALOG ================= */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-1">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Approve Vendor Application?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              &ldquo;Please confirm that you have reviewed the vendor&apos;s application and are ready to approve it.&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            {/* 7. Clear Summary */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Business:</span>
                <span className="font-bold text-slate-900">
                  {appState.businessName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Owner:</span>
                <span className="font-bold text-slate-900">{appState.ownerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Application:</span>
                <span className="font-mono font-bold text-slate-900">
                  {appState.applicationNumber}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Checklist:</span>
                <span
                  className={cn(
                    "font-bold",
                    isRequiredChecklistComplete
                      ? "text-emerald-700"
                      : "text-rose-600"
                  )}
                >
                  {checkedCount} of {totalChecklistItems} reviewed
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-slate-500">Payment Status:</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-semibold", getPaymentStatusBadgeConfig(appState.paymentStatus).badgeClass)}
                >
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", getPaymentStatusBadgeConfig(appState.paymentStatus).dotColor)} />
                  {appState.paymentStatus}
                </Badge>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <span className="text-emerald-700 font-semibold">
                  Vendor ID to Issue:
                </span>
                <span className="font-mono font-extrabold text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded">
                  {appState.vendorId || `BUT-V-${appState.applicationNumber.replace(/\D/g, "").slice(-6) || "000001"}`}
                </span>
              </div>
            </div>

            {/* Critical Payment Rule Blocker */}
            {!isPaymentVerified && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-bold text-rose-900">
                      Approval Blocked: Payment Verification Mandatory
                    </p>
                    <p className="text-rose-800 text-[11px] leading-relaxed">
                      Critical Business Rule: An application must not be approved until its payment has been verified by an authorized administrator (Current payment status: <strong>{appState.paymentStatus}</strong>). Please verify the proof of payment first.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Checklist Incomplete Blocker */}
            {!isRequiredChecklistComplete ? (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold">
                      &ldquo;Please complete the required review checklist before approving this application.&rdquo;
                    </p>
                    <p className="text-rose-700 text-[11px]">
                      Required items: Business info, Owner info, Contact info, and Business address. Government ID is optional.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCheckRequiredOnly}
                  className="w-full text-xs font-semibold text-rose-900 border-rose-300 hover:bg-rose-100 cursor-pointer h-8 rounded-lg"
                >
                  Check All Required Items Now
                </Button>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  All required checklist items have been satisfied.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!isPaymentVerified || !isRequiredChecklistComplete}
              onClick={handleApproveConfirm}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl cursor-pointer"
            >
              Approve Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= 3. REQUEST CORRECTION DIALOG ================= */}
      <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Request Correction
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              &ldquo;Tell the vendor what needs to be corrected.&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
              <span>Application: </span>
              <strong className="font-mono">{appState.applicationNumber}</strong> —{" "}
              <strong>{appState.businessName}</strong>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="correction-input"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>Correction Instructions</span>
                <span className="text-[11px] text-rose-500 font-normal">
                  * Required
                </span>
              </label>
              <Textarea
                id="correction-input"
                placeholder="Enter correction instructions..."
                value={correctionInput}
                onChange={(e) => setCorrectionInput(e.target.value)}
                rows={4}
                className={cn(
                  "text-xs sm:text-sm bg-slate-50 border-slate-300 focus:bg-white resize-none rounded-xl",
                  !correctionInput.trim() && "border-rose-400 focus:ring-rose-400"
                )}
              />
              {!correctionInput.trim() && (
                <p className="text-[11px] text-rose-600 font-medium">
                  Please provide a correction message for the vendor.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCorrectionDialogOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!correctionInput.trim()}
              onClick={handleRequestCorrectionConfirm}
              className="text-xs font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl"
            >
              Request Correction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= 4. REJECT DIALOG ================= */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-1">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Reject Application
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              &ldquo;Please provide a reason for rejecting this application.&rdquo;
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900">
              <span>Application: </span>
              <strong className="font-mono">{appState.applicationNumber}</strong> —{" "}
              <strong>{appState.businessName}</strong>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="rejection-input"
                className="text-xs font-semibold text-slate-700 flex items-center justify-between"
              >
                <span>Reason for Rejection</span>
                <span className="text-[11px] text-rose-500 font-normal">
                  * Required
                </span>
              </label>
              <Textarea
                id="rejection-input"
                placeholder="Enter reason for rejection..."
                value={rejectionInput}
                onChange={(e) => setRejectionInput(e.target.value)}
                rows={4}
                className={cn(
                  "text-xs sm:text-sm bg-slate-50 border-slate-300 focus:bg-white resize-none rounded-xl",
                  !rejectionInput.trim() && "border-rose-400 focus:ring-rose-400"
                )}
              />
              {!rejectionInput.trim() && (
                <p className="text-[11px] text-rose-600 font-medium">
                  A rejection reason is required before rejecting this application.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!rejectionInput.trim()}
              onClick={handleRejectConfirm}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl"
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DOCUMENT VIEWER DIALOG ================= */}
      <Dialog open={docPreviewOpen} onOpenChange={setDocPreviewOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              <span>Government ID Preview — {appState.governmentIdDoc.filename}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Official document attached for administrative credential verification.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3 space-y-4">
            <div className="rounded-xl border border-slate-300 bg-slate-900 text-white p-6 relative overflow-hidden shadow-lg">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 select-none">
                <span className="text-6xl font-black uppercase text-center leading-none">
                  CONFIDENTIAL
                  <br />
                  BUTUAN LGU REVIEW
                </span>
              </div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <div className="flex items-center gap-2">
                    <Stamp className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wider block text-amber-300">
                        Republic of the Philippines
                      </span>
                      <span className="text-[10px] text-slate-300">
                        Philippine Identification System (PhilSys Card)
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                    Legible Scan
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 py-2">
                  <div className="col-span-1 rounded-lg bg-slate-800 border border-slate-700 p-3 flex flex-col items-center justify-center space-y-1">
                    <User className="w-12 h-12 text-slate-400" />
                    <span className="text-[9px] uppercase font-bold text-slate-400">
                      Photo ID
                    </span>
                  </div>

                  <div className="col-span-2 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        Full Name
                      </span>
                      <span className="font-bold text-white text-sm">
                        {appState.ownerName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        Registered Address
                      </span>
                      <span className="text-slate-200">
                        123 J.C. Aquino Avenue, Baan KM 3, Butuan City
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-medium block">
                        PhilSys Card Number
                      </span>
                      <span className="font-mono text-amber-300 font-bold">
                        9841-2041-8819-0128
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>File: {appState.governmentIdDoc.filename} (2.4 MB)</span>
                  <span>SHA-256 Verified</span>
                </div>
              </div>
            </div>

            {/* Quick action controls inside modal */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">Evaluation Action:</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={appState.governmentIdStatus === "Verified"}
                  onClick={() => {
                    handleMarkDocVerified();
                    setDocPreviewOpen(false);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Mark as Verified
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={appState.governmentIdStatus === "Needs Replacement"}
                  onClick={() => {
                    handleRequestDocReplacement();
                    setDocPreviewOpen(false);
                  }}
                  className="text-amber-800 border-amber-300 hover:bg-amber-50 disabled:opacity-50 text-xs font-semibold"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  Request Replacement
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDocPreviewOpen(false)}
              className="text-xs font-semibold"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Delete this application?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete application{" "}
              <span className="font-mono font-bold text-slate-900">
                {appState.applicationNumber}
              </span>
              ? This application will be removed from the current application list and this action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Business Name:</span>
                <span className="font-bold text-slate-900">{appState.businessName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Owner:</span>
                <span className="text-slate-800">{appState.ownerName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />
                  {appState.status}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="text-xs font-semibold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 cursor-pointer"
            >
              Delete Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= VERIFY PAYMENT DIALOG ================= */}
      <Dialog
        open={verifyPaymentDialogOpen}
        onOpenChange={(open) => {
          if (!open && !isVerifyingPayment) {
            setVerifyPaymentError(null);
            setVerifyPaymentDialogOpen(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={!isVerifyingPayment}
          className="sm:max-w-md w-full !max-h-[90dvh] !flex !flex-col !p-0 !gap-0 overflow-hidden bg-white rounded-2xl shadow-2xl border border-slate-200"
          style={{ display: "flex", flexDirection: "column", maxHeight: "90dvh" }}
        >
          {/* Modal Header - Fixed/Pinned */}
          <div className="px-5 py-4 border-b border-slate-100 shrink-0 bg-white">
            <DialogHeader className="gap-1 pr-7 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                    Verify Vendor Payment Proof
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500 mt-0.5">
                    Confirm the payment details and issue the official receipt.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Modal Content - Independently Scrollable */}
          <div className="overflow-y-auto flex-1 min-h-0 px-5 py-4 space-y-3.5">
            {/* Payment Information Summary */}
            <div className="rounded-xl bg-slate-50/90 border border-slate-200/80 p-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Application Number</span>
                  <span className="font-mono font-bold text-slate-900">{appState.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Business / Owner</span>
                  <span
                    className="font-semibold text-slate-900 truncate block"
                    title={`${appState.businessName}${appState.ownerName ? ` (${appState.ownerName})` : ""}`}
                  >
                    {appState.businessName}
                    {appState.ownerName ? ` • ${appState.ownerName}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Payment Method</span>
                  <span className="font-semibold text-slate-800">
                    {appState.paymentMethod || "Over the Counter (Treasury)"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] font-medium">Transaction Reference</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {appState.transactionReference || "N/A"}
                  </span>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-slate-600 font-semibold text-xs">Assessed Fee</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatPhpCurrency(appState.assessedAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Input Fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="confirmed-amount-input" className="text-xs font-semibold text-slate-700 block">
                  Amount Received (₱)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">
                    ₱
                  </span>
                  <Input
                    id="confirmed-amount-input"
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={isVerifyingPayment}
                    value={confirmedAmountPaidInput}
                    onChange={(e) => {
                      setConfirmedAmountPaidInput(e.target.value);
                      if (verifyPaymentError) setVerifyPaymentError(null);
                    }}
                    placeholder={String(appState.assessedAmount || 1450)}
                    className="h-9.5 pl-7 text-sm font-mono bg-white border-slate-300 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="official-receipt-input" className="text-xs font-semibold text-slate-700 block">
                  Official Receipt (OR) Number
                </label>
                <Input
                  id="official-receipt-input"
                  disabled={isVerifyingPayment}
                  value={officialReceiptNumberInput}
                  onChange={(e) => {
                    setOfficialReceiptNumberInput(e.target.value);
                    if (verifyPaymentError) setVerifyPaymentError(null);
                  }}
                  placeholder="e.g. CTO-OR-2026-0042"
                  className="h-9.5 text-xs sm:text-sm font-mono bg-white border-slate-300 rounded-xl focus-visible:ring-1 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {verifyPaymentError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{verifyPaymentError}</span>
              </div>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/90 shrink-0 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={isVerifyingPayment}
              onClick={() => {
                setVerifyPaymentError(null);
                setVerifyPaymentDialogOpen(false);
              }}
              className="text-xs font-semibold rounded-xl h-9 px-4 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                isVerifyingPayment ||
                !confirmedAmountPaidInput.trim() ||
                Number(confirmedAmountPaidInput) <= 0 ||
                !officialReceiptNumberInput.trim()
              }
              onClick={handleVerifyPaymentConfirm}
              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-9 px-4 cursor-pointer shadow-xs inline-flex items-center"
            >
              {isVerifyingPayment ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                  Verify Payment
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ================= REJECT PAYMENT PROOF DIALOG ================= */}
      <Dialog open={rejectPaymentDialogOpen} onOpenChange={setRejectPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-1">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Reject Proof of Payment
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Specify the reason why this payment proof cannot be accepted. This reason will be displayed to the vendor so they can upload a corrected receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1">
              <div>
                <span>Application: </span>
                <strong className="font-mono">{appState.applicationNumber}</strong> — <strong>{appState.businessName}</strong>
              </div>
              <div>
                <span>Transaction Reference: </span>
                <strong className="font-mono">{appState.transactionReference}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="payment-rejection-input" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Rejection Reason</span>
                <span className="text-[11px] text-rose-500 font-normal">* Required</span>
              </label>
              <Textarea
                id="payment-rejection-input"
                placeholder="Enter specific instructions on what the vendor needs to correct or re-upload..."
                value={paymentRejectionReason}
                onChange={(e) => setPaymentRejectionReason(e.target.value)}
                rows={4}
                className={cn(
                  "text-xs sm:text-sm bg-slate-50 border-slate-300 focus:bg-white resize-none rounded-xl",
                  !paymentRejectionReason.trim() && "border-rose-400 focus:ring-rose-400"
                )}
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Quick reason templates:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Unreadable or blurry receipt image",
                  "Amount paid does not match assessed fee",
                  "Transaction reference not found in LGU records",
                  "Payment made to wrong account or channel",
                  "Duplicate or previously submitted receipt",
                ].map((reasonChip) => (
                  <button
                    key={reasonChip}
                    type="button"
                    onClick={() => setPaymentRejectionReason(reasonChip)}
                    className="text-[10px] px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors text-left"
                  >
                    {reasonChip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectPaymentDialogOpen(false)}
              className="text-xs font-semibold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!paymentRejectionReason.trim()}
              onClick={handleRejectPaymentConfirm}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-9 cursor-pointer"
            >
              Reject Payment Proof
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= RECEIPT VIEWER DIALOG ================= */}
      <Dialog open={receiptViewerModalOpen} onOpenChange={setReceiptViewerModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-blue-700" />
                <span>Proof of Payment — {appState.receiptFilename || "Receipt Document"}</span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Submitted by {appState.ownerName} ({appState.businessName}) • Ref: {appState.transactionReference}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 flex items-center justify-center min-h-[300px] max-h-[65vh] overflow-auto">
              {appState.receiptUrl ? (
                appState.receiptFileType?.includes("pdf") || (appState.receiptFilename && appState.receiptFilename.toLowerCase().endsWith(".pdf")) ? (
                  <div className="text-center text-white p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg">
                      PDF
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{appState.receiptFilename}</p>
                      <p className="text-xs text-slate-400">PDF Document • {appState.receiptFileSize ? `${(appState.receiptFileSize / 1024 / 1024).toFixed(2)} MB` : "Document"}</p>
                    </div>
                    <div className="pt-2">
                      <a
                        href={appState.receiptUrl}
                        download={appState.receiptFilename || "payment-receipt.pdf"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700 text-white text-xs")}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download & Open PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={appState.receiptUrl}
                    alt="Proof of Payment"
                    className="max-h-[60vh] max-w-full object-contain rounded-lg"
                  />
                )
              ) : (
                <div className="text-center text-slate-400 p-8 space-y-2">
                  <Receipt className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No Receipt Image Data</p>
                  <p className="text-xs text-slate-500">The applicant has not yet uploaded a receipt file.</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Method:</span>{" "}
                <span className="font-semibold text-slate-900">{appState.paymentMethod}</span>
              </div>
              <div>
                <span className="text-slate-500">Reference:</span>{" "}
                <span className="font-mono font-bold text-slate-900">{appState.transactionReference}</span>
              </div>
              <div>
                <span className="text-slate-500">Uploaded:</span>{" "}
                <span className="text-slate-700">{appState.receiptUploadedAt || appState.submittedDate}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:gap-0 pt-1">
            {appState.receiptUrl ? (
              <a
                href={appState.receiptUrl}
                download={appState.receiptFilename || `receipt-${appState.applicationNumber}.jpg`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold gap-1.5")}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </a>
            ) : <div />}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReceiptViewerModalOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
