"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Files,
  FileText,
  UploadCloud,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addAdminNotification } from "@/lib/notifications-data";

type DocStatus = "Submitted" | "Under Review" | "Accepted" | "Needs Replacement";

export default function DocumentsPage() {
  // Document state
  const [hasDocument, setHasDocument] = useState(true);
  const [docStatus, setDocStatus] = useState<DocStatus>("Submitted");
  const [docName, setDocName] = useState("government-id.pdf");
  const [submissionDate] = useState("October 6, 2026");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);

  // Upload UI state
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "Submitted":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
            Submitted
          </Badge>
        );
      case "Under Review":
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
            Under Review
          </Badge>
        );
      case "Accepted":
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
            Accepted
          </Badge>
        );
      case "Needs Replacement":
        return (
          <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
            Needs Replacement
          </Badge>
        );
    }
  };

  const handleSimulateUpload = (fileName: string) => {
    setUploadSuccessMsg(`File "${fileName}" selected for upload.`);
    setTimeout(() => {
      setDocName(fileName);
      setHasDocument(true);
      setDocStatus("Submitted");
      setReplaceDialogOpen(false);
      setUploadSuccessMsg("Document attached to registration record.");

      // Workflow notification to Admin
      addAdminNotification({
        type: "document-uploaded",
        title: "Government ID Submitted for Verification",
        message: "A government ID has been submitted and is ready for verification.",
        fullMessage: `A new government ID (${fileName}) has been submitted for application BVR-2026-001248 and is ready for verification.`,
        applicationNumber: "BVR-2026-001248",
        vendorName: "Juan's Food Stall",
        status: "Under Review",
        actionLabel: "Review Documents",
        actionUrl: "/admin/documents",
        href: "/admin/documents",
        priority: "normal",
      });

      setTimeout(() => setUploadSuccessMsg(null), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Documents
            </h2>
            <Badge variant="outline" className="text-xs text-slate-600 bg-slate-50">
              1 Document Slot
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Manage the documents submitted with your vendor registration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status switcher for review simulation */}
          <span className="text-[11px] text-slate-500 font-medium hidden md:inline">
            Preview Status:
          </span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(["Submitted", "Under Review", "Accepted", "Needs Replacement"] as DocStatus[]).map(
              (status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setDocStatus(status)}
                  className={cn(
                    "px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer",
                    docStatus === status
                      ? "bg-white text-slate-900 shadow-2xs font-semibold"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  {status}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Upload Feedback */}
      {uploadSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{uploadSuccessMsg}</span>
        </div>
      )}

      {/* 5. Optional Government ID Notice & State Toggle */}
      <Alert className="bg-blue-50/70 border-blue-200/80 text-blue-950 rounded-2xl p-4 sm:p-5">
        <Info className="w-5 h-5 text-blue-600" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                Government ID is Optional
              </span>
            </div>
            <AlertTitle className="text-sm font-bold text-blue-950">
              Government ID is optional. You may provide one to help verify your registration.
            </AlertTitle>
            <AlertDescription className="text-xs sm:text-sm text-blue-800/90 mt-1">
              If no ID is provided, your registration will display &ldquo;No Government ID Submitted&rdquo;.
            </AlertDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setHasDocument(!hasDocument)}
            className="text-xs font-semibold text-blue-700 border-blue-300 hover:bg-blue-100/60 shrink-0 cursor-pointer self-start sm:self-auto"
          >
            {hasDocument ? "Preview: No Government ID (Empty State)" : "Restore: ID Submitted"}
          </Button>
        </div>
      </Alert>

      {/* Document Section: Active Document vs Empty State */}
      {hasDocument ? (
        /* 4. Document Summary Card: Government ID */
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Government ID
              </CardTitle>
            </div>
            {getStatusBadge(docStatus)}
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-xs uppercase border border-rose-200">
                  PDF
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 text-sm block">
                    {docName}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Date Submitted: {submissionDate}</span>
                    <span>•</span>
                    <span>Size: 1.8 MB</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: View & Replace */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0">
                {/* View Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View</span>
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Document Preview</DialogTitle>
                      <DialogDescription>
                        Submitted file: <span className="font-semibold text-slate-800">{docName}</span>
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                      <div className="h-48 rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-center p-4">
                        <FileCheck2 className="w-10 h-10 text-blue-600 mb-2" />
                        <span className="font-bold text-sm text-slate-800">
                          {docName}
                        </span>
                        <span className="text-xs text-slate-500 mt-1">
                          Philippine National ID / Government Valid ID
                        </span>
                        <Badge className="mt-3 bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                          Legible & Formatted
                        </Badge>
                      </div>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <span className="font-semibold text-slate-800">{docStatus}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Uploaded:</span>
                          <span className="font-semibold text-slate-800">{submissionDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Applicant:</span>
                          <span className="font-semibold text-slate-800">Juan Dela Cruz</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Close
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Replace Dialog */}
                <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
                        <span>Replace</span>
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Replace Government ID</DialogTitle>
                      <DialogDescription>
                        Select a new copy of your Government ID to replace the existing file.
                      </DialogDescription>
                    </DialogHeader>

                    {/* Replace Upload Box */}
                    <div className="py-2 space-y-3">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50">
                        <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <p className="text-xs font-bold text-slate-800">
                          Upload Government ID
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Drag and drop your file here or browse.
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Allowed: PNG, JPG/JPEG, PDF • Maximum: 5MB
                        </p>

                        <div className="mt-4 flex justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleSimulateUpload("updated-gov-id-scanned.pdf")}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs cursor-pointer"
                          >
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Cancel
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Remove button to allow testing the empty state */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHasDocument(false)}
                  className="text-xs font-medium text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  title="Remove to preview empty state"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Document Guidance note based on status */}
            {docStatus === "Needs Replacement" && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Attention Required:</span>
                  <p className="mt-0.5">
                    The submitted image was blurry or incomplete. Please click &ldquo;Replace&rdquo; to provide a clear, readable copy of your Government ID.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* 5. Empty State: No Government ID Submitted */
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardContent className="p-8 sm:p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Files className="w-7 h-7" />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                No Government ID Submitted
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Government ID is optional. You may provide one to help verify your registration.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => {
                  setHasDocument(true);
                  setDocStatus("Submitted");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm cursor-pointer gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Add Government ID</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Semantic reference for empty state accessibility */}
      <div className="sr-only">
        <h3>No Government ID Submitted</h3>
        <p>Government ID is optional. You may provide one to help verify your registration.</p>
        <button type="button">Add Government ID</button>
      </div>

      {/* 6. Upload UI Area */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-blue-700" />
            <CardTitle className="text-base font-bold text-slate-900">
              Upload Government ID
            </CardTitle>
          </div>
          <p className="text-xs text-slate-500">
            Drag and drop your file here or browse.
          </p>
        </CardHeader>

        <CardContent className="p-5 sm:p-6 space-y-4">
          {/* Interactive Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSimulateUpload("government-id.pdf");
            }}
            className={cn(
              "border-2 border-dashed rounded-2xl p-6 sm:p-10 text-center transition-colors cursor-pointer",
              isDragging
                ? "border-blue-600 bg-blue-50/50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
            )}
            onClick={() => handleSimulateUpload("government-id-verified.png")}
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <UploadCloud className="w-6 h-6" />
            </div>

            <h4 className="text-sm font-bold text-slate-900">
              Upload Government ID
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Drag and drop your file here or browse.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-2xs text-xs font-semibold text-blue-600 hover:text-blue-700">
              <span>Choose File</span>
            </div>

            {/* Allowed specifications */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
              <span>Allowed: PNG, JPG/JPEG, PDF</span>
              <span>•</span>
              <span>Maximum: 5MB</span>
              <span>•</span>
              <span className="text-emerald-700">Client-Side UI Only</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7. Documents Status Reference Showcase */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Document Status Guide
          </CardTitle>
          <p className="text-xs text-slate-500">
            Standard status badges utilized by the City Government of Butuan:
          </p>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold">
                Submitted
              </Badge>
              <p className="text-[11px] text-slate-600">
                File successfully uploaded and waiting for queue review.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-semibold">
                Under Review
              </Badge>
              <p className="text-[11px] text-slate-600">
                Staff is actively checking authenticity and validity.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-semibold">
                Accepted
              </Badge>
              <p className="text-[11px] text-slate-600">
                Document verified and approved by the administrator.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <Badge className="bg-rose-50 text-rose-800 border-rose-200 text-xs font-semibold">
                Needs Replacement
              </Badge>
              <p className="text-[11px] text-slate-600">
                Document is unreadable or expired and needs re-upload.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
