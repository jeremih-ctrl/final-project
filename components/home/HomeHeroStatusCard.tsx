"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  Clock,
  CircleDot,
  User,
  Calendar,
  MapPin,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CardContent, CardFooter } from "@/components/ui/card";
import { TiltedCard } from "@/components/reactbits/TiltedCard";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

export function HomeHeroStatusCard() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Ambient Radial Blue/Teal Civic Glows Behind the Card */}
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 via-sky-400/15 to-emerald-400/10 rounded-3xl blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#155EEF]/15 blur-3xl pointer-events-none" />

      {/* Floating Micro-Animation on the Entire Card */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <TiltedCard maxTilt={8} scale={1.015} className="w-full">
          <SpotlightCard
            spotlightColor="rgba(21, 94, 239, 0.16)"
            className="border-slate-200/90 shadow-xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl ring-1 ring-slate-950/5"
          >
            {/* Top Status Card Header - Civic Dark Header */}
            <div className="bg-[#0B1A30] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>Application Status</span>
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    <span className="text-blue-400">Live Preview</span>
                  </div>
                  <div className="font-mono font-bold text-sm tracking-wider text-white">
                    BVR-2026-001248
                  </div>
                </div>
              </div>

              {/* Pulsing Status Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                </span>
                Under Review
              </span>
            </div>

            {/* Card Body: Sample Registered Vendor Information */}
            <CardContent className="p-5 space-y-4">
              <div className="bg-slate-50/90 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5 transition-colors hover:bg-blue-50/30">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
                      Registered Business
                    </span>
                    <h4 className="font-bold text-[#0F1E36] text-base leading-snug">
                      Montilla Street Produce & Snacks
                    </h4>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[11px] bg-white text-blue-700 border-blue-200 font-semibold shrink-0"
                  >
                    Food / Retail
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">Maria Santos</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Oct 6, 2026</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#155EEF] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">Barangay Urduja, Butuan City</span>
                </div>
              </div>

              {/* Visual Tracker Steps with Micro-Animations */}
              <div className="space-y-2.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Application Progress
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">Stage 2 of 3</span>
                </div>

                <div className="space-y-2">
                  {/* Step 1: Completed */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-emerald-950 font-medium transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>1. Registration Form Submitted</span>
                    </div>
                    <span className="text-[11px] text-emerald-700 font-bold bg-white/80 px-2 py-0.5 rounded-full border border-emerald-200">
                      Done
                    </span>
                  </motion.div>

                  {/* Step 2: Under Review (Active) */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-amber-50/95 border border-amber-300 text-amber-950 font-medium shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                      <span className="font-semibold text-amber-950">
                        2. LGU Administrative Review
                      </span>
                    </div>
                    <span className="text-[11px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-300">
                      In Progress
                    </span>
                  </motion.div>

                  {/* Step 3: Pending */}
                  <motion.div
                    whileHover={{ x: 2 }}
                    className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/60 text-slate-400"
                  >
                    <div className="flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>3. Vendor Certificate Issuance</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Pending</span>
                  </motion.div>
                </div>
              </div>
            </CardContent>

            {/* Card Footer: Live Notification Mock with Action */}
            <CardFooter className="bg-slate-50/90 border-t border-slate-200/70 px-5 py-3.5 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="font-medium text-slate-700">Real-time tracking active</span>
              </span>
              <Link
                href="/application-status"
                className="font-bold text-[#155EEF] hover:text-[#1048b8] hover:underline flex items-center gap-1.5 group cursor-pointer"
              >
                <span>Track Status</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </CardFooter>
          </SpotlightCard>
        </TiltedCard>

        {/* Floating Mini Badge below the card */}
        <div className="mt-3.5 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-[#155EEF]" />
          <span>Official LGU Digital Verification Workflow</span>
        </div>
      </motion.div>
    </div>
  );
}
