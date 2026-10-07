"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  FileCheck2,
  Store,
  Files,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { useAdminAuth } from "@/lib/demo-auth";
import { useAdminNotifications } from "@/lib/notifications-data";

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
      icon: Store,
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
          href="/"
          onClick={onNavigate}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
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
  const { session, isLoading, logout } = useAdminAuth();

  const isLoginPage = pathname === "/admin/login";

  // Redirect to admin login if unauthenticated
  useEffect(() => {
    if (!isLoginPage && !isLoading && !session) {
      router.replace("/admin/login");
    }
  }, [isLoginPage, isLoading, session, router]);

  // Standalone login page without sidebar layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Dynamic header page title based on current route
  const getHeaderTitle = (path: string) => {
    if (path.startsWith("/admin/applications")) return "Applications";
    if (path.startsWith("/admin/vendors")) return "Registered Vendors";
    if (path.startsWith("/admin/documents")) return "Document Verification";
    if (path.startsWith("/admin/reports")) return "Reports & Analytics";
    if (path.startsWith("/admin/notifications")) return "Admin Notifications";
    if (path.startsWith("/admin/settings")) return "Portal Settings";
    return "Admin Dashboard";
  };

  const headerTitle = getHeaderTitle(pathname);

  // Protected route guard: Do not display admin dashboard or administrator information until authenticated
  if (isLoading || !session) {
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

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex">
      {/* Desktop Sidebar (visible on lg screens) */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 shadow-xs border-r border-slate-800/90">
        <AdminSidebar pathname={pathname} onLogout={logout} />
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
                  onLogout={logout}
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

          {/* Right Header: Notification + Admin Dropdown */}
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

            {/* Admin User Dropdown Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer outline-hidden"
                  >
                    <Avatar
                      size="sm"
                      className="bg-slate-900 text-white font-bold border border-slate-700"
                    >
                      <AvatarFallback>
                        {session.name
                          ? session.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "AD"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden md:block">
                      <span className="text-xs font-bold text-slate-900 block leading-tight">
                        {session.name}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block leading-tight">
                        {session.title}
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
                  onClick={() => router.push("/admin/settings")}
                  className="text-xs py-2 cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 mr-2 text-slate-500" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/admin/settings")}
                  className="text-xs py-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4 mr-2 text-slate-500" />
                  Settings
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

        {/* Admin Dashboard Content Container */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
