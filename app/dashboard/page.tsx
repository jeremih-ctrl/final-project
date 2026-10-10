"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Building2,
  Files,
  Bell,
  Check,
  Clock,
  ShieldCheck,
  Copy,
  Hash,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  MapPin,
  CheckCircle2,
  Lock,
  FileCheck2,
  Calendar,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";

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
  const { application, status, updateStatus } = useSharedApplication();
  const demoStatus = status as DashboardStatus;

  const hasProfile = Boolean(
    application.vendor?.businessName ||
      application.businessName ||
      application.vendor?.name ||
      application.ownerName
  );

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
    submittedTime: "9:30 AM",
    jurisdiction: "City Government of Butuan, Agusan del Norte, Philippines",
  };

  const isNeedsCorrection = demoStatus === "needs-correction";
  const isCorrectionSubmitted = demoStatus === "correction-submitted";
  const isApproved = demoStatus === "approved";
  const isUnderReview = demoStatus === "under-review";
  const isSubmitted = demoStatus === "submitted";
  const isDraft = demoStatus === "draft";
  const isRejected = demoStatus === "rejected";

  const handleCopyAppNumber = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(vendor.applicationNumber);
      setCopiedAppNumber(true);
      setTimeout(() => setCopiedAppNumber(false), 2000);
    }
  };

  // Status Presentation Configuration
  const getStatusConfig = (status: DashboardStatus) => {
    switch (status) {
      case "draft":
        return {
          title: "Draft Application Saved",
          badgeLabel: "Draft",
          badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
          cardBorderClass: "border-slate-300",
          accentBg: "bg-slate-500/10 border-slate-200",
          accentText: "text-slate-800",
          icon: FileText,
          iconBg: "bg-slate-100 text-slate-700",
          description:
            "Your vendor registration draft is saved locally. Complete your business information and required credentials to officially submit your application.",
          lastUpdated: "Saved today • Draft mode",
          primaryAction: {
            label: "Continue Registration",
            href: "/register",
            icon: ArrowRight,
          },
        };
      case "submitted":
        return {
          title: "Application Received & Queued",
          badgeLabel: "Submitted",
          badgeClass: "bg-blue-100 text-blue-900 border-blue-300",
          cardBorderClass: "border-blue-300/80",
          accentBg: "bg-blue-500/10 border-blue-200",
          accentText: "text-blue-900",
          icon: Clock,
          iconBg: "bg-blue-100 text-blue-700",
          description:
            "Your vendor registration was received by the City Government of Butuan Licensing Office. It has entered the administrative queue for evaluation.",
          lastUpdated: "Submitted Oct 6, 2026 • 9:30 AM",
          primaryAction: {
            label: "Track Application",
            href: "/application-status",
            icon: FileText,
          },
        };
      case "under-review":
        return {
          title: "Under Administrative Review",
          badgeLabel: "Under Review",
          badgeClass: "bg-amber-100 text-amber-950 border-amber-300",
          cardBorderClass: "border-amber-300/80",
          accentBg: "bg-amber-500/10 border-amber-200",
          accentText: "text-amber-950",
          icon: Clock,
          iconBg: "bg-amber-100 text-amber-700",
          description:
            "City licensing evaluators are actively reviewing your submitted business profile, operating location, and attached credentials.",
          lastUpdated: "Review in progress • Licensing Division",
          primaryAction: {
            label: "Track Application",
            href: "/application-status",
            icon: FileText,
          },
        };
      case "needs-correction":
        return {
          title: "Action Required: Re-submission Needed",
          badgeLabel: "Needs Correction",
          badgeClass: "bg-orange-100 text-orange-950 border-orange-300 font-bold",
          cardBorderClass: "border-orange-300/90",
          accentBg: "bg-orange-500/10 border-orange-200",
          accentText: "text-orange-950",
          icon: AlertTriangle,
          iconBg: "bg-orange-100 text-orange-700",
          description:
            application.adminRemarks
              ? `Administrator Remarks: "${application.adminRemarks}"`
              : "An administrator inspected your application and requested specific updates. Please review the remarks, amend your details, and submit corrections promptly.",
          lastUpdated: application.lastUpdatedText || "Correction notice issued Oct 6, 2026 • 2:45 PM",
          primaryAction: {
            label: "Review & Correct Application",
            href: "/dashboard/my-application/correction",
            icon: AlertTriangle,
          },
        };
      case "correction-submitted":
        return {
          title: "Corrections Submitted — Under Review",
          badgeLabel: "Correction Submitted",
          badgeClass: "bg-blue-100 text-blue-900 border-blue-300 font-semibold",
          cardBorderClass: "border-blue-300/80",
          accentBg: "bg-blue-500/10 border-blue-200",
          accentText: "text-blue-900",
          icon: Clock,
          iconBg: "bg-blue-100 text-blue-700",
          description:
            "Your updated address and replacement government ID were received. Your application is back in the active administrative queue.",
          lastUpdated: application.lastUpdatedText || "Resubmitted today • Active evaluation",
          primaryAction: {
            label: "Track Status",
            href: "/application-status",
            icon: FileText,
          },
        };
      case "approved":
        return {
          title: "Registration Approved — Official Vendor ID Issued",
          badgeLabel: "Approved",
          badgeClass: "bg-emerald-100 text-emerald-950 border-emerald-300 font-bold",
          cardBorderClass: "border-emerald-300/90",
          accentBg: "bg-emerald-500/10 border-emerald-200",
          accentText: "text-emerald-950",
          icon: CheckCircle2,
          iconBg: "bg-emerald-100 text-emerald-700",
          description:
            "Congratulations! Your business registration was officially verified and accredited by the City Government of Butuan. Your municipal Vendor Certificate is active.",
          lastUpdated: application.lastUpdatedText || "Approved Oct 6, 2026 • Official Record Active",
          primaryAction: {
            label: "View Business Profile",
            href: "/dashboard/business-profile",
            icon: Building2,
          },
        };
      case "rejected":
        return {
          title: "Application Not Approved",
          badgeLabel: "Not Approved",
          badgeClass: "bg-slate-100 text-slate-800 border-slate-300 font-semibold",
          cardBorderClass: "border-slate-300",
          accentBg: "bg-slate-500/10 border-slate-200",
          accentText: "text-slate-800",
          icon: XCircle,
          iconBg: "bg-slate-100 text-slate-700",
          description:
            application.adminRemarks
              ? `Application not approved. Administrator reason: "${application.adminRemarks}"`
              : "Following review by the licensing committee, your registration could not be approved due to non-compliance with municipal zoning criteria.",
          lastUpdated: application.lastUpdatedText || "Evaluation concluded Oct 6, 2026",
          primaryAction: {
            label: "Review Application Record",
            href: "/application-status",
            icon: FileText,
          },
        };
    }
  };

  const statusConfig = getStatusConfig(demoStatus);

  // Document Summary Calculations
  const docStats = {
    total: isDraft ? 0 : 1,
    accepted: isApproved ? 1 : 0,
    underReview: isUnderReview || isSubmitted || isCorrectionSubmitted ? 1 : 0,
    needsReplacement: isNeedsCorrection ? 1 : 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 2. Command Center Header */}
      <header className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
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
                Welcome, {vendor.owner}
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
              Managing <strong className="text-slate-900">{vendor.businessName}</strong> ({vendor.barangay}). Here is the real-time status and operational command center for your municipal registration.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            <Link
              href="/application-status"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 h-9"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Track Application</span>
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
      </header>

      {/* 3. Vendor Dashboard Access Notice (Pending vs Approved) */}
      {!isApproved && !isNeedsCorrection && !isRejected && (
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
                    Stage 2 of 4 Active • Administrative Review
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950">
                  Application Under Review — Full Dashboard Access Pending
                </h2>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed max-w-3xl">
                  Your vendor registration is currently being evaluated by the City Government of Butuan. Vendor dashboard access and certified operational features will unlock once the administrator approves your application.
                </p>
              </div>
            </div>

            <Link
              href="/application-status"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "border-amber-300 bg-white hover:bg-amber-100 text-amber-950 text-xs font-bold shrink-0 self-start sm:self-center shadow-xs gap-1.5"
              )}
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>Track Application</span>
            </Link>
          </div>
        </section>
      )}

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
                  Congratulations! The Administrator has approved your application and your vendor identity is verified. Your Vendor Dashboard is fully accessible. Next stage: municipal vendor certificate issuance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <Link
                href="/application-status"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-emerald-300 bg-white hover:bg-emerald-100 text-emerald-950 text-xs font-bold shadow-xs gap-1.5"
                )}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
                <span>Track Status</span>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 3. Action Required / Attention Banner (Section 8) */}
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
                    Oct 6, 2026 • 2:45 PM
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-orange-950">
                  Your application requires corrections before it can be approved
                </h2>
                <p className="text-xs sm:text-sm text-orange-900 leading-relaxed max-w-3xl">
                  Administrator Remarks: &ldquo;{application.adminRemarks || "Please provide a clearer business address and replace the submitted government ID image with a readable copy."}&rdquo;
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

          {/* Detailed field checklist of items needing attention */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-orange-200/80">
            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-orange-200 text-xs text-orange-950">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold block">1. Business Street Address</span>
                <span className="text-slate-600">Provide complete street name and specific landmarks.</span>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-orange-200 text-xs text-orange-950">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1.5 shrink-0" />
              <div>
                <span className="font-bold block">2. Government ID Scan</span>
                <span className="text-slate-600">Upload high-resolution, unblurred PhilSys/Driver&apos;s License.</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3b. Dedicated Rejection Banner (Section 9) */}
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
                    Application Rejected
                  </span>
                  <span className="text-xs text-rose-800 font-medium">
                    {application.lastUpdatedText || "Evaluation Concluded"}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-rose-950">
                  Application Rejected
                </h2>
                <p className="text-xs sm:text-sm text-rose-900 leading-relaxed max-w-3xl">
                  Administrator Remarks / Reason: &ldquo;{application.adminRemarks || "Application did not meet municipal licensing or zoning criteria."}&rdquo;
                </p>
              </div>
            </div>

            <Link
              href="/application-status"
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

      {/* Reassuring Calm Notice when all caught up */}
      {!isNeedsCorrection && !isRejected && (
        <section
          aria-label="System status notice"
          className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                You&apos;re all caught up — No immediate action required
              </span>
              <span className="text-slate-500">
                {isApproved
                  ? "Your vendor registration is certified and compliant with local municipal regulations."
                  : `We will alert you via SMS (${vendor.contactNumber || "your registered number"}) and email (${vendor.email || "your registered email"}) once your evaluation status updates.`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-slate-500 text-[11px]">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated: Just now</span>
          </div>
        </section>
      )}

      {/* 4. KPI Summary Cards */}
      <section aria-label="Registration key metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", statusConfig.iconBg)}>
              <statusConfig.icon className="w-4 h-4" />
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
              {isApproved ? "Accredited & Approved" : isNeedsCorrection ? "Action pending" : "In evaluation queue"}
            </p>
          </div>
        </Card>

        {/* Card 2: Verification Status */}
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

        {/* Card 3: Application Number */}
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

        {/* Card 4: Business Name & Certificate */}
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
            <span className="text-sm font-bold text-slate-900 truncate block" title={vendor.businessName}>
              {vendor.businessName}
            </span>
            <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-slate-100">
              <span className="text-slate-500 font-medium">Certificate:</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-semibold text-[10px] px-1.5 py-0">
                PENDING
              </Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* 5. Main Command Center Grid: Left 2 Cols & Right 1 Col */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* A. Primary Focus: Application Status Card (Section 4) */}
          <Card
            className={cn(
              "bg-white rounded-2xl shadow-xs overflow-hidden border-2",
              statusConfig.cardBorderClass
            )}
          >
            {/* Header Strip */}
            <div className={cn("px-5 sm:px-6 py-3 border-b flex items-center justify-between", statusConfig.accentBg)}>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-600" />
                <span className={cn("text-xs font-bold tracking-wider uppercase", statusConfig.accentText)}>
                  Municipal Record • Butuan City
                </span>
              </div>
              <Badge className={cn("text-xs font-semibold", statusConfig.badgeClass)}>
                {statusConfig.badgeLabel}
              </Badge>
            </div>

            <CardContent className="p-5 sm:p-7 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Submitted: {vendor.submittedDate}</span>
                  <span className="text-slate-300">•</span>
                  <span>{statusConfig.lastUpdated}</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {statusConfig.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {statusConfig.description}
                </p>
              </div>

              {/* Status Meta Table Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Application No.</span>
                  <span className="font-mono font-bold text-slate-800">{vendor.applicationNumber}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Business Name</span>
                  <span className="font-semibold text-slate-800 truncate block">{vendor.businessName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Barangay</span>
                  <span className="font-semibold text-slate-800">{vendor.barangay}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Vendor ID</span>
                  <span className={cn("font-semibold", isApproved ? "font-mono text-emerald-800" : "text-slate-500")}>
                    {isApproved ? vendor.vendorId : "Not yet assigned"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  {isNeedsCorrection
                    ? "Prompt correction speeds up license certificate issuance."
                    : "Official records are encrypted and protected under city ordinances."}
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    href={statusConfig.primaryAction.href}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "text-xs sm:text-sm font-bold cursor-pointer gap-2 shadow-xs",
                      isNeedsCorrection ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
                    )}
                  >
                    <span>{statusConfig.primaryAction.label}</span>
                    <statusConfig.primaryAction.icon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* B. Application Progress Tracker (Section 5) */}
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
              {/* Progress Steps Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
                {/* Step 1: Registration Submitted */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
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
                  </div>
                </div>

                {/* Step 2: Application Review */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
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
                          ? "text-orange-700"
                          : isDraft
                          ? "text-slate-400"
                          : isRejected
                          ? "text-slate-600"
                          : "text-amber-700"
                      )}
                    >
                      {isApproved
                        ? "Completed"
                        : isNeedsCorrection
                        ? "⚠ Action Required"
                        : isDraft
                        ? "○ Upcoming"
                        : isRejected
                        ? "Evaluation Concluded"
                        : "● Current Stage"}
                    </span>
                  </div>
                </div>

                {/* Step 3: Vendor Verification */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
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
                      {isApproved ? "Verified / Completed" : "○ Pending Stage 2"}
                    </span>
                  </div>
                </div>

                {/* Step 4: Vendor Certificate Issuance */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs",
                      isApproved
                        ? "bg-blue-600 text-white ring-4 ring-blue-100 animate-pulse"
                        : "bg-slate-100 text-slate-400 border border-slate-300"
                    )}
                  >
                    {isApproved ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : (
                      "4"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      4. Vendor Certificate Issuance
                    </p>
                    <span
                      className={cn(
                        "text-[11px] font-semibold block mt-0.5",
                        isApproved ? "text-blue-700 font-bold" : "text-slate-400"
                      )}
                    >
                      {isApproved ? "● Current Stage (Pending)" : "○ Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* C. Quick Actions Command Grid (Section 6) */}
          <section aria-label="Quick actions" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Quick Actions
              </h3>
              <span className="text-xs text-slate-500">Direct portal navigation</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/application-status"
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight group-hover:text-blue-700">
                    Track Application
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Live status timeline</span>
                </div>
              </Link>

              <Link
                href="/dashboard/documents"
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between group cursor-pointer",
                  isNeedsCorrection
                    ? "bg-orange-50/60 border-orange-300 hover:border-orange-400 shadow-2xs"
                    : "bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-xs"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform",
                      isNeedsCorrection ? "bg-orange-200 text-orange-800" : "bg-indigo-50 text-indigo-700"
                    )}
                  >
                    <Files className="w-4 h-4" />
                  </div>
                  {isNeedsCorrection && (
                    <span className="w-2 h-2 rounded-full bg-orange-600 animate-pulse" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight group-hover:text-blue-700">
                    Documents
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {isNeedsCorrection ? "1 ID needs replacement" : "ID scan attached"}
                  </span>
                </div>
              </Link>

              <Link
                href="/dashboard/business-profile"
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight group-hover:text-blue-700">
                    Business Profile
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Stall & owner details</span>
                </div>
              </Link>

              <Link
                href="/dashboard/notifications"
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-xs transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block leading-tight group-hover:text-blue-700">
                    Notifications
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Alerts & messages</span>
                </div>
              </Link>
            </div>
          </section>

          {/* D. Business Information Card (Section 11) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Business Information
                </CardTitle>
              </div>
              <Link
                href="/dashboard/business-profile"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                )}
              >
                {hasProfile ? "Edit Business Profile" : "Set Up Profile"}
              </Link>
            </CardHeader>

            {!hasProfile ? (
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                  Complete your business profile to view your registered business information.
                </p>
                <Link
                  href="/dashboard/business-profile"
                  className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold")}
                >
                  Complete Profile
                </Link>
              </CardContent>
            ) : (
              <CardContent className="p-5 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Business Name:</span>
                    <span className="font-bold text-slate-900 block text-sm sm:text-base">
                      {vendor.businessName}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Registered Owner:</span>
                    <span className="font-semibold text-slate-900 block">{vendor.owner}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Contact Number:</span>
                    <span className="font-semibold text-slate-900 block font-mono">
                      {vendor.contactNumber}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium block">Email Address:</span>
                    <span className="font-semibold text-slate-900 block">{vendor.email}</span>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-slate-500 font-medium block">Operating Address:</span>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                      <span className="font-semibold text-slate-900 block">{vendor.address}</span>
                    </div>
                  </div>
                </div>

                {/* Fixed Jurisdiction Box (Cannot be edited) */}
                <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                  <Lock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div className="text-slate-600">
                    <span className="font-bold text-slate-800 block">
                      Municipal Jurisdiction: Butuan City, Agusan del Norte (Barangay {vendor.barangay || "Urduja"})
                    </span>
                    <span>
                      Official LGU jurisdiction is fixed to Butuan City Ordinance guidelines and cannot be altered.
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Vending Logistics & Compliance Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-700" />
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Vending Logistics & Compliance
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-semibold text-slate-600 bg-slate-50">
                {application.isVerified ? "Location Verified" : "Pending Verification"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              {!vendor.address && !application.business?.category ? (
                <div className="p-6 text-center text-xs sm:text-sm text-slate-500">
                  No logistics information is currently available for this application.
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Declared Vending Location
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {vendor.address || "Not specified"}{vendor.barangay ? `, ${vendor.barangay}` : ""}
                      </p>
                      <span className="inline-block text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mt-1">
                        Submitted by Vendor
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Vending Category & Activity
                      </span>
                      <p className="text-sm font-bold text-slate-900">
                        {application.business?.category || "General Vending"}
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
                        {application.isVerified
                          ? "Verified by City Administrator"
                          : "Not yet verified by City Administrator"}
                      </p>
                      <span
                        className={cn(
                          "inline-block text-[11px] font-medium px-2 py-0.5 rounded mt-1",
                          application.isVerified
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                            : "text-amber-800 bg-amber-50 border border-amber-200/60"
                        )}
                      >
                        {application.isVerified ? "Verified" : "Pending Field Inspection"}
                      </span>
                    </div>
                  </div>

                  {application.adminRemarks && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950 space-y-1">
                      <span className="font-bold block">Logistics & Compliance Notes</span>
                      <p className="text-blue-900 text-xs">{application.adminRemarks}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* E. Document Status Summary Card (Section 7) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Files className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Document Status
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                1 Document Slot
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-lg font-extrabold text-slate-900 block">
                    {docStats.total}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Attached</span>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    docStats.underReview > 0
                      ? "bg-amber-50/80 border-amber-200 text-amber-900"
                      : "bg-slate-50 border-slate-200/70 text-slate-400"
                  )}
                >
                  <span className="text-lg font-extrabold block">
                    {docStats.underReview}
                  </span>
                  <span className="text-[10px] font-bold uppercase">In Review</span>
                </div>

                <div
                  className={cn(
                    "p-2.5 rounded-xl border",
                    docStats.needsReplacement > 0
                      ? "bg-orange-50 border-orange-300 text-orange-900"
                      : docStats.accepted > 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-slate-50 border-slate-200/70 text-slate-400"
                  )}
                >
                  <span className="text-lg font-extrabold block">
                    {docStats.needsReplacement > 0
                      ? docStats.needsReplacement
                      : docStats.accepted}
                  </span>
                  <span className="text-[10px] font-bold uppercase">
                    {docStats.needsReplacement > 0 ? "Replace" : "Accepted"}
                  </span>
                </div>
              </div>

              {/* Document Item Row */}
              <div
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between text-xs",
                  isNeedsCorrection
                    ? "bg-orange-50/60 border-orange-300 text-orange-950"
                    : "bg-slate-50 border-slate-200/80 text-slate-900"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-bold text-[10px]",
                      isNeedsCorrection ? "bg-orange-200 text-orange-800" : "bg-blue-100 text-blue-700"
                    )}
                  >
                    PDF
                  </div>
                  <div className="min-w-0">
                    <span className="font-semibold block truncate">government-id.pdf</span>
                    <span className="text-[11px] text-slate-500 block">PhilSys National ID</span>
                  </div>
                </div>

                <Badge
                  className={cn(
                    "text-[10px] shrink-0 font-semibold",
                    isApproved
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : isNeedsCorrection
                      ? "bg-orange-100 text-orange-950 border-orange-300"
                      : "bg-blue-100 text-blue-900 border-blue-300"
                  )}
                >
                  {isApproved ? "Accepted" : isNeedsCorrection ? "Needs Replacement" : "Submitted"}
                </Badge>
              </div>

              <div className="pt-1">
                <Link
                  href="/dashboard/documents"
                  className={cn(
                    buttonVariants({
                      variant: isNeedsCorrection ? "default" : "outline",
                      size: "sm",
                    }),
                    "w-full text-xs font-semibold justify-center cursor-pointer gap-1.5",
                    isNeedsCorrection ? "bg-orange-600 hover:bg-orange-700 text-white" : ""
                  )}
                >
                  <Files className="w-3.5 h-3.5" />
                  <span>Review Documents Portal</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* F. Recent Activity Timeline (Section 9) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Recent Activity
                </CardTitle>
              </div>
              <span className="text-xs text-slate-400">Audit trail</span>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-4">
                {isNeedsCorrection && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 shrink-0 ring-4 ring-orange-100" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-orange-950">
                            Correction Requested
                          </h4>
                          <span className="text-[10px] text-slate-400">Oct 6 • 2:45 PM</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          Administrator requested updates to address format and government ID scan.
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                  </>
                )}

                {isCorrectionSubmitted && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-100" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-blue-950">
                            Corrections Submitted
                          </h4>
                          <span className="text-[10px] text-blue-700 font-semibold">Just now</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          Vendor resubmitted complete street address and replacement PhilSys scan.
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                  </>
                )}

                {isApproved && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 mt-1.5 shrink-0 ring-4 ring-emerald-100" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-emerald-950">
                            Vendor Certificate Issued
                          </h4>
                          <span className="text-[10px] text-slate-400">Oct 6</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          Application approved. Official Vendor ID {vendor.vendorId || "assigned"} generated.
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                  </>
                )}

                {!isDraft && (
                  <>
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-900">
                            Application Submitted
                          </h4>
                          <span className="text-[10px] text-slate-400">Oct 6 • 9:30 AM</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">
                          Vendor registration {vendor.applicationNumber || "application"} received by licensing office.
                        </p>
                      </div>
                    </div>
                    <Separator className="bg-slate-100" />
                  </>
                )}

                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        Registration Draft Initialized
                      </h4>
                      <span className="text-[10px] text-slate-400">Oct 6 • 9:15 AM</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug">
                      Portal session started and draft account verified.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* G. Notifications Preview Widget (Section 10) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Recent Notifications
                </CardTitle>
              </div>
              <Badge className="bg-blue-600 text-white text-[10px] font-bold">
                {isNeedsCorrection ? "2 Unread" : "1 Unread"}
              </Badge>
            </CardHeader>

            <CardContent className="p-4 space-y-2.5">
              {/* Notification Item 1 */}
              <div
                className={cn(
                  "p-3 rounded-xl border text-xs space-y-1 transition-all",
                  isNeedsCorrection
                    ? "bg-orange-50/70 border-orange-200 text-orange-950"
                    : "bg-blue-50/50 border-blue-100 text-slate-800"
                )}
              >
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        isNeedsCorrection ? "bg-orange-600 animate-pulse" : "bg-blue-600"
                      )}
                    />
                    <span className={isNeedsCorrection ? "text-orange-950" : "text-blue-950"}>
                      {isNeedsCorrection
                        ? "Correction Notice"
                        : isApproved
                        ? "Approval Confirmation"
                        : "Application Under Review"}
                    </span>
                  </div>
                  <span className="text-slate-400 font-normal">Just now</span>
                </div>
                <p className="text-xs text-slate-700 leading-snug">
                  {isNeedsCorrection
                    ? "Administrator requested corrections to your address and government ID."
                    : isApproved
                    ? "Your vendor registration has been approved. Certificate issued."
                    : "Your application is currently being evaluated by the licensing team."}
                </p>
              </div>

              {/* Notification Item 2 */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Application Submitted</span>
                  </div>
                  <span className="text-slate-400 font-normal">Today • 9:30 AM</span>
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  Registration {vendor.applicationNumber || "application"} was recorded in the municipal registry.
                </p>
              </div>

              {/* Direct Link to Notifications Center */}
              <div className="pt-1.5 border-t border-slate-100">
                <Link
                  href="/dashboard/notifications"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer justify-center"
                  )}
                >
                  <span>View All Notifications</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* H. Quick Support Note */}
          <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/70 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Need Help with Your Registration?</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Visit City Hall Complex, J.P. Rosales Ave., or contact the licensing helpdesk at{" "}
              <strong className="text-slate-800">(085) 341-2000</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
