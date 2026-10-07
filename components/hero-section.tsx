import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  CircleDot,
  Building2,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  FileCheck
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-blue-50/50 via-white to-slate-50/60 border-b border-slate-200/70">
      {/* Subtle Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(#1d4ed8 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Heading, Supporting text, CTAs */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
            {/* LGU Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-xs sm:text-sm font-medium">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Official City Government Portal • Butuan City</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-extrabold tracking-tight text-slate-900 leading-[1.12]">
              Register Your Business in{" "}
              <span className="text-blue-700 underline decoration-blue-300 decoration-wavy decoration-2 underline-offset-8">
                Butuan
              </span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
              An easy and convenient way for local vendors in Butuan City to register their business and manage their vendor application.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full sm:w-auto font-semibold px-6 py-6 text-base shadow-sm hover:shadow-md transition-all gap-2"
                )}
              >
                Register as a Vendor
                <ArrowRight className="w-5 h-5 ml-1" />
              </Link>

              <Link
                href="#how-it-works"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto font-medium px-6 py-6 text-base border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                )}
              >
                Learn How It Works
              </Link>
            </div>

            {/* Trust Points */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-6 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Online Application</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Official LGU Recognition</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Fast & Transparent Review</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Application Status Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md relative">
              {/* Decorative Subtle Shadow Backing */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600/15 to-indigo-600/15 rounded-2xl blur-lg opacity-70 transform rotate-1" />

              <Card className="relative bg-white border border-slate-200/90 shadow-md rounded-2xl overflow-hidden ring-1 ring-slate-950/5">
                {/* Top Status Card Header */}
                <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-blue-300" />
                    </div>
                    <div>
                      <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                        Application Status
                      </div>
                      <div className="font-mono font-bold text-sm tracking-wide text-white">
                        BVR-2026-001248
                      </div>
                    </div>
                  </div>

                  {/* Pulsing Status Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                    </span>
                    Under Review
                  </span>
                </div>

                {/* Card Content: Sample Vendor Information */}
                <CardContent className="p-5 space-y-4">
                  <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 block">
                          Registered Business
                        </span>
                        <h4 className="font-semibold text-slate-900 text-base">
                          Montilla Street Produce & Snacks
                        </h4>
                      </div>
                      <Badge variant="outline" className="text-[11px] bg-white text-slate-700 border-slate-300">
                        Food / Retail
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Maria Santos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Oct 6, 2026</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1.5 text-xs text-slate-600 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">Barangay Urduja, Butuan City</span>
                    </div>
                  </div>

                  {/* Visual Tracker Steps */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Application Progress
                    </span>

                    <div className="space-y-2">
                      {/* Step 1: Completed */}
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">1. Form Submitted</span>
                        </div>
                        <span className="text-[11px] text-emerald-700 font-semibold">Done</span>
                      </div>

                      {/* Step 2: Under Review */}
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-50/90 border border-amber-200 text-amber-950 font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>2. Administrative Review</span>
                        </div>
                        <span className="text-[11px] text-amber-700 font-bold">In Progress</span>
                      </div>

                      {/* Step 3: Pending */}
                      <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-slate-400">
                        <div className="flex items-center gap-2">
                          <CircleDot className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>3. Vendor Certificate Issuance</span>
                        </div>
                        <span className="text-[11px]">Pending</span>
                      </div>
                    </div>
                  </div>
                </CardContent>

                {/* Card Footer: Live Notification Mock */}
                <CardFooter className="bg-slate-50/80 border-t border-slate-200/70 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Real-time status tracking enabled
                  </span>
                  <Link
                    href="/application-status"
                    className="font-semibold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1"
                  >
                    <span>Track Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
