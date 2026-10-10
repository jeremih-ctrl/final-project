"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck, FileCheck } from "lucide-react";

export function HomeFeatures() {
  const features = [
    {
      title: "100% Online Application",
      subtitle: "Paperless & direct submission",
      icon: CheckCircle2,
    },
    {
      title: "Official LGU Recognition",
      subtitle: "Authorized city vendor status",
      icon: ShieldCheck,
    },
    {
      title: "Fast & Transparent Review",
      subtitle: "Real-time status tracking",
      icon: FileCheck,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.45, ease: "easeOut" }}
      className="pt-8 sm:pt-10"
    >
      <div className="inline-flex flex-col md:flex-row items-stretch md:items-center rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xs p-2 sm:p-2.5 max-w-full ring-1 ring-slate-900/5">
        {features.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center">
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
                className="group flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-200 ease-out hover:bg-slate-50/90 cursor-default"
              >
                {/* Icon with hover scale */}
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200/80 text-[#155EEF] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#155EEF] group-hover:text-white group-hover:border-transparent shadow-2xs">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>

                <div className="flex flex-col text-left">
                  <span className="font-bold text-xs sm:text-sm text-[#0F1E36] leading-snug group-hover:text-[#155EEF] transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-500 font-normal leading-tight">
                    {item.subtitle}
                  </span>
                </div>
              </motion.div>

              {/* Subtle Vertical Separator between items (desktop) */}
              {index < features.length - 1 && (
                <div
                  className="hidden md:block w-px h-8 bg-slate-200/80 mx-1 shrink-0"
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
