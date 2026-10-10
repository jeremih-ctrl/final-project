"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { ShinyText } from "@/components/reactbits/ShinyText";

export function CtaSection() {
  return (
    <section id="register" className="py-20 sm:py-24 bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[24px] bg-[#0B1A30] border border-slate-800 text-white p-8 sm:p-12 lg:p-16 shadow-xl"
        >
          {/* Animated Ambient Civic Navy/Blue Accents */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-700/50 text-blue-200 text-xs sm:text-sm font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>
                <ShinyText
                  text="Official City Government of Butuan Portal"
                  className="text-blue-200"
                  shimmerColor="rgba(255, 255, 255, 0.9)"
                />
              </span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Start Your Vendor Registration Today
            </h2>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
              Register your local business operating in Butuan City. Experience a simple, transparent, and paperless application process with real-time tracking.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="/register"
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "w-full sm:w-auto bg-[#155EEF] hover:bg-[#1048b8] text-white font-semibold px-8 py-4 text-base rounded-[12px] shadow-lg hover:shadow-xl transition-all duration-200 gap-2.5 cursor-pointer"
                  )}
                >
                  <span>Register as a Vendor</span>
                  <ArrowRight className="w-5 h-5 ml-0.5" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "w-full sm:w-auto bg-slate-800/80 border-slate-700 hover:bg-slate-800 text-slate-200 hover:text-white font-medium px-8 py-4 text-base rounded-[12px] shadow-2xs transition-all duration-200 cursor-pointer"
                  )}
                >
                  Learn How It Works
                </Link>
              </motion.div>
            </div>

            <p className="text-xs text-slate-400 pt-2 font-medium">
              Registration is free and dedicated to local vendors within Butuan City, Agusan del Norte.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
