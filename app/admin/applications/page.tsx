"use client";

import { useState, useMemo } from "react";
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
  type ApplicationStatus,
  type AdminApplication,
} from "@/lib/admin-applications-data";
import { useSharedApplication } from "@/lib/vendor-application-state";
import {
  useStoredApplications,
  useDeletedApplicationIds,
  deleteAdminApplicationRecord,
} from "@/lib/application-store";
import { cn } from "@/lib/utils";

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
  const { application: sharedApp } = useSharedApplication();
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedBarangay, setSelectedBarangay] = useState<string>("All Barangays");

  // Deletion confirmation dialog state
  const [deleteTargetApp, setDeleteTargetApp] = useState<AdminApplication | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "warning" | "destructive" | "info";
    message: string;
  } | null>(null);

  const handleOpenDelete = (app: AdminApplication) => {
    setDeleteTargetApp(app);
    setIsDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDeleteTargetApp(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetApp) return;

    // Safety check (Requirement 5): verify status is exactly Rejected
    if (deleteTargetApp.status !== "Rejected") {
      setFeedbackNotice({
        type: "destructive",
        message: "Safety check failed: Only Rejected applications can be deleted.",
      });
      setIsDeleteDialogOpen(false);
      setDeleteTargetApp(null);
      return;
    }

    const deletedId = deleteTargetApp.id;
    deleteAdminApplicationRecord(deletedId);
    setIsDeleteDialogOpen(false);
    setDeleteTargetApp(null);
    setFeedbackNotice({
      type: "success",
      message: `Application ${deletedId} has been successfully deleted.`,
    });
  };

  // Map stored applications from centralized store
  const allApplications = useMemo(() => {
    const statusMap: Record<string, ApplicationStatus> = {
      draft: "Submitted",
      submitted: "Submitted",
      under_review: "Under Review",
      needs_correction: "Needs Correction",
      correction_submitted: "Correction Submitted",
      approved: "Approved",
      rejected: "Rejected",
    };

    const storedMapped: (AdminApplication & { sortTime: number })[] =
      storedApplications.map((app) => ({
        id: app.applicationNumber || app.id,
        businessName: app.business.businessName,
        owner: app.owner.ownerName,
        barangay: app.address.barangay,
        submitted: formatSubmittedDate(app.submittedAt),
        status: statusMap[app.status.toLowerCase()] || "Submitted",
        businessDescription:
          app.business.businessDescription ||
          "Vendor registration application submitted online.",
        contactNumber: app.contact.contactNumber,
        email: app.contact.emailAddress,
        address: {
          houseNumber: app.address.houseNo,
          street: app.address.street,
          barangay: app.address.barangay,
          city: app.address.city || "Butuan City",
          province: app.address.province || "Agusan del Norte",
          region: app.address.region || "Caraga",
          country: app.address.country || "Philippines",
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
      }));

    const deletedSet = new Set(
      deletedApplicationIds.map((id) => id.trim().toLowerCase())
    );

    return storedMapped
      .filter((app) => !deletedSet.has(app.id.toLowerCase()))
      .sort((a, b) => b.sortTime - a.sortTime);
  }, [storedApplications, deletedApplicationIds]);

  const dynamicBarangayOptions = useMemo(() => {
    const list = ["All Barangays"];
    const barangaySet = new Set<string>();
    BARANGAY_OPTIONS.forEach((b) => {
      if (b !== "All Barangays") barangaySet.add(b);
    });
    allApplications.forEach((app) => {
      if (app.barangay) barangaySet.add(app.barangay);
    });
    return [...list, ...Array.from(barangaySet).sort()];
  }, [allApplications]);

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

      // Status matching
      const matchesStatus =
        selectedStatus === "All" || app.status === selectedStatus;

      // Barangay matching
      const matchesBarangay =
        selectedBarangay === "All Barangays" ||
        app.barangay.toLowerCase() === selectedBarangay.toLowerCase();

      return matchesSearch && matchesStatus && matchesBarangay;
    });
  }, [allApplications, searchQuery, selectedStatus, selectedBarangay]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedStatus !== "All" ||
    selectedBarangay !== "All Barangays";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedStatus("All");
    setSelectedBarangay("All Barangays");
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

  // Quick counts
  const totalCount = allApplications.length;
  const underReviewCount = allApplications.filter(
    (a) => a.status === "Under Review"
  ).length;
  const needsCorrectionCount = allApplications.filter(
    (a) => a.status === "Needs Correction"
  ).length;
  const approvedCount = allApplications.filter(
    (a) => a.status === "Approved"
  ).length;

  return (
    <div className="space-y-6">
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
                  {totalCount} Total
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
                    <SelectContent>
                      {dynamicBarangayOptions.map((bg) => (
                        <SelectItem key={bg} value={bg}>
                          {bg}
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
                  <strong>{totalCount}</strong> applications
                </span>
                {hasActiveFilters && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                    <Filter className="w-3 h-3" />
                    Filtered results
                  </span>
                )}
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-xs font-medium"
                >
                  Reset all
                </button>
              )}
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
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="font-bold text-slate-700 text-right pr-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                          <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-800">
                            {totalCount === 0
                              ? "No applications have been submitted yet."
                              : "No applications match your criteria"}
                          </h4>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            {totalCount === 0
                              ? "Submitted vendor applications will appear here once received."
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

                      {/* Status */}
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(app.status)}
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
                          {app.status === "Rejected" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDelete(app)}
                              className="h-8 px-3 text-xs font-semibold text-rose-700 border-rose-200 bg-rose-50/50 hover:bg-rose-100 hover:text-rose-900 cursor-pointer gap-1.5 rounded-lg shadow-2xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
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
              Delete this application?
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete application{" "}
              <span className="font-mono font-bold text-slate-900">
                {deleteTargetApp?.id}
              </span>
              ? This application will be removed from the current application list and cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteTargetApp && (
            <div className="py-2">
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
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              className="text-xs font-semibold rounded-xl h-9"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-9 cursor-pointer"
            >
              Delete Application
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
          Showing local registry records (Mock UI Mode)
        </p>
      </div>
    </div>
  );
}

