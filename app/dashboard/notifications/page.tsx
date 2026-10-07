"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  XCircle,
  FileText,
  Sparkles,
  ArrowRight,
  RotateCcw,
  MailCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VendorNotification,
  INITIAL_VENDOR_NOTIFICATIONS,
  VENDOR_PRESET_TEMPLATES,
} from "@/lib/notifications-data";

export default function VendorNotificationsPage() {
  const [notifications, setNotifications] = useState<VendorNotification[]>(
    INITIAL_VENDOR_NOTIFICATIONS
  );
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedNotif, setSelectedNotif] = useState<VendorNotification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Filtered notifications
  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  // Handlers
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleOpenDetail = (notif: VendorNotification) => {
    setSelectedNotif(notif);
    setDetailOpen(true);
    // Mark as read when opened
    if (!notif.read) {
      handleMarkAsRead(notif.id);
    }
  };

  const handleResetDemo = () => {
    setNotifications(INITIAL_VENDOR_NOTIFICATIONS);
  };

  const handleInjectPreset = (presetKey: string) => {
    const template = VENDOR_PRESET_TEMPLATES[presetKey];
    if (!template) return;

    // Create unique item with fresh id
    const newItem: VendorNotification = {
      ...template,
      id: `v-notif-${Date.now()}`,
      read: false,
      createdAt: "Today • Just now",
      timeAgo: "Just now",
    };

    setNotifications((prev) => [newItem, ...prev]);
  };

  // Helper for notification icons
  const getIconForType = (type: VendorNotification["type"]) => {
    switch (type) {
      case "correction-requested":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "application-approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case "application-rejected":
        return <XCircle className="w-5 h-5 text-rose-600" />;
      case "correction-submitted":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "application-submitted":
        return <Clock className="w-5 h-5 text-amber-600" />;
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
          <Badge className="bg-orange-100 text-orange-950 border-orange-300 font-bold text-xs">
            ● Action Required
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-semibold text-xs">
            Under Review
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-semibold text-xs">
            Not Approved
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
      {/* Demo / Mock State Control Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-700" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Demo / Mock State
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              — Trigger simulated application events to test notifications:
            </span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDemo}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 h-7 px-2 cursor-pointer gap-1.5 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Notifications
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-medium text-slate-500 mr-1">Simulate event:</span>
          <button
            type="button"
            onClick={() => handleInjectPreset("correction-requested")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300 transition-all cursor-pointer"
          >
            ● Correction Requested
          </button>
          <button
            type="button"
            onClick={() => handleInjectPreset("correction-submitted")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300 transition-all cursor-pointer"
          >
            Correction Submitted
          </button>
          <button
            type="button"
            onClick={() => handleInjectPreset("approved")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition-all cursor-pointer"
          >
            Application Approved
          </button>
          <button
            type="button"
            onClick={() => handleInjectPreset("rejected")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 text-rose-900 hover:bg-rose-200 border border-rose-300 transition-all cursor-pointer"
          >
            Application Rejected
          </button>
          <button
            type="button"
            onClick={() => handleInjectPreset("submitted")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-all cursor-pointer"
          >
            Application Submitted
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Vendor Notifications
            </h1>
            {unreadCount > 0 ? (
              <Badge className="bg-blue-600 text-white text-xs font-bold">
                {unreadCount} Unread
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-slate-500 font-medium">
                All Read
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600">
            Official updates, administrative decisions, and action requests regarding application{" "}
            <span className="font-mono font-bold text-slate-800">BVR-2026-001248</span>.
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
            href="/application-status"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            Track Application
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
                  ? "bg-blue-600 text-white shadow-2xs"
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
                  ? "You don't have any unread notifications."
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
            const isNeedsCorrection = notif.type === "correction-requested";

            return (
              <div
                key={notif.id}
                onClick={() => handleOpenDetail(notif)}
                className={cn(
                  "relative rounded-2xl border transition-all cursor-pointer p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group",
                  isUnread
                    ? isNeedsCorrection
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
                      isNeedsCorrection ? "bg-orange-500" : "bg-blue-600"
                    )}
                  />
                )}

                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                      isNeedsCorrection
                        ? "bg-orange-100 border-orange-200"
                        : notif.type === "application-approved"
                        ? "bg-emerald-100 border-emerald-200"
                        : notif.type === "application-rejected"
                        ? "bg-rose-100 border-rose-200"
                        : "bg-slate-100 border-slate-200"
                    )}
                  >
                    {getIconForType(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Unread indicator dot */}
                      {isUnread && (
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            isNeedsCorrection ? "bg-orange-600 animate-pulse" : "bg-blue-600"
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

                      {notif.vendorId && (
                        <Badge variant="outline" className="font-mono text-[11px] text-emerald-800 border-emerald-300">
                          ID: {notif.vendorId}
                        </Badge>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <span>App: {notif.applicationNumber}</span>
                      <span>•</span>
                      <span>{notif.createdAt}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-500">{notif.timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  {notif.actionLabel && notif.actionUrl && (
                    <Link
                      href={notif.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs",
                        isNeedsCorrection
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      <span>{notif.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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

      {/* Notification Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        {selectedNotif && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <div className="flex items-center gap-2">
                  {getIconForType(selectedNotif.type)}
                  <span className="text-xs font-mono font-bold text-slate-500">
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
              {/* Full Message */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Notification Details
                </span>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {selectedNotif.fullMessage}
                </p>
              </div>

              {/* Vendor ID if Approved */}
              {selectedNotif.vendorId && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Issued Vendor ID
                    </span>
                    <span className="font-mono text-base font-extrabold text-emerald-950">
                      {selectedNotif.vendorId}
                    </span>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-semibold">Active ID</Badge>
                </div>
              )}

              {/* Administrator Remarks if present */}
              {selectedNotif.remarks && (
                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
                  <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                    Administrator Remarks:
                  </span>
                  <p className="text-xs sm:text-sm text-orange-950 italic font-medium">
                    &ldquo;{selectedNotif.remarks}&rdquo;
                  </p>
                </div>
              )}

              {/* Application Details Summary */}
              <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-lg border border-slate-200 bg-white">
                <div>
                  <span className="text-slate-500">Application No.:</span>
                  <p className="font-mono font-bold text-slate-900">{selectedNotif.applicationNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500">Application Status:</span>
                  <p className="font-bold text-slate-900">{selectedNotif.status}</p>
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
                  className={cn(
                    "inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all",
                    selectedNotif.type === "correction-requested"
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  <span>{selectedNotif.actionLabel}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
