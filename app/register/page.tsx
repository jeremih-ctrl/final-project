"use client";

import { useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createApplication,
  generateNextApplicationNumber,
} from "@/lib/application-store";
import { VendorApplication } from "@/lib/types/vendor-application";

const STEPS = [
  { id: 1, name: "Business", title: "Business Information" },
  { id: 2, name: "Contact", title: "Contact & Address" },
  { id: 3, name: "Verification", title: "Identity Verification" },
  { id: 4, name: "Account", title: "Account Security" },
  { id: 5, name: "Review", title: "Review & Submit" },
];

const SAMPLE_BARANGAYS = [
  "Baan KM 3",
  "Ampayon",
  "Agusan Pequeño",
  "Libertad",
  "Leon Kilat",
  "San Vicente",
  "Villa Kananga",
  "Urduja",
  "Doongan",
];

const ID_TYPES = [
  "Driver's License",
  "Passport",
  "PhilSys ID",
  "UMID",
  "Other",
];

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [createdAppNumber, setCreatedAppNumber] = useState<string>("BVR-2026-001248");

  // Form State (Starts empty so validation on required fields can be tested)
  const [formData, setFormData] = useState({
    // Step 1: Business Information
    businessName: "",
    ownerName: "",
    businessDescription: "",

    // Step 2: Contact & Address
    contactNumber: "",
    emailAddress: "",
    houseNo: "",
    street: "",
    barangay: "",

    // Step 3: Verification (Optional)
    idType: "",
    idNumber: "",
    idFileName: "",
    isSkippedId: false,

    // Step 4: Account Security
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

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

  // Pre-fill demo data for rapid testing
  const handleFillDemo = () => {
    setFormData({
      businessName: "Aling Nena's Native Delicacies",
      ownerName: "Nena M. Alcantara",
      businessDescription: "Selling homemade delicacies and native snacks at Butuan Public Market.",
      contactNumber: "09171234567",
      emailAddress: "nena.alcantara@example.com",
      houseNo: "Stall No. 14, Building B",
      street: "Montilla Boulevard",
      barangay: "San Vicente",
      idType: "PhilSys ID",
      idNumber: "1234-5678-9012",
      idFileName: "philsys_sample.jpg",
      isSkippedId: false,
      password: "Password123",
      confirmPassword: "Password123",
      agreeTerms: true,
      agreePrivacy: true,
    });
    setErrors({});
    setFileError("");
  };

  // 1. Step 1 Validation
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    }

    if (!formData.ownerName.trim()) {
      newErrors.ownerName = "Owner name is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 2. Step 2 Validation
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    const cleanedPhone = formData.contactNumber.replace(/[\s-]/g, "");

    // Contact Number
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = "Contact number is required.";
    } else if (!/^(09|\+639)\d{9}$/.test(cleanedPhone)) {
      newErrors.contactNumber = "Please enter a valid Philippine mobile number.";
    }

    // Email Address
    if (!formData.emailAddress.trim()) {
      newErrors.emailAddress = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailAddress.trim())) {
      newErrors.emailAddress = "Please enter a valid email address.";
    }

    // Address Fields
    if (!formData.houseNo.trim()) {
      newErrors.houseNo = "House or building number is required.";
    }

    if (!formData.street.trim()) {
      newErrors.street = "Street name is required.";
    }

    if (!formData.barangay.trim()) {
      newErrors.barangay = "Please select a barangay.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 3. Step 3 Validation (Government ID is Optional)
  const validateStep3 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // If skipped or completely empty, no validation required
    const hasStartedId =
      Boolean(formData.idType) ||
      Boolean(formData.idNumber.trim()) ||
      Boolean(formData.idFileName);

    if (hasStartedId && !formData.isSkippedId) {
      if (!formData.idType) {
        newErrors.idType = "Please select an ID type.";
      }
      if (!formData.idNumber.trim()) {
        newErrors.idNumber = "ID number is required.";
      }
      if (fileError) {
        newErrors.fileError = fileError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Step 4 Validation (Account Security)
  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Password requirements
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else {
      const hasLength = formData.password.length >= 8;
      const hasUpper = /[A-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);

      if (!hasLength || !hasUpper || !hasNumber) {
        newErrors.password = "Password does not meet the requirements.";
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
      }
    }
  };

  const handleRemoveFile = () => {
    updateField("idFileName", "");
    setFileError("");
  };

  const handleSkipId = () => {
    setErrors({});
    setFileError("");
    updateField("isSkippedId", true);
    updateField("idType", "");
    updateField("idNumber", "");
    updateField("idFileName", "");
    setCurrentStep(4);
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
  const handleSubmit = () => {
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

    try {
      const newAppNumber = generateNextApplicationNumber();
      const now = new Date().toISOString();

      const newApp: VendorApplication = {
        id: newAppNumber,
        applicationNumber: newAppNumber,
        status: "submitted",
        business: {
          businessName: formData.businessName.trim(),
          businessDescription: formData.businessDescription.trim() || undefined,
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
        statusHistory: [
          {
            id: `hist-${Date.now()}`,
            previousStatus: null,
            newStatus: "submitted",
            timestamp: now,
            action: "Application Submitted",
            actionBy: "Vendor",
          },
        ],
        submittedAt: now,
        updatedAt: now,
        createdAt: now,
      };

      createApplication(newApp);
      setCreatedAppNumber(newAppNumber);
      setSuccessModalOpen(true);
    } catch (err) {
      console.error("Failed to submit registration application:", err);
      setSuccessModalOpen(true);
    }
  };

  // Password rules checks for dynamic visual feedback
  const isPasswordMinLength = formData.password.length >= 8;
  const isPasswordUppercase = /[A-Z]/.test(formData.password);
  const isPasswordNumber = /[0-9]/.test(formData.password);

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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              title="Pre-fill form with sample Butuan vendor details for testing"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Fill Demo Data</span>
              <span className="sm:hidden">Demo</span>
            </button>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Registration Container */}
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
          {/* 7. Better Responsive Step Indicator */}
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
            {/* STEP 1: Business Information */}
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
                    Tell us about your local business in Butuan City.
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
                      placeholder="Enter your business name"
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
                        e.g., Aling Nena&apos;s Native Delicacies, Guingona Refreshments, etc.
                      </p>
                    )}
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ownerName"
                      className="text-sm font-semibold text-slate-800 flex items-center justify-between"
                    >
                      <span>
                        Owner Name <span className="text-rose-500">*</span>
                      </span>
                    </label>
                    <Input
                      id="ownerName"
                      value={formData.ownerName}
                      onChange={(e) => updateField("ownerName", e.target.value)}
                      placeholder="Enter the full name of the business owner"
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
                        Full legal name of the sole proprietor or operator.
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
                      placeholder="Briefly describe your business"
                      className="min-h-24 px-3.5 py-2.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm"
                      rows={3}
                    />
                    <p className="text-xs text-slate-500">
                      Describe the goods or services you provide (e.g. fresh fruits, cooked meals, apparel).
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    type="button"
                    onClick={handleContinue}
                    size="lg"
                    className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: Contact & Address */}
            {currentStep === 2 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 2 of 5
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Contact & Business Address
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Provide your contact information and where your business operates.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Contact Number & Email Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contactNumber"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Contact Number <span className="text-rose-500">*</span>
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
                        <p className="text-xs text-slate-500">
                          Format: 09XXXXXXXXX or +639XXXXXXXXX
                        </p>
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
                        placeholder="you@example.com"
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
                        <p className="text-xs text-slate-500">For registration receipt and updates</p>
                      )}
                    </div>
                  </div>

                  {/* House/Building No. & Street Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="houseNo"
                        className="text-sm font-semibold text-slate-800"
                      >
                        House/Building No. <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="houseNo"
                        value={formData.houseNo}
                        onChange={(e) => updateField("houseNo", e.target.value)}
                        placeholder="House or building number"
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

                    <div className="space-y-1.5">
                      <label
                        htmlFor="street"
                        className="text-sm font-semibold text-slate-800"
                      >
                        Street <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => updateField("street", e.target.value)}
                        placeholder="Street name"
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
                    <label className="text-sm font-semibold text-slate-800">
                      Barangay <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      value={formData.barangay}
                      onValueChange={(val) => val && updateField("barangay", val)}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.barangay &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      >
                        <SelectValue placeholder="Select a barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_BARANGAYS.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.barangay ? (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.barangay}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Select your operating barangay in Butuan City.
                      </p>
                    )}
                  </div>

                  {/* Fixed Location Notice Card */}
                  <div className="rounded-xl bg-blue-50/60 border border-blue-200/80 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                      <MapPin className="w-4 h-4 text-blue-700" />
                      <span>Fixed Location Jurisdiction</span>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px]">
                        Locked
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Country</span>
                        <span className="font-bold text-slate-900">Philippines</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Region</span>
                        <span className="font-bold text-slate-900">Caraga</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">Province</span>
                        <span className="font-bold text-slate-900">Agusan del Norte</span>
                      </div>
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                        <span className="text-slate-500 block text-[11px]">City</span>
                        <span className="font-bold text-slate-900">Butuan City</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-normal">
                      Note: This system is specifically for local vendors in Butuan City. Geographic jurisdiction cannot be modified.
                    </p>
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
                    Continue
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Verification (Optional) */}
            {currentStep === 3 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider">
                      Step 3 of 5
                    </span>
                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs">
                      Optional
                    </Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Identity Verification
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Providing a government-issued ID is optional. It may help administrators verify your registration.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Government ID Type */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800">
                      Government ID Type
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
                          "w-full h-11 px-3.5 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.idType &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      >
                        <SelectValue placeholder="Select ID Type (Optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((id) => (
                          <SelectItem key={id} value={id}>
                            {id}
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

                  {/* Government ID Number */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="idNumber"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Government ID Number
                    </label>
                    <Input
                      id="idNumber"
                      value={formData.idNumber}
                      onChange={(e) => {
                        updateField("idNumber", e.target.value);
                        updateField("isSkippedId", false);
                      }}
                      placeholder="Enter ID number"
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

                  {/* Upload Government ID Area */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-800 block">
                      Upload Government ID
                    </label>

                    <div
                      className={cn(
                        "relative border-2 border-dashed rounded-2xl p-6 text-center transition-all",
                        fileError
                          ? "border-rose-300 bg-rose-50/20"
                          : "border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/20"
                      )}
                    >
                      <input
                        type="file"
                        id="idFile"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".png,.jpg,.jpeg,.pdf"
                        onChange={handleFileUpload}
                      />

                      <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                        <div
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            fileError ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                          )}
                        >
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-slate-800">
                            Upload Government ID
                          </p>
                          <p className="text-xs text-slate-500">
                            Drag and drop or browse from your device
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium pt-1">
                          <span>PNG, JPG, or PDF</span>
                          <span>•</span>
                          <span>Maximum file size: 5MB</span>
                        </div>
                      </div>
                    </div>

                    {/* File validation error feedback */}
                    {fileError && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{fileError}</span>
                      </p>
                    )}

                    {/* Attached file badge */}
                    {formData.idFileName && !fileError && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium truncate">{formData.idFileName}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-emerald-700 font-semibold">
                            Attached
                          </span>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="p-1 rounded-md hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                            title="Remove attached file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    size="lg"
                    className="w-full sm:w-auto font-medium cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSkipId}
                      size="lg"
                      className="font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      Skip for now
                    </Button>

                    <Button
                      type="button"
                      onClick={handleContinue}
                      size="lg"
                      className="font-semibold px-6 py-2.5 gap-2 cursor-pointer shadow-xs"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Account Security */}
            {currentStep === 4 && (
              <div className="p-6 sm:p-8 space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-2">
                    Step 4 of 5
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Create Your Account
                  </h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Create a secure password for your vendor account.
                  </p>
                </div>

                <div className="space-y-5 pt-2">
                  {/* Read-Only Email Display */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <span>Email Address</span>
                      <span className="text-xs text-slate-500 font-normal">
                        From Step 2 (Read-only)
                      </span>
                    </label>
                    <div className="relative">
                      <Input
                        readOnly
                        value={formData.emailAddress || "(Not yet provided in Step 2)"}
                        className="h-11 px-3.5 bg-slate-100/80 border-slate-300 text-slate-700 cursor-not-allowed font-medium text-base sm:text-sm"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    </div>
                  </div>

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
                        placeholder="••••••••"
                        className={cn(
                          "h-11 px-3.5 pr-10 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.password &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        placeholder="••••••••"
                        className={cn(
                          "h-11 px-3.5 pr-10 bg-slate-50/50 border-slate-300 focus:bg-white text-base sm:text-sm",
                          errors.confirmPassword &&
                            "border-rose-400 focus-visible:ring-rose-400/40 bg-rose-50/20"
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.confirmPassword}</span>
                      </p>
                    )}
                  </div>

                  {/* 4. Password Requirement Visual Display */}
                  <div className="rounded-xl bg-slate-50/90 border border-slate-200/90 p-4 space-y-2">
                    <span className="text-xs font-semibold text-slate-700 block">
                      Password requirements
                    </span>
                    <ul className="text-xs space-y-1.5">
                      <li className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                            isPasswordMinLength
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {isPasswordMinLength ? "✓" : "•"}
                        </span>
                        <span
                          className={cn(
                            isPasswordMinLength
                              ? "text-emerald-700 font-semibold"
                              : "text-slate-600"
                          )}
                        >
                          At least 8 characters
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                            isPasswordUppercase
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {isPasswordUppercase ? "✓" : "•"}
                        </span>
                        <span
                          className={cn(
                            isPasswordUppercase
                              ? "text-emerald-700 font-semibold"
                              : "text-slate-600"
                          )}
                        >
                          One uppercase letter
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                            isPasswordNumber
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          )}
                        >
                          {isPasswordNumber ? "✓" : "•"}
                        </span>
                        <span
                          className={cn(
                            isPasswordNumber
                              ? "text-emerald-700 font-semibold"
                              : "text-slate-600"
                          )}
                        >
                          One number
                        </span>
                      </li>
                    </ul>
                  </div>

                  {/* 6. Terms & Privacy Checkboxes with Validation */}
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox
                          checked={formData.agreeTerms}
                          onCheckedChange={(checked) =>
                            updateField("agreeTerms", Boolean(checked))
                          }
                          className={cn(
                            "mt-0.5",
                            errors.agreeTerms && "border-rose-400 aria-invalid:border-rose-400"
                          )}
                        />
                        <span className="text-xs sm:text-sm text-slate-700 leading-snug group-hover:text-slate-900">
                          I agree to the{" "}
                          <span className="text-blue-700 font-medium underline underline-offset-2">
                            Terms and Conditions
                          </span>
                        </span>
                      </label>
                      {errors.agreeTerms && (
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pl-7">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.agreeTerms}</span>
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <Checkbox
                          checked={formData.agreePrivacy}
                          onCheckedChange={(checked) =>
                            updateField("agreePrivacy", Boolean(checked))
                          }
                          className={cn(
                            "mt-0.5",
                            errors.agreePrivacy && "border-rose-400 aria-invalid:border-rose-400"
                          )}
                        />
                        <span className="text-xs sm:text-sm text-slate-700 leading-snug group-hover:text-slate-900">
                          I acknowledge the{" "}
                          <span className="text-blue-700 font-medium underline underline-offset-2">
                            Privacy Policy
                          </span>
                        </span>
                      </label>
                      {errors.agreePrivacy && (
                        <p className="text-xs font-medium text-rose-500 flex items-center gap-1 pl-7">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors.agreePrivacy}</span>
                        </p>
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
                    Continue
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 5: Review & Submit */}
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
                    Please review your information before submitting your vendor registration.
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
                        <span className="text-slate-500 font-medium">Owner Name:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.ownerName || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Description:</span>
                        <span className="col-span-2 text-slate-700 italic">
                          {formData.businessDescription || "None provided (Optional)"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Contact Information */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Contact Information
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
                    </CardContent>
                  </Card>

                  {/* Card 3: Business Address */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Business Address
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
                        <span className="text-slate-500 font-medium">House/Building No.:</span>
                        <span className="col-span-2 text-slate-800 font-medium">
                          {formData.houseNo || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Street:</span>
                        <span className="col-span-2 text-slate-800 font-medium">
                          {formData.street || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Barangay:</span>
                        <span className="col-span-2 text-slate-800 font-medium">
                          {formData.barangay || "(Not selected)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-slate-600">
                        <span className="text-slate-500 font-medium">Jurisdiction:</span>
                        <span className="col-span-2 text-slate-800 font-medium">
                          Butuan City, Agusan del Norte, Caraga, Philippines
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 4: Verification */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Verification
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
                        <div className="col-span-2">
                          {formData.idType || formData.idFileName || formData.idNumber ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">
                                Provided
                              </Badge>
                              <span className="text-xs text-slate-700">
                                {formData.idType || "ID"}{" "}
                                {formData.idNumber ? `• No. ${formData.idNumber}` : ""}
                                {formData.idFileName ? ` (${formData.idFileName})` : ""}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300">
                              Not provided (Optional)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 5: Account */}
                  <Card className="border border-slate-200 shadow-2xs rounded-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/70 p-4 border-b border-slate-200/70 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-blue-700" />
                        <CardTitle className="text-sm font-bold text-slate-900">
                          Account
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => goToStep(4)}
                        className="text-xs text-blue-700 hover:text-blue-800 hover:bg-blue-50 font-semibold cursor-pointer"
                      >
                        Edit
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Email Address:</span>
                        <span className="col-span-2 font-semibold text-slate-900">
                          {formData.emailAddress || "(Not provided)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-slate-500 font-medium">Password:</span>
                        <span className="col-span-2 font-mono text-slate-700">••••••••</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Checkbox Acknowledgment Display */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs sm:text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "w-4 h-4",
                          formData.agreeTerms ? "text-emerald-600" : "text-slate-300"
                        )}
                      />
                      <span className={formData.agreeTerms ? "font-medium" : "text-slate-400"}>
                        Terms and Conditions {formData.agreeTerms ? "accepted" : "(Pending)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className={cn(
                          "w-4 h-4",
                          formData.agreePrivacy ? "text-emerald-600" : "text-slate-300"
                        )}
                      />
                      <span className={formData.agreePrivacy ? "font-medium" : "text-slate-400"}>
                        Privacy Policy {formData.agreePrivacy ? "acknowledged" : "(Pending)"}
                      </span>
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
                    onClick={handleSubmit}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 text-base shadow-md cursor-pointer gap-2"
                  >
                    Submit Registration
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* 10. Success Modal */}
      <Dialog open={successModalOpen} onOpenChange={setSuccessModalOpen}>
        <DialogContent className="sm:max-w-md p-6 bg-white border border-slate-200 rounded-2xl shadow-xl">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-slate-900 text-center">
              Registration Submitted!
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 text-center leading-relaxed">
              Your vendor registration application has been submitted successfully to the City Government of Butuan.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex justify-between font-medium items-center">
              <span>Application No:</span>
              <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {createdAppNumber}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Jurisdiction:</span>
              <span className="text-slate-900 font-semibold">City of Butuan</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Status:</span>
              <span className="text-blue-700 font-semibold">Submitted</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Link
              href={`/register/success?appNumber=${createdAppNumber}`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "w-full sm:flex-1 justify-center font-semibold cursor-pointer"
              )}
            >
              View Confirmation
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
