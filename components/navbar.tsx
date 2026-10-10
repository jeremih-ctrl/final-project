"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Store,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
      {/* Top Civic Government Bar */}
      <div className="bg-[#0B1A30] text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-100 tracking-wide">City Government of Butuan</span>
            <span className="text-slate-400 hidden sm:inline">• Agusan del Norte, Philippines</span>
          </div>
          <div className="flex items-center gap-3 text-slate-300 text-xs">
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition-colors hidden sm:inline font-medium"
            >
              Vendor Portal
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <Link
              href="/admin"
              className="text-slate-300 hover:text-white transition-colors hidden sm:inline font-medium"
            >
              Admin Portal
            </Link>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Official Local Government Service</span>
              <span className="sm:hidden">Official Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          {/* Logo & System Name */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Blue Circular Government / Logo Mark */}
            <div className="w-10 h-10 rounded-full bg-[#155EEF] text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50 transition-transform duration-200 group-hover:scale-105 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#0F1E36] text-base sm:text-lg leading-tight tracking-tight group-hover:text-[#155EEF] transition-colors">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                City Government of Butuan • Agusan del Norte
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with subtle hover underline */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link
              href="/"
              className="relative py-1 text-sm font-semibold text-[#155EEF] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#155EEF] transition-colors"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              className="relative py-1 text-sm font-medium text-slate-600 hover:text-[#0F1E36] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-[#155EEF] after:transition-all after:duration-200 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#requirements"
              className="relative py-1 text-sm font-medium text-slate-600 hover:text-[#0F1E36] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-[#155EEF] after:transition-all after:duration-200 transition-colors"
            >
              Requirements
            </Link>
            <Link
              href="/application-status"
              className="relative py-1 text-sm font-medium text-slate-600 hover:text-[#0F1E36] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-[#155EEF] after:transition-all after:duration-200 transition-colors"
            >
              Track Status
            </Link>
          </nav>

          {/* Prominent Blue Primary CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "rounded-[10px] font-semibold px-5 py-2.5 bg-[#155EEF] hover:bg-[#1048b8] text-white shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer gap-2"
              )}
            >
              Register as a Vendor
              <ArrowRight className="w-4 h-4 ml-0.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-[#0F1E36] hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#155EEF] bg-blue-50/80"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#requirements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Requirements
            </Link>
            <Link
              href="/application-status"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Track Status
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full justify-center font-semibold py-2.5 rounded-[10px] bg-[#155EEF] hover:bg-[#1048b8] text-white gap-2 transition-all duration-200 shadow-xs"
              )}
            >
              Register as a Vendor
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
