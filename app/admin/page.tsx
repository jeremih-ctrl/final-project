"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Files,
  BarChart3,
  ArrowRight,
  Eye,
  Check,
  X,
  FileCheck2,
  Bell,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSharedApplication } from "@/lib/vendor-application-state";
import {
  useStoredApplications,
  useDeletedApplicationIds,
  getApplication,
  updateApplication,
  createApplication,
  deleteApplication,
  resetDeletedAdminApplications,
} from "@/lib/application-store";

interface ApplicationRecord {
  id: string;
  businessName: string;
  owner: string;
  barangay: string;
  submitted: string;
  status: "Under Review" | "Approved" | "Needs Correction" | "Correction Submitted" | "Submitted" | "Rejected";
  contact: string;
  email: string;
  document: string;
}

const RECENT_APPLICATIONS: ApplicationRecord[] = [
  {
    id: "BVR-2026-001248",
    businessName: "Juan's Food Stall",
    owner: "Juan Dela Cruz",
    barangay: "Baan KM 3",
    submitted: "Oct 6, 2026",
    status: "Under Review",
    contact: "09XXXXXXXXX",
    email: "juan@email.com",
    document: "government-id.pdf",
  },
  {
    id: "BVR-2026-001247",
    businessName: "Maria's Sari-Sari Store",
    owner: "Maria Santos",
    barangay: "Libertad",
    submitted: "Oct 6, 2026",
    status: "Approved",
    contact: "09181234567",
    email: "maria.santos@email.com",
    document: "barangay-clearance.pdf",
  },
  {
    id: "BVR-2026-001246",
    businessName: "Pedro BBQ",
    owner: "Pedro Cruz",
    barangay: "Ampayon",
    submitted: "Oct 5, 2026",
    status: "Needs Correction",
    contact: "09201234567",
    email: "pedro.bbq@email.com",
    document: "valid-id-scan.png",
  },
  {
    id: "BVR-2026-001245",
    businessName: "Agusan River Fresh Fish",
    owner: "Elena Roxas",
    barangay: "Doongan",
    submitted: "Oct 5, 2026",
    status: "Submitted",
    contact: "09179876543",
    email: "elena.roxas@email.com",
    document: "market-permit.pdf",
  },
  {
    id: "BVR-2026-001244",
    businessName: "Golden Tara Refreshments",
    owner: "Roberto Ramos",
    barangay: "Villa Kananga",
    submitted: "Oct 4, 2026",
    status: "Approved",
    contact: "09192233445",
    email: "roberto.ramos@email.com",
    document: "dti-certificate.pdf",
  },
];

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

function mapStoreStatusToAdminStatus(
  status: string
): ApplicationRecord["status"] {
  switch (status.toLowerCase()) {
    case "approved":
      return "Approved";
    case "under_review":
    case "under review":
      return "Under Review";
    case "needs_correction":
    case "needs correction":
      return "Needs Correction";
    case "correction_submitted":
    case "correction submitted":
      return "Correction Submitted";
    case "rejected":
      return "Rejected";
    case "submitted":
    case "draft":
    default:
      return "Submitted";
  }
}

export default function AdminDashboardPage() {
  const {
    application: sharedApp,
    updateStatus,
    resetDemo: resetSharedDemo,
  } = useSharedApplication();
  const storedApplications = useStoredApplications();
  const deletedApplicationIds = useDeletedApplicationIds();
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const deletedSet = new Set(
    deletedApplicationIds.map((id) => id.trim().toLowerCase())
  );

  // Map real applications from shared localStorage store
  const storedRecords: (ApplicationRecord & { sortTime: number })[] =
    storedApplications.map((app) => ({
      id: app.applicationNumber || app.id,
      businessName: app.business.businessName,
      owner: app.owner.ownerName,
      barangay: app.address.barangay,
      submitted: formatSubmittedDate(app.submittedAt),
      status: mapStoreStatusToAdminStatus(app.status),
      contact: app.contact.contactNumber,
      email: app.contact.emailAddress,
      document:
        app.documents?.[0]?.filename ||
        app.documents?.[0]?.idFileName ||
        "government-id.pdf",
      sortTime: app.submittedAt ? new Date(app.submittedAt).getTime() : 0,
    }));

  const storedIds = new Set(storedRecords.map((r) => r.id.toLowerCase()));

  // Seed mock applications with baseline timestamps
  const mockRecordsWithTimestamps: (ApplicationRecord & { sortTime: number })[] = [
    {
      ...RECENT_APPLICATIONS[0],
      status:
        sharedApp.id.toLowerCase() === RECENT_APPLICATIONS[0].id.toLowerCase()
          ? (sharedApp.adminStatus as ApplicationRecord["status"])
          : RECENT_APPLICATIONS[0].status,
      sortTime: new Date("2026-10-06T10:00:00Z").getTime(),
    },
    {
      ...RECENT_APPLICATIONS[1],
      sortTime: new Date("2026-10-06T09:00:00Z").getTime(),
    },
    {
      ...RECENT_APPLICATIONS[2],
      sortTime: new Date("2026-10-05T14:00:00Z").getTime(),
    },
    {
      ...RECENT_APPLICATIONS[3],
      sortTime: new Date("2026-10-05T11:00:00Z").getTime(),
    },
    {
      ...RECENT_APPLICATIONS[4],
      sortTime: new Date("2026-10-04T08:00:00Z").getTime(),
    },
  ];

  // Merge stored applications and seed mock data, sorted by submittedAt descending
  const allRecent = [
    ...storedRecords,
    ...mockRecordsWithTimestamps.filter((m) => !storedIds.has(m.id.toLowerCase())),
  ].sort((a, b) => b.sortTime - a.sortTime);

  // Exclude rejected applications and deleted records from the Recent Applications queue
  const recentApplications = allRecent.filter(
    (app) => app.status !== "Rejected" && !deletedSet.has(app.id.toLowerCase())
  );

  const handleResetDemo = () => {
    resetSharedDemo();
    resetDeletedAdminApplications();
    [
      "BVR-2026-001248",
      "BVR-2026-001247",
      "BVR-2026-001246",
      "BVR-2026-001245",
      "BVR-2026-001244",
    ].forEach((id) => {
      deleteApplication(id);
    });
    setFeedbackNotice("Demo state reset: Initial application queue restored.");
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const activeSelectedApp = selectedApp
    ? selectedApp.id === sharedApp.id
      ? { ...selectedApp, status: sharedApp.adminStatus as ApplicationRecord["status"] }
      : selectedApp
    : null;

  const getStatusBadge = (status: ApplicationRecord["status"]) => {
    switch (status) {
      case "Approved":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
            Approved
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-50 text-amber-900 border-amber-300 text-xs font-semibold">
            Under Review
          </Badge>
        );
      case "Needs Correction":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
            Needs Correction
          </Badge>
        );
      case "Correction Submitted":
        return (
          <Badge className="bg-purple-50 text-purple-800 border-purple-200 text-xs font-semibold">
            Correction Submitted
          </Badge>
        );
      case "Submitted":
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-semibold">
            Submitted
          </Badge>
        );
      case "Rejected":
        return (
          <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
            Rejected
          </Badge>
        );
    }
  };

  const handleAction = (actionText: string) => {
    setReviewDialogOpen(false);
    setFeedbackNotice(actionText);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Welcome / Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Admin Dashboard
            </h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Live Registry
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Overview of Butuan City vendor registrations, compliance, and pending approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDemo}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </Button>

          <Link
            href="/admin/applications"
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs cursor-pointer gap-1.5 shadow-2xs"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Process Applications</span>
          </Link>
        </div>
      </div>

      {/* Temporary Feedback Banner */}
      {feedbackNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{feedbackNotice}</span>
        </div>
      )}

      {/* 5. Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendors */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Vendors
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              1,248
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Registered vendors
            </p>
          </div>
        </Card>

        {/* Pending Applications */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Applications
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              84
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Awaiting review
            </p>
          </div>
        </Card>

        {/* Approved Vendors */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Approved Vendors
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              1,102
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Active vendors
            </p>
          </div>
        </Card>

        {/* Needs Correction */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Needs Correction
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              42
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Require vendor action
            </p>
          </div>
        </Card>
      </div>

      {/* 8. Application Status Overview */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Application Status Overview
            </CardTitle>
            <p className="text-xs text-slate-500">
              Current lifecycle distribution across all 1,248 municipal applications.
            </p>
          </div>
          <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
            Total: 1,248
          </Badge>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Horizontal multi-color visual bar */}
          <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-2xs">
            {/* Approved: ~88.3% */}
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: "88.3%" }}
              title="Approved: 1,102 (88.3%)"
            />
            {/* Under Review: ~5.3% */}
            <div
              className="bg-amber-500 h-full transition-all"
              style={{ width: "5.3%" }}
              title="Under Review: 66 (5.3%)"
            />
            {/* Needs Correction: ~3.4% */}
            <div
              className="bg-rose-500 h-full transition-all"
              style={{ width: "3.4%" }}
              title="Needs Correction: 42 (3.4%)"
            />
            {/* Submitted: ~1.4% */}
            <div
              className="bg-blue-500 h-full transition-all"
              style={{ width: "1.4%" }}
              title="Submitted: 18 (1.4%)"
            />
            {/* Rejected: ~1.6% */}
            <div
              className="bg-slate-400 h-full transition-all"
              style={{ width: "1.6%" }}
              title="Rejected: 20 (1.6%)"
            />
          </div>

          {/* 5 Status metric cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-xs">
            {/* 1. Submitted */}
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Submitted</span>
              </div>
              <div className="text-base font-extrabold text-blue-950">18</div>
              <span className="text-[11px] text-blue-700 block">1.4% of total</span>
            </div>

            {/* 2. Under Review */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Under Review</span>
              </div>
              <div className="text-base font-extrabold text-amber-950">66</div>
              <span className="text-[11px] text-amber-700 block">5.3% of total</span>
            </div>

            {/* 3. Needs Correction */}
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-900">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Needs Correction</span>
              </div>
              <div className="text-base font-extrabold text-rose-950">42</div>
              <span className="text-[11px] text-rose-700 block">3.4% of total</span>
            </div>

            {/* 4. Approved */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Approved</span>
              </div>
              <div className="text-base font-extrabold text-emerald-950">1,102</div>
              <span className="text-[11px] text-emerald-700 block">88.3% of total</span>
            </div>

            {/* 5. Rejected */}
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>Rejected</span>
              </div>
              <div className="text-base font-extrabold text-slate-900">20</div>
              <span className="text-[11px] text-slate-500 block">1.6% of total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Quick Actions */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Quick Actions
            </h3>
            <p className="text-xs text-slate-500">
              Common administrative tasks and portal operations
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/admin/applications"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-3 px-3.5 flex flex-col items-center justify-center gap-2 rounded-xl text-center hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer text-slate-800"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Review Applications</span>
          </Link>

          <Link
            href="/admin/vendors"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-3 px-3.5 flex flex-col items-center justify-center gap-2 rounded-xl text-center hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer text-slate-800"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">View Vendors</span>
          </Link>

          <Link
            href="/admin/documents"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-3 px-3.5 flex flex-col items-center justify-center gap-2 rounded-xl text-center hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer text-slate-800"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">View Documents</span>
          </Link>

          <Link
            href="/admin/reports"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto py-3 px-3.5 flex flex-col items-center justify-center gap-2 rounded-xl text-center hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer text-slate-800"
            )}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Generate Report</span>
          </Link>
        </div>
      </Card>

      {/* Main Grid: 6. Recent Applications (Left) & 9. Recent Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Applications Table */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Recent Applications
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Latest vendor submissions queued for licensing evaluation.
                </p>
              </div>

              <Link
                href="/admin/applications"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer gap-1"
                )}
              >
                <span>View All (84)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application No.</TableHead>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Barangay</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentApplications.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-slate-500 text-xs sm:text-sm"
                        >
                          No recent pending applications queued for licensing evaluation.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentApplications.map((app) => (
                        <TableRow key={app.id}>
                        <TableCell className="font-mono text-xs font-bold text-slate-900">
                          {app.id}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-900 whitespace-nowrap">
                          {app.businessName}
                        </TableCell>
                        <TableCell className="text-slate-700 whitespace-nowrap">
                          {app.owner}
                        </TableCell>
                        <TableCell className="text-slate-600 whitespace-nowrap">
                          {app.barangay}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {app.submitted}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedApp(app);
                                setReviewDialogOpen(true);
                              }}
                              className="h-8 px-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              Quick Review
                            </Button>
                            <Link
                              href={`/admin/applications/${app.id}`}
                              className={cn(
                                buttonVariants({ variant: "outline", size: "sm" }),
                                "h-8 px-2.5 text-xs font-semibold text-blue-700 border-blue-200 hover:bg-blue-50 cursor-pointer gap-1"
                              )}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: 9. Recent Activity & Notifications Preview (Task 10 Requirement 9) */}
        <div className="space-y-6">
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Recent Notifications
                </CardTitle>
              </div>
              <Badge className="bg-blue-700 text-white text-[10px] font-bold">
                2 New
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              <div className="space-y-3.5">
                {/* Event 1: Correction submitted */}
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 mt-1.5 shrink-0 ring-4 ring-orange-100" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        Vendor Submitted Corrections
                      </p>
                      <span className="text-[10px] text-blue-700 font-semibold shrink-0">Just now</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Juan&apos;s Food Stall resubmitted address &amp; ID.
                    </p>
                    <span className="font-mono text-[10px] font-bold text-slate-500 block">
                      BVR-2026-001248
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Event 2: New application submitted */}
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1.5 shrink-0 ring-4 ring-blue-100" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        New Application Submitted
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">10m ago</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Juan Dela Cruz queued for review.
                    </p>
                    <span className="font-mono text-[10px] font-bold text-slate-500 block">
                      BVR-2026-001248 • Baan KM 3
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Event 3: Application approved */}
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        Application Approved
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">2h ago</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Maria&apos;s Sari-Sari Store issued Vendor ID BUT-V-001247.
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100" />

                {/* Event 4: Correction requested */}
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-900 leading-snug">
                        Correction Requested
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">Yesterday</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Pedro BBQ flagged for incomplete coordinates.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href="/admin/notifications"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "w-full text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer justify-center"
                  )}
                >
                  View Notifications
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Application Review Dialog (Triggered from Table Action) */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        {activeSelectedApp && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between pr-6">
                <span className="font-mono text-xs font-bold text-slate-500">
                  {activeSelectedApp.id}
                </span>
                {getStatusBadge(activeSelectedApp.status)}
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {activeSelectedApp.businessName}
              </DialogTitle>
              <DialogDescription>
                Registration Details for City Licensing Evaluation
              </DialogDescription>
            </DialogHeader>

            <div className="py-3 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-slate-500 text-xs block">Owner:</span>
                  <span className="font-semibold text-slate-900">{activeSelectedApp.owner}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Barangay:</span>
                  <span className="font-semibold text-slate-900">{activeSelectedApp.barangay}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Contact:</span>
                  <span className="font-mono font-semibold text-slate-900">{activeSelectedApp.contact}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Email:</span>
                  <span className="font-semibold text-slate-900">{activeSelectedApp.email}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[10px]">
                    PDF
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs">
                      {activeSelectedApp.document}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Uploaded on {activeSelectedApp.submitted}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50">
                  Legible
                </Badge>
              </div>

              {/* Action Buttons (Synced to shared application state) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Simulated Administrative Decision
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (activeSelectedApp.id === sharedApp.id) {
                        updateStatus("approved");
                      }
                      const existing = getApplication(activeSelectedApp.id);
                      if (existing) {
                        updateApplication(activeSelectedApp.id, {
                          status: "approved",
                        });
                      }
                      handleAction(`Application ${activeSelectedApp.id} was marked as Approved.`);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (activeSelectedApp.id === sharedApp.id) {
                        updateStatus("needs-correction");
                      }
                      const existing = getApplication(activeSelectedApp.id);
                      if (existing) {
                        updateApplication(activeSelectedApp.id, {
                          status: "needs_correction",
                        });
                      }
                      handleAction(`Correction request sent for ${activeSelectedApp.id}.`);
                    }}
                    className="text-amber-800 border-amber-300 hover:bg-amber-50 text-xs font-semibold cursor-pointer gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Correction</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (activeSelectedApp.id === sharedApp.id) {
                        updateStatus("rejected");
                      }
                      const existing = getApplication(activeSelectedApp.id);
                      if (existing) {
                        updateApplication(activeSelectedApp.id, {
                          status: "rejected",
                        });
                      } else {
                        createApplication({
                          id: activeSelectedApp.id,
                          applicationNumber: activeSelectedApp.id,
                          status: "rejected",
                          business: {
                            businessName: activeSelectedApp.businessName,
                          },
                          owner: { ownerName: activeSelectedApp.owner },
                          contact: {
                            contactNumber: activeSelectedApp.contact,
                            emailAddress: activeSelectedApp.email,
                          },
                          address: {
                            houseNo: "",
                            street: "",
                            barangay: activeSelectedApp.barangay,
                            city: "Butuan City",
                            province: "Agusan del Norte",
                            region: "Caraga",
                            country: "Philippines",
                          },
                          documents: [],
                          statusHistory: [
                            {
                              id: `hist-${Date.now()}`,
                              previousStatus: null,
                              newStatus: "rejected",
                              timestamp: new Date().toISOString(),
                              action: "Application Rejected",
                              actionBy: "Admin",
                            },
                          ],
                          submittedAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                          createdAt: new Date().toISOString(),
                        });
                      }
                      handleAction(`Application ${activeSelectedApp.id} was rejected.`);
                    }}
                    className="text-rose-800 border-rose-300 hover:bg-rose-50 text-xs font-semibold cursor-pointer gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
