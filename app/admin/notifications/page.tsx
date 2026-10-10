"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  FileText,
  RotateCcw,
  Sparkles,
  Eye,
  MailCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AdminNotification,
  useAdminNotifications,
  formatRelativeTime,
} from "@/lib/notifications-data";

export default function AdminNotificationsPage() {
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
  } = useAdminNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  const handleNotificationClick = (notif: AdminNotification) => {
    if (!notif.read) {
      markAsRead(notif.id);
    }
    const destination =
      notif.actionUrl ||
      notif.href ||
      (notif.applicationNumber
        ? `/admin/applications/${notif.applicationNumber}`
        : "/admin/applications");
    router.push(destination);
  };

  const handleMarkAsReadOnly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const getIconForType = (type: AdminNotification["type"]) => {
    switch (type) {
      case "new-application":
        return <FileCheck2 className="w-5 h-5 text-blue-700" />;
      case "correction-submitted":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "correction-requested":
        return <Clock className="w-5 h-5 text-amber-600" />;
      case "application-approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "application-rejected":
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case "document-uploaded":
      case "document-verified":
      case "document-replacement":
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
            Needs Correction
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
          <Badge className="bg-rose-100 text-rose-900 border-rose-200 font-semibold text-xs">
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
      {/* Real Administrative Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Administrative Notifications
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                City Government of Butuan • Business Licensing &amp; Vendor Registry
              </p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 pt-1">
            Official alerts for new vendor registrations, resubmitted corrections, document verifications, and status changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Badge className="bg-blue-700 text-white text-xs font-bold px-2.5 py-1">
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
              <h3 className="text-base font-bold text-slate-900">You&apos;re all caught up. No notifications are available.</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                All vendor alerts and activity notices will be displayed here as they arrive.
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
            const isCorrection = notif.type === "correction-submitted";

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
                      isCorrection ? "bg-amber-500" : "bg-blue-700"
                    )}
                  />
                )}

                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isCorrection
                        ? "bg-amber-100 border-amber-200"
                        : notif.type === "new-application"
                        ? "bg-blue-100 border-blue-200"
                        : notif.type === "application-approved"
                        ? "bg-emerald-100 border-emerald-200"
                        : notif.type === "document-uploaded"
                        ? "bg-blue-100 border-blue-200"
                        : "bg-slate-100 border-slate-200"
                    )}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unread dot symbol as required */}
                      {isUnread && (
                        <span
                          className={cn(
                            "text-sm font-black select-none",
                            isCorrection ? "text-amber-600" : "text-blue-700"
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

                      {notif.applicationNumber && (
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {notif.applicationNumber}
                        </span>
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

                    {/* Metadata line: Details and single relative timestamp */}
                    <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                      {notif.vendorName && (
                        <>
                          <span className="font-semibold text-slate-700">
                            Vendor: {notif.vendorName}
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

                {/* Action button & Mark as Read */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {notif.actionLabel && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                        isCorrection
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-blue-700 hover:bg-blue-800 text-white"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{notif.actionLabel}</span>
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
                      Review &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
