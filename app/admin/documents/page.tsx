"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Files,
  ArrowLeft,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  FileText,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ExternalLink,
  Check,
  X,
  Building2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useStoredApplications,
  updateApplication,
} from "@/lib/application-store";
import { addVendorNotification } from "@/lib/notifications-data";

interface UnifiedDocumentRecord {
  id: string;
  applicationId: string;
  vendorName: string;
  businessName: string;
  barangay: string;
  filename: string;
  idType: string;
  uploadedAt: string;
  status: "Submitted" | "Verified" | "Replacement Requested";
  remarks?: string;
}

export default function AdminDocumentsPage() {
  const storedApplications = useStoredApplications();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");

  // Inspect Modal State
  const [inspectDoc, setInspectDoc] = useState<UnifiedDocumentRecord | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: "success" | "warning" | "destructive" | "info";
    message: string;
  } | null>(null);

  // Inspector Viewer State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [replaceReason, setReplaceReason] = useState(
    "Scanned document is unreadable or cropped. Please upload a clear, full-page photo or PDF copy."
  );

  // Build unified document list solely from stored applications
  const allDocuments: UnifiedDocumentRecord[] = useMemo(() => {
    const list: UnifiedDocumentRecord[] = [];

    storedApplications.forEach((app) => {
      (app.documents || []).forEach((doc, idx) => {
        let docStatus: UnifiedDocumentRecord["status"] = "Submitted";
        if (doc.status === "Verified" || doc.status === "Accepted") {
          docStatus = "Verified";
        } else if (
          doc.status === "Replacement Requested" ||
          doc.status === "Needs Replacement"
        ) {
          docStatus = "Replacement Requested";
        }

        list.push({
          id: doc.id || `doc-${app.id}-${idx}`,
          applicationId: app.applicationNumber || app.id,
          vendorName: app.owner.ownerName,
          businessName: app.business.businessName,
          barangay: app.address.barangay,
          filename: doc.filename || doc.idFileName || "government-id.pdf",
          idType: doc.idType || "Philippine National ID (PhilSys)",
          uploadedAt: doc.uploadedAt || app.submittedAt || "Recent",
          status: docStatus,
          remarks: app.adminRemarks,
        });
      });
    });

    return list;
  }, [storedApplications]);

  // Statistics
  const totalCount = allDocuments.length;
  const pendingCount = allDocuments.filter((d) => d.status === "Submitted").length;
  const verifiedCount = allDocuments.filter((d) => d.status === "Verified").length;
  const replacementCount = allDocuments.filter((d) => d.status === "Replacement Requested").length;

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return allDocuments.filter((doc) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.filename.toLowerCase().includes(q) ||
        doc.vendorName.toLowerCase().includes(q) ||
        doc.businessName.toLowerCase().includes(q) ||
        doc.applicationId.toLowerCase().includes(q) ||
        doc.barangay.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === "All" ||
        (selectedStatus === "Submitted" && doc.status === "Submitted") ||
        (selectedStatus === "Verified" && doc.status === "Verified") ||
        (selectedStatus === "Replacement Requested" && doc.status === "Replacement Requested");

      const matchesType =
        selectedType === "All" || doc.idType.toLowerCase().includes(selectedType.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allDocuments, searchQuery, selectedStatus, selectedType]);

  const handleOpenInspect = (doc: UnifiedDocumentRecord) => {
    setInspectDoc(doc);
    setZoomLevel(100);
    setRotation(0);
    setIsInspectOpen(true);
  };

  const handleApproveDoc = (doc: UnifiedDocumentRecord) => {
    updateApplication(doc.applicationId, {
      documents: [
        {
          id: doc.id,
          filename: doc.filename,
          idType: doc.idType,
          uploadedAt: doc.uploadedAt,
          status: "Verified",
        },
      ],
    });

    addVendorNotification({
      type: "document-verified",
      title: "Document Verified",
      message: `Your ${doc.idType} (${doc.filename}) was reviewed and verified compliant.`,
      applicationNumber: doc.applicationId,
      vendorName: doc.vendorName,
      status: "Verified",
      priority: "normal",
    });

    setIsInspectOpen(false);
    setFeedbackNotice({
      type: "success",
      message: `Document ${doc.filename} has been verified and approved.`,
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleRequestReplacement = (doc: UnifiedDocumentRecord) => {
    updateApplication(doc.applicationId, {
      status: "needs_correction",
      adminRemarks: replaceReason,
      documents: [
        {
          id: doc.id,
          filename: doc.filename,
          idType: doc.idType,
          uploadedAt: doc.uploadedAt,
          status: "Replacement Requested",
        },
      ],
    });

    addVendorNotification({
      type: "document-replacement",
      title: "Document Replacement Requested",
      message: `Administrator requested a new copy of ${doc.filename}: "${replaceReason}"`,
      applicationNumber: doc.applicationId,
      vendorName: doc.vendorName,
      status: "Needs Correction",
      priority: "high",
    });

    setIsInspectOpen(false);
    setFeedbackNotice({
      type: "warning",
      message: `Replacement requested for ${doc.filename}. Vendor notified.`,
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Document Verification Desk
            </h2>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
              Compliance & Audit
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Review uploaded Philippine government IDs, barangay certifications, and vendor credentials for Butuan City.
          </p>
        </div>

        <Link
          href="/admin"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5 self-start sm:self-auto"
          )}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Live Action Feedback Notice */}
      {feedbackNotice && (
        <div
          className={cn(
            "p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in",
            feedbackNotice.type === "success" && "bg-emerald-50 border-emerald-300 text-emerald-950",
            feedbackNotice.type === "warning" && "bg-amber-50 border-amber-300 text-amber-950",
            feedbackNotice.type === "destructive" && "bg-rose-50 border-rose-300 text-rose-950",
            feedbackNotice.type === "info" && "bg-blue-50 border-blue-300 text-blue-950"
          )}
        >
          <div className="flex items-center gap-2.5">
            {feedbackNotice.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedbackNotice.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />}
            {feedbackNotice.type === "destructive" && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {feedbackNotice.type === "info" && <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-500 hover:text-slate-800 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Documents
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Uploaded credentials</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 mt-2">{pendingCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Awaiting evaluation</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Verified Compliant
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">{verifiedCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Officially approved</p>
        </Card>

        <Card className="bg-white border-slate-200/90 shadow-2xs p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Needs Replacement
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-700 mt-2">{replacementCount}</div>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Flagged for re-upload</p>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by filename, vendor name, business, or application ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs sm:text-sm h-10 rounded-xl bg-slate-50 border-slate-200 focus-visible:bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-3">
            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={(val) => setSelectedStatus(val || "All")}>
              <SelectTrigger className="w-[160px] h-10 text-xs rounded-xl bg-slate-50 border-slate-200">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <SelectValue placeholder="All Statuses" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                <SelectItem value="Submitted">Pending Review</SelectItem>
                <SelectItem value="Verified">Verified Compliant</SelectItem>
                <SelectItem value="Replacement Requested">Needs Replacement</SelectItem>
              </SelectContent>
            </Select>

            {/* Document Type Filter */}
            <Select value={selectedType} onValueChange={(val) => setSelectedType(val || "All")}>
              <SelectTrigger className="w-[180px] h-10 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="All Credential Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Credential Types</SelectItem>
                <SelectItem value="PhilSys">PhilSys National ID</SelectItem>
                <SelectItem value="Barangay">Barangay Clearance</SelectItem>
                <SelectItem value="Passport">Passport</SelectItem>
                <SelectItem value="Driver">Driver&apos;s License</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Documents Table */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Files className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Uploaded Credentials Registry
            </CardTitle>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Showing {filteredDocuments.length} of {totalCount} records
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Files className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                {totalCount === 0
                  ? "No submitted documents available for review."
                  : "No matching documents found"}
              </p>
              <p className="text-xs text-slate-500">
                {totalCount === 0
                  ? "Documents uploaded by vendors during registration will appear here."
                  : "Try refining your search query or reset status filters."}
              </p>
              {totalCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedStatus("All");
                    setSelectedType("All");
                  }}
                  className="text-xs mt-2"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Document File</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Credential Classification</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Vendor & Business</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Application Ref</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5">Compliance Status</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs py-3.5 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-200/60">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 text-xs block truncate max-w-[180px]">
                              {doc.filename}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block">
                              Uploaded {doc.uploadedAt}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-700 font-medium py-3.5">
                        {doc.idType}
                      </TableCell>

                      <TableCell className="py-3.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{doc.vendorName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{doc.businessName}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-3.5">
                        <Link
                          href={`/admin/applications/${doc.applicationId}`}
                          className="font-mono text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{doc.applicationId}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                      </TableCell>

                      <TableCell className="py-3.5">
                        {doc.status === "Verified" ? (
                          <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 text-xs font-bold gap-1 py-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </Badge>
                        ) : doc.status === "Replacement Requested" ? (
                          <Badge className="bg-rose-100 text-rose-900 border-rose-300 text-xs font-bold gap-1 py-0.5">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            <span>Replacement Needed</span>
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-bold gap-1 py-0.5">
                            <Clock className="w-3 h-3 text-blue-600" />
                            <span>Pending Review</span>
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenInspect(doc)}
                            className="h-8 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-300 gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </Button>

                          {doc.status !== "Verified" && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleApproveDoc(doc)}
                              className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Verify</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interactive Document Inspection & Compliance Verification Modal */}
      <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
          {inspectDoc && (
            <div>
              <DialogHeader className="p-5 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
                        Document Inspection & Verification
                      </DialogTitle>
                      <Badge variant="outline" className="text-xs">
                        {inspectDoc.idType}
                      </Badge>
                    </div>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      {inspectDoc.filename} • Attached to application {inspectDoc.applicationId} ({inspectDoc.vendorName})
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-5 space-y-5">
                {/* Simulated High-Res Scanned Document Preview Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Official Scanned Image Preview
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                        aria-label="Zoom out"
                      >
                        <ZoomOut className="w-3 h-3" />
                      </Button>
                      <span className="text-[11px] font-mono px-1">{zoomLevel}%</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                        aria-label="Zoom in"
                      >
                        <ZoomIn className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-xs"
                        onClick={() => setRotation((r) => (r + 90) % 360)}
                        aria-label="Rotate image"
                      >
                        <RotateCw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Document Canvas Container */}
                  <div className="relative min-h-[260px] bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center p-6 shadow-inner border border-slate-800">
                    <div
                      className="bg-white rounded-lg shadow-2xl p-6 text-slate-900 max-w-md w-full transition-all duration-200 origin-center"
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      }}
                    >
                      {/* Simulated Official ID Layout */}
                      <div className="border-2 border-slate-800 rounded-lg p-4 space-y-3 bg-gradient-to-br from-slate-50 to-blue-50/40">
                        <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-[10px] font-bold">
                              RP
                            </div>
                            <div>
                              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                                Republic of the Philippines
                              </div>
                              <div className="text-[11px] font-extrabold text-blue-900 leading-tight">
                                {inspectDoc.idType}
                              </div>
                            </div>
                          </div>
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div className="flex gap-3 pt-1">
                          {/* Photo Avatar box */}
                          <div className="w-20 h-24 bg-slate-200 rounded border border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <User className="w-8 h-8 text-slate-400" />
                            <span className="text-[8px] uppercase font-bold text-slate-500 mt-1">Photo ID</span>
                          </div>

                          <div className="space-y-1.5 min-w-0 flex-1 text-[11px]">
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Full Legal Name</span>
                              <span className="font-extrabold text-slate-900">{inspectDoc.vendorName}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Jurisdiction</span>
                              <span className="font-medium text-slate-800">{inspectDoc.barangay}, Butuan City</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 uppercase font-semibold block">Application Reference</span>
                              <span className="font-mono text-[10px] font-bold text-slate-800">
                                {inspectDoc.applicationId}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                          <span>UPLOADED: {inspectDoc.uploadedAt}</span>
                          <span className="text-emerald-700 font-bold">STATUS: {inspectDoc.status.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Criteria Checklist */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
                  <span className="text-xs font-bold text-slate-800 block">
                    City Licensing Verification Criteria:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Holder identity verified</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Document unexpired</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Edges uncropped</span>
                    </div>
                  </div>
                </div>

                {/* Replacement Reason Box if flagged */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Replacement Request Note (if requesting new upload from vendor):
                  </label>
                  <Input
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="text-xs h-9 bg-white"
                    placeholder="Enter reason for requesting replacement document..."
                  />
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2 justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInspectOpen(false)}
                  className="text-xs"
                >
                  Close Inspection
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRequestReplacement(inspectDoc)}
                    className="text-xs text-rose-700 border-rose-300 hover:bg-rose-50 gap-1.5"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Request Replacement</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleApproveDoc(inspectDoc)}
                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Verify Compliant</span>
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
