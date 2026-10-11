"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  FileText,
  CheckCircle2,
  Percent,
  Clock,
  ArrowRight,
  ShieldCheck,
  Info,
} from "lucide-react";
import { CardContent, CardFooter } from "@/components/ui/card";
import { TiltedCard } from "@/components/reactbits/TiltedCard";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import {
  useStoredApplications,
  useDeletedApplicationIds,
  isDemoOrMockApplication,
} from "@/lib/application-store";
import { VendorApplication } from "@/lib/types/vendor-application";

export function HomeHeroStatusCard() {
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();

  // Filter out mock/demo records, invalid entries, and deleted records
  const genuineApplications: VendorApplication[] = useMemo(() => {
    const hasDeleted = deletedApplicationIds.length > 0;
    const deletedSet = hasDeleted
      ? new Set(deletedApplicationIds.map((id) => id.trim().toLowerCase()))
      : null;
    const seen = new Set<string>();
    const list: VendorApplication[] = [];

    for (const app of storedApplications) {
      if (isDemoOrMockApplication(app)) continue;
      const normId = (app.applicationNumber || app.id || "").trim().toLowerCase();
      if (!normId || seen.has(normId) || (deletedSet && deletedSet.has(normId))) continue;
      seen.add(normId);
      list.push(app);
    }
    return list;
  }, [storedApplications, deletedApplicationIds]);

  // 1. Total Genuine Applications
  const totalApplicationsCount = genuineApplications.length;

  // 2. Total Unique Registered Vendors (grouped separately by vendor identity)
  const uniqueVendorsCount = useMemo(() => {
    const set = new Set<string>();
    genuineApplications.forEach((app) => {
      const key = (
        app.vendorId ||
        app.contact?.emailAddress ||
        app.owner?.ownerName ||
        app.id
      )
        .trim()
        .toLowerCase();
      if (key) set.add(key);
    });
    return set.size;
  }, [genuineApplications]);

  // 3. Accepted (Approved) Applications
  const acceptedApplicationsCount = useMemo(() => {
    return genuineApplications.filter(
      (app) =>
        app.status?.toLowerCase() === "approved" ||
        app.verificationStatus === "Verified"
    ).length;
  }, [genuineApplications]);

  // 4. Acceptance Rate
  const acceptanceRate =
    totalApplicationsCount > 0
      ? (acceptedApplicationsCount / totalApplicationsCount) * 100
      : null;

  // 5. Average Approval Time (calculated strictly with genuine timestamps)
  const avgApprovalTimeFormatted = useMemo(() => {
    const durationsMs: number[] = [];

    genuineApplications.forEach((app) => {
      const isApproved =
        app.status?.toLowerCase() === "approved" ||
        app.verificationStatus === "Verified";
      if (!isApproved) return;

      const subTime = app.submittedAt ? new Date(app.submittedAt).getTime() : NaN;
      if (isNaN(subTime)) return;

      let appTime = NaN;
      if (app.statusHistory && app.statusHistory.length > 0) {
        const historyItem = app.statusHistory.find(
          (h) =>
            (h.newStatus?.toLowerCase() === "approved" ||
              h.action?.toLowerCase().includes("approved")) &&
            h.timestamp
        );
        if (historyItem?.timestamp) {
          appTime = new Date(historyItem.timestamp).getTime();
        }
      }
      if (isNaN(appTime) && app.updatedAt) {
        appTime = new Date(app.updatedAt).getTime();
      }

      if (!isNaN(appTime) && appTime >= subTime) {
        durationsMs.push(appTime - subTime);
      }
    });

    if (durationsMs.length === 0) return null;
    const avgMs = durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length;

    if (avgMs < 60 * 1000) return "< 1 min";
    if (avgMs < 60 * 60 * 1000) return `${Math.max(1, Math.round(avgMs / (60 * 1000)))} mins`;
    if (avgMs < 24 * 60 * 60 * 1000) return `${(avgMs / (60 * 60 * 1000)).toFixed(1)} hrs`;
    return `${(avgMs / (24 * 60 * 60 * 1000)).toFixed(1)} days`;
  }, [genuineApplications]);

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto">
      {/* Ambient Radial Blue/Teal Civic Glows Behind the Card */}
      <div className="absolute -inset-3 bg-gradient-to-tr from-blue-600/15 via-sky-400/10 to-emerald-400/10 rounded-3xl blur-xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#155EEF]/10 blur-2xl pointer-events-none" />

      {/* Floating Micro-Animation on the Entire Card */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <TiltedCard maxTilt={5} scale={1.01} className="w-full">
          <SpotlightCard
            spotlightColor="rgba(21, 94, 239, 0.12)"
            className="border-slate-200/90 shadow-lg rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-slate-950/5 text-slate-800"
          >
            {/* Top Dashboard Header - Civic Navy Header */}
            <div className="bg-[#0B1A30] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 leading-tight">
                    BUTUAN LGU IMPACT
                  </div>
                  <div className="font-semibold text-xs sm:text-sm tracking-wide text-white leading-tight">
                    Vendor Registration Overview
                  </div>
                </div>
              </div>

              {/* Public Statistics indicator */}
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-400/25 shadow-2xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                Public Statistics
              </span>
            </div>

            {/* Card Body: Essential Aggregate Statistics */}
            <CardContent className="p-3.5 sm:p-4 space-y-3">
              {/* 1. Overall Statistics Grid (2x2) */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                {/* Total Registered Vendors */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center justify-between text-slate-500 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Vendors
                    </span>
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {uniqueVendorsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Total Registered Vendors
                  </div>
                </div>

                {/* Applications Received */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:bg-blue-50/30 transition-colors">
                  <div className="flex items-center justify-between text-slate-500 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Applications
                    </span>
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {totalApplicationsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Applications Received
                  </div>
                </div>

                {/* Accepted Applications */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:bg-emerald-50/30 transition-colors">
                  <div className="flex items-center justify-between text-slate-500 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Accepted
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {acceptedApplicationsCount}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Accepted Applications
                  </div>
                </div>

                {/* Acceptance Rate */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 hover:bg-sky-50/30 transition-colors">
                  <div className="flex items-center justify-between text-slate-500 mb-0.5">
                    <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                      Rate
                    </span>
                    <Percent className="w-3.5 h-3.5 text-sky-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {acceptanceRate !== null ? `${acceptanceRate.toFixed(1)}%` : "0.0%"}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium leading-tight">
                    Acceptance Rate
                  </div>
                </div>
              </div>

              {/* 2. Average Approval Time Banner */}
              <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-slate-50 to-amber-50/30 border border-slate-200/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700 leading-tight">
                      Average Approval Time
                    </div>
                    <div className="text-[9.5px] text-slate-500 leading-tight">
                      Elapsed from submission to decision
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900 text-xs">
                    {avgApprovalTimeFormatted !== null ? (
                      avgApprovalTimeFormatted
                    ) : (
                      <span className="text-slate-500 font-normal italic text-[11px]">
                        Data unavailable
                      </span>
                    )}
                  </div>
                  {avgApprovalTimeFormatted === null && (
                    <div className="text-[9.5px] text-slate-400 leading-tight">Not enough data</div>
                  )}
                </div>
              </div>

              {/* Data Scope Note */}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 px-0.5 pt-0.5">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>*Based on records available in this system.</span>
              </div>
            </CardContent>

            {/* Card Footer: Official Portal Link */}
            <CardFooter className="bg-slate-50/90 border-t border-slate-200/70 px-4 py-2.5 sm:px-5 sm:py-2.5 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-600 text-[11px]">
                Have a reference number?
              </span>
              <Link
                href="/application-status"
                className="font-bold text-[#155EEF] hover:text-[#1048b8] hover:underline flex items-center gap-1.5 group cursor-pointer text-xs"
              >
                <span>Track Status</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </SpotlightCard>
        </TiltedCard>

        {/* Floating Mini Badge below the card */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-[#155EEF]" />
          <span>Official Butuan City Public Market & Vendor Registry</span>
        </div>
      </motion.div>
    </div>
  );
}

// Alias export for clarity
export { HomeHeroStatusCard as LguImpactDashboard };
