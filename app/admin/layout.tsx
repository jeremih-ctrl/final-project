"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FileCheck2,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Shield,
  Users,
  Files,
  BarChart3,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAdminAuth, setAdminSession, clearAdminSession } from "@/lib/demo-auth";
import { useAdminNotifications } from "@/lib/notifications-data";
import { useAppRole } from "@/lib/clerk-roles";
import { UserButton, useClerk, SignOutButton } from "@clerk/nextjs";

interface AdminSidebarProps {
  pathname: string;
  onNavigate?: () => void;
  onLogout?: () => void;
}

function AdminSidebar({ pathname, onNavigate, onLogout }: AdminSidebarProps) {
  const { unreadCount } = useAdminNotifications();

  const navItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      active: pathname === "/admin",
    },
    {
      label: "Applications",
      href: "/admin/applications",
      icon: FileCheck2,
      active: pathname.startsWith("/admin/applications"),
      badge: "84",
    },
    {
      label: "Vendors",
      href: "/admin/vendors",
      icon: Users,
      active: pathname.startsWith("/admin/vendors"),
    },
    {
      label: "Documents",
      href: "/admin/documents",
      icon: Files,
      active: pathname.startsWith("/admin/documents"),
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: BarChart3,
      active: pathname.startsWith("/admin/reports"),
    },
    {
      label: "Notifications",
      href: "/admin/notifications",
      icon: Bell,
      active: pathname.startsWith("/admin/notifications"),
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-xs ring-1 ring-blue-500/30">
          <Shield className="w-5 h-5 text-blue-200" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-white text-sm leading-tight truncate">
              Butuan Vendor Admin
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
            City Government of Butuan
          </p>
        </div>
      </div>

      {/* Admin Badge */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
          Portal Scope
        </span>
        <Badge className="bg-blue-950 text-blue-300 border-blue-800/80 text-[10px] font-semibold py-0 h-4">
          LGU Administrator
        </Badge>
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
                : "text-slate-300 font-medium hover:bg-slate-900 hover:text-white"
            )}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <span
                className={cn(
                  "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md",
                  item.active
                    ? "bg-blue-700 text-white"
                    : "bg-slate-800 text-slate-300"
                )}
              >
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-slate-800/80 space-y-1">
        <Link
          href="/admin/help"
          onClick={onNavigate}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer",
            pathname.startsWith("/admin/help")
              ? "bg-blue-700 text-white font-semibold shadow-xs"
              : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
          )}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Help / Support</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate();
            if (onLogout) onLogout();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, isLoading: isLocalLoading } = useAdminAuth();
  const { signOut } = useClerk();

  const handleAdminLogout = async () => {
    clearAdminSession();
    await signOut({ redirectUrl: "/login" });
  };
  const {
    user: clerkUser,
    isLoaded: isClerkLoaded,
    isSignedIn: isClerkSignedIn,
    isAdmin: isClerkAdmin,
    isVendor: isClerkVendor,
    email: clerkEmail,
  } = useAppRole();

  const isLoginPage = pathname === "/admin/login";

  // Automatically sync Clerk Admin user into local admin session state
  useEffect(() => {
    if (isClerkSignedIn && isClerkAdmin && !session) {
      setAdminSession({
        email: clerkEmail || "admin@butuan.gov.ph",
        name: clerkUser?.fullName || "LGU Administrator",
        title: "City Licensing Division",
        role: "admin",
      });
    } else if (isClerkSignedIn && !isClerkAdmin && session) {
      // Purge any stale admin session if the user is not an admin
      clearAdminSession();
    }
  }, [isClerkSignedIn, isClerkAdmin, session, clerkEmail, clerkUser]);

  // Redirect to unified login if completely unauthenticated
  useEffect(() => {
    if (
      !isLoginPage &&
      isClerkLoaded &&
      !isClerkSignedIn
    ) {
      router.replace("/login");
    }
  }, [isLoginPage, isClerkLoaded, isClerkSignedIn, router]);

  // Standalone login page without sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state while verifying credentials
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">
            Verifying administrator credentials...
          </p>
        </div>
      </div>
    );
  }

  // ROLE RESTRICTION GUARD:
  // If user is signed in with Clerk but NOT an admin, block access to /admin
  if (isClerkSignedIn && !isClerkAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              {isClerkVendor ? "Access Restricted • Role: Vendor" : "Access Restricted • No Valid Role"}
            </span>
            <h2 className="text-xl font-bold text-white">
              Administrator Clearance Required
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isClerkVendor ? (
                <>
                  You are currently signed in as <strong className="text-slate-200">{clerkEmail}</strong> with the <strong className="text-slate-200">Vendor</strong> role. Access to the City Government of Butuan Licensing Admin Portal requires Administrator privileges.
                </>
              ) : (
                <>
                  You are currently signed in as <strong className="text-slate-200">{clerkEmail}</strong>, but this account has no authorized role in the system. Access to the City Government of Butuan Licensing Admin Portal requires Administrator privileges.
                </>
              )}
            </p>
          </div>

          <div className="pt-2 space-y-2">
            {isClerkVendor ? (
              <Link
                href="/dashboard"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
                )}
              >
                Go to Vendor Portal
              </Link>
            ) : (
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 rounded-xl cursor-pointer"
                )}
              >
                Start Vendor Registration
              </Link>
            )}

            <SignOutButton redirectUrl="/login">
              <button
                type="button"
                className="w-full text-xs font-medium text-slate-400 hover:text-white py-2 rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                Sign Out & Switch Account
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  // Fallback loading while redirect takes effect if unauthenticated
  if (!session && !isClerkAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">
            Redirecting to Administrator Login...
          </p>
        </div>
      </div>
    );
  }

  // Dynamic header page title based on current route
  const getHeaderTitle = (path: string) => {
    if (path.startsWith("/admin/applications")) return "Applications";
    if (path.startsWith("/admin/vendors")) return "Registered Vendors";
    if (path.startsWith("/admin/documents")) return "Document Verification";
    if (path.startsWith("/admin/reports")) return "Reports & Analytics";
    if (path.startsWith("/admin/notifications")) return "Admin Notifications";
    if (path.startsWith("/admin/settings")) return "Portal Settings";
    if (path.startsWith("/admin/help")) return "Help & Support";
    return "Admin Dashboard";
  };

  const headerTitle = getHeaderTitle(pathname);

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex">
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 shadow-xs border-r border-slate-800/90">
        <AdminSidebar pathname={pathname} onLogout={handleAdminLogout} />
      </aside>

      {/* Main Content Area (offset by sidebar width on desktop) */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Admin Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 h-16 sm:h-18 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                    aria-label="Open administration navigation menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                }
              />
              <SheetContent side="left" className="w-72 p-0 border-r-0">
                <AdminSidebar
                  pathname={pathname}
                  onNavigate={() => setMobileMenuOpen(false)}
                  onLogout={handleAdminLogout}
                />
              </SheetContent>
            </Sheet>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                  {headerTitle}
                </h1>
                <Badge
                  variant="outline"
                  className="hidden sm:inline-flex text-[10px] font-semibold text-blue-700 bg-blue-50 border-blue-200"
                >
                  Admin Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                City Government of Butuan • Economic & Licensing Division
              </p>
            </div>
          </div>

          {/* Right Header: Notification + Admin Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell with counter */}
            <Link
              href="/admin/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="View admin notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </Link>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* Authenticated Clerk User Avatar (Rose-pink Google profile icon) */}
            {isClerkSignedIn && (
              <div className="flex items-center">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8 sm:w-9 sm:h-9 ring-2 ring-blue-500/30",
                    },
                  }}
                />
              </div>
            )}
          </div>
        </header>

        {/* Admin Dashboard Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
