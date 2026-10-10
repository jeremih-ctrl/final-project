"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { HomeBackground } from "./HomeBackground";
import { HeadingReveal } from "./HeadingReveal";
import { HomeFeatures } from "./HomeFeatures";
import { HomeHeroStatusCard } from "./HomeHeroStatusCard";
import { ShinyText } from "@/components/reactbits/ShinyText";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24 bg-white border-b border-slate-200/80">
      {/* ─── 1. React Bits / OGL Interactive Waves Civic Background ─── */}
      <HomeBackground />

      {/* ─── 2. Main Content Container ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 xl:gap-16 items-center">
          
          {/* ─── Left Side: Main Hero Content ─── */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6 sm:space-y-7 text-left">
            {/* Hero Civic Badge with React Bits ShinyText */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200 text-[#155EEF] text-xs sm:text-sm font-semibold shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-[#155EEF] shrink-0" />
              <span>
                <ShinyText
                  text="Official City Government Portal · Butuan City"
                  className="font-semibold text-[#155EEF]"
                  shimmerColor="rgba(255, 255, 255, 0.9)"
                  speed={4}
                />
              </span>
            </motion.div>

            {/* Main Heading with Motion Stagger & Shiny Accent */}
            <HeadingReveal />

            {/* Supporting Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal max-w-xl"
            >
              An easy and convenient way for local vendors in Butuan City to register their business and manage their vendor application online with real-time tracking.
            </motion.p>

            {/* Action Buttons with Framer Motion Micro-Interactions */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4 pt-1 w-full sm:w-auto"
            >
              {/* Primary: Register as a Vendor */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full sm:w-auto font-semibold px-8 py-4 text-base rounded-[12px] bg-[#155EEF] hover:bg-[#1048b8] text-white shadow-md hover:shadow-lg transition-all duration-200 ease-out gap-2.5 cursor-pointer"
                  )}
                >
                  <span>Register as a Vendor</span>
                  <ArrowRight className="w-5 h-5 ml-0.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
                </Link>
              </motion.div>

              {/* Secondary: Learn How It Works */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto font-medium px-8 py-4 text-base rounded-[12px] border border-slate-300 bg-white/90 backdrop-blur-sm text-[#0F1E36] hover:bg-blue-50/80 hover:border-blue-200 hover:text-[#155EEF] shadow-2xs hover:shadow-xs transition-all duration-200 ease-out cursor-pointer"
                  )}
                >
                  Learn How It Works
                </Link>
              </motion.div>
            </motion.div>

            {/* Clean Feature Row Strip */}
            <HomeFeatures />
          </div>

          {/* ─── Right Side: React Bits 3D Tilted Status Preview Card ─── */}
          <div className="lg:col-span-5 xl:col-span-5 flex items-center justify-center relative">
            <HomeHeroStatusCard />
          </div>

        </div>
      </div>
    </section>
  );
}
