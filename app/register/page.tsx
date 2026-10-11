"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CreditCard,
  Wallet,
  Building,
  Receipt,
  Info,
  ExternalLink,
  Clock,
  ShieldAlert,
  QrCode,
  FileText,
  Trash2,
  RefreshCw,
  FileUp,
  Copy,
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
  PaymentMethodOption,
  calculateFeeAssessment,
  formatPhpCurrency,
  generateAssessmentReference,
  getPaymentStatusBadgeConfig,
  BUTUAN_PAYMENT_GATEWAY_CONFIG,
  LGU_EWALLET_INSTRUCTIONS,
  LGU_BANK_TRANSFER_INSTRUCTIONS,
} from "@/lib/payment-fee-schedule";

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

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdAppNumber, setCreatedAppNumber] = useState<string>("");
  const [createdPayReference, setCreatedPayReference] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form State (preserved across steps)
  const [formData, setFormData] = useState({
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
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false,

    // Step 3: Required Documents
    idType: "",
    idNumber: "",
    idFileName: "",
    isSkippedId: false,

    // Step 4: Fee Assessment & Payment
    selectedPaymentMethod: "maya",
    assessmentReference: "PAY-BVR-2026-" + Math.floor(100000 + Math.random() * 900000),
    paymentStatus: "pending_verification" as PaymentStatus,
    paymentAmountPaid: "",
    paymentTransactionNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentReceiptDataUrl: "",
    paymentReceiptFilename: "",
    paymentReceiptFileType: "",
    paymentReceiptFileSize: 0,
  });

  // Validation Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string>("");
  const [receiptError, setReceiptError] = useState<string>("");
  const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [receiptPreviewModalOpen, setReceiptPreviewModalOpen] = useState(false);

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

    // Email Address
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      newErrors.emailAddress = "Please enter a valid email address.";
    }

    // Password requirements
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else {
      const hasLength = formData.password.length >= 8;
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);

      if (!hasLength || !hasUpper || !hasNumber) {
        newErrors.password = "Password must be at least 8 characters with 1 uppercase letter and 1 number.";
      }
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
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

  // Copy helper for payment instructions
  const copyToClipboard = (text: string, fieldKey: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2500);
    }
  };

  // Receipt file processor with validation
  const processReceiptFile = (file: File) => {
    const validExtensions = [".png", ".jpg", ".jpeg", ".pdf"];
    const fileNameLower = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB

    if (!isValidExt) {
      setReceiptError("Unsupported file format. Please upload a JPG, JPEG, PNG, or PDF file.");
      return;
    }

    if (!isValidSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setReceiptError(`File size exceeds 5MB limit (${sizeMB}MB). Please upload a smaller receipt image or document.`);
      return;
    }

    setReceiptError("");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFormData((prev) => ({
        ...prev,
        paymentReceiptDataUrl: result,
        paymentReceiptFilename: file.name,
        paymentReceiptFileType: file.type || (fileNameLower.endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
        paymentReceiptFileSize: file.size,
        paymentStatus: "pending_verification",
      }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next.paymentReceipt;
        delete next.receiptError;
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReceiptDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingReceipt(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processReceiptFile(e.dataTransfer.files[0]);
    }
  };

  const handleReceiptFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processReceiptFile(e.target.files[0]);
    }
  };

  const handleRemoveReceipt = () => {
    setFormData((prev) => ({
      ...prev,
      paymentReceiptDataUrl: "",
      paymentReceiptFilename: "",
      paymentReceiptFileType: "",
      paymentReceiptFileSize: 0,
      paymentStatus: prev.selectedPaymentMethod === "cto_cashier" ? "unpaid" : "pending_verification",
    }));
    setReceiptError("");
  };

  // 4. Step 4 Validation (Fee Assessment and Payment)
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.selectedPaymentMethod) {
      newErrors.selectedPaymentMethod = "Please select a payment method.";
    }

    // Proof of payment is required for non-cashier channels
    if (formData.selectedPaymentMethod !== "cto_cashier") {
      if (!formData.paymentReceiptDataUrl) {
        newErrors.paymentReceipt = "Proof of payment receipt is required before you can proceed.";
      }
      if (!formData.paymentTransactionNumber.trim()) {
        newErrors.paymentTransactionNumber = "Transaction or reference number from your receipt is required.";
      }
      if (!formData.paymentDate.trim()) {
        newErrors.paymentDate = "Payment date is required.";
      }
      if (!formData.paymentAmountPaid.trim() && !feeAssessment.isAssessmentRequired) {
        newErrors.paymentAmountPaid = "Please confirm the amount paid.";
      }
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
      // 1. Submit credentials to existing authorized authentication provider
      const authRes = await fetch("/api/auth/vendor/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.emailAddress.trim(),
          password: formData.password,
          name: formData.ownerName.trim(),
        }),
      });

      if (!authRes.ok) {
        const errorData = await authRes.json().catch(() => ({}));
        const message =
          errorData.error || "Failed to create vendor account. Please try again.";
        setSubmitError(message);
        setErrors((prev) => ({
          ...prev,
          password: message,
        }));
        setCurrentStep(2);
        setIsSubmitting(false);
        return;
      }

      const newAppNumber = generateNextApplicationNumber();
      const now = new Date().toISOString();
      const payRef = formData.assessmentReference || generateAssessmentReference(newAppNumber);

      const hasReceipt = Boolean(formData.paymentReceiptDataUrl);
      const initialPaymentStatus: PaymentStatus = hasReceipt
        ? "pending_verification"
        : "unpaid";

      const assessedVal = feeAssessment.totalAmount;
      const paidVal = hasReceipt
        ? Number(formData.paymentAmountPaid) || assessedVal
        : 0;

      const finalPayRef = formData.paymentTransactionNumber.trim() || payRef;

      const paymentRecord: PaymentInformation = {
        status: initialPaymentStatus,
        assessedAmount: assessedVal,
        amountPaid: paidVal,
        currency: "PHP",
        paymentMethod: selectedMethodObj.name,
        paymentMethodCategory: selectedMethodObj.category,
        transactionReference: finalPayRef,
        paymentDate: hasReceipt ? formData.paymentDate : null,
        feeBreakdown: feeAssessment.fees,
        assessmentStatus: feeAssessment.assessmentStatus,
        assessmentNotes: feeAssessment.notes,
        gatewayProvider: BUTUAN_PAYMENT_GATEWAY_CONFIG.providerName,
        receiptUrl: formData.paymentReceiptDataUrl || undefined,
        receiptFilename: formData.paymentReceiptFilename || undefined,
        receiptFileType: formData.paymentReceiptFileType || undefined,
        receiptFileSize: formData.paymentReceiptFileSize || undefined,
        receiptUploadedAt: hasReceipt ? now : undefined,
      };

      const categoryLabel =
        BUSINESS_CATEGORIES.find((c) => c.id === formData.businessCategory)?.name ||
        "Food & Refreshment / Market Stall";

      const newApp: VendorApplication = {
        id: newAppNumber,
        applicationNumber: newAppNumber,
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
          ownerName: formData.ownerName.trim(),
        },
        contact: {
          contactNumber: formData.contactNumber.trim(),
          emailAddress: formData.emailAddress.trim(),
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
                id: `doc-${Date.now()}`,
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
            id: `hist-${Date.now()}`,
            previousStatus: null,
            newStatus: "submitted",
            timestamp: now,
            action: hasReceipt
              ? "Application Submitted • Payment Proof Uploaded"
              : "Application Submitted • Payment Assessment Slip Generated",
            actionBy: "Vendor",
            remark: hasReceipt
              ? `Assessed fees: ${feeAssessment.formattedTotal} via ${selectedMethodObj.name}. Proof of payment uploaded (Ref: ${finalPayRef}). Status: Pending Verification.`
              : `Assessed fees: ${feeAssessment.formattedTotal} via ${selectedMethodObj.name}. Status: Unpaid.`,
          },
        ],
        submittedAt: now,
        updatedAt: now,
        createdAt: now,
      };

      createApplication(newApp);

      if (typeof window !== "undefined") {
        localStorage.setItem("bvr_current_vendor_app_number", newAppNumber);
      }

      try {
        saveSharedApplication({
          id: newAppNumber,
          applicationNumber: newAppNumber,
          vendorId: "",
          vendor: {
            id: "",
            name: formData.ownerName.trim(),
            businessName: formData.businessName.trim(),
            email: formData.emailAddress.trim(),
            phone: formData.contactNumber.trim(),
          },
          business: {
            name: formData.businessName.trim(),
            businessName: formData.businessName.trim(),
            category: categoryLabel,
            address: `${formData.houseNo.trim()} ${formData.street.trim()}, ${formData.barangay}, Butuan City`,
            barangay: formData.barangay,
            description: formData.businessDescription.trim() || undefined,
            houseNumber: formData.houseNo.trim(),
            street: formData.street.trim(),
            city: "Butuan City",
            province: "Agusan del Norte",
            region: "Caraga",
            country: "Philippines",
          },
          status: "submitted",
          adminStatus: "Submitted",
          verificationStatus: "Pending",
          isVerified: false,
          currentStage: 1,
          submittedAt: now,
          submittedDate: new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          updatedAt: now,
          lastUpdatedText: "Submitted just now",
          documents: newApp.documents.map((d) => ({
            id: d.id || `doc-${Date.now()}`,
            filename: d.filename || d.idFileName || "government-id.pdf",
            idType: d.idType || "Philippine National ID",
            uploadedAt: d.uploadedAt || now,
            status: "Submitted",
            submitted: true,
          })),
          adminRemarks: "",
          administratorRemarks: "",
          correctionItems: [],
          correctionFields: [],
          correctionDate: null,
          activity: [
            {
              id: `act-${Date.now()}`,
              title: "Application Submitted",
              description: hasReceipt
                ? `Vendor registration submitted with proof of payment (${selectedMethodObj.name}, Ref: ${finalPayRef}). Status: Pending Verification.`
                : `Vendor registration application was submitted with assessment slip ${finalPayRef}. Payment status: Unpaid.`,
              date: "Today • Just now",
              dotColor: hasReceipt ? "amber" : "blue",
              type: "submission",
            },
          ],
          businessName: formData.businessName.trim(),
          ownerName: formData.ownerName.trim(),
          contactNumber: formData.contactNumber.trim(),
          email: formData.emailAddress.trim(),
          barangay: formData.barangay,
          houseNumber: formData.houseNo.trim(),
          street: formData.street.trim(),
          city: "Butuan City",
          province: "Agusan del Norte",
          region: "Caraga",
          country: "Philippines",
          payment: paymentRecord,
          paymentStatus: initialPaymentStatus,
          assessedAmount: feeAssessment.totalAmount,
          amountPaid: paidVal,
          paymentMethod: selectedMethodObj.name,
          transactionReference: finalPayRef,
          paymentDate: hasReceipt ? formData.paymentDate : null,
        });
      } catch (syncErr) {
        console.error("Failed to sync shared application state:", syncErr);
      }

      // Workflow notification to Admin
      addAdminNotification({
        type: "new-application",
        title: hasReceipt ? "New Application with Payment Proof" : "New Vendor Application Submitted",
        message: `New vendor application from ${formData.businessName.trim()} in ${formData.barangay}. Payment: ${hasReceipt ? "Pending Verification" : "Unpaid"}.`,
        fullMessage: `A new vendor registration application has been submitted by ${formData.ownerName.trim()} for ${formData.businessName.trim()} in ${formData.barangay}. Assessed: ${feeAssessment.formattedTotal} (${selectedMethodObj.name}). Payment Status: ${hasReceipt ? "Pending Verification (Receipt Uploaded)" : "Unpaid"}. Admin verification required before application approval.`,
        applicationNumber: newAppNumber,
        vendorName: formData.businessName.trim(),
        status: "Submitted",
        actionLabel: "Review Application",
        actionUrl: `/admin/applications/${newAppNumber}`,
        href: `/admin/applications/${newAppNumber}`,
        priority: "high",
      });

      // Workflow notification to Vendor
      addVendorNotification({
        type: "application-submitted",
        title: hasReceipt ? "Application & Payment Proof Submitted" : "Application Received • Assessment Slip Issued",
        message: `Your registration ${newAppNumber} has been received. Payment Status: ${hasReceipt ? "Pending Verification" : "Unpaid"}.`,
        fullMessage: hasReceipt
          ? `Your registration for ${formData.businessName.trim()} is submitted with proof of payment (Ref: ${finalPayRef}). Status: Pending Verification. An administrator will verify your payment before approving your registration.`
          : `Your registration for ${formData.businessName.trim()} is submitted. Reference: ${newAppNumber}. Settle at the City Treasurer's Office (CTO) Cashier to receive your official receipt.`,
        applicationNumber: newAppNumber,
        vendorName: formData.businessName.trim(),
        status: "Submitted",
        actionLabel: "View Application",
        actionUrl: `/application-status?appNumber=${newAppNumber}`,
        href: `/application-status?appNumber=${newAppNumber}`,
        priority: "normal",
      });

      setCreatedAppNumber(newAppNumber);
      setCreatedPayReference(finalPayRef);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Failed to submit registration application:", err);
      setSubmitError("An error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password rules checks for dynamic visual feedback
  const isPasswordMinLength = formData.password.length >= 8;
  const isPasswordUppercase = /[A-Z]/.test(formData.password);
  const isPasswordNumber = /[0-9]/.test(formData.password);

  const currentCalculatedPaymentStatus: PaymentStatus =
    formData.paymentReceiptDataUrl
      ? "pending_verification"
      : "unpaid";

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
          {/* Responsive Step Indicator */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
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
                          "h-11 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.businessCategory && "border-rose-400 bg-rose-50/20"
                        )}
                      >
                        <SelectValue placeholder="Select business line" />
                      </SelectTrigger>
                      <SelectContent>
                        {BUSINESS_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="py-0.5">
                              <span className="font-semibold text-slate-900 block">{cat.name}</span>
                              <span className="text-xs text-slate-500 block">{cat.desc}</span>
                            </div>
                          </SelectItem>
                        ))}
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
                    Provide the proprietor&apos;s legal credentials and vendor portal security password.
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
                      <label
                        htmlFor="emailAddress"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="emailAddress"
                        type="email"
                        value={formData.emailAddress}
                        onChange={(e) => updateField("emailAddress", e.target.value)}
                        placeholder="proprietor@email.com"
                        className={cn(
                          "h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
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
                        <p className="text-xs text-slate-500">Used for portal login and notices</p>
                      )}
                    </div>
                  </div>

                  {/* Account Security Password Section */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Vendor Portal Account Security</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Password */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="password"
                          className="text-sm font-semibold text-slate-800"
                        >
                          Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => updateField("password", e.target.value)}
                            placeholder="Create account password"
                            className={cn(
                              "h-11 pr-10 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                              errors.password && "border-rose-400 bg-rose-50/20"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.password}</span>
                          </p>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-1.5">
                        <label
                          htmlFor="confirmPassword"
                          className="text-sm font-semibold text-slate-800"
                        >
                          Confirm Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.confirmPassword}
                            onChange={(e) => updateField("confirmPassword", e.target.value)}
                            placeholder="Confirm your password"
                            className={cn(
                              "h-11 pr-10 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                              errors.confirmPassword && "border-rose-400 bg-rose-50/20"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.confirmPassword}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Password criteria pills */}
                    <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-500">
                      <span className={cn("px-2 py-0.5 rounded-full border text-[11px] font-medium", isPasswordMinLength ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 border-slate-200")}>
                        {isPasswordMinLength ? "✓ 8+ Characters" : "• At least 8 characters"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full border text-[11px] font-medium", isPasswordUppercase ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 border-slate-200")}>
                        {isPasswordUppercase ? "✓ 1 Uppercase" : "• 1 Uppercase letter"}
                      </span>
                      <span className={cn("px-2 py-0.5 rounded-full border text-[11px] font-medium", isPasswordNumber ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 border-slate-200")}>
                        {isPasswordNumber ? "✓ 1 Number" : "• 1 Number"}
                      </span>
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

                {/* Section B: Payment Methods Selection Interface */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div>
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-700" />
                      Select Payment Method
                    </label>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose an official digital or over-the-counter payment channel recognized by the City Government of Butuan.
                    </p>
                  </div>

                  {/* 4 Categorized Payment Options */}
                  {/* 4 Categorized Payment Options */}
                  <div className="space-y-4">
                    {[
                      { key: "e_wallet", label: "E-Wallet", subtitle: "Maya & GCash QR Ph digital wallets" },
                      { key: "online_banking", label: "Bank Transfer", subtitle: "Landbank & Online Bank Transfers" },
                      { key: "card", label: "ATM / Debit / Credit Card", subtitle: "BancNet, Visa & Mastercard" },
                      { key: "otc", label: "Other Payment Methods", subtitle: "City Treasurer's Office (CTO) Cashier" },
                    ].map((group) => {
                      const methodsInGroup = PAYMENT_METHODS.filter((m) => {
                        if (group.key === "e_wallet") return m.category === "e_wallet";
                        if (group.key === "online_banking") return m.category === "online_banking";
                        if (group.key === "card") return m.category === "card";
                        if (group.key === "otc") return m.category === "otc";
                        return false;
                      });

                      return (
                        <div key={group.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                              {group.label}
                            </span>
                            <span className="text-[11px] text-slate-400 hidden sm:inline">
                              {group.subtitle}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {methodsInGroup.map((method) => {
                              const isSelected = formData.selectedPaymentMethod === method.id;

                              return (
                                <div
                                  key={method.id}
                                  onClick={() => updateField("selectedPaymentMethod", method.id)}
                                  className={cn(
                                    "p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left",
                                    isSelected
                                      ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                                      : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2.5">
                                      <div
                                        className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                          isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                        )}
                                      >
                                        {method.category === "e_wallet" && <Wallet className="w-4 h-4" />}
                                        {method.category === "card" && <CreditCard className="w-4 h-4" />}
                                        {method.category === "online_banking" && <Building className="w-4 h-4" />}
                                        {method.category === "otc" && <Store className="w-4 h-4" />}
                                      </div>
                                      <div>
                                        <h5 className="text-sm font-bold text-slate-900 leading-tight">{method.name}</h5>
                                        <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{method.channelDetails}</span>
                                      </div>
                                    </div>
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5",
                                        isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300"
                                      )}
                                    >
                                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                    </div>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-2 line-clamp-2">{method.description}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section C: Official Payment Instructions Cards */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-700" />
                      Official Payment Instructions
                    </label>
                    <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                      Channel: {selectedMethodObj.name}
                    </Badge>
                  </div>

                  {/* 1. E-Wallet Instruction Card */}
                  {(selectedMethodObj.category === "e_wallet" || !selectedMethodObj.category) && (
                    <Card className="border border-blue-200 bg-blue-50/30 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-blue-100/50 py-3 px-4 border-b border-blue-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-700" />
                          <CardTitle className="text-sm font-bold text-blue-950">
                            E-Wallet Payment Instructions (Maya / GCash)
                          </CardTitle>
                        </div>
                        <Badge className="bg-blue-600 text-white text-[10px]">
                          Official LGU Channel
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Account Details */}
                          <div className="space-y-3">
                            <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1 shadow-2xs">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                Account Name
                              </span>
                              <div className="flex items-center justify-between">
                                <span className="text-base font-extrabold text-slate-900">
                                  {LGU_EWALLET_INSTRUCTIONS.accountName}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => copyToClipboard(LGU_EWALLET_INSTRUCTIONS.accountName, "ewalletName")}
                                  className="h-7 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                                >
                                  {copiedField === "ewalletName" ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                      <Check className="w-3.5 h-3.5" /> Copied
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Copy className="w-3.5 h-3.5" /> Copy
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1 shadow-2xs">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                E-Wallet Number
                              </span>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-mono font-extrabold text-blue-700">
                                  {LGU_EWALLET_INSTRUCTIONS.accountNumber}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => copyToClipboard(LGU_EWALLET_INSTRUCTIONS.accountNumber, "ewalletNum")}
                                  className="h-7 px-2 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                                >
                                  {copiedField === "ewalletNum" ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                      <Check className="w-3.5 h-3.5" /> Copied
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1">
                                      <Copy className="w-3.5 h-3.5" /> Copy
                                    </span>
                                  )}
                                </Button>
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-1 shadow-2xs">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                                Amount Due
                              </span>
                              <span className="text-base font-mono font-extrabold text-slate-900 block">
                                {feeAssessment.formattedTotal}
                              </span>
                            </div>
                          </div>

                          {/* Official QR Code Placeholder Box */}
                          <div className="flex flex-col justify-between p-4 bg-white rounded-xl border-2 border-dashed border-slate-300 text-center space-y-3">
                            <div className="flex-1 flex flex-col items-center justify-center p-3">
                              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                                <QrCode className="w-8 h-8" />
                              </div>
                              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                Official Payment QR Code
                              </h5>
                              <p className="text-[11px] text-slate-500 mt-1 max-w-xs leading-snug">
                                [ Official LGU Butuan E-Wallet QR Code Placeholder — Administrator can upload official verified QR code image here ]
                              </p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-lg border border-amber-200/70 text-[11px] text-amber-900">
                              <strong>Notice:</strong> Authenticity confirmed by City Administration. Do not scan unverified third-party QR codes.
                            </div>
                          </div>
                        </div>

                        {/* Step by Step instructions */}
                        <div className="p-3 rounded-lg bg-white border border-blue-100 text-xs text-slate-700 space-y-1.5">
                          <span className="font-bold text-blue-900 block flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-700" />
                            How to complete your payment:
                          </span>
                          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                            <li>Open your Maya or GCash mobile app on your phone.</li>
                            <li>Send payment to <strong>09674382253</strong> or scan the official LGU QR code.</li>
                            <li>
                              <strong>Confirm the recipient name shows &ldquo;LGU BUTUAN&rdquo;</strong> and the amount matches your assessed fee (<strong>{feeAssessment.formattedTotal}</strong>) before confirming the transaction.
                            </li>
                            <li>Save or download your official transaction receipt or take a screenshot showing the transaction/reference number and date.</li>
                            <li>Upload the receipt in the upload box below and input the reference number.</li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 2. Bank Transfer Instruction Card */}
                  {selectedMethodObj.category === "online_banking" && (
                    <Card className="border border-emerald-200 bg-emerald-50/30 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-emerald-100/50 py-3 px-4 border-b border-emerald-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-emerald-700" />
                          <CardTitle className="text-sm font-bold text-emerald-950">
                            Bank Transfer Instructions (Landbank / Online Banking)
                          </CardTitle>
                        </div>
                        <Badge className="bg-emerald-600 text-white text-[10px]">
                          Official LGU Bank Account
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1 shadow-2xs">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                              Bank Name
                            </span>
                            <span className="text-sm font-bold text-slate-900 block">
                              {LGU_BANK_TRANSFER_INSTRUCTIONS.bankName}
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1 shadow-2xs">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                              Account Name
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-extrabold text-slate-900">
                                {LGU_BANK_TRANSFER_INSTRUCTIONS.accountName}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => copyToClipboard(LGU_BANK_TRANSFER_INSTRUCTIONS.accountName, "bankAccName")}
                                className="h-6 px-1.5 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                              >
                                {copiedField === "bankAccName" ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                    <Check className="w-3 h-3" /> Copied
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copy
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1 shadow-2xs">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                              Account Number
                            </span>
                            <span className="text-xs font-medium text-slate-600 italic block">
                              {LGU_BANK_TRANSFER_INSTRUCTIONS.accountNumber}
                            </span>
                          </div>

                          <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1 shadow-2xs">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                              Required Payment Reference / Description
                            </span>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-blue-700 truncate">
                                {formData.assessmentReference}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="xs"
                                onClick={() => copyToClipboard(formData.assessmentReference, "bankPayRef")}
                                className="h-6 px-1.5 text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 cursor-pointer"
                              >
                                {copiedField === "bankPayRef" ? (
                                  <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                    <Check className="w-3 h-3" /> Copied
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <Copy className="w-3 h-3" /> Copy
                                  </span>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Step by Step instructions */}
                        <div className="p-3 rounded-lg bg-white border border-emerald-100 text-xs text-slate-700 space-y-1.5">
                          <span className="font-bold text-emerald-900 block flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Bank transfer steps:
                          </span>
                          <ol className="list-decimal list-inside space-y-1 text-slate-600 pl-1">
                            <li>Transfer via Landbank Link.BizPortal, online banking app (InstaPay / PESONet), or bank counter deposit.</li>
                            <li>Ensure the recipient account name matches <strong>&ldquo;LGU BUTUAN&rdquo;</strong>.</li>
                            <li>
                              In the transfer description, remarks, or notes field, enter your Application Reference: <strong>{formData.assessmentReference}</strong> or Business Name: <strong>{formData.businessName || "Your Registered Business"}</strong>.
                            </li>
                            <li>Save the transaction confirmation slip, bank deposit slip, or confirmation screenshot.</li>
                            <li>Upload the confirmation below and enter the bank reference or trace number.</li>
                          </ol>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* 3. ATM / Card Instructions Card */}
                  {selectedMethodObj.category === "card" && (
                    <Card className="border border-purple-200 bg-purple-50/30 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-purple-100/50 py-3 px-4 border-b border-purple-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-purple-700" />
                          <CardTitle className="text-sm font-bold text-purple-950">
                            ATM / Debit / Credit Card Payment
                          </CardTitle>
                        </div>
                        <Badge className="bg-purple-600 text-white text-[10px]">
                          Secure Gateway
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs text-slate-700">
                        <p className="leading-relaxed">
                          Pay using BancNet, Visa, or Mastercard cards. Card payments are handled through the authorized PCI-DSS compliant payment gateway. Full card numbers, ATM PINs, and OTPs are never stored or requested by the LGU.
                        </p>
                        <div className="p-3 bg-white rounded-lg border border-purple-100 space-y-1">
                          <span className="font-bold text-purple-900 block">Assessment Reference: {formData.assessmentReference}</span>
                          <span className="text-slate-600">Total Assessed: {feeAssessment.formattedTotal}</span>
                        </div>
                        <p className="text-slate-600">
                          After settling or receiving your card authorization receipt, upload your proof of payment screenshot or slip below.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* 4. Other Payment Methods (CTO Cashier) Card */}
                  {selectedMethodObj.category === "otc" && (
                    <Card className="border border-amber-200 bg-amber-50/30 rounded-xl overflow-hidden shadow-2xs">
                      <CardHeader className="bg-amber-100/50 py-3 px-4 border-b border-amber-200/60 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 text-amber-800" />
                          <CardTitle className="text-sm font-bold text-amber-950">
                            City Treasurer&apos;s Office (CTO) Cashier — In-Person
                          </CardTitle>
                        </div>
                        <Badge className="bg-amber-600 text-white text-[10px]">
                          Over-The-Counter
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3 text-xs text-slate-700">
                        <div className="p-3 bg-white rounded-lg border border-amber-100 space-y-1.5">
                          <span className="font-bold text-amber-950 block">Payment Location:</span>
                          <p className="text-slate-700">
                            City Treasurer&apos;s Office (CTO) Cashier Counters, Ground Floor, Business One-Stop Shop (BOSS), Butuan City Hall Complex, J.P. Rosales Ave., Butuan City.
                          </p>
                          <div className="pt-1 flex flex-wrap items-center gap-3 text-slate-600">
                            <span>Assessment Reference: <strong className="text-slate-900 font-mono">{formData.assessmentReference}</strong></span>
                            <span>Fee: <strong className="text-blue-700 font-mono">{feeAssessment.formattedTotal}</strong></span>
                          </div>
                        </div>
                        <p className="text-slate-600 leading-relaxed">
                          You may submit your application now. Your payment status will remain <strong>Unpaid</strong> until you pay at the CTO cashier and the official receipt is verified. If you already paid at the cashier in advance, upload your official CTO receipt below.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Section D: Upload Proof of Payment Area */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-blue-700" />
                        Upload Proof of Payment
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload your official transaction slip, payment receipt screenshot, or bank deposit voucher.
                      </p>
                    </div>
                    {formData.paymentReceiptDataUrl ? (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-300 font-semibold text-xs">
                        Receipt Ready for Submission
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-slate-600 border-slate-300">
                        {formData.selectedPaymentMethod === "cto_cashier" ? "Optional for In-Person Cashier" : "Required to Submit"}
                      </Badge>
                    )}
                  </div>

                  {/* Mandatory Verification Policy Explanation Alert */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Important Notice Regarding Verification:</span>
                    </div>
                    <p className="leading-relaxed text-amber-900/90 pl-5 text-[11px]">
                      Uploading a receipt does <strong>not</strong> automatically mean the payment has been verified. Your submitted proof will be placed in the administrative queue with a status of <strong>Pending Verification</strong>. An authorized City Administrator must review and confirm the transaction before your registration can be approved.
                    </p>
                  </div>

                  {/* Drag-and-Drop Upload Box */}
                  <div className="space-y-3">
                    {!formData.paymentReceiptDataUrl ? (
                      <div>
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingReceipt(true);
                          }}
                          onDragLeave={() => setIsDraggingReceipt(false)}
                          onDrop={handleReceiptDrop}
                          className={cn(
                            "p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3",
                            isDraggingReceipt
                              ? "border-blue-500 bg-blue-50/80 ring-4 ring-blue-500/20"
                              : errors.paymentReceipt || receiptError
                              ? "border-rose-300 bg-rose-50/40"
                              : "border-slate-300 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-400"
                          )}
                        >
                          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                            <UploadCloud className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-slate-900">
                              Drag and drop your payment receipt here
                            </h4>
                            <p className="text-xs text-slate-500">
                              Supports JPG, JPEG, PNG, and PDF files up to 5MB
                            </p>
                          </div>

                          <div className="pt-1">
                            <label className="cursor-pointer">
                              <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "font-semibold gap-1.5 shadow-2xs")}>
                                <FileUp className="w-3.5 h-3.5" />
                                Choose File
                              </span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                onChange={handleReceiptFileInput}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        {(errors.paymentReceipt || receiptError) && (
                          <p className="text-xs text-rose-600 flex items-center gap-1.5 mt-2 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.paymentReceipt || receiptError}</span>
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Uploaded Receipt Preview & Replace/Remove Controls */
                      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {formData.paymentReceiptFileType.includes("pdf") ? (
                              <div className="w-12 h-12 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" />
                              </div>
                            ) : (
                              <div
                                onClick={() => setReceiptPreviewModalOpen(true)}
                                className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 cursor-pointer hover:opacity-90 relative group"
                                title="Click to view full preview"
                              >
                                <img
                                  src={formData.paymentReceiptDataUrl}
                                  alt="Receipt preview"
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                                  <Eye className="w-4 h-4" />
                                </div>
                              </div>
                            )}

                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                                  {formData.paymentReceiptFilename}
                                </h5>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                                  Uploaded
                                </Badge>
                              </div>
                              <span className="text-xs text-slate-500 block">
                                {(formData.paymentReceiptFileSize / 1024).toFixed(1)} KB • {formData.paymentReceiptFileType}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {!formData.paymentReceiptFileType.includes("pdf") && (
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => setReceiptPreviewModalOpen(true)}
                                className="text-xs cursor-pointer gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                              </Button>
                            )}

                            <label className="cursor-pointer">
                              <span className={cn(buttonVariants({ variant: "outline", size: "xs" }), "text-xs gap-1 cursor-pointer")}>
                                <RefreshCw className="w-3 h-3" />
                                Replace
                              </span>
                              <input
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                                onChange={handleReceiptFileInput}
                                className="hidden"
                              />
                            </label>

                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              onClick={handleRemoveReceipt}
                              className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Remove
                            </Button>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            Proof of payment file selected. It will be submitted for administrative verification upon registration submission.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Verification Form Fields */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                      Transaction & Payment Details
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Amount Paid Field */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Amount Paid (PHP) *
                        </label>
                        <Input
                          type="text"
                          value={formData.paymentAmountPaid || (feeAssessment.isAssessmentRequired ? "" : feeAssessment.totalAmount.toString())}
                          onChange={(e) => updateField("paymentAmountPaid", e.target.value)}
                          placeholder={feeAssessment.totalAmount.toString()}
                          className={cn("bg-white text-xs h-9 font-mono", errors.paymentAmountPaid && "border-rose-400 ring-rose-400")}
                        />
                        {errors.paymentAmountPaid && (
                          <span className="text-[11px] text-rose-600 block">{errors.paymentAmountPaid}</span>
                        )}
                      </div>

                      {/* Transaction / Reference Number Field */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Transaction / Reference No. *
                        </label>
                        <Input
                          type="text"
                          value={formData.paymentTransactionNumber}
                          onChange={(e) => updateField("paymentTransactionNumber", e.target.value)}
                          placeholder="e.g. Maya Ref # / GCash 1029384756"
                          className={cn("bg-white text-xs h-9 font-mono", errors.paymentTransactionNumber && "border-rose-400 ring-rose-400")}
                        />
                        {errors.paymentTransactionNumber && (
                          <span className="text-[11px] text-rose-600 block">{errors.paymentTransactionNumber}</span>
                        )}
                      </div>

                      {/* Payment Date Field */}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 block">
                          Payment Date *
                        </label>
                        <Input
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) => updateField("paymentDate", e.target.value)}
                          className={cn("bg-white text-xs h-9", errors.paymentDate && "border-rose-400 ring-rose-400")}
                        />
                        {errors.paymentDate && (
                          <span className="text-[11px] text-rose-600 block">{errors.paymentDate}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Preview Card */}
                  <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 text-[11px] block uppercase font-semibold">
                        Application Payment Status after Submission
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs font-semibold", paymentBadge.badgeClass)}>
                          <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
                          {paymentBadge.label}
                        </Badge>
                        <span className="text-slate-300 text-xs">
                          {formData.paymentReceiptDataUrl
                            ? "Proof submitted • Awaiting Administrator Review"
                            : "No receipt submitted • Awaiting Settlement"}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
                      <span>Approval Rule: Registration cannot be approved until payment is Verified.</span>
                    </div>
                  </div>
                </div>

                {/* Receipt Modal Preview */}
                <Dialog open={receiptPreviewModalOpen} onOpenChange={setReceiptPreviewModalOpen}>
                  <DialogContent className="sm:max-w-lg p-5 bg-white border rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold text-slate-900">
                        Payment Receipt Preview
                      </DialogTitle>
                      <DialogDescription className="text-xs text-slate-500">
                        {formData.paymentReceiptFilename}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="my-2 max-h-[60vh] overflow-auto rounded-xl border border-slate-200 bg-slate-100 flex items-center justify-center p-2">
                      {formData.paymentReceiptDataUrl && !formData.paymentReceiptFileType.includes("pdf") ? (
                        <img
                          src={formData.paymentReceiptDataUrl}
                          alt="Receipt Preview"
                          className="max-h-[55vh] object-contain rounded"
                        />
                      ) : (
                        <div className="p-8 text-center text-slate-500">
                          <FileText className="w-12 h-12 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm font-semibold">{formData.paymentReceiptFilename}</p>
                          <span className="text-xs">PDF Document</span>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setReceiptPreviewModalOpen(false)}
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
                        <span className="text-slate-500 font-medium">Account Security:</span>
                        <span className="col-span-2 text-emerald-700 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Password configured & terms accepted
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
                        <span className="text-slate-500 font-medium">Amount Declared Paid:</span>
                        <span className="col-span-2 font-mono font-semibold text-slate-900">
                          {formData.paymentAmountPaid ? formatPhpCurrency(Number(formData.paymentAmountPaid)) : feeAssessment.formattedTotal}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Reference Number:</span>
                        <span className="col-span-2 font-mono font-medium text-slate-700">
                          {formData.paymentTransactionNumber || formData.assessmentReference}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Payment Date:</span>
                        <span className="col-span-2 text-slate-700">
                          {formData.paymentDate || "Today"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-slate-500 font-medium">Proof of Payment:</span>
                        <div className="col-span-2">
                          {formData.paymentReceiptDataUrl ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold text-xs">
                                Uploaded ({formData.paymentReceiptFilename})
                              </Badge>
                              <Button
                                type="button"
                                variant="outline"
                                size="xs"
                                onClick={() => setReceiptPreviewModalOpen(true)}
                                className="h-6 text-[11px] px-2 cursor-pointer"
                              >
                                View Receipt
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500 italic">
                              None (In-person settlement at CTO Cashier)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Initial Status:</span>
                        <div className="col-span-2">
                          <Badge variant="outline" className={cn("text-xs font-semibold", paymentBadge.badgeClass)}>
                            <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1.5", paymentBadge.dotColor)} />
                            {paymentBadge.label} ({formData.paymentReceiptDataUrl ? "Pending Administrator Verification" : "Pending Cashier Settle"})
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
                      Payment status is separate from Application Approval status. Settle your payment slip at the City Treasurer&apos;s Office (CTO) Cashier or via verified Maya channel. A paid application remains under evaluation by the City Business Permits and Licensing Department (CBPLD) and requires formal administrative inspection before official vendor accreditation.
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
                {formData.paymentReceiptDataUrl ? "Pending Verification • Awaiting Admin Review" : "Unpaid • Pending Cashier Settle"}
              </Badge>
            </div>
            <div className="flex justify-between items-center font-medium">
              <span>Application Review:</span>
              <span className="text-blue-700 font-semibold">Under CBPLD Review Queue</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/70 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-blue-900 block">Next Steps & Payment Verification Notice:</span>
            {formData.paymentReceiptDataUrl ? (
              <p>
                Your proof of payment has been uploaded and submitted for administrator review. <strong>Note:</strong> Under Butuan City registration rules, your application cannot be approved until your payment has been verified by an authorized review officer.
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
              href={`/register/success?appNumber=${createdAppNumber}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:flex-1 justify-center font-semibold cursor-pointer"
              )}
            >
              View Official Receipt & Slip
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
