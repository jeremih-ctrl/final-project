"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  INITIAL_ADMIN_NOTIFICATIONS,
} from "@/lib/notifications-data";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>(
    INITIAL_ADMIN_NOTIFICATIONS
  );
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotif, setSelectedNotif] = useState<AdminNotification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleOpenDetail = (notif: AdminNotification) => {
    setSelectedNotif(notif);
    setDetailOpen(true);
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
  };

  const handleResetNotifications = () => {
    setNotifications(INITIAL_ADMIN_NOTIFICATIONS);
  };

  const handleInjectAdminEvent = (
    type: AdminNotification["type"],
    title: string,
    message: string,
    fullMessage: string,
    appNo: string,
    vendorName: string,
    status: string,
    actionUrl: string
  ) => {
    const newItem: AdminNotification = {
      id: `adm-notif-${Date.now()}`,
      type,
      title,
      message,
      fullMessage,
      applicationNumber: appNo,
      vendorName,
      status,
      read: false,
      createdAt: "Today • Just now",
      timeAgo: "Just now",
      actionLabel: "Review Application",
      actionUrl,
      priority: "high",
    };

    setNotifications((prev) => [newItem, ...prev]);
  };

  const getIconForType = (type: AdminNotification["type"]) => {
    switch (type) {
      case "new-application":
        return <FileCheck2 className="w-5 h-5 text-blue-600" />;
      case "correction-submitted":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "correction-requested":
        return <Clock className="w-5 h-5 text-amber-600" />;
      case "application-approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "document-uploaded":
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
          <Badge className="bg-orange-100 text-orange-950 border-orange-300 font-bold text-xs">
            Needs Correction
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-semibold text-xs">
            Under Review
          </Badge>
        );
      case "Submitted":
        return (
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 font-semibold text-xs">
            New Submission
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
      {/* Demo / Mock State Control Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Demo / Mock State
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              — Test simulated administrative event alerts:
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetNotifications}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-7 px-2 cursor-pointer gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Notifications
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Simulate alert:</span>
          <button
            type="button"
            onClick={() =>
              handleInjectAdminEvent(
                "new-application",
                "New Vendor Application",
                "A new vendor registration application has been submitted.",
                "A new vendor registration has been submitted by Juan Dela Cruz for Juan's Food Stall in Baan KM 3. Queued for evaluation.",
                "BVR-2026-001248",
                "Juan's Food Stall",
                "Submitted",
                "/admin/applications/BVR-2026-001248"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300 transition-all cursor-pointer"
          >
            + New Vendor Application
          </button>
          <button
            type="button"
            onClick={() =>
              handleInjectAdminEvent(
                "correction-submitted",
                "Vendor Submitted Corrections",
                "A vendor has submitted corrections for application BVR-2026-001248.",
                "Vendor Juan Dela Cruz submitted corrected street address and uploaded a replacement PhilSys ID for application BVR-2026-001248.",
                "BVR-2026-001248",
                "Juan's Food Stall",
                "Under Review",
                "/admin/applications/BVR-2026-001248"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300 transition-all cursor-pointer"
          >
            + Vendor Submitted Corrections
          </button>
          <button
            type="button"
            onClick={() =>
              handleInjectAdminEvent(
                "application-approved",
                "Application Approval Finalized",
                "Maria's Sari-Sari Store was approved. Vendor ID BUT-V-001247 issued.",
                "Administrative validation completed. Vendor ID BUT-V-001247 generated and certificate archived.",
                "BVR-2026-001247",
                "Maria's Sari-Sari Store",
                "Approved",
                "/admin/vendors"
              )
            }
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer"
          >
            + Application Approved
          </button>
        </div>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Admin Notifications &amp; System Alerts
            </h1>
            {unreadCount > 0 ? (
              <Badge className="bg-blue-700 text-white text-xs font-bold">
                {unreadCount} Unread
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-slate-500 font-medium">
                All Read
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Incoming vendor submissions, correction resubmissions, compliance alerts, and audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              Mark All as Read
            </Button>
          )}

          <Link
            href="/admin/applications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            Review Applications
          </Link>
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
                "px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer",
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
                {filter === "unread"
                  ? "No unread admin notifications in the queue."
                  : "No notifications found matching this filter."}
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
                onClick={() => handleOpenDetail(notif)}
                className={cn(
                  "relative rounded-2xl border transition-all cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                  isUnread
                    ? isCorrection
                      ? "bg-orange-50/40 border-orange-300 hover:border-orange-400 shadow-2xs"
                      : "bg-blue-50/30 border-blue-200 hover:border-blue-300 shadow-2xs"
                    : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                {/* Left accent bar for unread */}
                {isUnread && (
                  <span
                    className={cn(
                      "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
                      isCorrection ? "bg-orange-500" : "bg-blue-700"
                    )}
                  />
                )}

                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isCorrection
                        ? "bg-orange-100 border-orange-200"
                        : notif.type === "new-application"
                        ? "bg-blue-100 border-blue-200"
                        : notif.type === "application-approved"
                        ? "bg-emerald-100 border-emerald-200"
                        : "bg-slate-100 border-slate-200"
                    )}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {isUnread && (
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isCorrection ? "bg-orange-600 animate-pulse" : "bg-blue-700"
                          )}
                          title="Unread"
                        />
                      )}

                      <h3
                        className={cn(
                          "text-sm",
                          isUnread ? "font-extrabold text-slate-900" : "font-semibold text-slate-800"
                        )}
                      >
                        {notif.title}
                      </h3>

                      {getStatusBadge(notif.status)}

                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {notif.applicationNumber}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-600">Vendor: {notif.vendorName}</span>
                      <span>•</span>
                      <span>{notif.createdAt}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-500">{notif.timeAgo}</span>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {notif.actionLabel && notif.actionUrl && (
                    <Link
                      href={notif.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                        isCorrection
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-blue-700 hover:bg-blue-800 text-white"
                      )}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{notif.actionLabel}</span>
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        className="text-[11px] font-semibold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    )}

                    <span className="text-xs text-slate-400 group-hover:text-slate-600 hidden sm:inline">
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Admin Notification Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedNotif && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-2">
                  {getIconForType(selectedNotif.type)}
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {selectedNotif.applicationNumber}
                  </span>
                </div>
                {getStatusBadge(selectedNotif.status)}
              </div>

              <DialogTitle className="text-lg font-extrabold text-slate-900 pt-1">
                {selectedNotif.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Received: {selectedNotif.createdAt} ({selectedNotif.timeAgo})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Event Description
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedNotif.fullMessage}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg border border-slate-200 bg-white">
                <div>
                  <span className="text-slate-500">Registered Vendor:</span>
                  <p className="font-semibold text-slate-900">{selectedNotif.vendorName}</p>
                </div>
                <div>
                  <span className="text-slate-500">Application Number:</span>
                  <p className="font-mono font-bold text-slate-900">{selectedNotif.applicationNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Review Status:</span>
                  <p className="font-bold text-slate-900">{selectedNotif.status}</p>
                </div>
                <div>
                  <span className="text-slate-500">Administrative Priority:</span>
                  <p className={cn("font-bold capitalize", selectedNotif.priority === "high" ? "text-orange-700" : "text-slate-700")}>
                    {selectedNotif.priority} Priority
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDetailOpen(false)}
                className="cursor-pointer border-slate-300"
              >
                Close
              </Button>

              {selectedNotif.actionLabel && selectedNotif.actionUrl && (
                <Link
                  href={selectedNotif.actionUrl}
                  onClick={() => setDetailOpen(false)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-blue-700 hover:bg-blue-800 transition-all shadow-2xs"
                >
                  <Eye className="w-4 h-4" />
                  <span>{selectedNotif.actionLabel}</span>
                </Link>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
