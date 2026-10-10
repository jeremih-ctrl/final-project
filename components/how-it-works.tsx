"use client";

import { motion } from "framer-motion";
import { ClipboardEdit, SearchCheck, CheckCircle2, ArrowRight } from "lucide-react";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { ShinyText } from "@/components/reactbits/ShinyText";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Register",
      tagline: "Submit your vendor information.",
      description:
        "Fill out the simplified registration form with your business details, contact information, and local address within Butuan City.",
      icon: ClipboardEdit,
    },
    {
      number: "02",
      title: "Application Review",
      tagline: "Your application is reviewed by the administrator.",
      description:
        "City LGU administrators review your information to ensure completeness, validity, and alignment with local business guidelines.",
      icon: SearchCheck,
    },
    {
      number: "03",
      title: "Get Approved",
      tagline: "Receive your vendor registration status.",
      description:
        "Receive your vendor registration status, reference code, and official verification to conduct business with confidence.",
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-20 sm:py-24 bg-white border-y border-slate-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl mx-auto space-y-3 mb-14 sm:mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#155EEF] text-xs font-semibold uppercase tracking-wider shadow-2xs">
            <ShinyText
              text="Clear & Simple Process"
              className="text-[#155EEF]"
              shimmerColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F1E36]">
            How It Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Follow these three straightforward steps to get your vendor business registered with the City Government of Butuan.
          </p>
        </motion.div>

        {/* 3 Step Cards Grid with React Bits SpotlightCard & Motion Stagger */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, delay: index * 0.15, ease: "easeOut" }}
                whileHover={{ y: -4 }}
                className="relative group h-full"
              >
                <SpotlightCard
                  spotlightColor="rgba(21, 94, 239, 0.12)"
                  className="h-full bg-white hover:bg-slate-50/40 border border-slate-200/90 hover:border-blue-300 shadow-xs hover:shadow-md transition-all duration-300 rounded-[18px] flex flex-col justify-between"
                >
                  <div className="p-7 flex flex-col h-full justify-between">
                    <div>
                      {/* Step Number & Icon Row */}
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-[#155EEF] flex items-center justify-center font-bold text-lg shadow-2xs group-hover:bg-[#155EEF] group-hover:text-white transition-colors duration-200">
                          <Icon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="font-mono text-3xl font-extrabold text-slate-200 group-hover:text-blue-200 transition-colors">
                          {step.number}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[#0F1E36] mb-1">
                        {step.title}
                      </h3>

                      <p className="text-sm font-semibold text-[#155EEF] mb-3">
                        {step.tagline}
                      </p>

                      <p className="text-sm text-slate-500 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </SpotlightCard>

                {/* Arrow connector for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-4 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
