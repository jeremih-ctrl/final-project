"use client";

import { motion } from "framer-motion";
import { MapPin, Info } from "lucide-react";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";

export function LocalNotice() {
  return (
    <section className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <SpotlightCard
          spotlightColor="rgba(21, 94, 239, 0.10)"
          className="rounded-[20px] bg-white border border-slate-200/90 p-7 sm:p-9 shadow-xs hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
            {/* Civic Location Icon Badge */}
            <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-200/80 text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-6 h-6 stroke-[2.2] animate-bounce" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#155EEF] bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-2xs">
                  <Info className="w-3.5 h-3.5 text-[#155EEF]" />
                  Local Jurisdiction Notice
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  • City Ordinance & Guidelines
                </span>
              </div>

              {/* Clean Navy Heading */}
              <h3 className="text-base sm:text-lg font-bold text-[#0F1E36] leading-snug">
                This registration system is intended for local vendors operating within{" "}
                <span className="text-[#155EEF] font-extrabold">
                  Butuan City, Agusan del Norte, Philippines.
                </span>
              </h3>

              {/* Muted Supporting Text */}
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-4xl">
                Eligible businesses include public market vendors, street vendors, small retail stalls, and micro-enterprises operating across all 86 barangays of Butuan City. Registrations are vetted according to local municipal ordinances and fair trade standards.
              </p>
            </div>
          </div>
        </SpotlightCard>
      </motion.div>
    </section>
  );
}
