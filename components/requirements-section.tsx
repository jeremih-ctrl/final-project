"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  IdCard,
  Lock,
  AlertCircle,
} from "lucide-react";
import { SpotlightCard } from "@/components/reactbits/SpotlightCard";
import { ShinyText } from "@/components/reactbits/ShinyText";

export function RequirementsSection() {
  const requirements = [
    {
      title: "Business Name",
      description: "Registered trade name, business title, or market stall name.",
      icon: Building,
      isOptional: false,
    },
    {
      title: "Owner Name",
      description: "Full legal name of the business owner or primary operator.",
      icon: User,
      isOptional: false,
    },
    {
      title: "Contact Number",
      description: "Active mobile phone number (+63) for SMS status alerts and notices.",
      icon: Phone,
      isOptional: false,
    },
    {
      title: "Email Address",
      description: "Valid personal or business email to receive registration updates.",
      icon: Mail,
      isOptional: false,
    },
    {
      title: "Business Address",
      description: "Physical stall, shop, or operating address located within Butuan City.",
      icon: MapPin,
      isOptional: false,
    },
    {
      title: "Government ID",
      description:
        "Upload one valid government-issued ID for identity verification. Accepted IDs include PhilSys National ID, Driver's License, Voter's ID, or Postal ID and passport.",
      icon: IdCard,
      isOptional: false,
    },
    {
      title: "Password",
      description: "A secure password to access your vendor account and monitor your application.",
      icon: Lock,
      isOptional: false,
    },
  ];

  return (
    <section id="requirements" className="py-20 sm:py-24 bg-[#F8FAFD]">
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
              text="Preparation Checklist"
              className="text-[#155EEF]"
              shimmerColor="rgba(255, 255, 255, 0.9)"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F1E36]">
            Initial Registration Requirements
          </h2>
          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
            Have the following basic information ready before starting. The process is quick, simple, and takes only a few minutes.
          </p>
        </motion.div>

        {/* Requirements Grid with React Bits SpotlightCard & Motion Stagger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requirements.map((req, index) => {
            const Icon = req.icon;
            return (
              <motion.div
                key={req.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                whileHover={{ y: -3 }}
                className="h-full"
              >
                <SpotlightCard
                  spotlightColor="rgba(21, 94, 239, 0.10)"
                  className="bg-white border border-slate-200/90 rounded-[18px] shadow-xs hover:shadow-md transition-all duration-300 hover:border-blue-300 h-full p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-[#155EEF] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#155EEF] group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>

                      {req.isOptional ? (
                        <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-medium px-2.5 py-0.5 text-xs">
                          Optional
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[#155EEF] bg-blue-50/70 border-blue-200 font-semibold text-xs">
                          Required
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[#0F1E36] mb-2 flex items-center gap-2">
                      {req.title}
                      {req.isOptional && (
                        <span className="text-xs font-normal text-slate-400">
                          (Optional)
                        </span>
                      )}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      {req.description}
                    </p>
                  </div>
                </SpotlightCard>
              </motion.div>
            );
          })}
        </div>

        {/* Informative Note Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12 rounded-[18px] bg-white border border-slate-200/90 p-6 sm:p-7 flex items-start sm:items-center gap-4 shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong className="text-[#0F1E36] font-semibold">Note on Government ID:</strong> Upload one valid government-issued ID for identity verification. Accepted IDs include PhilSys National ID, Driver&apos;s License, Voter&apos;s ID, Postal ID, or Passport.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
