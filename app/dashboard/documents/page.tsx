"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Files,
  FileText,
  UploadCloud,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Info,
  Receipt,
  Download,
  Printer,
  Landmark,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addAdminNotification } from "@/lib/notifications-data";
import {
  useSharedApplication,
  normalizeToSharedApplication,
  EMPTY_APPLICATION,
  SharedApplication,
} from "@/lib/vendor-application-state";
import { updateApplication } from "@/lib/application-store";
import { formatPhpCurrency } from "@/lib/payment-fee-schedule";
import { useAppRole } from "@/lib/clerk-roles";
import { VendorApplication } from "@/lib/types/vendor-application";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type DocStatus = "Submitted" | "Under Review" | "Accepted" | "Needs Replacement";

export default function DocumentsPage() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn } = useAppRole();
  const { application: sharedApp } = useSharedApplication();

  const [fetchedApp, setFetchedApp] = useState<VendorApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isClerkLoaded || !isClerkSignedIn || !clerkUser?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vendor/application", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const target = data?.application;
          if (
            !cancelled &&
            target &&
            (target.userId === clerkUser.id || (target as unknown as { clerkUserId?: string }).clerkUserId === clerkUser.id)
          ) {
            setFetchedApp(target);
          }
        }
      } catch (err) {
        console.error("Failed to load vendor application in documents:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, isClerkSignedIn, clerkUser?.id]);

  // Isolate application: strictly use authenticated user's application
  const isSharedOwned = Boolean(sharedApp.userId && clerkUser?.id && sharedApp.userId === clerkUser.id);
  const application: SharedApplication = fetchedApp
    ? normalizeToSharedApplication(fetchedApp)
    : isSharedOwned
    ? sharedApp
    : EMPTY_APPLICATION;

  const hasRealApp = isSharedOwned || Boolean(fetchedApp);

  const primaryDoc = application.documents?.[0];
  const applicantName =
    application.vendor?.name ||
    application.ownerName ||
    clerkUser?.fullName ||
    "Registered Vendor";

  // Payment Receipt Resolution
  const receiptFromDocs = application.documents?.find(
    (d) => d.idType === "Vendor Registration Payment Receipt"
  );
  const paymentInfo = application.payment;
  const isPaymentVerified =
    paymentInfo?.status === "verified" ||
    receiptFromDocs?.status === "Verified";

  const paymentStatus = paymentInfo?.status || "unpaid";

  const appNum = application.applicationNumber || application.id || "";
  const orNumber =
    paymentInfo?.receiptNumber ||
    receiptFromDocs?.filename?.match(/CTO-OR-[0-9A-Z-]+/i)?.[0] ||
    (appNum ? `CTO-OR-2026-${appNum.replace(/[^0-9]/g, "").slice(-4) || "0892"}` : "CTO-OR-PENDING");

  const receiptFilename =
    receiptFromDocs?.filename || `Vendor-Registration-Payment-Receipt-${orNumber}.pdf`;

  const receiptIssueDate =
    paymentInfo?.verifiedAt
      ? new Date(paymentInfo.verifiedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : receiptFromDocs?.uploadedAt
      ? new Date(receiptFromDocs.uploadedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Pending Verification";

  const paymentMethod =
    paymentInfo?.paymentMethod ||
    "Official LGU Payment";

  const amountPaid =
    paymentInfo?.amountPaid ||
    paymentInfo?.assessedAmount ||
    650;

  const transactionRef =
    paymentInfo?.transactionReference ||
    appNum ||
    "Pending";

  const verifiedBy =
    paymentInfo?.verifiedBy || "City Treasurer's Office (CTO) / CBPLD";

  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Document state
  const [hasDocument, setHasDocument] = useState(Boolean(primaryDoc?.filename));
  const [docStatus, setDocStatus] = useState<DocStatus>(
    primaryDoc?.status === "Verified"
      ? "Accepted"
      : primaryDoc?.status === "Replacement Requested"
      ? "Needs Replacement"
      : "Submitted"
  );
  const [docName, setDocName] = useState(
    primaryDoc?.filename || "government-id.pdf"
  );
  const [submissionDate] = useState(
    primaryDoc?.uploadedAt || application.submittedDate || "Recently"
  );
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);

  // Upload UI state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "Submitted":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
            Submitted
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
            Under Review
          </Badge>
        );
      case "Accepted":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
            Accepted
          </Badge>
        );
      case "Needs Replacement":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
            Needs Replacement
          </Badge>
        );
    }
  };

  const handleSimulateUpload = (fileName: string) => {
    setUploadSuccessMsg(`File "${fileName}" selected for upload.`);
    setTimeout(() => {
      setDocName(fileName);
      setHasDocument(true);
      setDocStatus("Submitted");
      setReplaceDialogOpen(false);
      setUploadSuccessMsg("Document attached to registration record.");

      const appNum = application.applicationNumber || application.id || "BVR-2026-001248";
      const vName =
        application.business?.businessName ||
        application.vendor?.businessName ||
        application.vendor?.name ||
        "Montilla Street Produce & Snacks";

      updateApplication(appNum, {
        documents: [
          {
            id: `doc-${Date.now()}`,
            filename: fileName,
            idType: "Philippine National ID (PhilSys)",
            uploadedAt: new Date().toISOString(),
            status: "Submitted",
          },
        ],
      });

      // Workflow notification to Admin
      addAdminNotification({
        type: "document-uploaded",
        title: "Government ID Submitted for Verification",
        message: "A government ID has been submitted and is ready for verification.",
        fullMessage: `A new government ID (${fileName}) has been submitted for application ${appNum} and is ready for verification.`,
        applicationNumber: appNum,
        vendorName: vName,
        status: "Under Review",
        actionLabel: "Review Documents",
        actionUrl: "/admin/documents",
        href: "/admin/documents",
        priority: "normal",
      });

      setTimeout(() => setUploadSuccessMsg(null), 3000);
    }, 1000);
  };

  if (!isLoading && !hasRealApp) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center">
            <Files className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold uppercase tracking-wider">
              No Application Documents
            </Badge>
            <h2 className="text-xl font-bold text-slate-900">
              No Documents on File
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              No registered vendor application was found for your account. Register your business to upload and view your compliance documents.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link
              href="/register?new=true"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shadow-xs gap-1.5 inline-flex items-center"
              )}
            >
              Start Vendor Registration
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Documents
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
              1 Document Slot
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage the documents submitted with your vendor registration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status switcher for review simulation */}
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
            Preview Status:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(["Submitted", "Under Review", "Accepted", "Needs Replacement"] as DocStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDocStatus(status)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                    docStatus === status
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{uploadSuccessMsg}</span>
        </div>
      )}

      {/* 5. Optional Government ID Notice & State Toggle */}
      <Alert className="bg-blue-50/70 border-blue-200/80 text-blue-950 rounded-2xl p-4 sm:p-5">
        <Info className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Government ID is Optional
              </span>
            </div>
            <AlertTitle className="text-sm font-bold text-blue-950">
              Government ID is optional. You may provide one to help verify your registration.
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-blue-800/90 mt-1">
              If no ID is provided, your registration will display &ldquo;No Government ID Submitted&rdquo;.
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* 4. Vendor Registration Payment Receipt Card */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Vendor Registration Payment Receipt
            </CardTitle>
          </div>
          {isPaymentVerified ? (
            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-700" />
              Verified
            </Badge>
          ) : paymentStatus === "awaiting_cashier_payment" ? (
            <Badge className="bg-sky-100 text-sky-900 border-sky-300 text-xs font-semibold">
              <Landmark className="w-3 h-3 mr-1 text-sky-700" />
              Awaiting Cashier Payment
            </Badge>
          ) : paymentStatus === "pending_verification" ? (
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
              <Clock className="w-3 h-3 mr-1 text-amber-700" />
              Pending Verification
            </Badge>
          ) : paymentStatus === "rejected" ? (
            <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs font-semibold">
              <AlertCircle className="w-3 h-3 mr-1 text-rose-700" />
              Payment Rejected
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
              Payment Required
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {isPaymentVerified ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs uppercase border border-emerald-300">
                  PDF
                </div>
                <div className="space-y-0.5 min-w-0">
                  <span className="font-bold text-slate-900 text-sm block font-mono truncate">
                    {receiptFilename}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>OR No: <strong className="font-mono text-emerald-800">{orNumber}</strong></span>
                    <span>•</span>
                    <span>Issued: {receiptIssueDate}</span>
                    <span>•</span>
                    <span>Amount: <strong className="text-slate-900">{formatPhpCurrency(amountPaid)}</strong></span>
                    <span>•</span>
                    <span>Channel: {paymentMethod}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptModalOpen(true)}
                  className="text-xs font-semibold text-emerald-800 border-emerald-300 bg-white hover:bg-emerald-50 cursor-pointer gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReceiptModalOpen(true)}
                  className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </Button>
              </div>
            </div>
          ) : paymentStatus === "awaiting_cashier_payment" ? (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-sky-900">
                <Landmark className="w-4 h-4 text-sky-700" />
                <span>City Treasurer&apos;s Office (CTO) Cashier Settlement Required</span>
              </div>
              <p className="text-xs text-sky-900/90 leading-relaxed">
                Your selected payment method is <strong>City Treasurer&apos;s Office (CTO) Cashier — Pay In Person</strong>. Please present assessment tracking reference <strong className="font-mono">{transactionRef}</strong> at the CTO Cashier window at Butuan City Hall.
              </p>
              <div className="p-3 rounded-lg bg-white/80 border border-sky-200/80 text-xs text-sky-900 flex flex-wrap items-center justify-between gap-2">
                <span>Assessed Fee: <strong>{formatPhpCurrency(amountPaid)}</strong></span>
                <span className="text-[11px] text-sky-700">Receipt will appear here automatically upon cashier recording</span>
              </div>
            </div>
          ) : paymentStatus === "pending_verification" ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                <Clock className="w-4 h-4 text-amber-700" />
                <span>GCash Payment Submitted — Verification Pending</span>
              </div>
              <p className="text-xs text-amber-900/90 leading-relaxed">
                GCash payment for tracking reference <strong className="font-mono">{transactionRef}</strong> ({formatPhpCurrency(amountPaid)}) is awaiting administrative verification. City Treasury staff is validating this transaction against official municipal accounts.
              </p>
              <p className="text-[11px] text-amber-800">
                Your official <strong>Vendor Registration Payment Receipt</strong> will be published in this section once staff records the verification. You will also receive an in-app notification.
              </p>
            </div>
          ) : paymentStatus === "rejected" ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>Payment Details Rejected</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Reason: &ldquo;{paymentInfo?.rejectionReason || "Payment reference could not be matched with treasury records."}&rdquo;
              </p>
              <p className="text-[11px] text-rose-800">
                Please review your payment or visit the City Treasurer&apos;s Office to settle your registration fee.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <Receipt className="w-4 h-4 text-slate-600" />
                <span>No Payment Recorded</span>
              </div>
              <p className="text-xs text-slate-600">
                Your official payment receipt will be generated and published in this section once your registration fee has been settled and verified.
              </p>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Document Integrity &amp; Privacy:</strong> Official payment receipts are secured and bound exclusively to application <strong className="font-mono text-slate-800">{application.applicationNumber || application.id}</strong>. Only the authenticated vendor and authorized LGU staff have access.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Document Section: Active Document vs Empty State */}
      {hasDocument ? (
        /* 4. Document Summary Card: Government ID */
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Government ID
              </CardTitle>
            </div>
            {getStatusBadge(docStatus)}
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase border border-rose-200">
                  PDF
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">
                    {docName}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Date Submitted: {submissionDate}</span>
                    <span>•</span>
                    <span>Size: 1.8 MB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View & Replace */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                {/* View Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View</span>
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Document Preview</DialogTitle>
                      <DialogDescription>
                        Submitted file: <span className="font-semibold text-slate-800">{docName}</span>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                      <div className="h-48 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-4">
                        <FileCheck2 className="w-10 h-10 text-blue-600 mb-2" />
                        <span className="font-bold text-sm text-slate-800">
                          {docName}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Philippine National ID / Government Valid ID
                        </span>
                        <Badge className="mt-3 bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                          Legible & Formatted
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-semibold text-slate-800">{docStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span className="font-semibold text-slate-800">{submissionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Applicant:</span>
                          <span className="font-semibold text-slate-800">{applicantName}</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Close
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Replace Dialog */}
                <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Replace</span>
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Replace Government ID</DialogTitle>
                      <DialogDescription>
                        Select a new copy of your Government ID to replace the existing file.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Replace Upload Box */}
                    <div className="py-2 space-y-3">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
                        <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">
                          Upload Government ID
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Drag and drop your file here or browse.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Allowed: PNG, JPG/JPEG, PDF • Maximum: 5MB
                        </p>

                        <div className="mt-4 flex justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSimulateUpload("updated-gov-id-scanned.pdf")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                          >
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Cancel
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Document Guidance note based on status */}
            {docStatus === "Needs Replacement" && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Attention Required:</span>
                  <p className="mt-0.5">
                    The submitted image was blurry or incomplete. Please click &ldquo;Replace&rdquo; to provide a clear, readable copy of your Government ID.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* 5. Empty State: No Government ID Submitted */
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Files className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                No Government ID Submitted
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Government ID is optional. You may provide one to help verify your registration.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setHasDocument(true);
                  setDocStatus("Submitted");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm cursor-pointer gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Add Government ID</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semantic reference for empty state accessibility */}
      <div className="sr-only">
        <h3>No Government ID Submitted</h3>
        <p>Government ID is optional. You may provide one to help verify your registration.</p>
        <button type="button">Add Government ID</button>
      </div>

      {/* 6. Upload UI Area */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Upload Government ID
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500">
            Drag and drop your file here or browse.
          </p>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Interactive Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSimulateUpload("government-id.pdf");
            }}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-blue-600 bg-blue-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
            )}
            onClick={() => handleSimulateUpload("government-id-verified.png")}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-slate-900">
              Upload Government ID
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Drag and drop your file here or browse.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-blue-600 hover:text-blue-700">
              <span>Choose File</span>
            </div>

            {/* Allowed specifications */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span>Allowed: PNG, JPG/JPEG, PDF</span>
              <span>•</span>
              <span>Maximum: 5MB</span>
              <span>•</span>
              <span className="text-emerald-700">Client-Side UI Only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Documents Status Reference Showcase */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Document Status Guide
          </CardTitle>
          <p className="text-xs text-slate-500">
            Standard status badges utilized by the City Government of Butuan:
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                Submitted
              </Badge>
              <p className="text-[11px] text-slate-600">
                File successfully uploaded and waiting for queue review.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
                Under Review
              </Badge>
              <p className="text-[11px] text-slate-600">
                Staff is actively checking authenticity and validity.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                Accepted
              </Badge>
              <p className="text-[11px] text-slate-600">
                Document verified and approved by the administrator.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
                Needs Replacement
              </Badge>
              <p className="text-[11px] text-slate-600">
                Document is unreadable or expired and needs re-upload.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Official Receipt Preview Dialog */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-xl bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
          <DialogHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900">
                    Official Payment Receipt
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    City Government of Butuan • Office of the City Treasurer
                  </DialogDescription>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold text-xs">
                Verified &amp; Recorded
              </Badge>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* Certificate Header Banner */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 uppercase font-semibold tracking-wider text-[10px]">
                  Official Receipt (OR) Number
                </span>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  ORIGINAL
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-mono font-extrabold tracking-wide text-white">
                {orNumber}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">Issue Date</span>
                  <span className="font-semibold text-slate-200">{receiptIssueDate}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block font-medium">Verified By</span>
                  <span className="font-semibold text-slate-200">{verifiedBy}</span>
                </div>
              </div>
            </div>

            {/* Payor & Application Info */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Business Name:</span>
                <strong className="text-slate-900 font-semibold">{application.business?.businessName || application.businessName}</strong>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Registered Owner:</span>
                <span className="text-slate-800">{applicantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Application Number:</span>
                <span className="font-mono font-semibold text-slate-900">{application.applicationNumber || application.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Channel:</span>
                <span className="font-semibold text-blue-700">{paymentMethod}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Transaction Reference:</span>
                <span className="font-mono font-bold text-slate-900">{transactionRef}</span>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
              <div className="bg-slate-100 p-2.5 px-3 font-semibold text-slate-700 flex justify-between">
                <span>Assessment Particulars</span>
                <span>Amount (PHP)</span>
              </div>
              <div className="p-2.5 px-3 flex justify-between bg-white border-b border-slate-100">
                <span className="text-slate-800">Vendor Registration Regulatory &amp; Mayor&apos;s Permit Fee</span>
                <span className="font-mono font-semibold text-slate-900">{formatPhpCurrency(amountPaid)}</span>
              </div>
              <div className="p-3 px-3 flex justify-between bg-slate-50 font-bold text-sm">
                <span className="text-slate-900">Total Settled</span>
                <span className="font-mono text-emerald-700">{formatPhpCurrency(amountPaid)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center leading-relaxed">
              Official electronic receipt issued by the City Treasurer&apos;s Office, City Government of Butuan, Agusan del Norte. Valid for municipal vendor registration compliance.
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100 flex flex-row items-center justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.print();
                }
              }}
              className="text-xs font-semibold gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </Button>

            <DialogClose render={<Button variant="outline" size="sm" type="button" />}>
              Close
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
