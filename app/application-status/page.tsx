"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Store,
  ArrowLeft,
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";

type StatusState =
  | "draft"
  | "submitted"
  | "under-review"
  | "needs-correction"
  | "correction-submitted"
  | "approved"
  | "rejected";

export default function ApplicationStatusPage() {
  const { application, status, updateStatus } = useSharedApplication();
  const currentStatus = status as StatusState;
  const [copied, setCopied] = useState(false);
  const [hasGovId, setHasGovId] = useState(true);

  const applicationNumber = application.id || application.applicationNumber || "BVR-2026-001248";
  const vendorId = application.vendorId || "BUT-V-001248";

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(applicationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Status configuration mappings
  const statusConfig = {
    draft: {
      badgeText: "Draft",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      dotColor: "bg-slate-400",
      title: "Draft Application",
      description: "Your vendor registration draft is saved. Review details and submit when ready.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-800",
      icon: FileText,
      timelineIndex: 0,
    },
    submitted: {
      badgeText: "Registration Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500",
      title: "Registration Submitted",
      description: "Your application has been received.",
      bannerStyle: "bg-blue-50/70 border-blue-200/80 text-blue-950",
      icon: Clock,
      timelineIndex: 1, // Step 1 Active
    },
    "under-review": {
      badgeText: "Under Review",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      dotColor: "bg-amber-500 animate-ping",
      title: "Application Under Review",
      description: "Our administrator is currently reviewing your registration.",
      bannerStyle: "bg-amber-50/70 border-amber-200/80 text-amber-950",
      icon: Clock,
      timelineIndex: 2, // Step 2 Active
    },
    "needs-correction": {
      badgeText: "Action Required",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      dotColor: "bg-orange-500",
      title: "Action Required",
      description: "An administrator has requested corrections to your application.",
      remarks:
        application.adminRemarks ||
        "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
      correctionDate: application.lastUpdatedText || "October 6, 2026 • 2:45 PM",
      bannerStyle: "bg-orange-50/80 border-orange-300 text-orange-950",
      icon: AlertTriangle,
      timelineIndex: 2,
    },
    "correction-submitted": {
      badgeText: "Correction Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500 animate-pulse",
      title: "Correction Submitted — Under Review",
      description:
        "Your corrections have been submitted successfully. Your application is now under review by the administrator.",
      bannerStyle: "bg-blue-50/80 border-blue-300 text-blue-950",
      icon: Clock,
      timelineIndex: 2,
    },
    approved: {
      badgeText: "Approved",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      dotColor: "bg-emerald-500",
      title: "Registration Approved",
      description: "Your vendor registration has been approved.",
      vendorId: vendorId,
      bannerStyle: "bg-emerald-50/80 border-emerald-200/90 text-emerald-950",
      icon: CheckCircle2,
      timelineIndex: 4, // All complete
    },
    rejected: {
      badgeText: "Not Approved",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      dotColor: "bg-rose-500",
      title: "Application Rejected",
      description: "Your application was not approved.",
      remarks:
        application.adminRemarks ||
        "The business location indicated is outside the territorial jurisdiction of Butuan City or failed initial compliance verification.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-900",
      icon: XCircle,
      timelineIndex: 0, // Incomplete/closed
    },
  };

  const current = statusConfig[currentStatus];
  const IconComponent = current.icon;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900">
      {/* Top Civic Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">City Government of Butuan</span>
            <span className="text-slate-400 hidden sm:inline">
              • Official Vendor Registration Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="hidden sm:inline">Agusan del Norte, Philippines</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-none block">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Application Status & Tracking
              </span>
            </div>
          </Link>

          {/* 8. Navigation */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Mock Status Switcher (Interactive Preview Control for Testing 5 States) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100 mb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Status State Preview Mode:
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Click any status below to preview the corresponding UI treatment:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {([
                { status: "draft" as StatusState, label: "Draft", active: "bg-slate-600 text-white" },
                { status: "submitted" as StatusState, label: "Submitted", active: "bg-blue-600 text-white" },
                { status: "under-review" as StatusState, label: "Under Review", active: "bg-amber-600 text-white" },
                { status: "needs-correction" as StatusState, label: "● Needs Correction", active: "bg-orange-600 text-white" },
                { status: "correction-submitted" as StatusState, label: "Correction Submitted", active: "bg-blue-700 text-white" },
                { status: "approved" as StatusState, label: "Approved", active: "bg-emerald-600 text-white" },
                { status: "rejected" as StatusState, label: "Not Approved", active: "bg-slate-800 text-white" },
              ] as const).map(({ status, label, active }) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(status)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                    currentStatus === status
                      ? cn(active, "shadow-xs")
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Top Application Header Card with Copy Button */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Application Number
                </span>
                <Badge className={cn("text-xs font-semibold border", current.badgeColor)}>
                  {current.badgeText}
                </Badge>
              </div>

              {/* 7. Application Number & Copy Button */}
              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-wider">
                  {applicationNumber}
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Copy application number to clipboard"
                  aria-label="Copy application number"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {copied && (
                  <span className="text-xs text-emerald-700 font-medium animate-in fade-in">
                    Application number copied.
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right space-y-0.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="text-xs text-slate-500 block">Registered Business</span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">Juan&apos;s Food Stall</h3>
              <p className="text-xs text-slate-600">Owner: Juan Dela Cruz</p>
            </div>
          </div>

          {/* 5. Current Status Banner */}
          <div
            className={cn(
              "rounded-2xl border p-5 sm:p-6 shadow-xs transition-all space-y-3",
              current.bannerStyle
            )}
          >
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/90 border border-current/20 flex items-center justify-center shrink-0 shadow-2xs">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      Current Status
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

              {/* Mock Vendor ID when Approved */}
              {currentStatus === "approved" && (
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                    Official Vendor ID
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-emerald-950 bg-white/90 px-3 py-1 rounded-lg border border-emerald-300 inline-block shadow-2xs">
                    {vendorId}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base font-normal leading-relaxed opacity-90">
              {current.description}
            </p>

            {/* Administrator Remarks if present (for Needs Correction or Rejected) */}
            {"remarks" in current && (
              <div className="bg-white/85 rounded-xl border border-current/20 p-3.5 space-y-1 text-xs sm:text-sm">
                <span className="font-bold block uppercase tracking-wider text-[11px]">
                  Administrator Remarks:
                </span>
                <p className="italic text-slate-800 font-medium">
                  &ldquo;{current.remarks}&rdquo;
                </p>
              </div>
            )}

            {/* Correction Notice Card for Needs Correction */}
            {currentStatus === "needs-correction" && (
              <div className="space-y-3 pt-1">
                {/* Correction fields list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: "Street / Business Address", reason: "Provide the complete street address." },
                    { label: "Government ID", reason: "Upload a clearer, readable copy." },
                  ].map((cf) => (
                    <div
                      key={cf.label}
                      className="flex items-start gap-2.5 p-3 rounded-lg bg-white/70 border border-orange-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-orange-900">{cf.label}</p>
                        <p className="text-[11px] text-orange-800 font-medium mt-0.5">{cf.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {"correctionDate" in current && (
                  <p className="text-[11px] text-orange-700 font-medium">
                    Correction requested on:{" "}
                    <strong>
                      {(current as { correctionDate?: string }).correctionDate}
                    </strong>
                  </p>
                )}

                <Link
                  href="/dashboard/my-application/correction"
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs cursor-pointer gap-2"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Review &amp; Correct Application
                </Link>
              </div>
            )}

            {/* Correction Submitted message */}
            {currentStatus === "correction-submitted" && (
              <div className="pt-1 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Your corrections are under review. No further action is required.
              </div>
            )}
          </div>

          {/* 3. Status Timeline Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-2 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Application Progress
                  </span>
                  <CardTitle className="text-lg sm:text-xl font-bold text-slate-900">
                    Status Timeline
                  </CardTitle>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Updated: Today, 4:21 PM
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-8">
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Timeline Step 1: Registration Submitted */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      current.timelineIndex >= 1
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        Registration Submitted
                      </h4>
                      <span className="text-xs font-medium text-slate-500">
                        October 6, 2026 • 09:30 AM
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Application form received through the online vendor registration portal.
                    </p>
                  </div>
                </div>

                {/* Timeline Step 2: Application Under Review */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      current.timelineIndex > 2
                        ? "bg-emerald-600 text-white"
                        : current.timelineIndex === 2
                        ? currentStatus === "needs-correction"
                          ? "bg-orange-600 text-white"
                          : "bg-amber-500 text-white ring-amber-100 ring-4"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {current.timelineIndex > 2 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px]">2</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          current.timelineIndex === 2
                            ? "text-blue-900"
                            : current.timelineIndex > 2
                            ? "text-slate-900"
                            : "text-slate-400"
                        )}
                      >
                        Application Under Review
                      </h4>
                      {current.timelineIndex === 2 && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {currentStatus === "needs-correction" ? "Action Required" : "In Progress"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      {currentStatus === "under-review"
                        ? "Currently being reviewed by city LGU administrators for compliance."
                        : currentStatus === "needs-correction"
                        ? "Review paused. Please see administrator remarks above."
                        : current.timelineIndex > 2
                        ? "Administrative review completed successfully."
                        : "Pending initial review queue."}
                    </p>
                  </div>
                </div>

                {/* Timeline Step 3: Verification */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      current.timelineIndex >= 4
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {current.timelineIndex >= 4 ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px]">3</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          current.timelineIndex >= 4 ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        Verification
                      </h4>
                      {current.timelineIndex >= 4 && (
                        <span className="text-xs font-medium text-emerald-700">Verified</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {current.timelineIndex >= 4
                        ? "Barangay jurisdiction, identity, and stall information verified."
                        : "Verification of operating address in Butuan City."}
                    </p>
                  </div>
                </div>

                {/* Timeline Step 4: Approved */}
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
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[11px]">4</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          currentStatus === "approved" ? "text-emerald-900" : "text-slate-400"
                        )}
                      >
                        Approved
                      </h4>
                      {currentStatus === "approved" && (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Registration Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {currentStatus === "approved"
                        ? "Official Butuan Vendor ID issued. Business authorized to operate."
                        : "Digital vendor certificate and registration issuance."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Activity Timeline (Task 9 Requirement 9) */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Activity Timeline
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Activity log for application #{applicationNumber} — newest activity first
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                {currentStatus === "needs-correction"
                  ? "Correction Requested"
                  : currentStatus === "correction-submitted"
                  ? "Correction Submitted"
                  : "Activity Log"}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {currentStatus === "needs-correction" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 shrink-0 ring-4 ring-orange-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-orange-950">1. Correction Requested</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 2:45 PM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Administrator requested corrections to business address and government ID.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">2. Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">3. Application Created</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:15 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Initial application registration draft created.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentStatus === "correction-submitted" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-blue-950">1. Correction Submitted</p>
                        <span className="text-[11px] text-blue-700 font-semibold">Today • Just now</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor submitted application corrections. Status changed back to Under Review.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">2. Correction Requested</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 2:45 PM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Administrator requested corrections to business address and government ID.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">3. Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">4. Application Created</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:15 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Initial application registration draft created.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentStatus === "under-review" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0 ring-4 ring-amber-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-amber-950">Application Under Review</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 11:00 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Application is actively being reviewed by the LGU licensing administrator.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Created</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:15 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Initial application registration draft created.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentStatus === "submitted" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0 ring-4 ring-blue-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-blue-950">Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Created</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:15 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Initial application registration draft created.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentStatus === "draft" && (
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1.5 shrink-0 ring-4 ring-slate-100" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <p className="text-xs font-bold text-slate-900">Application Draft Created</p>
                      <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:15 AM</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Application draft saved. Ready to be submitted.
                    </p>
                  </div>
                </div>
              )}

              {currentStatus === "approved" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 ring-4 ring-emerald-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-emerald-950">Registration Approved</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 4:00 PM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration approved. Official vendor ID issued.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Under Review</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 11:00 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Application was reviewed and approved.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {currentStatus === "rejected" && (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1.5 shrink-0 ring-4 ring-rose-100" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-rose-950">Application Not Approved</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 3:30 PM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Application could not be approved due to compliance criteria.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Under Review</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 11:00 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Application review completed.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">Application Submitted</p>
                        <span className="text-[11px] text-slate-400">Oct 6, 2026 • 9:30 AM</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Vendor registration application was successfully submitted.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>


          {/* 6. Application Information Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Application Information
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Filed under Butuan City LGU
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Information Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Business Name:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      Juan&apos;s Food Stall
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Owner Name:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      Juan Dela Cruz
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <span className="text-slate-700 text-right font-medium">
                      Food & Beverage / Market Stall
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      juan@email.com
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Contact Number:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      09XXXXXXXXX
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Alerts:</span>
                    <span className="text-emerald-700 font-semibold text-right">
                      SMS Enabled
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Business Address Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Business Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">House/Bldg No.:</span>
                    <span className="col-span-2 text-slate-800 font-medium">123</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Street:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      J.C. Aquino Avenue
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Barangay:</span>
                    <span className="col-span-2 text-slate-800 font-medium">Baan KM 3</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">City:</span>
                    <span className="col-span-2 text-slate-800 font-medium">Butuan City</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Province:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      Agusan del Norte
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Region:</span>
                    <span className="col-span-2 text-slate-800 font-medium">Caraga</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Country:</span>
                    <span className="col-span-2 text-slate-800 font-medium">Philippines</span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification & Jurisdiction Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Verification & Security
                      </CardTitle>
                    </div>

                    <button
                      type="button"
                      onClick={() => setHasGovId(!hasGovId)}
                      className="text-[11px] text-blue-700 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Toggle ID UI
                    </button>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 font-medium">Government ID:</span>
                      <div>
                        {hasGovId ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                            Provided
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-300">
                            Not Provided — Optional
                          </Badge>
                        )}
                      </div>
                    </div>

                    {hasGovId && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <span>PhilSys National ID</span>
                        <span className="text-slate-400 block text-[11px]">
                          Attached for administrator validation
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      <p>
                        <strong className="text-slate-700 font-semibold">Security Note:</strong> Account passwords are encrypted and never shown.
                      </p>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-blue-50/50 border-t border-blue-100 text-xs text-blue-900 rounded-b-xl">
                  <span>Questions regarding your registration status? Contact Butuan City Hall at (085) 341-2000.</span>
                </div>
              </Card>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto font-medium border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back to Home
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="w-full sm:w-auto text-xs font-semibold cursor-pointer gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Application Number
              </Button>

              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full sm:w-auto font-semibold cursor-pointer gap-1.5"
                )}
              >
                New Application
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>Butuan Vendors Registration System • Local Vendor Registration • Butuan City, Philippines</p>
      </footer>
    </div>
  );
}
