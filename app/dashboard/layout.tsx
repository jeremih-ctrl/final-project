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
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useVendorAuth } from "@/lib/demo-auth";
import { useVendorNotifications } from "@/lib/notifications-data";

interface SidebarNavProps {
  pathname: string;
  onNavigate?: () => void;
  onLogout?: () => void;
}

function SidebarNav({ pathname, onNavigate, onLogout }: SidebarNavProps) {
  const { unreadCount } = useVendorNotifications("BVR-2026-001248");

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "My Application",
      href: "/application-status",
      icon: FileText,
      active: pathname === "/application-status",
      isExternal: true,
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, isLoading, logout } = useVendorAuth();

  // Redirect to vendor login if unauthenticated
  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  // Dynamic header page title based on current route
  const getHeaderTitle = (path: string) => {
    if (path.startsWith("/dashboard/business-profile")) return "Business Profile";
    if (path.startsWith("/dashboard/documents")) return "Documents";
    if (path.startsWith("/dashboard/notifications")) return "Notifications";
    if (path.startsWith("/dashboard/settings")) return "Settings";
    if (path.startsWith("/dashboard/help")) return "Help & Support";
    return "Dashboard";
  };

  const headerTitle = getHeaderTitle(pathname);

  // Protected route guard: Do not display dashboard or user information until authenticated
  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex">
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 shadow-xs border-r border-slate-800">
        <SidebarNav pathname={pathname} onLogout={logout} />
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
                  onLogout={logout}
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

          {/* Right Header: Notification + User Dropdown */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Notification Bell */}
            <Link
              href="/dashboard/notifications"
              className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </Link>

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {/* User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer outline-hidden"
                  >
                    <Avatar
                      size="sm"
                      className="bg-blue-100 text-blue-700 font-bold border border-blue-200"
                    >
                      <AvatarFallback>
                        {session.name
                          ? session.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "JD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {session.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                        {session.role}
                      </span>
                    </div>
                  </button>
                }
              />
              <DropdownMenuContent
                align="end"
                className="w-56 p-1.5 shadow-lg border-slate-200"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-semibold text-xs px-2 py-1.5 text-slate-700">
                    <div className="font-bold text-sm text-slate-900">
                      {session.name}
                    </div>
                    <div className="text-xs font-normal text-slate-500">
                      {session.email}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/business-profile")}
                  className="text-xs py-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 mr-2 text-slate-500" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                  className="text-xs py-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-500" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/help")}
                  className="text-xs py-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 mr-2 text-slate-500" />
                  Help / Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={logout}
                  className="text-xs py-2 text-rose-600 font-medium cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2 text-rose-500" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
