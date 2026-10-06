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
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [copiedAppNumber, setCopiedAppNumber] = useState(false);

  // Mock Vendor Data
  const vendor = {
    businessName: "Juan's Food Stall",
    owner: "Juan Dela Cruz",
    applicationNumber: "BVR-2026-001248",
    vendorId: "Not yet assigned",
    applicationStatus: "Under Review",
    contactNumber: "09XXXXXXXXX",
    email: "juan@email.com",
    address: "Baan KM 3, Butuan City, Agusan del Norte",
    documentsCount: 1,
    submittedDate: "October 6, 2026",
  };

  const handleCopyAppNumber = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(vendor.applicationNumber);
      setCopiedAppNumber(true);
      setTimeout(() => setCopiedAppNumber(false), 2000);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 5. Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Welcome back, Juan!
            </h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Local Vendor
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Here&apos;s an overview of your vendor registration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/application-status"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Track Application
          </Link>
        </div>
      </div>

      {/* 7. Dashboard Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Application Status */}
        <Card className="border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Application Status
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Under Review
            </span>
          </div>
        </Card>

        {/* Card 2: Application Number */}
        <Card className="border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Application Number
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm sm:text-base font-bold text-slate-900">
              {vendor.applicationNumber}
            </span>
            <button
              type="button"
              onClick={handleCopyAppNumber}
              className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
              title="Copy application number"
              aria-label="Copy application number"
            >
              {copiedAppNumber ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </Card>

        {/* Card 3: Documents */}
        <Card className="border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Documents
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
              1
            </span>
            <Link
              href="/dashboard/documents"
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Submitted
            </Link>
          </div>
        </Card>

        {/* Card 4: Vendor Status */}
        <Card className="border border-slate-200 shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">
              Vendor Status
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xs sm:text-sm font-semibold text-slate-700">
              Pending Approval
            </span>
          </div>
        </Card>
      </div>

      {/* Main Grid: Status Card & Timeline (Left) / Business & Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* 6. Application Status Card */}
          <Card className="bg-white border-2 border-amber-300/80 rounded-2xl shadow-xs overflow-hidden">
            <div className="bg-amber-500/10 px-6 py-3 border-b border-amber-200/60 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 tracking-wider uppercase">
                Official Municipal Record
              </span>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
                ● UNDER REVIEW
              </Badge>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Application Details
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Vendor Registration
                </h3>
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs font-medium text-slate-500">
                    Application Number:
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-200">
                    {vendor.applicationNumber}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs sm:text-sm text-amber-950 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    Your application is currently being reviewed by the administrator.
                  </p>
                  <p className="text-amber-800/90 text-xs mt-0.5">
                    Our licensing team in the City Government of Butuan is verifying your submitted business registration details.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500">
                  <span>Submitted on </span>
                  <span className="font-medium text-slate-700">
                    {vendor.submittedDate}
                  </span>
                </div>

                <Link
                  href="/application-status"
                  className={cn(
                    buttonVariants({ variant: "default", size: "default" }),
                    "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm cursor-pointer gap-2"
                  )}
                >
                  <span>View Application</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 8. Registration Progress Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Registration Progress
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Current Status:{" "}
                  <span className="font-bold text-amber-700">Under Review</span>
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                Step 2 of 4
              </Badge>
            </CardHeader>

            <CardContent className="p-6">
              {/* Progress Steps Timeline */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
                {/* Step 1: Registration Submitted */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Registration Submitted
                    </p>
                    <span className="text-[11px] text-emerald-700 font-semibold block">
                      ✓ Completed
                    </span>
                  </div>
                </div>

                {/* Step 2: Application Review */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-amber-100 shadow-2xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      Application Review
                    </p>
                    <span className="text-[11px] text-amber-700 font-semibold block">
                      ● Current
                    </span>
                  </div>
                </div>

                {/* Step 3: Verification */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">
                      Verification
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      ○ Pending
                    </span>
                  </div>
                </div>

                {/* Step 4: Approved */}
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-2 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                    <span className="w-2 h-2 rounded-full bg-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-700 leading-tight">
                      Approved
                    </p>
                    <span className="text-[11px] text-slate-400 block">
                      ○ Pending
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 9. Business Information Card */}
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
                View Business Profile
              </Link>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">
                    Business Name:
                  </span>
                  <span className="font-bold text-slate-900 block text-sm sm:text-base">
                    {vendor.businessName}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">
                    Owner:
                  </span>
                  <span className="font-semibold text-slate-900 block">
                    {vendor.owner}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">
                    Contact:
                  </span>
                  <span className="font-semibold text-slate-900 block font-mono">
                    {vendor.contactNumber}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 font-medium block">
                    Email:
                  </span>
                  <span className="font-semibold text-slate-900 block">
                    {vendor.email}
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <span className="text-slate-500 font-medium block">
                    Business Address:
                  </span>
                  <span className="font-semibold text-slate-900 block">
                    {vendor.address}
                  </span>
                </div>
              </div>

              {/* 12. Empty / Future State: Vendor ID */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="text-xs space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">Vendor ID:</span>
                    <Badge variant="outline" className="text-[11px] font-normal text-slate-600 bg-white">
                      Not assigned yet
                    </Badge>
                  </div>
                  <p className="text-slate-500">
                    Your Vendor ID will be assigned after your application is approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recent Activity & Notifications */}
        <div className="space-y-6">
          {/* 10. Recent Activity */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold text-slate-900">
                Recent Activity
              </CardTitle>
              <Clock className="w-4 h-4 text-slate-400" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-4">
                {/* Activity 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        Application Under Review
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Oct 6, 2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Your application is currently being reviewed.
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Activity 2 */}
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-slate-900">
                        Application Submitted
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Oct 6, 2026
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Your vendor registration was successfully submitted.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 11. Notifications Preview Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Notifications
                </CardTitle>
              </div>
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            </CardHeader>
            <CardContent className="p-5 pt-2 space-y-3">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900">
                  <span>Status Update</span>
                  <span className="text-slate-400 font-normal">Today</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">
                  &ldquo;Your application is currently under review.&rdquo;
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Registration</span>
                  <span className="text-slate-400 font-normal">Oct 6</span>
                </div>
                <p className="text-xs text-slate-800 font-medium">
                  &ldquo;Your registration information has been received.&rdquo;
                </p>
              </div>

              <div className="pt-1">
                <Link
                  href="/dashboard/notifications"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer justify-center"
                  )}
                >
                  View All Notifications
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
