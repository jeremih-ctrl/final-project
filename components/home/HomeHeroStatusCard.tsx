"use client";

import { useState, useEffect } from "react";
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
import { PublicOverviewStatistics } from "@/lib/public-analytics";

interface HomeHeroStatusCardProps {
  initialStats?: PublicOverviewStatistics | null;
}

export function HomeHeroStatusCard({ initialStats }: HomeHeroStatusCardProps) {
  const [stats, setStats] = useState<PublicOverviewStatistics | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialStats);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchOverview = async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setIsLoading(true);
      try {
        const res = await fetch("/api/public/overview", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.success && data?.stats) {
          if (isMounted) {
            setStats(data.stats);
            setHasError(false);
          }
        } else {
          throw new Error("Invalid payload format");
        }
      } catch (err) {
        console.warn("Public overview statistics fetch error:", err);
        if (isMounted) {
          setHasError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchOverview(!initialStats);

    // Refresh when application records change in this browser session
    const handleStoreUpdate = () => {
      fetchOverview(false);
    };

    window.addEventListener("bvr_applications_store_updated", handleStoreUpdate);
    window.addEventListener("storage", handleStoreUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("bvr_applications_store_updated", handleStoreUpdate);
      window.removeEventListener("storage", handleStoreUpdate);
    };
  }, [initialStats]);

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
                    {isLoading && !stats ? (
                      <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
                    ) : hasError && !stats ? (
                      <span className="text-slate-400 font-normal text-sm" title="Statistics temporarily unavailable">—</span>
                    ) : (
                      stats?.totalRegisteredVendors ?? 0
                    )}
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
                    {isLoading && !stats ? (
                      <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
                    ) : hasError && !stats ? (
                      <span className="text-slate-400 font-normal text-sm" title="Statistics temporarily unavailable">—</span>
                    ) : (
                      stats?.applicationsReceived ?? 0
                    )}
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
                    {isLoading && !stats ? (
                      <span className="inline-block w-8 h-5 bg-slate-200 animate-pulse rounded" />
                    ) : hasError && !stats ? (
                      <span className="text-slate-400 font-normal text-sm" title="Statistics temporarily unavailable">—</span>
                    ) : (
                      stats?.acceptedApplications ?? 0
                    )}
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
                    {isLoading && !stats ? (
                      <span className="inline-block w-12 h-5 bg-slate-200 animate-pulse rounded" />
                    ) : hasError && !stats ? (
                      <span className="text-slate-400 font-normal text-sm" title="Statistics temporarily unavailable">—</span>
                    ) : (
                      stats?.acceptanceRateFormatted ?? "0.0%"
                    )}
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
                    {isLoading && !stats ? (
                      <span className="inline-block w-14 h-4 bg-slate-200 animate-pulse rounded" />
                    ) : hasError && !stats ? (
                      <span className="text-slate-400 font-normal italic text-[11px]">
                        Unavailable
                      </span>
                    ) : stats?.averageApprovalTimeFormatted ? (
                      stats.averageApprovalTimeFormatted
                    ) : (
                      <span className="text-slate-500 font-normal italic text-[11px]">
                        Data unavailable
                      </span>
                    )}
                  </div>
                  {!isLoading && !hasError && !stats?.averageApprovalTimeFormatted && (
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
