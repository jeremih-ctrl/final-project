"use client";

import { useState, useSyncExternalStore, useMemo } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Home,
  Store,
  Clock,
  ShieldCheck,
  FileText,
  Receipt,
  LayoutDashboard,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApplications, getApplication } from "@/lib/application-store";
import { formatPhpCurrency, getPaymentStatusBadgeConfig } from "@/lib/payment-fee-schedule";

function getClientAppNumber(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const queryAppNum = params.get("appNumber");
  if (queryAppNum) return queryAppNum;
  const current = localStorage.getItem("bvr_current_vendor_app_number");
  if (current) return current;
  const stored = getApplications();
  if (stored.length > 0) {
    return stored[0].applicationNumber || stored[0].id;
  }
  return "";
}

export default function RegisterSuccessPage() {
  const [copiedApp, setCopiedApp] = useState(false);
  const [copiedPayRef, setCopiedPayRef] = useState(false);

  const applicationNumber = useSyncExternalStore(
    () => () => {},
    getClientAppNumber,
    () => ""
  );

  const appRecord = useMemo(() => {
    if (!applicationNumber) return null;
    return getApplication(applicationNumber);
  }, [applicationNumber]);

  const payRef =
    appRecord?.payment?.transactionReference ||
    (applicationNumber ? `PAY-${applicationNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}` : "PAY-BVR-PENDING");

  const paymentStatus = appRecord?.payment?.status || "unpaid";
  const badgeConfig = getPaymentStatusBadgeConfig(paymentStatus);

  const handleCopyApp = () => {
    if (navigator?.clipboard && applicationNumber) {
      navigator.clipboard.writeText(applicationNumber);
      setCopiedApp(true);
      setTimeout(() => setCopiedApp(false), 2500);
    }
  };

  const handleCopyPayRef = () => {
    if (navigator?.clipboard && payRef) {
      navigator.clipboard.writeText(payRef);
      setCopiedPayRef(true);
      setTimeout(() => setCopiedPayRef(false), 2500);
    }
  };

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
                Registration & Assessment Slip Confirmation
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Success Container */}
      <main className="flex-1 flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <Card className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-950/5 text-center p-6 sm:p-10">
            <CardContent className="p-0 space-y-6">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs animate-in zoom-in-95 duration-300">
                <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
                  Registration & Assessment Received
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Registration Submitted Successfully
                </h1>
                <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your vendor registration application has been received and queued for review. Your official fee assessment reference has been generated below.
                </p>
              </div>

              {/* Application & Assessment Reference Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-4">
                {/* Application Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Application Number
                    </span>
                    <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Under Review
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-slate-900">
                      {applicationNumber || "BVR-2026-PENDING"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyApp}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      aria-label="Copy application number"
                    >
                      {copiedApp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Assessment Reference */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-blue-700" />
                      Payment Assessment Reference
                    </span>
                    <Badge variant="outline" className={cn("text-[11px]", badgeConfig.badgeClass)}>
                      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", badgeConfig.dotColor)} />
                      {badgeConfig.label}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                    <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-blue-700">
                      {payRef}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPayRef}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                      aria-label="Copy assessment reference"
                    >
                      {copiedPayRef ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Assessment Breakdown Summary */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Business Activity:</span>
                    <span className="font-semibold text-slate-900">{appRecord?.business?.category || "Registered Vendor"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Selected Payment Channel:</span>
                    <span className="font-semibold text-slate-900">{appRecord?.payment?.paymentMethod || "Maya / CTO Cashier"}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600 border-t border-slate-100 pt-2 font-medium">
                    <span className="font-bold text-slate-800">Total Assessed Fee:</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      {appRecord?.payment?.assessedAmount
                        ? formatPhpCurrency(appRecord.payment.assessedAmount)
                        : "₱1,450.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Amount Confirmed Paid:</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {formatPhpCurrency(appRecord?.payment?.amountPaid || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pending Payment Reassurance / Next Steps */}
              <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-4 text-left space-y-2 text-xs text-slate-700">
                <span className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Official Settlement Instructions:
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li>
                    <strong>Over-the-Counter Cashier:</strong> Present your Assessment Reference (<strong>{payRef}</strong>) at the City Treasurer&apos;s Office (CTO) Cashier at Butuan City Hall BOSS to settle fees and obtain your official receipt.
                  </li>
                  <li>
                    <strong>Online Maya Checkout:</strong> When the municipal Maya online portal opens for your application batch, your payment status will update automatically upon verification.
                  </li>
                  <li>
                    <strong>Avoid Duplicate Charges:</strong> If your payment is currently pending confirmation, please wait for verification rather than paying again immediately.
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href={applicationNumber ? `/application-status?appNumber=${applicationNumber}` : "/application-status"}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full sm:flex-1 font-semibold justify-center shadow-xs gap-2 py-3 cursor-pointer"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  View Application Status
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </Link>

                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto font-medium justify-center border-slate-300 text-slate-700 hover:bg-slate-100 py-3 cursor-pointer gap-2"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer Note */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>City Government of Butuan • Agusan del Norte, Philippines</p>
      </footer>
    </div>
  );
}
