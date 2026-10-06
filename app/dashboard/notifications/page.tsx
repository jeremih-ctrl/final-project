"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCheck,
  Clock,
  CheckCircle2,
  Files,
  Trash2,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  date: string;
  read: boolean;
  category: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Application Under Review",
    description: "Your vendor registration is currently being reviewed.",
    date: "October 6, 2026",
    read: false,
    category: "Application Status",
  },
  {
    id: "notif-2",
    title: "Registration Submitted",
    description: "Your registration has been successfully submitted.",
    date: "October 6, 2026",
    read: false,
    category: "Registration",
  },
  {
    id: "notif-3",
    title: "Document Received",
    description:
      "Your Government ID (government-id.pdf) has been attached to application BVR-2026-001248.",
    date: "October 6, 2026",
    read: true,
    category: "Documents",
  },
  {
    id: "notif-4",
    title: "Welcome to Butuan Vendor Portal",
    description:
      "Welcome to the official vendor registry of Butuan City. Your account record has been initialized.",
    date: "October 6, 2026",
    read: true,
    category: "System",
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: !item.read } : item
      )
    );
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleResetNotifications = () => {
    setNotifications(INITIAL_NOTIFICATIONS);
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "read") return item.read;
    return true;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Notifications
            </h2>
            {unreadCount > 0 ? (
              <Badge className="bg-blue-600 text-white border-blue-700 text-xs font-semibold">
                {unreadCount} Unread
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-slate-500 bg-slate-50">
                All Read
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Stay informed about your application progress and municipal updates.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer gap-1.5"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all as read</span>
            </Button>
          )}

          {notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer gap-1"
              title="Clear all notifications to preview empty state"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetNotifications}
              className="text-xs font-medium text-slate-700 cursor-pointer gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Notifications</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      {notifications.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
              filter === "all"
                ? "bg-slate-900 text-white font-semibold shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("unread")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
              filter === "unread"
                ? "bg-blue-600 text-white font-semibold shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("read")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
              filter === "read"
                ? "bg-slate-900 text-white font-semibold shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            Read ({notifications.length - unreadCount})
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer ml-auto"
          >
            Empty State Preview
          </button>
        </div>
      )}

      {/* Semantic reference for empty state accessibility */}
      <div className="sr-only">
        <h3>You&apos;re all caught up</h3>
        <p>You don&apos;t have any new notifications.</p>
      </div>

      {/* 8. Notification List or 9. Empty State */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card
              key={notif.id}
              className={cn(
                "rounded-2xl transition-all shadow-2xs overflow-hidden border",
                notif.read
                  ? "bg-white border-slate-200/90 border-l-4 border-l-transparent"
                  : "bg-blue-50/40 border-blue-200/90 border-l-4 border-l-blue-600 shadow-xs"
              )}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Category icon */}
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      notif.read
                        ? "bg-slate-100 text-slate-500"
                        : "bg-blue-100 text-blue-700 shadow-2xs"
                    )}
                  >
                    {notif.category === "Application Status" ? (
                      <Clock className="w-5 h-5 text-amber-600" />
                    ) : notif.category === "Registration" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Files className="w-5 h-5 text-blue-600" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        className={cn(
                          "text-sm font-bold leading-tight",
                          notif.read ? "text-slate-800" : "text-slate-950 font-extrabold"
                        )}
                      >
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Unread
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        • {notif.date}
                      </span>
                    </div>

                    <p
                      className={cn(
                        "text-xs sm:text-sm leading-relaxed",
                        notif.read ? "text-slate-600" : "text-slate-900 font-medium"
                      )}
                    >
                      {notif.description}
                    </p>

                    <div className="pt-0.5">
                      <span className="text-[11px] font-medium text-slate-400">
                        Category: {notif.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual Notification Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleToggleRead(notif.id)}
                    className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    {notif.read ? "Mark unread" : "Mark as read"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(notif.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* 9. Empty Notification State */
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-8 sm:p-14 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm mx-auto">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                You&apos;re all caught up
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                You don&apos;t have any new notifications.
              </p>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetNotifications}
                className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore Sample Notifications</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helpful Municipal Notice */}
      <div className="p-4 rounded-xl bg-slate-100/70 border border-slate-200/80 text-xs text-slate-600 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            Official notifications are also sent via SMS to your registered mobile number:{" "}
            <span className="font-mono font-semibold text-slate-800">09XXXXXXXXX</span>
          </span>
        </div>
        <Link
          href="/application-status"
          className="text-blue-700 hover:text-blue-900 font-semibold shrink-0 hidden sm:inline"
        >
          Check Real-Time Status →
        </Link>
      </div>
    </div>
  );
}
