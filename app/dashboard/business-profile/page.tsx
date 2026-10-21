"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Building2,
  Phone,
  Mail,
  MapPin,
  Lock,
  Edit3,
  CheckCircle2,
  Info,
  ShieldCheck,
  Store,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { updateApplication } from "@/lib/application-store";
import { useAppRole } from "@/lib/clerk-roles";
import { VendorApplication } from "@/lib/types/vendor-application";
import {
  useSharedApplication,
  SharedApplication,
  EMPTY_APPLICATION,
} from "@/lib/vendor-application-state";
import { useEffect } from "react";

export default function BusinessProfilePage() {
  const { user: clerkUser, isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, email: clerkEmail } = useAppRole();
  const { application: sharedApp } = useSharedApplication();

  const isSharedOwned = Boolean(sharedApp.userId && clerkUser?.id && sharedApp.userId === clerkUser.id);
  const application: SharedApplication = isSharedOwned ? sharedApp : EMPTY_APPLICATION;
  const initialApp = isSharedOwned ? sharedApp : null;

  // 1. Business Info State
  const [businessInfo, setBusinessInfo] = useState({
    businessName: initialApp?.business?.businessName || initialApp?.businessName || "",
    ownerName: initialApp?.vendor?.name || initialApp?.ownerName || clerkUser?.fullName || "",
    businessDescription: initialApp?.business?.description || "",
  });
  const [tempBusinessInfo, setTempBusinessInfo] = useState(businessInfo);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);

  // 2. Contact Info State
  const [contactInfo, setContactInfo] = useState({
    contactNumber: initialApp?.vendor?.phone || initialApp?.contactNumber || "",
    email: initialApp?.vendor?.email || initialApp?.email || clerkEmail || "",
  });
  const [tempContactInfo, setTempContactInfo] = useState(contactInfo);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // 3. Address Info State
  const [addressInfo, setAddressInfo] = useState({
    houseNo: initialApp?.business?.houseNumber || initialApp?.houseNumber || "",
    street: initialApp?.business?.street || initialApp?.street || "",
    barangay: initialApp?.business?.barangay || initialApp?.barangay || "",
  });
  const [tempAddressInfo, setTempAddressInfo] = useState(addressInfo);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);

  const [currentAppNumber, setCurrentAppNumber] = useState<string>(
    initialApp?.applicationNumber || initialApp?.id || ""
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isClerkLoaded) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!isClerkSignedIn || !clerkUser?.id) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/vendor/application", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const target: VendorApplication | undefined = data?.application;
          if (
            !cancelled &&
            target &&
            (target.userId === clerkUser.id || (target as unknown as { clerkUserId?: string }).clerkUserId === clerkUser.id)
          ) {
            const bName = target.business?.businessName || "";
            const oName = target.owner?.ownerName || clerkUser.fullName || "";
            const bDesc =
              target.business?.businessDescription ||
              (target.business as unknown as { description?: string })?.description ||
              "";
            const cPhone = target.contact?.contactNumber || "";
            const cEmail = target.contact?.emailAddress || clerkEmail || "";
            const hNo =
              target.address?.houseNo ||
              (target.address as unknown as { houseNumber?: string })?.houseNumber ||
              "";
            const str = target.address?.street || "";
            const brgy = target.address?.barangay || "";

            const newBiz = { businessName: bName, ownerName: oName, businessDescription: bDesc };
            const newContact = { contactNumber: cPhone, email: cEmail };
            const newAddr = { houseNo: hNo, street: str, barangay: brgy };

            setBusinessInfo(newBiz);
            setTempBusinessInfo(newBiz);
            setContactInfo(newContact);
            setTempContactInfo(newContact);
            setAddressInfo(newAddr);
            setTempAddressInfo(newAddr);
            setCurrentAppNumber(target.applicationNumber || target.id || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch application in business profile:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, isClerkSignedIn, clerkUser?.id, clerkUser?.fullName, clerkEmail]);

  // Notification feedback banner for local edits
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const targetAppNumber = currentAppNumber || (isSharedOwned ? (sharedApp.applicationNumber || sharedApp.id) : "");

  const handleSaveBusiness = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessInfo(tempBusinessInfo);
    setBusinessDialogOpen(false);
    if (targetAppNumber) {
      updateApplication(targetAppNumber, {
        business: {
          businessName: tempBusinessInfo.businessName,
          businessDescription: tempBusinessInfo.businessDescription,
        },
        owner: {
          ownerName: tempBusinessInfo.ownerName,
        },
      });
    }
    setSavedFeedback("Business information updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    setContactInfo(tempContactInfo);
    setContactDialogOpen(false);
    if (targetAppNumber) {
      updateApplication(targetAppNumber, {
        contact: {
          contactNumber: tempContactInfo.contactNumber,
          emailAddress: tempContactInfo.email,
        },
      });
    }
    setSavedFeedback("Contact information updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressInfo(tempAddressInfo);
    setAddressDialogOpen(false);
    if (targetAppNumber) {
      updateApplication(targetAppNumber, {
        address: {
          houseNo: tempAddressInfo.houseNo,
          street: tempAddressInfo.street,
          barangay: tempAddressInfo.barangay,
        },
      });
    }
    setSavedFeedback("Operating address updated successfully.");
    setTimeout(() => setSavedFeedback(null), 4000);
  };

  // Fixed Jurisdiction constants (Cannot be changed by vendor)
  const JURISDICTION = {
    city: "Butuan City",
    province: "Agusan del Norte",
    region: "Caraga",
    country: "Philippines",
  };

  const hasRealApp = isSharedOwned || Boolean(currentAppNumber) || Boolean(businessInfo.businessName);

  if (isClerkLoaded && !isLoading && !hasRealApp) {
    return (
      <div className="py-12 px-4 max-w-xl mx-auto">
        <Card className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 mx-auto flex items-center justify-center">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-bold uppercase tracking-wider">
              No Business Profile
            </Badge>
            <h2 className="text-xl font-bold text-slate-900">
              No Registered Business Profile
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              No registered vendor application was found for your account. Register your business to establish your business profile and operate legally.
            </p>
          </div>
          <div className="pt-2 flex justify-center">
            <Link
              href="/register?new=true"
              className={cn(
                buttonVariants({ variant: "default" }),
                "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-10 px-5 rounded-xl cursor-pointer shadow-xs gap-1.5 inline-flex items-center"
              )}
            >
              Start Vendor Registration
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const currentStatus = isSharedOwned ? sharedApp.status : "submitted";
  const isApproved = currentStatus === "approved";
  const isNeedsCorrection = currentStatus === "needs-correction";
  const isRejected = currentStatus === "rejected";

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Business Profile
            </h1>
            {isApproved ? (
              <Badge className="bg-emerald-100 text-emerald-950 border-emerald-300 text-xs font-bold">
                ● Approved (Certified)
              </Badge>
            ) : isNeedsCorrection ? (
              <Badge className="bg-orange-100 text-orange-950 border-orange-300 text-xs font-bold">
                ● Needs Correction
              </Badge>
            ) : isRejected ? (
              <Badge className="bg-slate-100 text-slate-800 border-slate-300 text-xs font-semibold">
                ● Not Approved
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
                ● Under Review
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View and manage your registered business information, vending logistics, and municipal compliance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/my-application"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "text-xs font-medium text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            View My Application
          </Link>
        </div>
      </div>

      {/* Temporary Success Feedback */}
      {savedFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center gap-2.5 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{savedFeedback}</span>
        </div>
      )}

      {/* Top Banner: Application Identifiers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Application Number
          </span>
          <span className="font-mono text-sm sm:text-base font-bold text-slate-900">
            {application.applicationNumber || application.id || "Pending Submission"}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Vendor ID
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {application.vendorId || (isApproved ? "Assigned upon release" : "Not assigned yet")}
            </span>
            <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50">
              {application.vendorId ? "Assigned" : "Pending Approval"}
            </Badge>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
            Jurisdiction
          </span>
          <span className="text-xs sm:text-sm font-bold text-blue-900">
            City of Butuan, Caraga
          </span>
        </div>
      </div>

      {!businessInfo.businessName && !businessInfo.ownerName && !contactInfo.contactNumber && !addressInfo.street && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Complete your business profile to view your registered business information.
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              You haven&apos;t set up your vendor registration profile yet. Enter your business, contact, and vending address details below.
            </p>
          </div>
        </div>
      )}

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Business Details */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Business Details
              </CardTitle>
            </div>

            {/* Edit Business Profile Dialog */}
            <Dialog open={businessDialogOpen} onOpenChange={setBusinessDialogOpen}>
              <DialogTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTempBusinessInfo(businessInfo)}
                    className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Details</span>
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Business Details</DialogTitle>
                  <DialogDescription>
                    Update your registered trade name, owner details, and description.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSaveBusiness} className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-name"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Business Name <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="biz-name"
                      value={tempBusinessInfo.businessName}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          businessName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-owner"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Owner Name <span className="text-rose-600">*</span>
                    </label>
                    <Input
                      id="biz-owner"
                      value={tempBusinessInfo.ownerName}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          ownerName: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="biz-desc"
                      className="text-xs font-semibold text-slate-700"
                    >
                      Business Description
                    </label>
                    <Textarea
                      id="biz-desc"
                      rows={3}
                      value={tempBusinessInfo.businessDescription}
                      onChange={(e) =>
                        setTempBusinessInfo({
                          ...tempBusinessInfo,
                          businessDescription: e.target.value,
                        })
                      }
                    />
                  </div>

                  <DialogFooter className="pt-2">
                    <DialogClose render={<Button variant="outline" type="button" />}>
                      Cancel
                    </DialogClose>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 block">
                  Business Name
                </span>
                <span className="text-base font-bold text-slate-900 block">
                  {businessInfo.businessName || "Not yet provided"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 block">
                  Registered Owner
                </span>
                <span className="text-sm font-semibold text-slate-800 block">
                  {businessInfo.ownerName || "Not yet provided"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 block">
                  Vending / Trade Category
                </span>
                <span className="text-sm font-semibold text-slate-800 block">
                  {application.business?.category || "General Vending"}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 block">
                  Registration Accreditation
                </span>
                <Badge
                  className={cn(
                    "text-xs font-bold",
                    isApproved
                      ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                      : "bg-blue-50 text-blue-800 border-blue-200"
                  )}
                >
                  {isApproved ? "Certified Municipal Vendor" : "Under Administrative Review"}
                </Badge>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-xs font-medium text-slate-500 block">
                Business Description
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                {businessInfo.businessDescription ? `“${businessInfo.businessDescription}”` : "No description provided."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Business Location and Contact Information */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Business Location &amp; Contact Information
              </CardTitle>
            </div>

            <div className="flex items-center gap-2">
              {/* Edit Contact Dialog */}
              <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempContactInfo(contactInfo)}
                      className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Contact</span>
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Edit Contact Information</DialogTitle>
                    <DialogDescription>
                      Provide valid contact information for official verification and municipal notifications.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveContact} className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-phone"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Contact Number <span className="text-rose-600">*</span>
                      </label>
                      <Input
                        id="contact-phone"
                        value={tempContactInfo.contactNumber}
                        onChange={(e) =>
                          setTempContactInfo({
                            ...tempContactInfo,
                            contactNumber: e.target.value,
                          })
                        }
                        required
                      />
                      <p className="text-[11px] text-slate-500">
                        Format: 11-digit Philippine mobile number (e.g. 09171234567)
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-email"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Email Address <span className="text-rose-600">*</span>
                      </label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={tempContactInfo.email}
                        onChange={(e) =>
                          setTempContactInfo({
                            ...tempContactInfo,
                            email: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <DialogFooter className="pt-2">
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Cancel
                      </DialogClose>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Edit Address Dialog */}
              <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTempAddressInfo(addressInfo)}
                      className="text-xs font-semibold text-slate-700 border-slate-300 hover:bg-slate-100 cursor-pointer gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit Address</span>
                    </Button>
                  }
                />
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Edit Operating Address</DialogTitle>
                    <DialogDescription>
                      You can update your stall or building location. City and Province jurisdiction are fixed to Butuan City.
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleSaveAddress} className="space-y-4 py-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="addr-house"
                          className="text-xs font-semibold text-slate-700"
                        >
                          House/Building No.
                        </label>
                        <Input
                          id="addr-house"
                          value={tempAddressInfo.houseNo}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              houseNo: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="addr-street"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Street
                        </label>
                        <Input
                          id="addr-street"
                          value={tempAddressInfo.street}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              street: e.target.value,
                            })
                          }
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1.5">
                        <label
                          htmlFor="addr-brgy"
                          className="text-xs font-semibold text-slate-700"
                        >
                          Barangay
                        </label>
                        <Input
                          id="addr-brgy"
                          value={tempAddressInfo.barangay}
                          onChange={(e) =>
                            setTempAddressInfo({
                              ...tempAddressInfo,
                              barangay: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Fixed Jurisdiction Fields Notice */}
                    <div className="p-3 bg-slate-100 rounded-xl border border-slate-200/90 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Fixed System Jurisdiction (Read-Only)</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-500 block">City:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.city}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Province:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.province}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Region:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.region}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Country:</span>
                          <span className="font-semibold text-slate-800">{JURISDICTION.country}</span>
                        </div>
                      </div>
                    </div>

                    <DialogFooter className="pt-2">
                      <DialogClose render={<Button variant="outline" type="button" />}>
                        Cancel
                      </DialogClose>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            {/* Operating Address */}
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-500 block">
                Operating Address
              </span>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">
                    {addressInfo.houseNo ? `${addressInfo.houseNo} ` : ""}
                    {addressInfo.street || "Declared Stall"}
                  </span>
                  <span className="text-slate-600 text-xs block">
                    Barangay {addressInfo.barangay || "Urduja"}, {JURISDICTION.city}, {JURISDICTION.province}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <Phone className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] font-medium text-slate-500 block">Contact Phone</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block font-mono">
                    {contactInfo.contactNumber || "Not provided"}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium block">
                    Verified for SMS notifications
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                <Mail className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] font-medium text-slate-500 block">Email Address</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate" title={contactInfo.email}>
                    {contactInfo.email || "Not provided"}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Official notice channel
                  </span>
                </div>
              </div>
            </div>

            {/* Fixed Jurisdiction Box */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-600">
              <Lock className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 block">
                  Municipal Jurisdiction: Butuan City, Agusan del Norte (Caraga Region)
                </span>
                <span className="text-[11px] text-slate-500">
                  System jurisdiction is locked according to Butuan City Ordinance standards.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Vending Logistics */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-teal-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Vending Logistics
              </CardTitle>
            </div>
            <Badge variant="outline" className="text-[11px] font-semibold text-slate-600 bg-slate-50">
              {application.isVerified ? "Location Verified" : "Pending Inspection"}
            </Badge>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Declared Vending Location
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {addressInfo.street || application.business?.address || "Declared Stall Location"}
                  {addressInfo.barangay ? `, Brgy. ${addressInfo.barangay}` : ""}
                </p>
                <span className="inline-block text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mt-1">
                  Submitted by Vendor
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Vending Category &amp; Activity
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  {application.business?.category || "General Vending"}
                </p>
                <span className="inline-block text-[10px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 mt-1">
                  Declared Operational Type
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Operating Site Designation
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  Authorized Municipal Vending Zone
                </p>
                <span className="inline-block text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded mt-1">
                  City Public Market &amp; Commercial Area
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Site Inspection Schedule
                </span>
                <p className="text-xs text-slate-600 font-medium">
                  No on-site inspection appointment is currently scheduled.
                </p>
                <span className="inline-block text-[10px] text-slate-600 font-medium bg-slate-100 px-2 py-0.5 rounded mt-1">
                  Awaiting Review Schedule
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Compliance and Requirements */}
        <Card className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <CardTitle className="text-base font-bold text-slate-900">
                Compliance &amp; Requirements
              </CardTitle>
            </div>
            <Badge
              className={cn(
                "text-[11px] font-bold",
                isApproved
                  ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              )}
            >
              {isApproved ? "Accredited & Compliant" : "Under Evaluation"}
            </Badge>
          </CardHeader>

          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Location Verification Status
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {application.isVerified
                    ? "Verified by City Administrator"
                    : "Not yet verified by City Administrator"}
                </p>
                <span
                  className={cn(
                    "inline-block text-[10px] font-medium px-2 py-0.5 rounded mt-1",
                    application.isVerified
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-amber-800 bg-amber-50 border border-amber-200/60"
                  )}
                >
                  {application.isVerified ? "Verified" : "Pending Field Inspection"}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 font-medium block">
                  Municipal Accreditation Status
                </span>
                <p className="text-xs font-semibold text-slate-800">
                  {isApproved
                    ? "Accredited Municipal Vendor — Ordinance Compliant"
                    : "Pending Administrative Review & Accreditation"}
                </p>
                <span
                  className={cn(
                    "inline-block text-[10px] font-medium px-2 py-0.5 rounded mt-1",
                    isApproved
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-blue-800 bg-blue-50 border border-blue-200/60"
                  )}
                >
                  {isApproved ? "Certificate Active" : "In Evaluation Queue"}
                </span>
              </div>
            </div>

            {/* Administrator Remarks / Compliance Notes */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
              <span className="font-bold text-slate-800 block">
                Logistics &amp; Compliance Notes
              </span>
              <p className="text-slate-600 leading-relaxed">
                {application.adminRemarks
                  ? `Administrator remarks: “${application.adminRemarks}”`
                  : "Operating in standard compliance with City Government of Butuan municipal market vendor guidelines and zoning policies."}
              </p>
            </div>

            {/* Fixed Jurisdiction Policy Notice */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                The vendor registration portal is restricted to local businesses operating within the jurisdiction of the City Government of Butuan, Agusan del Norte. Fixed municipal jurisdiction rules cannot be altered.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
