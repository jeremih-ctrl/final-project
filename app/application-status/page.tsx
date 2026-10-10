"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Store,
  ArrowLeft,
  Copy,
  Check,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  SearchX,
  FileSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStoredApplications } from "@/lib/application-store";
import { VendorApplication, ApplicationStatus } from "@/lib/types/vendor-application";
import { useSharedApplication } from "@/lib/vendor-application-state";
import { useVendorAuth } from "@/lib/demo-auth";

type StatusState =
  | "draft"
  | "submitted"
  | "under-review"
  | "needs-correction"
  | "correction-submitted"
  | "approved"
  | "rejected";

interface DynamicActivity {
  id: string;
  title: string;
  description: string;
  date: string;
  dotColor: "emerald" | "amber" | "orange" | "blue" | "rose" | "slate";
}

function normalizeStatus(rawStatus?: string): StatusState {
  if (!rawStatus) return "submitted";
  const s = rawStatus.toLowerCase().trim().replace(/[\s_]+/g, "-");
  switch (s) {
    case "draft":
      return "draft";
    case "submitted":
      return "submitted";
    case "under-review":
    case "underreview":
      return "under-review";
    case "needs-correction":
    case "needscorrection":
    case "action-required":
      return "needs-correction";
    case "correction-submitted":
    case "correctionsubmitted":
      return "correction-submitted";
    case "approved":
      return "approved";
    case "rejected":
    case "not-approved":
      return "rejected";
    default:
      return "submitted";
  }
}

function mockStatusToVendorAppStatus(status?: string): ApplicationStatus {
  if (!status) return "submitted";
  const s = status.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "needs_correction") return "needs_correction";
  if (s === "correction_submitted") return "correction_submitted";
  if (s === "under_review") return "under_review";
  if (s === "draft") return "draft";
  return "submitted";
}

function formatAppDateCompact(dateStr?: string | null): string {
  if (!dateStr) return "Just now";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${month} ${day}, ${year} • ${hours}:${minutes} ${ampm}`;
  } catch {
    return dateStr;
  }
}

function buildActivityTimeline(
  app: VendorApplication,
  status: StatusState
): DynamicActivity[] {
  if (app.statusHistory && app.statusHistory.length > 0) {
    return app.statusHistory
      .slice()
      .reverse()
      .map((item, idx) => {
        const itemStatus = normalizeStatus(item.newStatus);
        let dotColor: DynamicActivity["dotColor"] = "blue";
        if (itemStatus === "approved") dotColor = "emerald";
        else if (itemStatus === "needs-correction") dotColor = "orange";
        else if (itemStatus === "under-review") dotColor = "amber";
        else if (itemStatus === "rejected") dotColor = "rose";
        else if (itemStatus === "draft") dotColor = "slate";

        return {
          id: item.id || `hist-${idx}`,
          title:
            item.action ||
            (itemStatus === "approved"
              ? "Application Approved"
              : itemStatus === "needs-correction"
              ? "Correction Requested"
              : itemStatus === "correction-submitted"
              ? "Correction Submitted"
              : itemStatus === "under-review"
              ? "Application Under Review"
              : itemStatus === "rejected"
              ? "Application Not Approved"
              : "Application Submitted"),
          description:
            item.remark ||
            (itemStatus === "approved"
              ? "Vendor registration approved. Official vendor ID issued."
              : itemStatus === "needs-correction"
              ? "Administrator requested corrections to your application."
              : itemStatus === "correction-submitted"
              ? "Vendor submitted application corrections. Status changed back to Under Review."
              : itemStatus === "under-review"
              ? "Application is actively being reviewed by the LGU licensing administrator."
              : itemStatus === "rejected"
              ? "Application could not be approved due to compliance criteria."
              : "Vendor registration application was successfully submitted."),
          date: formatAppDateCompact(item.timestamp),
          dotColor,
        };
      });
  }

  const activities: DynamicActivity[] = [];
  const submittedDate = formatAppDateCompact(app.submittedAt);
  const updatedDate = formatAppDateCompact(app.updatedAt);

  if (status === "approved") {
    activities.push({
      id: "act-approved",
      title: "Application Approved",
      description: "Vendor registration approved. Official vendor ID issued.",
      date: updatedDate,
      dotColor: "emerald",
    });
    activities.push({
      id: "act-review",
      title: "Application Under Review",
      description: "Application was reviewed and approved.",
      date: updatedDate,
      dotColor: "amber",
    });
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "blue",
    });
  } else if (status === "needs-correction") {
    activities.push({
      id: "act-correction",
      title: "Correction Requested",
      description:
        app.adminRemarks ||
        "Administrator requested corrections to business address and credentials.",
      date: updatedDate,
      dotColor: "orange",
    });
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "emerald",
    });
  } else if (status === "correction-submitted") {
    activities.push({
      id: "act-corr-sub",
      title: "Correction Submitted",
      description:
        "Vendor submitted application corrections. Status changed back to Under Review.",
      date: updatedDate,
      dotColor: "blue",
    });
    activities.push({
      id: "act-correction",
      title: "Correction Requested",
      description:
        app.adminRemarks || "Administrator requested corrections to application.",
      date: updatedDate,
      dotColor: "orange",
    });
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "emerald",
    });
  } else if (status === "under-review") {
    activities.push({
      id: "act-review",
      title: "Application Under Review",
      description:
        "Application is actively being reviewed by the LGU licensing administrator.",
      date: updatedDate,
      dotColor: "amber",
    });
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "blue",
    });
  } else if (status === "rejected") {
    activities.push({
      id: "act-rejected",
      title: "Application Not Approved",
      description:
        app.adminRemarks ||
        "Application could not be approved due to compliance criteria.",
      date: updatedDate,
      dotColor: "rose",
    });
    activities.push({
      id: "act-review",
      title: "Application Under Review",
      description: "Application review completed.",
      date: updatedDate,
      dotColor: "amber",
    });
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "blue",
    });
  } else if (status === "submitted") {
    activities.push({
      id: "act-submitted",
      title: "Application Submitted",
      description: "Vendor registration application was successfully submitted.",
      date: submittedDate,
      dotColor: "blue",
    });
  } else {
    activities.push({
      id: "act-draft",
      title: "Draft Saved",
      description: "Vendor registration draft saved.",
      date: updatedDate,
      dotColor: "slate",
    });
  }

  return activities;
}

function ApplicationStatusContent() {
  const searchParams = useSearchParams();
  const storedApplications = useStoredApplications();
  const { application: sharedApp } = useSharedApplication();
  const { isAuthenticated } = useVendorAuth();

  const backHref = isAuthenticated ? "/dashboard" : "/";
  const backLabel = isAuthenticated ? "Back to Dashboard" : "Back to Home";
  const backShortLabel = isAuthenticated ? "Dashboard" : "Home";

  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const queryParam = searchParams?.get("appNumber") || searchParams?.get("id");

  // Create canonical VendorApplication from the shared state
  const sharedVendorApp: VendorApplication = useMemo(() => {
    const isApproved = sharedApp.status === "approved";
    return {
      id: sharedApp.id,
      applicationNumber: sharedApp.applicationNumber || sharedApp.id,
      vendorId: sharedApp.vendorId || (isApproved ? "Assigned upon release" : "Pending assignment"),
      status: (isApproved
        ? "approved"
        : sharedApp.status === "rejected"
        ? "rejected"
        : sharedApp.status === "needs-correction"
        ? "needs_correction"
        : sharedApp.status === "correction-submitted"
        ? "correction_submitted"
        : sharedApp.status === "submitted"
        ? "submitted"
        : "under_review") as ApplicationStatus,
      verificationStatus: sharedApp.verificationStatus,
      isVerified: sharedApp.isVerified,
      currentStage: sharedApp.currentStage,
      business: {
        businessName:
          sharedApp.vendor?.businessName ||
          sharedApp.business?.businessName ||
          sharedApp.businessName ||
          "",
        businessDescription:
          sharedApp.business?.description ||
          "",
        category:
          sharedApp.business?.category || "General Merchandise",
      },
      owner: {
        ownerName:
          sharedApp.vendor?.name ||
          sharedApp.ownerName ||
          "",
      },
      contact: {
        contactNumber:
          sharedApp.vendor?.phone ||
          sharedApp.contactNumber ||
          "",
        emailAddress:
          sharedApp.vendor?.email ||
          sharedApp.email ||
          "",
      },
      address: {
        houseNo: sharedApp.business?.houseNumber || sharedApp.houseNumber || "",
        street: sharedApp.business?.street || sharedApp.street || "",
        barangay: sharedApp.business?.barangay || sharedApp.barangay || "",
        city: sharedApp.business?.city || sharedApp.city || "Butuan City",
        province: sharedApp.business?.province || sharedApp.province || "Agusan del Norte",
        region: sharedApp.business?.region || sharedApp.region || "Caraga",
        country: sharedApp.business?.country || sharedApp.country || "Philippines",
      },
      documents: (sharedApp.documents || []).map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        idType: doc.idType,
        uploadedAt: doc.uploadedAt,
        status: doc.status,
      })),
      adminRemarks: sharedApp.adminRemarks,
      statusHistory: (sharedApp.activity || []).map((act) => ({
        id: act.id,
        previousStatus: null,
        newStatus: isApproved ? "approved" : mockStatusToVendorAppStatus(sharedApp.status),
        timestamp: act.date,
        action: act.title,
        remark: act.description,
      })),
      submittedAt: sharedApp.submittedAt,
      updatedAt: sharedApp.updatedAt,
    };
  }, [sharedApp]);

  // Resolve the active vendor application based on real data & shared state
  const activeApp: VendorApplication | null = useMemo(() => {
    const mergeSharedIfTarget = (app: VendorApplication): VendorApplication => {
      const isTarget =
        app.id.toLowerCase() === sharedApp.id.toLowerCase() ||
        app.applicationNumber.toLowerCase() === sharedApp.id.toLowerCase() ||
        (sharedApp.id && app.id.toUpperCase() === sharedApp.id.toUpperCase()) ||
        (sharedApp.applicationNumber && app.applicationNumber.toUpperCase() === sharedApp.applicationNumber.toUpperCase());
      if (!isTarget) return app;
      const isApproved = sharedApp.status === "approved";
      return {
        ...app,
        status: (isApproved
          ? "approved"
          : sharedApp.status === "rejected"
          ? "rejected"
          : sharedApp.status === "needs-correction"
          ? "needs_correction"
          : sharedApp.status === "correction-submitted"
          ? "correction_submitted"
          : sharedApp.status === "submitted"
          ? "submitted"
          : "under_review") as ApplicationStatus,
        verificationStatus: sharedApp.verificationStatus,
        isVerified: sharedApp.isVerified,
        currentStage: sharedApp.currentStage,
        vendorId: sharedApp.vendorId || app.vendorId || (isApproved ? "Assigned upon release" : "Pending assignment"),
        adminRemarks: sharedApp.adminRemarks ?? app.adminRemarks,
      };
    };

    // 1. Explicit selection from search on this page
    if (activeAppId) {
      if (activeAppId.toLowerCase() === sharedApp.id.toLowerCase()) {
        return sharedVendorApp;
      }
      const found = storedApplications.find(
        (a) =>
          a.id.toLowerCase() === activeAppId.toLowerCase() ||
          a.applicationNumber.toLowerCase() === activeAppId.toLowerCase()
      );
      if (found) return mergeSharedIfTarget(found);
    }

    // 2. Query parameter (?appNumber=... or ?id=...)
    if (queryParam) {
      if (queryParam.toLowerCase() === sharedApp.id.toLowerCase()) {
        return sharedVendorApp;
      }
      const found = storedApplications.find(
        (a) =>
          a.id.toLowerCase() === queryParam.toLowerCase() ||
          a.applicationNumber.toLowerCase() === queryParam.toLowerCase()
      );
      if (found) return mergeSharedIfTarget(found);
    }

    // 3. Stored vendor app number from recent submission
    if (typeof window !== "undefined") {
      const savedNum = localStorage.getItem("bvr_current_vendor_app_number");
      if (savedNum) {
        if (savedNum.toLowerCase() === sharedApp.id.toLowerCase()) {
          return sharedVendorApp;
        }
        const found = storedApplications.find(
          (a) =>
            a.id.toLowerCase() === savedNum.toLowerCase() ||
            a.applicationNumber.toLowerCase() === savedNum.toLowerCase()
        );
        if (found) return mergeSharedIfTarget(found);
      }
    }

    // 4. Default to shared vendor app so Track Status directly tracks live state
    return sharedVendorApp;
  }, [activeAppId, queryParam, storedApplications, sharedApp, sharedVendorApp]);

  const handleCopy = () => {
    if (!activeApp) return;
    const num = activeApp.applicationNumber || activeApp.id;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(num);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const q = searchQuery.trim();
    if (!q) return;

    const matchStored = storedApplications.find(
      (a) =>
        a.id.toLowerCase() === q.toLowerCase() ||
        a.applicationNumber.toLowerCase() === q.toLowerCase()
    );
    if (matchStored) {
      setActiveAppId(matchStored.applicationNumber || matchStored.id);
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }

    if (
      q.toLowerCase() === sharedApp.id.toLowerCase() ||
      q.toLowerCase() === (sharedApp.applicationNumber || "").toLowerCase()
    ) {
      setActiveAppId(sharedApp.applicationNumber || sharedApp.id);
      setSearchOpen(false);
      setSearchQuery("");
      return;
    }

    setLookupError(`Application "${q}" not found. Please verify the application number.`);
  };

  // If no application has been submitted or found yet
  if (!activeApp) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900">
        {/* Top Civic Banner */}
        <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-medium">City Government of Butuan</span>
              <span className="text-slate-400 hidden sm:inline">
                • Official Vendor Registration Portal
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <span className="hidden sm:inline">Agusan del Norte, Philippines</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
            <Link href={backHref} suppressHydrationWarning className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base sm:text-lg leading-none block">
                  Butuan Vendors Registration System
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Application Status &amp; Tracking
                </span>
              </div>
            </Link>

            <Link
              href={backHref}
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span suppressHydrationWarning>{backLabel}</span>
            </Link>
          </div>
        </header>

        {/* Empty State / Lookup Container */}
        <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-xl mx-auto space-y-6">
            <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
              <CardHeader className="text-center p-6 sm:p-8 pb-4 space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
                  <FileSearch className="w-7 h-7" />
                </div>
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Track Vendor Application
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                    No active application was found for this session. Enter your official
                    application number to track its real-time review progress, or submit a new registration.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6 sm:p-8 pt-2 space-y-6">
                <form onSubmit={handleSearchSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Enter Application No. (e.g., BVR-2026-001249)"
                        className="pl-9 text-xs sm:text-sm"
                      />
                    </div>
                    <Button type="submit" className="font-semibold text-xs sm:text-sm cursor-pointer">
                      Track Status
                    </Button>
                  </div>

                  {lookupError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
                      <SearchX className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{lookupError}</span>
                    </div>
                  )}
                </form>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full sm:w-auto font-semibold shadow-xs cursor-pointer gap-1.5"
                    )}
                  >
                    <Building2 className="w-4 h-4" />
                    Start Vendor Registration
                  </Link>

                  <Link
                    href={backHref}
                    suppressHydrationWarning
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full sm:w-auto font-medium text-slate-700 cursor-pointer gap-1.5"
                    )}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span suppressHydrationWarning>{backLabel}</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
          <p>Butuan Vendors Registration System • Local Vendor Registration • Butuan City, Philippines</p>
        </footer>
      </div>
    );
  }

  // Active application exists - derive real values
  const currentStatus = normalizeStatus(activeApp.status);
  const applicationNumber = activeApp.applicationNumber || activeApp.id;
  const vendorId =
    activeApp.vendorId ||
    `BUT-V-${applicationNumber.replace(/\D/g, "").slice(-6) || "000001"}`;
  const businessName = activeApp.business?.businessName || "Registered Business";
  const ownerName = activeApp.owner?.ownerName || "Registered Owner";
  const hasGovId = Boolean(
    activeApp.documents &&
      activeApp.documents.length > 0 &&
      !activeApp.documents[0].isSkippedId
  );
  const govIdDoc = activeApp.documents?.[0];

  const statusConfig = {
    draft: {
      badgeText: "Draft",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
      dotColor: "bg-slate-400",
      title: "Draft Application",
      description: "Your vendor registration draft is saved. Review details and submit when ready.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-800",
      icon: FileText,
      timelineIndex: 0,
    },
    submitted: {
      badgeText: "Registration Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500",
      title: "Registration Submitted",
      description: "Your application has been received and is waiting in the administrative review queue.",
      bannerStyle: "bg-blue-50/70 border-blue-200/80 text-blue-950",
      icon: Clock,
      timelineIndex: 1,
    },
    "under-review": {
      badgeText: "Under Review",
      badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
      dotColor: "bg-amber-500 animate-ping",
      title: "Application Under Review",
      description: "Our administrator is currently reviewing your registration documents and business information.",
      bannerStyle: "bg-amber-50/70 border-amber-200/80 text-amber-950",
      icon: Clock,
      timelineIndex: 2,
    },
    "needs-correction": {
      badgeText: "Action Required",
      badgeColor: "bg-orange-100 text-orange-900 border-orange-300",
      dotColor: "bg-orange-500",
      title: "Action Required",
      description: "An administrator has requested corrections to your application before review can continue.",
      remarks:
        activeApp.adminRemarks ||
        "Please provide the updated information and clearer documents requested by the administrator.",
      bannerStyle: "bg-orange-50/80 border-orange-300 text-orange-950",
      icon: AlertTriangle,
      timelineIndex: 2,
    },
    "correction-submitted": {
      badgeText: "Correction Submitted",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      dotColor: "bg-blue-500 animate-pulse",
      title: "Correction Submitted — Under Review",
      description:
        "Your corrections have been submitted successfully. Your application is now under review by the administrator.",
      bannerStyle: "bg-blue-50/80 border-blue-300 text-blue-950",
      icon: Clock,
      timelineIndex: 2,
    },
    approved: {
      badgeText: "Approved",
      badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
      dotColor: "bg-emerald-500",
      title: "Application Approved",
      description: "Your vendor registration has been approved. You are officially authorized to operate in Butuan City.",
      bannerStyle: "bg-emerald-50/80 border-emerald-200/90 text-emerald-950",
      icon: CheckCircle2,
      timelineIndex: 4,
    },
    rejected: {
      badgeText: "Not Approved",
      badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
      dotColor: "bg-rose-500",
      title: "Application Not Approved",
      description: "Your vendor registration application was not approved during administrative evaluation.",
      remarks:
        activeApp.adminRemarks ||
        "The application could not be approved due to compliance criteria or territorial jurisdiction verification.",
      bannerStyle: "bg-slate-50 border-slate-300 text-slate-900",
      icon: XCircle,
      timelineIndex: 0,
    },
  };

  const current = statusConfig[currentStatus];
  const IconComponent = current.icon;
  const activityList = buildActivityTimeline(activeApp, currentStatus);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/60 text-slate-900">
      {/* Top Civic Banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-medium">City Government of Butuan</span>
            <span className="text-slate-400 hidden sm:inline">
              • Official Vendor Registration Portal
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <span className="hidden sm:inline">Agusan del Norte, Philippines</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          <Link href={backHref} suppressHydrationWarning className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-none block">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Application Status &amp; Tracking
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Track a different application"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Look Up Application</span>
              <span className="sm:hidden">Look Up</span>
            </button>

            <Link
              href={backHref}
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span suppressHydrationWarning className="hidden sm:inline">{backLabel}</span>
              <span suppressHydrationWarning className="sm:hidden">{backShortLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Search Bar Drawer */}
      {searchOpen && (
        <div className="bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs animate-in slide-in-from-top-2">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Application No. (e.g., BVR-2026-001249)"
                  className="pl-9 text-xs sm:text-sm"
                  autoFocus
                />
              </div>
              <Button type="submit" size="sm" className="font-semibold text-xs cursor-pointer">
                Track
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(false)}
                className="text-xs cursor-pointer"
              >
                Close
              </Button>
            </form>
            {lookupError && (
              <p className="text-xs text-rose-600 font-medium mt-1.5">{lookupError}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Top Application Header Card with Copy Button */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Application Number
                </span>
                <Badge className={cn("text-xs font-bold uppercase border", current.badgeColor)}>
                  Status: {current.badgeText}
                </Badge>
                {/* Verification Status Badge */}
                {currentStatus === "approved" || activeApp.verificationStatus === "Verified" || activeApp.isVerified ? (
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold text-xs inline-flex items-center gap-1.5 py-0.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                    <span>Verification: Verified</span>
                  </Badge>
                ) : currentStatus === "rejected" || activeApp.verificationStatus === "Not Verified" ? (
                  <Badge className="bg-slate-100 text-slate-800 border-slate-300 font-bold text-xs inline-flex items-center gap-1.5 py-0.5">
                    <XCircle className="w-3.5 h-3.5 text-slate-600" />
                    <span>Verification: Not Verified</span>
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-950 border-amber-300 font-bold text-xs inline-flex items-center gap-1.5 py-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verification: Pending</span>
                  </Badge>
                )}
              </div>

              {/* Application Number & Copy Button */}
              <div className="flex items-center gap-3 pt-0.5">
                <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-wider">
                  {applicationNumber}
                </span>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                  title="Copy application number to clipboard"
                  aria-label="Copy application number"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {copied && (
                  <span className="text-xs text-emerald-700 font-medium animate-in fade-in">
                    Application number copied.
                  </span>
                )}
              </div>
            </div>

            {/* Real Registered Business info */}
            <div className="text-left sm:text-right space-y-0.5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
              <span className="text-xs text-slate-500 block">Registered Business</span>
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {businessName}
              </h3>
              <p className="text-xs text-slate-600">Owner: {ownerName}</p>
            </div>
          </div>

          {/* Current Status Banner */}
          <div
            className={cn(
              "rounded-2xl border p-5 sm:p-6 shadow-xs transition-all space-y-3",
              current.bannerStyle
            )}
          >
            <div className="flex items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/90 border border-current/20 flex items-center justify-center shrink-0 shadow-2xs">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      Current Status
                    </span>
                    {currentStatus === "under-review" && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                    {current.title}
                  </h2>
                </div>
              </div>

              {/* Real Vendor ID when Approved */}
              {currentStatus === "approved" && (
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                    Official Vendor ID
                  </span>
                  <span className="font-mono text-base sm:text-lg font-black text-emerald-950 bg-white/90 px-3 py-1 rounded-lg border border-emerald-300 inline-block shadow-2xs">
                    {vendorId}
                  </span>
                </div>
              )}
            </div>

            <p className="text-sm sm:text-base font-normal leading-relaxed opacity-90">
              {current.description}
            </p>

            {/* Explicit Status & Verification Summary Indicators */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-current/15 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="opacity-75">Status:</span>
                <span className="font-extrabold uppercase">{current.badgeText}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1.5">
                <span className="opacity-75">Verification:</span>
                <span className="font-extrabold uppercase">
                  {currentStatus === "approved" || activeApp.verificationStatus === "Verified" || activeApp.isVerified
                    ? "Verified"
                    : currentStatus === "rejected" || activeApp.verificationStatus === "Not Verified"
                    ? "Not Verified"
                    : "Pending"}
                </span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1.5">
                <span className="opacity-75">Certificate:</span>
                <span className="font-extrabold uppercase">
                  {currentStatus === "approved" ? "Pending" : "Pending Approval"}
                </span>
              </div>
            </div>

            {/* Administrator Remarks if present (for Needs Correction or Rejected) */}
            {"remarks" in current && (
              <div className="bg-white/85 rounded-xl border border-current/20 p-3.5 space-y-1 text-xs sm:text-sm">
                <span className="font-bold block uppercase tracking-wider text-[11px]">
                  Administrator Remarks:
                </span>
                <p className="italic text-slate-800 font-medium">
                  &ldquo;{current.remarks}&rdquo;
                </p>
              </div>
            )}

            {/* Correction Action for Needs Correction */}
            {currentStatus === "needs-correction" && (
              <div className="space-y-3 pt-1">
                <Link
                  href={`/dashboard/my-application/correction?appNumber=${applicationNumber}`}
                  className={cn(
                    buttonVariants({ variant: "default", size: "sm" }),
                    "bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xs cursor-pointer gap-2"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Review &amp; Correct Application
                </Link>
              </div>
            )}

            {/* Correction Submitted message */}
            {currentStatus === "correction-submitted" && (
              <div className="pt-1 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" />
                Your corrections are under review. No further action is required.
              </div>
            )}
          </div>

          {/* Registration Progress Tracker Card */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Registration Progress Tracker
                </span>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Stages of your application from initial intake to certified issuance.
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-semibold shrink-0",
                  currentStatus === "approved"
                    ? "text-emerald-800 bg-emerald-50 border-emerald-300 font-bold"
                    : "text-slate-600 bg-slate-50"
                )}
              >
                {currentStatus === "approved"
                  ? "Stage 4 of 4 Active"
                  : currentStatus === "needs-correction"
                  ? "Action Required at Stage 2"
                  : currentStatus === "rejected"
                  ? "Evaluation Concluded"
                  : currentStatus === "submitted"
                  ? "Stage 1 of 4"
                  : "Stage 2 of 4 Active"}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 sm:p-8">
              <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Step 1: Form Submitted */}
                <div className="relative">
                  <div className="absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs bg-emerald-600 text-white">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        1. Form Submitted
                      </h4>
                      <span className="text-xs font-semibold text-emerald-700">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      Application form received through the online vendor registration portal.
                    </p>
                  </div>
                </div>

                {/* Step 2: Administrative Review */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      currentStatus === "approved"
                        ? "bg-emerald-600 text-white"
                        : currentStatus === "needs-correction"
                        ? "bg-orange-600 text-white ring-orange-100 ring-4"
                        : currentStatus === "rejected"
                        ? "bg-slate-700 text-white"
                        : "bg-amber-500 text-white ring-amber-100 ring-4"
                    )}
                  >
                    {currentStatus === "approved" ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : currentStatus === "needs-correction" ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : currentStatus === "rejected" ? (
                      <XCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          currentStatus === "approved"
                            ? "text-slate-900"
                            : currentStatus === "needs-correction"
                            ? "text-orange-950"
                            : currentStatus === "rejected"
                            ? "text-slate-700"
                            : "text-blue-900"
                        )}
                      >
                        2. Administrative Review
                      </h4>
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          currentStatus === "approved"
                            ? "text-emerald-700"
                            : currentStatus === "needs-correction"
                            ? "text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200"
                            : currentStatus === "rejected"
                            ? "text-slate-600"
                            : "text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                        )}
                      >
                        {currentStatus === "approved"
                          ? "Completed"
                          : currentStatus === "needs-correction"
                          ? "Action Required"
                          : currentStatus === "rejected"
                          ? "Evaluation Concluded"
                          : "● Current Stage"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                      {currentStatus === "approved"
                        ? "Administrative review completed successfully by City LGU administrators."
                        : currentStatus === "needs-correction"
                        ? "Review paused. Please see administrator remarks above."
                        : currentStatus === "rejected"
                        ? "Administrative evaluation concluded."
                        : "Currently being reviewed by city LGU administrators for compliance."}
                    </p>
                  </div>
                </div>

                {/* Step 3: Vendor Verification */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      currentStatus === "approved"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {currentStatus === "approved" ? (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    ) : (
                      <span className="text-[11px]">3</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          currentStatus === "approved" ? "text-slate-900" : "text-slate-400"
                        )}
                      >
                        3. Vendor Verification
                      </h4>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          currentStatus === "approved" ? "text-emerald-700" : "text-slate-400 font-semibold"
                        )}
                      >
                        {currentStatus === "approved" ? "Verified / Completed" : "○ Pending"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {currentStatus === "approved"
                        ? "Barangay jurisdiction, identity, and stall information verified by administrator."
                        : "Verification of operating address in Butuan City."}
                    </p>
                  </div>
                </div>

                {/* Step 4: Vendor Certificate Issuance */}
                <div className="relative">
                  <div
                    className={cn(
                      "absolute -left-[23px] sm:-left-[27px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ring-4 ring-white shadow-2xs",
                      currentStatus === "approved"
                        ? "bg-blue-600 text-white ring-blue-100 ring-4 animate-pulse"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {currentStatus === "approved" ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    ) : (
                      <span className="text-[11px]">4</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                      <h4
                        className={cn(
                          "font-bold text-sm sm:text-base",
                          currentStatus === "approved" ? "text-blue-900 font-extrabold" : "text-slate-400"
                        )}
                      >
                        4. Vendor Certificate Issuance
                      </h4>
                      <span
                        className={cn(
                          "text-xs font-bold",
                          currentStatus === "approved"
                            ? "text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                            : "text-slate-400 font-semibold"
                        )}
                      >
                        {currentStatus === "approved" ? "● Current Stage (Pending)" : "○ Pending"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                      {currentStatus === "approved"
                        ? "Official Butuan Vendor Certificate issuance is pending final release. Vendor is accredited and verified to operate."
                        : "Digital vendor certificate and registration issuance upon completion."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Activity Timeline */}
          <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Activity Timeline
                </CardTitle>
                <p className="text-xs text-slate-500">
                  Activity log for application #{applicationNumber} — newest activity first
                </p>
              </div>
              <Badge variant="outline" className="text-xs text-slate-600">
                {current.badgeText}
              </Badge>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {activityList.map((act) => {
                const dotBg =
                  act.dotColor === "emerald"
                    ? "bg-emerald-500 ring-emerald-100"
                    : act.dotColor === "orange"
                    ? "bg-orange-500 ring-orange-100"
                    : act.dotColor === "amber"
                    ? "bg-amber-500 ring-amber-100"
                    : act.dotColor === "rose"
                    ? "bg-rose-500 ring-rose-100"
                    : act.dotColor === "blue"
                    ? "bg-blue-600 ring-blue-100"
                    : "bg-slate-400 ring-slate-100";

                return (
                  <div key={act.id} className="flex items-start gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ring-4", dotBg)} />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                        <p className="text-xs font-bold text-slate-900">{act.title}</p>
                        <span className="text-[11px] text-slate-400">{act.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {act.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Real Application Information Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Application Information
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Filed under Butuan City LGU
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Information Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Business Name:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {businessName}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Owner Name:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {ownerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Category:</span>
                    <span className="text-slate-700 text-right font-medium">
                      {activeApp.business?.category || "Food & Refreshment / Market Stall"}
                    </span>
                  </div>
                  {activeApp.business?.businessDescription && (
                    <div className="flex justify-between items-start gap-2 pt-1 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Description:</span>
                      <span className="text-slate-700 text-right font-medium max-w-[240px]">
                        {activeApp.business.businessDescription}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact Information Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Email:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {activeApp.contact?.emailAddress || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Contact Number:</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {activeApp.contact?.contactNumber || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500 font-medium">Alerts:</span>
                    <span className="text-emerald-700 font-semibold text-right">
                      SMS &amp; Email Enabled
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Business Address Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-700" />
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Business Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">House/Bldg No.:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.houseNo || "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Street:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.street || "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Barangay:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.barangay || "—"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">City:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.city || "Butuan City"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Province:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.province || "Agusan del Norte"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Region:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.region || "Caraga"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-slate-500 font-medium">Country:</span>
                    <span className="col-span-2 text-slate-800 font-medium">
                      {activeApp.address?.country || "Philippines"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Verification & Jurisdiction Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <CardTitle className="text-sm font-bold text-slate-900">
                        Verification &amp; Security
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 text-xs sm:text-sm">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-slate-500 font-medium">Government ID:</span>
                      <div>
                        {hasGovId ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                            Provided
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-slate-500 border-slate-300">
                            Not Provided — Optional
                          </Badge>
                        )}
                      </div>
                    </div>

                    {hasGovId && govIdDoc && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                        <span className="font-semibold text-slate-800 block">
                          {govIdDoc.idType || "Government Credential"}
                        </span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">
                          {govIdDoc.filename || "government-id.pdf"} • Status: {govIdDoc.status || "Submitted"}
                        </span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      <p>
                        <strong className="text-slate-700 font-semibold">Security Note:</strong> Account credentials are encrypted and never exposed.
                      </p>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 bg-blue-50/50 border-t border-blue-100 text-xs text-blue-900 rounded-b-xl">
                  <span>Questions regarding your registration status? Contact Butuan City Hall at (085) 341-2000.</span>
                </div>
              </Card>

              {/* Vending Logistics & Compliance Card */}
              <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden md:col-span-2">
                <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700" />
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Vending Logistics & Compliance
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold text-slate-600 bg-white">
                    {activeApp.isVerified ? "Location Verified" : "Pending Verification"}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {!activeApp.address?.street && !activeApp.business?.category ? (
                    <div className="p-4 text-center text-xs sm:text-sm text-slate-500">
                      No logistics information is currently available for this application.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium block">Declared Location</span>
                        <p className="font-bold text-slate-900 truncate">
                          {activeApp.address?.street || "Not specified"}{activeApp.address?.barangay ? `, ${activeApp.address.barangay}` : ""}
                        </p>
                        <span className="inline-block text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-0.5">
                          Submitted by Vendor
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium block">Category & Activity</span>
                        <p className="font-bold text-slate-900 truncate">
                          {activeApp.business?.category || "General Vending"}
                        </p>
                        <span className="inline-block text-[10px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 mt-0.5">
                          Declared Activity
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium block">Inspection Schedule</span>
                        <p className="text-slate-600 font-medium">
                          No on-site appointment scheduled.
                        </p>
                        <span className="inline-block text-[10px] text-slate-600 font-medium bg-slate-100 px-1.5 py-0.5 rounded mt-0.5">
                          Awaiting Schedule
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[11px] text-slate-500 font-medium block">Verification Status</span>
                        <p className="font-semibold text-slate-800">
                          {activeApp.isVerified ? "Verified by City Administrator" : "Pending Field Inspection"}
                        </p>
                        <span className={cn(
                          "inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-0.5",
                          activeApp.isVerified ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60" : "text-amber-800 bg-amber-50 border border-amber-200/60"
                        )}>
                          {activeApp.isVerified ? "Verified" : "Pending Inspection"}
                        </span>
                      </div>
                    </div>
                  )}
                  {activeApp.adminRemarks && (
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/70 text-xs text-blue-950 space-y-0.5">
                      <span className="font-bold block">Logistics & Compliance Notes</span>
                      <p className="text-blue-900">{activeApp.adminRemarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Actions Row */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link
              href={backHref}
              suppressHydrationWarning
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "w-full sm:w-auto font-medium border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span suppressHydrationWarning>{backLabel}</span>
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                className="w-full sm:w-auto text-xs font-semibold cursor-pointer gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Application Number
              </Button>

              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full sm:w-auto font-semibold cursor-pointer gap-1.5"
                )}
              >
                New Application
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <p>Butuan Vendors Registration System • Local Vendor Registration • Butuan City, Philippines</p>
      </footer>
    </div>
  );
}

function ApplicationStatusSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50/60 flex items-center justify-center p-4">
      <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading application status...</span>
      </div>
    </div>
  );
}

export default function ApplicationStatusPage() {
  return (
    <Suspense fallback={<ApplicationStatusSkeleton />}>
      <ApplicationStatusContent />
    </Suspense>
  );
}
