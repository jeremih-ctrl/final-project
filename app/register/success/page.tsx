"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getApplications } from "@/lib/application-store";

function getClientAppNumber(): string {
  if (typeof window === "undefined") return "BVR-2026-001248";
  const params = new URLSearchParams(window.location.search);
  const queryAppNum = params.get("appNumber");
  if (queryAppNum) return queryAppNum;
  const stored = getApplications();
  if (stored.length > 0) {
    return stored[stored.length - 1].applicationNumber;
  }
  return "BVR-2026-001248";
}

export default function RegisterSuccessPage() {
  const [copied, setCopied] = useState(false);
  const applicationNumber = useSyncExternalStore(
    () => () => {},
    getClientAppNumber,
    () => "BVR-2026-001248"
  );

  const handleCopy = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(applicationNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
                Registration Confirmation
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
                  Submission Received
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Registration Submitted Successfully
                </h1>
                <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
                  Your vendor registration has been successfully submitted and is now awaiting review.
                </p>
              </div>

              {/* Application Number Box with Copy Action */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Application Number
                  </span>
                  <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Submitted
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <span className="font-mono text-lg sm:text-xl font-bold tracking-wider text-slate-900">
                    {applicationNumber}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    aria-label="Copy application number"
                  >
                    {copied ? (
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

                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Please keep your application number for future reference.</span>
                </p>
              </div>

              {/* Next Steps / Reassurance */}
              <div className="rounded-xl bg-blue-50/50 border border-blue-200/70 p-4 text-left space-y-2 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  What happens next?
                </span>
                <ul className="space-y-1.5 list-disc list-inside text-slate-600">
                  <li>City administrators review your vendor credentials within 2–3 business days.</li>
                  <li>Updates will be communicated via your registered mobile number and email.</li>
                  <li>You can track real-time application progress online anytime.</li>
                </ul>
              </div>

              {/* Primary & Secondary Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/application-status"
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
                  href="/"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto font-medium justify-center border-slate-300 text-slate-700 hover:bg-slate-100 py-3 cursor-pointer"
                  )}
                >
                  Return to Home
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
