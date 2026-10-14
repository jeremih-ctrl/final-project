"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoredApplications } from "@/lib/application-store";

export default function AdminDashboardPage() {
  const storedApplications = useStoredApplications();

  // Dynamic municipal counts derived strictly from available real applications
  const totalCount = storedApplications.length;
  const approvedCount = storedApplications.filter(
    (a) => a.status.toLowerCase() === "approved" || a.verificationStatus === "Verified"
  ).length;
  const underReviewCount = storedApplications.filter(
    (a) =>
      a.status.toLowerCase() === "under_review" ||
      a.status.toLowerCase() === "under review" ||
      a.status.toLowerCase() === "correction_submitted" ||
      a.status.toLowerCase() === "correction submitted"
  ).length;
  const needsCorrectionCount = storedApplications.filter(
    (a) =>
      a.status.toLowerCase() === "needs_correction" ||
      a.status.toLowerCase() === "needs correction"
  ).length;
  const submittedCount = storedApplications.filter(
    (a) =>
      a.status.toLowerCase() === "submitted" ||
      a.status.toLowerCase() === "draft"
  ).length;
  const rejectedCount = storedApplications.filter(
    (a) => a.status.toLowerCase() === "rejected"
  ).length;
  const pendingCount = underReviewCount + submittedCount;

  // Dynamic distribution percentages
  const approvedPct = totalCount > 0 ? ((approvedCount / totalCount) * 100).toFixed(1) : "0.0";
  const underReviewPct = totalCount > 0 ? ((underReviewCount / totalCount) * 100).toFixed(1) : "0.0";
  const needsCorrectionPct = totalCount > 0 ? ((needsCorrectionCount / totalCount) * 100).toFixed(1) : "0.0";
  const submittedPct = totalCount > 0 ? ((submittedCount / totalCount) * 100).toFixed(1) : "0.0";
  const rejectedPct = totalCount > 0 ? ((rejectedCount / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto w-full">
      {/* 1. Page Welcome / Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Admin Dashboard
            </h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Live Registry
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            City Government of Butuan • Overview of Butuan City vendor registrations, compliance, and pending approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer gap-1.5 shadow-2xs h-9 px-4 rounded-xl"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Process Applications</span>
          </Link>
        </div>
      </div>

      {/* 2. Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Applications */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100/80">
              <Store className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {totalCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered submissions
            </p>
          </div>
        </Card>

        {/* Pending Applications */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {pendingCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Awaiting review
            </p>
          </div>
        </Card>

        {/* Approved Vendors */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Vendors
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {approvedCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Certified active
            </p>
          </div>
        </Card>

        {/* Needs Correction */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Needs Correction
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100/80">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
              {needsCorrectionCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Require vendor action
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Application Status Overview */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-3 sm:pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
              Application Status Overview
            </CardTitle>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Current lifecycle distribution across all {totalCount} municipal applications.
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50 border-slate-200 font-semibold px-2.5 py-1">
            Total: {totalCount}
          </Badge>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-6">
          {/* Horizontal multi-color visual bar */}
          <div className="h-3.5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-2xs">
            {totalCount === 0 ? (
              <div className="bg-slate-200 h-full w-full" title="No applications submitted yet" />
            ) : (
              <>
                <div
                  className="bg-emerald-500 h-full transition-all"
                  style={{ width: `${approvedPct}%` }}
                  title={`Approved: ${approvedCount} (${approvedPct}%)`}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{ width: `${underReviewPct}%` }}
                  title={`Under Review: ${underReviewCount} (${underReviewPct}%)`}
                />
                <div
                  className="bg-rose-500 h-full transition-all"
                  style={{ width: `${needsCorrectionPct}%` }}
                  title={`Needs Correction: ${needsCorrectionCount} (${needsCorrectionPct}%)`}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${submittedPct}%` }}
                  title={`Submitted: ${submittedCount} (${submittedPct}%)`}
                />
                <div
                  className="bg-slate-400 h-full transition-all"
                  style={{ width: `${rejectedPct}%` }}
                  title={`Rejected: ${rejectedCount} (${rejectedPct}%)`}
                />
              </>
            )}
          </div>

          {/* 5 Status metric cards in responsive 5-column grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 text-xs">
            {/* 1. Submitted */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1.5 transition-colors">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Submitted</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-950 tracking-tight">{submittedCount}</div>
              <span className="text-[11px] text-blue-700 block font-medium">{submittedPct}% of total</span>
            </div>

            {/* 2. Under Review */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5 transition-colors">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Under Review</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-950 tracking-tight">{underReviewCount}</div>
              <span className="text-[11px] text-amber-700 block font-medium">{underReviewPct}% of total</span>
            </div>

            {/* 3. Needs Correction */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1.5 transition-colors">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Needs Correction</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-950 tracking-tight">{needsCorrectionCount}</div>
              <span className="text-[11px] text-rose-700 block font-medium">{needsCorrectionPct}% of total</span>
            </div>

            {/* 4. Approved */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1.5 transition-colors">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Approved</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 tracking-tight">{approvedCount}</div>
              <span className="text-[11px] text-emerald-700 block font-medium">{approvedPct}% of total</span>
            </div>

            {/* 5. Rejected */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-100/90 border border-slate-200/80 space-y-1.5 transition-colors">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Rejected</span>
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{rejectedCount}</div>
              <span className="text-[11px] text-slate-500 block font-medium">{rejectedPct}% of total</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
