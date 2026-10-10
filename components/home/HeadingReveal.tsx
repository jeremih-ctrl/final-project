"use client";

import { motion } from "framer-motion";
import { ShinyText } from "@/components/reactbits/ShinyText";

interface HeadingRevealProps {
  className?: string;
}

export function HeadingReveal({ className }: HeadingRevealProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 22, filter: "blur(6px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold tracking-tight text-[#0F1E36] leading-[1.12] sm:leading-[1.1] ${
        className || ""
      }`}
    >
      <span className="inline-block">
        <motion.span variants={itemVariants} className="inline-block mr-[0.25em]">
          Register
        </motion.span>
        <motion.span variants={itemVariants} className="inline-block mr-[0.25em]">
          Your
        </motion.span>
        <motion.span variants={itemVariants} className="inline-block mr-[0.25em]">
          Business
        </motion.span>
      </span>{" "}
      <br className="hidden sm:inline" />
      <span className="inline-block">
        <motion.span variants={itemVariants} className="inline-block mr-[0.25em]">
          in
        </motion.span>
        <motion.span
          variants={itemVariants}
          className="inline-block relative text-[#155EEF] underline decoration-blue-300 decoration-wavy decoration-2 underline-offset-8"
        >
          <ShinyText
            text="Butuan"
            className="text-[#155EEF]"
            shimmerColor="rgba(255, 255, 255, 0.9)"
            speed={3.5}
          />
        </motion.span>
      </span>
    </motion.h1>
  );
}
