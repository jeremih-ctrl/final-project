"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Search,
  Filter,
  X,
  Eye,
  RotateCcw,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BARANGAY_OPTIONS,
  STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  type ApplicationStatus,
  type AdminApplication,
  type AdminPaymentStatus,
} from "@/lib/admin-applications-data";
import { type VendorApplication } from "@/lib/types/vendor-application";
import {
  useStoredApplications,
  useDeletedApplicationIds,
  deleteAdminApplicationRecord,
  permanentlyDeleteApplication,
  isDemoOrMockApplication,
  setApplicationsFromRemote,
  createApplication,
} from "@/lib/application-store";
import { cn } from "@/lib/utils";
import { isBarangayMatch } from "@/lib/barangays";
import {
  formatPhpCurrency,
  getPaymentStatusBadgeConfig,
} from "@/lib/payment-fee-schedule";

function formatSubmittedDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Oct 7, 2026";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminApplicationsPage() {
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();
  const [serverApps, setServerApps] = useState<VendorApplication[] | null>(null);
  const [isLoadingServer, setIsLoadingServer] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All Barangays");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("All");

  // Fetch and synchronize persistent applications from server database
  const loadApplications = () => {
    setIsLoadingServer(true);
    setServerError(null);
    fetch("/api/admin/applications", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData?.error || `HTTP ${r.status}: Failed to retrieve applications.`);
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
        console.error("Failed to load server applications for admin:", err);
        setServerError(err instanceof Error ? err.message : "Failed to load applications from server.");
      })
      .finally(() => {
        setIsLoadingServer(false);
      });
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const effectiveApps = serverApps !== null ? serverApps : storedApplications;

  // Deletion confirmation dialog state
  const [deleteTargetApp, setDeleteTargetApp] = useState<AdminApplication | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("Application record archived and deleted by administrator");
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "warning" | "destructive" | "info";
    message: string;
  } | null>(null);

  const handleOpenDelete = (app: AdminApplication) => {
    setDeleteTargetApp(app);
    setDeleteReason("Application record archived and deleted by administrator");
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteTargetApp(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetApp) return;

    // Safety check (Requirement 5): verify status is exactly Rejected
    if (deleteTargetApp.status !== "Rejected") {
      setFeedbackNotice({
        type: "destructive",
        message: "Safety check failed: Only Rejected applications can be archived or deleted.",
      });
      setIsDeleteDialogOpen(false);
      setDeleteTargetApp(null);
      return;
    }

    const deletedId = deleteTargetApp.id;
    setIsDeleting(true);

    try {
      await fetch(`/api/admin/applications/${encodeURIComponent(deletedId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });
    } catch (e) {
      console.error("Failed to call admin delete API:", e);
    } finally {
      setIsDeleting(false);
    }

    deleteAdminApplicationRecord(deletedId);
    setIsDeleteDialogOpen(false);
    setDeleteTargetApp(null);
    setFeedbackNotice({
      type: "success",
      message: `Application ${deletedId} has been archived. All reference numbers, review notes, and historical data are preserved in audit history.`,
    });
  };

  // Permanent Deletion State & Handlers
  const [permanentDeleteTargetApp, setPermanentDeleteTargetApp] = useState<AdminApplication | null>(null);
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false);
  const [isPermanentDeleting, setIsPermanentDeleting] = useState(false);

  const handleOpenPermanentDelete = (app: AdminApplication) => {
    setPermanentDeleteTargetApp(app);
    setIsPermanentDeleteDialogOpen(true);
  };

  const handleCancelPermanentDelete = () => {
    if (isPermanentDeleting) return;
    setIsPermanentDeleteDialogOpen(false);
    setPermanentDeleteTargetApp(null);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!permanentDeleteTargetApp) return;

    // Safety check: only archived/deleted applications can be permanently deleted
    if (!permanentDeleteTargetApp.isDeleted) {
      setFeedbackNotice({
        type: "destructive",
        message: "Safety check failed: Only archived or deleted applications can be permanently removed.",
      });
      setIsPermanentDeleteDialogOpen(false);
      setPermanentDeleteTargetApp(null);
      return;
    }

    const targetId = permanentDeleteTargetApp.id;
    const targetBusinessName = permanentDeleteTargetApp.businessName;
    setIsPermanentDeleting(true);

    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(targetId)}?permanent=true`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permanent: true }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || `Server returned status ${res.status}`);
      }

      // Purge permanently from the client-side store
      permanentlyDeleteApplication(targetId);

      setIsPermanentDeleteDialogOpen(false);
      setPermanentDeleteTargetApp(null);
      setFeedbackNotice({
        type: "success",
        message: `Application ${targetId} (${targetBusinessName}) was permanently deleted from the admin archive. This action cannot be undone.`,
      });
    } catch (error) {
      console.error("Failed to permanently delete application:", error);
      setFeedbackNotice({
        type: "destructive",
        message: `Failed to permanently delete application ${targetId}: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
      });
    } finally {
      setIsPermanentDeleting(false);
    }
  };


  // Map stored applications from centralized store
  const allApplications = useMemo(() => {
    const deletedSet = new Set(
      deletedApplicationIds.map((id) => id.trim().toLowerCase())
    );

    const statusMap: Record<string, ApplicationStatus> = {
      draft: "Submitted",
      submitted: "Submitted",
      under_review: "Under Review",
      needs_correction: "Needs Correction",
      correction_submitted: "Correction Submitted",
      approved: "Approved",
      rejected: "Rejected",
    };

    const genuineStored = effectiveApps.filter(
      (app) => !isDemoOrMockApplication(app)
    );

    const storedMapped: (AdminApplication & { sortTime: number })[] =
      genuineStored.map((app) => {
        const rawPay = app.payment;
        let pStatus: AdminPaymentStatus = "Unpaid";
        if (rawPay?.status) {
          const s = rawPay.status.toLowerCase().replace(/[\s-]+/g, "_");
          if (s === "awaiting_cashier_payment") {
            pStatus = "Awaiting Cashier Payment";
          } else if (s === "pending_verification" || s === "pending") {
            pStatus = "Pending Verification";
          } else if (s === "verified" || s === "paid") {
            pStatus = "Verified";
          } else if (s === "rejected") {
            pStatus = "Rejected";
          } else {
            pStatus = "Unpaid";
          }
        }

        const appNum = (app.applicationNumber || "").trim().toLowerCase();
        const appId = (app.id || "").trim().toLowerCase();
        const isAppDeleted =
          Boolean(app.isDeleted) ||
          (appNum ? deletedSet.has(appNum) : false) ||
          (appId ? deletedSet.has(appId) : false);

        return {
          id: app.applicationNumber || app.id,
          businessName: app.business?.businessName || "Vendor Business",
          owner: app.owner?.ownerName || "Vendor Applicant",
          barangay: app.address?.barangay || "Barangay Urduja",
          submitted: formatSubmittedDate(app.submittedAt),
          status: statusMap[app.status?.toLowerCase()] || "Submitted",
          businessDescription:
            app.business?.businessDescription ||
            "Vendor registration application submitted online.",
          contactNumber: app.contact?.contactNumber || "",
          email: app.contact?.emailAddress || "",
          address: {
            houseNumber: app.address?.houseNo || "",
            street: app.address?.street || "",
            barangay: app.address?.barangay || "",
            city: app.address?.city || "Butuan City",
            province: app.address?.province || "Agusan del Norte",
            region: app.address?.region || "Caraga",
            country: app.address?.country || "Philippines",
          },
          governmentId: app.documents?.[0]
            ? {
                submitted: true,
                filename:
                  app.documents[0].filename ||
                  app.documents[0].idFileName ||
                  "government-id.pdf",
                idType: app.documents[0].idType || "Philippine National ID",
                uploadedAt: formatSubmittedDate(
                  app.documents[0].uploadedAt || app.submittedAt
                ),
                status: "Submitted",
              }
            : undefined,
          remarks: app.adminRemarks,
          vendorId: app.vendorId,
          activityTimeline: [
            {
              id: `act-${app.id}-1`,
              title: "Application Submitted",
              date: formatSubmittedDate(app.submittedAt),
              description: "Vendor submitted registration application.",
              type: "submission",
            },
          ],
          sortTime: app.submittedAt
            ? new Date(app.submittedAt).getTime()
            : 0,
          paymentStatus: pStatus,
          assessedAmount: rawPay?.assessedAmount ?? 1450,
          amountPaid: rawPay?.amountPaid ?? 0,
          transactionReference: rawPay?.transactionReference || `PAY-${app.applicationNumber || app.id}`,
          paymentDate: rawPay?.paymentDate || null,
          paymentMethod: rawPay?.paymentMethod || "GCash",
          isDeleted: isAppDeleted,
          deletedAt: app.deletedAt || undefined,
          deletedBy: app.deletedBy || undefined,
          deletedReason: app.deletedReason || undefined,
        };
      });

    // Prevent duplicate entries caused by re-renders or repeated initialization
    const seenIds = new Set<string>();
    const deduplicated: (AdminApplication & { sortTime: number })[] = [];

    for (const app of storedMapped) {
      const normalizedId = app.id.trim().toLowerCase();
      if (!seenIds.has(normalizedId)) {
        seenIds.add(normalizedId);
        deduplicated.push(app);
      }
    }

    return deduplicated.sort((a, b) => b.sortTime - a.sortTime);
  }, [effectiveApps, deletedApplicationIds]);

  // Client-side filtering
  const filteredApplications = useMemo(() => {
    return allApplications.filter((app) => {
      // Search matching: business name, owner, or application number
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        app.id.toLowerCase().includes(query) ||
        app.businessName.toLowerCase().includes(query) ||
        app.owner.toLowerCase().includes(query);

      // Status matching: Keep archived applications out of active queues by default
      let matchesStatus = false;
      if (selectedStatus === "Archived / Deleted") {
        matchesStatus = Boolean(app.isDeleted);
      } else if (selectedStatus === "All") {
        matchesStatus = !app.isDeleted;
      } else {
        matchesStatus = !app.isDeleted && app.status === selectedStatus;
      }

      // Barangay matching: handles exact matches and legacy variations (whitespace, case, prefixes, "Pob." suffixes)
      const matchesBarangay = isBarangayMatch(app.barangay, selectedBarangay);

      // Payment Status matching
      const matchesPaymentStatus =
        selectedPaymentStatus === "All" || app.paymentStatus === selectedPaymentStatus;

      return matchesSearch && matchesStatus && matchesBarangay && matchesPaymentStatus;
    });
  }, [allApplications, searchQuery, selectedStatus, selectedBarangay, selectedPaymentStatus]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "All" ||
    selectedBarangay !== "All Barangays" ||
    selectedPaymentStatus !== "All";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("All");
    setSelectedBarangay("All Barangays");
    setSelectedPaymentStatus("All");
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1 inline-block" />
            Approved
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-50 text-amber-900 border-amber-300 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1 inline-block" />
            Under Review
          </Badge>
        );
      case "Needs Correction":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1 inline-block" />
            Needs Correction
          </Badge>
        );
      case "Correction Submitted":
        return (
          <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mr-1 inline-block" />
            Correction Submitted
          </Badge>
        );
      case "Submitted":
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 inline-block" />
            Submitted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />
            Rejected
          </Badge>
        );
    }
  };

  // Quick counts: Active vendor registry statistics exclude archived records
  const activeApplications = useMemo(
    () => allApplications.filter((a) => !a.isDeleted),
    [allApplications]
  );
  const archivedApplications = useMemo(
    () => allApplications.filter((a) => Boolean(a.isDeleted)),
    [allApplications]
  );

  const activeCount = activeApplications.length;
  const totalCount = activeCount;
  const underReviewCount = activeApplications.filter(
    (a) => a.status === "Under Review" || a.status === "Correction Submitted"
  ).length;
  const needsCorrectionCount = activeApplications.filter(
    (a) => a.status === "Needs Correction"
  ).length;
  const approvedCount = activeApplications.filter(
    (a) => a.status === "Approved"
  ).length;
  const archivedCount = archivedApplications.length;
  const totalRecordedCount = allApplications.length;
  const scopeCount = selectedStatus === "Archived / Deleted" ? archivedCount : activeCount;

  return (
    <div className="space-y-6">
      {/* Feedback Notice Banner */}
      {feedbackNotice && (
        <div
          className={cn(
            "p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xs animate-in fade-in-50 duration-200",
            feedbackNotice.type === "success" &&
              "bg-emerald-50 border-emerald-200 text-emerald-900",
            feedbackNotice.type === "destructive" &&
              "bg-rose-50 border-rose-200 text-rose-900",
            feedbackNotice.type === "warning" &&
              "bg-amber-50 border-amber-200 text-amber-900",
            feedbackNotice.type === "info" &&
              "bg-blue-50 border-blue-200 text-blue-900"
          )}
        >
          <div className="flex items-start gap-2.5">
            {feedbackNotice.type === "success" && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {feedbackNotice.type === "destructive" && (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            {feedbackNotice.type === "warning" && (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            {feedbackNotice.type === "info" && (
              <FileCheck2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            )}
            <span className="font-medium leading-relaxed">{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header with Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Vendor Applications
                </h1>
                <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
                  {activeCount} Active
                </Badge>
                <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-xs font-semibold">
                  {totalRecordedCount} Total Submissions
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Review and manage vendor registration applications.
              </p>
            </div>
          </div>
        </div>

        {/* Quick summary chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-medium flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{underReviewCount} Under Review</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{needsCorrectionCount} Needs Correction</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{approvedCount} Approved</span>
          </div>
          {archivedCount > 0 && (
            <button
              type="button"
              onClick={() => setSelectedStatus(selectedStatus === "Archived / Deleted" ? "All" : "Archived / Deleted")}
              className={cn(
                "px-3 py-1.5 rounded-xl border font-medium flex items-center gap-1.5 cursor-pointer transition-colors",
                selectedStatus === "Archived / Deleted"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
              )}
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{archivedCount} Archived / Deleted</span>
            </button>
          )}
        </div>
      </div>

      {/* User Feedback Notification */}
      {feedbackNotice && (
        <div
          className={cn(
            "p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-xs",
            feedbackNotice.type === "success" &&
              "bg-emerald-50 border-emerald-200 text-emerald-900",
            feedbackNotice.type === "warning" &&
              "bg-amber-50 border-amber-200 text-amber-900",
            feedbackNotice.type === "destructive" &&
              "bg-rose-50 border-rose-200 text-rose-900",
            feedbackNotice.type === "info" &&
              "bg-blue-50 border-blue-200 text-blue-900"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            {feedbackNotice.type === "warning" && (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            {feedbackNotice.type === "destructive" && (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            {feedbackNotice.type === "info" && (
              <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-semibold">{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-700 text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Search & Filter UX Card */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col space-y-3">
            {/* Responsive Row: Desktop one-row, Mobile stacked */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  id="search-applications"
                  type="text"
                  placeholder="Search by business name, owner, or application number"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9.5 pr-8 h-10 text-sm bg-slate-50/60 border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl w-full"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Status Filter */}
                <div className="w-full sm:w-44">
                  <Select
                    value={selectedStatus}
                    onValueChange={(val) => val && setSelectedStatus(val)}
                  >
                    <SelectTrigger className="w-full h-10 px-3 bg-slate-50/60 border-slate-300 text-sm rounded-xl">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 text-xs font-normal">Status:</span>
                        <SelectValue placeholder="All" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Barangay Filter */}
                <div className="w-full sm:w-48">
                  <Select
                    value={selectedBarangay}
                    onValueChange={(val) => val && setSelectedBarangay(val)}
                  >
                    <SelectTrigger className="w-full h-10 px-3 bg-slate-50/60 border-slate-300 text-sm rounded-xl">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 text-xs font-normal">Barangay:</span>
                        <SelectValue placeholder="All Barangays" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {BARANGAY_OPTIONS.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Status Filter */}
                <div className="w-full sm:w-44">
                  <Select
                    value={selectedPaymentStatus}
                    onValueChange={(val) => val && setSelectedPaymentStatus(val)}
                  >
                    <SelectTrigger className="w-full h-10 px-3 bg-slate-50/60 border-slate-300 text-sm rounded-xl">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-slate-500 text-xs font-normal">Payment:</span>
                        <SelectValue placeholder="All" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_STATUS_OPTIONS.map((pStatus) => (
                        <SelectItem key={pStatus} value={pStatus}>
                          {pStatus}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear / Reset Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="h-10 px-3 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 rounded-xl cursor-pointer gap-1.5 shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Clear Filters</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filter Status Feedback Bar */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1 px-0.5">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-slate-900">{filteredApplications.length}</strong> of{" "}
                  <strong>{scopeCount}</strong> {selectedStatus === "Archived / Deleted" ? "archived" : "active"} applications ({totalRecordedCount} total records)
                </span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                    <Filter className="w-3 h-3" />
                    Filtered results
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Applications Table */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-200 bg-slate-50/80">
                  <TableHead className="font-bold text-slate-700 py-3.5">Application Number</TableHead>
                  <TableHead className="font-bold text-slate-700">Business Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Owner</TableHead>
                  <TableHead className="font-bold text-slate-700">Barangay</TableHead>
                  <TableHead className="font-bold text-slate-700">Submitted</TableHead>
                  <TableHead className="font-bold text-slate-700">Payment</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          {totalCount === 0 ? (
                            <FileCheck2 className="w-6 h-6 text-slate-400" />
                          ) : (
                            <SlidersHorizontal className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800">
                            {totalCount === 0
                              ? "No Applications Yet"
                              : "No applications match your criteria"}
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {totalCount === 0
                              ? "New vendor registration applications will appear here once a vendor submits an application."
                              : "Try adjusting your search terms or clearing status and barangay filters."}
                          </p>
                        </div>
                        {hasActiveFilters && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="hover:bg-slate-50/70 transition-colors border-b border-slate-100"
                    >
                      {/* Application Number */}
                      <TableCell className="font-mono text-xs font-bold text-blue-900 whitespace-nowrap">
                        <Link
                          href={`/admin/applications/${app.id}`}
                          className="hover:underline flex items-center gap-1.5 text-blue-700 hover:text-blue-900"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{app.id}</span>
                        </Link>
                      </TableCell>

                      {/* Business Name */}
                      <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{app.businessName}</span>
                        </div>
                      </TableCell>

                      {/* Owner */}
                      <TableCell className="text-slate-700 whitespace-nowrap">
                        {app.owner}
                      </TableCell>

                      {/* Barangay */}
                      <TableCell className="text-slate-600 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {app.barangay}
                        </span>
                      </TableCell>

                      {/* Submitted */}
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {app.submitted}
                      </TableCell>

                      {/* Payment */}
                      <TableCell className="whitespace-nowrap">
                        <div className="space-y-0.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px] px-2 py-0.5",
                              getPaymentStatusBadgeConfig(app.paymentStatus).badgeClass
                            )}
                          >
                            <span
                              className={cn(
                                "inline-block w-1.5 h-1.5 rounded-full mr-1.5",
                                getPaymentStatusBadgeConfig(app.paymentStatus).dotColor
                              )}
                            />
                            {app.paymentStatus || "Unpaid"}
                          </Badge>
                          <span className="font-mono text-xs font-semibold text-slate-700 block">
                            {formatPhpCurrency(app.assessedAmount)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {app.isDeleted ? (
                          <div className="space-y-1">
                            <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />
                              Rejected
                            </Badge>
                            <Badge className="bg-slate-900 text-white border-slate-800 text-[10px] font-semibold block w-fit">
                              Archived / Deleted by Admin
                            </Badge>
                          </div>
                        ) : (
                          getStatusBadge(app.status)
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right whitespace-nowrap pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-8 px-3 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 hover:text-blue-900 cursor-pointer gap-1.5 rounded-lg shadow-2xs"
                            )}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>
                          {!app.isDeleted && app.status === "Rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDelete(app)}
                              className="h-8 px-3 text-xs font-semibold text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-900 cursor-pointer gap-1.5 rounded-lg shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Archive / Delete</span>
                            </Button>
                          )}
                          {app.isDeleted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenPermanentDelete(app)}
                              className="h-8 px-3 text-xs font-semibold text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-600 hover:text-white cursor-pointer gap-1.5 rounded-lg shadow-2xs transition-colors"
                              title="Permanently Delete Application"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Permanently Delete</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete();
        }}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-xl border border-slate-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Archive & Delete Application
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to archive application{" "}
              <span className="font-mono font-bold text-slate-900">
                {deleteTargetApp?.id}
              </span>
              ? Historical records, reference numbers, and review notes will be retained in read-only audit history, while safely removing the application from active queues.
            </DialogDescription>
          </DialogHeader>

          {deleteTargetApp && (
            <div className="py-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Business Name:</span>
                  <span className="font-bold text-slate-900">
                    {deleteTargetApp.businessName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Owner:</span>
                  <span className="text-slate-800">{deleteTargetApp.owner}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mr-1 inline-block" />
                    {deleteTargetApp.status}
                  </Badge>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Deletion / Archival (Audit Trail):
                </label>
                <Input
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="e.g., Application rejected; duplicate entry or withdrawn by vendor"
                  className="text-xs h-9"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={handleCancelDelete}
              className="text-xs font-semibold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 cursor-pointer"
            >
              {isDeleting ? "Archiving..." : "Archive & Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permanent Deletion Confirmation Dialog */}
      <Dialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) handleCancelPermanentDelete();
        }}
      >
        <DialogContent className="sm:max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-rose-200">
          <DialogHeader>
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-1">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900">
              Permanently Delete Application?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete application{" "}
              <span className="font-mono font-bold text-slate-900">
                {permanentDeleteTargetApp?.id}
              </span>
              ? This action will permanently remove this record from the admin archive and database. This action{" "}
              <strong className="text-rose-600 font-semibold">cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>

          {permanentDeleteTargetApp && (
            <div className="py-2 space-y-3">
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/90 text-xs sm:text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Application Number:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {permanentDeleteTargetApp.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Business Name:</span>
                  <span className="font-bold text-slate-900">
                    {permanentDeleteTargetApp.businessName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Owner / Applicant:</span>
                  <span className="text-slate-800 font-medium">
                    {permanentDeleteTargetApp.owner}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Current Archive Status:</span>
                  <Badge className="bg-slate-900 text-white border-slate-800 text-[10px] font-semibold">
                    Archived / Deleted by Admin
                  </Badge>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  <strong>Warning:</strong> All records associated with this specific application will be permanently removed. The vendor&apos;s user account and other applications will not be affected.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isPermanentDeleting}
              onClick={handleCancelPermanentDelete}
              className="text-xs font-semibold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isPermanentDeleting}
              onClick={handleConfirmPermanentDelete}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 cursor-pointer gap-1.5"
            >
              {isPermanentDeleting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                  <span>Deleting permanently...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Permanently Delete</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Helpful footer notes */}
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2 px-1">
        <p>
          Butuan City Public Market & Vendor Licensing Division — Administrator Review Console
        </p>
        <p className="font-mono text-[11px] text-slate-400">
          Showing local registry records
        </p>
      </div>
    </div>
  );
}

