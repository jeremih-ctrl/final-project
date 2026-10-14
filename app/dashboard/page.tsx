"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  FileText,
  Building2,
  Files,
  Check,
  Clock,
  ShieldCheck,
  Copy,
  Hash,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CreditCard,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";
import { formatPhpCurrency, getPaymentStatusBadgeConfig } from "@/lib/payment-fee-schedule";

export type DashboardStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "needs-correction"
  | "correction-submitted"
  | "approved"
  | "rejected";

export default function DashboardPage() {
  const [copiedAppNumber, setCopiedAppNumber] = useState(false);
  const { application, status } = useSharedApplication();
  const demoStatus = status as DashboardStatus;

  // Vendor Canonical Data from shared application
  const vendor = {
    businessName:
      application.vendor?.businessName ||
      application.businessName ||
      "",
    owner:
      application.vendor?.name ||
      application.ownerName ||
      "",
    applicationNumber:
      application.id ||
      application.applicationNumber ||
      "",
    vendorId:
      application.vendorId ||
      (status === "approved" ? "Assigned upon release" : "Pending assignment"),
    contactNumber:
      application.vendor?.phone ||
      application.contactNumber ||
      "",
    email:
      application.vendor?.email ||
      application.email ||
      "",
    address:
      application.business?.address ||
      application.street ||
      "",
    barangay:
      application.business?.barangay ||
      application.barangay ||
      "",
    submittedDate: application.submittedDate || "Recently",
    jurisdiction: "City Government of Butuan, Agusan del Norte, Philippines",
  };

  const isNeedsCorrection = demoStatus === "needs-correction";
  const isApproved = demoStatus === "approved";
  const isUnderReview = demoStatus === "under-review";
  const isSubmitted = demoStatus === "submitted";
  const isDraft = demoStatus === "draft";
  const isRejected = demoStatus === "rejected";

  const paymentInfo = application.payment;
  const paymentBadge = getPaymentStatusBadgeConfig(paymentInfo?.status || "unpaid");
  const assessedAmount = paymentInfo?.assessedAmount ?? 650;
  const amountPaid = paymentInfo?.amountPaid ?? 0;

  const handleCopyAppNumber = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vendor.applicationNumber);
      setCopiedAppNumber(true);
      setTimeout(() => setCopiedAppNumber(false), 2000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* 1. Welcome Card */}
      <section
        aria-label="Welcome and operational summary"
        className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Vendor Portal
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-medium text-slate-600">
                City Government of Butuan
              </span>
              <Badge
                variant="outline"
                className="text-[11px] font-semibold text-blue-700 bg-blue-50/80 border-blue-200"
              >
                Local Enterprise
              </Badge>
              {isNeedsCorrection && (
                <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-[11px] font-bold">
                  ⚠ Action Required
                </Badge>
              )}
              {isApproved && (
                <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-[11px] font-bold">
                  ✓ Accredited
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Welcome, {vendor.owner || "Vendor"}
              </h1>
              {isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>[✓ VERIFIED]</span>
                </span>
              ) : demoStatus === "rejected" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs sm:text-sm">
                  <XCircle className="w-4 h-4 text-slate-600" />
                  <span>NOT VERIFIED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>VERIFICATION PENDING</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Managing <strong className="text-slate-900">{vendor.businessName}</strong>
              {vendor.barangay ? ` (${vendor.barangay})` : ""}. Here is the real-time status and operational summary for your municipal registration.
            </p>
          </div>

          {/* Primary Actions: Track Application & Manage Documents */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <Link
              href="/dashboard/my-application"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 h-9"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>My Application</span>
            </Link>

            {isNeedsCorrection ? (
              <Link
                href="/dashboard/my-application/correction"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer gap-1.5 h-9 shadow-xs"
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Correct Application</span>
              </Link>
            ) : (
              <Link
                href="/dashboard/documents"
                className={cn(
                  buttonVariants({ variant: "default", size: "sm" }),
                  "text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-1.5 h-9 shadow-xs"
                )}
              >
                <Files className="w-3.5 h-3.5" />
                <span>Manage Documents</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Application Approval / Verification / Priority Banners (Only when supported by records) */}
      {/* 2a. Payment Rejection Notice */}
      {paymentInfo?.status === "rejected" && (
        <section
          aria-label="Payment rejection notice"
          className="rounded-2xl bg-rose-50/95 border-2 border-rose-300 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded">
                    Payment Action Required
                  </span>
                  <span className="text-xs text-rose-800 font-medium">
                    Proof of Payment Rejected
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-rose-950">
                  Payment Proof Rejected by Administrator
                </h2>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-3xl">
                  {paymentInfo.rejectionReason ? (
                    <>
                      Administrator Remarks: <strong className="font-semibold">&ldquo;{paymentInfo.rejectionReason}&rdquo;</strong>
                    </>
                  ) : (
                    "The administrator reviewed your uploaded receipt and could not verify it. Please upload a clear and valid receipt or transaction screenshot."
                  )}
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-application"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm cursor-pointer gap-2 shrink-0 self-start sm:self-center shadow-xs"
              )}
            >
              <Receipt className="w-4 h-4" />
              <span>Resubmit Payment Proof</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2b. Awaiting Cashier Payment Notice */}
      {paymentInfo?.status === "awaiting_cashier_payment" && !isApproved && !isRejected && (
        <section
          aria-label="CTO Cashier payment notice"
          className="rounded-2xl bg-sky-50/90 border-2 border-sky-300 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-300 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-sky-900 bg-sky-200/80 px-2 py-0.5 rounded">
                    Awaiting Cashier Payment
                  </span>
                  <span className="text-xs text-sky-800 font-medium">
                    Assessed Fee: {formatPhpCurrency(assessedAmount)}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-sky-950">
                  Pay In Person at City Treasurer&apos;s Office (CTO) Cashier
                </h2>
                <p className="text-xs sm:text-sm text-sky-900 leading-relaxed max-w-3xl">
                  Please proceed to the City Treasurer&apos;s Office Cashier window at Butuan City Hall and provide assessment reference <strong>{paymentInfo.transactionReference || vendor.applicationNumber}</strong>. Once settled, your Official Receipt will be delivered directly to your Documents section.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/documents"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shrink-0 self-start sm:self-center shadow-xs gap-1.5"
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Documents</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2b-2. Pending GCash Verification Notice */}
      {paymentInfo?.status === "pending_verification" && !isApproved && !isRejected && (
        <section
          aria-label="Payment pending verification notice"
          className="rounded-2xl bg-amber-50/90 border-2 border-amber-300 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    Payment Verification in Progress
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Declared: {formatPhpCurrency(paymentInfo.amountPaid || assessedAmount)}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">
                  GCash Payment Awaiting City Treasury Verification
                </h2>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
                  Your GCash payment (Reference: <strong>{paymentInfo.transactionReference || vendor.applicationNumber}</strong>) has been submitted. City Treasury staff will verify the transaction and deliver your official receipt to your Documents section.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/documents"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold shrink-0 self-start sm:self-center shadow-xs gap-1.5"
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Check Documents</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2b-3. Unpaid Fee Notice */}
      {paymentInfo?.status === "unpaid" && !isApproved && !isRejected && (
        <section
          aria-label="Payment submission notice"
          className="rounded-2xl bg-amber-50/90 border-2 border-amber-300 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    Payment Pending
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Assessed Fee: {formatPhpCurrency(assessedAmount)}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">
                  Registration Payment Pending
                </h2>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
                  Your registration requires payment of the official fee. You may pay online via GCash QR or in person at the City Treasurer&apos;s Office Cashier.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/documents"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 self-start sm:self-center shadow-xs gap-1.5"
              )}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Documents</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2c. Verified & Approved Banner */}
      {isApproved && (
        <section
          aria-label="Approved vendor access banner"
          className="rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded">
                    Full Access Granted
                  </span>
                  <span className="text-xs text-emerald-800 font-medium">
                    ✓ Verified Vendor
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-emerald-950">
                  Application Approved &amp; Vendor Verified
                </h2>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed max-w-3xl">
                  Congratulations! The Administrator has approved your application and your vendor identity is verified. Your municipal Vendor Certificate is active and valid.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-application"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-950 text-xs font-bold shadow-xs gap-1.5 shrink-0 self-start sm:self-center"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>View Application</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2d. Needs Correction Banner */}
      {isNeedsCorrection && (
        <section
          aria-label="Action required notice"
          className="rounded-2xl bg-orange-50/90 border-2 border-orange-300 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-300 text-orange-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-900 bg-orange-200/80 px-2 py-0.5 rounded">
                    Attention Required
                  </span>
                  <span className="text-xs text-orange-800 font-medium">
                    Correction Notice
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-orange-950">
                  Your application requires corrections before it can be approved
                </h2>
                <p className="text-xs sm:text-sm text-orange-900 leading-relaxed max-w-3xl">
                  Administrator Remarks: &ldquo;{application.adminRemarks || "Please provide updated application details and replacement documents."}&rdquo;
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-application/correction"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm cursor-pointer gap-2 shrink-0 self-start sm:self-center shadow-xs"
              )}
            >
              <span>Correct Application Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 2e. Rejection Banner */}
      {isRejected && (
        <section
          aria-label="Application rejection notice"
          className="rounded-2xl bg-rose-50/90 border-2 border-rose-300 p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <XCircle className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-900 bg-rose-200/80 px-2 py-0.5 rounded">
                    Application Not Approved
                  </span>
                  <span className="text-xs text-rose-800 font-medium">
                    {application.lastUpdatedText || "Evaluation Concluded"}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-rose-950">
                  Application Not Approved
                </h2>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-3xl">
                  Administrator Remarks: &ldquo;{application.adminRemarks || "Application did not meet municipal licensing or zoning criteria."}&rdquo;
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-application"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-rose-300 text-rose-900 hover:bg-rose-100 text-xs font-bold shrink-0 self-start sm:self-center"
              )}
            >
              <span>View Full Decision Details</span>
            </Link>
          </div>
        </section>
      )}

      {/* 2f. Under Review Banner */}
      {!isApproved && !isNeedsCorrection && !isRejected && paymentInfo?.status !== "rejected" && paymentInfo?.status !== "unpaid" && (
        <section
          aria-label="Pending approval banner"
          className="rounded-2xl bg-amber-50/90 border-2 border-amber-300 p-5 sm:p-6 shadow-xs space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                    Approval Pending
                  </span>
                  <span className="text-xs text-amber-800 font-medium">
                    Administrative Review in Progress
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">
                  Application Under Review — Full Verification Pending
                </h2>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
                  Your vendor registration is currently being evaluated by the City Government of Butuan Licensing Division. You will be notified once evaluation is completed.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/my-application"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold shrink-0 self-start sm:self-center shadow-xs gap-1.5"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>View Application</span>
            </Link>
          </div>
        </section>
      )}

      {/* 3. Essential Status Summary Cards (Compact 5-Card Row) */}
      <section
        aria-label="Registration status summary"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4"
      >
        {/* Card 1: Application Status */}
        <Card
          className={cn(
            "shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all",
            isNeedsCorrection
              ? "border-orange-300 bg-orange-50/30"
              : isApproved
              ? "border-emerald-300 bg-emerald-50/20"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Application Status
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                isApproved
                  ? "bg-emerald-100 text-emerald-700"
                  : isNeedsCorrection
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isNeedsCorrection ? (
                <AlertTriangle className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Badge
              className={cn(
                "text-xs font-extrabold uppercase px-2.5 py-1 tracking-wide",
                isApproved
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : isNeedsCorrection
                  ? "bg-orange-600 text-white border-orange-600"
                  : isRejected
                  ? "bg-slate-700 text-white border-slate-700"
                  : "bg-amber-100 text-amber-950 border-amber-300"
              )}
            >
              {isApproved
                ? "APPROVED"
                : isUnderReview
                ? "UNDER REVIEW"
                : isNeedsCorrection
                ? "NEEDS CORRECTION"
                : isRejected
                ? "REJECTED"
                : isSubmitted
                ? "SUBMITTED"
                : "DRAFT"}
            </Badge>
            <p className="text-[11px] text-slate-500 block pt-0.5">
              {isApproved
                ? "Accredited & Certified"
                : isNeedsCorrection
                ? "Correction pending"
                : "In evaluation queue"}
            </p>
          </div>
        </Card>

        {/* Card 2: Payment Status */}
        <Card
          className={cn(
            "shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all border",
            paymentInfo?.status === "rejected"
              ? "border-rose-300 bg-rose-50/30"
              : paymentInfo?.status === "verified"
              ? "border-emerald-300 bg-emerald-50/20"
              : paymentInfo?.status === "pending_verification"
              ? "border-blue-300 bg-blue-50/20"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Payment Status
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                paymentInfo?.status === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : paymentInfo?.status === "verified"
                  ? "bg-emerald-100 text-emerald-700"
                  : paymentInfo?.status === "pending_verification"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-slate-100 text-slate-700"
              )}
            >
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <Badge className={cn("text-xs font-extrabold uppercase px-2.5 py-1 tracking-wide border", paymentBadge.badgeClass)}>
              {paymentBadge.label}
            </Badge>
            <p className="text-[11px] text-slate-500 block pt-0.5">
              {paymentInfo?.status === "verified"
                ? `Verified: ${formatPhpCurrency(amountPaid || assessedAmount)}`
                : paymentInfo?.status === "rejected"
                ? "Payment rejected • Resubmit"
                : paymentInfo?.status === "awaiting_cashier_payment"
                ? "Pay at CTO Cashier"
                : paymentInfo?.status === "pending_verification"
                ? "Under admin review"
                : `Assessed: ${formatPhpCurrency(assessedAmount)}`}
            </p>
          </div>
        </Card>

        {/* Card 3: Verification Status */}
        <Card
          className={cn(
            "shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between transition-all",
            isApproved
              ? "border-emerald-300 bg-emerald-50/20"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verification Status
            </span>
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                isApproved
                  ? "bg-emerald-100 text-emerald-700"
                  : demoStatus === "rejected"
                  ? "bg-slate-100 text-slate-600"
                  : "bg-amber-100 text-amber-700"
              )}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            {isApproved ? (
              <Badge className="bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold text-xs inline-flex items-center gap-1.5 py-1 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>VERIFIED</span>
              </Badge>
            ) : demoStatus === "rejected" ? (
              <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs inline-flex items-center gap-1.5 py-1">
                <XCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>NOT VERIFIED</span>
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-bold text-xs inline-flex items-center gap-1.5 py-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>PENDING</span>
              </Badge>
            )}
            <p className="text-[11px] text-slate-500 block pt-0.5">
              {isApproved
                ? "Identity & business verified"
                : demoStatus === "rejected"
                ? "Verification declined"
                : "Awaiting admin verification"}
            </p>
          </div>
        </Card>

        {/* Card 4: Application Number */}
        <Card className="bg-white border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Application Number
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {vendor.applicationNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAppNumber}
                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Copy application number"
                aria-label="Copy application number"
              >
                {copiedAppNumber ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 block">
              Official municipal reference
            </p>
          </div>
        </Card>

        {/* Card 5: Business Name */}
        <Card className="bg-white border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Business Name
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1.5 min-w-0">
            <span
              className="text-sm font-bold text-slate-900 truncate block"
              title={vendor.businessName}
            >
              {vendor.businessName}
            </span>
            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Certificate:</span>
              <Badge
                variant="outline"
                className={cn(
                  "font-semibold text-[10px] px-1.5 py-0",
                  isApproved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-blue-50 text-blue-800 border-blue-200"
                )}
              >
                {isApproved ? "ISSUED" : "PENDING"}
              </Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. Registration Progress Tracker */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Registration Progress Tracker
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Stages of your application from initial intake to certified issuance.
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-xs font-semibold",
              isApproved
                ? "text-emerald-800 bg-emerald-50 border-emerald-300 font-bold"
                : isNeedsCorrection
                ? "text-orange-800 bg-orange-50 border-orange-300 font-bold"
                : "text-slate-600 bg-slate-50"
            )}
          >
            {isApproved
              ? "Stage 4 of 4 Active"
              : isNeedsCorrection
              ? "Action Required at Stage 2"
              : isRejected
              ? "Evaluation Concluded"
              : isSubmitted
              ? "Stage 1 of 4"
              : "Stage 2 of 4 Active"}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-3">
            {/* Stage 1: Form Submitted */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5",
                  isDraft
                    ? "bg-slate-200 text-slate-600 border border-slate-300"
                    : "bg-emerald-600 text-white"
                )}
              >
                {isDraft ? "1" : <Check className="w-4 h-4 stroke-[3]" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  1. Form Submitted
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold block mt-0.5",
                    isDraft ? "text-slate-500" : "text-emerald-700"
                  )}
                >
                  {isDraft ? "○ In Progress" : "Completed"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Initial application intake
                </span>
              </div>
            </div>

            {/* Stage 2: Administrative Review */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5",
                  isApproved
                    ? "bg-emerald-600 text-white"
                    : isNeedsCorrection
                    ? "bg-orange-600 text-white ring-4 ring-orange-100 animate-pulse"
                    : isDraft
                    ? "bg-slate-100 text-slate-400 border border-slate-300"
                    : isRejected
                    ? "bg-slate-700 text-white"
                    : "bg-amber-500 text-white ring-4 ring-amber-100"
                )}
              >
                {isApproved ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isNeedsCorrection ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isDraft ? (
                  "2"
                ) : isRejected ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  2. Administrative Review
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold block mt-0.5",
                    isApproved
                      ? "text-emerald-700"
                      : isNeedsCorrection
                      ? "text-orange-700 font-bold"
                      : isDraft
                      ? "text-slate-400"
                      : isRejected
                      ? "text-slate-600"
                      : "text-amber-700 font-semibold"
                  )}
                >
                  {isApproved
                    ? "Completed"
                    : isNeedsCorrection
                    ? "⚠ Action Required"
                    : isDraft
                    ? "○ Upcoming"
                    : isRejected
                    ? "Concluded"
                    : "● Current Stage"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Licensing team assessment
                </span>
              </div>
            </div>

            {/* Stage 3: Vendor Verification */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5",
                  isApproved
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-400 border border-slate-300"
                )}
              >
                {isApproved ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  3. Vendor Verification
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold block mt-0.5",
                    isApproved ? "text-emerald-700 font-bold" : "text-slate-400"
                  )}
                >
                  {isApproved ? "Verified & Completed" : "○ Pending Stage 2"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Business identity confirmation
                </span>
              </div>
            </div>

            {/* Stage 4: Vendor Certificate Issuance */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs mt-0.5",
                  isApproved
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-slate-100 text-slate-400 border border-slate-300"
                )}
              >
                {isApproved ? <CheckCircle2 className="w-4 h-4 stroke-[2.5]" /> : "4"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  4. Certificate Issuance
                </p>
                <span
                  className={cn(
                    "text-[11px] font-semibold block mt-0.5",
                    isApproved ? "text-blue-700 font-bold" : "text-slate-400"
                  )}
                >
                  {isApproved ? "● Released & Active" : "○ Pending Approval"}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Municipal vendor certificate
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
