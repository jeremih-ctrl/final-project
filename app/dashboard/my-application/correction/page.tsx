"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  X,
  XCircle,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MOCK_VENDOR_APPLICATION,
  VendorAppStatus,
  useSharedApplication,
} from "@/lib/vendor-application-state";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionStep =
  | "business"
  | "contact"
  | "address"
  | "government-id"
  | "account"
  | "review"
  | "done";

interface FormState {
  // Section 1: Business Information (mock read-only/verified)
  businessName: string;
  ownerName: string;
  businessDescription: string;
  // Section 2: Contact Information
  contactNumber: string;
  email: string;
  // Section 3: Business Address (requires correction)
  houseNumber: string;
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  country: string;
  // Section 4: Government ID (requires replacement)
  idType: string;
  govIdFile: File | null;
  govIdFileName: string;
  // Errors
  streetError: string;
  govIdError: string;
}

interface ChangeEntry {
  field: string;
  label: string;
  oldValue: string;
  newValue: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

const SECTIONS: {
  id: SectionStep;
  number: number;
  label: string;
  shortLabel: string;
  hasCorrection: boolean;
}[] = [
  { id: "business", number: 1, label: "Business Information", shortLabel: "Business", hasCorrection: false },
  { id: "contact", number: 2, label: "Contact Information", shortLabel: "Contact", hasCorrection: false },
  { id: "address", number: 3, label: "Business Address", shortLabel: "Address", hasCorrection: true },
  { id: "government-id", number: 4, label: "Government ID", shortLabel: "Gov. ID", hasCorrection: true },
  { id: "account", number: 5, label: "Account Information", shortLabel: "Account", hasCorrection: false },
  { id: "review", number: 6, label: "Review & Submit", shortLabel: "Review", hasCorrection: false },
];

function stepIndex(step: SectionStep) {
  return SECTIONS.findIndex((s) => s.id === step);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CorrectionTag({ text = "Correction Required" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800 border border-orange-300 uppercase tracking-wide">
      <AlertTriangle className="w-3 h-3 text-orange-600" />
      {text}
    </span>
  );
}

function VerifiedTag() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
      <Check className="w-3 h-3 text-emerald-600" />
      Verified
    </span>
  );
}

function FieldNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-orange-800 font-medium mt-1">
      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-500" />
      <span>{children}</span>
    </p>
  );
}

function ValidationError({ message }: { message: string }) {
  return message ? (
    <p className="flex items-center gap-1.5 text-xs text-rose-700 font-medium mt-1.5 animate-in fade-in">
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{message}</span>
    </p>
  ) : null;
}

// ─── Step Navigator ───────────────────────────────────────────────────────────

function SectionBreadcrumb({
  current,
  onSelectStep,
}: {
  current: SectionStep;
  onSelectStep: (step: SectionStep) => void;
}) {
  const currentIdx = stepIndex(current);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center gap-1.5 min-w-max">
        {SECTIONS.map((sec, i) => {
          const isActive = sec.id === current;
          const isPassed = i < currentIdx;

          return (
            <div key={sec.id} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
              <button
                type="button"
                onClick={() => onSelectStep(sec.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : isPassed
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-50",
                  sec.hasCorrection && !isActive && "ring-1 ring-orange-300 text-orange-800 bg-orange-50/70"
                )}
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded-full flex items-center justify-center text-[10px] leading-none shrink-0",
                    isActive
                      ? "bg-white text-blue-700 font-bold"
                      : isPassed
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {isPassed ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : sec.number}
                </span>
                <span>{sec.shortLabel}</span>
                {sec.hasCorrection && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" title="Correction Required" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CorrectionFormPage() {
  const { application: app, status, updateStatus } = useSharedApplication();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status synced from shared application
  const demoStatus = status;

  function setDemoStatus(newStatus: VendorAppStatus) {
    updateStatus(newStatus);
  }

  // Step state
  const [step, setStep] = useState<SectionStep>("address");

  // Form state
  const [form, setForm] = useState<FormState>({
    businessName: app.businessName,
    ownerName: app.ownerName,
    businessDescription: "Selling local delicacies and cooked food at Butuan Public Market.",
    contactNumber: app.contactNumber,
    email: app.email,
    houseNumber: app.houseNumber,
    street: app.street, // initially incomplete "J.C. Aquino"
    barangay: app.barangay,
    city: app.city,
    province: app.province,
    region: app.region,
    country: app.country,
    idType: "PhilSys National ID",
    govIdFile: null,
    govIdFileName: "",
    streetError: "",
    govIdError: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error";
  }>({ visible: false, message: "", type: "success" });

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 5000);
  }

  // Compute changes made
  const changes: ChangeEntry[] = [];
  if (form.street.trim() !== app.street) {
    changes.push({
      field: "street",
      label: "Street / Business Address",
      oldValue: app.street,
      newValue: form.street.trim() || "(empty)",
    });
  }
  if (form.govIdFileName) {
    changes.push({
      field: "governmentId",
      label: "Government ID",
      oldValue: "gov_id_juan.jpg (Unreadable)",
      newValue: form.govIdFileName,
    });
  }

  // Validation
  function validateAddress(): boolean {
    if (!form.street.trim()) {
      setForm((f) => ({
        ...f,
        streetError: "Street address is required. Please provide the complete street address.",
      }));
      return false;
    }
    setForm((f) => ({ ...f, streetError: "" }));
    return true;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setForm((f) => ({
        ...f,
        govIdError: "Invalid file type. Only PNG, JPG, JPEG, or PDF files are allowed.",
        govIdFile: null,
        govIdFileName: "",
      }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setForm((f) => ({
        ...f,
        govIdError: "File is too large. Maximum allowed size is 5 MB.",
        govIdFile: null,
        govIdFileName: "",
      }));
      return;
    }
    setForm((f) => ({
      ...f,
      govIdFile: file,
      govIdFileName: file.name,
      govIdError: "",
    }));
  }

  function handleRemoveFile() {
    setForm((f) => ({
      ...f,
      govIdFile: null,
      govIdFileName: "",
      govIdError: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmitCorrections() {
    setConfirmOpen(false);
    setSubmitting(true);

    // Simulate async submission and sync status to shared store
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setStep("done");
      updateStatus("correction-submitted");
      showToast(
        "Your corrections have been submitted successfully. Your application is now under review.",
        "success"
      );
    }, 1200);
  }

  function handleResetDemo() {
    setSubmitted(false);
    updateStatus("needs-correction");
    setStep("address");
    setForm((f) => ({
      ...f,
      street: app.street,
      govIdFile: null,
      govIdFileName: "",
      streetError: "",
      govIdError: "",
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── If demoStatus is not needs-correction and not yet submitted ───────────
  if (demoStatus !== "needs-correction" && !submitted) {
    return (
      <div className="space-y-6">
        <DemoSwitcher demoStatus={demoStatus} setDemoStatus={setDemoStatus} onReset={handleResetDemo} />

        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-6 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">
              Application Correction Portal
            </CardTitle>
            <p className="text-xs text-slate-500">
              Application #{app.applicationNumber}
            </p>
          </CardHeader>
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-600">
              <CheckCircle2 className="w-6 h-6 text-slate-500" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                No Corrections Currently Required
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                This application is currently in status:{" "}
                <Badge className="font-semibold">{demoStatus}</Badge>. The correction form is only active when
                an application has status <strong>Needs Correction</strong>.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                type="button"
                onClick={handleResetDemo}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Switch to Needs Correction Demo
              </Button>
              <Link
                href="/application-status"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold transition-colors"
              >
                View Application Status
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Render: Done / Success State ──────────────────────────────────────────
  if (submitted || step === "done") {
    return (
      <div className="space-y-6">
        <Toast toast={toast} />
        <DemoSwitcher demoStatus={demoStatus} setDemoStatus={setDemoStatus} onReset={handleResetDemo} />
        <SuccessState app={app} changes={changes} onResetDemo={handleResetDemo} />
      </div>
    );
  }

  // ─── Render: Main Correction Wizard ────────────────────────────────────────
  return (
    <div className="space-y-6">
      <Toast toast={toast} />

      {/* Demo / Mock Switcher Bar */}
      <DemoSwitcher demoStatus={demoStatus} setDemoStatus={setDemoStatus} onReset={handleResetDemo} />

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-orange-300/80 shadow-xs overflow-hidden">
        <div className="bg-orange-50/90 border-b border-orange-200 px-6 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-700" />
            <span className="text-xs font-bold text-orange-950 uppercase tracking-wider">
              Application Correction Form
            </span>
          </div>
          <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-xs font-bold w-fit">
            ● ACTION REQUIRED
          </Badge>
        </div>

        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Review &amp; Correct Application
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Application Number:{" "}
                <span className="font-mono font-bold text-slate-800">
                  {app.applicationNumber}
                </span>{" "}
                • Current Status:{" "}
                <span className="font-bold text-orange-800">Needs Correction</span>
              </p>
            </div>
            <Link
              href="/application-status"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-colors w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Status
            </Link>
          </div>

          {/* Prominent Administrator Remarks */}
          <div className="bg-orange-50/90 border border-orange-200/90 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                Administrator Remarks
              </span>
              {app.correctionDate && (
                <span className="text-[11px] text-orange-800 font-medium">
                  Requested: <strong>{app.correctionDate}</strong>
                </span>
              )}
            </div>
            <p className="text-sm text-orange-950 font-medium leading-relaxed italic bg-white/60 p-3 rounded-lg border border-orange-200/60">
              &ldquo;{app.administratorRemarks}&rdquo;
            </p>
            <p className="text-xs text-orange-900">
              Your application requires corrections. Please review the administrator&apos;s remarks,
              update the requested information, and resubmit your application.
            </p>
          </div>

          {/* Quick jump to correction fields */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">Jump directly to fields:</span>
            <button
              type="button"
              onClick={() => setStep("address")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                step === "address"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300"
              )}
            >
              <MapPin className="w-3.5 h-3.5" />
              Section 3: Business Address (Required)
            </button>
            <button
              type="button"
              onClick={() => setStep("government-id")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                step === "government-id"
                  ? "bg-orange-600 text-white"
                  : "bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-300"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Section 4: Government ID (Replacement)
            </button>
            <button
              type="button"
              onClick={() => setStep("review")}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ml-auto",
                step === "review"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              Section 6: Review
            </button>
          </div>
        </div>
      </div>

      {/* 6-Section Step Breadcrumb */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4">
        <SectionBreadcrumb current={step} onSelectStep={setStep} />
      </div>

      {/* ── Section 1: Business Information ───────────────────────────────────── */}
      {step === "business" && (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 1: Business Information
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Primary business identification registered with Butuan City.
              </p>
            </div>
            <VerifiedTag />
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>This section was reviewed and verified by the administrator. No correction is required.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Registered Business Name
                </label>
                <input
                  type="text"
                  value={form.businessName}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Business Owner / Registrant
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Line of Business / Description
              </label>
              <textarea
                value={form.businessDescription}
                readOnly
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setStep("contact")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer gap-2"
              >
                Next: Contact Information
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 2: Contact Information ────────────────────────────────────── */}
      {step === "contact" && (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 2: Contact Information
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Official contact details for communication and alert delivery.
              </p>
            </div>
            <VerifiedTag />
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Contact details verified. No correction is required for this section.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Contact Mobile Number
                </label>
                <input
                  type="text"
                  value={form.contactNumber}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("business")}
                className="cursor-pointer gap-2 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep("address")}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer gap-2"
              >
                Next: Business Address (Action Required)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 3: Business Address (CORRECTION REQUIRED) ─────────────────── */}
      {step === "address" && (
        <Card className="bg-white border-2 border-orange-300/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-orange-200/80 bg-orange-50/50 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 3: Business Address
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Please review and correct the physical operating address.
              </p>
            </div>
            <CorrectionTag text="Correction Required" />
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Admin Remark Callout for this section */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
              <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                Administrator Remark for Address:
              </span>
              <p className="text-xs sm:text-sm text-orange-950 font-medium">
                &ldquo;Please provide a clearer business address. Street details are incomplete.&rdquo;
              </p>
            </div>

            {/* House Number — read-only */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block" htmlFor="houseNumber">
                House / Building / Stall Number
              </label>
              <input
                id="houseNumber"
                type="text"
                value={form.houseNumber}
                readOnly
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 font-medium cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-400">
                This field is complete and does not require changes.
              </p>
            </div>

            {/* Street / Business Address — EDITABLE, REQUIRES CORRECTION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 block" htmlFor="street">
                  Street / Business Address <span className="text-rose-600 font-bold">*</span>
                </label>
                <CorrectionTag text="Correction Required" />
              </div>

              <input
                id="street"
                type="text"
                value={form.street}
                onChange={(e) =>
                  setForm((f) => ({ ...f, street: e.target.value, streetError: "" }))
                }
                placeholder="e.g., 123 J.C. Aquino Avenue"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-1",
                  form.streetError
                    ? "border-rose-400 bg-rose-50/50 focus:ring-rose-300"
                    : form.street !== app.street
                    ? "border-emerald-400 bg-emerald-50/30 focus:ring-emerald-300"
                    : "border-orange-300 bg-orange-50/30 focus:ring-blue-300"
                )}
              />

              {form.streetError ? (
                <ValidationError message={form.streetError} />
              ) : (
                <FieldNote>Please provide the complete street address (e.g., include Ave., St., Road).</FieldNote>
              )}

              {form.street !== app.street && (
                <div className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1 mt-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Updated from &ldquo;{app.street}&rdquo; to &ldquo;{form.street}&rdquo;
                </div>
              )}
            </div>

            {/* Location hierarchy — read-only */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {[
                { label: "Barangay", value: form.barangay },
                { label: "City", value: form.city },
                { label: "Province", value: form.province },
                { label: "Region", value: form.region },
              ].map(({ label, value }) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">{label}</label>
                  <input
                    type="text"
                    value={value}
                    readOnly
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-600 font-medium cursor-not-allowed"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("contact")}
                className="cursor-pointer gap-2 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (!validateAddress()) return;
                  setStep("government-id");
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold cursor-pointer gap-2"
              >
                Next: Government ID (Action Required)
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 4: Government ID (REPLACEMENT REQUESTED) ─────────────────── */}
      {step === "government-id" && (
        <Card className="bg-white border-2 border-orange-300/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-orange-200/80 bg-orange-50/50 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 4: Government ID Replacement
                </CardTitle>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Upload a readable copy of your identification document.
              </p>
            </div>
            <CorrectionTag text="Replacement Requested" />
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-5">
            {/* Administrator Remark Callout */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 space-y-1">
              <span className="text-[11px] font-bold text-orange-900 uppercase tracking-wider block">
                Administrator Remark for Government ID:
              </span>
              <p className="text-xs sm:text-sm text-orange-950 font-medium">
                &ldquo;Replace the submitted government ID image with a readable copy. The previous image was blurry.&rdquo;
              </p>
            </div>

            {/* Currently submitted ID status card */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-700">Previously Submitted Document</p>
                <p className="text-xs text-slate-500 truncate">PhilSys National ID — gov_id_juan.jpg (Unreadable copy)</p>
              </div>
              <Badge className="bg-orange-100 text-orange-900 border-orange-300 text-[11px] font-semibold shrink-0">
                Blurry / Unreadable
              </Badge>
            </div>

            {/* Upload Zone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-900 block" htmlFor="govIdUpload">
                  Upload Replacement Government ID
                </label>
                <span className="text-[11px] text-slate-500">PNG, JPG, JPEG, PDF — Max 5 MB</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors hover:bg-slate-50",
                  form.govIdFile
                    ? "border-emerald-300 bg-emerald-50/50"
                    : form.govIdError
                    ? "border-rose-300 bg-rose-50/40"
                    : "border-orange-300 bg-orange-50/20 hover:border-blue-300"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  className="sr-only"
                  onChange={handleFileChange}
                  id="govIdUpload"
                  aria-label="Upload replacement government ID"
                />

                {form.govIdFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <p className="text-sm font-bold text-emerald-800">Replacement File Selected</p>
                    <p className="text-xs text-emerald-700 font-medium max-w-[280px] truncate">
                      {form.govIdFileName} ({(form.govIdFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 mt-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Remove replacement file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-orange-600" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        Click to select new readable file
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Choose a clear, well-lit photo or scan of your government ID
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {form.govIdError ? (
                <ValidationError message={form.govIdError} />
              ) : (
                <FieldNote>
                  Please upload a clearer copy of your government ID. Replacement is optional if you choose to proceed with existing review.
                </FieldNote>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("address")}
                className="cursor-pointer gap-2 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep("account")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer gap-2"
              >
                Next: Account Information
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 5: Account Information ───────────────────────────────────── */}
      {step === "account" && (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 5: Account Information
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vendor portal login credentials and municipal terms agreement.
              </p>
            </div>
            <VerifiedTag />
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Account credentials and consents are secure. No modification is required.</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Registered Email / Login ID
                </label>
                <input
                  type="email"
                  value={form.email}
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Account Password
                </label>
                <input
                  type="password"
                  value="••••••••••••"
                  readOnly
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 font-medium cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">
                  Encrypted for security. Cannot be modified in this form.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Agreements Recorded:</p>
              <p>✓ Terms &amp; Conditions agreed on October 6, 2026</p>
              <p>✓ Privacy Policy consent confirmed on October 6, 2026</p>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("government-id")}
                className="cursor-pointer gap-2 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep("review")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer gap-2"
              >
                Next: Review &amp; Submit
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 6: Review & Submit (FINAL REVIEW) ────────────────────────── */}
      {step === "review" && (
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-700" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Section 6: Review Before Resubmission
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Confirm your corrected details before submitting to the administrator.
              </p>
            </div>
            <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-bold">
              Final Step
            </Badge>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-6">
            {/* Application Overview Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Application Number
                </span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {app.applicationNumber}
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Current Status
                </span>
                <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-xs font-bold">
                  Needs Correction
                </Badge>
              </div>
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Status After Submission
                </span>
                <Badge className="bg-amber-100 text-amber-950 border-amber-300 text-xs font-bold">
                  Under Review
                </Badge>
              </div>
            </div>

            {/* Administrator Remarks Reminder */}
            <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs space-y-1">
              <span className="font-bold text-orange-900 uppercase tracking-wider block">
                Requested Corrections:
              </span>
              <p className="text-orange-950 font-medium italic">
                &ldquo;{app.administratorRemarks}&rdquo;
              </p>
            </div>

            {/* Corrections Made Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Corrections Made
                </h3>
                <span className="text-xs text-slate-500">
                  {changes.length} change{changes.length === 1 ? "" : "s"} detected
                </span>
              </div>

              {changes.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-900">
                      No corrections detected yet.
                    </p>
                    <p className="text-xs text-amber-800">
                      Please go back to <strong>Section 3 (Business Address)</strong> or{" "}
                      <strong>Section 4 (Government ID)</strong> and update the required information before resubmitting.
                    </p>
                    <div className="pt-1 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setStep("address")}
                        className="bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold cursor-pointer"
                      >
                        Edit Business Address
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setStep("government-id")}
                        className="text-xs font-semibold cursor-pointer border-slate-300"
                      >
                        Replace Government ID
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {changes.map((c) => (
                    <div
                      key={c.field}
                      className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-emerald-950">{c.label}</p>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                            Updated
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="text-slate-400 line-through truncate max-w-[200px]">
                            {c.oldValue}
                          </span>
                          <span className="hidden sm:inline text-slate-400">→</span>
                          <span className="font-bold text-emerald-900 truncate max-w-[280px]">
                            {c.newValue}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Complete Updated Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Updated Application Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 rounded-xl border border-slate-200 bg-slate-50/80">
                <div>
                  <span className="text-slate-500 font-medium">Business:</span>
                  <p className="font-semibold text-slate-900">{form.businessName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Owner:</span>
                  <p className="font-semibold text-slate-900">{form.ownerName}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Contact:</span>
                  <p className="font-semibold text-slate-900">{form.contactNumber}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Email:</span>
                  <p className="font-semibold text-slate-900">{form.email}</p>
                </div>
                <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                  <span className="text-slate-500 font-medium">Updated Street Address:</span>
                  <p className="font-bold text-slate-900">{form.houseNumber} {form.street}, {form.barangay}, {form.city}</p>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500 font-medium">Government ID Document:</span>
                  <p className="font-bold text-slate-900">
                    {form.govIdFileName ? `${form.govIdFileName} (New replacement file)` : "Existing PhilSys ID"}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("government-id")}
                className="cursor-pointer gap-2 border-slate-300"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Edit
              </Button>

              <Button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={changes.length === 0 || !form.street.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                <Send className="w-4 h-4" />
                Submit Corrections
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmOpen && (
        <ConfirmationModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleSubmitCorrections}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ─── Demo Switcher Component ──────────────────────────────────────────────────

function DemoSwitcher({
  demoStatus,
  setDemoStatus,
  onReset,
}: {
  demoStatus: VendorAppStatus;
  setDemoStatus: (s: VendorAppStatus) => void;
  onReset: () => void;
}) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-700" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Demo / Mock State
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            — Test vendor correction &amp; resubmission behavior:
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Reset Form State
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {([
          { status: "under-review" as VendorAppStatus, label: "Under Review", cls: "bg-amber-600 text-white" },
          { status: "needs-correction" as VendorAppStatus, label: "● Needs Correction", cls: "bg-orange-600 text-white" },
          { status: "correction-submitted" as VendorAppStatus, label: "Correction Submitted", cls: "bg-blue-700 text-white" },
          { status: "approved" as VendorAppStatus, label: "Approved", cls: "bg-emerald-600 text-white" },
          { status: "rejected" as VendorAppStatus, label: "Rejected", cls: "bg-slate-800 text-white" },
        ]).map(({ status, label, cls }) => (
          <button
            key={status}
            type="button"
            onClick={() => setDemoStatus(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              demoStatus === status ? cn(cls, "shadow-xs") : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Success State ────────────────────────────────────────────────────────────

function SuccessState({
  app,
  changes,
  onResetDemo,
}: {
  app: typeof MOCK_VENDOR_APPLICATION;
  changes: ChangeEntry[];
  onResetDemo: () => void;
}) {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-2 border-emerald-300/90 rounded-2xl shadow-xs overflow-hidden">
        <div className="bg-emerald-50/90 border-b border-emerald-200 px-6 py-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
            Corrections Submitted Successfully
          </span>
        </div>

        <CardContent className="p-8 space-y-6 text-center">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-300 flex items-center justify-center">
              <Check className="w-8 h-8 text-emerald-600 stroke-[3]" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-slate-900">
              Corrections Submitted!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              Your corrections have been submitted successfully. Your application is now under
              review by the administrator.
            </p>
            {changes.length > 0 && (
              <p className="text-xs text-emerald-700 font-medium">
                {changes.length} updated field{changes.length === 1 ? "" : "s"} submitted for review.
              </p>
            )}
          </div>

          <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-xs text-slate-600 font-medium">Application Number:</span>
            <span className="font-mono font-bold text-slate-900 text-sm">
              {app.applicationNumber}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-600 font-medium">Status:</span>
            <Badge className="bg-amber-100 text-amber-950 border-amber-300 text-xs font-bold">
              Under Review
            </Badge>
          </div>

          {/* Form locked message */}
          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium max-w-md mx-auto">
            The correction form is now disabled. You cannot resubmit while your application is under review.
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/application-status"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              View Application Status
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              Go to Dashboard
            </Link>
            <button
              type="button"
              onClick={onResetDemo}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Test Again
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Activity Timeline (Task 9 Requirement 9) */}
      <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Activity Timeline
            </CardTitle>
            <p className="text-xs text-slate-500">
              Updated dynamically after correction submission — newest first.
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-900 border-blue-300 text-xs font-semibold">
            Correction Submitted
          </Badge>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {[
            {
              title: "1. Correction Submitted",
              desc: "Vendor submitted application corrections. Status changed from Needs Correction to Under Review.",
              date: "Today • Just now",
              dot: "bg-blue-600 ring-4 ring-blue-100",
              titleColor: "text-blue-950",
            },
            {
              title: "2. Correction Requested",
              desc: "Administrator requested corrections to business address and government ID.",
              date: "Oct 6, 2026 • 2:45 PM",
              dot: "bg-orange-500",
              titleColor: "text-slate-900",
            },
            {
              title: "3. Application Submitted",
              desc: "Vendor registration was successfully submitted through the portal.",
              date: "Oct 6, 2026 • 9:30 AM",
              dot: "bg-emerald-500",
              titleColor: "text-slate-900",
            },
            {
              title: "4. Application Created",
              desc: "Initial application registration draft was created.",
              date: "Oct 6, 2026 • 9:15 AM",
              dot: "bg-slate-400",
              titleColor: "text-slate-900",
            },
          ].map((entry, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shrink-0", entry.dot)} />
              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-xs font-bold", entry.titleColor)}>{entry.title}</p>
                  <span className="text-[11px] text-slate-400 shrink-0">{entry.date}</span>
                </div>
                <p className="text-xs text-slate-600">{entry.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function ConfirmationModal({
  onCancel,
  onConfirm,
  submitting,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  submitting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 id="confirm-title" className="font-bold text-slate-900 text-lg">
              Submit Corrections?
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Your corrections will be submitted and your application status will change from{" "}
              <strong className="text-orange-800">Needs Correction</strong> to{" "}
              <strong className="text-amber-800">Under Review</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-900 font-medium">
          You will not be able to make further edits while the administrator reviews your updated submission.
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 cursor-pointer border-slate-300"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm &amp; Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Component ──────────────────────────────────────────────────────────

function Toast({
  toast,
}: {
  toast: { visible: boolean; message: string; type: "success" | "error" };
}) {
  if (!toast.visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-4 sm:right-6 z-[60] flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl border max-w-sm text-sm font-medium animate-in slide-in-from-bottom-4 fade-in",
        toast.type === "success"
          ? "bg-emerald-900 text-white border-emerald-700"
          : "bg-rose-900 text-white border-rose-700"
      )}
    >
      {toast.type === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{toast.message}</span>
    </div>
  );
}
