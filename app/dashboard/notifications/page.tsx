"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
  MailCheck,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VendorNotification,
  useVendorNotifications,
  formatRelativeTime,
} from "@/lib/notifications-data";

export default function VendorNotificationsPage() {
  const router = useRouter();
  const [, setTick] = useState(0);

  // Periodically trigger a re-render to naturally update relative times every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    reset,
    addNotification,
  } = useVendorNotifications("BVR-2026-001248");

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  const handleNotificationClick = (notif: VendorNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    const destination =
      notif.actionUrl ||
      notif.href ||
      "/dashboard/my-application";
    router.push(destination);
  };

  const handleMarkAsReadOnly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const getIconForType = (type: VendorNotification["type"]) => {
    switch (type) {
      case "correction-requested":
      case "document-replacement":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "application-approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "application-rejected":
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case "document-verified":
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case "correction-submitted":
      case "application-submitted":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "document-received":
        return <FileText className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold text-xs">
            Approved
          </Badge>
        );
      case "Needs Correction":
        return (
          <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-bold text-xs">
            Action Required
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-blue-100 text-blue-950 border-blue-300 font-semibold text-xs">
            Under Review
          </Badge>
        );
      case "Submitted":
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200 font-semibold text-xs">
            Submitted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-rose-100 text-rose-900 border-rose-300 font-semibold text-xs">
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 font-semibold text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Vendor Notifications
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Official notices for Application #
                <span className="font-mono font-bold text-slate-700">BVR-2026-001248</span>
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 pt-1">
            Status updates, action requests, inspection results, and approval notices from the City Government of Butuan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1">
              {unreadCount} Unread
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-slate-500 font-medium bg-slate-50">
              All Caught Up
            </Badge>
          )}

          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5">
          {(["all", "unread", "read"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
                filter === tab
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {tab === "all"
                ? `All (${notifications.length})`
                : tab === "unread"
                ? `Unread (${unreadCount})`
                : `Read (${notifications.length - unreadCount})`}
            </button>
          ))}
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Showing {filteredNotifications.length} notification{filteredNotifications.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <MailCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">You&apos;re all caught up</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                There are no new notifications at this time.
              </p>
            </div>
            {filter !== "all" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFilter("all")}
                className="text-xs font-semibold cursor-pointer"
              >
                Show All Notifications
              </Button>
            )}
          </Card>
        ) : (
          filteredNotifications.map((notif) => {
            const isUnread = !notif.read;
            const isCorrection =
              notif.type === "correction-requested" ||
              notif.type === "document-replacement";

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "relative rounded-2xl border transition-all cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                  isUnread
                    ? isCorrection
                      ? "bg-amber-50/50 border-amber-300 hover:border-amber-400 shadow-2xs"
                      : "bg-blue-50/40 border-blue-200 hover:border-blue-300 shadow-2xs"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60 opacity-90 hover:opacity-100"
                )}
              >
                {/* Visual Unread Accent Indicator */}
                {isUnread && (
                  <span
                    className={cn(
                      "absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full",
                      isCorrection ? "bg-amber-500" : "bg-blue-600"
                    )}
                  />
                )}

                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isCorrection
                        ? "bg-amber-100 border-amber-200"
                        : notif.type === "application-approved"
                        ? "bg-emerald-100 border-emerald-200"
                        : notif.type === "application-rejected"
                        ? "bg-rose-100 border-rose-200"
                        : notif.type === "document-verified"
                        ? "bg-emerald-100 border-emerald-200"
                        : "bg-slate-100 border-slate-200"
                    )}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unread bullet indicator */}
                      {isUnread && (
                        <span
                          className={cn(
                            "text-sm font-black select-none",
                            isCorrection ? "text-amber-600" : "text-blue-600"
                          )}
                          title="Unread notification"
                        >
                          ●
                        </span>
                      )}

                      <h3
                        className={cn(
                          "text-sm leading-snug",
                          isUnread
                            ? "font-extrabold text-slate-900"
                            : "font-semibold text-slate-700"
                        )}
                      >
                        {notif.title}
                      </h3>

                      {notif.status && getStatusBadge(notif.status)}

                      {notif.vendorId && (
                        <Badge
                          variant="outline"
                          className="font-mono text-[11px] text-emerald-800 border-emerald-300 bg-emerald-50"
                        >
                          Vendor ID: {notif.vendorId}
                        </Badge>
                      )}
                    </div>

                    <p
                      className={cn(
                        "text-xs sm:text-sm line-clamp-2 leading-relaxed",
                        isUnread ? "text-slate-800 font-medium" : "text-slate-600"
                      )}
                    >
                      {notif.message}
                    </p>

                    {/* Show remarks if available (e.g. rejection or correction reasons) */}
                    {notif.remarks && (
                      <p className="text-xs bg-amber-100/70 text-amber-950 p-2 rounded-lg border border-amber-200/80 italic font-medium">
                        &ldquo;{notif.remarks}&rdquo;
                      </p>
                    )}

                    {/* Metadata line: Details and ONLY ONE relative timestamp */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                      {notif.applicationNumber && (
                        <>
                          <span className="font-semibold text-slate-700">
                            Application: {notif.applicationNumber}
                          </span>
                          <span>•</span>
                        </>
                      )}
                      <span
                        suppressHydrationWarning
                        className="font-medium text-slate-500"
                      >
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {notif.actionLabel && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                        isCorrection
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      <span>{notif.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsReadOnly(notif.id, e)}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    )}

                    <span className="text-xs text-slate-400 group-hover:text-slate-600 hidden sm:inline">
                      View &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Subtle Development Simulation Area */}
      <details className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-500 group">
        <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900 select-none flex items-center justify-between p-2 rounded-lg hover:bg-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-500" />
            <span>Developer Simulation Controls (Testing only)</span>
          </div>
          <span className="text-[11px] text-slate-400">Click to expand</span>
        </summary>
        <div className="p-4 mt-2 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-slate-600">
              Trigger simulated application events to test vendor alerts:
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={reset}
              className="text-xs cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Notification Store
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                addNotification({
                  type: "correction-requested",
                  title: "Action Required: Application Correction",
                  message:
                    "Your vendor registration application requires corrections before it can be approved.",
                  fullMessage:
                    "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
                  remarks:
                    "Please provide a clearer business address and replace the submitted government ID image with a readable copy.",
                  applicationNumber: "BVR-2026-001248",
                  vendorName: "Juan's Food Stall",
                  status: "Needs Correction",
                  actionLabel: "Review Application",
                  actionUrl: "/dashboard/my-application/correction",
                  href: "/dashboard/my-application/correction",
                  priority: "high",
                })
              }
              className="text-xs cursor-pointer bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            >
              + Correction Required
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                addNotification({
                  type: "application-approved",
                  title: "Vendor Registration Approved",
                  message:
                    "Your vendor registration application has been approved by the City Government of Butuan.",
                  fullMessage:
                    "Your vendor registration application BVR-2026-001248 has been approved. Your official Vendor ID BUT-V-001248 has been issued.",
                  applicationNumber: "BVR-2026-001248",
                  vendorName: "Juan's Food Stall",
                  vendorId: "BUT-V-001248",
                  status: "Approved",
                  actionLabel: "View Application",
                  actionUrl: "/dashboard/my-application",
                  href: "/dashboard/my-application",
                  priority: "high",
                })
              }
              className="text-xs cursor-pointer bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
            >
              + Application Approved
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                addNotification({
                  type: "application-rejected",
                  title: "Vendor Registration Application Rejected",
                  message:
                    "Your vendor registration application has been reviewed and rejected.",
                  fullMessage:
                    "Your vendor registration application has been reviewed and rejected. Reason: Location violates municipal zoning restrictions.",
                  remarks: "Location violates municipal zoning restrictions.",
                  applicationNumber: "BVR-2026-001248",
                  vendorName: "Juan's Food Stall",
                  status: "Rejected",
                  actionLabel: "View Application",
                  actionUrl: "/dashboard/my-application",
                  href: "/dashboard/my-application",
                  priority: "high",
                })
              }
              className="text-xs cursor-pointer bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
            >
              + Application Rejected
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                addNotification({
                  type: "document-verified",
                  title: "Government ID Verified",
                  message:
                    "Your submitted government ID has been reviewed and verified.",
                  fullMessage:
                    "The Philippine National ID submitted for application BVR-2026-001248 has been verified by the City Licensing Office.",
                  applicationNumber: "BVR-2026-001248",
                  vendorName: "Juan's Food Stall",
                  status: "Under Review",
                  actionLabel: "View Application",
                  actionUrl: "/dashboard/my-application",
                  href: "/dashboard/my-application",
                  priority: "normal",
                })
              }
              className="text-xs cursor-pointer bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100"
            >
              + Government ID Verified
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                addNotification({
                  type: "document-replacement",
                  title: "Government ID Replacement Required",
                  message:
                    "The submitted government ID could not be verified. Please provide a valid replacement document.",
                  fullMessage:
                    "The submitted government ID image for application BVR-2026-001248 could not be verified. Please provide a valid replacement document.",
                  applicationNumber: "BVR-2026-001248",
                  vendorName: "Juan's Food Stall",
                  status: "Needs Correction",
                  actionLabel: "Update Documents",
                  actionUrl: "/dashboard/my-application/correction",
                  href: "/dashboard/my-application/correction",
                  priority: "high",
                })
              }
              className="text-xs cursor-pointer bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
            >
              + ID Replacement Required
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}
