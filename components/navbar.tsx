"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, UserButton } from "@clerk/nextjs";
import { useAppRole } from "@/lib/clerk-roles";
import { cn } from "@/lib/utils";
import {
  Store,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Search,
  LogIn,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isSignedIn, isAdmin, isVendor } = useAppRole();

  const portalTargetUrl = isSignedIn
    ? isAdmin
      ? "/admin"
      : isVendor
      ? "/dashboard"
      : "/login"
    : "/login";

  // Close menus on route change
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setMobileMenuOpen(false);
        setPortalDropdownOpen(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Handle click outside and Escape key to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setPortalDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPortalDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Desktop hover helpers with a smooth grace period
  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPortalDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setPortalDropdownOpen(false);
    }, 180);
  };

  const toggleDropdown = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPortalDropdownOpen((prev) => !prev);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/70 shadow-2xs">
      {/* Top Civic Government Bar - Clean utility bar without duplicate portal links */}
      <div className="bg-[#0B1A30] text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-100 tracking-wide">
              City Government of Butuan
            </span>
            <span className="text-slate-400 hidden sm:inline">
              • Agusan del Norte, Philippines
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Official Local Government Service</span>
            <span className="sm:hidden">Official Portal</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.25rem]">
          {/* Logo & System Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            {/* Blue Circular Government / Logo Mark */}
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#155EEF] text-white flex items-center justify-center shadow-xs ring-4 ring-blue-50 transition-transform duration-200 group-hover:scale-105 shrink-0">
              <Store className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#0F1E36] text-xs sm:text-[13px] lg:text-base xl:text-lg leading-tight tracking-tight group-hover:text-[#155EEF] transition-colors whitespace-nowrap">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden xl:inline whitespace-nowrap">
                City Government of Butuan • Agusan del Norte
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links & Single Portal Access Dropdown */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
            <nav className="flex items-center gap-2 lg:gap-5 xl:gap-6">
              <Link
                href="/"
                className={cn(
                  "relative py-1 text-xs lg:text-sm font-semibold transition-colors whitespace-nowrap",
                  pathname === "/"
                    ? "text-[#155EEF] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-[#155EEF]"
                    : "text-slate-600 hover:text-[#0F1E36]"
                )}
              >
                Home
              </Link>
              <Link
                href="#how-it-works"
                className="relative py-1 text-xs lg:text-sm font-medium text-slate-600 hover:text-[#0F1E36] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-[#155EEF] after:transition-all after:duration-200 transition-colors whitespace-nowrap"
              >
                How It Works
              </Link>
              <Link
                href="#requirements"
                className="relative py-1 text-xs lg:text-sm font-medium text-slate-600 hover:text-[#0F1E36] after:absolute after:bottom-0 after:left-0 after:w-0 hover:after:w-full after:h-[2px] after:bg-[#155EEF] after:transition-all after:duration-200 transition-colors whitespace-nowrap"
              >
                Requirements
              </Link>
            </nav>

            {/* Consolidated Portal Access Mega Dropdown */}
            <div
              ref={dropdownRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={toggleDropdown}
                aria-expanded={portalDropdownOpen}
                aria-haspopup="true"
                aria-label="Portal Access Menu"
                className={cn(
                  "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 cursor-pointer select-none border",
                  portalDropdownOpen
                    ? "bg-blue-50/90 text-[#155EEF] border-blue-200/90 shadow-xs"
                    : "bg-white text-[#0F1E36] border-slate-200/90 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <span>Portal Access</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-500 transition-transform duration-200",
                    portalDropdownOpen && "rotate-180 text-[#155EEF]"
                  )}
                  aria-hidden="true"
                />
              </button>

              {/* Polished Dropdown Menu (Positioned beneath button on the right with smooth transitions) */}
              <div
                role="menu"
                aria-label="Portal Access Options"
                aria-hidden={!portalDropdownOpen}
                className={cn(
                  "absolute top-full right-0 mt-2 w-80 sm:w-[22.5rem] bg-white rounded-2xl border border-slate-200/90 shadow-xl p-2.5 z-50 transition-all duration-200 ease-out origin-top-right ring-1 ring-black/5",
                  portalDropdownOpen
                    ? "opacity-100 scale-100 translate-y-0 pointer-events-auto visible"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none invisible"
                )}
              >
                <div className="px-3 pt-1.5 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    City Services &amp; Portals
                  </span>
                  <span className="text-[10px] text-blue-600 font-medium">
                    Butuan City
                  </span>
                </div>

                <div className="space-y-1 pt-1.5">
                  {/* Option 1: 🔐 Sign In / Sign Up */}
                  <div className="p-2 rounded-xl hover:bg-slate-50/90 transition-colors group">
                    <Link
                      href={portalTargetUrl}
                      onClick={() => setPortalDropdownOpen(false)}
                      role="menuitem"
                      tabIndex={portalDropdownOpen ? 0 : -1}
                      className="flex items-start gap-3 text-left w-full cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#155EEF] border border-blue-100/90 flex items-center justify-center shrink-0 group-hover:bg-[#155EEF] group-hover:text-white transition-all duration-200 shadow-2xs">
                        <LogIn className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#0F1E36] group-hover:text-[#155EEF] transition-colors">
                            Sign In / Sign Up
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#155EEF] group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          {isSignedIn
                            ? "Access your authorized portal dashboard"
                            : "One entry point for vendors and municipal administrators"}
                        </p>
                      </div>
                    </Link>
                  </div>

                  {/* Option 2: 🔍 Track Status */}
                  <div className="p-2 rounded-xl hover:bg-slate-50/90 transition-colors group">
                    <Link
                      href="/application-status"
                      onClick={() => setPortalDropdownOpen(false)}
                      role="menuitem"
                      tabIndex={portalDropdownOpen ? 0 : -1}
                      className="flex items-start gap-3 text-left w-full cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200 shadow-2xs">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#0F1E36] group-hover:text-emerald-700 transition-colors">
                            Track Status
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                          Quick lookup without logging in
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Optional user account footer when signed in with Clerk */}
                <Show when="signed-in">
                  <div className="mt-2 pt-2 border-t border-slate-100 px-2 py-1.5 bg-slate-50/70 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "w-7 h-7 ring-2 ring-blue-100",
                          },
                        }}
                      />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold text-slate-700 leading-tight">
                          Account Profile
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {isAdmin ? "Admin Clearance" : isVendor ? "Vendor Session" : "Account Session"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            {/* Profile Avatar when signed in */}
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 lg:w-9 lg:h-9 ring-2 ring-blue-100",
                  },
                }}
              />
            </Show>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-7 h-7 ring-2 ring-blue-100",
                  },
                }}
              />
            </Show>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-[#0F1E36] hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Responsive Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl">
          {/* Main Primary Links */}
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                pathname === "/"
                  ? "text-[#155EEF] bg-blue-50/80"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#requirements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Requirements
            </Link>
          </nav>

          {/* Dedicated Portal Access Section on Mobile */}
          <div className="pt-2 border-t border-slate-200/80 space-y-2">
            <div className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Portal Access
            </div>

            <div className="space-y-2">
              {/* Mobile Option 1: 🔐 Sign In / Sign Up */}
              <Link
                href={portalTargetUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left w-full cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#155EEF] flex items-center justify-center shrink-0">
                  <LogIn className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-[#0F1E36] block">
                    Sign In / Sign Up
                  </span>
                  <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                    {isSignedIn
                      ? "Access your authorized portal dashboard"
                      : "One entry point for vendors and municipal administrators"}
                  </span>
                </div>
              </Link>

              {/* Mobile Option 2: 🔍 Track Status */}
              <Link
                href="/application-status"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-left w-full cursor-pointer hover:bg-slate-100/80 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-sm text-[#0F1E36] block">
                    Track Status
                  </span>
                  <span className="text-xs text-slate-500 block leading-tight mt-0.5">
                    Quick lookup without logging in
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
