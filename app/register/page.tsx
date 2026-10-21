"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser, SignOutButton, SignInButton } from "@clerk/nextjs";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Store,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  Phone,
  ShieldCheck,
  Lock,
  UploadCloud,
  FileCheck2,
  MapPin,
  Check,
  AlertCircle,
  X,
  Wallet,
  Receipt,
  Info,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createApplication,
  generateNextApplicationNumber,
} from "@/lib/application-store";
import { VendorApplication, PaymentInformation, PaymentStatus } from "@/lib/types/vendor-application";
import {
  addAdminNotification,
  addVendorNotification,
} from "@/lib/notifications-data";
import { saveSharedApplication } from "@/lib/vendor-application-state";
import { BUTUAN_BARANGAYS } from "@/lib/barangays";
import {
  PAYMENT_METHODS,
  calculateFeeAssessment,
  formatPhpCurrency,
  generateAssessmentReference,
  getPaymentStatusBadgeConfig,
  BUTUAN_PAYMENT_GATEWAY_CONFIG,
} from "@/lib/payment-fee-schedule";

function getUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const STEPS = [
  { id: 1, name: "Business", title: "Business Information" },
  { id: 2, name: "Owner", title: "Owner Information & Contact" },
  { id: 3, name: "Documents", title: "Required Documents" },
  { id: 4, name: "Payment", title: "Fee Assessment and Payment" },
  { id: 5, name: "Review", title: "Review and Submit" },
];

const ID_TYPES = [
  "PhilSys National ID",
  "Driver's License",
  "Voter's ID",
  "Postal ID",
  "Passport",
  "UMID",
  "Other",
];

const BUSINESS_CATEGORIES = [
  {
    id: "food_stall",
    name: "Food & Refreshment / Eatery / Market Stall",
    desc: "Cooked meals, snacks, carinderia, refreshments, and wet market food stalls",
  },
  {
    id: "market_produce",
    name: "Agricultural Produce / Fish & Meat Stand",
    desc: "Fresh produce, vegetables, fruits, fresh fish, and meat vendor stalls",
  },
  {
    id: "retail_sarisari",
    name: "Retail / Sari-Sari Store / General Merchandise",
    desc: "Neighborhood convenience, dry groceries, and small non-food retail",
  },
  {
    id: "dry_goods_services",
    name: "Dry Goods / Tailoring / Repair & Services",
    desc: "Apparel, footwear, tailoring, shoe/electronics repair, and artisanal services",
  },
  {
    id: "custom_assessment",
    name: "Other Category / Specialized Commercial Activity",
    desc: "Commercial operations requiring direct municipal appraisal by CBPLD & CTO",
  },
];

const DRAFT_STORAGE_KEY_PREFIX = "bvr_vendor_registration_draft_";

const INITIAL_FORM_DATA = {
  // Step 1: Business Information
  businessName: "",
  businessCategory: "food_stall",
  businessDescription: "",
  houseNo: "",
  street: "",
  barangay: "",

  // Step 2: Owner Information & Contact & Account Security
  ownerName: "",
  contactNumber: "",
  emailAddress: "",
  agreeTerms: false,
  agreePrivacy: false,

  // Step 3: Required Documents
  idType: "",
  idNumber: "",
  idFileName: "",
  isSkippedId: false,

  // Step 4: Fee Assessment & Payment
  selectedPaymentMethod: "gcash",
  assessmentReference: "PAY-BVR-2026-" + Math.floor(100000 + Math.random() * 900000),
  paymentStatus: "awaiting_payment" as PaymentStatus,
  paymentAmountPaid: "",
  paymentTransactionNumber: "",
  paymentDate: new Date().toISOString().split("T")[0],
  paymentReceiptDataUrl: "",
  paymentReceiptFilename: "",
  paymentReceiptFileType: "",
  paymentReceiptFileSize: 0,
};

function RegisterContent() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNewRegistration = searchParams.get("new") === "true";
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [hasSavedDraft, setHasSavedDraft] = useState(false);
  const [existingApplication, setExistingApplication] = useState<VendorApplication | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdAppNumber, setCreatedAppNumber] = useState<string>("");
  const [createdPayReference, setCreatedPayReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Restore saved draft and sync verified Clerk user info (Google account) into formData
  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || !clerkUser) return;

    const email =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      "";
    const name =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
      "";

    const draftKey = `${DRAFT_STORAGE_KEY_PREFIX}${clerkUser.id}`;

    let isCancelled = false;
    const restoreDraft = async () => {
      await Promise.resolve();
      if (isCancelled) return;

      let loadedFromDraft = false;
      // Do not load old draft if the user explicitly clicked "Send Another Application" / register new business
      if (!isNewRegistration) {
        try {
          const rawDraft = localStorage.getItem(draftKey);
          if (rawDraft) {
            const parsed = JSON.parse(rawDraft);
            if (parsed?.formData) {
              setFormData({
                ...INITIAL_FORM_DATA,
                ...parsed.formData,
                // Guaranteed: email is locked to verified Clerk Google email
                emailAddress: email || parsed.formData.emailAddress || "",
                // Owner legal name pre-filled if empty
                ownerName: parsed.formData.ownerName || name || "",
              });
              if (
                typeof parsed.currentStep === "number" &&
                parsed.currentStep >= 1 &&
                parsed.currentStep <= 5
              ) {
                setCurrentStep(parsed.currentStep);
              }
              loadedFromDraft = true;
              setHasSavedDraft(true);
            }
          }
        } catch (e) {
          console.error("Failed to restore vendor registration draft:", e);
        }
      }

      if (!loadedFromDraft) {
        setFormData({
          ...INITIAL_FORM_DATA,
          emailAddress: email,
          ownerName: name,
        });
        setCurrentStep(1);
      }

      setDraftLoaded(true);

      // Check if user already has a submitted application on file
      fetch("/api/vendor/application", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!isCancelled && data?.application) {
            setExistingApplication(data.application);
          }
        })
        .catch(() => {});
    };

    restoreDraft();

    return () => {
      isCancelled = true;
    };
  }, [isClerkLoaded, isSignedIn, clerkUser, isNewRegistration]);

  // Autosave draft on form changes
  useEffect(() => {
    if (!isSignedIn || !clerkUser || !draftLoaded) return;
    try {
      localStorage.setItem(
        `${DRAFT_STORAGE_KEY_PREFIX}${clerkUser.id}`,
        JSON.stringify({
          currentStep,
          formData,
          updatedAt: new Date().toISOString(),
        })
      );
      queueMicrotask(() => {
        setHasSavedDraft(true);
      });
    } catch (e) {
      console.error("Failed to autosave vendor registration draft:", e);
    }
  }, [formData, currentStep, isSignedIn, clerkUser, draftLoaded]);

  const handleClearDraft = () => {
    if (clerkUser) {
      try {
        localStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${clerkUser.id}`);
      } catch {}
    }
    const email = clerkUser?.primaryEmailAddress?.emailAddress || "";
    const name = clerkUser?.fullName || "";
    setFormData({
      ...INITIAL_FORM_DATA,
      emailAddress: email,
      ownerName: name,
    });
    setCurrentStep(1);
    setErrors({});
    setHasSavedDraft(false);
  };

  // Validation Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string>("");

  // Helper to update fields and clear corresponding errors
  const updateField = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Fee Assessment dynamically derived from selected business category
  const feeAssessment = useMemo(() => {
    return calculateFeeAssessment(formData.businessCategory);
  }, [formData.businessCategory]);

  const selectedMethodObj = useMemo(() => {
    return (
      PAYMENT_METHODS.find((m) => m.id === formData.selectedPaymentMethod) ||
      PAYMENT_METHODS[0]
    );
  }, [formData.selectedPaymentMethod]);

  // 1. Step 1 Validation (Business Information)
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }

    if (!formData.businessCategory) {
      newErrors.businessCategory = "Please select a business category.";
    }

    if (!formData.houseNo.trim()) {
      newErrors.houseNo = "Stall, house, or building number is required.";
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street name or market location is required.";
    }

    if (!formData.barangay.trim()) {
      newErrors.barangay = "Please select a barangay.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Step 2 Validation (Owner Information & Account)
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanedPhone = formData.contactNumber.replace(/[\s-]/g, "");

    // Owner Name
    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner legal name is required.";
    }

    // Contact Number
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required.";
    } else if (!/^(09|\+639)\d{9}$/.test(cleanedPhone)) {
      newErrors.contactNumber = "Please enter a valid Philippine mobile number (e.g. 09171234567).";
    }

    // Email Address (authoritative verified email from Clerk Google account)
    const activeEmail = formData.emailAddress || clerkUser?.primaryEmailAddress?.emailAddress || "";
    if (!activeEmail.trim()) {
      newErrors.emailAddress = "Verified Google email is required.";
    }

    // Terms & Privacy Checkboxes
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must agree to the Terms and Conditions.";
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = "You must acknowledge the Privacy Policy.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3. Step 3 Validation (Required Documents)
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.idType) {
      newErrors.idType = "Please select a government ID type.";
    }

    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "ID number is required.";
    }

    if (!formData.idFileName) {
      newErrors.idFile =
        "Government ID is required. Please upload a clear document image or PDF.";
    } else if (fileError) {
      newErrors.fileError = fileError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Step 4 Validation (Fee Assessment and Payment)
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedPaymentMethod) {
      newErrors.selectedPaymentMethod = "Please select a payment method.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // File Upload Handler with Format & 5MB Limit Validation
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
      const fileNameLower = file.name.toLowerCase();
      const isValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

      if (!isValidExt || !isValidSize) {
        setFileError("Please upload a PNG, JPG, or PDF file smaller than 5MB.");
        updateField("idFileName", "");
        e.target.value = "";
      } else {
        setFileError("");
        updateField("idFileName", file.name);
        updateField("isSkippedId", false);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.idFile;
          delete next.fileError;
          return next;
        });
      }
    }
  };

  const handleRemoveFile = () => {
    updateField("idFileName", "");
    setFileError("");
  };

  // Step advancement with validation gate
  const handleContinue = () => {
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (validateStep4()) setCurrentStep(5);
    }
  };

  const prevStep = () => {
    setErrors({});
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const goToStep = (stepNumber: number) => {
    setErrors({});
    if (stepNumber <= 5 && stepNumber >= 1) {
      setCurrentStep(stepNumber);
    }
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Re-verify all steps prior to submission
    if (!validateStep1()) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      return;
    }
    if (!validateStep4()) {
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (!isSignedIn || !clerkUser?.id) {
        setSubmitError("Authentication required: Please sign in with your Google account through Clerk before submitting.");
        setIsSubmitting(false);
        return;
      }

      // Remove saved draft upon successful submission
      if (clerkUser) {
        try {
          localStorage.removeItem(`${DRAFT_STORAGE_KEY_PREFIX}${clerkUser.id}`);
          setHasSavedDraft(false);
        } catch {}
      }

      const verifiedEmail =
        clerkUser.primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress ||
        formData.emailAddress.trim();
      const verifiedName =
        clerkUser.fullName ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
        formData.ownerName.trim();

      // Always generate a unique application reference number for new business submissions
      const newAppNumber = generateNextApplicationNumber();
      const now = new Date().toISOString();
      const payRef = formData.assessmentReference || generateAssessmentReference(newAppNumber);

      const isGcash = formData.selectedPaymentMethod === "gcash";
      const initialPaymentStatus: PaymentStatus = isGcash
        ? "pending_verification"
        : "awaiting_cashier_payment";

      const assessedVal = feeAssessment.totalAmount;
      const paidVal = 0;
      const finalPayRef = payRef;

      const paymentRecord: PaymentInformation = {
        status: initialPaymentStatus,
        assessedAmount: assessedVal,
        amountPaid: paidVal,
        currency: "PHP",
        paymentMethod: selectedMethodObj.name,
        paymentMethodCategory: selectedMethodObj.category,
        transactionReference: finalPayRef,
        paymentDate: null,
        feeBreakdown: feeAssessment.fees,
        assessmentStatus: feeAssessment.assessmentStatus,
        assessmentNotes: feeAssessment.notes,
        gatewayProvider: BUTUAN_PAYMENT_GATEWAY_CONFIG.providerName,
      };

      const categoryLabel =
        BUSINESS_CATEGORIES.find((c) => c.id === formData.businessCategory)?.name ||
        "Food & Refreshment / Market Stall";

      const newApp: VendorApplication = {
        id: newAppNumber,
        applicationNumber: newAppNumber,
        userId: clerkUser.id,
        verifiedEmail: verifiedEmail,
        vendorId: "",
        status: "submitted",
        verificationStatus: "Pending",
        isVerified: false,
        currentStage: 1,
        business: {
          businessName: formData.businessName.trim(),
          businessDescription: formData.businessDescription.trim() || undefined,
          category: categoryLabel,
        },
        owner: {
          ownerName: formData.ownerName.trim() || verifiedName,
        },
        contact: {
          contactNumber: formData.contactNumber.trim(),
          emailAddress: verifiedEmail,
        },
        address: {
          houseNo: formData.houseNo.trim(),
          street: formData.street.trim(),
          barangay: formData.barangay,
          city: "Butuan City",
          province: "Agusan del Norte",
          region: "Caraga",
          country: "Philippines",
        },
        documents: formData.isSkippedId
          ? []
          : formData.idType || formData.idFileName
          ? [
              {
                id: getUniqueId("doc"),
                idType: formData.idType || "Government ID",
                idNumber: formData.idNumber || undefined,
                idFileName: formData.idFileName || undefined,
                filename: formData.idFileName || "government-id.pdf",
                uploadedAt: now,
                status: "Submitted",
                isSkippedId: false,
              },
            ]
          : [],
        payment: paymentRecord,
        statusHistory: [
          {
            id: getUniqueId("hist"),
            previousStatus: null,
            newStatus: "submitted",
            timestamp: now,
            action: isGcash
              ? "Application Submitted • GCash Online Payment Queued"
              : "Application Submitted • Awaiting CTO Cashier Payment",
            actionBy: "Vendor",
            remark: isGcash
              ? `Assessed fees: ${feeAssessment.formattedTotal} via ${selectedMethodObj.name}. Tracking Reference: ${finalPayRef}. Status: Pending Verification.`
              : `Assessed fees: ${feeAssessment.formattedTotal} via City Treasurer's Office (CTO) Cashier. Status: Awaiting Cashier Payment.`,
          },
        ],
        submittedAt: now,
        updatedAt: now,
        createdAt: now,
      };

      // Persist the complete application through the server database
      const saveRes = await fetch("/api/vendor/application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newApp),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json().catch(() => ({}));
        const errMsg = errData.error || "Failed to persist application. Please try again.";
        setSubmitError(errMsg);
        setIsSubmitting(false);
        return;
      }

      const saveJson = await saveRes.json().catch(() => ({}));
      const savedApp: VendorApplication = saveJson.application;
      if (!savedApp || (!savedApp.applicationNumber && !savedApp.id)) {
        setSubmitError("Failed to receive verified application record from server. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const actualAppNumber = (savedApp.applicationNumber || savedApp.id).trim();
      const actualPayRef = savedApp.payment?.transactionReference || finalPayRef;

      // Update in-memory and local client caches with the authoritative server record
      createApplication(savedApp);

      if (typeof window !== "undefined") {
        localStorage.setItem("bvr_current_vendor_app_number", actualAppNumber);
      }

      try {
        saveSharedApplication(savedApp);
      } catch (syncErr) {
        console.error("Failed to sync shared application state:", syncErr);
      }

      // Workflow notification to Admin
      if (isGcash) {
        addAdminNotification({
          type: "payment-submitted",
          title: "GCash Payment Ready for Verification",
          message: `Vendor ${formData.ownerName.trim()} (${formData.businessName.trim()}) submitted application with GCash online payment (${feeAssessment.formattedTotal}). Ready for verification.`,
          fullMessage: `Vendor ${formData.ownerName.trim()} for application ${actualAppNumber} (${formData.businessName.trim()}) registered with GCash online payment (${feeAssessment.formattedTotal}, Tracking Ref: ${actualPayRef}). Administrative verification against municipal accounts is required before official receipt issuance and application approval.`,
          applicationNumber: actualAppNumber,
          vendorName: formData.businessName.trim(),
          status: "Submitted",
          actionLabel: "Review Application",
          actionUrl: `/admin/applications/${actualAppNumber}`,
          href: `/admin/applications/${actualAppNumber}`,
          priority: "high",
        });
      } else {
        addAdminNotification({
          type: "new-application",
          title: "New Registration — CTO Cashier Selected",
          message: `Vendor ${formData.businessName.trim()} (${actualAppNumber}) selected CTO Cashier in-person payment.`,
          fullMessage: `A new vendor registration application has been submitted by ${formData.ownerName.trim()} for ${formData.businessName.trim()} (${actualAppNumber}). Selected Payment Method: City Treasurer's Office (CTO) Cashier (Pay In Person). Status: Awaiting Cashier Payment. Official receipt must be recorded upon cashier settlement.`,
          applicationNumber: actualAppNumber,
          vendorName: formData.businessName.trim(),
          status: "Submitted",
          actionLabel: "Review Application",
          actionUrl: `/admin/applications/${actualAppNumber}`,
          href: `/admin/applications/${actualAppNumber}`,
          priority: "high",
        });
      }

      // Workflow notification to Vendor
      if (isGcash) {
        addVendorNotification({
          type: "application-submitted",
          title: "GCash Payment Queued — Pending Verification",
          message: `Your payment for application ${actualAppNumber} has been queued and is pending administrative verification.`,
          fullMessage: `Your registration for ${formData.businessName.trim()} has been submitted with GCash online payment (Ref: ${actualPayRef}, Amount: ${feeAssessment.formattedTotal}). Status: Pending Verification. An authorized administrator will verify your payment against official municipal records, after which your official receipt will appear in your Documents section.`,
          applicationNumber: actualAppNumber,
          vendorName: formData.businessName.trim(),
          status: "Submitted",
          actionLabel: "View Application",
          actionUrl: `/application-status?appNumber=${actualAppNumber}`,
          href: `/application-status?appNumber=${actualAppNumber}`,
          priority: "normal",
        });
      } else {
        addVendorNotification({
          type: "application-submitted",
          title: "Application Received — Awaiting CTO Cashier Payment",
          message: `Your registration ${actualAppNumber} has been received. Please pay ${feeAssessment.formattedTotal} at the City Treasurer's Office (CTO) Cashier.`,
          fullMessage: `Your registration for ${formData.businessName.trim()} has been received with Application Number ${actualAppNumber}. Please settle your assessed fee of ${feeAssessment.formattedTotal} at the City Treasurer's Office (CTO) Cashier counter at City Hall BOSS Center. Your official receipt will be available in your Documents section once recorded.`,
          applicationNumber: actualAppNumber,
          vendorName: formData.businessName.trim(),
          status: "Submitted",
          actionLabel: "View Application",
          actionUrl: `/application-status?appNumber=${actualAppNumber}`,
          href: `/application-status?appNumber=${actualAppNumber}`,
          priority: "normal",
        });
      }

      setCreatedAppNumber(actualAppNumber);
      setCreatedPayReference(actualPayRef);

      // If user is authenticated with Clerk, assign trusted vendor role
      if (clerkUser) {
        fetch("/api/auth/set-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "vendor" }),
        }).catch((err) => {
          console.error("Failed to assign vendor role in Clerk:", err);
        });
      }

      // Immediately and directly navigate the vendor to their newly submitted application details
      router.push(`/dashboard/my-application?appNumber=${encodeURIComponent(actualAppNumber)}`);
    } catch (err) {
      console.error("Failed to submit registration application:", err);
      setSubmitError("An error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };



  const currentCalculatedPaymentStatus: PaymentStatus =
    formData.selectedPaymentMethod === "gcash"
      ? "pending_verification"
      : "awaiting_cashier_payment";

  const paymentBadge = getPaymentStatusBadgeConfig(currentCalculatedPaymentStatus);

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
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base sm:text-lg leading-none block">
                Butuan Vendors Registration System
              </span>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Vendor Application Form
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold text-blue-700 hover:text-blue-800 transition-colors"
            >
              Already registered? Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Layout */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {!isSignedIn ? (
            /* ───────────────────────────────────────────────────────────── */
            /* STEP 0 GATE: Authentication Required Before Registration */
            /* ───────────────────────────────────────────────────────────── */
            <Card className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-950/5">
              <div className="p-6 sm:p-10 space-y-8">
                {/* Header and Civic Badge */}
                <div className="text-center space-y-3 max-w-xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>City Government of Butuan • Accreditation Portal</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Create Your Vendor Account
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    Vendors must sign in with Google to register and access their applications later.
                  </p>
                </div>

                {/* Primary Action Button */}
                <div className="max-w-md mx-auto space-y-3">
                  <SignInButton
                    mode="modal"
                    forceRedirectUrl="/register"
                    fallbackRedirectUrl="/register"
                    signUpForceRedirectUrl="/register"
                    signUpFallbackRedirectUrl="/register"
                  >
                    <Button
                      type="button"
                      size="lg"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-md cursor-pointer gap-3 justify-center transition-all hover:shadow-lg"
                    >
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 6.9 9.2 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.3-4.7 3.3-8.1z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.8 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.6-2.8z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5L2.2 16.9C4 20.5 7.7 23 12 23z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </Button>
                  </SignInButton>

                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-1">
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Secure persistent authentication powered by Clerk</span>
                  </div>
                </div>

                {/* Assurance & Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-1">
                      <Lock className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Persistent Account</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Log out and sign back in anytime with the same Google account to review status.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-1">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Verified Google Email</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Automatically binds your verified Gmail address to your official business permit.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5 text-center">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-1">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">Official Assessment</h4>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Instant regulatory fee computation and official assessment payment slip.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <>
              {/* Existing Application Banner */}
              {existingApplication && (
                <div className="p-4 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3 min-w-0">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-blue-950">
                        {isNewRegistration
                          ? "Registering an Additional Business"
                          : `Registered Business On File: ${existingApplication.applicationNumber}`}
                      </h4>
                      <p className="text-xs text-blue-900/90 mt-0.5">
                        Your account is linked to{" "}
                        <strong>{existingApplication.business?.businessName || "an enterprise"}</strong>.
                        Submitting this registration will create a distinct business profile with its own unique application number.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/dashboard/my-application"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "text-blue-700 border-blue-300 hover:bg-blue-100 font-semibold text-xs rounded-xl cursor-pointer"
                      )}
                    >
                      View Applications
                    </Link>
                    <Link
                      href="/dashboard"
                      className={cn(
                        buttonVariants({ variant: "default", size: "sm" }),
                        "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shrink-0 cursor-pointer"
                      )}
                    >
                      Go to Dashboard
                    </Link>
                  </div>
                </div>
              )}

              {/* Responsive Step Indicator */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
                {hasSavedDraft && (
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 mb-3">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Registration progress saved automatically
                    </span>
                    <button
                      type="button"
                      onClick={handleClearDraft}
                      className="text-xs text-slate-400 hover:text-rose-600 underline cursor-pointer"
                    >
                      Clear draft &amp; start over
                    </button>
                  </div>
                )}
                {/* Mobile View: Step Title & Compact Status */}
            <div className="sm:hidden space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Step {currentStep} of 5
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    {STEPS[currentStep - 1].title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                  {Math.round((currentStep / 5) * 100)}%
                </span>
              </div>

              {/* Mobile Step Badges */}
              <div className="flex items-center justify-between pt-1">
                {STEPS.map((step) => {
                  const isCompleted = step.id < currentStep;
                  const isCurrent = step.id === currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className="flex flex-col items-center gap-1 text-[11px] focus:outline-hidden"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center font-bold transition-all",
                          isCompleted && "bg-emerald-600 text-white shadow-xs",
                          isCurrent && "bg-blue-600 text-white ring-3 ring-blue-100 shadow-xs",
                          !isCompleted && !isCurrent && "bg-slate-100 text-slate-400 border border-slate-200"
                        )}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.id}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-medium max-w-[50px] truncate text-center",
                          isCurrent && "text-blue-700 font-bold",
                          isCompleted && "text-slate-700",
                          !isCompleted && !isCurrent && "text-slate-400"
                        )}
                      >
                        {step.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop / Tablet Step Sequence */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                    Progress: Step {currentStep} of 5
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    {STEPS[currentStep - 1].title}
                  </h3>
                </div>
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                  {Math.round((currentStep / 5) * 100)}% Complete
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 relative">
                {STEPS.map((step) => {
                  const isCompleted = step.id < currentStep;
                  const isCurrent = step.id === currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={cn(
                        "flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer",
                        isCurrent && "bg-blue-50/80 border border-blue-200 shadow-2xs",
                        isCompleted && "hover:bg-slate-50",
                        !isCurrent && !isCompleted && "hover:bg-slate-50/60"
                      )}
                    >
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors",
                          isCompleted && "bg-emerald-600 text-white shadow-xs",
                          isCurrent && "bg-blue-600 text-white ring-4 ring-blue-100 shadow-xs",
                          !isCompleted && !isCurrent && "bg-slate-100 text-slate-400 border border-slate-200"
                        )}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                      </div>
                      <span
                        className={cn(
                          "text-xs truncate w-full",
                          isCurrent && "text-blue-900 font-bold",
                          isCompleted && "text-slate-800 font-semibold",
                          !isCurrent && !isCompleted && "text-slate-400 font-normal"
                        )}
                      >
                        {isCompleted ? `✓ ${step.name}` : `${step.id}. ${step.name}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-3 sm:mt-4">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${(currentStep / 5) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Card */}
          <Card className="bg-white border border-slate-200/90 shadow-sm rounded-2xl overflow-hidden ring-1 ring-slate-950/5">
            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 1: Business Information */}
            {/* ───────────────────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 1 of 5
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Business Information
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Tell us about your business activity and operating location in Butuan City.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="businessName"
                      className="text-sm font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span>
                        Business Name <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => updateField("businessName", e.target.value)}
                      placeholder="Enter registered business name"
                      className={cn(
                        "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                        errors.businessName &&
                          "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                      )}
                    />
                    {errors.businessName ? (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.businessName}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        e.g., Montilla Refreshments, Guingona Fresh Market Stand, Aling Nena&apos;s Delicacies
                      </p>
                    )}
                  </div>

                  {/* Business Category (Feeds into Fee Assessment) */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="businessCategory"
                      className="text-sm font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span>
                        Business Category & Line of Activity <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-xs text-blue-700 font-normal">
                        Determines official fee assessment
                      </span>
                    </label>
                    <Select
                      value={formData.businessCategory}
                      onValueChange={(val) => {
                        if (val) updateField("businessCategory", val);
                      }}
                    >
                      <SelectTrigger
                        id="businessCategory"
                        className={cn(
                          "w-full h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm text-slate-900 transition-all shadow-none",
                          errors.businessCategory && "border-rose-400 bg-rose-50/20"
                        )}
                      >
                        <SelectValue placeholder="Select business line">
                          {(val) => {
                            const selected = BUSINESS_CATEGORIES.find((c) => c.id === val);
                            return selected ? (
                              <span className="font-medium text-slate-900 truncate">
                                {selected.name}
                              </span>
                            ) : (
                              <span className="text-slate-400">Select business line</span>
                            );
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent
                        side="bottom"
                        sideOffset={6}
                        align="start"
                        alignItemWithTrigger={false}
                        className="w-[var(--anchor-width)] min-w-full sm:min-w-[520px] max-w-[calc(100vw-2rem)] max-h-96 p-2 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-y-auto"
                      >
                        {BUSINESS_CATEGORIES.map((cat) => {
                          const isSelected = formData.businessCategory === cat.id;
                          return (
                            <SelectItem
                              key={cat.id}
                              value={cat.id}
                              className={cn(
                                "cursor-pointer rounded-lg px-3.5 py-3 my-1 transition-colors outline-none",
                                "hover:bg-blue-50/80 focus:bg-blue-50 data-[highlighted]:bg-blue-50/80",
                                isSelected
                                  ? "bg-blue-50/90 text-blue-950 font-medium border border-blue-200/80"
                                  : "text-slate-800 hover:text-blue-900 border border-transparent"
                              )}
                            >
                              <div className="flex flex-col text-left w-full pr-5">
                                <span
                                  className={cn(
                                    "text-sm leading-snug break-words",
                                    isSelected ? "font-bold text-blue-950" : "font-semibold text-slate-900"
                                  )}
                                >
                                  {cat.name}
                                </span>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words whitespace-normal font-normal">
                                  {cat.desc}
                                </p>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {errors.businessCategory && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.businessCategory}</span>
                      </p>
                    )}
                  </div>

                  {/* Business Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="businessDescription"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Business Description
                      </label>
                      <Badge variant="outline" className="text-xs text-slate-500 border-slate-200">
                        Optional
                      </Badge>
                    </div>
                    <Textarea
                      id="businessDescription"
                      value={formData.businessDescription}
                      onChange={(e) => updateField("businessDescription", e.target.value)}
                      placeholder="Briefly describe products sold or commercial services provided"
                      className="min-h-20 px-3.5 py-2.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm"
                      rows={2}
                    />
                  </div>

                  {/* Operating Address in Butuan */}
                  <div className="pt-2 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Operating Address in Butuan City</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* House/Stall No. */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="houseNo"
                          className="text-sm font-semibold text-slate-800"
                        >
                          House / Stall / Building No. <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          id="houseNo"
                          value={formData.houseNo}
                          onChange={(e) => updateField("houseNo", e.target.value)}
                          placeholder="e.g. Stall #14 or 123"
                          className={cn(
                            "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                            errors.houseNo &&
                              "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                          )}
                        />
                        {errors.houseNo && (
                          <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.houseNo}</span>
                          </p>
                        )}
                      </div>

                      {/* Street Name */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="street"
                          className="text-sm font-semibold text-slate-800"
                        >
                          Street Name / Market Section <span className="text-rose-500">*</span>
                        </label>
                        <Input
                          id="street"
                          value={formData.street}
                          onChange={(e) => updateField("street", e.target.value)}
                          placeholder="e.g. Montilla Blvd, Langihan Market"
                          className={cn(
                            "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                            errors.street &&
                              "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                          )}
                        />
                        {errors.street && (
                          <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.street}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Barangay Select */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="barangay"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Barangay (Butuan City) <span className="text-rose-500">*</span>
                      </label>
                      <Select
                        value={formData.barangay}
                        onValueChange={(val) => {
                          if (val) updateField("barangay", val);
                        }}
                      >
                        <SelectTrigger
                          id="barangay"
                          className={cn(
                            "h-11 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                            errors.barangay && "border-rose-400 bg-rose-50/20"
                          )}
                        >
                          <SelectValue placeholder="Select Butuan City Barangay" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {BUTUAN_BARANGAYS.map((brgy) => (
                            <SelectItem key={brgy} value={brgy}>
                              {brgy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.barangay && (
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.barangay}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={handleContinue}
                    size="lg"
                    className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                  >
                    Continue to Owner Information
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 2: Owner Information & Contact & Account Security */}
            {/* ───────────────────────────────────────────────────────────── */}
            {currentStep === 2 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 2 of 5
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Owner Information & Account
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Provide the proprietor&apos;s legal credentials and persistent Google account authentication.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Owner Legal Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ownerName"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Owner Legal Full Name <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => updateField("ownerName", e.target.value)}
                      placeholder="e.g. Juan De La Cruz"
                      className={cn(
                        "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                        errors.ownerName &&
                          "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                      )}
                    />
                    {errors.ownerName ? (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.ownerName}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Legal proprietor or operator name as listed on government-issued identification.
                      </p>
                    )}
                  </div>

                  {/* Contact Number & Email Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contactNumber"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Mobile Contact Number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="contactNumber"
                        value={formData.contactNumber}
                        onChange={(e) => updateField("contactNumber", e.target.value)}
                        placeholder="09XXXXXXXXX"
                        className={cn(
                          "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.contactNumber &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      />
                      {errors.contactNumber ? (
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.contactNumber}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">Official SMS alerts channel</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="emailAddress"
                          className="text-sm font-semibold text-slate-800"
                        >
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        {isSignedIn && (
                          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Verified Google Email
                          </span>
                        )}
                      </div>
                      <Input
                        id="emailAddress"
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => updateField("emailAddress", e.target.value)}
                        readOnly={Boolean(isSignedIn)}
                        placeholder="proprietor@email.com"
                        className={cn(
                          "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          isSignedIn && "bg-slate-100/70 text-slate-700 cursor-not-allowed",
                          errors.emailAddress &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      />
                      {errors.emailAddress ? (
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.emailAddress}</span>
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500">
                          {isSignedIn
                            ? "Locked to your authenticated Google account for persistent security."
                            : "Used for portal login and municipal notifications."}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Authenticated Account Confirmation Strip */}
                  <div className="pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Authenticated Proprietor Account</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] font-semibold gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Linked via Google
                      </Badge>
                    </div>

                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-sm shadow-xs">
                            {(clerkUser?.firstName?.[0] || clerkUser?.primaryEmailAddress?.emailAddress?.[0] || "G").toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {clerkUser?.fullName || formData.ownerName || "Registered Vendor"}
                            </p>
                            <p className="text-xs text-blue-700 font-mono truncate">
                              {clerkUser?.primaryEmailAddress?.emailAddress || formData.emailAddress}
                            </p>
                          </div>
                        </div>
                        <SignOutButton redirectUrl="/register">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            className="text-xs border-blue-200 bg-white hover:bg-blue-50 text-blue-900 font-medium cursor-pointer"
                          >
                            Switch Account
                          </Button>
                        </SignOutButton>
                      </div>
                      <div className="text-[11px] text-slate-600 leading-relaxed border-t border-blue-200/60 pt-2 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Your business application will be permanently linked to this verified Google account.
                        </span>
                      </div>
                    </div>
                  </div>

                    {/* Terms & Privacy */}
                    <div className="space-y-3 pt-3">
                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="agreeTerms"
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) => updateField("agreeTerms", Boolean(checked))}
                          className="mt-0.5"
                        />
                        <label htmlFor="agreeTerms" className="text-xs sm:text-sm text-slate-700 cursor-pointer">
                          I agree to the <span className="font-semibold text-blue-700">Terms and Conditions</span> of the City Government of Butuan Vendor Accreditation Program.
                        </label>
                      </div>
                      {errors.agreeTerms && (
                        <p className="text-xs font-medium text-rose-500 pl-6">{errors.agreeTerms}</p>
                      )}

                      <div className="flex items-start gap-2.5">
                        <Checkbox
                          id="agreePrivacy"
                          checked={formData.agreePrivacy}
                          onCheckedChange={(checked) => updateField("agreePrivacy", Boolean(checked))}
                          className="mt-0.5"
                        />
                        <label htmlFor="agreePrivacy" className="text-xs sm:text-sm text-slate-700 cursor-pointer">
                          I acknowledge the <span className="font-semibold text-blue-700">Data Privacy Policy</span> in compliance with the Data Privacy Act of 2012.
                        </label>
                      </div>
                      {errors.agreePrivacy && (
                        <p className="text-xs font-medium text-rose-500 pl-6">{errors.agreePrivacy}</p>
                      )}
                    </div>
                  </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleContinue}
                    size="lg"
                    className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                  >
                    Continue to Documents
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 3: Required Documents */}
            {/* ───────────────────────────────────────────────────────────── */}
            {currentStep === 3 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider">
                      Step 3 of 5
                    </span>
                    <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50/60 font-semibold text-xs">
                      Required
                    </Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Required Identification Documents
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Upload a valid government-issued credential to confirm identity before fee assessment and submission.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Government ID Type */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <span>Government ID Type</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.idType}
                      onValueChange={(val) => {
                        if (val) {
                          updateField("idType", val);
                          updateField("isSkippedId", false);
                        }
                      }}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-11 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.idType && "border-rose-400 bg-rose-50/20"
                        )}
                      >
                        <SelectValue placeholder="Select ID Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.idType && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.idType}</span>
                      </p>
                    )}
                  </div>

                  {/* ID Number */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="idNumber"
                      className="text-sm font-semibold text-slate-800 flex items-center gap-1"
                    >
                      <span>ID Serial / Identification Number</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => updateField("idNumber", e.target.value)}
                      placeholder="Enter ID serial or reference number"
                      className={cn(
                        "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                        errors.idNumber &&
                          "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                      )}
                    />
                    {errors.idNumber && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.idNumber}</span>
                      </p>
                    )}
                  </div>

                  {/* Document File Upload */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      <span>Upload ID Photo or Scan</span>
                      <span className="text-rose-500">*</span>
                    </label>

                    {!formData.idFileName ? (
                      <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:border-blue-400 bg-slate-50/50 transition-colors">
                        <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                        <label
                          htmlFor="id-upload"
                          className="inline-block text-sm font-semibold text-blue-700 hover:text-blue-800 cursor-pointer mb-1"
                        >
                          Browse file from device
                        </label>
                        <input
                          id="id-upload"
                          type="file"
                          accept=".png,.jpg,.jpeg,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <p className="text-xs text-slate-500">
                          PNG, JPG, or PDF up to 5MB. Ensure details are fully legible.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-emerald-950 truncate max-w-xs">
                              {formData.idFileName}
                            </p>
                            <span className="text-xs text-emerald-700 font-medium">Ready for submission</span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-slate-500 hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    )}

                    {errors.idFile && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.idFile}</span>
                      </p>
                    )}
                    {fileError && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fileError}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleContinue}
                    size="lg"
                    className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                  >
                    Continue to Payment
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 4: Fee Assessment and Payment */}
            {/* ───────────────────────────────────────────────────────────── */}
            {currentStep === 4 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 4 of 5
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Fee Assessment and Payment
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Review your official municipal fee assessment and choose your payment channel.
                  </p>
                </div>

                {/* Section A: Itemized Fee Assessment */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-700" />
                      Official Butuan City Regulatory Fee Schedule
                    </span>
                    <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50 text-xs font-semibold">
                      City Tax Ordinance No. 132
                    </Badge>
                  </div>

                  <Card className="border border-slate-200/90 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 py-3 px-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-semibold text-slate-500">Business Line</span>
                        <h4 className="text-sm font-bold text-slate-900">{feeAssessment.categoryDisplayName}</h4>
                      </div>
                      <span className="text-xs text-slate-500">Currency: Philippine Pesos (PHP)</span>
                    </CardHeader>
                    <CardContent className="p-0">
                      {feeAssessment.isAssessmentRequired ? (
                        <div className="p-5 text-center space-y-2 bg-amber-50/40">
                          <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
                          <h5 className="text-sm font-bold text-amber-950">Fee Assessment Required by LGU</h5>
                          <p className="text-xs text-amber-800 max-w-md mx-auto">
                            Specialized commercial activities require an on-site physical appraisal and capital verification by the City Business Permits and Licensing Department (CBPLD) and City Treasurer&apos;s Office (CTO).
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {feeAssessment.fees.map((fee) => (
                            <div key={fee.id} className="p-3 sm:px-4 sm:py-3 flex items-center justify-between hover:bg-slate-50/50 text-xs sm:text-sm">
                              <div className="space-y-0.5 pr-2">
                                <span className="font-semibold text-slate-900 block">{fee.name}</span>
                                <span className="text-xs text-slate-500 block">{fee.description}</span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 shrink-0">
                                {formatPhpCurrency(fee.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Total Assessment Footer */}
                      <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex items-center justify-between">
                        <div>
                          <span className="text-xs uppercase font-bold text-slate-500 block">Total Regulatory Assessment</span>
                          <span className="text-xs text-slate-500">Payable to the City Government of Butuan</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl sm:text-2xl font-mono font-extrabold text-blue-700 block">
                            {feeAssessment.formattedTotal}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Official Fee Rules Callout */}
                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-slate-700 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <Info className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Important Regulatory & Pricing Notes:</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                      <li>
                        <strong>DTI Distinction:</strong> Department of Trade and Industry (DTI) business name registration is a separate national credential. The fees itemized above are municipal regulatory charges under the Butuan City Revenue Code.
                      </li>
                      <li>
                        <strong>Applicability:</strong> Only fees established for your business category are charged (e.g. food sanitary inspections apply exclusively to food handlers).
                      </li>
                      <li>
                        <strong>Authorized Assessment:</strong> No unauthorized fees are charged. If custom appraisal is required, CTO assesses the exact amount prior to cashier settlement.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Section B: Payment Method Selection */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-700" />
                      Payment Method
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose how you want to pay.
                    </p>
                  </div>

                  {/* Two Simple Responsive Payment Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Card 1: GCash — Pay Online */}
                    <div
                      id="payment-method-gcash"
                      onClick={() => updateField("selectedPaymentMethod", "gcash")}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left",
                        formData.selectedPaymentMethod === "gcash"
                          ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              formData.selectedPaymentMethod === "gcash"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <Wallet className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              GCash — Pay Online
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                              Pay using the displayed QR code.
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1",
                            formData.selectedPaymentMethod === "gcash"
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300"
                          )}
                        >
                          {formData.selectedPaymentMethod === "gcash" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: CTO Cashier — Pay In Person */}
                    <div
                      id="payment-method-cto"
                      onClick={() => updateField("selectedPaymentMethod", "cto_cashier")}
                      className={cn(
                        "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left",
                        formData.selectedPaymentMethod === "cto_cashier"
                          ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              formData.selectedPaymentMethod === "cto_cashier"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-600"
                            )}
                          >
                            <Store className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              CTO Cashier — Pay In Person
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                              Pay at the City Treasurer&apos;s Office.
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-1",
                            formData.selectedPaymentMethod === "cto_cashier"
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300"
                          )}
                        >
                          {formData.selectedPaymentMethod === "cto_cashier" && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Selected Payment Instructions */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-700" />
                      Selected Payment Instructions
                    </h3>
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                      Method: {formData.selectedPaymentMethod === "gcash" ? "GCash — Pay Online" : "CTO Cashier — Pay In Person"}
                    </Badge>
                  </div>

                  {/* GCash Panel */}
                  {formData.selectedPaymentMethod === "gcash" && (
                    <Card className="border border-blue-200 bg-blue-50/20 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-blue-100/50 py-3 px-4 border-b border-blue-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-700" />
                          <CardTitle className="text-sm font-bold text-blue-950">
                            GCash Online Payment Instructions
                          </CardTitle>
                        </div>
                        <Badge className="bg-blue-600 text-white text-[10px]">
                          Official QR Code
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                          {/* QR Code Display */}
                          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center space-y-3">
                            <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src="/gcash-qr.png"
                                alt="Official GCash / InstaPay QR Code"
                                className="w-56 h-56 sm:w-60 sm:h-60 object-contain mx-auto rounded-lg"
                              />
                            </div>
                            <div className="space-y-1">
                              <span className="text-xs font-bold text-slate-900 block">
                                Scan with GCash App
                              </span>
                              <p className="text-[11px] text-slate-500 max-w-xs">
                                InstaPay QR code interoperable with GCash. Confirm recipient: <strong>City Government of Butuan</strong>.
                              </p>
                            </div>
                          </div>

                          {/* Instructions & Fee */}
                          <div className="space-y-4">
                            <div className="p-3.5 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-1">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                Official Registration Fee
                              </span>
                              <span className="text-2xl font-mono font-extrabold text-blue-700 block">
                                {feeAssessment.formattedTotal}
                              </span>
                              <span className="text-[11px] text-slate-500 block">
                                Business line: {feeAssessment.categoryDisplayName}
                              </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 space-y-2 shadow-2xs">
                              <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-blue-700" />
                                Payment Steps:
                              </span>
                              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                                <li>Scan the QR code using GCash.</li>
                                <li>
                                  Confirm the official recipient (<strong>City Government of Butuan</strong>) and exact amount (<strong>{feeAssessment.formattedTotal}</strong>).
                                </li>
                                <li>Complete the payment.</li>
                                <li>Wait for payment verification and receipt confirmation.</li>
                              </ol>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-950">
                                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                                <span>Note on Amount & Verification:</span>
                              </div>
                              <p className="text-[11px] text-amber-900/90 leading-relaxed">
                                This QR code does not support automatic amount verification. Please confirm the recipient and amount on your phone before confirming payment.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Compact Payment Status Display */}
                        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                Payment Status
                              </span>
                              <span className="text-xs text-slate-600 mt-0.5 block">
                                Official verification status for your vendor application
                              </span>
                            </div>
                            <div>
                              {formData.paymentStatus === "verified" ? (
                                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                  Payment Verified
                                </Badge>
                              ) : formData.paymentStatus === "pending_verification" ? (
                                <Badge className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                  Pending Verification
                                </Badge>
                              ) : formData.paymentStatus === "rejected" ? (
                                <Badge className="bg-rose-50 text-rose-800 border-rose-300 text-xs font-semibold">
                                  <AlertCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                  Payment Rejected
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-50 text-blue-800 border-blue-200 text-xs font-semibold">
                                  <Clock className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                  Awaiting Payment
                                </Badge>
                              )}
                            </div>
                          </div>

                          {formData.paymentStatus === "verified" ? (
                            <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1">
                              <p className="font-semibold text-emerald-900">Payment Verified</p>
                              <p className="text-[11px] text-emerald-800">
                                The administrator has verified your payment. Your official Vendor Registration Payment Receipt is now available in your Documents section.
                              </p>
                            </div>
                          ) : formData.paymentStatus === "pending_verification" ? (
                            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                              <p className="font-semibold text-amber-900">Pending Verification</p>
                              <p className="text-[11px] text-amber-800">
                                A transaction or payment record has been received and requires admin review. City Treasury staff will validate your payment against municipal accounts.
                              </p>
                            </div>
                          ) : formData.paymentStatus === "rejected" ? (
                            <div className="p-3 bg-rose-50/80 rounded-lg border border-rose-200 text-xs text-rose-950 space-y-1">
                              <p className="font-semibold text-rose-900">Payment Rejected</p>
                              <p className="text-[11px] text-rose-800">
                                The payment could not be verified. Please review your GCash payment or visit the City Hall CTO Cashier counter to settle fees.
                              </p>
                            </div>
                          ) : (
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                              <p className="font-semibold text-slate-900">Awaiting Payment</p>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                Payment has not been confirmed. After completing the payment in your GCash app, submit this registration. Your payment will be automatically queued for administrator verification. You do not need to manually enter transaction details.
                              </p>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Assessment Tracking Ref: <strong className="font-mono text-slate-700">{formData.assessmentReference}</strong></span>
                            </div>
                            <span className="text-slate-400">Official receipt delivered to Documents upon verification</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* CTO Cashier Panel */}
                  {formData.selectedPaymentMethod === "cto_cashier" && (
                    <Card className="border border-blue-200 bg-blue-50/20 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-blue-100/50 py-3 px-4 border-b border-blue-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-blue-700" />
                          <CardTitle className="text-sm font-bold text-blue-950">
                            City Treasurer&apos;s Office (CTO) Cashier — In-Person Payment
                          </CardTitle>
                        </div>
                        <Badge className="bg-blue-600 text-white text-[10px]">
                          Pay In Person
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-4 text-xs text-slate-700">
                        <div className="p-4 bg-white rounded-xl border border-blue-100 shadow-2xs space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                Official Registration Fee
                              </span>
                              <span className="text-2xl font-mono font-extrabold text-blue-700 block">
                                {feeAssessment.formattedTotal}
                              </span>
                            </div>
                            <Badge variant="outline" className="border-slate-300 text-slate-700 text-xs font-semibold self-start sm:self-auto">
                              City Hall BOSS Counter
                            </Badge>
                          </div>

                          <div className="space-y-1 pt-1">
                            <span className="font-bold text-slate-900 block">Payment Location:</span>
                            <p className="text-slate-600 leading-relaxed">
                              City Treasurer&apos;s Office (CTO) Cashier Counters, Ground Floor, Business One-Stop Shop (BOSS), Butuan City Hall Complex, J.P. Rosales Ave., Butuan City.
                            </p>
                            <span className="text-slate-500 block text-[11px]">
                              Office Hours: Monday to Friday, 8:00 AM – 5:00 PM
                            </span>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-white border border-blue-100 text-xs text-slate-700 space-y-2 shadow-2xs">
                          <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-700" />
                            In-Person Payment Instructions:
                          </span>
                          <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1 leading-relaxed">
                            <li>Proceed to the CTO Cashier window at Butuan City Hall BOSS Center.</li>
                            <li>
                              <strong>Inform the cashier that the payment is for vendor registration</strong> and provide your Application Number.
                            </li>
                            <li>
                              Pay the official registration fee (<strong>{feeAssessment.formattedTotal}</strong>) in cash.
                            </li>
                            <li>
                              <strong>Retain your official receipt</strong> provided by the cashier.
                            </li>
                            <li>
                              Authorized staff will record your payment, and your verified receipt will become available in your <strong>Documents</strong> section.
                            </li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Payment Status Explanation */}
                  <div className="p-4 rounded-xl bg-slate-900 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] block uppercase font-semibold">
                        Payment Status after Submission
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs font-semibold", paymentBadge.badgeClass)}>
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
                          {formData.selectedPaymentMethod === "gcash" ? "Pending Verification" : "Awaiting Cashier Payment"}
                        </Badge>
                        <span className="text-slate-300 text-xs">
                          {formData.selectedPaymentMethod === "gcash"
                            ? "GCash reference submitted • Awaiting administrative verification"
                            : "Awaiting in-person settlement at CTO Cashier"}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3 max-w-xs">
                      <span>Official receipt will be delivered to your Documents section after payment is verified by city staff.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleContinue}
                    size="lg"
                    className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                  >
                    Continue to Review
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* ───────────────────────────────────────────────────────────── */}
            {/* STEP 5: Review and Submit */}
            {/* ───────────────────────────────────────────────────────────── */}
            {currentStep === 5 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 5 of 5 • Final Review
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Review Your Registration
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Please review your business information, identification, and payment assessment before submitting.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Card 1: Business Information */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Business Information
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => goToStep(1)}
                        className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold cursor-pointer"
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Business Name:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.businessName || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Category / Line:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {BUSINESS_CATEGORIES.find((c) => c.id === formData.businessCategory)?.name || "(Not selected)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Operating Address:</span>
                        <span className="col-span-2 text-slate-800">
                          {formData.houseNo} {formData.street}, {formData.barangay}, Butuan City
                        </span>
                      </div>
                      {formData.businessDescription && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-slate-500 font-medium">Description:</span>
                          <span className="col-span-2 text-slate-700 italic">
                            {formData.businessDescription}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 2: Owner Information */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Owner & Account Information
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => goToStep(2)}
                        className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold cursor-pointer"
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Owner Legal Name:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.ownerName || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Contact Number:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.contactNumber || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Email Address:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.emailAddress || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Clerk / Google Account:</span>
                        <span className="col-span-2 text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          {isSignedIn ? "Google account connected & verified" : "Pending connection"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Required Documents */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Required Documents
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => goToStep(3)}
                        className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold cursor-pointer"
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-slate-500 font-medium">Government ID:</span>
                        <div className="col-span-2 flex flex-wrap items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                            Provided
                          </Badge>
                          <span className="text-xs text-slate-700">
                            {formData.idType} • No. {formData.idNumber} ({formData.idFileName})
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 4: Fee Assessment and Payment Information */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden ring-1 ring-blue-500/20">
                    <CardHeader className="bg-blue-50/50 p-4 border-b border-blue-100 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Fee Assessment & Payment Details
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => goToStep(4)}
                        className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-100/60 font-semibold cursor-pointer"
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2.5 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Assessed Amount:</span>
                        <span className="col-span-2 font-mono font-bold text-blue-700 text-base">
                          {feeAssessment.formattedTotal}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Payment Channel:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {selectedMethodObj.name} ({selectedMethodObj.channelDetails})
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Tracking Reference:</span>
                        <span className="col-span-2 font-mono font-medium text-slate-700">
                          {formData.assessmentReference}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Payment Settlement:</span>
                        <span className="col-span-2 text-slate-700">
                          {formData.selectedPaymentMethod === "gcash"
                            ? "GCash QR Online Payment (Manual entry not required)"
                            : "CTO Cashier In-Person Settlement"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-slate-500 font-medium">Receipt Delivery:</span>
                        <span className="col-span-2 text-xs text-slate-700">
                          Official receipt will be delivered to your Documents section after payment is verified by city staff.
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Initial Status:</span>
                        <div className="col-span-2">
                          <Badge variant="outline" className={cn("text-xs font-semibold", paymentBadge.badgeClass)}>
                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
                            {paymentBadge.label} ({formData.selectedPaymentMethod === "gcash" ? "Pending Municipal Verification" : "Awaiting In-Person Payment"})
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Legal Separation Notice */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <ShieldAlert className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>Important Notice Regarding Application Evaluation:</span>
                    </div>
                    <p>
                      Payment status is separate from Application Approval status. Settle your payment via GCash online or at the City Treasurer&apos;s Office (CTO) Cashier. A paid application remains under evaluation by the City Business Permits and Licensing Department (CBPLD) and requires formal administrative inspection before official vendor accreditation.
                    </p>
                  </div>

                  {submitError && (
                    <div
                      role="alert"
                      className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in"
                    >
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <span className="font-medium">{submitError}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    size="lg"
                    className="font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 text-base shadow-md cursor-pointer gap-2 disabled:opacity-70"
                  >
                    {isSubmitting ? "Submitting Registration..." : "Submit Registration"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
        </div>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 10. Success Modal with Payment Confirmation Summary */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Registration Submitted!
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 text-center leading-relaxed">
              Your vendor registration application and payment assessment slip have been received by the City Government of Butuan.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2.5">
            <div className="flex justify-between items-center font-medium">
              <span>Application No:</span>
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {createdAppNumber}
              </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Payment / Reference:</span>
              <span className="font-mono font-semibold text-slate-900">
                {createdPayReference}
              </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Total Assessed Fee:</span>
              <span className="font-mono font-bold text-slate-900">
                {feeAssessment.formattedTotal}
              </span>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Payment Method:</span>
              <span className="text-slate-900 font-semibold">{selectedMethodObj.name}</span>
            </div>
            <div className="flex justify-between items-center font-medium border-t border-slate-200/70 pt-2">
              <span>Payment Verification Status:</span>
              <Badge variant="outline" className={cn("font-semibold text-xs", paymentBadge.badgeClass)}>
                <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
                {formData.selectedPaymentMethod === "gcash" ? "Pending Verification • Awaiting Municipal Verification" : "Awaiting In-Person Payment • CTO Cashier"}
              </Badge>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Application Review:</span>
              <span className="text-blue-700 font-semibold">Under CBPLD Review Queue</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/70 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-blue-900 block">Next Steps & Payment Verification Notice:</span>
            {formData.selectedPaymentMethod === "gcash" ? (
              <p>
                Your registration has been submitted with GCash online payment. <strong>Note:</strong> Under Butuan City registration rules, your payment will be verified against municipal records by an authorized review officer before official receipt issuance and application approval.
              </p>
            ) : (
              <p>
                Present your Assessment Reference (<strong>{createdPayReference}</strong>) at the City Treasurer&apos;s Office (CTO) Cashier at Butuan City Hall BOSS to settle fees and receive your official receipt.
              </p>
            )}
            <p className="pt-0.5">
              You can track real-time verification and registration status in the Vendor Dashboard using your Application Number.
            </p>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link
              href={`/dashboard/my-application?appNumber=${createdAppNumber}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:flex-1 justify-center font-semibold cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              View Application in Dashboard
            </Link>
            <Link
              href={`/register/success?appNumber=${createdAppNumber}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "w-full sm:flex-1 justify-center font-semibold cursor-pointer"
              )}
            >
              View Assessment Slip
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSuccessModalOpen(false)}
              className="w-full sm:w-auto justify-center font-medium cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium">Loading vendor registration form...</p>
          </div>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
