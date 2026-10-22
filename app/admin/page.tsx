"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Archive,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStoredApplications,
  useDeletedApplicationIds,
  setApplicationsFromRemote,
} from "@/lib/application-store";
import { computeAdminDashboardAnalytics } from "@/lib/admin-analytics";
import type { VendorApplication } from "@/lib/types/vendor-application";

export default function AdminDashboardPage() {
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();
  const [serverApps, setServerApps] = useState<VendorApplication[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Authoritative server data fetch
  const loadApplications = useCallback(() => {
    setIsLoading(true);
    setFetchError(null);
    fetch("/api/admin/applications", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData?.error || `HTTP ${r.status}: Failed to retrieve registry records.`);
        }
        return r.json();
      })
      .then((data) => {
        if (data?.applications && Array.isArray(data.applications)) {
          setServerApps(data.applications);
          setApplicationsFromRemote(data.applications);
        } else {
          setServerApps([]);
        }
      })
      .catch((err) => {
        console.error("Failed to load server applications for admin dashboard:", err);
        setFetchError(
          err instanceof Error ? err.message : "Unable to retrieve registry records from the server."
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Synchronize applications from server persistent database on mount
  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // Use authoritative server data once loaded, falling back to storedApplications only if cached
  const effectiveApps = useMemo(() => {
    if (serverApps !== null) {
      return serverApps;
    }
    return storedApplications;
  }, [serverApps, storedApplications]);

  // Compute canonical municipal statistics and status distribution
  const stats = useMemo(() => {
    return computeAdminDashboardAnalytics(effectiveApps, deletedApplicationIds);
  }, [effectiveApps, deletedApplicationIds]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* 1. Page Welcome / Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Admin Dashboard
            </h1>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Live Registry
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            City Government of Butuan • Overview of Butuan City vendor registrations, compliance, and pending approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadApplications}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer gap-1.5"
            title="Reload registry records from server"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin")} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Link
            href="/admin/applications"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer gap-1.5 shadow-2xs h-9 px-4 rounded-xl"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Process Applications</span>
          </Link>
        </div>
      </div>

      {/* Honest Error Banner if Database Request Fails */}
      {fetchError && effectiveApps.length === 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-800">Connection or Authorization Issue</p>
              <p className="text-xs text-rose-700">{fetchError}</p>
            </div>
          </div>
          <Button
            onClick={loadApplications}
            variant="outline"
            size="sm"
            className="h-8 border-rose-300 text-rose-800 hover:bg-rose-100 text-xs shrink-0 rounded-xl cursor-pointer"
          >
            Retry Loading
          </Button>
        </div>
      )}

      {/* 2. Summary Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Applications */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100/80 shrink-0">
              <Store className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {stats.totalCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              All registered records
            </p>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/70 px-2 py-0.5 rounded-md">
                {stats.activeCount} Active
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                {stats.archivedCount} Archived
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Pending Review */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80 shrink-0">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 tracking-tight">
              {stats.pendingReviewCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Awaiting admin decision
            </p>
          </div>
        </Card>

        {/* Card 3: Approved Vendors */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Vendors
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 shrink-0">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {stats.approvedCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Active certified vendors
            </p>
          </div>
        </Card>

        {/* Card 4: Needs Action */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Needs Action
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center border border-rose-100/80 shrink-0">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="space-y-1 mt-2">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 tracking-tight">
              {stats.needsActionCount.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Requires vendor correction
            </p>
          </div>
        </Card>
      </div>

      {/* 3. Application Status Overview */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100">
          <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
            Application Status Overview
          </CardTitle>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Distribution across active workflows and archived records.
          </p>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-5">
          {/* Horizontal multi-color visual bar */}
          <div className="space-y-1.5">
            <div
              role="progressbar"
              aria-label="Application status distribution"
              className="h-4 sm:h-5 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-2xs p-0.5 gap-0.5"
            >
              {stats.totalCount === 0 ? (
                <div className="bg-slate-200 h-full w-full rounded-full flex items-center justify-center text-[10px] text-slate-500 font-medium">
                  No applications in registry
                </div>
              ) : (
                stats.statusDistribution
                  .filter((seg) => seg.count > 0)
                  .map((seg) => (
                    <div
                      key={seg.key}
                      className={cn(
                        "h-full first:rounded-l-full last:rounded-r-full transition-all duration-300",
                        seg.bgClass
                      )}
                      style={{ width: `${seg.numericPct}%` }}
                      title={`${seg.label}: ${seg.count} (${seg.pct}%)`}
                    />
                  ))
              )}
            </div>
          </div>

          {/* Concise Legend Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 text-xs">
            {stats.statusDistribution.map((item) => (
              <div
                key={item.key}
                className={cn(
                  "p-3 rounded-xl border flex flex-col justify-between transition-colors",
                  item.isArchived
                    ? "bg-slate-50/70 border-dashed border-slate-300 text-slate-800"
                    : "bg-white border-slate-200/80 text-slate-900",
                  item.count === 0 && "opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {item.isArchived ? (
                      <Archive className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <span className={cn("w-2 h-2 rounded-full shrink-0", item.dotClass)} />
                    )}
                    <span className="font-semibold text-xs truncate">
                      {item.label}
                    </span>
                  </div>
                  {item.isArchived && (
                    <Badge variant="outline" className="text-[9px] font-semibold text-slate-500 bg-slate-100/80 border-slate-300 px-1 py-0 h-3.5 shrink-0">
                      Archived
                    </Badge>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 mt-2.5">
                  <span className="text-lg sm:text-xl font-extrabold tracking-tight">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    ({item.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
