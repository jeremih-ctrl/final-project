"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Store,
  Copy,
  Check,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  CreditCard,
  Receipt,
  Upload,
  Eye,
  Download,
  Trash2,
  QrCode,
  Landmark,
  Wallet,
  RefreshCw,
  Files,
  ExternalLink,
  PlusCircle,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { VendorApplication, PaymentInformation } from "@/lib/types/vendor-application";
import { saveSharedApplication } from "@/lib/vendor-application-state";
import { useAppRole } from "@/lib/clerk-roles";
import {
  formatPhpCurrency,
  getPaymentStatusBadgeConfig,
  LGU_EWALLET_INSTRUCTIONS,
  LGU_BANK_TRANSFER_INSTRUCTIONS,
} from "@/lib/payment-fee-schedule";

type StatusState =
  | "draft"
  | "submitted"
  | "under-review"
  | "needs-correction"
  | "correction-submitted"
  | "approved"
  | "rejected";

interface DynamicActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  dotColor: "emerald" | "amber" | "orange" | "blue" | "rose" | "slate";
}

function normalizeStatus(rawStatus?: string): StatusState {
  if (!rawStatus) return "submitted";
  const s = rawStatus.toLowerCase().trim().replace(/[\s_]+/g, "-");
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
    case "action-required":
      return "needs-correction";
    case "correction-submitted":
    case "correctionsubmitted":
      return "correction-submitted";
    case "approved":
      return "approved";
    case "rejected":
    case "not-approved":
      return "rejected";
    default:
      return "submitted";
  }
}

function formatAppDate(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function buildActivityTimeline(
  app: VendorApplication,
  status: StatusState
): DynamicActivity[] {
  if (app.statusHistory && app.statusHistory.length > 0) {
    return [...app.statusHistory]
      .reverse()
      .map((h, i) => {
        const norm = normalizeStatus(h.newStatus);
        let dotColor: DynamicActivity["dotColor"] = "blue";
        if (norm === "approved") dotColor = "emerald";
        else if (norm === "needs-correction") dotColor = "orange";
        else if (norm === "under-review") dotColor = "amber";
        else if (norm === "rejected") dotColor = "rose";

        return {
          id: h.id || `hist-${i}`,
          title: h.action || `Status: ${h.newStatus}`,
          description:
            h.remark ||
            `Application transition by ${h.actionBy || "Administrator"}.`,
          date: formatAppDate(h.timestamp),
          dotColor,
        };
      });
  }

  const activities: DynamicActivity[] = [];
  const submittedDate = formatAppDate(app.submittedAt);
  const updatedDate = formatAppDate(app.updatedAt);

  if (status === "approved") {
    activities.push({
      id: "act-approved",
      title: "Application Approved & Verified",
      description:
        "Municipal evaluation completed. Official vendor accreditation issued.",
      date: updatedDate,
      dotColor: "emerald",
    });
  } else if (status === "needs-correction") {
    activities.push({
      id: "act-correction",
      title: "Correction Requested",
      description:
        app.adminRemarks ||
        "Administrator requested adjustments to application documents or information.",
      date: updatedDate,
      dotColor: "orange",
    });
  } else if (status === "correction-submitted") {
    activities.push({
      id: "act-cor-sub",
      title: "Corrections Submitted",
      description:
        "Updated documents and details submitted. Awaiting secondary review.",
      date: updatedDate,
      dotColor: "blue",
    });
  } else if (status === "rejected") {
    activities.push({
      id: "act-rejected",
      title: "Application Not Approved",
      description:
        app.adminRemarks ||
        "Application could not be approved due to compliance criteria.",
      date: updatedDate,
      dotColor: "rose",
    });
  } else if (status === "under-review") {
    activities.push({
      id: "act-review",
      title: "Under Administrative Review",
      description:
        "LGU licensing review officers are verifying registration requirements.",
      date: updatedDate,
      dotColor: "amber",
    });
  }

  if (app.submittedAt) {
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration packet received by Butuan City LGU.",
      date: submittedDate,
      dotColor: "blue",
    });
  }

  return activities;
}

export default function VendorMyApplicationPage() {
  const searchParams = useSearchParams();
  const requestedAppNumber = searchParams.get("appNumber") || searchParams.get("ref") || searchParams.get("id");
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, email: clerkEmail } = useAppRole();

  // Application data state
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "details">(requestedAppNumber ? "details" : "list");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUnauthorizedRequestedApp, setIsUnauthorizedRequestedApp] = useState(false);

  // Clipboard copy state
  const [copied, setCopied] = useState(false);

  // Modals state
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [viewReceiptModalOpen, setViewReceiptModalOpen] = useState(false);
  const [viewCertificateOpen, setViewCertificateOpen] = useState(false);

  // Payment proof resubmit state
  const [resubmitFileDataUrl, setResubmitFileDataUrl] = useState<string | null>(null);
  const [resubmitFilename, setResubmitFilename] = useState<string>("");
  const [resubmitFileType, setResubmitFileType] = useState<string>("");
  const [resubmitFileSize, setResubmitFileSize] = useState<number>(0);
  const [resubmitCategory, setResubmitCategory] = useState<"e_wallet" | "bank_transfer" | "card" | "other">("e_wallet");
  const [resubmitMethodName, setResubmitMethodName] = useState("Maya / GCash (Official E-Wallet)");
  const [resubmitTxRef, setResubmitTxRef] = useState("");
  const [resubmitAmountPaid, setResubmitAmountPaid] = useState("");
  const resubmitPaymentDate = "";
  const [resubmitFileError, setResubmitFileError] = useState<string | null>(null);
  const [resubmitSuccessMessage, setResubmitSuccessMessage] = useState<string | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Clear application state immediately on user change
  const [prevUserId, setPrevUserId] = useState(clerkUser?.id);
  if (clerkUser?.id !== prevUserId) {
    setPrevUserId(clerkUser?.id);
    setApplications([]);
    setSelectedAppId(null);
    setIsUnauthorizedRequestedApp(false);
  }

  // Fetch applications linked to currently authenticated Clerk user
  const fetchVendorApplications = useCallback(async () => {
    if (!clerkUser?.id) return;
    setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/vendor/application", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "Your session has expired. Please sign in again."
            : "Failed to retrieve application records from the server."
        );
      }

      const data = await res.json().catch(() => ({}));
      const rawList: VendorApplication[] = Array.isArray(data?.applications)
        ? data.applications
        : data?.application
        ? [data.application]
        : [];

      // Strict vendor isolation: only retain applications owned by authenticated Clerk user
      const list = rawList.filter(
        (app) => app.userId === clerkUser.id || (app as unknown as { clerkUserId?: string }).clerkUserId === clerkUser.id
      );

      setApplications(list);

      // Select initial application
      if (list.length > 0) {
        if (requestedAppNumber) {
          const match = list.find(
            (a) =>
              a.id?.toLowerCase() === requestedAppNumber.trim().toLowerCase() ||
              a.applicationNumber?.toLowerCase() === requestedAppNumber.trim().toLowerCase()
          );
          if (match) {
            setSelectedAppId(match.applicationNumber || match.id);
            saveSharedApplication(match);
            setIsUnauthorizedRequestedApp(false);
            setViewMode("details");
          } else {
            // Requested application reference does not belong to this vendor account!
            setSelectedAppId(null);
            setIsUnauthorizedRequestedApp(true);
            return;
          }
        } else {
          setSelectedAppId(list[0].applicationNumber || list[0].id);
          saveSharedApplication(list[0]);
          setIsUnauthorizedRequestedApp(false);
        }
      } else {
        setSelectedAppId(null);
        if (requestedAppNumber) {
          setIsUnauthorizedRequestedApp(true);
        }
      }
    } catch (err) {
      console.error("Failed to load vendor application:", err);
      setLoadError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, requestedAppNumber]);

  useEffect(() => {
    if (!isClerkLoaded || !isClerkSignedIn) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) {
        fetchVendorApplications();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, isClerkSignedIn, fetchVendorApplications]);

  // Resolve currently selected application
  const activeApp: VendorApplication | null = useMemo(() => {
    if (!applications || applications.length === 0) return null;
    if (!selectedAppId) return applications[0];

    const match = applications.find(
      (a) =>
        a.id?.toLowerCase() === selectedAppId.toLowerCase() ||
        a.applicationNumber?.toLowerCase() === selectedAppId.toLowerCase()
    );
    return match || applications[0];
  }, [applications, selectedAppId]);

  const handleCopy = () => {
    if (!activeApp) return;
    const num = activeApp.applicationNumber || activeApp.id;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleResubmitFileSelect = (file: File) => {
    setResubmitFileError(null);
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    const isImage = validTypes.includes(file.type) || /\.(jpg|jpeg|png)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setResubmitFileError("Unsupported file format. Please upload JPG, JPEG, PNG, or PDF.");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setResubmitFileError(
        `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 5MB limit. Please upload a smaller file.`
      );
      return;
    }

    setResubmitFilename(file.name);
    setResubmitFileType(file.type || (isPdf ? "application/pdf" : "image/jpeg"));
    setResubmitFileSize(file.size);

    const reader = new FileReader();
    reader.onload = () => {
      setResubmitFileDataUrl(reader.result as string);
    };
    reader.onerror = () => {
      setResubmitFileError("Failed to read file. Please choose the file again.");
    };
    reader.readAsDataURL(file);
  };

  const handleResubmitProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;

    if (!resubmitFileDataUrl) {
      setResubmitFileError("Please upload your payment receipt before submitting.");
      return;
    }

    if (!resubmitTxRef.trim()) {
      setResubmitFileError("Please enter your transaction or reference number.");
      return;
    }

    setIsSubmittingProof(true);

    const formattedDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const currentFee = activeApp.payment?.assessedAmount ?? 1450;
    const parsedAmount = Number(resubmitAmountPaid) || currentFee;

    const updatedPayment: PaymentInformation = {
      ...(activeApp.payment || {
        assessedAmount: currentFee,
        currency: "PHP",
        feeBreakdown: [],
        assessmentStatus: "pending_verification",
      }),
      status: "pending_verification",
      amountPaid: parsedAmount,
      paymentMethod: resubmitMethodName,
      methodName: resubmitMethodName,
      paymentMethodCategory: resubmitCategory,
      transactionReference: resubmitTxRef.trim(),
      paymentDate: resubmitPaymentDate || formattedDate,
      receiptUrl: resubmitFileDataUrl,
      receiptFilename: resubmitFilename || "payment-receipt",
      receiptFileType: resubmitFileType,
      receiptFileSize: resubmitFileSize,
      receiptUploadedAt: formattedDate,
      rejectionReason: undefined,
    };

    const updatedApp: VendorApplication = {
      ...activeApp,
      payment: updatedPayment,
      paymentStatus: "pending_verification",
      amountPaid: parsedAmount,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/vendor/application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedApp),
      });

      if (!res.ok) {
        throw new Error("Failed to save updated proof of payment on server.");
      }

      // Update local state and shared application
      saveSharedApplication(updatedApp);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === updatedApp.id || app.applicationNumber === updatedApp.applicationNumber
            ? updatedApp
            : app
        )
      );

      setIsSubmittingProof(false);
      setResubmitModalOpen(false);
      setResubmitSuccessMessage(
        "Proof of payment submitted successfully! Your receipt is now pending administrator verification."
      );
    } catch (err) {
      console.error("Proof submission failed:", err);
      setResubmitFileError("Could not submit proof of payment. Please try again.");
      setIsSubmittingProof(false);
    }
  };

  // ─── 1. Loading State ────────────────────────────────────────────────────────
  if (!isClerkLoaded || isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-bold text-slate-800">
            Retrieving Your Application
          </p>
          <p className="text-xs text-slate-500">
            Accessing registered business records linked to your account...
          </p>
        </div>
      </div>
    );
  }

  // ─── 2. Error & Retry State ──────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <Card className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[11px] font-bold uppercase tracking-wider">
              Connection Error
            </Badge>
            <h2 className="text-xl font-bold text-slate-900">
              Unable to Load Application
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {loadError}
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              type="button"
              onClick={fetchVendorApplications}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-2" />
              Retry Loading Application
            </Button>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-xs font-semibold text-slate-700 h-10 rounded-xl"
              )}
            >
              Back to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ─── 3. Application Not Found / Access Denied (Unauthorized ID query) ───────
  if (isUnauthorizedRequestedApp) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-bold uppercase tracking-wider">
              Application Not Found or Access Denied
            </Badge>
            <h2 className="text-xl font-bold text-slate-900">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The requested application reference does not exist or you do not have permission to view it under this vendor account.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/dashboard/my-application"
              onClick={() => setIsUnauthorizedRequestedApp(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shadow-xs gap-1.5 inline-flex items-center"
              )}
            >
              <FileText className="w-4 h-4 mr-1.5" />
              View My Applications
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-xs font-semibold text-slate-700 h-10 rounded-xl"
              )}
            >
              Back to Dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ─── 4. Empty State (No Application for Authenticated User) ──────────────────
  if (!activeApp) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold uppercase tracking-wider">
              No Application Found
            </Badge>
            <h2 className="text-xl font-bold text-slate-900">
              Vendor Registration Required
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are signed in as <strong className="text-slate-800">{clerkEmail || clerkUser?.fullName}</strong>, but there is no vendor application linked to this account yet. Register your business to start operating legally in Butuan City.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/register?new=true"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shadow-xs gap-1.5 inline-flex items-center"
              )}
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Start Vendor Registration
            </Link>
            <Link
              href="/dashboard/help"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "text-xs font-semibold text-slate-700 h-10 rounded-xl"
              )}
            >
              Help &amp; Guidelines
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // ─── 4. Active Application Details ───────────────────────────────────────────
  const isArchivedDeleted = Boolean(activeApp.isDeleted);
  const currentStatus = isArchivedDeleted ? "rejected" : normalizeStatus(activeApp.status);
  const applicationNumber = activeApp.applicationNumber || activeApp.id;
  const vendorId =
    activeApp.vendorId ||
    (currentStatus === "approved"
      ? `BUT-V-${applicationNumber.replace(/\D/g, "").slice(-6) || "000001"}`
      : "Pending release");
  const businessName = activeApp.business?.businessName || "Registered Business";
  const ownerName = activeApp.owner?.ownerName || clerkUser?.fullName || "Registered Owner";
  const submissionDate = formatAppDate(activeApp.submittedAt);
  const updatedDate = formatAppDate(activeApp.updatedAt);

  const paymentInfo = activeApp.payment;
  const paymentBadge = getPaymentStatusBadgeConfig(paymentInfo?.status || "unpaid");
  const assessedAmount = paymentInfo?.assessedAmount ?? 1450;
  const amountPaid = paymentInfo?.amountPaid ?? 0;

  const statusConfig = {
    draft: {
      badgeText: "Draft",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      dotColor: "bg-slate-400",
      title: "Draft Application Saved",
      description:
        "Your vendor registration draft is saved. Review all information and submit to proceed.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-800",
      icon: FileText,
      stageIndex: 1,
    },
    submitted: {
      badgeText: "Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500",
      title: "Application Submitted Successfully",
      description:
        "Your registration package has been received and is queued for administrative evaluation by the City Licensing Division.",
      bannerStyle: "bg-blue-50/80 border-blue-200 text-blue-950",
      icon: Clock,
      stageIndex: 1,
    },
    "under-review": {
      badgeText: "Under Review",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      dotColor: "bg-amber-500 animate-ping",
      title: "Administrative Review in Progress",
      description:
        "City Government of Butuan licensing officers are reviewing your documents, stall location, and zoning clearance.",
      bannerStyle: "bg-amber-50/80 border-amber-200 text-amber-950",
      icon: Clock,
      stageIndex: 2,
    },
    "needs-correction": {
      badgeText: "Action Required",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      dotColor: "bg-orange-500",
      title: "Corrections Requested by Administrator",
      description:
        "The reviewing officer has paused evaluation and requested adjustments to your registration materials.",
      remarks:
        activeApp.adminRemarks ||
        "Please provide the updated information or clearer document copies specified by the reviewing officer.",
      bannerStyle: "bg-orange-50/90 border-orange-300 text-orange-950",
      icon: AlertTriangle,
      stageIndex: 2,
    },
    "correction-submitted": {
      badgeText: "Correction Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500 animate-pulse",
      title: "Corrections Submitted — Under Re-Evaluation",
      description:
        "Your corrections have been received. The reviewing officer is currently validating the updated materials.",
      bannerStyle: "bg-blue-50/80 border-blue-300 text-blue-950",
      icon: Clock,
      stageIndex: 2,
    },
    approved: {
      badgeText: "Approved",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      dotColor: "bg-emerald-500",
      title: "Application Approved & Verified",
      description:
        "Congratulations! Your vendor registration is officially approved by the City Government of Butuan.",
      bannerStyle: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
      icon: CheckCircle2,
      stageIndex: 4,
    },
    rejected: {
      badgeText: "Not Approved",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      dotColor: "bg-rose-500",
      title: "Application Not Approved",
      description:
        "Your vendor registration was not approved during administrative evaluation.",
      remarks:
        activeApp.adminRemarks ||
        "The registration could not be approved due to territorial jurisdiction or licensing criteria.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-900",
      icon: XCircle,
      stageIndex: 0,
    },
  };

  const current = statusConfig[currentStatus];
  const StatusIcon = current.icon;
  const activityList = buildActivityTimeline(activeApp, currentStatus);

  return (
    <div className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-12">
      {/* ─── Page Title, Tab Switcher & Send Another Application ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            My Applications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review and track all business registration applications filed under your account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/register?new=true"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer shadow-xs gap-1.5 inline-flex items-center"
            )}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Send Another Application</span>
          </Link>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setViewMode("list")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            viewMode === "list"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <Files className="w-3.5 h-3.5" />
          <span>All Applications ({applications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("details")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
            viewMode === "details"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Application Details {activeApp ? `(${activeApp.applicationNumber || activeApp.id})` : ""}</span>
        </button>
      </div>

      {/* ─── TAB 1: ALL APPLICATIONS TABLE VIEW ─── */}
      {viewMode === "list" && (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-slate-100">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Applications on File
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing all business registration submissions associated with your account ({clerkEmail || clerkUser?.fullName}).
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80">
                    <TableHead className="font-bold text-xs text-slate-700">Reference #</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700">Business Name</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700">Submission Date</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700">Application Status</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700">Payment Status</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700">Last Updated</TableHead>
                    <TableHead className="font-bold text-xs text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const appId = app.applicationNumber || app.id;
                    const isDel = Boolean(app.isDeleted);
                    const pInfo = app.payment;
                    const pBadge = getPaymentStatusBadgeConfig(pInfo?.status || "unpaid");
                    const normStatus = normalizeStatus(app.status);

                    return (
                      <TableRow key={appId} className="hover:bg-slate-50/60 transition-colors">
                        <TableCell className="font-mono font-bold text-xs text-slate-900">
                          {appId}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          <div className="font-bold text-slate-900">{app.business?.businessName || "Unnamed Business"}</div>
                          <div className="text-[11px] text-slate-500">{app.address?.barangay ? `${app.address.barangay}, Butuan City` : "Butuan City"}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">
                          {formatAppDate(app.submittedAt)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {isDel ? (
                            <div className="flex flex-col gap-1 items-start">
                              <Badge className="bg-rose-600 text-white border-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5">
                                REJECTED
                              </Badge>
                              <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-[10px] font-bold uppercase px-1.5 py-0.5">
                                APPLICATION HAS BEEN DELETED BY THE ADMINISTRATOR
                              </Badge>
                            </div>
                          ) : normStatus === "approved" ? (
                            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[11px] font-bold">
                              APPROVED
                            </Badge>
                          ) : normStatus === "needs-correction" ? (
                            <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-[11px] font-bold">
                              NEEDS CORRECTION
                            </Badge>
                          ) : normStatus === "under-review" ? (
                            <Badge className="bg-amber-100 text-amber-950 border-amber-300 text-[11px] font-bold">
                              UNDER REVIEW
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-[11px] font-bold">
                              SUBMITTED
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={cn("text-[10px] font-bold uppercase border", pBadge.badgeClass)}>
                            {pBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatAppDate(app.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedAppId(appId);
                                saveSharedApplication(app);
                                setViewMode("details");
                              }}
                              className="text-xs font-semibold h-7 px-2.5 rounded-lg border-slate-300 hover:bg-slate-100 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View Details
                            </Button>
                            {!isDel && normStatus === "needs-correction" && (
                              <Link
                                href={`/dashboard/my-application/correction?appNumber=${appId}`}
                                className={cn(
                                  buttonVariants({ variant: "default", size: "sm" }),
                                  "bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold h-7 px-2.5 rounded-lg shadow-xs"
                                )}
                              >
                                Correct
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── TAB 2: DETAILED APPLICATION VIEW ─── */}
      {viewMode === "details" && (
        <div className="space-y-6 sm:space-y-8">
          {/* ─── Multi-Application Switcher (if user owns more than 1 application) ─── */}
          {applications.length > 1 && (
            <Card className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select Application to Review ({applications.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {applications.map((app) => {
                    const appId = app.applicationNumber || app.id;
                    const isSelected = appId === selectedAppId;
                    const appStatus = normalizeStatus(app.status);
                    const isAppDel = Boolean(app.isDeleted);
                    return (
                      <button
                        key={appId}
                        type="button"
                        onClick={() => {
                          setSelectedAppId(appId);
                          saveSharedApplication(app);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2",
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        )}
                      >
                        <span className="font-mono">{appId}</span>
                        <span className="opacity-70 font-normal">
                          • {app.business?.businessName || "Business"}
                        </span>
                        {isAppDel ? (
                          <span className="text-[10px] uppercase px-1.5 py-0.2 rounded font-extrabold bg-rose-600 text-white">
                            Archived
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "text-[10px] uppercase px-1.5 py-0.2 rounded font-bold",
                              isSelected
                                ? "bg-blue-700 text-white"
                                : "bg-slate-200 text-slate-800"
                            )}
                          >
                            {appStatus}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}

          {/* ─── Archival Notice Banner for Deleted Applications ─── */}
          {isArchivedDeleted && (
            <Card className="rounded-2xl bg-rose-50/95 border-2 border-rose-300 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <XCircle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-rose-600 text-white border-rose-700 text-xs font-extrabold uppercase px-2.5 py-0.5">
                        REJECTED
                      </Badge>
                      <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs font-bold uppercase px-2.5 py-0.5">
                        APPLICATION HAS BEEN DELETED BY THE ADMINISTRATOR
                      </Badge>
                      {activeApp.deletedAt && (
                        <span className="text-xs text-rose-800 font-medium">
                          Archived on {formatAppDate(activeApp.deletedAt)}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-rose-950">
                      Application Has Been Deleted by the Administrator
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-3xl">
                      {activeApp.deletedReason || activeApp.adminRemarks ? (
                        <>
                          Administrative Remarks: <strong className="font-semibold">&ldquo;{activeApp.deletedReason || activeApp.adminRemarks}&rdquo;</strong>
                        </>
                      ) : (
                        "This rejected application was archived by the administrator. Historical records remain preserved in read-only mode for audit. The vendor cannot edit or resubmit this archived record. To register a new business or reapply under current regulations, please submit a separate application."
                      )}
                    </p>
                    <p className="text-xs text-rose-800/90 pt-1">
                      Status: <strong>Read-Only Historical Record</strong> • Modifications and resubmissions are disabled for this record.
                    </p>
                  </div>
                </div>

                <Link
                  href="/register?new=true"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm cursor-pointer gap-2 shrink-0 self-start sm:self-center shadow-xs inline-flex items-center"
                  )}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Send Another Application</span>
                </Link>
              </div>
            </Card>
          )}

          {/* ─── Top Header Card ─── */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Application Reference
                  </span>
                  {isArchivedDeleted ? (
                    <>
                      <Badge className="bg-rose-600 text-white border-rose-700 text-xs font-extrabold uppercase">
                        REJECTED
                      </Badge>
                      <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs font-bold uppercase">
                        APPLICATION HAS BEEN DELETED BY THE ADMINISTRATOR
                      </Badge>
                    </>
                  ) : (
                    <Badge className={cn("text-xs font-bold uppercase border", current.badgeColor)}>
                      {current.badgeText}
                    </Badge>
                  )}

                  {/* Verification Status Badge */}
                  {!isArchivedDeleted && (currentStatus === "approved" || activeApp.verificationStatus === "Verified" || activeApp.isVerified) ? (
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold text-xs inline-flex items-center gap-1.5 py-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Verified</span>
                    </Badge>
                  ) : isArchivedDeleted || currentStatus === "rejected" || activeApp.verificationStatus === "Not Verified" ? (
                    <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs inline-flex items-center gap-1.5 py-0.5">
                      <XCircle className="w-3.5 h-3.5 text-slate-600" />
                      <span>Not Verified</span>
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-bold text-xs inline-flex items-center gap-1.5 py-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Verification: Pending</span>
                    </Badge>
                  )}

                  {/* Payment Status Badge */}
                  <Badge className={cn("text-xs font-bold uppercase border inline-flex items-center gap-1.5 py-0.5", paymentBadge.badgeClass)}>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Payment: {paymentBadge.label}</span>
                  </Badge>
                </div>

            {/* Application Reference Number with Copy */}
            <div className="flex items-center gap-3 pt-0.5">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-wider">
                {applicationNumber}
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                title="Copy reference number to clipboard"
                aria-label="Copy reference number"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {copied && (
                <span className="text-xs text-emerald-700 font-medium animate-in fade-in">
                  Reference number copied.
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Submitted on <strong className="text-slate-700">{submissionDate}</strong> • City Government of Butuan
            </p>
          </div>

          {/* Registered Business & Owner Info */}
          <div className="text-left sm:text-right space-y-0.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <span className="text-xs text-slate-500 block uppercase font-medium">Registered Business</span>
            <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
              {businessName}
            </h3>
            <p className="text-xs text-slate-600">Owner: {ownerName}</p>
          </div>
        </div>
      </Card>

      {/* ─── Current Lifecycle Status Banner ─── */}
      <div
        className={cn(
          "rounded-2xl border p-5 sm:p-6 shadow-xs transition-all space-y-3.5",
          current.bannerStyle
        )}
      >
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/95 border border-current/20 flex items-center justify-center shrink-0 shadow-2xs">
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Application Status
                </span>
                {currentStatus === "under-review" && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                {current.title}
              </h2>
            </div>
          </div>

          {/* Official Vendor ID Badge when Approved */}
          {currentStatus === "approved" && (
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                Official Vendor ID
              </span>
              <span className="font-mono text-base sm:text-lg font-black text-emerald-950 bg-white/95 px-3 py-1 rounded-lg border border-emerald-300 inline-block shadow-2xs">
                {vendorId}
              </span>
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm font-normal leading-relaxed opacity-90 max-w-3xl">
          {current.description}
        </p>

        {/* Administrator Remarks (if Needs Correction or Rejected) */}
        {"remarks" in current && (
          <div className="bg-white/90 rounded-xl border border-current/20 p-3.5 space-y-1 text-xs sm:text-sm shadow-2xs">
            <span className="font-bold block uppercase tracking-wider text-[11px]">
              Administrator Review Remarks:
            </span>
            <p className="italic text-slate-800 font-medium">
              &ldquo;{current.remarks}&rdquo;
            </p>
          </div>
        )}

        {/* Direct Action: Review & Correct Application */}
        {currentStatus === "needs-correction" && !isArchivedDeleted && (
          <div className="pt-1 flex flex-wrap items-center gap-3">
            <Link
              href={`/dashboard/my-application/correction?appNumber=${applicationNumber}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9 px-4 rounded-xl shadow-xs cursor-pointer gap-2"
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Review &amp; Correct Application</span>
            </Link>
            <span className="text-xs text-orange-900 font-medium">
              Submit corrections to resume review without delay.
            </span>
          </div>
        )}

        {/* Status Breakdown Summary */}
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-current/15 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">Status:</span>
            <span className="font-extrabold uppercase">{current.badgeText}</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">Verification:</span>
            <span className="font-extrabold uppercase">
              {currentStatus === "approved" || activeApp.verificationStatus === "Verified" || activeApp.isVerified
                ? "Verified"
                : currentStatus === "rejected" || activeApp.verificationStatus === "Not Verified"
                ? "Not Verified"
                : "Pending"}
            </span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">Certificate Status:</span>
            <span className="font-extrabold uppercase">
              {currentStatus === "approved" ? "Active / Issued" : "Pending Approval"}
            </span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <span className="opacity-75">Last Updated:</span>
            <span className="font-mono">{updatedDate}</span>
          </div>
        </div>
      </div>

      {/* ─── Official Certificate Card (when Approved) ─── */}
      {currentStatus === "approved" && (
        <Card className="bg-gradient-to-br from-emerald-50/50 via-white to-blue-50/30 border border-emerald-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-300 shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Official Certificate of Vendor Accreditation
                </h3>
                <p className="text-xs text-slate-500">
                  Issued by the City Government of Butuan • Economic Enterprises Division
                </p>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => setViewCertificateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer shadow-xs gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Official Certificate</span>
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Official Vendor ID</span>
              <p className="font-mono font-black text-emerald-900 text-sm">{vendorId}</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accreditation</span>
              <p className="font-bold text-emerald-800 text-sm">Active &amp; Certified</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Jurisdiction</span>
              <p className="font-semibold text-slate-800 text-xs">Butuan City, Caraga</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-100 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accreditation Date</span>
              <p className="font-semibold text-slate-800 text-xs">{submissionDate}</p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── Registration Progress Tracker ─── */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              Registration Progress Tracker
            </span>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Stages of your municipal vendor application
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold shrink-0",
              currentStatus === "approved"
                ? "text-emerald-800 bg-emerald-50 border-emerald-300 font-bold"
                : "text-slate-600 bg-slate-50"
            )}
          >
            {currentStatus === "approved"
              ? "Stage 4 of 4 Completed"
              : currentStatus === "needs-correction"
              ? "Action Required at Stage 2"
              : currentStatus === "rejected"
              ? "Evaluation Concluded"
              : currentStatus === "submitted"
              ? "Stage 1 of 4"
              : "Stage 2 of 4 Active"}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 sm:p-8">
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 1: Form Submitted */}
            <div className="relative">
              <div className="absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs bg-emerald-600 text-white">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    1. Form Submitted
                  </h4>
                  <span className="text-xs font-semibold text-emerald-700">
                    Completed • {submissionDate}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Registration form received and recorded in the municipal database.
                </p>
              </div>
            </div>

            {/* Step 2: Administrative Review */}
            <div className="relative">
              <div
                className={cn(
                  "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                  currentStatus === "approved"
                    ? "bg-emerald-600 text-white"
                    : currentStatus === "needs-correction"
                    ? "bg-orange-600 text-white ring-orange-100 ring-4"
                    : currentStatus === "rejected"
                    ? "bg-slate-700 text-white"
                    : "bg-amber-500 text-white ring-amber-100 ring-4"
                )}
              >
                {currentStatus === "approved" ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : currentStatus === "needs-correction" ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : currentStatus === "rejected" ? (
                  <XCircle className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <h4
                    className={cn(
                      "font-bold text-sm sm:text-base",
                      currentStatus === "approved"
                        ? "text-slate-900"
                        : currentStatus === "needs-correction"
                        ? "text-orange-950"
                        : currentStatus === "rejected"
                        ? "text-slate-700"
                        : "text-blue-900"
                    )}
                  >
                    2. Administrative Review
                  </h4>
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      currentStatus === "approved"
                        ? "text-emerald-700"
                        : currentStatus === "needs-correction"
                        ? "text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200"
                        : currentStatus === "rejected"
                        ? "text-slate-600"
                        : "text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                    )}
                  >
                    {currentStatus === "approved"
                      ? "Completed"
                      : currentStatus === "needs-correction"
                      ? "Action Required"
                      : currentStatus === "rejected"
                      ? "Evaluation Concluded"
                      : "● Current Stage"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {currentStatus === "approved"
                    ? "Administrative compliance and zoning verification successfully completed."
                    : currentStatus === "needs-correction"
                    ? "Review paused. Please see administrator remarks above and submit corrections."
                    : currentStatus === "rejected"
                    ? "Administrative evaluation concluded."
                    : "City licensing officers are evaluating trade details, jurisdiction, and regulatory documents."}
                </p>
              </div>
            </div>

            {/* Step 3: Vendor Verification */}
            <div className="relative">
              <div
                className={cn(
                  "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                  currentStatus === "approved"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {currentStatus === "approved" ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className="text-[11px]">3</span>
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <h4
                    className={cn(
                      "font-bold text-sm sm:text-base",
                      currentStatus === "approved" ? "text-slate-900" : "text-slate-400"
                    )}
                  >
                    3. Vendor Verification
                  </h4>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      currentStatus === "approved" ? "text-emerald-700" : "text-slate-400 font-semibold"
                    )}
                  >
                    {currentStatus === "approved" ? "Verified / Completed" : "○ Pending"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {currentStatus === "approved"
                    ? "Barangay jurisdiction, operating address, and proprietor identity verified."
                    : "Verification of stall address and operating jurisdiction within Butuan City."}
                </p>
              </div>
            </div>

            {/* Step 4: Vendor Certificate Issuance */}
            <div className="relative">
              <div
                className={cn(
                  "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                  currentStatus === "approved"
                    ? "bg-emerald-600 text-white ring-emerald-100 ring-4"
                    : "bg-slate-200 text-slate-600"
                )}
              >
                {currentStatus === "approved" ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                ) : (
                  <span className="text-[11px]">4</span>
                )}
              </div>
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                  <h4
                    className={cn(
                      "font-bold text-sm sm:text-base",
                      currentStatus === "approved" ? "text-emerald-900 font-extrabold" : "text-slate-400"
                    )}
                  >
                    4. Vendor Certificate Issuance
                  </h4>
                  <span
                    className={cn(
                      "text-xs font-bold",
                      currentStatus === "approved"
                        ? "text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                        : "text-slate-400 font-semibold"
                    )}
                  >
                    {currentStatus === "approved" ? "Accredited & Active" : "○ Pending"}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {currentStatus === "approved"
                    ? "Official Butuan Vendor Certificate active. Accredited to operate legally."
                    : "Digital vendor accreditation certificate released upon final approval."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Fee Assessment & Payment Details ─── */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 p-4 sm:p-5 border-b border-slate-200/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
              Fee Assessment &amp; Payment Verification
            </CardTitle>
          </div>
          <Badge className={cn("text-xs font-bold border", paymentBadge.badgeClass)}>
            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
            {paymentBadge.label}
          </Badge>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Resubmit Success Notice */}
          {resubmitSuccessMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{resubmitSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setResubmitSuccessMessage(null)}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 4 Stat Overview Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">
                Assessed Fee Total
              </span>
              <p className="font-extrabold text-base text-slate-900 font-mono">
                {formatPhpCurrency(assessedAmount)}
              </p>
              <span className="text-[10px] text-slate-400 block">Butuan City Tax Ord. No. 132</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">
                Confirmed Amount Paid
              </span>
              <p className={cn("font-extrabold text-base font-mono", amountPaid > 0 ? "text-emerald-700" : "text-slate-800")}>
                {formatPhpCurrency(amountPaid)}
              </p>
              <span className="text-[10px] text-slate-400 block">
                {amountPaid >= assessedAmount
                  ? "Fully Settled"
                  : amountPaid > 0
                  ? "Partial Settlement"
                  : "Awaiting payment verification"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">
                Payment Channel
              </span>
              <p className="font-bold text-slate-900 truncate">
                {paymentInfo?.paymentMethod || paymentInfo?.methodName || "E-Wallet / CTO Cashier"}
              </p>
              <span className="text-[10px] text-blue-600 font-medium capitalize block">
                Official Municipal Channel
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <span className="text-[11px] text-slate-500 font-medium block uppercase tracking-wider">
                Assessment Reference
              </span>
              <p className="font-mono font-bold text-slate-900 truncate" title={paymentInfo?.transactionReference}>
                {paymentInfo?.transactionReference || `PAY-${applicationNumber}`}
              </p>
              <span className="text-[10px] text-slate-400 block">LGU tracking identifier</span>
            </div>
          </div>

          {/* Payment Status Callouts */}
          {paymentBadge.label === "Verified" ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-bold text-emerald-900 block">Payment Confirmed &amp; Verified</span>
                  <span className="text-[11px] text-emerald-800">
                    Payment has been verified by the City Treasurer&apos;s Office. Confirmed amount: {formatPhpCurrency(amountPaid || assessedAmount)}.
                  </span>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                Verified
              </Badge>
            </div>
          ) : paymentBadge.label === "Rejected" ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-950 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-rose-900">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Proof of Payment Rejected</span>
                </div>
                <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold text-[11px]">
                  Rejected
                </Badge>
              </div>
              <p className="text-[11px] text-rose-900 font-medium leading-relaxed pl-6">
                <strong>Reason:</strong> &ldquo;{paymentInfo?.rejectionReason || "Submitted receipt could not be verified against municipal records."}&rdquo;
              </p>
              <div className="pl-6 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-rose-200">
                <span className="text-[11px] text-rose-700 font-medium">
                  Please review payment instructions and upload a valid transaction receipt.
                </span>
                {!isArchivedDeleted ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setResubmitAmountPaid(String(assessedAmount));
                      setResubmitTxRef(paymentInfo?.transactionReference || "");
                      setResubmitModalOpen(true);
                    }}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg cursor-pointer self-start sm:self-auto"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    Resubmit Proof of Payment
                  </Button>
                ) : (
                  <span className="text-[11px] text-slate-500 italic">
                    Archived record — payment proof cannot be modified.
                  </span>
                )}
              </div>
            </div>
          ) : paymentBadge.label === "Pending Verification" ? (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 block">Proof of Payment Under Verification</span>
                  <span className="text-[11px] text-amber-800">
                    Your receipt has been submitted and is currently in the verification queue.
                  </span>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 self-start sm:self-auto shrink-0 font-semibold text-[11px]">
                Pending Verification
              </Badge>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-slate-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">Payment Proof Required</span>
                  <span className="text-[11px] text-slate-600">
                    Your fee is assessed. Please settle payment through official channels and submit your receipt.
                  </span>
                </div>
              </div>
              {!isArchivedDeleted && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setResubmitAmountPaid(String(assessedAmount));
                    setResubmitTxRef(paymentInfo?.transactionReference || "");
                    setResubmitModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 px-3.5 rounded-lg cursor-pointer shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 mr-1" />
                  Upload Proof of Payment
                </Button>
              )}
            </div>
          )}

          {/* Uploaded Receipt Details Card */}
          {(paymentInfo?.receiptUrl || paymentInfo?.receiptFilename) && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Submitted Proof of Payment
                </span>
                {paymentInfo?.receiptUploadedAt && (
                  <span className="text-[11px] text-slate-500">
                    Uploaded {paymentInfo.receiptUploadedAt}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Receipt className="w-5 h-5 text-blue-700 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate font-mono">
                      {paymentInfo.receiptFilename || "payment-receipt"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {paymentInfo.receiptFileType || "Receipt Document"} • Ref:{" "}
                      <span className="font-mono font-semibold text-slate-700">
                        {paymentInfo.transactionReference || applicationNumber}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {paymentInfo.receiptUrl && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setViewReceiptModalOpen(true)}
                      className="text-xs font-semibold h-7 px-2.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  )}
                  {(paymentBadge.label === "Rejected" || paymentBadge.label === "Unpaid") && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setResubmitAmountPaid(String(assessedAmount));
                        setResubmitTxRef(paymentInfo?.transactionReference || "");
                        setResubmitModalOpen(true);
                      }}
                      className="text-xs font-semibold h-7 px-2.5 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Replace Receipt
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Itemized Regulatory Fee Breakdown */}
          {paymentInfo?.feeBreakdown && paymentInfo.feeBreakdown.length > 0 && (
            <div className="border border-slate-200/90 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100/80 px-3.5 py-2 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                <span>Regulatory Fee Breakdown (City Tax Ordinance No. 132)</span>
                <span>Amount (PHP)</span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {paymentInfo.feeBreakdown.map((item) => (
                  <div key={item.id} className="px-3.5 py-2 flex justify-between items-center hover:bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-slate-800">{item.name}</p>
                      {item.code && <p className="text-[10px] text-slate-400 font-mono">{item.code}</p>}
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatPhpCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 px-3.5 py-2.5 border-t border-slate-200 flex justify-between items-center font-bold text-slate-900">
                <span>Total Assessed Regulatory Fees</span>
                <span className="font-mono text-blue-700 text-sm font-extrabold">{formatPhpCurrency(assessedAmount)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Required Documents & Review Status ─── */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/70 p-4 sm:p-5 border-b border-slate-200/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900">
              Required Documents &amp; Review Status
            </CardTitle>
          </div>
          <Link
            href="/dashboard/documents"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Manage All Documents</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-3">
          {activeApp.documents && activeApp.documents.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {activeApp.documents.map((doc, idx) => {
                const docStatus = doc.status || "Submitted";
                const isDocVerified = docStatus === "Verified" || docStatus === "Accepted";
                const isNeedsReplacement =
                  docStatus === "Replacement Requested" || docStatus === "Needs Replacement";

                return (
                  <div
                    key={doc.id || `doc-${idx}`}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {doc.idType || "Government Credential"}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {doc.filename || doc.idFileName || "credential-file"}
                          {doc.uploadedAt ? ` • Uploaded ${formatAppDate(doc.uploadedAt)}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <Badge
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          isDocVerified
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : isNeedsReplacement
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-blue-100 text-blue-900 border-blue-200"
                        )}
                      >
                        {isDocVerified ? "✓ Verified" : isNeedsReplacement ? "⚠ Replacement Requested" : "Submitted"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
              No additional documents are currently on file for this application.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Business & Proprietor Information Grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Business Information */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Business Trade Name:</span>
              <span className="font-semibold text-slate-900 text-right">{businessName}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Registered Proprietor:</span>
              <span className="font-semibold text-slate-900 text-right">{ownerName}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Category:</span>
              <span className="text-slate-700 text-right font-medium">
                {activeApp.business?.category || "General Merchandise / Market Stall"}
              </span>
            </div>
            {activeApp.business?.businessDescription && (
              <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">Business Activity:</span>
                <span className="text-slate-700 text-right font-medium max-w-[240px]">
                  {activeApp.business.businessDescription}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
            <Phone className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Registered Email:</span>
              <span className="font-semibold text-slate-900 text-right">
                {activeApp.contact?.emailAddress || clerkEmail || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Mobile Number:</span>
              <span className="font-semibold text-slate-900 text-right font-mono">
                {activeApp.contact?.contactNumber || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 font-medium">Official Notifications:</span>
              <span className="text-emerald-700 font-semibold text-right">
                Active (In-App &amp; Email)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Business Operating Address */}
        <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden md:col-span-2">
          <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-sm font-bold text-slate-900">
              Operating Location &amp; Barangay Jurisdiction
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">House / Stall No. &amp; Street</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {[activeApp.address?.houseNo, activeApp.address?.street].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Designated Barangay</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {activeApp.address?.barangay || "—"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">City &amp; Province</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {activeApp.address?.city || "Butuan City"}, {activeApp.address?.province || "Agusan del Norte"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Activity Log / Audit Trail ─── */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Application Timeline &amp; Activity Log
            </CardTitle>
            <p className="text-xs text-slate-500">
              Audit trail for application #{applicationNumber} — latest activity first
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600">
            {current.badgeText}
          </Badge>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 space-y-4">
          {activityList.map((act) => {
            const dotBg =
              act.dotColor === "emerald"
                ? "bg-emerald-500 ring-emerald-100"
                : act.dotColor === "orange"
                ? "bg-orange-500 ring-orange-100"
                : act.dotColor === "amber"
                ? "bg-amber-500 ring-amber-100"
                : act.dotColor === "rose"
                ? "bg-rose-500 ring-rose-100"
                : act.dotColor === "blue"
                ? "bg-blue-600 ring-blue-100"
                : "bg-slate-400 ring-slate-100";

            return (
              <div key={act.id} className="flex items-start gap-3">
                <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-4", dotBg)} />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                    <p className="text-xs font-bold text-slate-900">{act.title}</p>
                    <span className="text-[11px] text-slate-400">{act.date}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {act.description}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      </div>
      )}

      {/* ─── MODAL: Resubmit / Upload Proof of Payment ─── */}
      <Dialog open={resubmitModalOpen} onOpenChange={setResubmitModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-1">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Upload Proof of Payment
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600">
              Submit your official payment receipt or electronic transaction screenshot for verification by the City Treasurer&apos;s Office.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResubmitProofSubmit} className="space-y-4 py-2">
            {/* Payment Method Selector & Instructions */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                1. Select Payment Method &amp; View Official Details
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResubmitCategory("e_wallet");
                    setResubmitMethodName("Maya / GCash (Official E-Wallet)");
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2",
                    resubmitCategory === "e_wallet"
                      ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  )}
                >
                  <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="block leading-tight">E-Wallet</span>
                    <span className="text-[10px] font-normal text-slate-500">Maya / GCash</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setResubmitCategory("bank_transfer");
                    setResubmitMethodName("Landbank Bank Transfer / Link.BizPortal");
                  }}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2",
                    resubmitCategory === "bank_transfer"
                      ? "border-blue-500 bg-blue-50/70 text-blue-900 font-bold ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  )}
                >
                  <Landmark className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="block leading-tight">Bank Transfer</span>
                    <span className="text-[10px] font-normal text-slate-500">Landbank</span>
                  </div>
                </button>
              </div>

              {resubmitCategory === "e_wallet" ? (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-2 text-xs text-blue-950">
                  <div className="flex items-center justify-between font-bold text-blue-900">
                    <span>E-Wallet Official Account Details:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      {formatPhpCurrency(assessedAmount)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-white border border-blue-200/80 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Account Name:</span>
                      <strong className="text-slate-900 font-mono">{LGU_EWALLET_INSTRUCTIONS.accountName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">E-Wallet Number:</span>
                      <strong className="text-slate-900 font-mono">{LGU_EWALLET_INSTRUCTIONS.accountNumber}</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-800">
                  <div className="flex items-center justify-between font-bold text-slate-900">
                    <span>Bank Transfer Official Details:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                      {formatPhpCurrency(assessedAmount)}
                    </span>
                  </div>
                  <div className="space-y-1.5 p-2.5 rounded-lg bg-white border border-slate-200 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Bank Name:</span>
                      <strong className="text-slate-900">{LGU_BANK_TRANSFER_INSTRUCTIONS.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Name:</span>
                      <strong className="text-slate-900 font-mono">{LGU_BANK_TRANSFER_INSTRUCTIONS.accountName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Account Number:</span>
                      <strong className="text-amber-800 italic">{LGU_BANK_TRANSFER_INSTRUCTIONS.accountNumber}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Required Reference:</span>
                      <strong className="text-blue-700 font-mono">{applicationNumber}</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                2. Upload Proof File (JPG, JPEG, PNG, or PDF, max 5MB) <span className="text-rose-500">*</span>
              </label>

              {resubmitFileDataUrl ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {resubmitFileType?.includes("pdf") || resubmitFilename.toLowerCase().endsWith(".pdf") ? (
                      <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        PDF
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resubmitFileDataUrl}
                        alt="Receipt Preview"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    )}
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate font-mono">
                        {resubmitFilename}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(resubmitFileSize / 1024).toFixed(0)} KB • Ready to submit
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    <label className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 cursor-pointer text-slate-700">
                      <span>Replace</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleResubmitFileSelect(e.target.files[0]);
                        }}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResubmitFileDataUrl(null);
                        setResubmitFilename("");
                        setResubmitFileType("");
                        setResubmitFileSize(0);
                      }}
                      className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleResubmitFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  className={cn(
                    "p-6 border-2 border-dashed rounded-xl text-center transition-colors cursor-pointer space-y-2",
                    isDraggingOver
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-slate-300 bg-slate-50 hover:bg-slate-100/70"
                  )}
                  onClick={() => {
                    document.getElementById("vendor-resubmit-file-input")?.click();
                  }}
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Drag &amp; drop your receipt here, or click to choose
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      JPG, JPEG, PNG, or PDF up to 5MB
                    </p>
                  </div>
                  <input
                    id="vendor-resubmit-file-input"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleResubmitFileSelect(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <div className="pt-1">
                    <span className="inline-block px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs">
                      Choose File
                    </span>
                  </div>
                </div>
              )}

              {resubmitFileError && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{resubmitFileError}</span>
                </p>
              )}
            </div>

            {/* Transaction Reference & Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label htmlFor="vendor-tx-ref" className="text-xs font-semibold text-slate-700 block">
                  Transaction / Reference Number <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="vendor-tx-ref"
                  type="text"
                  placeholder="e.g. 1029384756 or LBP-98214"
                  value={resubmitTxRef}
                  onChange={(e) => setResubmitTxRef(e.target.value)}
                  className="h-9 text-xs sm:text-sm font-mono bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="vendor-amount-paid" className="text-xs font-semibold text-slate-700 block">
                  Amount Paid (PHP)
                </label>
                <Input
                  id="vendor-amount-paid"
                  type="number"
                  placeholder={String(assessedAmount)}
                  value={resubmitAmountPaid || String(assessedAmount)}
                  onChange={(e) => setResubmitAmountPaid(e.target.value)}
                  className="h-9 text-xs sm:text-sm font-mono bg-slate-50"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResubmitModalOpen(false)}
                className="text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingProof || !resubmitFileDataUrl || !resubmitTxRef.trim()}
                className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl cursor-pointer"
              >
                {isSubmittingProof ? "Submitting..." : "Submit Receipt for Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: View Receipt ─── */}
      <Dialog open={viewReceiptModalOpen} onOpenChange={setViewReceiptModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-700" />
              <span>Proof of Payment — {paymentInfo?.receiptFilename || "Receipt Document"}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Assessment Reference: {paymentInfo?.transactionReference || applicationNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 flex items-center justify-center min-h-[280px] max-h-[60vh] overflow-auto">
              {paymentInfo?.receiptUrl ? (
                paymentInfo.receiptFileType?.includes("pdf") ||
                (paymentInfo.receiptFilename && paymentInfo.receiptFilename.toLowerCase().endsWith(".pdf")) ? (
                  <div className="text-center text-white p-6 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-xl mx-auto shadow-lg">
                      PDF
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{paymentInfo.receiptFilename}</p>
                      <p className="text-xs text-slate-400">PDF Document</p>
                    </div>
                    <div className="pt-2">
                      <a
                        href={paymentInfo.receiptUrl}
                        download={paymentInfo.receiptFilename || "payment-receipt.pdf"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(buttonVariants({ variant: "default" }), "bg-blue-600 hover:bg-blue-700 text-white text-xs")}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        Download &amp; Open PDF
                      </a>
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={paymentInfo.receiptUrl}
                    alt="Proof of Payment"
                    className="max-h-[55vh] max-w-full object-contain rounded-lg"
                  />
                )
              ) : (
                <div className="text-center text-slate-400 p-8 space-y-2">
                  <Receipt className="w-12 h-12 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">No Receipt Preview Available</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-xs flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-slate-500">Method:</span>{" "}
                <span className="font-semibold text-slate-900">{paymentInfo?.paymentMethod || "Official Channel"}</span>
              </div>
              <div>
                <span className="text-slate-500">Reference:</span>{" "}
                <span className="font-mono font-bold text-slate-900">
                  {paymentInfo?.transactionReference || applicationNumber}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Uploaded:</span>{" "}
                <span className="text-slate-700">{paymentInfo?.receiptUploadedAt || "Recently"}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 sm:gap-0 pt-1">
            {paymentInfo?.receiptUrl ? (
              <a
                href={paymentInfo.receiptUrl}
                download={paymentInfo.receiptFilename || `receipt-${applicationNumber}.jpg`}
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
              onClick={() => setViewReceiptModalOpen(false)}
              className="text-xs font-semibold rounded-xl"
            >
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── MODAL: Official Certificate of Accreditation ─── */}
      <Dialog open={viewCertificateOpen} onOpenChange={setViewCertificateOpen}>
        <DialogContent className="max-w-xl p-0 rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200">
          <div>
            {/* Civic Gradient Header Strip */}
            <div className="h-2.5 bg-gradient-to-r from-blue-700 via-sky-600 to-emerald-600" />

            <DialogHeader className="p-6 pb-2 text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center mx-auto mb-1 border-2 border-blue-300 shadow-sm">
                <ShieldCheck className="w-7 h-7 text-blue-700" />
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-blue-900">
                Republic of the Philippines • City Government of Butuan
              </div>
              <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                Certificate of Vendor Accreditation
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-600">
                City Business Permits &amp; Licensing Department (CBPLD)
              </DialogDescription>
            </DialogHeader>

            {/* Certificate Inner Body */}
            <div className="p-6 space-y-4">
              <div className="border-2 border-slate-300 rounded-xl p-5 bg-gradient-to-br from-amber-50/30 via-white to-blue-50/30 space-y-4 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Official Vendor ID
                    </span>
                    <span className="font-mono text-base font-extrabold text-blue-900">
                      {vendorId}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Accreditation Status
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold py-0.5">
                      Active &amp; Certified
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Business Name</span>
                    <span className="font-extrabold text-slate-900 text-sm">{businessName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Registered Proprietor</span>
                    <span className="font-bold text-slate-800">{ownerName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Designated Barangay</span>
                    <span className="font-medium text-slate-800">{activeApp.address?.barangay || "Butuan City"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Operating Stall / Location</span>
                    <span className="font-medium text-slate-800">
                      {[activeApp.address?.houseNo, activeApp.address?.street].filter(Boolean).join(", ") || "City Night Market"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500">
                      <strong>Accreditation Date:</strong> {submissionDate}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      <strong>Reference Number:</strong> <span className="font-mono">{applicationNumber}</span>
                    </div>
                  </div>

                  {/* LGU Verification QR Badge */}
                  <div className="w-16 h-16 border border-slate-300 rounded-lg p-1 bg-white flex flex-col items-center justify-center text-center shadow-xs">
                    <QrCode className="w-10 h-10 text-slate-800" />
                    <span className="text-[7px] font-mono text-slate-500 font-bold uppercase">LGU-VERIFIED</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-row items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewCertificateOpen(false)}
                className="text-xs"
              >
                Close
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined") window.print();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                Print Certificate
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
