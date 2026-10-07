"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Store,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Shield,
} from "lucide-react";

export function Navbar() {
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePortalsOpen, setMobilePortalsOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPortalsOpen(false);
    setMobileMenuOpen(false);
    setMobilePortalsOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Civic Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">City Government of Butuan</span>
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
              <span className="sm:hidden">Official LGU Portal</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & System Name */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                City Government of Butuan • Agusan del Norte
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              href="/"
              className="px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50/70 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="#requirements"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Requirements
            </Link>
            <Link
              href="/application-status"
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Track Status
            </Link>

            {/* Portals / Login Dropdown */}
            <DropdownMenu open={portalsOpen} onOpenChange={setPortalsOpen}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1",
                      portalsOpen
                        ? "text-blue-700 bg-blue-50/80"
                        : "text-slate-700 hover:text-blue-700 hover:bg-slate-100"
                    )}
                    aria-label="Portals navigation menu"
                    aria-expanded={portalsOpen}
                    aria-haspopup="menu"
                  >
                    <span>Portals</span>
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 opacity-70 transition-transform duration-200",
                        portalsOpen && "rotate-180"
                      )}
                    />
                  </button>
                }
              />
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-80 max-w-[calc(100vw-2rem)] p-2 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900 z-50 divide-y divide-slate-100 outline-none"
              >
                {/* VENDOR PORTAL SECTION */}
                <DropdownMenuGroup className="pb-2 space-y-1">
                  <DropdownMenuLabel className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-100/80 text-blue-700 flex items-center justify-center">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <span>Vendor Portal</span>
                  </DropdownMenuLabel>
                  <p className="px-2.5 text-xs text-slate-600 leading-normal pl-9.5">
                    Manage your vendor registration and application.
                  </p>
                  <DropdownMenuItem
                    render={<Link href="/login" />}
                    onClick={() => setPortalsOpen(false)}
                    className="flex items-center justify-between mx-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/70 focus:bg-blue-50/70 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 data-highlighted:bg-blue-50/70 transition-colors cursor-pointer group"
                  >
                    <span>Vendor Login</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-data-highlighted:translate-x-0.5" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                {/* ADMIN PORTAL SECTION */}
                <DropdownMenuGroup className="pt-2 space-y-1">
                  <DropdownMenuLabel className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <span>Admin Portal</span>
                  </DropdownMenuLabel>
                  <p className="px-2.5 text-xs text-slate-600 leading-normal pl-9.5">
                    For authorized City Government personnel.
                  </p>
                  <DropdownMenuItem
                    render={<Link href="/admin/login" />}
                    onClick={() => setPortalsOpen(false)}
                    className="flex items-center justify-between mx-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-slate-50 focus:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 data-highlighted:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <span>Admin Login</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-data-highlighted:translate-x-0.5" />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Primary CTA (Desktop) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "shadow-xs font-semibold px-4 cursor-pointer gap-2"
              )}
            >
              Register as a Vendor
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
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
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-blue-700 bg-blue-50/70"
            >
              Home
            </Link>
            <Link
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              How It Works
            </Link>
            <Link
              href="#requirements"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Requirements
            </Link>
            <Link
              href="/application-status"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Track Status
            </Link>

            {/* Portals in Mobile Navigation */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setMobilePortalsOpen(!mobilePortalsOpen)}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-expanded={mobilePortalsOpen}
              >
                <span>Portals</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-500 transition-transform duration-200",
                    mobilePortalsOpen && "rotate-180"
                  )}
                />
              </button>

              {mobilePortalsOpen && (
                <div className="mt-1 ml-2 pl-3 border-l-2 border-blue-200 space-y-2 py-1">
                  <Link
                    href="/login"
                    onClick={() => {
                      setMobilePortalsOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block p-2 rounded-lg hover:bg-blue-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-100/80 text-blue-700 flex items-center justify-center">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs tracking-wider uppercase text-slate-900 group-hover:text-blue-700">
                        Vendor Portal
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 pl-8">
                      Manage your vendor registration and application.
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700 mt-1 pl-8">
                      <span>Vendor Login</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>

                  <div className="h-px bg-slate-100" />

                  <Link
                    href="/admin/login"
                    onClick={() => {
                      setMobilePortalsOpen(false);
                      setMobileMenuOpen(false);
                    }}
                    className="block p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs tracking-wider uppercase text-slate-900 group-hover:text-blue-700">
                        Admin Portal
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 pl-8">
                      For authorized City Government personnel.
                    </p>
                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-600 group-hover:text-blue-700 mt-1 pl-8">
                      <span>Admin Login</span>
                      <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <div className="pt-2 border-t border-slate-100">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full justify-center font-semibold py-2.5 gap-2"
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
