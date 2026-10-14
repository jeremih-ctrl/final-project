"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  FileText,
  Building2,
  Files,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { setVendorSession, clearVendorSession } from "@/lib/demo-auth";
import { useVendorNotifications } from "@/lib/notifications-data";
import { useAppRole } from "@/lib/clerk-roles";
import { saveSharedApplication } from "@/lib/vendor-application-state";
import { UserButton, SignOutButton, useClerk } from "@clerk/nextjs";

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  active: boolean;
  isExternal?: boolean;
  badge?: string;
  hasDot?: boolean;
}

interface SidebarNavProps {
  pathname: string;
  onNavigate?: () => void;
  onLogout?: () => Promise<void> | void;
  isLoggingOut?: boolean;
  logoutError?: string | null;
}

function SidebarNav({
  pathname,
  onNavigate,
  onLogout,
  isLoggingOut = false,
  logoutError = null,
}: SidebarNavProps) {
  const { unreadCount } = useVendorNotifications("BVR-2026-001248");

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "My Application",
      href: "/dashboard/my-application",
      icon: FileText,
      active: pathname.startsWith("/dashboard/my-application"),
    },
    {
      label: "Business Profile",
      href: "/dashboard/business-profile",
      icon: Building2,
      active: pathname === "/dashboard/business-profile",
    },
    {
      label: "Documents",
      href: "/dashboard/documents",
      icon: Files,
      active: pathname === "/dashboard/documents",
      badge: "1",
    },
    {
      label: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      active: pathname === "/dashboard/notifications",
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
      hasDot: unreadCount > 0,
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname === "/dashboard/settings",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Store className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-white text-sm leading-tight truncate">
            Butuan Vendors
          </h2>
          <p className="text-[11px] text-slate-400 font-medium truncate">
            Registration System
          </p>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left",
              item.active
                ? "bg-blue-600 text-white font-semibold shadow-xs"
                : "text-slate-300 font-medium hover:bg-slate-800 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.isExternal && (
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            )}
            {item.badge && (
              <span
                className={cn(
                  "text-[11px] font-mono px-1.5 py-0.5 rounded-md",
                  item.active
                    ? "bg-blue-700 text-white"
                    : "bg-slate-800 text-slate-300"
                )}
              >
                {item.badge}
              </span>
            )}
            {item.hasDot && !item.active && (
              <span className="w-2 h-2 rounded-full bg-blue-400" />
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Link
          href="/dashboard/help"
          onClick={onNavigate}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
            pathname.startsWith("/dashboard/help")
              ? "bg-blue-600 text-white font-semibold shadow-xs"
              : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          )}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Help / Support</span>
        </Link>

        {logoutError && (
          <div
            role="alert"
            className="px-3 py-2 rounded-xl text-[11px] bg-rose-950/80 border border-rose-800/80 text-rose-300 leading-tight"
          >
            {logoutError}
          </div>
        )}

        <button
          type="button"
          onClick={async () => {
            if (isLoggingOut) return;
            if (onNavigate) onNavigate();
            if (onLogout) {
              await onLogout();
            }
          }}
          disabled={isLoggingOut}
          aria-busy={isLoggingOut}
          aria-label={isLoggingOut ? "Logging out..." : "Logout"}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer text-left disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <LogOut className="w-4 h-4 shrink-0" />
          )}
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleVendorLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      // Clear client session tokens
      clearVendorSession();

      // Sign out using Clerk's supported signOut method and redirect to public home
      await signOut({ redirectUrl: "/" });
      router.replace("/");
    } catch (err) {
      console.error("Vendor sign out failed:", err);
      setIsLoggingOut(false);
      setLogoutError(
        err instanceof Error && err.message
          ? err.message
          : "Failed to log out. Please try again."
      );
    }
  };

  const {
    user: clerkUser,
    isLoaded: isClerkLoaded,
    isSignedIn: isClerkSignedIn,
    isAdmin: isClerkAdmin,
    email: clerkEmail,
  } = useAppRole();

  const [isFetchingApp, setIsFetchingApp] = useState(true);
  const [hasApplication, setHasApplication] = useState<boolean | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // If user is signed in with Clerk as Admin, redirect them to the Admin Portal
  useEffect(() => {
    if (isClerkLoaded && isClerkSignedIn && isClerkAdmin) {
      router.replace("/admin");
    }
  }, [isClerkLoaded, isClerkSignedIn, isClerkAdmin, router]);

  const loadPersistentApplication = async () => {
    setIsFetchingApp(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/vendor/application", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.application) {
          saveSharedApplication(data.application);
          setHasApplication(true);
          setLoadError(null);
          setVendorSession({
            email: clerkEmail || data.application.contact?.emailAddress || "vendor@butuan.gov.ph",
            name: data.application.owner?.ownerName || clerkUser?.fullName || "Registered Vendor",
            role: "Local Vendor",
          });
          return;
        } else {
          setHasApplication(false);
          setLoadError(null);
          return;
        }
      } else {
        setLoadError("Unable to retrieve your application records from the server.");
      }
    } catch (err) {
      console.error("Failed to load vendor application in dashboard:", err);
      setLoadError("Network error occurred while retrieving your application records.");
    } finally {
      setIsFetchingApp(false);
    }
  };

  // Restore vendor's persistent application upon Clerk/Google authentication
  useEffect(() => {
    if (!isClerkLoaded || !isClerkSignedIn || isClerkAdmin) return;
    loadPersistentApplication();
  }, [isClerkLoaded, isClerkSignedIn, isClerkAdmin, clerkEmail, clerkUser]);

  // Redirect to unified login if completely unauthenticated with Clerk
  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn && !isLoggingOut) {
      clearVendorSession();
      router.replace("/login");
    }
  }, [isClerkLoaded, isClerkSignedIn, isLoggingOut, router]);

  // Dynamic header page title based on current route
  const getHeaderTitle = (path: string) => {
    if (path.startsWith("/dashboard/my-application")) return "My Application";
    if (path.startsWith("/dashboard/business-profile")) return "Business Profile";
    if (path.startsWith("/dashboard/documents")) return "Documents";
    if (path.startsWith("/dashboard/notifications")) return "Notifications";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    if (path.startsWith("/dashboard/help")) return "Help & Support";
    return "Dashboard";
  };

  const headerTitle = getHeaderTitle(pathname);

  // Protected route guard: Do not display dashboard until authenticated with Clerk
  if (!isClerkLoaded || (isClerkSignedIn && isFetchingApp)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">
            {isFetchingApp
              ? "Retrieving your persistent vendor application..."
              : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  // Fallback loading while redirect takes effect if unauthenticated with Clerk
  if (!isClerkSignedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">
            {isLoggingOut ? "Logging out..." : "Redirecting to login..."}
          </p>
        </div>
      </div>
    );
  }

  // Clear error and retry option when application data cannot be loaded
  if (isClerkSignedIn && loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Connection Issue
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Unable to Load Application
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              {loadError} Please try reloading your application records.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={loadPersistentApplication}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
              )}
            >
              Retry Loading Application
            </button>

            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Sign Out &amp; Use Another Account
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  // If vendor has no linked application yet, direct them to register rather than showing fabricated mock data
  if (isClerkSignedIn && hasApplication === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              No Application Found
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Vendor Registration Required
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are signed in as <strong className="text-slate-800">{clerkEmail}</strong>, but there is no business application connected to this account yet. Please register your vendor details to activate your dashboard.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
              )}
            >
              Start Vendor Registration
            </Link>

            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Sign Out &amp; Use Another Account
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  // ROLE RESTRICTION GUARD:
  // If user is signed in with Clerk as Admin, route them away from vendor dashboard
  if (isClerkSignedIn && isClerkAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              Role: Administrator
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Administrator Account Detected
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You are currently signed in as {clerkEmail} with Administrator clearance. Please use the LGU Admin Portal.
            </p>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
              )}
            >
              Go to Admin Portal
            </Link>

            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className="w-full text-xs font-medium text-slate-600 hover:text-slate-900 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Sign Out &amp; Switch Account
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex">
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 shadow-xs border-r border-slate-800">
        <SidebarNav
          pathname={pathname}
          onLogout={handleVendorLogout}
          isLoggingOut={isLoggingOut}
          logoutError={logoutError}
        />
      </aside>

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                }
              />
              <SheetContent side="left" className="w-72 p-0 border-r-0">
                <SidebarNav
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                  onLogout={handleVendorLogout}
                  isLoggingOut={isLoggingOut}
                  logoutError={logoutError}
                />
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {headerTitle}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                City Government of Butuan • Vendor Portal
              </p>
            </div>
          </div>

          {/* Right Header: Google Account User Profile */}
          <div className="flex items-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-blue-500/20",
                },
              }}
            />
          </div>
        </header>

        {/* Dashboard Main Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
